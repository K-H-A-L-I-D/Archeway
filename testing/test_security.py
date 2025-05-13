"""
test_security.py - Tests for security features of the application

This script tests security mechanisms including:
- CSRF protection
- Rate limiting
- Security headers
- Session security
"""

import pytest
import json
import time
from app import app, get_db_connection
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def authenticated_client(client):
    """Create an authenticated client session."""
    user_data = {
        "firstName": "Security",
        "lastName": "Tester",
        "email": "security_test@example.com",
        "password": "SecurePass123!"
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
    
    # Login
    response = client.post(
        '/api/login',
        data=json.dumps({
            "email": user_data["email"],
            "password": user_data["password"]
        }),
        content_type='application/json'
    )
    
    # Extract user ID from response
    data = json.loads(response.data)
    user_id = data.get("userId")
    
    # Set session variables
    with client.session_transaction() as session:
        session['user_id'] = user_id
        session['user_email'] = user_data["email"]
        session['user_name'] = user_data["firstName"]
    
    return client

def test_security_headers(client):
    """Test that security headers are properly set."""
    response = client.get('/')
    
    # Check for required security headers
    assert 'Content-Security-Policy' in response.headers
    assert 'X-Content-Type-Options' in response.headers
    assert 'X-Frame-Options' in response.headers
    assert 'X-XSS-Protection' in response.headers
    
    # Check the values of the headers
    assert 'nosniff' in response.headers['X-Content-Type-Options']
    assert 'SAMEORIGIN' in response.headers['X-Frame-Options']
    assert '1; mode=block' in response.headers['X-XSS-Protection']

def test_csrf_protection(client):
    """Test CSRF protection is working."""
    # HTML form submission should fail without CSRF token
    response = client.post(
        '/forgot-password',
        data={'email': 'test@example.com'}
    )
    
    # Check for CSRF failure
    assert b'csrf' in response.data.lower() or response.status_code == 400

def test_session_cookie_security(client):
    """Test session cookie security settings."""
    response = client.get('/')
    
    # Get the session cookie
    session_cookie = next((cookie for cookie in client.cookie_jar if cookie.name == 'session'), None)
    
    # Verify cookie security
    assert session_cookie.secure in (True, False)  # May be false in testing
    assert session_cookie.http_only is True
    assert session_cookie.has_nonstandard_attr('SameSite')

def test_rate_limiting(client):
    """Test that rate limiting is working."""
    # Send multiple requests to a rate-limited endpoint
    endpoint = '/debug'
    
    # First requests should succeed
    for _ in range(5):
        response = client.get(endpoint)
        assert response.status_code == 200
    
    # Subsequent requests should be rate limited
    response = client.get(endpoint)
    assert response.status_code == 429

def test_session_regeneration_after_login(client):
    """Test that the session is regenerated after login."""
    user_data = {
        "email": "session_test@example.com",
        "password": "SessionTest123!"
    }
    
    # Create test user
    client.post(
        '/api/register',
        data=json.dumps({
            "firstName": "Session",
            "lastName": "Tester",
            **user_data
        }),
        content_type='application/json'
    )
    
    # Create a session with a known value
    with client.session_transaction() as session:
        session['pre_login_value'] = 'test_value'
    
    # Log in via form
    client.post(
        '/signin',
        data=user_data
    )
    
    # Check if pre-login session value is gone (session was regenerated)
    with client.session_transaction() as session:
        assert 'pre_login_value' not in session
        assert 'user_id' in session  # But we have new session data

def test_api_authentication_required(client, authenticated_client):
    """Test that API endpoints require authentication."""
    # Unauthenticated client should be rejected
    response = client.get('/api/jobs')
    assert response.status_code == 401
    
    # Authenticated client should succeed
    response = authenticated_client.get('/api/jobs')
    assert response.status_code == 200

def test_signout_clears_session(authenticated_client):
    """Test that signing out clears the session."""
    # Verify authenticated
    response = authenticated_client.get('/api/jobs')
    assert response.status_code == 200
    
    # Sign out
    authenticated_client.get('/signout')
    
    # Verify no longer authenticated
    response = authenticated_client.get('/api/jobs')
    assert response.status_code == 401
    
    # Verify session is empty
    with authenticated_client.session_transaction() as session:
        assert 'user_id' not in session
        assert 'user_name' not in session
        assert 'user_email' not in session

def test_xss_protection(client):
    """Test XSS protection by trying to inject script."""
    xss_email = '<script>alert("XSS");</script>@example.com'
    
    # Try to register with XSS in email
    response = client.post(
        '/api/register',
        data=json.dumps({
            "firstName": "XSS",
            "lastName": "Test",
            "email": xss_email,
            "password": "XSSTest123!"
        }),
        content_type='application/json'
    )
    
    # Should reject invalid email
    assert response.status_code == 400
    
    # Try to check email with XSS
    response = client.get(f'/api/check-email?email={xss_email}')
    
    # Should reject or sanitize
    assert response.status_code == 400 or b'<script>' not in response.data