const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Revisa-AI funcionando!',
    rotas: {
      gerarPerguntas: 'POST /api/gerar_perguntas',
      gerarResumo: 'POST /api/gerar_resumo'
    }
  });
});

module.exports = app;
