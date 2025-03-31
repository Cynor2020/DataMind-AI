from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
import datetime

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['datamind']
users_collection = db['users']
# Secret Key for JWT (Store this in env variables in production)
SECRET_KEY = 'your-secret-key'

# Register route
# Register route
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')  # Add username field

        if not email or not password or not username:
            return jsonify({'message': 'Email, Password, and Username are required'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'message': 'Email already exists'}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        users_collection.insert_one({
            'email': email,
            'password': hashed_password,
            'username': username  # Store username in the database
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
        user = users_collection.find_one({'email': email})
        
        

        if not user:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({
            'username': user.get('username', 'User'),  # Return username, default to 'User' if not found
            
        }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=False)  # Disable auto-reload by setting debug=False