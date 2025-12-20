import json
import datetime
from google_play_scraper import app
from yt_dlp import YoutubeDL

try:
    from zoneinfo import ZoneInfo
    MANILA_TZ = ZoneInfo("Asia/Manila")
except Exception:
    MANILA_TZ = None

def now_manila_iso():
    if MANILA_TZ:
        now = datetime.datetime.now(MANILA_TZ)
    else:
        now = datetime.datetime.now()
    return now.isoformat()

def now_manila_readable():
    if MANILA_TZ:
        now = datetime.datetime.now(MANILA_TZ)
    else:
        now = datetime.datetime.now()
    return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")

def main():
    iso_ts = now_manila_iso()
    date_str, time_str = now_manila_readable()
    print(f"Current (Asia/Manila if available) timestamp: {iso_ts}")
    print(f"Date: {date_str}   Time: {time_str}\n")

    with open("UpdateGameHere.json", "r", encoding="utf-8") as f:
        local_games = json.load(f)

    file_name = "MyGames.json"
    print(f'Fetching "{file_name}", please wait...')

    games = []

    for game in local_games:
        try:
            if "playstore_id" in game and game["playstore_id"]:
                data = app(game["playstore_id"])
                games.append({
                    "user_id": game["user_id"],
                    "category": game.get("category", ""),
                    "name": data.get("title", game.get("name", "Unknown")),
                    "icon": data.get("icon", game.get("icon", "https://via.placeholder.com/100x100?text=No+Image")),
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
                "user_id": game.get("user_id"),
                "category": game.get("category", ""),
                "name": game.get("name", "Unknown"),
                "icon": "https://via.placeholder.com/100x100?text=Error",
                "description": game.get("description", "No description provided"),
                "error": str(e)
            })

    games_output = {
        "fetched_at": iso_ts,
        "date": date_str,
        "time": time_str,
        "games": games
    }

    with open(file_name, "w", encoding="utf-8") as f:
        json.dump(games_output, f, ensure_ascii=False, indent=2)
        print(f'Updated "{file_name}" successfully!')

    yt_channel_url = "https://www.youtube.com/@Jaymantrix"

    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
        "skip_download": True,
    }

    print('Fetching YouTube channel info...')

    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(yt_channel_url, download=False) or {}
            thumbnails = info.get("thumbnails") or []
            pfp_icon = None
            if isinstance(thumbnails, list) and thumbnails:
                last_thumb = thumbnails[-1]
                pfp_icon = last_thumb.get("url") if isinstance(last_thumb, dict) else None
            if not pfp_icon:
                pfp_icon = "https://via.placeholder.com/100x100?text=No+Icon"

            yt_data = {
                "fetched_at": iso_ts,
                "date": date_str,
                "time": time_str,
                "id": info.get("id"),
                "title": info.get("title"),
                "channel_url": yt_channel_url,
                "description": info.get("description", "No description"),
                "subscriber_count": info.get("subscriber_count", "Hidden"),
                "uploader_id": info.get("uploader_id"),
                "uploader_url": info.get("uploader_url"),
                "icon": pfp_icon
            }

    except Exception as e:
        yt_data = {
            "fetched_at": iso_ts,
            "date": date_str,
            "time": time_str,
            "id": None,
            "title": None,
            "channel_url": yt_channel_url,
            "description": None,
            "subscriber_count": None,
            "uploader_id": None,
            "uploader_url": None,
            "icon": "https://via.placeholder.com/100x100?text=Error",
            "error": str(e)
        }
        print("Error fetching YouTube data:", e)

    with open("MyYTinfo.json", "w", encoding="utf-8") as f:
        json.dump(yt_data, f, ensure_ascii=False, indent=2)
        print('YouTube channel info saved to "MyYTinfo.json"!')

if __name__ == "__main__":
    main()
