const { generateReply } = require('../../Gemini-Chatbot/Gemini-Model.js');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const message = typeof body.message === 'string' ? body.message : '';
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const systemInstruction = typeof body.systemInstruction === 'string' ? body.systemInstruction : '';

  if (!message && (!messages || messages.length === 0)) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: "Hello! I'm Jaymantrix AI. Ask me something." })
    };
  }

  try {
    const reply = await generateReply(messages, message, systemInstruction);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: "Sorry, the AI is temporarily unavailable." })
    };
  }
};
