const model = require('../Gemini-Chatbot/Gemini-Model.js');

function sendJSON(res, statusCode, obj) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendJSON(res, 405, { error: 'Method not allowed' });
  try {
    const status = typeof model.getStatus === 'function' ? model.getStatus() : { totalKeys: 0, currentKeyIndex: 0, failedKeyIndices: [], model: null };
    sendJSON(res, 200, status);
  } catch (err) {
    sendJSON(res, 500, { error: err && err.message ? err.message : String(err) });
  }
};