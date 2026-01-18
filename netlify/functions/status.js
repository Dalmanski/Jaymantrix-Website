const model = require('../../Gemini-Chatbot/Gemini-Model.js');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const status = typeof model.getStatus === 'function'
      ? model.getStatus()
      : { totalKeys: 0, currentKeyIndex: 0, failedKeyIndices: [], model: null };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err && err.message ? err.message : String(err) })
    };
  }
};
