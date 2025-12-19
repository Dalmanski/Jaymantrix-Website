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
  const systemInstruction = typeof body.systemInstruction === 'string' ? body.systemInstruction : '';

  try {
    const reply = await generateReply(messages, message, systemInstruction);
    if (typeof reply === 'string' && /ran out of Free Tier Message/i.test(reply)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(reply);
    } else {
      sendJSON(res, 200, { reply });
    }
  } catch (err) {
    sendJSON(res, 500, { error: err && err.message ? err.message : String(err) });
  }
};
