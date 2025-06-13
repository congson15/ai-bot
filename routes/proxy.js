
const express = require('express');
const router = express.Router();
const endpoints = require('../endpoints');
const unltdai = require('../services/UnltdaiClient');

router.post('/:key', async (req, res) => {
  const { key } = req.params;
  const endpoint = endpoints[key];
  if (!endpoint) return res.status(404).json({ error: 'Invalid proxy key' });

  try {
    const requestData = endpoint.transform ? endpoint.transform(req.body || {}) : {};
    //convert request data to query stringify
    const data = await unltdai.request({
      uri: endpoint.uri,
      method: endpoint.method,
      body: requestData,
      transformToQuery: endpoint.transformToQuery
    });

    res.json(data);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});
router.get('/:key', async (req, res) => {
  const { key } = req.params;
  const endpoint = endpoints[key];
  if (!endpoint) return res.status(404).json({ error: 'Invalid proxy key' });
  console.log(req.search);
  try {
    const requestData = endpoint.transform ? endpoint.transform(req.body || {}) : {};
    const data = await unltdai.request({
      uri: endpoint.uri,
      method: endpoint.method,
      query: req.params,
      body: requestData
    });

    res.json(data);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

module.exports = router;
