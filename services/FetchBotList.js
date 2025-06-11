const axios = require('axios');
const { baseURL, userAgent } = require('../config');
const { refreshTokenIfNeeded, getFullToken } = require('./TokenService');

async function fetchBotList({ sortBy = 'createdAt:desc', limit = 15 } = {}) {
  await refreshTokenIfNeeded();

  const { accessToken, apiKey } = getFullToken();

  const res = await axios.post(`${baseURL}/functions/v1/fetch-unltdai`, {
    uri: 'bots/',
    method: 'GET',
    options: {
      query: {
        sortBy,
        limit
      }
    }
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: apiKey,
      'Content-Type': 'application/json',
      'User-Agent': userAgent
    }
  });

  return res.data;
}

module.exports = { fetchBotList };