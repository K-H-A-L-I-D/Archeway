"""
input_sanitizer.py - Utilities for sanitizing user input in the Archeway application.
This module provides enhanced functions to sanitize different types of user input to prevent
common security vulnerabilities like SQL injection, XSS attacks, and more.
"""

import re
import os
import html
import urllib.parse
import bleach
from bleach.sanitizer import ALLOWED_TAGS, ALLOWED_ATTRIBUTES
from urllib.parse import quote, unquote, urlparse


# Configure Bleach with appropriate settings for our application
# Add additional HTML tags and attributes that are safe for our application
CUSTOM_ALLOWED_TAGS = ALLOWED_TAGS + ['p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code']
CUSTOM_ALLOWED_ATTRIBUTES = dict(ALLOWED_ATTRIBUTES)
CUSTOM_ALLOWED_ATTRIBUTES['a'] = ['href', 'title', 'rel', 'target']
CUSTOM_ALLOWED_ATTRIBUTES['img'] = ['src', 'alt', 'title', 'width', 'height']

# Configure allowed URL schemes for sanitizing URLs
ALLOWED_URL_SCHEMES = ['http', 'https', 'mailto', 'tel']


def sanitize_string(value):
    """
    Basic string sanitization that escapes HTML special characters.
    Use for simple text inputs where HTML is not expected or allowed.
    
    Args:
        value: The string value to sanitize
        
    Returns:
        Sanitized string with HTML special characters escaped
    """
    if value is None:
        return None
    
    # Convert to string if not already
    if not isinstance(value, str):
        value = str(value)
    
    # Escape HTML special characters
    return html.escape(value.strip())


def sanitize_html(value, allow_html=False):
    """
    Sanitize a string that may contain HTML content.
    If allow_html is True, it will keep safe HTML tags and attributes.
    Otherwise, it will escape all HTML.
    
    Args:
        value: The string value to sanitize
        allow_html: Whether to allow safe HTML tags
        
    Returns:
        Sanitized string with safe HTML if allowed, otherwise escaped HTML
    """
    if value is None:
        return None
    
    # Convert to string if not already
    if not isinstance(value, str):
        value = str(value)
    
    value = value.strip()
    
    if allow_html:
        # Use Bleach to allow only safe HTML tags and attributes
        return bleach.clean(
            value,
            tags=CUSTOM_ALLOWED_TAGS,
            attributes=CUSTOM_ALLOWED_ATTRIBUTES,
            strip=True
        )
    else:
        # Escape all HTML
        return html.escape(value)


def sanitize_email(value):
    """
    Sanitize and validate an email address.
    
    Args:
        value: The email address to sanitize
        
    Returns:
        Sanitized email address or None if invalid
    """
    if value is None:
        return None
    
    # Convert to string and trim whitespace
    if not isinstance(value, str):
        value = str(value)
    
    value = value.strip().lower()
    
    # RFC 5322 compliant email validation regex
    # This is more comprehensive than a basic check
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if re.match(email_pattern, value):
        return value
    
    return None


def sanitize_sql_param(value):
    """
    Sanitize a value to be used in a SQL query parameter.
    Note: Always use parameterized queries with pyodbc instead of string concatenation.
    This is an additional layer of protection.
    
    Args:
        value: The value to sanitize for SQL
        
    Returns:
        Sanitized value safe for SQL parameters
    """
    if value is None:
        return None
    
    # Convert to string if not already
    if not isinstance(value, str):
        value = str(value)
    
    # Remove characters that could be used in SQL injection
    return re.sub(r'[;\'"\\/]', '', value.strip())


