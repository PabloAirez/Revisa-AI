function Quiz(assunto, dificuldade) {
    this.assunto = assunto;
    this.dificuldade = dificuldade;
    this.comecou = false;
    this.perguntaAtual = 0;
    this.perguntas = [];
    this.respostas = [];

    // base com protocolo
    this.urlbase = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
        ? "http://localhost:3000"
        : "https://revisa-ai.onrender.com";
}

Quiz.prototype.comecarQuiz = function() {
    this.comecou = true;

    this.esconderTelaInicial();
    this.mostrarContainerQuiz();

    let btnProxima = document.getElementById("btn-proxima");
    btnProxima.onclick = () => this.proximaPergunta();

    this.carregarPerguntas();
};

Quiz.prototype.esconderTelaInicial = function() {
    const telaInicial = document.querySelector(".tela-inicial");
    if (!telaInicial) return;
    telaInicial.style.animation = "fadeout 0.5s ease-out forwards";

    setTimeout(() => {
        telaInicial.style.display = "none";
    }, 500);
};

Quiz.prototype.mostrarContainerQuiz = function() {
    const containerQuiz = this.criarContainerQuiz();
    document.body.appendChild(containerQuiz);

    setTimeout(() => {
        containerQuiz.style.opacity = "1";
    }, 50);
};

Quiz.prototype.criarContainerQuiz = function() {
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

Quiz.prototype.carregarPerguntas = function() {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "block";

    fetch(`${this.urlbase}/gerar_perguntas`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            assunto: this.assunto,
            dificuldade: this.dificuldade
        })
    })
    .then(async response => {
        if (!response.ok) {
            const text = await response.text().catch(()=>null);
            throw new Error(`Erro na rota /gerar_perguntas: ${response.status} ${text || ""}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data || !data.perguntas) {
            throw new Error("Resposta inválida do servidor ao gerar perguntas.");
        }
        this.perguntas = data.perguntas;
        this.exibirPergunta();
    })
    .catch(err => {
        console.error("Erro ao carregar perguntas:", err);
        if (loading) loading.innerHTML = `<p class="erro">Não foi possível gerar as perguntas. Tente novamente mais tarde.</p>`;
        alert("Houve um erro ao gerar as perguntas do quiz. Por favor, tente novamente.");
    });
};

Quiz.prototype.exibirPergunta = function() {
    const loading = document.getElementById("loading");
    const perguntaContainer = document.getElementById("pergunta-container");

    if (loading) loading.style.display = "none";
    if (perguntaContainer) perguntaContainer.style.display = "block";

    const pergunta = this.perguntas[this.perguntaAtual];
    if (!pergunta) return;

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

Quiz.prototype.selecionarResposta = function(index) {
    const opcoes = document.querySelectorAll(".opcao");
    opcoes.forEach(opcao => opcao.classList.remove("selecionada"));
    opcoes[index].classList.add("selecionada");

    document.getElementById("btn-proxima").style.display = "block";
};

Quiz.prototype.responderPergunta = function() {
    const opcaoSelecionada = document.querySelector(".selecionada");
    if (opcaoSelecionada) {
        const respostaIndex = Array.from(document.querySelectorAll(".opcao")).indexOf(opcaoSelecionada);
        this.respostas.push(respostaIndex);
    } else {
        // Se não selecionou nada, registra null para manter índice alinhado
        this.respostas.push(null);
    }
};

Quiz.prototype.proximaPergunta = function() {
    this.responderPergunta();
    this.perguntaAtual++;
    if (this.perguntaAtual < this.perguntas.length) {
        this.exibirPergunta();
        document.getElementById("btn-proxima").style.display = "none";
    } else {
        this.mostrarResultado();
    }
};

Quiz.prototype.mostrarResultado = function() {
    this.responderPergunta();
    const acertos = this.calcularAcertos();
    const containerQuiz = document.querySelector(".container-quiz");

    containerQuiz.innerHTML = `
        <div class="resultado">
            <h2>Resultado do Quiz</h2>
            <p class="pontuacao">Você acertou <strong>${acertos}</strong> de <strong>${this.perguntas.length}</strong> perguntas!</p>
            <div id="erros-container"></div>
            <div id="resumo-container"></div>
            <button id="btn-reiniciar" class="btn-acao">Reiniciar Quiz</button>
        </div>
    `;

    if (acertos < this.perguntas.length) {
        this.mostrarErros();
        this.gerarResumo();
    }

    let btnReiniciar = document.getElementById("btn-reiniciar");
    btnReiniciar.addEventListener("click", () => {
        location.reload();
    });
};

Quiz.prototype.mostrarErros = function() {
    const errosContainer = document.getElementById("erros-container");
    let detalhesHTML = '<div class="secao-erros"><h3>Perguntas que você errou:</h3>';

    this.perguntas.forEach((pergunta, index) => {
        const suaRespostaIndex = this.respostas[index];
        if (pergunta.respostaCorreta !== suaRespostaIndex) {
            detalhesHTML += `
                <div class="erro-item">
                    <p class="erro-pergunta"><strong>Pergunta:</strong> ${pergunta.pergunta}</p>
                    <p class="erro-sua-resposta">
                        <span class="label-erro">Sua resposta:</span> 
                        <span class="resposta-errada">${pergunta.opcoes[suaRespostaIndex] || "Nenhuma resposta"}</span>
                    </p>
                    <p class="erro-resposta-correta">
                        <span class="label-correto">Resposta correta:</span> 
                        <span class="resposta-certa">${pergunta.opcoes[pergunta.respostaCorreta]}</span>
                    </p>
                </div>
            `;
        }
    });

    detalhesHTML += '</div>';
    errosContainer.innerHTML = detalhesHTML;
};

Quiz.prototype.gerarResumo = function() {
    const resumoContainer = document.getElementById("resumo-container");
    resumoContainer.innerHTML = `
        <div class="secao-resumo">
            <h3>Gerando resumo sobre os assuntos que você errou...</h3>
            <div class="loading-resumo">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    // Coletar perguntas erradas (texto)
    let perguntasErradas = [];
    this.perguntas.forEach((pergunta, index) => {
        if (pergunta.respostaCorreta !== this.respostas[index]) {
            perguntasErradas.push(pergunta.pergunta);
        }
    });

    fetch(`${this.urlbase}/gerar_resumo`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            assunto: this.assunto,
            perguntasErradas
        })
    })
    .then(async response => {
        if (!response.ok) {
            const text = await response.text().catch(()=>null);
            throw new Error(`Erro na rota /gerar_resumo: ${response.status} ${text || ""}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data || !data.resumo) {
            throw new Error("Resposta inválida do servidor ao gerar resumo.");
        }
        resumoContainer.innerHTML = `
            <div class="secao-resumo">
                <h3>Resumo dos conceitos:</h3>
                <div class="resumo-texto">${data.resumo}</div>
            </div>
        `;
    })
    .catch(err => {
        console.error("Erro ao gerar resumo:", err);
        resumoContainer.innerHTML = `
            <div class="secao-resumo">
                <h3>Resumo dos conceitos:</h3>
                <p class="erro-resumo">Não foi possível gerar o resumo. Tente novamente mais tarde.</p>
            </div>
        `;
    });
};

Quiz.prototype.calcularAcertos = function() {
    let acertos = 0;
    this.perguntas.forEach((pergunta, index) => {
        if (pergunta.respostaCorreta === this.respostas[index]) {
            acertos++;
        }
    });
    return acertos;
};
