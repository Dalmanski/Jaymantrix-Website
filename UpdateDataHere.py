import json
from google_play_scraper import app
from yt_dlp import YoutubeDL

# Load local game data
with open("UpdateGameHere.json", "r", encoding="utf-8") as f:
    local_games = json.load(f)

file_name = "MyGames.json"
print(f'Fetching "{file_name}", please wait...')

games = []

# Fetch Google Play data
for game in local_games:
    try:
        if "playstore_id" in game and game["playstore_id"]:
            data = app(game["playstore_id"])
            games.append({
                "user_id": game["user_id"],
                "category": game.get("category", ""),
                "name": data["title"],
                "icon": data["icon"],
                "description": game.get("description", "No description provided")
            })
        else:
            games.append({
                "user_id": game["user_id"],
                "category": game.get("category", ""),
                "name": game.get("name", "Unknown"),
                "icon": game.get("icon", "https://via.placeholder.com/100x100?text=No+Image"),
                "description": game.get("description", "No description provided")
            })
    except Exception as e:
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

# === Fetch YouTube channel info ===
yt_channel_url = "https://www.youtube.com/@Jaymantrix"

ydl_opts = {
    "extract_flat": True,
    "quiet": True,
    "skip_download": True,
}

print('Fetching YouTube channel info...')

with YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(yt_channel_url, download=False)
    thumbnails = info.get("thumbnails", [])
    pfp_icon = thumbnails[-1]["url"] if thumbnails else "https://via.placeholder.com/100x100?text=No+Icon"

    yt_data = {
        "id": info.get("id"),
        "title": info.get("title"),
        "channel_url": yt_channel_url,
        "description": info.get("description", "No description"),
        "subscriber_count": info.get("subscriber_count", "Hidden"),
        "uploader_id": info.get("uploader_id"),
        "uploader_url": info.get("uploader_url"),
        "icon": pfp_icon
    }

with open("MyYTinfo.json", "w", encoding="utf-8") as f:
    json.dump(yt_data, f, ensure_ascii=False, indent=2)
    print('YouTube channel info saved to "MyYTinfo.json"!')
