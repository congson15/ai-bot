
const express = require('express');
const app = express();
const proxyRouter = require('./routes/proxy');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

app.use(express.json());
app.use('/proxy', proxyRouter);

app.listen(3000, () => {
  console.log('🧠 UNLTDAI Refactored Proxy is running at http://localhost:3000');
});
