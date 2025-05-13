"""
test_email.py - Tests for email functionality

This script tests email-related features including:
- Welcome email sending
- Password reset email sending
- Email content validation
"""

import pytest
import json
from app import app, get_db_connection, send_welcome_email, send_password_reset_email
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    with app.test_client() as client:
        yield client

@pytest.fixture
def test_user():
    """Create test user data."""
    return {
        "firstName": "Email",
        "lastName": "Tester",
        "email": "email_test@example.com",
        "password": "EmailTest123!"
    }

@patch('app.mail.send')
def test_send_welcome_email(mock_send, test_user):
    """Test sending welcome email."""
    result = send_welcome_email(test_user['email'], test_user['firstName'])
    
    assert result is True
    assert mock_send.called
    
    # Get the Message object
    message = mock_send.call_args[0][0]
    
    # Verify email content
    assert 'Welcome to Archeway' in message.subject
    assert test_user['email'] in message.recipients
    assert test_user['firstName'] in message.html
    assert 'Get started' in message.html

@patch('app.mail.send')
def test_failed_welcome_email(mock_send, test_user):
    """Test handling of failed email sending."""
    # Make mail.send raise an exception
    mock_send.side_effect = Exception("SMTP error")
    
    result = send_welcome_email(test_user['email'], test_user['firstName'])
    
    assert result is False
    assert mock_send.called

@patch('app.mail.send')
def test_send_password_reset_email(mock_send, test_user):
    """Test sending password reset email."""
    reset_link = 'https://example.com/reset/token123'
    
    result = send_password_reset_email(test_user['email'], test_user['firstName'], reset_link)
    
    assert result is True
    assert mock_send.called
    
    # Get the Message object
    message = mock_send.call_args[0][0]
    
    # Verify email content
    assert 'Reset' in message.subject
    assert test_user['email'] in message.recipients
    assert test_user['firstName'] in message.html
    assert reset_link in message.html

@patch('app.mail.send')
def test_send_test_email_endpoint(mock_send, client, test_user):
    """Test the send-test-email endpoint."""
    # Set up session
    with client.session_transaction() as session:
        session['user_id'] = 1
        session['user_email'] = test_user['email']
        session['user_name'] = test_user['firstName']
    
    # Call the endpoint
    response = client.get('/send-test-email', follow_redirects=True)
    
    assert response.status_code == 200
    assert mock_send.called
    assert b'email sent' in response.data.lower()

@patch('app.mail.send')
def test_registration_welcome_email(mock_send, client, test_user):
    """Test welcome email is sent after registration."""
    # Create a unique email to avoid conflicts
    import time
    test_user['email'] = f"welcome_test_{int(time.time())}@example.com"
    
    # Register user
    response = client.post(
        '/api/register',
        data=json.dumps(test_user),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    
    # Email sending is not directly tied to registration in the code,
    # but would happen in OAuth flow
    
    # Let's test the OAuth callback which should send welcome email
    with patch('app.google.get') as mock_get:
        # Mock the Google API response
        mock_response = MagicMock()
        mock_response.ok = True
        mock_response.json.return_value = {
            'email': test_user['email'],
            'given_name': test_user['firstName'],
            'family_name': test_user['lastName']
        }
        mock_get.return_value = mock_response
        
        # Set up OAuth token in session
        with client.session_transaction() as session:
            session['google_oauth_token'] = {'access_token': 'test_token'}
        
        # Call the callback endpoint
        response = client.get('/auth/callback')
        
        # Email should be sent for new users
        mock_send.assert_called()

@patch('app.mail.send')
def test_email_content_security(mock_send, test_user):
    """Test email content for security vulnerabilities."""
    # Test with potentially malicious input
    malicious_name = '<script>alert("XSS");</script>'
    
    result = send_welcome_email(test_user['email'], malicious_name)
    
    assert result is True
    assert mock_send.called
    
    # Get the Message object
    message = mock_send.call_args[0][0]
    
    # Check that HTML tags in name are escaped or removed
    assert '<script>' not in message.html
    assert 'alert("XSS")' not in message.html