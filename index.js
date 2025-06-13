
const express = require('express');
const app = express();
const cors = require('cors');
const proxyRouter = require('./routes/proxy');
const chatFlowRouter = require('./routes/chatFlow');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
app.use(cors());
app.use(express.json());
app.use('/proxy', proxyRouter);
app.use('/chat', chatFlowRouter);
app.listen(3000, () => {
  console.log('🧠 UNLTDAI Refactored Proxy is running at http://localhost:3000');
});
