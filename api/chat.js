const { generateReply } = require('../Gemini-Chatbot/Gemini-Model.js');

function sendJSON(res, statusCode, obj) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Method not allowed' });

  let body = req.body;
  if (!body) {
    try {
      const buf = [];
      for await (const chunk of req) buf.push(chunk);
      const txt = Buffer.concat(buf).toString();
      body = txt ? JSON.parse(txt) : {};
    } catch (e) {
      console.error('Invalid JSON payload', e)
      return sendJSON(res, 400, { error: 'Invalid JSON' });
    }
  }

  const message = typeof body.message === 'string' ? body.message : '';
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const systemInstruction = typeof body.systemInstruction === 'string' ? body.systemInstruction : '';

  if (!message && (!messages || messages.length === 0)) {
    return sendJSON(res, 200, { reply: "Hello! I'm Jaymantrix AI (dev). Ask me something." });
  }

  try {
    const reply = await generateReply(messages, message, systemInstruction);
    if (typeof reply === 'string' && reply.toLowerCase().includes('no api key')) {
      return sendJSON(res, 200, { reply: reply })
    }
    sendJSON(res, 200, { reply });
  } catch (err) {
    sendJSON(res, 200, { reply: "Sorry, the AI is temporarily unavailable (dev fallback)." });
  }
};
