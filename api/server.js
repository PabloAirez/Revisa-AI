const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Pode usar dotenv normalmente

const app = express();
app.use(cors());
app.use(express.json());

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Revisa-AI funcionando!',
    rotas: {
      gerarPerguntas: 'POST /gerar_perguntas',
      gerarResumo: 'POST /gerar_resumo'
    }
  });
});

// Tuas outras rotas continuam aqui ↓
// app.post('/gerar_perguntas', ...)
// app.post('/gerar_resumo', ...)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
