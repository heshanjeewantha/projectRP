import requests
import io

url = "http://localhost:8000/api/videos/upload"
files = {'file': ('test.mp4', io.BytesIO(b'dummy data'), 'video/mp4')}
data = {'title': 'Test Video'}

try:
    response = requests.post(url, files=files, data=data)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
