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
CORS(app)

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

        if not email or not password:
            return jsonify({'message': 'Email and Password are required'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'message': 'Email already exists'}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        users_collection.insert_one({'email': email, 'password': hashed_password})

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

        # Validate user credentials
        user = users_collection.find_one({'email': email})
        if not user or not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid credentials'}), 401

        # Generate JWT token
        try:
            token = jwt.encode(
                {
                    'email': email,
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                },
                SECRET_KEY,
                algorithm='HS256'
            )
            token = token if isinstance(token, str) else token.decode('utf-8')  # Ensure token is string
        except Exception as e:
            return jsonify({'message': f'Error generating token: {str(e)}'}), 500

        return jsonify({'token': token, 'message': 'Login successful'}), 200
    except Exception as e:
        return jsonify({'message': f'Unexpected error: {str(e)}'}), 500

# Protected dashboard route
@app.route('/dashboard', methods=['GET'])
def dashboard():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        token = token.split()[1]
        
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        email = data['email']
        user = users_collection.find_one({'email': data['email']})
        files = list(files_collection.find({'email': email}, {'data': 0}))
        for file in files:
           file['_id'] = str(file['_id'])
        if not user:
            return jsonify({'message': 'User not found'}), 404
        # files = list(files_collection.find({'email': email}, {'data': 0}))
        # for file in files:
        #    file['_id'] = str(file['_id'])



        return jsonify({
            'username': user['username'],
            # 'history': history,
            'files': files
        }), 200
        return jsonify({'message': 'Welcome to the dashboard!'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500


@app.route('/upload', methods=['POST'])
def upload_file():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing'}), 401

    try:
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
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
# History save karne ke liye ek sample route
@app.route('/save-history', methods=['POST'])
def save_history():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = data['email']
        # history_data = request.get_json()
        # history_data['email'] = email
        # history_collection.insert_one(history_data)
        return jsonify({'message': 'History saved successfully'}), 201
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

@app.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = data['email']

        # File ko MongoDB se fetch karo
        file = files_collection.find_one({'_id': ObjectId(file_id), 'email': email})
        if not file:
            return jsonify({'message': 'File not found or you do not have access'}), 404

        # Binary data ko file ke roop mein serve karo
        return send_file(
            io.BytesIO(file['data']),
            download_name=file['filename'],
            as_attachment=True
        )
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=False)  # Disable auto-reload by setting debug=False