from flask import Flask, request, jsonify, send_file
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
import datetime
import io
from werkzeug.utils import secure_filename
from bson.objectid import ObjectId

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['datamind']
users_collection = db['users']
files_collection = db['user_files']

# Secret Key for JWT (Store this in env variables in production)
SECRET_KEY = 'your-secret-key'
ALLOWED_EXTENSIONS = {'csv', 'txt', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Register route
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

# Login route
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

# Dashboard route
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

# File upload route
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

# Files history route
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

# New download route
@app.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']

        # Fetch file from MongoDB
        file_doc = files_collection.find_one({'_id': ObjectId(file_id), 'email': email})
        if not file_doc:
            return jsonify({'message': 'File not found or you do not have access'}), 404

        # Serve the file
        file_data = io.BytesIO(file_doc['data'])
        return send_file(
            file_data,
            as_attachment=True,
            download_name=file_doc['filename'],
            mimetype='application/octet-stream'  # Adjust MIME type based on filetype if needed
        )
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=False)