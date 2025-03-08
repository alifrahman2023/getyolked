from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

@app.route("/api/predict", methods=["POST"])
def predict():
    return jsonify({"prediction": "your result here"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
