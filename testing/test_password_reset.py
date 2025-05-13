"""
test_password_reset.py - Tests for password reset functionality

This script tests the password reset flow, including:
- Requesting a password reset
- Verifying token generation
- Resetting the password with a valid token
- Handling invalid tokens
"""

import pytest
import json
from flask import url_for
from app import app, get_db_connection, mail, s
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    with app.test_client() as client:
        yield client

@pytest.fixture
def create_test_user(client):
    """Create a test user for password reset tests."""
    user_data = {
        "firstName": "Reset",
        "lastName": "Tester",
        "email": "reset_test@example.com",
        "password": "ResetPassword123!"
    }
    
    # Delete the user if it already exists
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dbo.accounts WHERE email = ?", (user_data["email"],))
        conn.commit()
    
    # Create the user
    response = client.post(
        '/api/register',
        data=json.dumps(user_data),
        content_type='application/json'
    )
    
    return user_data

def test_forgot_password_page_loads(client):
    """Test that the forgot password page loads correctly."""
    response = client.get('/forgot-password')
    assert response.status_code == 200
    assert b'Reset Your Password' in response.data or b'Forgot Password' in response.data

@patch('app.mail.send')
def test_forgot_password_submission(mock_send, client, create_test_user):
    """Test submitting the forgot password form."""
    user_data = create_test_user
    
    # Test with valid email
    response = client.post(
        '/forgot-password',
        data={'email': user_data['email']}
    )
    
    # Should redirect to success page
    assert response.status_code == 200
    assert b'reset link' in response.data.lower() or b'check your email' in response.data.lower()
    
    # Verify email would have been sent
    assert mock_send.called

@patch('app.mail.send')
def test_forgot_password_nonexistent_email(mock_send, client):
    """Test forgot password with an email that doesn't exist."""
    response = client.post(
        '/forgot-password',
        data={'email': 'nonexistent@example.com'}
    )
    
    # Should still show success (for security)
    assert response.status_code == 200
    assert b'reset link' in response.data.lower() or b'check your email' in response.data.lower()
    
    # But no email should be sent
    assert not mock_send.called

def test_reset_password_page_with_valid_token(client, create_test_user):
    """Test the reset password page loads with a valid token."""
    user_data = create_test_user
    
    # Generate a valid token
    token = s.dumps(user_data['email'], salt='password-reset')
    
    response = client.get(f'/reset/{token}')
    
    assert response.status_code == 200
    assert b'new password' in response.data.lower() or b'reset password' in response.data.lower()

def test_reset_password_page_with_invalid_token(client):
    """Test the reset password page with an invalid token."""
    response = client.get('/reset/invalid-token')
    
    # Should redirect to signin with error
    assert response.status_code == 302
    assert 'signin' in response.location

def test_reset_password_with_valid_token(client, create_test_user):
    """Test resetting password with a valid token."""
    user_data = create_test_user
    
    # Generate a valid token
    token = s.dumps(user_data['email'], salt='password-reset')
    
    # Submit new password
    new_password = "NewPassword456!"
    response = client.post(
        f'/reset/{token}',
        data={'password': new_password},
        follow_redirects=True
    )
    
    assert response.status_code == 200
    assert b'password has been updated' in response.data.lower() or b'successfully' in response.data.lower()
    
    # Verify can login with new password
    login_response = client.post(
        '/api/login',
        data=json.dumps({
            "email": user_data["email"],
            "password": new_password
        }),
        content_type='application/json'
    )
    
    login_data = json.loads(login_response.data)
    assert login_response.status_code == 200
    assert login_data.get("message") == "Login successful"

def test_reset_password_weak_password(client, create_test_user):
    """Test resetting password with a weak password."""
    user_data = create_test_user
    
    # Generate a valid token
    token = s.dumps(user_data['email'], salt='password-reset')
    
    # Submit weak password
    weak_password = "short"
    response = client.post(
        f'/reset/{token}',
        data={'password': weak_password}
    )
    
    # Should stay on reset page with error
    assert response.status_code == 302  # Redirects back
    assert 'least 8 characters' in response.location.lower() or 'password' in response.location.lower()

def test_reset_password_expired_token(client, create_test_user):
    """Test resetting password with an expired token."""
    user_data = create_test_user
    
    # Create valid token but mock the loads function to simulate expiration
    token = s.dumps(user_data['email'], salt='password-reset')
    
    with patch('app.s.loads') as mock_loads:
        mock_loads.side_effect = Exception("Token expired")
        
        response = client.post(
            f'/reset/{token}',
            data={'password': 'ValidPassword123!'},
            follow_redirects=True
        )
    
    # Should redirect to signin with error
    assert response.status_code == 200
    assert b'invalid or has expired' in response.data.lower() or b'error' in response.data.lower()