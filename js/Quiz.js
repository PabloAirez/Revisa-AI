function Quiz(assunto,dificuldade) {
    this.assunto = assunto; // Assunto do quiz
    this.dificuldade = dificuldade; // Dificuldade do quiz
    this.comecou = false; // Indica se o quiz começou
    this.perguntaAtual = 0; // Índice da pergunta atual
    this.perguntas = []; // Array de perguntas
    this.respostas = []; // Array de respostas do usuário

    this.comecarQuiz = function() { // Função que inicia o quiz
        this.comecou = true;
        
        this.esconderTelaInicial();
        
        this.mostrarContainerQuiz();

        let btnProxima = document.getElementById("btn-proxima");
        btnProxima.onclick = () => this.proximaPergunta();
        
        this.carregarPerguntas();
    };

    this.esconderTelaInicial = function() { // Função que esconde a tela inicial
        const telaInicial = document.querySelector(".tela-inicial");
        telaInicial.style.animation = "fadeout 0.5s ease-out forwards";
        
        setTimeout(() => {
            telaInicial.style.display = "none";
        }, 500);
    };

    this.mostrarContainerQuiz = function() { // Função que mostra o container do quiz
        const containerQuiz = this.criarContainerQuiz();
        document.body.appendChild(containerQuiz);
        
        // Trigger animation
        setTimeout(() => {
            containerQuiz.style.opacity = "1";
        }, 50);
    };

    this.criarContainerQuiz = function() { // Função que cria o container do quiz
        const container = document.createElement("div");
        container.className = "container-quiz";
        container.innerHTML = `
            <div class="quiz-header">
                <h2>Quiz sobre: ${this.assunto}</h2>
                <div class="progresso">
                    <span id="pergunta-numero">Carregando...</span>
                </div>
            </div>
            <div class="quiz-body">
                <div id="loading" class="loading">
                    <p>Gerando perguntas com IA...</p>
                </div>
                <div id="pergunta-container" class="pergunta-container" style="display: none;">
                    <h3 id="pergunta-texto"></h3>
                    <div id="opcoes-container" class="opcoes-container"></div>
                </div>
            </div>
            <div class="quiz-footer">
                <button id="btn-proxima" class="btn-acao" style="display: none;">Próxima Pergunta</button>
                <button id="btn-finalizar" class="btn-acao" style="display: none;">Ver Resultado</button>
            </div>
        `;
        return container;
    };

   this.carregarPerguntas = function() { // Função que carrega as perguntas usando IA
        const API_KEY = "AIzaSyDquvgicOwC4Sk4zo4HqY5QZDkvC7uFQOw";
        
        const prompt = `Crie um quiz de 5 perguntas sobre ${this.assunto} com dificuldade ${this.dificuldade}.
        Forneça as perguntas no seguinte formato JSON puro (sem markdown, sem \`\`\`json):
        [
        {
                "pergunta": "Texto da pergunta?",
                "opcoes": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
                "respostaCorreta": 0
        }
        ]
        Retorne APENAS o array JSON, nada mais.`;

        fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
            {
                method: "POST",
                headers: {
                    "x-goog-api-key": API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }]
                        }
                    ]
                })
            }
        )
        .then(response => response.json())
        .then(data => {
            const resposta = data.candidates[0].content.parts[0].text;
            try {
                this.perguntas = JSON.parse(resposta);
                this.exibirPergunta();
            }
            catch (e) {
                console.error("Erro ao analisar o JSON das perguntas:", e);
                alert("Houve um erro ao gerar as perguntas do quiz. Por favor, tente novamente.");
            }
        })
        .catch(err => {
            console.error("Erro ao gerar perguntas:", err);
            alert("Houve um erro ao gerar as perguntas do quiz. Por favor, tente novamente.");
        });
    };


    this.exibirPergunta = function() { // Função que exibe a pergunta atual
        const loading = document.getElementById("loading");
        const perguntaContainer = document.getElementById("pergunta-container");
        
        loading.style.display = "none";
        perguntaContainer.style.display = "block";
        
        const pergunta = this.perguntas[this.perguntaAtual];
        document.getElementById("pergunta-numero").textContent = 
            `Pergunta ${this.perguntaAtual + 1} de ${this.perguntas.length}`;
        document.getElementById("pergunta-texto").textContent = pergunta.pergunta;
        
        const opcoesContainer = document.getElementById("opcoes-container");
        opcoesContainer.innerHTML = "";
        
        pergunta.opcoes.forEach((opcao, index) => {
            const botaoOpcao = document.createElement("button");
            botaoOpcao.className = "opcao";
            botaoOpcao.textContent = opcao;
            botaoOpcao.onclick = () => this.selecionarResposta(index);
            opcoesContainer.appendChild(botaoOpcao);
        });
    };

    this.selecionarResposta = function(index) { // Função que seleciona a resposta
        const opcoes = document.querySelectorAll(".opcao");
        opcoes.forEach(opcao => opcao.classList.remove("selecionada"));
        opcoes[index].classList.add("selecionada");
        
        document.getElementById("btn-proxima").style.display = "block";
    };

    this.responderPergunta = function() { // Função que registra a resposta do usuário
        const opcaoSelecionada = document.querySelector(".selecionada");
        if (opcaoSelecionada) {
            const respostaIndex = Array.from(document.querySelectorAll(".opcao")).indexOf(opcaoSelecionada);
            this.respostas.push(respostaIndex);
        }
    };

    this.proximaPergunta = function() { // Função que avança para a próxima pergunta
        this.responderPergunta();
        this.perguntaAtual++;
        if (this.perguntaAtual < this.perguntas.length) { // Ainda há perguntas
            this.exibirPergunta();
            document.getElementById("btn-proxima").style.display = "none";
        } else { // Fim do quiz
            this.mostrarResultado();
        }
    };

    this.mostrarResultado = function() { // Função que mostra o resultado do quiz
        this.responderPergunta();
        const containerQuiz = document.querySelector(".container-quiz");
        containerQuiz.innerHTML = `
            <div class="resultado">
                <h2>Resultado do Quiz</h2>
                <p>Você acertou ${this.calcularAcertos()} de ${this.perguntas.length} perguntas!</p>
                <button id="btn-reiniciar" class="btn-acao">Reiniciar Quiz</button>
            </div>
        `;
        let btnReiniciar = document.getElementById("btn-reiniciar");
        btnReiniciar.addEventListener("click", () => { // Reinicia o quiz
            location.reload(); // Recarrega a página, zerando todos os estados
        });
    };

    this.mostrarErros = function() { // Função que mostra as perguntas erradas
        const containerQuiz = document.querySelector(".container-quiz");
        let detalhes = "<h3>Detalhes das Perguntas Erradas:</h3><ul>";
        this.perguntas.forEach((pergunta, index) => {
            if (pergunta.respostaCorreta !== this.respostas[index]) {
                detalhes += `<li>
                    <strong>Pergunta:</strong> ${pergunta.pergunta}<br>
                    <strong>Sua Resposta:</strong> ${pergunta.opcoes[this.respostas[index]] || "Nenhuma resposta"}<br>
                    <strong>Resposta Correta:</strong> ${pergunta.opcoes[pergunta.respostaCorreta]}
                </li>`;
            }
        });
        detalhes += "</ul>";
        containerQuiz.innerHTML += detalhes;

    }

    this.calcularAcertos = function() { // Função que calcula o número de acertos
        let acertos = 0;
        this.perguntas.forEach((pergunta, index) => {
            if (pergunta.respostaCorreta === this.respostas[index]) { // Pega o index da resposta selecionada e compara com o index da resposta correta
                acertos++;
            }
        });
        if (acertos < this.perguntas.length) {
            this.mostrarErros();
        }
         return acertos;
    }
}

