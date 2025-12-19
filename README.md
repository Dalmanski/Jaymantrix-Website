Published on Vercel:
https://jaymantrix-website.vercel.app/

## API keys & Vercel setup 🔧

- The project supports multiple API keys and will rotate keys when a quota error occurs.
- Locally, put your keys in `Gemini_Chatbot/secret-key.json` as an array under `API_KEY` (this file is gitignored).
- On Vercel, set one of the following environment variables in the Project Settings:
  - `API_KEYS` — JSON array (e.g. `["KEY1","KEY2",...]`) or comma-separated list (`KEY1,KEY2,...`), or
  - `API_KEY` — single key or JSON array string, or
  - `API_KEY_0`, `API_KEY_1`, ... — individual keys.
- When the server detects a quota limit on the current key it will rotate to the next key and the client will receive: `Switching API Free tier...` as the reply.

This makes deployments on Vercel work without committing `secret-key.json` to the repo.

