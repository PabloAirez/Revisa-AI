const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware base
app.use(cors());
app.use(express.json());

// 🧩 Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '..', 'public')));

// 🏠 Rota raiz → exibe o index.html da pasta public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 🧠 Rota: Gerar Perguntas
app.post('/gerar_perguntas', async (req, res) => {
  try {
    const { assunto, dificuldade } = req.body;

    if (!assunto || !dificuldade) {
      return res.status(400).json({
        erro: 'Assunto e dificuldade são obrigatórios',
      });
    }

    const prompt = `Crie um quiz de 5 perguntas sobre ${assunto} com dificuldade ${dificuldade}.
    Forneça as perguntas no seguinte formato JSON puro:
    [
      {
        "pergunta": "Texto da pergunta?",
        "opcoes": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
        "respostaCorreta": 0
      }
    ]
    Retorne APENAS o array JSON, nada mais.`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API do Gemini: ${response.status}`);
    }

    const data = await response.json();
    const resposta = data.candidates[0].content.parts[0].text;

    const jsonLimpo = resposta
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const perguntas = JSON.parse(jsonLimpo);

    res.json({ sucesso: true, perguntas });
  } catch (erro) {
    console.error('Erro ao gerar perguntas:', erro);
    res.status(500).json({
      erro: 'Erro ao gerar perguntas',
      detalhes: erro.message,
    });
  }
});

// 📘 Rota: Gerar Resumo
app.post('/gerar_resumo', async (req, res) => {
  try {
    const { assunto, perguntasErradas } = req.body;

    if (!assunto || !Array.isArray(perguntasErradas)) {
      return res.status(400).json({
        erro: 'Assunto e perguntasErradas (array) são obrigatórios',
      });
    }

    const prompt = `Você é um tutor educacional. O aluno errou as seguintes perguntas sobre ${assunto}:
${perguntasErradas.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Crie um resumo educativo explicando os conceitos relacionados a essas perguntas.`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API do Gemini: ${response.status}`);
    }

    const data = await response.json();
    const resumo = data.candidates[0].content.parts[0].text;

    res.json({ sucesso: true, resumo });
  } catch (erro) {
    console.error('Erro ao gerar resumo:', erro);
    res.status(500).json({
      erro: 'Erro ao gerar resumo',
      detalhes: erro.message,
    });
  }
});

// 🚀 Inicialização do servidor (Render define process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
