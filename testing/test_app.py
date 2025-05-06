import pytest
import json
from app import app, get_db_connection
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

# Setup function to create a test user
@pytest.fixture
def create_test_user(client):
    """Create a test user for authentication tests."""
    user_data = {
        "firstName": "Test",
        "lastName": "User",
        "email": "testuser@example.com",
        "password": "testpassword123"
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

# Setup function to authenticate and get user credentials
@pytest.fixture
def authenticated_client(client, create_test_user):
    """Create an authenticated client session."""
    user_data = create_test_user
    
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

# Test user registration
def test_register_success(client):
    """Test successful user registration."""
    # Generate a unique email to avoid conflicts
    import time
    unique_email = f"test_{int(time.time())}@example.com"
    
    user_data = {
        "firstName": "John",
        "lastName": "Doe",
        "email": unique_email,
        "password": "securepassword123"
    }
    
    response = client.post(
        '/api/register',
        data=json.dumps(user_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "message" in data
    assert data["message"] == "User registered successfully"

def test_register_duplicate_email(client, create_test_user):
    """Test registration with an existing email."""
    user_data = create_test_user
    
    # Try to register with the same email
    response = client.post(
        '/api/register',
        data=json.dumps({
            "firstName": "Another",
            "lastName": "User",
            "email": user_data["email"],
            "password": "anotherpassword123"
        }),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "message" in data
    assert "already exists" in data["message"]

def test_register_invalid_data(client):
    """Test registration with invalid data (missing fields)."""
    # Missing password
    response = client.post(
        '/api/register',
        data=json.dumps({
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane.doe@example.com"
        }),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "message" in data
    assert "password" in data["message"].lower()

# Test login functionality
def test_login_success(client, create_test_user):
    """Test successful login."""
    user_data = create_test_user
    
    response = client.post(
        '/api/login',
        data=json.dumps({
            "email": user_data["email"],
            "password": user_data["password"]
        }),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "message" in data
    assert "userId" in data
    assert data["message"] == "Login successful"

def test_login_invalid_email(client):
    """Test login with invalid email."""
    response = client.post(
        '/api/login',
        data=json.dumps({
            "email": "nonexistent@example.com",
            "password": "anypassword"
        }),
        content_type='application/json'
    )
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert "message" in data
    assert "Invalid email or password" in data["message"]

def test_login_invalid_password(client, create_test_user):
    """Test login with invalid password."""
    user_data = create_test_user
    
    response = client.post(
        '/api/login',
        data=json.dumps({
            "email": user_data["email"],
            "password": "wrongpassword"
        }),
        content_type='application/json'
    )
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert "message" in data
    assert "Invalid email or password" in data["message"]

# Test email check functionality
def test_check_email_exists(client, create_test_user):
    """Test checking if an email exists."""
    user_data = create_test_user
    
    response = client.get(f'/api/check-email?email={user_data["email"]}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "exists" in data
    assert data["exists"] is True

def test_check_email_not_exists(client):
    """Test checking if a non-existent email exists."""
    response = client.get('/api/check-email?email=nonexistent@example.com')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "exists" in data
    assert data["exists"] is False

# Test job management
def test_create_job(authenticated_client):
    """Test creating a new job."""
    job_data = {
        "title": "Software Developer Intern",
        "company": "Tech Company",
        "type": "internship",
        "location": "Remote",
        "deadline": "2025-12-31",
        "description": "A great internship opportunity",
        "tags": "python,flask,sql"
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "message" in data
    assert "job" in data
    assert data["job"]["title"] == job_data["title"]
    
    # Return job ID for use in other tests
    return data["job"]["jobId"]

def test_get_jobs(authenticated_client, test_create_job):
    """Test getting all jobs for a user."""
    response = authenticated_client.get('/api/jobs')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) > 0
    
    # Check if the created job is in the list
    job_ids = [job["jobId"] for job in data]
    assert test_create_job in job_ids

def test_update_job(authenticated_client, test_create_job):
    """Test updating a job."""
    job_id = test_create_job
    
    updated_data = {
        "title": "Updated Job Title",
        "company": "Tech Company Updated",
        "type": "full-time",
        "location": "New York",
        "deadline": "2025-12-31",
        "description": "Updated description",
        "tags": "python,flask,sql,updated"
    }
    
    response = authenticated_client.put(
        f'/api/jobs/{job_id}',
        data=json.dumps(updated_data),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "message" in data
    assert "job" in data
    assert data["job"]["title"] == updated_data["title"]
    assert data["job"]["company"] == updated_data["company"]

def test_delete_job(authenticated_client, test_create_job):
    """Test deleting a job."""
    job_id = test_create_job
    
    response = authenticated_client.delete(f'/api/jobs/{job_id}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "message" in data
    assert "deleted" in data["message"].lower()
    
    # Verify the job is deleted
    response = authenticated_client.get('/api/jobs')
    data = json.loads(response.data)
    job_ids = [job["jobId"] for job in data]
    assert job_id not in job_ids

# Test error handling
def test_get_nonexistent_job(authenticated_client):
    """Test getting a job that doesn't exist."""
    # Use a very large ID that's unlikely to exist
    job_id = 999999
    
    response = authenticated_client.get(f'/api/jobs/{job_id}')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "message" in data
    assert "not found" in data["message"].lower()

def test_update_nonexistent_job(authenticated_client):
    """Test updating a job that doesn't exist."""
    job_id = 999999
    
    updated_data = {
        "title": "This Job Doesn't Exist",
        "description": "This should fail"
    }
    
    response = authenticated_client.put(
        f'/api/jobs/{job_id}',
        data=json.dumps(updated_data),
        content_type='application/json'
    )
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "message" in data
    assert "not found" in data["message"].lower()

def test_delete_nonexistent_job(authenticated_client):
    """Test deleting a job that doesn't exist."""
    job_id = 999999
    
    response = authenticated_client.delete(f'/api/jobs/{job_id}')
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "message" in data
    assert "not found" in data["message"].lower()

# Test authentication required endpoints
def test_jobs_endpoint_requires_auth(client):
    """Test that the jobs endpoint requires authentication."""
    response = client.get('/api/jobs')
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert "message" in data
    assert "unauthorized" in data["message"].lower()