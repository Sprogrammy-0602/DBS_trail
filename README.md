# Smart Hospital Management System

## Project Overview

Welcome to the **Smart Hospital Management System (HMS)** – a comprehensive full-stack web application designed to streamline healthcare operations. This system provides dedicated portals for patients and doctors, facilitating everything from appointment scheduling and doctor search to prescription management and pharmacy ordering. Built with **Flask (Python)** for the backend, **MySQL** for robust data storage, and a modern frontend using **HTML, CSS (Tailwind CSS)**, and **JavaScript**, the HMS ensures a secure, efficient, and user-friendly experience.

## Features

### Patient Portal
* **Secure Authentication:** Patient registration and login.
* **Doctor Search:** Find doctors by name or specialization using partial-match search.
* **Appointment Booking:** Schedule appointments with available doctors.
* **Dashboard:** View upcoming and past appointments.
* **Prescription History:** Access a detailed list of all issued prescriptions.
* **Pharmacy Ordering:** Order prescribed medications for home delivery directly from the dashboard.
* **Order History:** Track the status of placed pharmacy orders.

### Doctor Portal
* **Secure Authentication:** Doctor login.
* **Dashboard:** View personal appointment schedule, including patient details.
* **Appointment Management:** Update appointment status (e.g., "Completed") and add detailed visit notes.
* **Prescription Issuance:** Issue new prescriptions for patients during a visit.

### Backend & Database Features
* **RESTful API:** Clean and well-structured API endpoints for all functionalities.
* **Database Normalization:** Schema designed in Boyce-Codd Normal Form (BCNF) for data integrity and minimal redundancy.
* **Advanced SQL:**
    * **Database Trigger:** Prevents booking appointments in the past at the database level.
    * **Database Views:** Simplifies complex `JOIN` queries for dashboards, improving maintainability and security.
    * **Transactional Integrity:** Ensures atomicity for critical operations like pharmacy order placement, using `COMMIT` and `ROLLBACK`.
* **Password Hashing:** Uses `Flask-Bcrypt` for secure storage of user passwords.

## Technologies Used

* **Backend:** Python (Flask)
* **Database:** MySQL
* **Frontend:** HTML5, CSS3 (Tailwind CSS), JavaScript
* **Database Connector:** `mysql-connector-python`
* **Password Hashing:** `Flask-Bcrypt`

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

* Python 3.8+
* MySQL Server
* `pip` (Python package installer)

### 1. Database Setup

First, set up your MySQL database and tables.

1.  **Connect to MySQL:**
    ```bash
    mysql -u root -p
    # Enter your MySQL root password when prompted
    ```
2.  **Create Database and Schema:**
    Execute the following SQL commands to create the database, tables, and advanced features (triggers, views, indexes).

    ```sql
    CREATE DATABASE smart_hospital_db;
    USE smart_hospital_db;

    -- Patients Table
    CREATE TABLE Patients (
        patient_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(15),
        date_of_birth DATE,
        address TEXT
    );

    -- Doctors Table
    CREATE TABLE Doctors (
        doctor_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        specialization VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(15)
    );

    -- Appointments Table
    CREATE TABLE Appointments (
        appointment_id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT,
        doctor_id INT,
        appointment_time DATETIME NOT NULL,
        status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled' NOT NULL,
        visit_notes TEXT,
        
        FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
        FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id),
        
        UNIQUE(doctor_id, appointment_time) 
    );

    -- Prescriptions Table
    CREATE TABLE Prescriptions (
        prescription_id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT,
        medication_name VARCHAR(100) NOT NULL,
        dosage VARCHAR(50) NOT NULL,
        instructions TEXT,
        is_ordered ENUM('No', 'Yes') DEFAULT 'No',
        
        FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id)
    );

    -- PharmacyOrders Table
    CREATE TABLE PharmacyOrders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('Pending', 'Shipped', 'Delivered') DEFAULT 'Pending' NOT NULL,
        shipping_address TEXT,
        
        FOREIGN KEY (patient_id) REFERENCES Patients(patient_id)
    );

    -- OrderItems Table
    CREATE TABLE OrderItems (
        order_item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        prescription_id INT,
        
        FOREIGN KEY (order_id) REFERENCES PharmacyOrders(order_id),
        FOREIGN KEY (prescription_id) REFERENCES Prescriptions(prescription_id)
    );

    -- Indexes for performance
    CREATE INDEX idx_appt_patient ON Appointments (patient_id);
    CREATE INDEX idx_appt_doctor ON Appointments (doctor_id);
    CREATE INDEX idx_presc_appt ON Prescriptions (appointment_id);
    CREATE INDEX idx_item_order ON OrderItems (order_id);
    CREATE INDEX idx_item_presc ON OrderItems (prescription_id);

    -- Database Trigger
    DELIMITER $$
    CREATE TRIGGER trg_CheckAppointmentTime
    BEFORE INSERT ON Appointments
    FOR EACH ROW
    BEGIN
        IF NEW.appointment_time < NOW() THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot book an appointment in the past.';
        END IF;
    END$$
    DELIMITER ;

    -- Database Views
    CREATE VIEW v_PatientAppointments AS
    SELECT 
        app.appointment_id,
        app.appointment_time,
        app.status,
        app.patient_id,
        doc.first_name AS doctor_first_name,
        doc.last_name AS doctor_last_name,
        doc.specialization
    FROM Appointments app
    JOIN Doctors doc ON app.doctor_id = doc.doctor_id;

    CREATE VIEW v_DoctorAppointments AS
    SELECT 
        app.appointment_id,
        app.appointment_time,
        app.status,
        app.visit_notes,
        app.doctor_id,
        pat.first_name AS patient_first_name,
        pat.last_name AS patient_last_name,
        pat.email AS patient_email
    FROM Appointments app
    JOIN Patients pat ON app.patient_id = pat.patient_id;
    ```
    3.  **Update Database Credentials:**
    Edit the `db_config` dictionary in your `app.py` file to match your MySQL setup.
    ```python
    db_config = {
        'host': 'localhost',
        'user': 'root', 
        'password': 'YOUR_MYSQL_ROOT_PASSWORD', # <--- CHANGE THIS
        'database': 'smart_hospital_db'
    }
    ```

