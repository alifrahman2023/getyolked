from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from flask_cors import CORS
import datetime

app = Flask(__name__)




@app.route("/api/predict", methods=["POST"])
def predict():
    return jsonify({"prediction": "your result here"})

CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for frontend communication

# Database configuration (using SQLite for simplicity)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "asuh9273yhptiu5th2736oiuh76h3nrbuy2983"  # Change to a secure key
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=1)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)


# Create the database
with app.app_context():
    db.create_all()

# User Signup Route
@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400

    new_user = User(email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    return {"message": "User created successfully"}

# User Login Route
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or (password != user.password):
        return {"message": "Invalid email or password"}

    access_token = create_access_token(identity=user.id)
    return {"access_token": access_token, "message": "Login successful"}


@app.route("/refresh",methods=["POST"])
@jwt_required()
def refresh_token():
    user = get_jwt_identity()  
    access_token = create_access_token(identity=user.id)
    return {"access_token": access_token}

# Protected Route (Example)
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({"message": f"Hello, use {current_user}r!"}), 200

# Run the app
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
