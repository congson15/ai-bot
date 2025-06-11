const cron = require('node-cron');
const { refreshInterval } = require('../config');
const { refreshTokenIfNeeded } = require('../services/TokenService');

function startRefreshJob() {
  cron.schedule(refreshInterval, async () => {
    refreshTokenIfNeeded(true);
  });
}

module.exports = { startRefreshJob };