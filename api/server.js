// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Validação da API Key
if (!process.env.GEMINI_API_KEY) {
    console.error('ERRO: GEMINI_API_KEY não encontrada no arquivo .env');
    process.exit(1);
}


// Rota de teste
app.get('/', (req, res) => {
    res.json({ 
        mensagem: 'API funcionando!'
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
