from flask import Flask, request, jsonify, send_file
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
import datetime
import io
from werkzeug.utils import secure_filename
from bson.objectid import ObjectId
import os
from data_mind_ai_analysis_model import analyze_csv_with_ai
import numpy as np
import base64

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app, resources={
    r"/login": {"origins": "http://localhost:5173"},
    r"/register": {"origins": "http://localhost:5173"},
    r"/dashboard": {"origins": "http://localhost:5173"},
    r"/update-profile": {"origins": "http://localhost:5173"},
    r"/upload": {"origins": "http://localhost:5173"},
    r"/files-history": {"origins": "http://localhost:5173"},
    r"/download/*": {"origins": "http://localhost:5173"},  # Added back for download
    r"/delete/*": {"origins": "http://localhost:5173"},   # Already added for delete
    r"/current_files": {"origins": "http://localhost:5173"},
    r"/analyze/*": {"origins": "http://localhost:5173"},
    r"/file/*": {"origins": "http://localhost:5173"},
}, supports_credentials=True)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['datamind']
users_collection = db['users']
files_collection = db['user_files']
analysis_collection = db['analysis_results']

# Secret Key for JWT
SECRET_KEY = 'your-secret-key'
ALLOWED_EXTENSIONS = {'csv', 'txt', 'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to convert numpy types to Python types
def convert_numpy_types(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    return obj

# Register route with photo upload
@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        email = request.form.get('email')
        password = request.form.get('password')
        username = request.form.get('username')
        photo = request.files.get('photo')

        if not email or not password or not username:
            return jsonify({'message': 'Email, Password, and Username are required'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'message': 'Email already exists'}), 400

        photo_data = None
        if photo and allowed_file(photo.filename):
            photo_data = base64.b64encode(photo.read()).decode('utf-8')

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        users_collection.insert_one({
            'email': email,
            'password': hashed_password,
            'username': username,
            'photo': photo_data
        })
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"Register error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Login route
@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = users_collection.find_one({'email': email})
        if not user or not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid credentials'}), 401

        token = jwt.encode(
            {'email': email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)},
            SECRET_KEY,
            algorithm='HS256'
        )
        token = token if isinstance(token, str) else token.decode('utf-8')
        return jsonify({'token': token, 'message': 'Login successful'}), 200
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'message': f'Unexpected error: {str(e)}'}), 500

