import requests

res = requests.get("http://localhost:8008/recommend/explain?user_id=7&product_id=1")
print(res.json())

res2 = requests.get("http://localhost:8008/recommend/location-aware?user_id=7&product_id=1&latitude=7.29&longitude=80.03")
print(res2.json())
