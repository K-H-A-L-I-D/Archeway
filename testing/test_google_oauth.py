"""
test_google_oauth.py - Tests for Google OAuth authentication flow

This script tests the Google OAuth flow functionality:
- Login initiation
- Callback handling
- Session management
- User creation/login from OAuth data
"""

import pytest
import json
from app import app, get_db_connection
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_google_login_page(client):
    """Test that the Google login page loads and redirects properly."""
    response = client.get('/login/google')
    
    # Should redirect to Google's OAuth endpoint
    assert response.status_code == 302
    assert 'google.login' in response.location

@patch('app.google.get')
def test_oauth_callback_new_user(mock_get, client):
    """Test OAuth callback with a new user."""
    # Mock the Google API response for userinfo
    mock_response = MagicMock()
    mock_response.ok = True
    mock_response.json.return_value = {
        'email': 'oauth_test_new@example.com',
        'given_name': 'OAuth',
        'family_name': 'NewUser'
    }
    mock_get.return_value = mock_response
    
    # Delete the user if it already exists
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dbo.accounts WHERE email = ?", 
                      ('oauth_test_new@example.com',))
        conn.commit()
    
    # Set up session with token
    with client.session_transaction() as session:
        session['google_oauth_token'] = {'access_token': 'mock_token'}
    
    # Mock the send_welcome_email function to avoid actually sending emails
    with patch('app.send_welcome_email') as mock_send_email:
        mock_send_email.return_value = True
        
        # Call the callback endpoint
        response = client.get('/auth/callback')
        
        # Should redirect to dashboard
        assert response.status_code == 302
        assert 'dashboard' in response.location
        
        # Verify a welcome email would have been sent
        mock_send_email.assert_called_once()
    
    # Verify session contains user info
    with client.session_transaction() as session:
        assert 'user_id' in session
        assert session['user_email'] == 'oauth_test_new@example.com'
        assert session['user_name'] == 'OAuth'
    
    # Verify user was created in the database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        user = cursor.execute("SELECT userId, firstname, lastname FROM dbo.accounts WHERE email = ?", 
                             ('oauth_test_new@example.com',)).fetchone()
        
        assert user is not None
        assert user[1] == 'OAuth'
        assert user[2] == 'NewUser'

@patch('app.google.get')
def test_oauth_callback_existing_user(mock_get, client):
    """Test OAuth callback with an existing user."""
    # Create a user first
    user_data = {
        "firstName": "OAuth",
        "lastName": "ExistingUser",
        "email": "oauth_test_existing@example.com",
        "password": "OAuthTest123!"
    }
    
    client.post(
        '/api/register',
        data=json.dumps(user_data),
        content_type='application/json'
    )
    
    # Mock the Google API response
    mock_response = MagicMock()
    mock_response.ok = True
    mock_response.json.return_value = {
        'email': user_data['email'],
        'given_name': user_data['firstName'],
        'family_name': user_data['lastName']
    }
    mock_get.return_value = mock_response
    
    # Set up session with token
    with client.session_transaction() as session:
        session['google_oauth_token'] = {'access_token': 'mock_token'}
    
    # Call the callback endpoint
    response = client.get('/auth/callback')
    
    # Should redirect to dashboard
    assert response.status_code == 302
    assert 'dashboard' in response.location
    
    # Verify session contains user info
    with client.session_transaction() as session:
        assert 'user_id' in session
        assert session['user_email'] == user_data['email']
        assert session['user_name'] == user_data['firstName']

@patch('app.google.get')
def test_oauth_callback_invalid_email(mock_get, client):
    """Test OAuth callback with invalid email format."""
    # Mock the Google API response with invalid email
    mock_response = MagicMock()
    mock_response.ok = True
    mock_response.json.return_value = {
        'email': 'not-an-email',
        'given_name': 'Invalid',
        'family_name': 'Email'
    }
    mock_get.return_value = mock_response
    
    # Set up session with token
    with client.session_transaction() as session:
        session['google_oauth_token'] = {'access_token': 'mock_token'}
    
    # Call the callback endpoint
    response = client.get('/auth/callback')
    
    # Should redirect to signin with error
    assert response.status_code == 302
    assert 'signin' in response.location
    assert 'error' in response.location

@patch('app.google.get')
def test_oauth_callback_api_error(mock_get, client):
    """Test OAuth callback when Google API returns an error."""
    # Mock the Google API response failure
    mock_response = MagicMock()
    mock_response.ok = False
    mock_get.return_value = mock_response
    
    # Set up session with token
    with client.session_transaction() as session:
        session['google_oauth_token'] = {'access_token': 'mock_token'}
    
    # Call the callback endpoint
    response = client.get('/auth/callback')
    
    # Should redirect to signin
    assert response.status_code == 302
    assert 'signin' in response.location

def test_oauth_callback_no_token(client):
    """Test OAuth callback with no token in session."""
    # Clear session
    with client.session_transaction() as session:
        session.clear()
    
    # Call the callback endpoint
    response = client.get('/auth/callback')
    
    # Should redirect to signin
    assert response.status_code == 302
    assert 'signin' in response.location

@patch('app.google.get')
def test_oauth_callback_session_fixation_prevention(mock_get, client):
    """Test that the OAuth callback prevents session fixation."""
    # Mock the Google API response
    mock_response = MagicMock()
    mock_response.ok = True
    mock_response.json.return_value = {
        'email': 'oauth_test_session@example.com',
        'given_name': 'OAuth',
        'family_name': 'User'
    }
    mock_get.return_value = mock_response
    
    # Set up session with token and a canary value
    with client.session_transaction() as session:
        session['google_oauth_token'] = {'access_token': 'mock_token'}
        session['canary_value'] = 'should_be_removed'
    
    # Call the callback endpoint
    response = client.get('/auth/callback')
    
    # Verify session was regenerated (canary value should be gone)
    with client.session_transaction() as session:
        assert 'canary_value' not in session
        assert 'user_id' in session
        assert 'user_email' in session