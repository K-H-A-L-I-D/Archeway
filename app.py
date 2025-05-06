from flask import Flask, render_template, redirect, url_for, request, session, flash, jsonify
from flask_bcrypt import Bcrypt
from flask_session import Session
from flask_dance.consumer import oauth_authorized
from flask_dance.consumer.storage.session import SessionStorage
from flask_dance.contrib.google import make_google_blueprint, google
from flask_restful import Api, Resource
import os
import pyodbc
from dotenv import load_dotenv
from datetime import datetime, date, timedelta
import logging
from logging.handlers import RotatingFileHandler
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from utils.password_validator import validate_password
from utils.input_sanitizer import (
    sanitize_string, 
    sanitize_html, 
    sanitize_email, 
    sanitize_sql_param,
    sanitize_url,
    sanitize_search_query,
    sanitize_dict
)


# Load environment variables
if "WEBSITE_HOSTNAME" not in os.environ:
    load_dotenv()

# Allow HTTP for development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")
flask_bcrypt = Bcrypt(app)

# Fix for proxied requests
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# CSRF protection
csrf = CSRFProtect(app)
app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # 1 hour

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://"
)
limiter.init_app(app)


# Set secure cookies in production
if "WEBSITE_HOSTNAME" in os.environ:
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['PREFERRED_URL_SCHEME'] = 'https'
else:
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['PREFERRED_URL_SCHEME'] = 'http'

# Session security settings
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)
# Session(app)

CONNECTION_STRING = os.environ["AZURE_SQL_CONNECTIONSTRING"]
api = Api(app)

# Logging setup
handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=3)
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)

# Configure Google OAuth - updated configuration
google_bp = make_google_blueprint(
    client_id=os.getenv("GOOGLE_OAUTH_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_OAUTH_CLIENT_SECRET"),
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ],
    # Make sure this matches EXACTLY what's configured in Google Developer Console
    redirect_url="/auth/callback",
    storage=SessionStorage(key="google_oauth_token")
)

app.register_blueprint(google_bp, url_prefix="/login")

def get_db_connection():
    connection = pyodbc.connect(CONNECTION_STRING)
    return connection

# API Authentication middleware
@app.before_request
def check_api_auth():
    # Skip authentication for public endpoints
    public_endpoints = ['/api/login', '/api/register', '/api/check-email']
    
    # Require authentication for all other API endpoints
    if request.path.startswith('/api/') and request.path not in public_endpoints:
        if 'user_id' not in session:
            return jsonify({"message": "Unauthorized"}), 401

# Security headers middleware
@app.after_request
def add_security_headers(response):
    # Content Security Policy
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://cdnjs.cloudflare.com;"
    
    # Prevent browsers from interpreting files as a different MIME type
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Only allow being framed by the same origin
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    
    # Enable browser XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Enforce HTTPS (only in production)
    if "WEBSITE_HOSTNAME" in os.environ:  # Check if in production
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # Control browser features
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
    
    return response

# Session save middleware
@app.after_request
def force_session_save(response):
    session.modified = True
    return response

# Add debugging endpoint
@app.route("/debug")
@limiter.limit("5 per minute")
def debug_info():
    return jsonify({
        "session": dict(session),
        "environ": {k: str(v) for k, v in request.environ.items() if isinstance(v, (str, bool, int, float))},
        "google_authorized": google.authorized if 'google' in globals() else False,
        "url_scheme": request.environ.get('wsgi.url_scheme'),
        "cookie_secure": app.config['SESSION_COOKIE_SECURE']
    })

@app.route("/login/google")
@limiter.limit("5 per minute")
def google_login():
    app.logger.info("Starting Google login flow")
    
    # Set debug values in session
    session['login_timestamp'] = datetime.now().isoformat()
    session['request_scheme'] = request.environ.get('wsgi.url_scheme', 'unknown')
    
    # Force session to save
    session.modified = True
    
    app.logger.info(f"Login redirect URL: {url_for('google.login', _external=True)}")
    return redirect(url_for("google.login"))