### 2. Backend Setup (Flask)

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/smart-hospital-management-system.git](https://github.com/your-username/smart-hospital-management-system.git)
    cd smart-hospital-management-system
    ```
2.  **Create a Virtual Environment (Recommended):**
    ```bash
    python -m venv venv
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  **Install Dependencies:**
    ```bash
    pip install Flask Flask-Bcrypt mysql-connector-python
    # Or if you have a requirements.txt already:
    # pip install -r requirements.txt
    ```
4.  **Run the Flask Application:**
    ```bash
    python app.py
    ```
    The application will typically run on `http://127.0.0.1:5000`.

### 3. Access the Application

Open your web browser and navigate to:
`http://127.0.0.1:5000`

## Database Seeding (Optional)

To quickly get started with sample data, you can use the following SQL inserts. (Adjust passwords if you prefer, but `docpass123` and `mypassword` are typically used with `bcrypt` in the app).

```sql
USE smart_hospital_db;

-- Insert Sample Doctors
INSERT INTO Doctors (first_name, last_name, specialization, email, password_hash) VALUES
('Saurabh', 'Agrawal', 'Cardiology', 'dr.agrawal@hospital.com', '$2b$12$EXAMPLEHASHFOR_docpass123'),
('Priya', 'Sharma', 'Dermatology', 'dr.sharma@hospital.com', '$2b$12$EXAMPLEHASHFOR_docpass123'),
('Amit', 'Singh', 'Pediatrics', 'dr.singh@hospital.com', '$2b$12$EXAMPLEHASHFOR_docpass123'),
('Nisha', 'Verma', 'Cardiology', 'dr.verma@hospital.com', '$2b$12$EXAMPLEHASHFOR_docpass123'),
('Rajesh', 'Kumar', 'Neurology', 'dr.kumar@hospital.com', '$2b$12$EXAMPLEHASHFOR_docpass123'),
('Anjali', 'Jain', 'Orthopedics', 'dr.jain@hospital.com', '$2b$12$EXAMPLEHASHFOR_docpass123'),
('Vikram', 'Mehta', 'General Medicine', 'dr.mehta@hospital.com', '$2b$12$EXAMPLEHASHFOR_docpass123');

-- Insert Sample Patients (you'll likely register these via the UI)
-- For patients, you might want to register them via the UI to get correct bcrypt hashes.
-- Or generate hashes for 'mypassword' if you want to insert directly.
-- Example: bcrypt.generate_password_hash('mypassword').decode('utf-8')
-- INSERT INTO Patients (first_name, last_name, email, password_hash) VALUES
-- ('Raghav', 'Kohli', 'raghav.k@email.com', '$2b$12$EXAMPLEHASHFOR_mypassword');
```


## Project Structure
<img width="700" height="500" alt="image" src="https://github.com/user-attachments/assets/fc4f8d3f-0111-44c6-8080-7f94d2486c83" />

  
