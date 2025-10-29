## Smart Hospital Management System

A minimal full-stack app for patients and doctors to manage appointments, prescriptions, and pharmacy orders — now with a modern UI theme and light/dark mode toggle.

### Features
- Patient registration and login
- Doctor login with appointment management
- Book appointments by doctor specialization
- Issue prescriptions (doctor)
- Patient dashboard: appointments, prescriptions, and pharmacy orders
- Place pharmacy orders from prescriptions
- Light/dark theme with persistent toggle

### Tech Stack
- Backend: Flask (Python), MySQL, bcrypt (password hashing)
- Frontend: HTML templates + Tailwind CDN + vanilla JS
- Styling: Custom modern CSS (`static/styles.css`) + theme toggle (`static/theme.js`)

---

## Getting Started

### Prerequisites
- Python 3.10+ recommended
- MySQL 8.x running locally
- PowerShell (Windows) or a terminal

### Clone
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### Python Environment
```bash
python -m venv .venv
.\.venv\Scripts\activate      # PowerShell (Windows)
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt  # If present, else:
pip install flask mysql-connector-python flask-bcrypt
```

### Database Setup
1. Create a database:
```sql
CREATE DATABASE smart_hospital_db;
```
2. Create tables and views (Patients, Doctors, Appointments, Prescriptions, PharmacyOrders, OrderItems) and helpful views:
   - `v_PatientAppointments`
   - `v_DoctorAppointments`

If you need, add seed data for `Doctors` to test booking.

### Configuration
App gets DB config directly in `app.py`:
- host: `localhost`
- user: `root`
- password: set your MySQL root password
- database: `smart_hospital_db`

Tip: For real projects, move secrets to environment variables.

### Run
```bash
python app.py
```
Open `http://127.0.0.1:5000`.

- Homepage: links to Patient and Doctor portals
- Patient: register/login → dashboard → book, view prescriptions, order
- Doctor: login → dashboard → manage appointments and issue prescriptions

---

## Theme and UI

- Global styles: `static/styles.css`
- Light/dark toggle: `static/theme.js`
  - Default: Light mode
  - Toggle persists in `localStorage`
  - Floating button on top-right of every page

---

## Project Structure
