from flask import Flask, jsonify, request, render_template 
import mysql.connector
from mysql.connector import Error
from flask_bcrypt import Bcrypt 

app = Flask(__name__)
bcrypt = Bcrypt(app)

db_config = {
    'host': 'localhost',
    'user': 'root', 
    'password': '$pongyDB2005',
    'database': 'smart_hospital_db'
}

def create_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as err:
        print(f"Error: {err}")
        return None

@app.route('/')
def index():
    return render_template('index.html')
@app.route('/patient')
def patient_portal():
    return render_template('patient_portal.html')
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')
@app.route('/doctor/login')
def doctor_login_page():
    return render_template('doctor_login.html')

@app.route('/doctor/dashboard')
def doctor_dashboard_page():
    return render_template('doctor_dashboard.html')
@app.route('/booking')
def booking_page():
    return render_template('booking.html')

@app.route('/api/register/patient', methods=['POST'])
def register_patient():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    password = data.get('password')

    if not first_name or not last_name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    
    query = """
    INSERT INTO Patients (first_name, last_name, email, password_hash) 
    VALUES (%s, %s, %s, %s)
    """
    
    try:
        cursor.execute(query, (first_name, last_name, email, password_hash))
        conn.commit() 
        return jsonify({"message": "Patient registered successfully"}), 201
    
    except Error as err:
        if err.errno == 1062: 
            return jsonify({"error": "Email already exists"}), 409
        else:
            return jsonify({"error": str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/login/patient', methods=['POST'])
def login_patient():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True) 

    try:
        query = "SELECT * FROM Patients WHERE email = %s"
        cursor.execute(query, (email,))
        
        patient = cursor.fetchone() 

        if not patient:
            return jsonify({"error": "Invalid credentials"}), 401
        
        if bcrypt.check_password_hash(patient['password_hash'], password):
            return jsonify({
                "message": "Login successful",
                "patient_id": patient['patient_id'],
                "first_name": patient['first_name']
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Error as err:
        return jsonify({"error": str(err)}), 500
    
    finally:
        cursor.close()
        conn.close()


@app.route('/api/register/doctor', methods=['POST'])
def register_doctor():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    specialization = data.get('specialization')
    email = data.get('email')
    password = data.get('password')

    if not first_name or not last_name or not specialization or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    
    query = """
    INSERT INTO Doctors (first_name, last_name, specialization, email, password_hash) 
    VALUES (%s, %s, %s, %s, %s)
    """
    
    try:
        cursor.execute(query, (first_name, last_name, specialization, email, password_hash))
        conn.commit() 
        return jsonify({"message": "Doctor registered successfully"}), 201
    
    except Error as err:
        if err.errno == 1062: 
            return jsonify({"error": "Email already exists"}), 409
        else:
            return jsonify({"error": str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/login/doctor', methods=['POST'])
def login_doctor():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True) 

    try:
        query = "SELECT * FROM Doctors WHERE email = %s"
        cursor.execute(query, (email,))
        
        doctor = cursor.fetchone() 

        if not doctor:
            return jsonify({"error": "Invalid credentials"}), 401
        
        if bcrypt.check_password_hash(doctor['password_hash'], password):
            return jsonify({
                "message": "Login successful",
                "doctor_id": doctor['doctor_id'],
                "first_name": doctor['first_name'],
                "specialization": doctor['specialization']
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Error as err:
        return jsonify({"error": str(err)}), 500
    
    finally:
        cursor.close()
        conn.close()



@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    specialization = request.args.get('specialization')

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        if specialization:
            query = "SELECT doctor_id, first_name, last_name, specialization FROM Doctors WHERE specialization LIKE %s"
            search_term = f"%{specialization}%"
            cursor.execute(query, (search_term,))
        else:
            query = "SELECT doctor_id, first_name, last_name, specialization FROM Doctors"
            cursor.execute(query)
            
        doctors = cursor.fetchall()
        
        return jsonify(doctors), 200

    except Error as err:
        return jsonify({"error": str(err)}), 500
    
    finally:
        cursor.close()
        conn.close()

@app.route('/api/appointments/book', methods=['POST'])
def book_appointment():
    data = request.get_json()
    patient_id = data.get('patient_id')
    doctor_id = data.get('doctor_id')
    appointment_time = data.get('appointment_time')

    if not patient_id or not doctor_id or not appointment_time:
        return jsonify({"error": "patient_id, doctor_id, and appointment_time are required"}), 400

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    
    query = """
    INSERT INTO Appointments (patient_id, doctor_id, appointment_time, status) 
    VALUES (%s, %s, %s, 'Scheduled')
    """
    
    try:
        cursor.execute(query, (patient_id, doctor_id, appointment_time))
        conn.commit() 
        return jsonify({"message": "Appointment booked successfully"}), 201
    
    except Error as err:
        if err.errno == 1062: 
            return jsonify({"error": "This time slot is unavailable. Please choose another time."}), 409
        else:
            return jsonify({"error": str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/patients/<int:patient_id>/appointments', methods=['GET'])
def get_patient_appointments(patient_id):
    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT * FROM v_PatientAppointments WHERE patient_id = %s ORDER BY appointment_time DESC
        """
        
        cursor.execute(query, (patient_id,))
        appointments = cursor.fetchall()
        
        return jsonify(appointments), 200

    except Error as err:
        return jsonify({"error": str(err)}), 500
    
    finally:
        cursor.close()
        conn.close()

@app.route('/api/doctors/<int:doctor_id>/appointments', methods=['GET'])
def get_doctor_appointments(doctor_id):
    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT * FROM v_DoctorAppointments WHERE doctor_id = %s ORDER BY appointment_time ASC
        """
        
        cursor.execute(query, (doctor_id,))
        appointments = cursor.fetchall()
        
        return jsonify(appointments), 200

    except Error as err:
        return jsonify({"error": str(err)}), 500
    
    finally:
        cursor.close()
        conn.close()

@app.route('/api/appointments/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    data = request.get_json()
    status = data.get('status')
    visit_notes = data.get('visit_notes')

    if not status and not visit_notes:
        return jsonify({"error": "At least one field (status or visit_notes) is required"}), 400

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    
    try:
        query_parts = []
        params = []
        
        if status:
            query_parts.append("status = %s")
            params.append(status)
            
        if visit_notes:
            query_parts.append("visit_notes = %s")
            params.append(visit_notes)
            
        params.append(appointment_id)
        
        query = f"UPDATE Appointments SET {', '.join(query_parts)} WHERE appointment_id = %s"
        
        cursor.execute(query, tuple(params))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"error": "Appointment not found or no changes made"}), 404
            
        return jsonify({"message": "Appointment updated successfully"}), 200

    except Error as err:
        return jsonify({"error": str(err)}), 500
    
    finally:
        cursor.close()
        conn.close()

@app.route('/api/prescriptions/issue', methods=['POST'])
def issue_prescription():
    data = request.get_json()
    appointment_id = data.get('appointment_id')
    medication_name = data.get('medication_name')
    dosage = data.get('dosage')
    instructions = data.get('instructions')

    if not appointment_id or not medication_name or not dosage:
        return jsonify({"error": "appointment_id, medication_name, and dosage are required"}), 400

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    
    query = """
    INSERT INTO Prescriptions (appointment_id, medication_name, dosage, instructions) 
    VALUES (%s, %s, %s, %s)
    """
    
    try:
        cursor.execute(query, (appointment_id, medication_name, dosage, instructions))
        conn.commit() 
        return jsonify({"message": "Prescription issued successfully"}), 201
    
    except Error as err:
        if err.errno == 1452: 
            return jsonify({"error": "Invalid appointment_id"}), 400
        else:
            return jsonify({"error": str(err)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/patients/<int:patient_id>/prescriptions', methods=['GET'])
def get_patient_prescriptions(patient_id):
    
    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT 
                pres.prescription_id, 
                pres.medication_name,
                pres.dosage,
                pres.instructions,
                pres.is_ordered, 
                app.appointment_time,
                doc.first_name AS doctor_first_name,
                doc.last_name AS doctor_last_name
            FROM Prescriptions pres
            JOIN Appointments app ON pres.appointment_id = app.appointment_id
            JOIN Doctors doc ON app.doctor_id = doc.doctor_id
            WHERE app.patient_id = %s
            ORDER BY app.appointment_time DESC
        """
        
        cursor.execute(query, (patient_id,))
        prescriptions = cursor.fetchall()
        
        return jsonify(prescriptions), 200

    except Error as err:
        return jsonify({"error": str(err)}), 500
    
    finally:
        cursor.close()
        conn.close()

# ---
# 🚀 NEW CODE: CREATE PHARMACY ORDER
# ---
@app.route('/api/pharmacy/order', methods=['POST'])
def create_pharmacy_order():
    data = request.get_json()
    patient_id = data.get('patient_id')
    shipping_address = data.get('shipping_address')
    prescription_ids = data.get('prescription_ids')

    if not patient_id or not shipping_address or not prescription_ids:
        return jsonify({"error": "patient_id, shipping_address, and a list of prescription_ids are required"}), 400

    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()

    try:
        order_query = """
        INSERT INTO PharmacyOrders (patient_id, shipping_address, status) 
        VALUES (%s, %s, 'Pending')
        """
        cursor.execute(order_query, (patient_id, shipping_address))
        
        new_order_id = cursor.lastrowid 

        item_query = "INSERT INTO OrderItems (order_id, prescription_id) VALUES (%s, %s)"
        order_items = [(new_order_id, p_id) for p_id in prescription_ids]
        
        cursor.executemany(item_query, order_items) # executemany is efficient

        placeholders = ', '.join(['%s'] * len(prescription_ids))
        update_pres_query = f"UPDATE Prescriptions SET is_ordered = 'Yes' WHERE prescription_id IN ({placeholders})"
        
        cursor.execute(update_pres_query, tuple(prescription_ids))

        conn.commit()
        return jsonify({"message": "Order placed successfully!", "order_id": new_order_id}), 201

    except Error as err:
        conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        cursor.close()
        conn.close()

# ---
# 🚀 NEW CODE: GET PATIENT'S ORDER HISTORY
# ---
@app.route('/api/patients/<int:patient_id>/orders', methods=['GET'])
def get_patient_orders(patient_id):
    conn = create_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT 
                po.order_id,
                po.order_date,
                po.status,
                p.medication_name,
                p.dosage
            FROM PharmacyOrders po
            JOIN OrderItems oi ON po.order_id = oi.order_id
            JOIN Prescriptions p ON oi.prescription_id = p.prescription_id
            WHERE po.patient_id = %s
            ORDER BY po.order_date DESC, po.order_id DESC
        """
        cursor.execute(query, (patient_id,))
        
        orders = {}
        for row in cursor.fetchall():
            order_id = row['order_id']
            if order_id not in orders:
                orders[order_id] = {
                    "order_id": order_id,
                    "order_date": row['order_date'],
                    "status": row['status'],
                    "items": []
                }
            orders[order_id]['items'].append(
                f"{row['medication_name']} ({row['dosage']})"
            )
        
        return jsonify(list(orders.values())), 200

    except Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        cursor.close()
        conn.close()
        
if __name__ == '__main__':
    app.run(debug=True)