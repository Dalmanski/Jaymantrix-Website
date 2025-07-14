import json
from google_play_scraper import app

with open("UpdateGameHere.json", "r", encoding="utf-8") as f:
    local_games = json.load(f)

file_name = "MyGames.json"
print(f'Updating "{file_name}", please wait...')

games = []

for game in local_games:
    try:
        if "playstore_id" in game and game["playstore_id"]:
            # Fetch data from Play Store
            data = app(game["playstore_id"])
            games.append({
                "user_id": game["user_id"],
                "category": game.get("category", ""),
                "name": data["title"],
                "icon": data["icon"],
                "description": game.get("description", "No description provided")
            })
        else:
            # Fallback to local data
            games.append({
                "user_id": game["user_id"],
                "category": game.get("category", ""),
                "name": game.get("name", "Unknown"),
                "icon": game.get("icon", "https://via.placeholder.com/100x100?text=No+Image"),
                "description": game.get("description", "No description provided")
            })
    except Exception as e:
        # Error fallback
        games.append({
            "user_id": game["user_id"],
            "category": game.get("category", ""),
            "name": game.get("name", "Unknown"),
            "icon": "https://via.placeholder.com/100x100?text=Error",
            "description": game.get("description", "No description provided")
        })

with open(file_name, "w", encoding="utf-8") as f:
    json.dump(games, f, ensure_ascii=False, indent=2)
    print(f'Updated "{file_name}" successfully!')
