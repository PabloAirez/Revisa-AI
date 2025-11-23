const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/teste', (req, res) => {
  return res.status(200).json({
    sucess: 'Rotas funcionando!',
  });
});

const GEMINI_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

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

    const url = `${GEMINI_URL_BASE}/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const textoErro = await response.text().catch(() => '');

      throw new Error(`Erro na API do Gemini (perguntas): ${response.status} - ${textoErro}`);
    }

    const data = await response.json();
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resposta) {
      throw new Error('Resposta vazia ou inválida do Gemini ao gerar perguntas.');
    }

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

app.post('/gerar_resumo', async (req, res) => {
  try {
    const { assunto, perguntasErradas } = req.body;

    if (!assunto || !Array.isArray(perguntasErradas)) {
      return res.status(400).json({
        erro: 'Assunto e perguntasErradas (array) são obrigatórios',
      });
    }

    const prompt = `Você é um tutor educacional. O aluno errou as seguintes perguntas em um quiz sobre ${assunto}:

${perguntasErradas.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Crie um resumo educativo e didático explicando os conceitos relacionados a essas perguntas. 
O resumo deve:
- Ser claro e objetivo
- Explicar os conceitos de forma simples
- Ajudar o aluno a entender onde errou
- Ter cerca de 200-300 palavras

Forneça apenas o texto do resumo, sem introduções como "Aqui está o resumo".`;

    const url = `${GEMINI_URL_BASE}/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const textoErro = await response.text().catch(() => '');
      throw new Error(`Erro na API do Gemini (resumo): ${response.status} - ${textoErro}`);
    }

    const data = await response.json();
    const resumo = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resumo) {
      throw new Error('Resposta vazia ou inválida do Gemini ao gerar resumo.');
    }

    res.json({ sucesso: true, resumo });
  } catch (erro) {
    console.error('Erro ao gerar resumo:', erro);
    res.status(500).json({
      erro: 'Erro ao gerar resumo',
      detalhes: erro.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
