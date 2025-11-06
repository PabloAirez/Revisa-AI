# Revisa-AI

## Sobre o projeto
Este projeto visa ajudar os estudantes a revisar um assunto que estão estudando, criando um quiz dinâmico sobre um assunto e gerando um resumo sobre todos os assuntos que você errou ao final das perguntas


## API

### Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Adicione sua chave da API do Gemini em `GEMINI_API_KEY`
   - Obtenha uma chave em: https://aistudio.google.com/app/apikey

4. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

###  Rotas

### POST /gerar_perguntas

Gera 5 perguntas de quiz sobre um assunto específico.

**Body:**
```json
{
  "assunto": "JavaScript",
  "dificuldade": "intermediário"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "perguntas": [
    {
      "pergunta": "O que é closures em JavaScript?",
      "opcoes": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
      "respostaCorreta": 0
    }
  ]
}
```

### POST /gerar_resumo

Gera um resumo educativo sobre as perguntas que o aluno errou.

**Body:**
```json
{
  "assunto": "JavaScript",
  "perguntasErradas": [
    "O que é closures em JavaScript?",
    "Como funciona o event loop?"
  ]
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "resumo": "Texto do resumo explicativo..."
}
```

### Testando a API

Use ferramentas como Postman, Insomnia ou curl:

```bash
curl -X POST http://localhost:3000/gerar_perguntas \
  -H "Content-Type: application/json" \
  -d '{"assunto":"JavaScript","dificuldade":"fácil"}'
```

### Tecnologias

- Node.js
- Express
- Google Gemini API
- dotenv
- cors

### Variáveis de Ambiente

- `GEMINI_API_KEY` (obrigatória): Chave da API do Gemini
- `PORT` (opcional): Porta do servidor (padrão: 3000)