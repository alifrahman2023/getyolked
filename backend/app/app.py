from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
import os
import jwt  # PyJWT
from functools import wraps
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import boto3
from moviepy.editor import VideoFileClip
import tempfile
import subprocess
from sqlalchemy import cast, Date
#################################################################
############### Pushup up counter file ###########################
import hashlib
import numpy as np
import cv2
import mediapipe as mp
from sqlalchemy import func, cast, Date
import os
import tempfile
import subprocess

def convert_mov_to_mp4(temp_input_path, original_filename):
    print("Converting MOV to MP4...")

    # Ensure the input file exists
    if not os.path.exists(temp_input_path):
        raise FileNotFoundError(f"Input file not found: {temp_input_path}")

    final_ext = ".mp4"
    base_name = os.path.splitext(original_filename)[0]
    final_filename = base_name + final_ext

    # Generate a temporary output file path
    temp_output_path = tempfile.mktemp(suffix=final_ext)

    try:
        # Use ffmpeg to convert MOV to MP4
        conversion_cmd = [
            "ffmpeg", "-i", temp_input_path,
            "-c:v", "libx264", "-preset", "fast",
            "-c:a", "aac", "-strict", "experimental",
            "-y", temp_output_path
        ]
        
        # Run ffmpeg and capture output
        result = subprocess.run(conversion_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if result.returncode != 0:
            print("FFmpeg Error:", result.stderr)
            raise RuntimeError(f"FFmpeg conversion failed:\n{result.stderr}")

        print(f"Conversion successful: {temp_output_path}")
        return temp_output_path  # Return the new MP4 file path

    except Exception as e:
        print("Error during conversion:", e)
        raise

def compute_angle(a, b, c):
    """
    Computes the angle at point b given three points a, b, c.
    Points are (x, y) tuples.
    """
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def extract_joint_angles_from_frame(frame, pose_detector):
    """
    Processes a frame using MediaPipe Pose and extracts joint angles from the right side:
      - Right elbow angle: between right shoulder, right elbow, right wrist.
      - Right hip angle: between right shoulder, right hip, right ankle.
    Returns a list with these two angles.
    """
    # Convert frame from BGR to RGB
    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose_detector.process(image_rgb)
    
    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        
        # Right side landmarks:
        right_shoulder = (landmarks[12].x, landmarks[12].y)
        right_elbow    = (landmarks[14].x, landmarks[14].y)
        right_wrist    = (landmarks[16].x, landmarks[16].y)
        right_hip      = (landmarks[24].x, landmarks[24].y)
        right_ankle    = (landmarks[28].x, landmarks[28].y)  # Right foot/ankle
        
        right_elbow_angle = compute_angle(right_shoulder, right_elbow, right_wrist)
        # Compute the hip angle: angle at the hip between shoulder, hip, and ankle
        right_hip_angle = compute_angle(right_shoulder, right_hip, right_ankle)
        return [right_elbow_angle, right_hip_angle]
    else:
        return None


# Function to extract an angle sequence from a video file.
def extract_angle_sequence(video_path, sample_interval_sec=0.4, resize=(320, 320)):
    """
    Processes a video and extracts a sequence of joint angles.
    Samples frames every sample_interval_sec seconds.
    Returns a NumPy array of shape (num_samples, num_angles).
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * sample_interval_sec)
    angles_sequence = []
    frame_count = 0
    mp_pose = mp.solutions.pose
    # Use MediaPipe Pose to process frames.
    print("here in extract_angle_ssss...")
    with mp_pose.Pose(static_image_mode=False, model_complexity=1, min_detection_confidence=0.5) as pose_detector:
        print("inside of this first while loop")
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                frame = cv2.resize(frame, resize)
                angles = extract_joint_angles_from_frame(frame, pose_detector)
                if angles is not None:
                  angles_sequence.append(angles)
            frame_count += 1
    
    cap.release()
    return np.array(angles_sequence)

def count_pushup_reps_from_angles(angle_sequence, down_threshold=90, up_threshold=150):
    reps = 0
    down = False
    for angles in angle_sequence:
        # Assuming the first element is the right elbow angle now.
        elbow_angle = angles[0]
        plank_angle = angles[1]
        if elbow_angle < down_threshold and not down:
            down = True
        if elbow_angle > up_threshold and down:
            if plank_angle > 150 and plank_angle <= 185:
              reps += 1
            down = False
    return reps

def get_pushup_count(video_url):
    """
    Reads video and creates two angles describing form of pushup every .4 seconds (change interval in "extract_angle_sequence").
    wrist-elbow-shoulder angle describes depth of pushup.
    shoulder-hips-ankle anlge describes back straitness of pushup.
    Thresholds for which pushups are counted are set in "count_pushup_reps_from_angles"
    """
    print("IN GET PUSHUP COUNT")
    angle_sequence = extract_angle_sequence(video_url)
    print("ANGLE SEQUENCE: ", angle_sequence)
    return count_pushup_reps_from_angles(angle_sequence)



##################################################################################






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
    from sqlalchemy import func, extract
    # Expect query parameters "year" and "month" (e.g. ?year=2025&month=3)
    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)
    if not year or not month:
        return jsonify({"error": "Please provide 'year' and 'month' query parameters"}), 400

    # Query to count the number of workout instances per day
    results = db.session.query(
    func.DATE(DayWorkoutData.created_at).label("day"),
    func.count(DayWorkoutData.id).label("workout_count")
    ).filter(
      DayWorkoutData.user_id == current_user.id,
      extract("year", DayWorkoutData.created_at) == year,
      extract("month", DayWorkoutData.created_at) == month
    ).group_by(func.DATE(DayWorkoutData.created_at)).all()

    # Optionally, convert the date to string if needed:
    data = {int(day[-2:]): workout_count for day, workout_count in results}

    return jsonify(data)
@app.route("/workouts/daily", methods=["GET"])
@token_required
def daily_pushups(current_user):
    from sqlalchemy import extract

    # Expect a "date" query parameter in format "YYYY-M-D"
    date_str = request.args.get("date")

    if not date_str:
        return jsonify({"error": "Please provide a 'date' query parameter"}), 400

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
        year, month, day = date.year, date.month, date.day
    except ValueError:
        return jsonify({"error": "Invalid date format. Use 'YYYY-MM-DD'."}), 400

    # Query all DayWorkoutData entries for the given date
    workouts = db.session.query(DayWorkoutData.pushups).filter(
        DayWorkoutData.user_id == current_user.id,
        extract("year", DayWorkoutData.created_at) == year,
        extract("month", DayWorkoutData.created_at) == month,
        extract("day", DayWorkoutData.created_at) == day
    ).all()

    # Sum up all push-ups from the day's workouts
    total_pushups = sum(workout[0] for workout in workouts if workout[0] is not None)

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

# @app.route("/api/predict", methods=["POST"])
# @token_required
# def predict(current_user):
#     data = request.get_json()
#     video_url = data.get("video_url")

#     if not video_url:
#         return jsonify({"error": "Missing video_url"}), 400

#     try:
#         pushup_count = get_pushup_count(video_url)

#         # Check if there's already a record for today
#         today = datetime.utcnow().date()
#         workout_entry = DayWorkoutData.query.filter_by(
#             user_id=current_user.id,
#             created_at=cast(DayWorkoutData.created_at, Date) == today
#         ).first()

#         if workout_entry:
#             workout_entry.pushups += pushup_count  # Update existing entry
#         else:
#             new_entry = DayWorkoutData(
#                 user_id=current_user.id,
#                 created_at=datetime.utcnow(),
#                 pushups=pushup_count
#             )
#             db.session.add(new_entry)

#         db.session.commit()
#         return jsonify({"pushups": pushup_count, "message": "Workout logged successfully"})

#     except Exception as e:
#         return jsonify({"error": "Failed to process video", "message": str(e)}), 500

# Optional: a simple chat endpoint (adjust as needed for your AI API)
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    if not user_input:
        return jsonify({"error": "No message provided"}), 400
    # For now, simply echo the input; replace with your AI logic as needed.
    return jsonify({"response": f"Echo: {user_input}"})



def generate_hashed_filename(original_filename, ext=".mp4"):
    """
    Generates a unique hashed filename based on the original filename and random salt.
    """
    salt = os.urandom(8)
    hash_obj = hashlib.sha256(original_filename.encode() + salt)
    return hash_obj.hexdigest()[:16] + ext

def convert_to_mp4(input_path, original_filename):
    """
    Converts a MOV video file to MP4 using moviepy, saving the output with a unique hashed filename.
    Returns a tuple of (output_path, final_filename).
    """
    final_filename = generate_hashed_filename(original_filename, ext=".mp4")
    output_path = os.path.join(tempfile.gettempdir(), final_filename)
    print(output_path)
    clip = VideoFileClip(input_path)
    # Convert the video to MP4 with H.264 codec and AAC audio codec.
    clip.write_videofile(output_path, codec="libx264", audio_codec="aac", verbose=False, logger=None)
    print("AFTER WRITING VIDEO")

    return output_path, final_filename, clip

@app.route("/api/predict", methods=["POST"])
@token_required
def predict(current_user):
    # Check for video file in the request
    if "video" not in request.files:
        return jsonify({"error": "Missing video file"}), 400

    video_file = request.files["video"]
    if video_file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Secure the filename and get its extension
    original_filename = secure_filename(video_file.filename)
    _, ext = os.path.splitext(original_filename)
    ext = ext.lower()

    try:
        # Save the uploaded video to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_input:
            video_file.save(temp_input)
            temp_input_path = temp_input.name

        # If the file is a MOV, convert it to MP4 with a unique hashed filename; otherwise, use the file as is.
        if ext == ".mov":
            print("ABOUT TO CONVERT ")
            final_video_path, final_filename, clip = convert_to_mp4(temp_input_path, original_filename)
            pushup_count = get_pushup_count(final_video_path)
            clip.close()
        else:
            final_video_path = temp_input_path
            final_filename = original_filename
            pushup_count = get_pushup_count(final_video_path)

        # Process the video to get pushup count using your get_pushup_count function.
       
        print("PushupCOUNNNNNNNNTTTTTTTTT: ", pushup_count)
        # Upload the final video file to S3.
        # s3_key = f"workouts/{current_user.id}/{final_filename}"
        # s3 = boto3.client(
        #     "s3",
        #     aws_access_key_id=AWS_ACCESS_KEY,
        #     aws_secret_access_key=AWS_SECRET_KEY
        # )
        # with open(final_video_path, "rb") as f:
        #     # We always set ContentType to video/mp4 even if the file wasn't converted; adjust if needed.
        #     s3.upload_fileobj(f, BUCKET_NAME, s3_key, ExtraArgs={"ContentType": "video/mp4"})

        # video_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

        # Update or create today's workout record.
        now = datetime.now(timezone.utc)
        today = now.date()
        workout_entry = DayWorkoutData.query.filter(
            DayWorkoutData.user_id == current_user.id,
            cast(DayWorkoutData.created_at, Date) == today
        ).first()

        if workout_entry:
            workout_entry.pushups += pushup_count
        else:
            new_entry = DayWorkoutData(
                user_id=current_user.id,
                created_at=now,
                pushups=pushup_count
            )
            db.session.add(new_entry)
        db.session.commit()

        # Clean up temporary files.
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)
        # If the file was converted, delete the converted file as well.
        if ext == ".mov" and os.path.exists(final_video_path):
            os.remove(final_video_path)

        return jsonify({
            "pushups": pushup_count,
            "message": "Workout logged successfully",
            # "videoUrl": video_url
        })

    except Exception as e:
        # Attempt cleanup on error.
        try:
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
            if ext == ".mov" and 'final_video_path' in locals() and os.path.exists(final_video_path):
                os.remove(final_video_path)
        except Exception:
            pass
        return jsonify({"error": "Failed to process video", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
