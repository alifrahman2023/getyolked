import numpy as np
import cv2
import mediapipe as mp

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
    Processes a frame using MediaPipe Pose and extracts joint angles for squats:
      - Knee angle: between hip, knee, ankle.
      - Hip angle: between shoulder, hip, knee.
    Returns a list with these two angles.
    """
    # Convert frame from BGR to RGB
    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose_detector.process(image_rgb)
    
    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        
        # Right side landmarks:
        right_shoulder = (landmarks[12].x, landmarks[12].y)
        right_hip      = (landmarks[24].x, landmarks[24].y)
        right_knee     = (landmarks[26].x, landmarks[26].y)
        right_ankle    = (landmarks[28].x, landmarks[28].y)
        
        knee_angle = compute_angle(right_hip, right_knee, right_ankle)
        hip_angle = compute_angle(right_shoulder, right_hip, right_knee)
        return [knee_angle, hip_angle]
    else:
        return None

def extract_angle_sequence(video_path, sample_interval_sec=0.4, resize=(320, 320)):
    """
    Processes a video and extracts a sequence of joint angles for squats.
    Samples frames every sample_interval_sec seconds.
    Returns a NumPy array of shape (num_samples, num_angles).
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * sample_interval_sec)
    angles_sequence = []
    frame_count = 0
    
    with mp.solutions.pose.Pose(static_image_mode=False, model_complexity=1, min_detection_confidence=0.5) as pose_detector:
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

def count_squat_reps_from_angles(angle_sequence, down_threshold=70, up_threshold=160):
    reps = 0
    down = False
    for angles in angle_sequence:
        knee_angle = angles[0]
        hip_angle = angles[1]
        if knee_angle < down_threshold and not down:
            down = True
        if knee_angle > up_threshold and down:
            if hip_angle > 140:
                reps += 1
            down = False
    return reps

def get_squat_count(video_url):
    """
    Reads a video and tracks squat repetitions.
    The knee-hip-ankle angle determines squat depth, and shoulder-hip-knee angle ensures proper form.
    """
    angle_sequence = extract_angle_sequence(video_url)
    return count_squat_reps_from_angles(angle_sequence)

