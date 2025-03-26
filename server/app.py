from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_cors import CORS

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)

# MongoDB connection (Local)
client = MongoClient('mongodb://localhost:27017/')
db = client['datamind']  # Database name
users_collection = db['users']  # Collection name

# Register route
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Basic validation
    if not username or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400

    # Check if username or email already exists
    if users_collection.find_one({'username': username}):
        return jsonify({'message': 'Username already exists'}), 400
    if users_collection.find_one({'email': email}):
        return jsonify({'message': 'Email already exists'}), 400

    # Hash the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create new user
    new_user = {
        'username': username,
        'email': email,
        'password': hashed_password
    }
    users_collection.insert_one(new_user)

    return jsonify({'message': 'User registered successfully'}), 201

if __name__ == '__main__':
    app.run(debug=True)
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_cors import CORS

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)

# MongoDB connection (Atlas)
# Replace <username>, <password>, and <dbname> with your Atlas credentials
connection_string = 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority'
client = MongoClient(connection_string)
db = client['datamind']  # Database name
users_collection = db['users']  # Collection name

# Register route
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Basic validation
    if not username or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400

    # Check if username or email already exists
    if users_collection.find_one({'username': username}):
        return jsonify({'message': 'Username already exists'}), 400
    if users_collection.find_one({'email': email}):
        return jsonify({'message': 'Email already exists'}), 400

    # Hash the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create new user
    new_user = {
        'username': username,
        'email': email,
        'password': hashed_password
    }
    users_collection.insert_one(new_user)

    return jsonify({'message': 'User registered successfully'}), 201

if __name__ == '__main__':
    app.run(debug=True)