
module.exports = {
  fetch_bot_list: {
    uri: '/functions/v1/fetch-unltdai',
    method: 'POST',
    transform: (input) => ({
      uri: 'bots/',
      method: 'GET',
      options: {
        query: {
          sortBy: input.sortBy || 'createdAt:desc',
          limit: input.limit || 15
        }
      }
    }),
  },

  fetch_user_info: {
    uri: '/auth/v1/user',
    method: 'GET',
    transform: () => null,
    
  },

  get_user_conversations: {
    uri: '/rest/v1/conversations',
    method: 'GET',
    transform: (input) => ({
      ...input,
      'last_message_id': 'not.is.null',
      offset: input.offset || 0,
      limit: input.limit || 4,

    }),
    transformToQuery: true
  },

  get_messages_by_conversation: {
    uri: '/rest/v1/messages',
    method: 'GET',
    transform: (input) => ({
      ...input,
      conversation_id: `eq.${input.conversation_id}`,
      limit: input.limit || 10,
      offset: input.offset || 0,
    }),
    transformToQuery: true
  }
};
