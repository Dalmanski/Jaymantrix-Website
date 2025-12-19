// Load API keys (support secret-key.json or environment variables on Vercel)
let apiKeys = [];
try {
  const keyFile = require('./secret-key.json');
  if (keyFile && Array.isArray(keyFile.API_KEY) && keyFile.API_KEY.length > 0) apiKeys = keyFile.API_KEY.slice();
} catch (e) {}

if ((!apiKeys || apiKeys.length === 0) && process.env.API_KEYS) {
  try {
    const parsed = JSON.parse(process.env.API_KEYS);
    if (Array.isArray(parsed)) apiKeys = parsed.slice();
  } catch (e) {
    apiKeys = process.env.API_KEYS.split(',').map(s => s.trim()).filter(Boolean);
  }
}
if ((!apiKeys || apiKeys.length === 0) && process.env.API_KEY) {
  try {
    const parsed = JSON.parse(process.env.API_KEY);
    if (Array.isArray(parsed)) {
      apiKeys = parsed.slice();
    } else {
      apiKeys = [String(process.env.API_KEY)];
    }
  } catch (e) {
    apiKeys = [String(process.env.API_KEY)];
  }
}
if ((!apiKeys || apiKeys.length === 0)) {
  const keyList = [];
  for (let i = 0; i < 10; i++) {
    const v = process.env[`API_KEY_${i}`];
    if (v) keyList.push(v);
  }
  if (keyList.length > 0) apiKeys = keyList;
}

const MODEL_NAME = 'gemini-2.5-flash-lite-preview-09-2025';
let currentKeyIndex = 0;
function getApiKey() { return (apiKeys && apiKeys.length) ? apiKeys[currentKeyIndex] : '' }
function rotateKey() { if (apiKeys && apiKeys.length) { currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length; console.log('Rotated API key to index', currentKeyIndex); } }
function getApiUrl() { const key = getApiKey(); return "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent?key=" + encodeURIComponent(key); }

let systemInstruction = "You are Gemini Assistance";

function setSystemInstruction(text) {
  if (typeof text === 'string' && text.trim().length > 0) {
    systemInstruction = text;
    console.log("Gemini systemInstruction set to:", (text.length > 120 ? text.slice(0, 120) + "..." : text));
  } else {
    console.warn("setSystemInstruction called with invalid text; keeping previous instruction.");
  }
}

function getSystemInstruction() {
  return systemInstruction;
}

function formatHistoryForAPI(history) {
  return history.slice(0, -1).map(function (msg) {
    return {
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    };
  });
}

async function generateReply(updatedMessages, userMessage, systemInstructionOverride) {
  console.log('User:', userMessage);

  const effectiveSystemInstruction = (typeof systemInstructionOverride === 'string' && systemInstructionOverride.trim().length > 0) ? systemInstructionOverride : systemInstruction;

  const chatHistory = formatHistoryForAPI(updatedMessages);
  const payload = {
    contents: chatHistory.concat([{ role: 'user', parts: [{ text: userMessage }] }]),
    systemInstruction: { parts: [{ text: effectiveSystemInstruction }] },
    tools: [{ google_search: {} }]
  };

  let botResponseText = 'Sorry, something went wrong fetching the response.';
  try {
    let response;
    let attempt = 0;
    const MAX_RETRIES = 5;
    const initialDelay = 1000;
    while (attempt < MAX_RETRIES) {
      if (attempt > 0) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response && response.ok) {
        const result = await response.json();
        const candidate = (result && result.candidates && result.candidates[0]) || null;
        if (candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
          botResponseText = candidate.content.parts[0].text;
          break;
        } else {
          botResponseText = 'The model returned an empty response.';
          break;
        }
      } else if (response && response.status === 429) {
        // Quota exceeded for current key — rotate to the next key and inform the client
        rotateKey();
        console.warn('Quota exceeded for current API key — switched to index', currentKeyIndex);
        botResponseText = 'Switching API Free tier...';
        break;
      } else {
        const errorBody = response ? await response.text() : 'no response object';
        botResponseText = "Failed to get a response (Status: " + (response ? response.status : 'unknown') + "). " + errorBody;
        break;
      }
      attempt++;
    }
  } catch (error) {
    botResponseText = "An unexpected network error occurred: " + (error && error.message ? error.message : String(error));
  }

  console.log('Bot:', botResponseText);
  return botResponseText;
}

module.exports = { generateReply, setSystemInstruction, getSystemInstruction };
