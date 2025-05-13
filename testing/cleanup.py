"""
cleanup.py - Utility script to clean up test data from the database

This script removes test user accounts and their associated data that may
have been created during testing. Run this if tests fail to clean up properly.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path so we can import app
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables first
from dotenv import load_dotenv
load_dotenv()

# Now try to import from app
try:
    from app import get_db_connection
except ImportError:
    print("ERROR: Could not import from app.py. Make sure you're running this from the project root.")
    sys.exit(1)

def cleanup_test_data():
    """Remove test data from the database."""
    print("Cleaning up test data...")
    
    # Patterns to match test data
    test_patterns = [
        '%test%@example.com',
        'oauth_test%',
        'reset_test%'
    ]
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get count of test users
            user_count = 0
            for pattern in test_patterns:
                cursor.execute("SELECT COUNT(*) FROM dbo.accounts WHERE email LIKE ?", (pattern,))
                user_count += cursor.fetchone()[0]
            
            print(f"Found {user_count} test user accounts")
            
            # Delete test users' jobs first (foreign key constraint)
            job_count = 0
            for pattern in test_patterns:
                cursor.execute("""
                    DELETE FROM dbo.jobs 
                    WHERE userId IN (
                        SELECT userId FROM dbo.accounts 
                        WHERE email LIKE ?
                    )
                """, (pattern,))
                job_count += cursor.rowcount
            
            print(f"Deleted {job_count} test jobs")
            
            # Then delete the test users
            deleted_users = 0
            for pattern in test_patterns:
                cursor.execute("DELETE FROM dbo.accounts WHERE email LIKE ?", (pattern,))
                deleted_users += cursor.rowcount
            
            print(f"Deleted {deleted_users} test user accounts")
            
            conn.commit()
            print("Cleanup complete!")
            
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    # Check if connection string is available
    if not os.environ.get("AZURE_SQL_CONNECTIONSTRING"):
        print("ERROR: AZURE_SQL_CONNECTIONSTRING environment variable not found.")
        print("Make sure you have a .env file with the necessary credentials.")
        sys.exit(1)
    
    # Run cleanup
    success = cleanup_test_data()
    
    if not success:
        print("Cleanup failed. Check error messages above.")
        sys.exit(1)