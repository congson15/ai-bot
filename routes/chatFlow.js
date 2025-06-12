const express = require('express');
const router = express.Router();
const { runChatFlow } = require('../controllers/ChatFlow');

router.post('/', async (req, res) => {
  const { user_id, content, model, conversation_id } = req.body;

  // Thiết lập cho SSE (nếu là text event stream)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await runChatFlow({
      user_id,
      content,
      model,
      conversation_id,
      res,
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).end(err?.message || 'Internal error');
    }
  }
});

module.exports = router;