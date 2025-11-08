const app = require('./server');
const serverless = require('serverless-http');

// Exporta no formato que o Vercel espera
module.exports = serverless(app);
