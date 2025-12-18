const keyFile = require('./secret-key.json');
const API_KEY = keyFile && keyFile.API_KEY ? keyFile.API_KEY : '';
const MODEL_NAME = 'gemini-2.5-flash-lite-preview-09-2025';
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent?key=" + API_KEY;

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

async function generateReply(updatedMessages, userMessage) {
  console.log('User:', userMessage);

  const chatHistory = formatHistoryForAPI(updatedMessages);
  const payload = {
    contents: chatHistory.concat([{ role: 'user', parts: [{ text: userMessage }] }]),
    systemInstruction: { parts: [{ text: systemInstruction }] },
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

      response = await fetch(API_URL, {
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
        attempt++;
        if (attempt >= MAX_RETRIES) {
          botResponseText = 'Service is busy. Please try again in a moment.';
        }
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
