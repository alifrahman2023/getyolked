from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
import os
import jwt  # PyJWT
from functools import wraps
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# Use your secret key from .env; provide a default for testing purposes
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "defaultsecret")
# Set token expiration times
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
print("SECRET KEY IS:", app.config["JWT_SECRET_KEY"])

db = SQLAlchemy(app)

# Simple User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)

class DayWorkoutData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pushups = db.Column(db.Integer, nullable=False)
    # created_at is automatically set to the current UTC datetime when the record is created.
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    # Map this record to a user.
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


with app.app_context():
    db.create_all()



# Decorator to protect endpoints with an access token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing Authorization header"}), 401
        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format"}), 401
        token = parts[1]
        try:
            data = jwt.decode(token, app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.get(data["sub"])
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except Exception as e:
            return jsonify({"error": "Invalid token", "message": str(e)}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route("/workouts", methods=["POST"])
@token_required
def add_workout(current_user):
    data = request.get_json()
    pushups = data.get("pushups")
    if pushups is None:
        return jsonify({"error": "Pushups count is required"}), 400
    try:
        pushups = int(pushups)
    except ValueError:
        return jsonify({"error": "Pushups count must be an integer"}), 400

    workout = DayWorkoutData(pushups=pushups, user_id=current_user.id)
    db.session.add(workout)
    db.session.commit()

    return jsonify({
        "message": "Workout added",
        "workout": {
            "id": workout.id,
            "pushups": workout.pushups,
            "created_at": workout.created_at.isoformat()
        }
    })

# Endpoint to query for the days in a given month and year that the user worked out,
# returning the total number of pushups for each day.
@app.route("/workouts/monthly", methods=["GET"])
@token_required
def monthly_workouts(current_user):
    from sqlalchemy import func, extract, cast, Date

    # Expect query parameters "year" and "month" (e.g. ?year=2025&month=3)
    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)
    if not year or not month:
        return jsonify({"error": "Please provide 'year' and 'month' query parameters"}), 400

    # Query to count the number of workout instances per day
    results = db.session.query(
        cast(DayWorkoutData.created_at, Date).label("day"),
        func.count(DayWorkoutData.id).label("workout_count")  # Count instances per day
    ).filter(
        DayWorkoutData.user_id == current_user.id,
        extract("year", DayWorkoutData.created_at) == year,
        extract("month", DayWorkoutData.created_at) == month
    ).group_by("day").all()

    # Convert result to dictionary {day: workout_count}
    data = {day.day: workout_count for day, workout_count in results}

    return jsonify(data)
@app.route("/workouts/daily", methods=["GET"])
@token_required
def daily_pushups(current_user):
    from sqlalchemy import func, cast, Date

    # Expect a "date" query parameter in format "YYYY-M-D"
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "Please provide a 'date' query parameter"}), 400

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use 'YYYY-M-D'."}), 400

    # Query the sum of push-ups for the given date
    total_pushups = db.session.query(
        func.sum(DayWorkoutData.pushups)
    ).filter(
        DayWorkoutData.user_id == current_user.id,
        cast(DayWorkoutData.created_at, Date) == date
    ).scalar() or 0  # Return 0 if no push-ups are found

    return jsonify({"date": date_str, "total_pushups": total_pushups})    
# Helper function to generate access and refresh tokens
def generate_tokens(user):
    now = datetime.now(timezone.utc)
    access_payload = {
        "sub": str(user.id),
        "iat": now,
        "exp": now + app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    }
   
    access_token = jwt.encode(access_payload, app.config["JWT_SECRET_KEY"], algorithm="HS256")

    # Decode to string if necessary
    if isinstance(access_token, bytes):
        access_token = access_token.decode("utf-8")
   
    return access_token

def get_user_by_id(id):
    user =  User.query.get(id)
    return user

# Signup endpoint
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
    return jsonify({"message": "User created successfully"})

# Login endpoint that returns both access and refresh tokens
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or user.password != password:
        return jsonify({"message": "Invalid email or password"}), 401
    access_token = generate_tokens(user)
    return jsonify({
        "access_token": access_token,
        "message": "Login successful"
    })

# Refresh endpoint that accepts a refresh token in the JSON body
@app.route("/refresh", methods=["POST"])
def refresh():
    data = request.get_json()
    refresh_token = data.get("refresh")
    if not refresh_token:
        return jsonify({"error": "Missing refresh token"}), 401
    try:
        decoded = jwt.decode(refresh_token, app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
        user = User.query.get(decoded["sub"])
        if not user:
            return jsonify({"error": "User not found"}), 401
    except Exception as e:
        return jsonify({"error": "Invalid refresh token", "message": str(e)}), 401
    # Generate a new access token (keeping the same refresh token)
    now = datetime.now(timezone.utc)
    new_payload = {
        "sub": user.id,
        "iat": now,
        "exp": now + app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    }
    new_access_token = jwt.encode(new_payload, app.config["JWT_SECRET_KEY"], algorithm="HS256")
    if isinstance(new_access_token, bytes):
        new_access_token = new_access_token.decode("utf-8")
    return jsonify({"access_token": new_access_token, "refresh_token": refresh_token})

# A protected route example
@app.route("/protected", methods=["GET"])
@token_required
def protected(current_user):
    return jsonify({"message": f"Hello, user {current_user.id}!"})

# Example /api/predict endpoint protected with token_required
@app.route("/api/predict", methods=["POST"])
@token_required
def predict(current_user):
    # For demonstration, we decode the token again if needed.
    auth_header = request.headers.get("Authorization")
    parts = auth_header.split(" ")
    token = parts[1]
    try:
        decoded_token = jwt.decode(token, app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
    except Exception as e:
        return jsonify({"error": "Invalid token", "message": str(e)}), 401
    print("Decoded Token", decoded_token)
    user = get_user_by_id(decoded_token["sub"])
    return jsonify({"prediction": "your result here"})

# Optional: a simple chat endpoint (adjust as needed for your AI API)
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    if not user_input:
        return jsonify({"error": "No message provided"}), 400
    # For now, simply echo the input; replace with your AI logic as needed.
    return jsonify({"response": f"Echo: {user_input}"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