# Dashboard route - Return username and photo
@app.route('/dashboard', methods=['GET', 'OPTIONS'])
def dashboard():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']
        user = users_collection.find_one({'email': email})

        if not user:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({
            'username': user.get('username', 'User'),
            'email': user.get('email', ''),
            'photo': user.get('photo', None),
            'message': 'powered by cynor'
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Update Profile route
@app.route('/update-profile', methods=['PATCH', 'OPTIONS'])
def update_profile():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']
        user = users_collection.find_one({'email': email})

        if not user:
            return jsonify({'message': 'User not found'}), 404

        username = request.form.get('username')
        new_email = request.form.get('email')
        password = request.form.get('password')
        photo = request.files.get('photo')

        update_data = {}
        if username:
            update_data['username'] = username
        if new_email and new_email != email:
            if users_collection.find_one({'email': new_email}):
                return jsonify({'message': 'Email already exists'}), 400
            update_data['email'] = new_email
        if password:
            update_data['password'] = bcrypt.generate_password_hash(password).decode('utf-8')
        if photo and allowed_file(photo.filename):
            photo_data = base64.b64encode(photo.read()).decode('utf-8')
            update_data['photo'] = photo_data

        if not update_data:
            return jsonify({'message': 'No updates provided'}), 400

        users_collection.update_one({'email': email}, {'$set': update_data})

        if new_email and new_email != email:
            token = jwt.encode(
                {'email': new_email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)},
                SECRET_KEY,
                algorithm='HS256'
            )
            token = token if isinstance(token, str) else token.decode('utf-8')
            return jsonify({'message': 'Profile updated successfully', 'new_token': token}), 200

        return jsonify({'message': 'Profile updated successfully'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# File upload route
@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    token = request.headers.get('Authorization')
    if not token:
        print("No Authorization header provided")
        return jsonify({'message': 'Token is missing'}), 401

    try:
        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = data['email']

        if 'file' not in request.files:
            return jsonify({'message': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400

        if not allowed_file(file.filename):
            return jsonify({'message': 'File type not allowed. Only CSV, TXT, PDF permitted'}), 400

        filename = secure_filename(file.filename)
        file_data = file.read()
        filetype = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'unknown'

        file_doc = {
            'email': email,
            'filename': filename,
            'data': file_data,
            'filetype': filetype,
            'upload_date': datetime.datetime.utcnow()
        }
        files_collection.insert_one(file_doc)
        print(f"File uploaded successfully for email: {email}, filename: {filename}")
        return jsonify({'message': 'File uploaded successfully'}), 201
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError as e:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Files history route
@app.route('/files-history', methods=['GET', 'OPTIONS'])
def files_history():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']

        files = list(files_collection.find({'email': email}, {'data': 0}))
        for file in files:
            file['_id'] = str(file['_id'])
            file['upload_date'] = file['upload_date'].isoformat()

        return jsonify({'files': files, 'message': 'File history retrieved successfully'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Files history error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Download route
@app.route('/download/<file_id>', methods=['GET', 'OPTIONS'])
def download_file(file_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']

        file_doc = files_collection.find_one({'_id': ObjectId(file_id), 'email': email})
        if not file_doc:
            return jsonify({'message': 'File not found or you do not have access'}), 404

        file_data = io.BytesIO(file_doc['data'])
        response = send_file(
            file_data,
            as_attachment=True,
            download_name=file_doc['filename'],
            mimetype={'csv': 'text/csv', 'txt': 'text/plain', 'pdf': 'application/pdf'}.get(file_doc['filetype'], 'application/octet-stream')
        )
        return response
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Download error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Delete route
@app.route('/delete/<file_id>', methods=['DELETE', 'OPTIONS'])
def delete_file(file_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']

        # Check if the file exists and belongs to the user
        file_doc = files_collection.find_one({'_id': ObjectId(file_id), 'email': email})
        if not file_doc:
            return jsonify({'message': 'File not found or you do not have access'}), 404

        # Delete the file from the database
        files_collection.delete_one({'_id': ObjectId(file_id), 'email': email})

        return jsonify({'message': f'File {file_doc["filename"]} deleted successfully'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Delete error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@app.route('/current_files', methods=['GET', 'OPTIONS'])
def current_files():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        token = request.headers.get('Authorization')
        if not token:
            print("No token provided in current_files")
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']
        print(f"Fetching current file for email: {email}")

        files = list(files_collection.find({'email': email}, {'data': 0}).sort('upload_date', -1).limit(1))
        for file in files:
            file['_id'] = str(file['_id'])
            file['upload_date'] = file['upload_date'].isoformat()
        print(f"Current files response: {files}")

        return jsonify({'files': files, 'message': 'File history retrieved successfully'}), 200
    except jwt.ExpiredSignatureError:
        print("Token expired in current_files")
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        print("Invalid token in current_files")
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Current files error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Analyze route
@app.route('/analyze/<file_id>', methods=['GET', 'OPTIONS'])
def analyze_file(file_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        token = request.headers.get('Authorization')
        if not token:
            print("No token provided in analyze")
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']
        print(f"Analyzing file for email: {email}, file_id: {file_id}")

        file_doc = files_collection.find_one({'_id': ObjectId(file_id), 'email': email})
        if not file_doc:
            return jsonify({'message': 'File not found or you do not have access'}), 404

        if file_doc['filetype'] != 'csv':
            return jsonify({'message': 'Only CSV files can be analyzed'}), 400

        print("Type of file_doc['data']:", type(file_doc['data']))
        print("file_doc['data'] (first 100 chars):", file_doc['data'][:100] if isinstance(file_doc['data'], (str, bytes)) else "Not a string or bytes")

        csv_data = file_doc['data'].decode('utf-8') if isinstance(file_doc['data'], bytes) else file_doc['data']
        print("CSV Data (first 100 chars):", csv_data[:100])

        if not isinstance(csv_data, str):
            return jsonify({'message': 'Invalid data format: Expected raw CSV data, got a dictionary or other type'}), 400

        print("Calling analyze_csv_with_ai...")
        results = analyze_csv_with_ai(csv_data)
        print("Results from analyze_csv_with_ai:", results)

        if 'error' in results:
            return jsonify({'message': results['error']}), 400

        print("Converting numpy types in results...")
        converted_results = convert_numpy_types(results)

        analysis_doc = {
            'file_id': file_id,
            'email': email,
            'insights': converted_results['insights'],
            'predictions': converted_results['predictions'],
            'plots': converted_results['plots'],
            'created_at': datetime.datetime.utcnow()
        }
        print("Inserting into analysis_collection...")
        analysis_result = analysis_collection.insert_one(analysis_doc)
        analysis_id = str(analysis_result.inserted_id)

        print("Converting plots to base64 URLs...")
        converted_results['plots'] = [f"data:image/png;base64,{plot['data']}" for plot in converted_results['plots']]

        return jsonify({
            'message': 'Analysis completed successfully',
            'results': converted_results,
            'analysis_id': analysis_id
        }), 200
    except Exception as e:
        print(f"Analyze error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# New endpoint to fetch a specific file by ID
@app.route('/file/<file_id>', methods=['GET', 'OPTIONS'])
def get_file(file_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        token = request.headers.get('Authorization')
        if not token:
            print("No token provided in get_file")
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']
        print(f"Fetching file for email: {email}, file_id: {file_id}")

        file_doc = files_collection.find_one({'_id': ObjectId(file_id), 'email': email}, {'data': 0})
        if not file_doc:
            return jsonify({'message': 'File not found or you do not have access'}), 404

        file_doc['_id'] = str(file_doc['_id'])
        file_doc['upload_date'] = file_doc['upload_date'].isoformat()
        print(f"File response: {file_doc}")

        return jsonify({'file': file_doc, 'message': 'File retrieved successfully'}), 200
    except jwt.ExpiredSignatureError:
        print("Token expired in get_file")
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        print("Invalid token in get_file")
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        print(f"Get file error: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

# CORS middleware
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)