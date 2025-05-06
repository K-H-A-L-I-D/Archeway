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
from datetime import datetime, date
import logging
from logging.handlers import RotatingFileHandler
from werkzeug.middleware.proxy_fix import ProxyFix


# Load environment variables
if "WEBSITE_HOSTNAME" not in os.environ:
    load_dotenv()

# Allow HTTP for developmentt
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")
flask_bcrypt = Bcrypt(app)

app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Set secure cookies in production
if "WEBSITE_HOSTNAME" in os.environ:
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['PREFERRED_URL_SCHEME'] = 'https'
else:
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['PREFERRED_URL_SCHEME'] = 'http'

app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
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

# Add debugging endpoint
@app.route("/debug")
def debug_info():
    return jsonify({
        "session": dict(session),
        "environ": {k: str(v) for k, v in request.environ.items() if isinstance(v, (str, bool, int, float))},
        "google_authorized": google.authorized if 'google' in globals() else False,
        "url_scheme": request.environ.get('wsgi.url_scheme'),
        "cookie_secure": app.config['SESSION_COOKIE_SECURE']
    })

@app.route("/login/google")
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

        session["user_email"] = user_info["email"]
        session["user_name"] = user_info.get("given_name", "User")

        with get_db_connection() as conn:
            cursor = conn.cursor()
            user = cursor.execute("SELECT userId FROM dbo.accounts WHERE email = ?", 
                                  (user_info["email"],)).fetchone()

            if user:
                session["user_id"] = user[0]
                cursor.execute("UPDATE dbo.accounts SET last_login = GETDATE() WHERE email = ?", 
                               (user_info["email"],))
            else:
                firstname = user_info.get("given_name", "")
                lastname = user_info.get("family_name", "")
                hashed_pw = flask_bcrypt.generate_password_hash("google_oauth_user").decode("utf-8")

                cursor.execute(
                    "INSERT INTO dbo.accounts (firstname, lastname, email, password) VALUES (?, ?, ?, ?)",
                    (firstname, lastname, user_info["email"], hashed_pw)
                )
                conn.commit()

                user_id = cursor.execute("SELECT userId FROM dbo.accounts WHERE email = ?", 
                                         (user_info["email"],)).fetchval()
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
def check_email():
    email = request.args.get("email")
    if not email:
        return {"message": "Missing email"}, 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        result = cursor.execute("SELECT 1 FROM dbo.accounts WHERE email = ?", (email,)).fetchone()
        cursor.close()

    return {"exists": bool(result)}, 200

# API endpoints
@addResource("/api/register")
class Register(Resource):
    def post(self):
        data = request.get_json()

        # Validate required fields
        for key in ["firstName", "lastName", "email", "password"]:
            if key not in data:
                return {"message": f"Missing required field: {key}"}, 400

        firstname = data.get("firstName")
        lastname = data.get("lastName")
        email = data.get("email")
        password = data.get("password")

        # Basic password validation
        if len(password) < 8:
            return {"message": "Password must be at least 8 characters long"}, 400

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
    def post(self):
        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

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

        required = ["title", "description"]
        if not all(key in data and data[key].strip() for key in required):
            return {"message": "Missing job title or description"}, 400

        # Process tags
        tags_raw = data.get('tags')
        if isinstance(tags_raw, list):
            tags_str = ','.join(tags_raw)
        elif isinstance(tags_raw, str):
            tags_str = tags_raw
        else:
            tags_str = ''

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO dbo.jobs (userId, title, company, location, jobType, description, notes, deadline, status, date_applied, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
            """, (
                user_id,
                data["title"],
                data.get("company"),
                data.get("location"),
                data.get("type") or data.get("jobType"),
                data["description"],
                tags_str,
                data.get("deadline"),
                data.get("status", "Saved"),
                data.get("date_applied") or datetime.now().isoformat()
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
    def put(self, job_id):
        data = request.get_json()

        # Process tags
        tags_raw = data.get('tags')
        if isinstance(tags_raw, list):
            tags_str = ','.join(tags_raw)
        elif isinstance(tags_raw, str):
            tags_str = tags_raw
        else:
            tags_str = ''

        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE dbo.jobs
                    SET title = ?, company = ?, location = ?, jobType = ?, description = ?, notes = ?, deadline = ?, status = ?, date_applied = ?
                    WHERE jobId = ?
                """, (
                    data["title"],
                    data.get("company"),
                    data.get("location"),
                    data.get("type") or data.get("jobType"),
                    data["description"],
                    tags_str,
                    data.get("deadline"),
                    data.get("status", "Saved"),
                    data.get("date_applied"),
                    job_id
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
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM dbo.jobs WHERE jobId = ?", (job_id,))
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
def signin():
    error = request.args.get('error')
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
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
                
                session['user_id'] = user_id
                session['user_name'] = firstname
                session['user_email'] = email
                
                return redirect(url_for('dashboard'))
        
        except Exception as e:
            app.logger.error(f"Login error: {e}")
            return render_template("signin.html", error=f"Server error: {str(e)}")
    
    return render_template("signin.html", error=error)

@app.after_request
def force_session_save(response):
    session.modified = True
    return response

if __name__ == "__main__":
    app.run(debug=True)