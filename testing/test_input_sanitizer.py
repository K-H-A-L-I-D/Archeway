"""
test_input_sanitizer.py - Tests for input sanitization functions

This script verifies that input sanitization functions are working as expected.
Run this with pytest to test your sanitization implementations.
"""

import pytest
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import functions to test
from utils.input_sanitizer import (
    sanitize_string,
    sanitize_html,
    sanitize_email,
    sanitize_sql_param,
    sanitize_url,
    sanitize_filename,
    sanitize_search_query,
    sanitize_dict
)

class TestInputSanitizer:
    """Test suite for input sanitization functions"""
    
    def test_sanitize_string(self):
        """Test that HTML special characters are escaped"""
        # Test basic string
        assert sanitize_string("Hello World") == "Hello World"
        
        # Test with HTML content
        test_str = "<script>alert('XSS');</script>"
        expected = "&lt;script&gt;alert('XSS');&lt;/script&gt;"
        assert sanitize_string(test_str) == expected
        
        # Test with None
        assert sanitize_string(None) is None
        
        # Test with non-string types
        assert sanitize_string(123) == "123"
        
        # Test with whitespace that should be trimmed
        assert sanitize_string("  Hello  ") == "Hello"

    def test_sanitize_html(self):
        """Test HTML sanitization with and without allowing HTML tags"""
        # Test with allow_html=False (default)
        test_str = '<p>This is <b>bold</b> and <script>alert("XSS");</script></p>'
        expected = '&lt;p&gt;This is &lt;b&gt;bold&lt;/b&gt; and &lt;script&gt;alert("XSS");&lt;/script&gt;&lt;/p&gt;'
        assert sanitize_html(test_str) == expected
        
        # Test with allow_html=True (should strip dangerous tags but keep safe ones)
        expected_with_html = '<p>This is <b>bold</b> and </p>'
        assert sanitize_html(test_str, allow_html=True) == expected_with_html
        
        # Test with None
        assert sanitize_html(None) is None

    def test_sanitize_email(self):
        """Test email validation and sanitization"""
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

    def test_sanitize_sql_param(self):
        """Test SQL parameter sanitization"""
        # Test basic string
        assert sanitize_sql_param("Hello World") == "Hello World"
        
        # Test with SQL injection characters
        test_str = "' OR '1'='1"
        expected = " OR 1=1"
        assert sanitize_sql_param(test_str) == expected
        
        # Test with more complex SQL injection
        test_str = "user'; DROP TABLE users; --"
        expected = "user DROP TABLE users --"
        assert sanitize_sql_param(test_str) == expected
        
        # Test with None
        assert sanitize_sql_param(None) is None

    def test_sanitize_url(self):
        """Test URL sanitization"""
        # Test valid URLs
        assert sanitize_url("https://example.com") == "https://example.com"
        assert sanitize_url("http://sub.example.com/path?query=value") == "http://sub.example.com/path?query=value"
        
        # Test URL without scheme (should add https://)
        assert sanitize_url("example.com") == "https://example.com"
        
        # Test malicious URLs
        assert sanitize_url("javascript:alert('XSS')") is None
        assert sanitize_url("data:text/html,<script>alert('XSS')</script>") is None
        
        # Test with None
        assert sanitize_url(None) is None

    def test_sanitize_filename(self):
        """Test filename sanitization"""
        # Test basic filename
        assert sanitize_filename("document.txt") == "document.txt"
        
        # Test with path traversal attempt
        assert sanitize_filename("../../../etc/passwd") == "passwd"
        
        # Test with special characters
        assert sanitize_filename("file<with>special?chars*.txt") == "file_with_special_chars_.txt"
        
        # Test with None
        assert sanitize_filename(None) is None
        
        # Test with empty or dot-only filename
        assert sanitize_filename("") == "untitled"
        assert sanitize_filename(".") == "untitled"
        assert sanitize_filename("..") == "untitled"

    def test_sanitize_search_query(self):
        """Test search query sanitization"""
        # Test basic query
        assert sanitize_search_query("python tutorial") == "python tutorial"
        
        # Test with HTML/script tags
        test_query = "<script>alert('XSS');</script> search term"
        expected = "alert('XSS'); search term"
        assert sanitize_search_query(test_query) == expected
        
        # Test with SQL injection attempt
        test_query = "search term' OR '1'='1"
        expected = "search term OR 1=1"
        assert sanitize_search_query(test_query) == expected
        
        # Test with None
        assert sanitize_search_query(None) is None

    def test_sanitize_dict(self):
        """Test dictionary sanitization"""
        # Test with mixed content
        test_dict = {
            "name": "<script>alert('XSS');</script>",
            "description": "<p>This is <b>bold</b> content with <script>alert('XSS');</script></p>",
            "age": 25,
            "tags": ["<b>tag1</b>", "<script>alert('XSS');</script>"],
            "nested": {
                "key": "<i>value</i>"
            }
        }
        
        # Without HTML fields
        sanitized = sanitize_dict(test_dict)
        assert sanitized["name"] == "&lt;script&gt;alert('XSS');&lt;/script&gt;"
        assert sanitized["description"] == "&lt;p&gt;This is &lt;b&gt;bold&lt;/b&gt; content with &lt;script&gt;alert('XSS');&lt;/script&gt;&lt;/p&gt;"
        assert sanitized["age"] == 25  # Non-string values preserved
        assert sanitized["tags"][0] == "&lt;b&gt;tag1&lt;/b&gt;"
        assert sanitized["nested"]["key"] == "&lt;i&gt;value&lt;/i&gt;"
        
        # With HTML fields
        sanitized = sanitize_dict(test_dict, html_fields=["description"])
        assert sanitized["name"] == "&lt;script&gt;alert('XSS');&lt;/script&gt;"
        assert sanitized["description"] == "<p>This is <b>bold</b> content with </p>"  # Script tag removed
        assert sanitized["age"] == 25
        assert sanitized["tags"][0] == "&lt;b&gt;tag1&lt;/b&gt;"
        assert sanitized["nested"]["key"] == "&lt;i&gt;value&lt;/i&gt;"

        # Test with None
        assert sanitize_dict(None) == {}

if __name__ == "__main__":
    # Run tests when executed directly
    pytest.main(["-xvs", __file__])