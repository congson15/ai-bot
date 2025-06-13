const unltdai = require("../services/UnltdaiClient");

const PROVIDER_ROUTING = {
  "gpt-4o": { uri: "/functions/v1/fetch-chat-completion-openai-stream", provider: "openai" },
  "gpt-4.1": { uri: "/functions/v1/fetch-chat-completion-openai-stream", provider: "openai" },
  "gpt-4o-mini": { uri: "/functions/v1/fetch-chat-completion-openai-stream", provider: "openai" },
  "claude-3-5-haiku-latest": { uri: "/functions/v1/fetch-chat-comletion-claude-stream", provider: "claude" },
  "claude-3-5-sonnet-latest": { uri: "/functions/v1/fetch-chat-comletion-claude-stream", provider: "claude" },
  "deepseek-chat": { uri: "/functions/v1/fetch-chat-completion-deepseek-stream", provider: "deepseek" },
  "deepseek-reasoner": { uri: "/functions/v1/fetch-chat-completion-deepseek-stream", provider: "deepseek" },
  "qwen-turbo": { uri: "/functions/v1/fetch-chat-completion-qwen-stream", provider: "qwen" },
  "qwen-plus": { uri: "/functions/v1/fetch-chat-completion-qwen-stream", provider: "qwen" },
};

function buildPayload({ provider, model, messages }) {
  switch (provider) {
    case "openai":
    case "deepseek":
    case "qwen":
      return { model, messages };
    case "claude":
      return { modelName: model, messages, maxTokens: 1024 };
    default:
      throw new Error("Unknown AI provider");
  }
}

// STEP 1: Create conversation
async function createConversation(user_id) {
  return await unltdai.request({
    uri: "/rest/v1/conversations",
    method: "POST",
    body: { user_id },
  });
}

// STEP 2: Send user message and update conversation
async function sendUserMessage(conversation_id, content) {
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
  });

  await unltdai.request({
    uri: `/rest/v1/conversations?id=eq.${conversation_id}`,
    method: "PATCH",
    body: { last_message_id: msg.id },
  });

  return msg;
}

// STEP 3: Stream AI response
async function streamAiResponse({ model, messages, res }) {
  const entry = PROVIDER_ROUTING[model];
  if (!entry) throw new Error("Unsupported model");

  const body = buildPayload({ provider: entry.provider, model, messages });
  console.log(body);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullReply = "";
  await unltdai.stream({
    uri: entry.uri,
    method: "POST",
    body,
    onChunk: (chunk) => {
      fullReply += chunk;
      res.write(chunk); // ghi thẳng response Express tại đây
    },
  });

  res.end();
  return fullReply;
}


// STEP 4: Save assistant message
async function saveAiMessage(conversation_id, content, model) {
  return await unltdai.request({
    uri: "/rest/v1/messages",
    method: "POST",
    body: {
      conversation_id,
      role: "assistant",
      content,
      media: null,
      ai_model_name: model,
    },
  });
}

// Optional all-in-one legacy function (not used by split route)
async function runChatFlow({ user_id, content, model, conversation_id, res }) {
  const conv = conversation_id
    ? { id: conversation_id }
    : await createConversation(user_id);

  const userMsg = await sendUserMessage(conv.id, content);
  const fullReply = await streamAiResponse({
    model,
    messages: [{ role: "user", content }],
    res,
  });
  const aiMsg = await saveAiMessage(conv.id, fullReply, model);

  return {
    conversation_id: conv.id,
    user_message_id: userMsg.id,
    assistant_message_id: aiMsg.id,
    ai_response: fullReply,
  };
}

module.exports = {
  createConversation,
  sendUserMessage,
  streamAiResponse,
  saveAiMessage,
  runChatFlow, // optional
};
