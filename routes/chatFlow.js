const express = require("express");
const router = express.Router();
const unltdai = require("../services/UnltdaiClient");
const { streamAiResponse } = require("../controllers/ChatFlow");

const headers = {
  prefer: "return=representation",
  Accept: "application/vnd.pgrst.object+json",
};

// 1. Start a conversation
router.post("/conversation", async (req, res) => {
  try {
    const { user_id } = req.body;
    const conv = await unltdai.request({
      uri: "/rest/v1/conversations",
      method: "POST",
      body: { user_id },
      headers,
    });
    res.json({ id: conv.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Send user message
router.post("/message", async (req, res) => {
  try {
    const { conversation_id, content } = req.body;
    const msg = await unltdai.request({
      uri: "/rest/v1/messages",
      method: "POST",
      body: {
        conversation_id,
        role: "user",
        content,
        media: null,
        ai_model_name: null,
      },
      headers,
    });

    await unltdai.request({
      uri: `/rest/v1/conversations?id=eq.${conversation_id}`,
      method: "PATCH",
      body: { last_message_id: msg.id },
      headers,
    });

    res.json({ id: msg.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Stream AI response
router.post("/stream", async (req, res) => {
  const { content, model } = req.body;

  // ✅ Đây là Express res, dùng được .setHeader
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await streamAiResponse({
      model,
      messages: [{ role: "user", content }],
      res, // <-- gốc từ Express
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).end(err.message || "Internal error");
    }
  }
});

// 4. Save assistant message
router.post("/message/ai", async (req, res) => {
  try {
    const { conversation_id, content, model } = req.body;
    const msg = await unltdai.request({
      uri: "/rest/v1/messages",
      method: "POST",
      body: {
        conversation_id,
        role: "assistant",
        content,
        media: null,
        ai_model_name: model,
      },
      headers,
    });
    res.json({ id: msg.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
