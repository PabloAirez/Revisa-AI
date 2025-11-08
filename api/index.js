// api/index.js
const app = require('./server');

// Para Vercel Serverless Functions
// Exporta o handler que processa todas as requisições
module.exports = app;