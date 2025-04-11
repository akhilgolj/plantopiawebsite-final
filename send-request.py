import requests

url = "http://127.0.0.1:5000/chat"  # Ensure Flask is running

data = {
    "message": "tell me about iphone"
}

try:
    response = requests.post(url, json=data)
    response.raise_for_status()  # Raise error for 4xx and 5xx responses
    print("Chatbot Response:", response.json())
except requests.exceptions.RequestException as e:
    print("Error:", e)