@app.route("/auth/callback")
@limiter.limit("5 per minute")
def google_callback():
    print("✅ /auth/callback HIT")
    print("🧪 Session before:", dict(session))

    token = session.get("google_oauth_token")
    if not token or "access_token" not in token:
        print("❌ No token found")
        return redirect(url_for("signin"))

    try:
        resp = google.get("https://www.googleapis.com/oauth2/v2/userinfo")
        if not resp.ok:
            print("❌ Failed to get user info")
            return redirect(url_for("signin"))

        user_info = resp.json()
        print("👤 User info:", user_info)

        # Sanitize user info from Google
        email = sanitize_email(user_info.get("email"))
        if not email:
            print("❌ Invalid email from Google")
            return redirect(url_for("signin", error="Invalid email from Google OAuth"))
            
        firstname = sanitize_string(user_info.get("given_name", ""))
        lastname = sanitize_string(user_info.get("family_name", ""))

        # Regenerate session to prevent session fixation
        session.clear()
        
        # Set new session variables
        session["user_email"] = email
        session["user_name"] = firstname or "User"

        with get_db_connection() as conn:
            cursor = conn.cursor()
            user = cursor.execute("SELECT userId FROM dbo.accounts WHERE email = ?", 
                                  (email,)).fetchone()

            if user:
                session["user_id"] = user[0]
                cursor.execute("UPDATE dbo.accounts SET last_login = GETDATE() WHERE email = ?", 
                               (email,))
            else:
                hashed_pw = flask_bcrypt.generate_password_hash("google_oauth_user").decode("utf-8")

                cursor.execute(
                    "INSERT INTO dbo.accounts (firstname, lastname, email, password) VALUES (?, ?, ?, ?)",
                    (firstname, lastname, email, hashed_pw)
                )
                conn.commit()

                user_id = cursor.execute("SELECT userId FROM dbo.accounts WHERE email = ?", 
                                         (email,)).fetchval()
                session["user_id"] = user_id

            conn.commit()
        
        session.modified = True
        print("✅ Session after login:", dict(session))
        return redirect(url_for("dashboard"))

    except Exception as e:
        print("❌ Error during callback:", str(e))
        return redirect(url_for("signin"))

# Define addResource function
def addResource(route: str):
    def wrapper(cls, *args, **kwargs):
        cleaned = route.strip('/').replace('/', '_').replace('<', '').replace('>', '').replace(':', '')
        endpoint_name = f"{cls.__name__}_{cleaned}"
        api.add_resource(cls, route, *args, endpoint=endpoint_name, **kwargs)
        return cls
    return wrapper

# Routes
@app.route("/")
def index():
    return render_template("homepage.html")

@app.route('/dino')
@limiter.limit("5 per minute")
def dino_page():
    return render_template('dino.html')

@app.route('/about')
def about():
    return render_template('footer/about.html')

@app.route("/register")
def register():
    return render_template("register.html")

@app.route("/bugreport")
def bugreport():
    return render_template("forms/bugreportform.html")

@app.route("/testimonialform")
def testimonialform():
    return render_template("forms/testimonialform.html")    

@app.route("/dashboard")
def dashboard():
    if "user_name" not in session:
        return redirect(url_for("signin"))

    return render_template("dashboard.html", user_name=session["user_name"])

@app.route("/test-db")
@limiter.limit("5 per minute")
def test_db():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            return f"✅ DB connected, result: {result}"
    except Exception as e:
        return f"❌ DB connection failed: {str(e)}"


@app.route("/signout")
def signout():
    session.clear()
    return redirect(url_for("signin"))

@app.route("/api/check-email")
@limiter.limit("20 per minute")  # Higher limit for this less sensitive endpoint
def check_email():
    email = sanitize_email(request.args.get("email"))
    if not email:
        return {"message": "Invalid email format"}, 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        result = cursor.execute("SELECT 1 FROM dbo.accounts WHERE email = ?", (email,)).fetchone()
        cursor.close()

    return {"exists": bool(result)}, 200

# API endpoints
@addResource("/api/register")
class Register(Resource):
    decorators = [limiter.limit("5 per minute")]  # Limit registration attempts
    
    def post(self):
        data = request.get_json()

        # Validate required fields
        for key in ["firstName", "lastName", "email", "password"]:
            if key not in data:
                return {"message": f"Missing required field: {key}"}, 400

        # Validate password strength
        password = data.get("password")
        is_valid, errors = validate_password(password)
        if not is_valid:
            return {"message": errors[0]}, 400

        # Sanitize input
        firstname = sanitize_string(data.get("firstName"))
        lastname = sanitize_string(data.get("lastName"))
        email = sanitize_email(data.get("email"))
        # Don't sanitize password before hashing

        # Validate email format
        if not email:
            return {"message": "Invalid email format"}, 400

        # Connect to database
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Check if email already exists
            existing = cursor.execute("SELECT * FROM dbo.accounts WHERE email = ?", (email,)).fetchone()
            if existing:
                return {"message": "An account with this email already exists."}, 400

            # Hash password
            hashed_password = flask_bcrypt.generate_password_hash(password).decode("utf-8")

            try:
                cursor.execute(
                    "INSERT INTO dbo.accounts (firstname, lastname, email, password) VALUES (?, ?, ?, ?)",
                    (firstname, lastname, email, hashed_password)
                )
                conn.commit()
            except pyodbc.Error as e:
                return {"message": f"Database error: {str(e)}"}, 500
            finally:
                cursor.close()

        return {"message": "User registered successfully"}, 201
    
