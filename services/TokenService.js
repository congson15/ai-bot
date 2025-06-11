const axios = require('axios');
const { baseURL, apiKey } = require('../config');
const { save, load } = require('../utils/CacheStore');

let accessToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Ii9Id0xVaWZ3WTF4MFdHbFQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3pscWFiaGlranl5YWhybXBqdmlsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5NDMxMTMzOS0yZDRkLTQ3MzYtYjlhMy0xN2NkZWUxM2U5ZWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5NjM2MTYzLCJpYXQiOjE3NDk2MzI1NjMsImVtYWlsIjoiZGZkOHh5NDY4bUBwcml2YXRlcmVsYXkuYXBwbGVpZC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImFwcGxlIiwicHJvdmlkZXJzIjpbImFwcGxlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImN1c3RvbV9jbGFpbXMiOnsiYXV0aF90aW1lIjoxNzQ5NjE1Njg5LCJpc19wcml2YXRlX2VtYWlsIjp0cnVlfSwiZW1haWwiOiJkZmQ4eHk0NjhtQHByaXZhdGVyZWxheS5hcHBsZWlkLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcm92aWRlcl9pZCI6IjAwMTc1Mi42YzdjY2I0NTcxNmM0YWQ5OTI0Njg2MWM0YzRmMjhkZS4xMjQ4Iiwic3ViIjoiMDAxNzUyLjZjN2NjYjQ1NzE2YzRhZDk5MjQ2ODYxYzRjNGYyOGRlLjEyNDgifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc0OTYzMjU2M31dLCJzZXNzaW9uX2lkIjoiNTFjZTc0NmUtM2NiMi00NmFjLWExN2ItMmQ0MDg4OTBkZWQ3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.SD_7kOq3SvMBaffv8ut69pSVwbwBngw82T0SlDMe8aY';
let refreshToken = 'buwdhjzggner';
let tokenExpiry = 1749636163;
function setTokenState(state) {
  accessToken = state.access_token;
  refreshToken = state.refresh_token;
  tokenExpiry = Math.floor(Date.now() / 1000) + state.expires_in;
  save({ accessToken, refreshToken, tokenExpiry });
}

async function refreshTokenIfNeeded(force = false) {
  const now = Math.floor(Date.now() / 1000);
  if (!force && now < tokenExpiry - 300) {
    console.log('[INFO] Token valid until', new Date(tokenExpiry * 1000).toISOString().slice(11, 19));
    return;
  };
  const res = await axios.post(`${baseURL}/auth/v1/token?grant_type=refresh_token`, {
    refresh_token: refreshToken
  }, {
    headers: { apikey: apiKey }
  });
  setTokenState(res.data);
  console.log('[INFO] ✅ Token refreshed:', new Date().toISOString());
}

function getFullToken() {
  const cache = load();
  return cache
}


function initToken() {
  const cache = load();
  if (JSON.stringify(cache) !== '{}') {
    accessToken = cache.accessToken;
    refreshToken = cache.refreshToken;
    tokenExpiry = cache.tokenExpiry;
  }
}
async function getUserInfo() {
  const tokenData = await load();
  const res = await axios.get(`${baseURL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${tokenData.accessToken}`,
      apiKey,
    },
  });
  return res.data;
}
module.exports = {
  refreshTokenIfNeeded,
  getFullToken,
  initToken,
  getUserInfo
};