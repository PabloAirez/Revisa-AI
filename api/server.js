const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Log simplificado (sem loops infinitos)
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Revisa-AI funcionando!',
    rotas: {
      gerarPerguntas: 'POST /api/gerar_perguntas',
      gerarResumo: 'POST /api/gerar_resumo'
    }
  });
});

// Mantém tuas outras rotas (gerar_perguntas, gerar_resumo, etc.)

module.exports = app;
