const unltdai = require("../services/UnltdaiClient");

const PROVIDER_ROUTING = {
  "gpt-4o": {
    uri: "/functions/v1/fetch-chat-completion-openai-stream",
    provider: "openai",
  },
  "gpt-4.1": {
    uri: "/functions/v1/fetch-chat-completion-openai-stream",
    provider: "openai",
  },
  "gpt-4o-mini": {
    uri: "/functions/v1/fetch-chat-completion-openai-stream",
    provider: "openai",
  },

  "claude-3-5-haiku-latest": {
    uri: "/functions/v1/fetch-chat-comletion-claude-stream",
    provider: "claude",
  },
  "claude-3-5-sonnet-latest": {
    uri: "/functions/v1/fetch-chat-comletion-claude-stream",
    provider: "claude",
  },

  "deepseek-chat": {
    uri: "/functions/v1/fetch-chat-completion-deepseek-stream",
    provider: "deepseek",
  },
  "deepseek-reasoner": {
    uri: "/functions/v1/fetch-chat-completion-deepseek-stream",
    provider: "deepseek",
  },

  "qwen-turbo": {
    uri: "/functions/v1/fetch-chat-completion-qwen-stream",
    provider: "qwen",
  },
  "qwen-plus": {
    uri: "/functions/v1/fetch-chat-completion-qwen-stream",
    provider: "qwen",
  },
};

function buildPayload({ provider, model, messages }) {
  switch (provider) {
    case "openai":
    case "deepseek":
    case "qwen":
      return { model, messages };
    case "claude":
      return { model, messages, maxTokens: 1024 };
    default:
      throw new Error("Unknown AI provider");
  }
}

async function streamAiResponse({ model, messages, res }) {
  const entry = PROVIDER_ROUTING[model];
  if (!entry) throw new Error("Unsupported model");

  const body = buildPayload({ provider: entry.provider, model, messages });

  const fullReply = await unltdai.stream({
    uri: entry.uri,
    method: "POST",
    body,
    res,
  });

  return fullReply;
}

async function runChatFlow({ user_id, content, model, conversation_id, res }) {
  let conv;
  const headers = {
    prefer: "return=representation",
    Accept: "application/vnd.pgrst.object+json",
  };
  if (conversation_id) {
    conv = { id: conversation_id };
  } else {
    conv = await unltdai.request({
      uri: "rest/v1/conversations",
      method: "POST",
      body: { user_id },
      headers,
    });
  }

  const userMsg = await unltdai.request({
    uri: "/rest/v1/messages",
    method: "POST",
    headers,
    body: {
      conversation_id: conv.id,
      role: "user",
      content,
      media: null,
      ai_model_name: null,
    },
  });

  await unltdai.request({
    uri: `/rest/v1/conversations?id=eq.${conv.id}`,
    method: "PATCH",
    headers,

    body: { last_message_id: userMsg.id },
  });

  const fullReply = await streamAiResponse({
    model,
    messages: [{ role: "user", content }],
    headers,

    res,
  });

  const aiMsg = await unltdai.request({
    uri: "/rest/v1/messages",
    method: "POST",
    headers,

    body: {
      conversation_id: conv.id,
      role: "assistant",
      content: fullReply,
      media: null,
      ai_model_name: model,
    },
  });

  return {
    conversation_id: conv.id,
    user_message_id: userMsg.id,
    assistant_message_id: aiMsg.id,
    ai_response: fullReply,
  };
}

module.exports = { runChatFlow };
