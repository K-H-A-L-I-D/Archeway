"""
test_basic.py - Basic tests to verify the app works

This file contains basic tests for core functionality that
don't rely on external dependencies like mail or Google OAuth.
"""

import pytest
import json
import os
import sys

# Add the parent directory to the Python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, get_db_connection
from utils.input_sanitizer import sanitize_string, sanitize_email
from utils.password_validator import validate_password

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    with app.test_client() as client:
        yield client

# Basic tests for input sanitization
def test_sanitize_string():
    """Test that HTML special characters are escaped."""
    # Test basic string
    assert sanitize_string("Hello World") == "Hello World"
    
    # Test with HTML content
    test_str = "<script>alert('XSS');</script>"
    expected = "&lt;script&gt;alert('XSS');&lt;/script&gt;"
    assert sanitize_string(test_str) == expected
    
    # Test with none
    assert sanitize_string(None) is None
    
    # Test with non-string types
    assert sanitize_string(123) == "123"
    
    # Test with whitespace that should be trimmed
    assert sanitize_string("  Hello  ") == "Hello"

def test_sanitize_email():
    """Test email validation and sanitization."""
    # Test valid email addresses
    assert sanitize_email("user@example.com") == "user@example.com"
    assert sanitize_email("user.name+tag@example.co.uk") == "user.name+tag@example.co.uk"
    assert sanitize_email("  User@Example.COM  ") == "user@example.com"  # Should be trimmed and lowercased
    
    # Test invalid email addresses
    assert sanitize_email("not-an-email") is None
    assert sanitize_email("missing@domain") is None
    assert sanitize_email("@example.com") is None
    assert sanitize_email("user@.com") is None
    assert sanitize_email("user@exam ple.com") is None
    
    # Test with None
    assert sanitize_email(None) is None

def test_password_validator():
    """Test password validation."""
    # Test valid password
    is_valid, errors = validate_password("StrongPassword123!")
    assert is_valid is True
    assert len(errors) == 0
    
    # Test short password
    is_valid, errors = validate_password("short")
    assert is_valid is False
    assert "at least 8 characters" in errors[0]
    
    # Test password without uppercase
    is_valid, errors = validate_password("weakpassword123!")
    assert is_valid is False
    assert "uppercase" in errors[0]
    
    # Test password without lowercase
    is_valid, errors = validate_password("WEAKPASSWORD123!")
    assert is_valid is False
    assert "lowercase" in errors[0]
    
    # Test password without numbers
    is_valid, errors = validate_password("WeakPassword!")
    assert is_valid is False
    assert "number" in errors[0]
    
    # Test password without special characters
    is_valid, errors = validate_password("WeakPassword123")
    assert is_valid is False
    assert "special character" in errors[0]

# Test route accessibility (without authentication)
def test_public_routes(client):
    """Test that public routes are accessible."""
    # Main page
    response = client.get('/')
    assert response.status_code == 200
    
    # Login page
    response = client.get('/signin')
    assert response.status_code == 200
    
    # Register page
    response = client.get('/register')
    assert response.status_code == 200
    
    # About page
    response = client.get('/about')
    assert response.status_code == 200

# Test register API
def test_register_api(client):
    """Test the registration API."""
    import time
    unique_email = f"test_user_{int(time.time())}@example.com"
    
    user_data = {
        "firstName": "Test",
        "lastName": "User",
        "email": unique_email,
        "password": "SecurePassword123!"
    }
    
    response = client.post(
        '/api/register',
        data=json.dumps(user_data),
        content_type='application/json'
    )
    
    # Should succeed
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "message" in data
    assert "registered successfully" in data["message"]
    
    # Cleanup - delete the user
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dbo.accounts WHERE email = ?", (unique_email,))
        conn.commit()

# Test check email API
def test_check_email_api(client):
    """Test the check email API."""
    # First register a user
    import time
    unique_email = f"check_email_test_{int(time.time())}@example.com"
    
    user_data = {
        "firstName": "Email",
        "lastName": "Checker",
        "email": unique_email,
        "password": "SecurePassword123!"
    }
    
    client.post(
        '/api/register',
        data=json.dumps(user_data),
        content_type='application/json'
    )
    
    # Now check if the email exists
    response = client.get(f'/api/check-email?email={unique_email}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "exists" in data
    assert data["exists"] is True
    
    # Check a non-existent email
    response = client.get('/api/check-email?email=nonexistent@example.com')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "exists" in data
    assert data["exists"] is False
    
    # Cleanup
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dbo.accounts WHERE email = ?", (unique_email,))
        conn.commit()