@addResource("/api/login")
class Login(Resource):
    decorators = [limiter.limit("5 per minute")]  # Limit login attempts
    
    def post(self):
        data = request.get_json()

        email = sanitize_email(data.get("email"))
        password = data.get("password")  # Don't sanitize password before verification

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        with get_db_connection() as conn:
            cursor = conn.cursor()
            user = cursor.execute("SELECT userId, firstname, password FROM dbo.accounts WHERE email = ?", (email,)).fetchone()

            if not user:
                return {"message": "Invalid email or password"}, 401

            user_id, firstname, hashed_password = user

            if not flask_bcrypt.check_password_hash(hashed_password, password):
                return {"message": "Invalid email or password"}, 401

            cursor.execute("UPDATE dbo.accounts SET last_login = GETDATE() WHERE email = ?", (email,))
            conn.commit()
            cursor.close()

        return {"message": "Login successful", "displayName": firstname, "userId": user_id}, 200

@addResource("/api/jobs")
class Jobs(Resource):
    decorators = [limiter.limit("20 per minute")]  # Higher limit for regular operations
    
    def get(self):
        if 'user_id' not in session:
            return {"message": "Unauthorized"}, 401
            
        user_id = session['user_id']
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            rows = cursor.execute("SELECT * FROM dbo.jobs WHERE userId = ?", (user_id,)).fetchall()
            columns = [column[0] for column in cursor.description]
            
            jobs = []
            for row in rows:
                job = dict(zip(columns, row))
                # Convert date fields
                for key, value in job.items():
                    if isinstance(value, (date, datetime)):
                        job[key] = value.isoformat()
                jobs.append(job)

            cursor.close()
        return jobs, 200

    def post(self):
        if 'user_id' not in session:
            return {"message": "Unauthorized"}, 401
            
        data = request.get_json()
        user_id = session['user_id']

        # Sanitize input data
        sanitized_data = sanitize_dict(data, html_fields=["description"])
        
        required = ["title", "description"]
        if not all(key in sanitized_data and sanitized_data[key].strip() for key in required):
            return {"message": "Missing job title or description"}, 400

        # Process tags
        tags_raw = sanitized_data.get('tags')
        if isinstance(tags_raw, list):
            # Sanitize each tag individually
            sanitized_tags = [sanitize_string(tag) for tag in tags_raw]
            tags_str = ','.join(tag for tag in sanitized_tags if tag)
        elif isinstance(tags_raw, str):
            tags_str = sanitize_string(tags_raw)
        else:
            tags_str = ''

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO dbo.jobs (userId, title, company, location, jobType, description, notes, deadline, status, date_applied, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
            """, (
                user_id,
                sanitized_data.get("title"),
                sanitized_data.get("company"),
                sanitized_data.get("location"),
                sanitized_data.get("type") or sanitized_data.get("jobType"),
                sanitized_data.get("description"),
                tags_str,
                sanitized_data.get("deadline"),
                sanitized_data.get("status", "Saved"),
                sanitized_data.get("date_applied") or datetime.now().isoformat()
            ))
            job_id = cursor.execute("SELECT @@IDENTITY").fetchval()
            conn.commit()
            
            job = cursor.execute("SELECT * FROM dbo.jobs WHERE jobId = ?", (job_id,)).fetchone()
            columns = [column[0] for column in cursor.description]
            job_data = dict(zip(columns, job))
            
            for key, value in job_data.items():
                if isinstance(value, (date, datetime)):
                    job_data[key] = value.isoformat()

            notes_value = job_data.get("notes") or ""
            job_data["tags"] = [tag.strip() for tag in notes_value.split(",") if tag.strip()]

            cursor.close()
        
        return {"message": "Job saved", "job": job_data}, 201

@addResource("/api/jobs/<int:job_id>")
class JobById(Resource):
    decorators = [limiter.limit("20 per minute")]  # Regular operations rate limit
    
    def put(self, job_id):
        if 'user_id' not in session:
            return {"message": "Unauthorized"}, 401
            
        user_id = session['user_id']
        data = request.get_json()
        
        # Sanitize input data
        sanitized_data = sanitize_dict(data, html_fields=["description"])

        # Process tags
        tags_raw = sanitized_data.get('tags')
        if isinstance(tags_raw, list):
            # Sanitize each tag individually
            sanitized_tags = [sanitize_string(tag) for tag in tags_raw]
            tags_str = ','.join(tag for tag in sanitized_tags if tag)
        elif isinstance(tags_raw, str):
            tags_str = sanitize_string(tags_raw)
        else:
            tags_str = ''

        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # First verify the job belongs to this user
                job_owner = cursor.execute(
                    "SELECT userId FROM dbo.jobs WHERE jobId = ?", (job_id,)
                ).fetchval()
                
                if job_owner != user_id:
                    return {"message": "Unauthorized access to this job"}, 403
                
                cursor.execute("""
                    UPDATE dbo.jobs
                    SET title = ?, company = ?, location = ?, jobType = ?, description = ?, notes = ?, deadline = ?, status = ?, date_applied = ?
                    WHERE jobId = ? AND userId = ?
                """, (
                    sanitized_data.get("title"),
                    sanitized_data.get("company"),
                    sanitized_data.get("location"),
                    sanitized_data.get("type") or sanitized_data.get("jobType"),
                    sanitized_data.get("description"),
                    tags_str,
                    sanitized_data.get("deadline"),
                    sanitized_data.get("status", "Saved"),
                    sanitized_data.get("date_applied"),
                    job_id,
                    user_id
                ))
                conn.commit()
                
                job = cursor.execute("SELECT * FROM dbo.jobs WHERE jobId = ?", (job_id,)).fetchone()
                if job:
                    columns = [column[0] for column in cursor.description]
                    job_data = dict(zip(columns, job))
                    
                    for key, value in job_data.items():
                        if isinstance(value, (date, datetime)):
                            job_data[key] = value.isoformat()
                    
                    notes_value = job_data.get("notes") or ""
                    job_data["tags"] = [tag.strip() for tag in notes_value.split(",") if tag.strip()]
                else:
                    job_data = None
                
                cursor.close()
                
            if job_data:
                return {"message": "Job updated", "job": job_data}, 200
            else:
                return {"message": "Job not found"}, 404

        except Exception as e:
            app.logger.error(f"Error updating job: {e}")
            return {"message": f"Server error: {str(e)}"}, 500

    def delete(self, job_id):
        if 'user_id' not in session:
            return {"message": "Unauthorized"}, 401
            
        user_id = session['user_id']
        
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # First verify the job belongs to this user
                job_owner = cursor.execute(
                    "SELECT userId FROM dbo.jobs WHERE jobId = ?", (job_id,)
                ).fetchval()
                
                if job_owner != user_id:
                    return {"message": "Unauthorized access to this job"}, 403
                
                cursor.execute("DELETE FROM dbo.jobs WHERE jobId = ? AND userId = ?", (job_id, user_id))
                rows_affected = cursor.rowcount
                conn.commit()
                cursor.close()
                
            if rows_affected > 0:
                return {"message": "Job deleted successfully"}, 200
            else:
                return {"message": "Job not found"}, 404

        except Exception as e:
            app.logger.error(f"Error deleting job: {e}")
            return {"message": f"Server error: {str(e)}"}, 500

@app.route("/signin", methods=['GET', 'POST'])
@limiter.limit("5 per minute", methods=["POST"])  # Limit only on POST requests
def signin():
    error = request.args.get('error')
    
    if request.method == 'POST':
        email = sanitize_email(request.form.get('email'))
        password = request.form.get('password')  # Don't sanitize password
        
        if not email or not password:
            return render_template("signin.html", error="Email and password are required")
        
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                user = cursor.execute("SELECT userId, firstname, password FROM dbo.accounts WHERE email = ?", 
                                     (email,)).fetchone()
                
                if not user:
                    return render_template("signin.html", error="Invalid email or password")
                
                user_id, firstname, hashed_password = user
                
                if not flask_bcrypt.check_password_hash(hashed_password, password):
                    return render_template("signin.html", error="Invalid email or password")
                
                cursor.execute("UPDATE dbo.accounts SET last_login = GETDATE() WHERE email = ?", (email,))
                conn.commit()
                cursor.close()
                
                # Regenerate session to prevent session fixation
                session.clear()
                
                # Set new session variables
                session['user_id'] = user_id
                session['user_name'] = sanitize_string(firstname)
                session['user_email'] = email
                
                return redirect(url_for('dashboard'))
        
        except Exception as e:
            app.logger.error(f"Login error: {e}")
            return render_template("signin.html", error=f"Server error: {str(e)}")
    
    return render_template("signin.html", error=error)

if __name__ == "__main__":
    app.run(debug=True)