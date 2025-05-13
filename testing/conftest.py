"""
conftest.py - Shared pytest fixtures and configuration

This file contains shared fixtures that can be used across all test files,
including database setup/teardown, authentication helpers, and mocks for 
external services.
"""

import pytest
import json
import os
import sys
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Add the parent directory to the Python path so we can import app.py
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import from app
from app import app, get_db_connection

# For mail, we'll mock it instead of importing directly
mail_mock = MagicMock()
app.mail = mail_mock

@pytest.fixture(scope="session", autouse=True)
def verify_env_loaded():
    """Verify that environment variables are loaded before tests run."""
    from dotenv import load_dotenv
    load_dotenv()
    
    assert os.environ.get("AZURE_SQL_CONNECTIONSTRING") is not None, "Environment variables not loaded. Make sure to load .env file"
    assert os.environ.get("FLASK_SECRET_KEY") is not None, "FLASK_SECRET_KEY not found in environment"

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    with app.test_client() as client:
        yield client

@pytest.fixture
def unique_email():
    """Generate a unique email for testing."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
    return f"test_user_{timestamp}@example.com"

@pytest.fixture
def valid_user_data(unique_email):
    """Generate valid user data for registration."""
    return {
        "firstName": "Test",
        "lastName": "User",
        "email": unique_email,
        "password": "SecurePassword123!"
    }

@pytest.fixture
def registered_user(client, valid_user_data):
    """Create a registered user and return the user data."""
    response = client.post(
        '/api/register',
        data=json.dumps(valid_user_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    
    # Return the user data for login
    return valid_user_data

@pytest.fixture
def authenticated_client(client, registered_user):
    """Create an authenticated client session."""
    # Login
    response = client.post(
        '/api/login',
        data=json.dumps({
            "email": registered_user["email"],
            "password": registered_user["password"]
        }),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    
    # Extract user ID from response
    data = json.loads(response.data)
    user_id = data.get("userId")
    
    # Set session variables
    with client.session_transaction() as session:
        session['user_id'] = user_id
        session['user_email'] = registered_user["email"]
        session['user_name'] = registered_user["firstName"]
    
    return client

@pytest.fixture
def mock_mail():
    """Mock the mail sending functionality."""
    with patch('app.mail.send') as mock_send:
        mock_send.return_value = None
        yield mock_send

@pytest.fixture
def sample_job_data():
    """Generate sample job data for testing."""
    return {
        "title": "Software Developer",
        "company": "Tech Company",
        "type": "full-time",
        "location": "Remote",
        "description": "A great job opportunity",
        "tags": ["python", "flask", "sql"],
        "deadline": (datetime.now().date() + timedelta(days=30)).isoformat()
    }

@pytest.fixture
def created_job(authenticated_client, sample_job_data):
    """Create a job and return the job data with ID."""
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(sample_job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    
    # Return the job data with its ID
    return data.get("job")

@pytest.fixture
def mock_google_oauth():
    """Mock the Google OAuth flow."""
    with patch('app.google.authorized', return_value=True), \
         patch('app.google.get') as mock_get:
        
        # Set up the mock response
        mock_response = type('MockResponse', (), {
            'ok': True,
            'json': lambda self: {
                'email': 'oauth_test@example.com',
                'given_name': 'OAuth',
                'family_name': 'User'
            }
        })()
        
        mock_get.return_value = mock_response
        yield mock_get

@pytest.fixture
def db_cleanup():
    """Fixture to clean up test data from the database after tests."""
    # Yield control to the test
    yield
    
    # Clean up after the test
    test_emails = [
        'test_%', 
        'oauth_test%',
        '%@example.com'
    ]
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Delete test users' jobs first (foreign key constraint)
        for email_pattern in test_emails:
            cursor.execute("""
                DELETE FROM dbo.jobs 
                WHERE userId IN (
                    SELECT userId FROM dbo.accounts 
                    WHERE email LIKE ?
                )
            """, (email_pattern,))
        
        # Then delete the test users
        for email_pattern in test_emails:
            cursor.execute("DELETE FROM dbo.accounts WHERE email LIKE ?", (email_pattern,))
        
        conn.commit()

# Global setup and teardown
@pytest.fixture(scope="session", autouse=True)
def setup_teardown():
    """Setup before all tests and teardown after all tests."""
    # Setup
    print("\nPreparing test environment...")
    
    # Run tests
    yield
    
    # Teardown
    print("\nCleaning up test environment...")
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Clean up any remaining test data
        cursor.execute("""
            DELETE FROM dbo.jobs 
            WHERE userId IN (
                SELECT userId FROM dbo.accounts 
                WHERE email LIKE '%test%@example.com' OR email LIKE 'oauth_test%'
            )
        """)
        
        cursor.execute("DELETE FROM dbo.accounts WHERE email LIKE '%test%@example.com' OR email LIKE 'oauth_test%'")
        
        conn.commit()
    print("Test cleanup complete.")