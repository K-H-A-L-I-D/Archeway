# Archeway

A clean, interactive, and intuitive website to help you organize and track your job applications—no need for messy spreadsheets anymore.

## 🚀 Overview

**Archeway** is a modern web application built for students and industry professionals alike to manage their job search with ease. Designed as an alternative to traditional Excel trackers, this tool offers a more interactive experience, improved usability, and greater flexibility for users actively applying for internships, co-ops, or full-time positions.

Whether you're just getting started with applications or in the middle of interview rounds, Archeway makes it easy to keep tabs on:

- Jobs you've applied to  
- Application statuses  
- Important deadlines  
- Notes, links, and contacts  
- Custom tags for better organization

## 🌟 What is "Archeway"?

"Archeway" (pronounced AR-ch-EE-way) combines "arche," meaning "beginning" or "origin" in Greek, with "way," representing your path forward. Just as you walk through an arch to enter a new space, Archeway is your gateway to starting your career journey.

## ✨ Features

- **User Authentication**: Sign up with email or use Google OAuth
- **Job Management**: Add, update, and remove job applications
- **Status Tracking**: Track the progress of each application (Applied, Interview, Accepted, etc.)
- **Filtering & Search**: Quickly find specific applications
- **Tagging System**: Organize jobs with custom tags
- **Dark Mode**: Easy on the eyes, day or night
- **Responsive Design**: Works on desktop and mobile devices
- **Data Visualization**: See your application pipeline at a glance
- **Export Functionality**: Export application data as CSV or PDF files

## 💼 Why Archeway?

Archeway combines powerful tracking tools with smart job discovery to streamline your internship search process:

- **Application Tracking**: Never lose track of your applications. Keep detailed records of every internship you apply for, including status updates and important dates.
- **Smart Job Discovery**: Our job finder aggregates opportunities from multiple sources and uses your profile information to match you with relevant positions.
- **Progress Analytics**: Gain insights into your application success rates, interview performance, and overall progress toward securing your ideal internship.

## 🔧 Tech Stack

- **Frontend**: HTML, CSS, JavaScript with modern responsive design
- **Backend**: Flask (Python 3.12)
- **Database**: Azure SQL Database (via pyodbc)
- **Authentication**: Flask-BCrypt for password hashing, Google OAuth via Flask-Dance
- **API**: RESTful API with Flask-RESTful
- **Deployment**: Azure Web App ready

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.12+
- Microsoft ODBC Driver for SQL Server
- Node.js (for development tools)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/archeway.git
   cd archeway
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables in a `.env` file:
   ```
   FLASK_SECRET_KEY=your_secret_key
   AZURE_SQL_CONNECTIONSTRING=your_connection_string
   GOOGLE_OAUTH_CLIENT_ID=your_client_id
   GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
   ```

5. Run the application:
   ```bash
   python app.py
   ```

6. Visit `http://localhost:5000` in your browser

### Database Setup

If using Linux, install the Microsoft ODBC Driver:
```bash
./install.sh
```

## 🧪 Testing

Run the tests with:
```bash
pytest testing/test_app.py
```

## 🧠 Roadmap

- 🔄 Integration with Handshake API  
- 📊 Enhanced dashboard visualizations for application progress  
- 🔔 Email reminders for deadlines  
- 📝 Resume & cover letter storage  
- 📥 Auto-import applications from job platforms
- 📱 Native mobile applications
- 📈 Advanced analytics for application success rates

## 👥 Contributors

- [Coleman Pagac](https://github.com/cpagac)
- [Jordan Martin](https://github.com/jrdnmartin)
- [Khalid Mohammed](https://github.com/K-H-A-L-I-D)

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ to simplify your job hunt.