# CS188 Final Project - Testing Guide

This document provides instructions for setting up and running the automated tests for the CS188 Final Project.

## Prerequisites

Before running the tests, ensure you have:

1. Python 3.8 or later installed
2. All required dependencies installed (see Installation section)
3. A valid `.env` file with necessary credentials (see `.env.example`)

## Installation

1. Clone the repository:
   ```bash
   git clone [your-repository-url]
   cd [repository-directory]
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install flask flask-bcrypt flask-session flask-dance flask-restful flask-wtf flask-limiter itsdangerous flask-mail pyodbc pytest pytest-flask python-dotenv bleach
   ```

4. Create a `.env` file with your credentials (use `.env.example` as a template)

## Test Structure

The automated tests are organized as follows:

### Core Tests
- `testing/test_basic.py` - Fundamental tests that don't require complex dependencies
  * Input sanitization (XSS protection)
  * Email validation
  * Password validation
  * Public route accessibility
  * User registration API
  * Email checking API

### Input Validation Tests
- `testing/test_input_sanitizer.py` - Tests for input validation utilities
  * String sanitization for XSS protection
  * HTML sanitization with and without allowed tags
  * Email format validation
  * SQL injection protection
  * URL validation and sanitization
  * Filename sanitization for path traversal protection
  * Search query sanitization
  * Dictionary content sanitization

### Authentication Tests
- `testing/test_app.py` - Core application tests
  * User registration (valid and invalid data)
  * Login functionality (valid and invalid credentials)
  * Email existence checking
  * Job management (CRUD operations)
  * Authentication requirements

- `testing/test_password_reset.py` - Password reset flow tests
  * Password reset request handling
  * Token generation and validation
  * Password update with valid tokens
  * Invalid token handling
  * Password strength validation

- `testing/test_google_oauth.py` - Google OAuth tests
  * OAuth flow initialization
  * Callback handling
  * New user creation from OAuth data
  * Existing user login via OAuth
  * Invalid OAuth data handling
  * Session management

### Security Tests
- `testing/test_security.py` - Security feature tests
  * Security headers verification
  * CSRF protection
  * Session cookie security settings
  * Rate limiting functionality
  * Session regeneration after login
  * API authentication requirements
  * Session clearing on logout
  * XSS protection
  * SQL injection protection

### Feature Tests
- `testing/test_job_validation.py` - Job data validation tests
  * Required field validation
  * XSS attack prevention in job data
  * Invalid date handling
  * Non-existent job access handling
  * Unauthorized job access prevention
  * Long input handling
  * Special character handling
  * SQL injection attempt handling
  * Concurrent operation handling

- `testing/test_email.py` - Email functionality tests
  * Welcome email sending
  * Password reset email sending
  * Email content validation
  * Failed email handling
  * Test email endpoint functionality
  * Email content security (XSS prevention)

## Running Tests

Start with the basic tests to ensure your setup is working correctly:

```bash
pytest testing/test_basic.py -v
```

### Run all tests:

```bash
pytest
```

### Run tests with verbose output:

```bash
pytest -v
```

### Run a specific test file:

```bash
pytest testing/test_app.py
```

### Run tests with coverage report:

```bash
pytest --cov=app
```

For an HTML coverage report:

```bash
pytest --cov=app --cov-report=html
```

This will create a `htmlcov` directory with coverage reports.

## Troubleshooting

### Common Issues:

1. **Module Import Errors**
   - Issue: Python can't find the `app` module
   - Solution: Make sure you have the `testing/__init__.py` file and run tests from the project root directory

2. **Missing Dependencies**
   - Issue: Import errors for Flask extensions
   - Solution: Install all required packages listed in the Installation section

3. **Database Connection Failed**
   - Issue: Tests can't connect to the database
   - Solution: Check that your connection string in `.env` is correct and the database server is accessible

4. **Authentication Errors**
   - Issue: OAuth-related tests fail
   - Solution: Tests are configured to mock OAuth. If you want to test with real OAuth, update the credentials in your `.env` file

## Test Files Explained

### test_basic.py
This file contains the fundamental tests that don't rely on complex dependencies. It tests:
- Input sanitization to prevent XSS and other attacks
- Email validation to ensure proper format
- Password validation to enforce security requirements
- Public route accessibility to ensure pages load correctly
- Registration API to verify user creation
- Email existence checking to validate unique accounts

### test_input_sanitizer.py
This file specifically tests the input sanitization utilities:
- String sanitization to escape HTML and prevent XSS
- HTML sanitization with allowed and disallowed tags
- Email validation for proper format
- SQL parameter sanitization to prevent SQL injection
- URL validation to prevent malicious URLs
- Filename sanitization to prevent path traversal
- Search query sanitization to prevent injection attacks
- Dictionary content sanitization for nested objects

### test_app.py
This file tests the core application functionality:
- User registration with valid and invalid data
- Login with correct and incorrect credentials
- Email existence checking
- Job management (create, read, update, delete)
- Authentication requirements for protected endpoints

### test_password_reset.py
This file tests the password reset flow:
- Password reset request handling
- Token generation and validation
- Password update with valid tokens
- Handling of invalid or expired tokens
- Validation of new password strength

### test_security.py
This file tests security features:
- Security headers to prevent common attacks
- CSRF protection to prevent cross-site request forgery
- Session cookie security settings
- Rate limiting to prevent brute force attacks
- Session regeneration after login to prevent session fixation
- API authentication requirements
- Session clearing on logout
- XSS protection in various contexts

### test_job_validation.py
This file tests job data validation:
- Required field validation
- XSS attack prevention in job data
- Invalid date format handling
- Non-existent job access attempts
- Unauthorized job access prevention
- Extremely long input handling
- Special character handling in job data
- SQL injection attempt prevention
- Concurrent operation handling

### test_google_oauth.py
This file tests the Google OAuth authentication flow:
- OAuth flow initialization
- Callback handling with valid data
- New user creation from OAuth data
- Existing user login via OAuth
- Invalid OAuth data handling
- Session management and security

### test_email.py
This file tests email functionality:
- Welcome email sending
- Password reset email sending
- Email content validation
- Failed email handling
- Test email endpoint functionality
- Email content security to prevent XSS

## Manual Testing

In addition to automated tests, manual testing is required for frontend functionality. Use the `Manual_Testing_Template.md` file to document your manual tests.

## Test Coverage Goals

The automated tests should aim to cover:
- All API endpoints (100%)
- All authentication flows (100%)
- Input validation and error handling (90%+)
- Database operations (90%+)
- Security features (80%+)

## Meeting Course Requirements

These tests fulfill the course requirements by:
1. Testing non-trivial functionality (authentication, job management, security features)
2. Verifying that the app handles unexpected input appropriately (invalid data, malicious inputs)
3. Confirming that the app provides appropriate responses (correct status codes, error messages)
4. Being runnable from a repository clone with proper setup