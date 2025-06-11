const express = require('express');
const app = express();
const apiRoutes = require('./routes/api');
const { initToken } = require('./services/TokenService');
const { startRefreshJob } = require('./jobs/RefreshJob');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

app.use(express.json());
initToken();
startRefreshJob();

app.use('/api', apiRoutes);

app.listen(3000, () => {
  console.log('🧠 UNLTDAI Proxy JS is live at http://localhost:3000');
});