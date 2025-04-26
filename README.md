# BITS Pilani Pawnshop (Public Version)

A Django-based web platform for BITS Pilani students to buy and sell second-hand items easily within their campus community.

This is the **cleaned public version** of the project, excluding all sensitive data (like database files, media uploads, and secret keys).

---

## Features

- Google OAuth2 Login
- Add / Edit / Delete product listings
- Upload and manage multiple product images
- Category-based search and browsing
- Paginated listing views
- Mobile-responsive frontend design
- Feedback system for user experience
- Django Admin panel for superuser control
- Custom 404 and 500 error pages

---

## 🛠 Tech Stack

- **Backend**: Django (Python)
- **Frontend**: HTML, CSS, JavaScript (Django Templates)
- **Authentication**: Google OAuth2
- **Database**: SQLite (for development)

---

## ⚙️ Local Setup Instructions

Follow these steps to set up and run the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/MrBottleTree/Bits-Pilani-Store.git
cd Bits-Pilani-Store
```
---
### 2. Set up a Virtual environment
```bash
python -m venv env
source env/bin/activate   # On Linux/Mac
env\Scripts\activate      # On Windows
```
---
### 3. Install dependencies
```bash
pip install -r requirements.txt
```
---
### 4. Configure Environment Variables
Create a .env file in the project root with:
```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
```
OR set it temporarily
```bash
export GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id  # Linux/Mac
set GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id      # Windows
```
### You need to setup your Django secret keys by yourself (As it is not provided in the settings.py file by me)
---
### 5. Apply migrations
```bash
python manage.py makemigrations
python manage.py migrate
```
---
### 6. Create a superuser (for Admin Panel)
```bash
python manage.py createsuperuser
```
---
### 7. Run the development server
```bash
python manage.py runserver
```
---
### 8. Visit your local host and have fun!
```bash
http://127.0.0.1:8000/
```
---
## What's Not Included?
- Database files (db.sqlite3)
- User-uploaded media files
- Secrets like OAuth Client ID and AWS credentials

  (You have to set up these parts separately.)
---
## Made with ❤️ by BITSians, for BITSians
---
