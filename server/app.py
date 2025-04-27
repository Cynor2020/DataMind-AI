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

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['datamind']
users_collection = db['users']
files_collection = db['user_files']
analysis_collection = db['analysis_results']

# Secret Key for JWT (Store this in env variables in production)
SECRET_KEY = 'your-secret-key'
ALLOWED_EXTENSIONS = {'csv', 'txt', 'pdf'}

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

# Register route (unchanged)
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')

        if not email or not password or not username:
            return jsonify({'message': 'Email, Password, and Username are required'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'message': 'Email already exists'}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        users_collection.insert_one({
            'email': email,
            'password': hashed_password,
            'username': username
        })
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Login route (unchanged)
@app.route('/login', methods=['POST'])
def login():
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
        return jsonify({'message': f'Unexpected error: {str(e)}'}), 500

# Dashboard route (unchanged)
@app.route('/dashboard', methods=['GET'])
def dashboard():
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
            'message': 'Welcome to your dashboard'
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

# File upload route (unchanged)
@app.route('/upload', methods=['POST'])
def upload_file():
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

        return jsonify({'message': 'File uploaded successfully'}), 201
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError as e:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Files history route (unchanged)
@app.route('/files-history', methods=['GET'])
def files_history():
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
        return jsonify({'message': f'Error: {str(e)}'}), 500

@app.route('/current_files', methods=['GET'])
def current_files():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']

        # Fetch only the latest file, sorted by upload_date (descending)
        files = list(files_collection.find({'email': email}, {'data': 0}).sort('upload_date', -1).limit(1))
        for file in files:
            file['_id'] = str(file['_id'])
            file['upload_date'] = file['upload_date'].isoformat()

        return jsonify({'files': files, 'message': 'File history retrieved successfully'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Download route (unchanged)
@app.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
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
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        return response
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Analyze route (updated)
@app.route('/analyze/<file_id>', methods=['GET'])
def analyze_file(file_id):
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

        if file_doc['filetype'] != 'csv':
            return jsonify({'message': 'Only CSV files can be analyzed'}), 400

        # Debug: Print type and content of file_doc['data']
        print("Type of file_doc['data']:", type(file_doc['data']))
        print("file_doc['data']:", file_doc['data'][:100] if isinstance(file_doc['data'], (str, bytes)) else "Not a string or bytes")

        # Pass raw CSV data directly instead of using temporary file
        csv_data = file_doc['data'].decode('utf-8') if isinstance(file_doc['data'], bytes) else file_doc['data']
        print("CSV Data:", csv_data[:100])

        # Validate that csv_data is a string, not a dictionary
        if not isinstance(csv_data, str):
            return jsonify({'message': 'Invalid data format: Expected raw CSV data, got a dictionary or other type'}), 400

        print("Calling analyze_csv_with_ai...")
        results = analyze_csv_with_ai(csv_data)
        print("Results from analyze_csv_with_ai:", results)

        if 'error' in results:
            return jsonify({'message': results['error']}), 400

        # Convert numpy types to Python types before storing in MongoDB and returning
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

        # Use converted_results for plots conversion and response
        print("Converting plots to base64 URLs...")
        converted_results['plots'] = [f"data:image/png;base64,{plot['data']}" for plot in converted_results['plots']]

        return jsonify({
            'message': 'Analysis completed successfully',
            'results': converted_results,
            'analysis_id': analysis_id
        }), 200

    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({'message': f'Error: {str(e)}'}), 500

# CORS middleware (unchanged)
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

if __name__ == '__main__':
    app.run(debug=False)