def sanitize_url(value):
    """
    Sanitize a URL to prevent XSS and open redirect attacks.
    
    Args:
        value: The URL to sanitize
        
    Returns:
        Sanitized URL or None if invalid
    """
    if value is None:
        return None
    
    # Convert to string and trim whitespace
    if not isinstance(value, str):
        value = str(value)
    
    value = value.strip()
    
    # Parse URL to check scheme and components
    try:
        parsed_url = urlparse(value)
        
        # Ensure the URL has a scheme
        if not parsed_url.scheme:
            # If no scheme, add https:// by default
            value = 'https://' + value
            parsed_url = urlparse(value)
        
        # Check for valid scheme
        if parsed_url.scheme not in ALLOWED_URL_SCHEMES:
            return None
        
        # Ensure there's a valid hostname
        if not parsed_url.netloc:
            return None
        
        # Return the sanitized URL
        return value
        
    except Exception:
        return None


def sanitize_filename(value):
    """
    Sanitize a filename to prevent path traversal attacks.
    
    Args:
        value: The filename to sanitize
        
    Returns:
        Sanitized filename
    """
    if value is None:
        return None
    
    # Convert to string if not already
    if not isinstance(value, str):
        value = str(value)
    
    # Get the basename to prevent directory traversal
    basename = os.path.basename(value)
    
    # Remove any non-alphanumeric characters except for safe ones
    sanitized = re.sub(r'[^\w\-\.]', '_', basename).strip()
    
    # Ensure the filename is not empty or just dots
    if not sanitized or sanitized == '.' or sanitized == '..':
        return 'untitled'
    
    return sanitized


def sanitize_path(value):
    """
    Sanitize a file path to prevent path traversal attacks.
    
    Args:
        value: The file path to sanitize
        
    Returns:
        Sanitized path
    """
    if value is None:
        return None
    
    # Convert to string if not already
    if not isinstance(value, str):
        value = str(value)
    
    # Normalize the path to resolve '..', '.' etc.
    normalized_path = os.path.normpath(value)
    
    # Prevent path traversal by ensuring the path doesn't go up directories
    if normalized_path.startswith('..') or '/../' in normalized_path:
        return None
    
    return normalized_path


def sanitize_search_query(value):
    """
    Sanitize a search query to prevent injection attacks.
    
    Args:
        value: The search query to sanitize
        
    Returns:
        Sanitized search query
    """
    if value is None:
        return None
    
    # Convert to string if not already
    if not isinstance(value, str):
        value = str(value)
    
    # Remove special characters that could be used for injection
    sanitized = re.sub(r'[<>\'";]', '', value.strip())
    
    return sanitized


def sanitize_json_string(value):
    """
    Sanitize a string that will be included in JSON data.
    
    Args:
        value: The string to sanitize
        
    Returns:
        String safe for inclusion in JSON
    """
    if value is None:
        return None
    
    # Convert to string if not already
    if not isinstance(value, str):
        value = str(value)
    
    # Escape JSON control characters
    value = value.replace('\\', '\\\\')
    value = value.replace('"', '\\"')
    value = value.replace('\n', '\\n')
    value = value.replace('\r', '\\r')
    value = value.replace('\t', '\\t')
    value = value.replace('\b', '\\b')
    value = value.replace('\f', '\\f')
    
    return value


def sanitize_dict(data, html_fields=None):
    """
    Sanitize all string values in a dictionary.
    
    Args:
        data: Dictionary containing data to sanitize
        html_fields: List of field names where HTML is allowed
        
    Returns:
        Dictionary with sanitized values
    """
    if data is None:
        return {}
    
    if html_fields is None:
        html_fields = []
    
    sanitized = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            if key in html_fields:
                sanitized[key] = sanitize_html(value, allow_html=True)
            else:
                sanitized[key] = sanitize_string(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, html_fields)
        elif isinstance(value, (list, tuple)):
            sanitized[key] = [
                sanitize_dict(item, html_fields) if isinstance(item, dict)
                else sanitize_html(item, allow_html=True) if isinstance(item, str) and key in html_fields
                else sanitize_string(item) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            # Preserve non-string values (numbers, booleans, etc.)
            sanitized[key] = value
    
    return sanitized