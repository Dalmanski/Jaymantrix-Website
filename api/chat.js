const { generateReply } = require('../Gemini_Chatbot/Gemini-2.5-Model.js');

function sendJSON(res, statusCode, obj) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Method not allowed' });

  // Robust JSON body parsing (works whether Vercel parsed it or not)
  let body = req.body;
  if (!body) {
    try {
      const buf = [];
      for await (const chunk of req) buf.push(chunk);
      const txt = Buffer.concat(buf).toString();
      body = txt ? JSON.parse(txt) : {};
    } catch (e) {
      return sendJSON(res, 400, { error: 'Invalid JSON' });
    }
  }

  const message = typeof body.message === 'string' ? body.message : '';
  const messages = Array.isArray(body.messages) ? body.messages : [];

  try {
    const reply = await generateReply(messages, message);
    sendJSON(res, 200, { reply });
  } catch (err) {
    sendJSON(res, 500, { error: err && err.message ? err.message : String(err) });
  }
};
