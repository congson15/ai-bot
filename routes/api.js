const express = require('express');
const router = express.Router();
const TokenService = require('../services/TokenService');
const { fetchBotList } = require('../services/FetchBotList');

router.get('/bots', async (_, res) => {
  try {
    const result = await fetchBotList();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bot list', detail: err.message });
  }
});
router.get('/health', async (req, res) => {
  try {
    const userInfo = await TokenService.getUserInfo();
    res.json({ status: 'ok', user: userInfo });
  } catch (err) {
    res.status(500).json({ status: 'bad', message: err.message });
  }
});
module.exports = router;