// Objeto literal que armazena as configurações da API

const API_CONFIG = {
    local: "http://localhost:3000",
    producao: "https://revisa-ai.onrender.com",
    rotas: {
        gerarPerguntas: "/gerar_perguntas",
        gerarResumo: "/gerar_resumo"
    }
};

// Objeto literal que armazena as constantes do aplicativo, neste caso, as mensagens de erro
const APP_CONSTANTS = {
    mensagens: {
        erroGerarPerguntas: "Houve um erro ao gerar as perguntas do quiz. Por favor, tente novamente.",
        erroGerarResumo: "Não foi possível gerar o resumo. Tente novamente mais tarde."
    }
};

// Função para exibir o toast de notificações sem aquela coisa horrível de alert
function mostrarToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    // Adiciona a classe para animação de entrada
    requestAnimationFrame(function () {
        toast.classList.add("visible");
    });


    // Espera 3 segundos com a mensagem em tela e depois remove ela
    setTimeout(function () {
        toast.classList.remove("visible");
        setTimeout(function () {
            toast.remove();
        }, 300);
    }, 8000);
}

// Classe construtora para Pergunta
function Pergunta(texto, opcoes, respostaCorreta) {
    this.texto = texto;
    this.opcoes = opcoes;
    this.respostaCorreta = respostaCorreta;
}

// Classe construtora para Usuario. Eu poderia usar ela futuramente para caso tenha um sistema de login
function Usuario(nome) {
    this.nome = nome;
    this.historicoQuizzes = [];
}

// Adiciona um método para adicionar resultados ao histórico do usuário
Usuario.prototype.adicionarResultado = function (assunto, acertos, total) {
    this.historicoQuizzes.push({
        assunto: assunto,
        acertos: acertos,
        total: total,
        data: new Date()
    });
};


// Classe construtora para Quiz
function Quiz(assunto, dificuldade) {
    this.assunto = assunto;
    this.dificuldade = dificuldade;
    this.comecou = false;
    this.perguntaAtual = 0;
    this.perguntas = [];
    this.respostas = [];
    this.usuario = new Usuario("Convidado"); // Como ainda não tem login, o usuário é sempre "Convidado"
    this.urlbase = API_CONFIG.producao; // Aqui eu faria uma lógica para alternar entre local e produção 
    // mas como não sei se terei node na apresentação, deixei fixo para produção
}

// Adiciono via protótipo o método começar quiz
Quiz.prototype.comecarQuiz = function () {
    this.comecou = true;
    this.esconderTelaInicial();
    this.criarLayoutQuiz();
    esperar(500)
        .then(() => {
            this.carregarPerguntas();
        })
        .catch(() => {
            mostrarToast(APP_CONSTANTS.mensagens.erroGerarPerguntas);
        })
        .finally(() => {
        });
};

// Método para esconder a tela inicial com animação 
Quiz.prototype.esconderTelaInicial = function () {
    const telaInicial = document.querySelector(".tela-inicial");
    if (!telaInicial) return;
    telaInicial.style.animation = "fadeout 0.5s ease-out forwards";
    setTimeout(function () {
        telaInicial.style.display = "none";
    }, 500);
};


// Método para criar o layout do quiz dinamicamente
Quiz.prototype.criarLayoutQuiz = function () {
    let containerQuiz = document.querySelector(".container-quiz"); 
    if (!containerQuiz) {
        containerQuiz = document.createElement("div");
        containerQuiz.className = "container-quiz";
        containerQuiz.innerHTML = `
            <div class="quiz-header">
                <h2 id="quiz-assunto"></h2>
                <div class="progresso" id="pergunta-numero"></div>
            </div>
            <div class="quiz-body">
                <div class="loading" id="loading">Gerando perguntas sobre o assunto...</div>
                <div class="pergunta-container" id="pergunta-container" style="display:none;">
                    <div id="pergunta-texto"></div>
                    <div class="opcoes-container" id="opcoes-container"></div>
                </div>
            </div>
            <div class="quiz-footer">
                <button class="btn-acao" id="btn-proximo" disabled>Próxima</button>
            </div>
        `;
        document.body.appendChild(containerQuiz);
        setTimeout(function () { // Pequeno delay para garantir que o CSS de transição funcione
            containerQuiz.style.opacity = "1";
        }, 10);
    }

    const tituloAssunto = document.getElementById("quiz-assunto");
    if (tituloAssunto) {
        tituloAssunto.textContent = this.assunto || "Assunto do Quiz";
    }

    const btnProximo = document.getElementById("btn-proximo");
    if (btnProximo) {
        btnProximo.onclick = () => this.proximaPergunta(); // Usei o arrow function para manter o contexto do 'this'
        // se não o contexto seria o botão e não o objeto Quiz
    }
};

// Muda o número da pergunta atual no progresso
Quiz.prototype.atualizarProgresso = function () {
    const element = document.getElementById("pergunta-numero");
    if (element) {
        element.textContent = `Pergunta ${this.perguntaAtual + 1} de ${this.perguntas.length}`;
    }
};

// Cria o elemento da pergunta e das opções
Quiz.prototype.exibirPergunta = function () {
    const loading = document.getElementById("loading");
    const perguntaContainer = document.getElementById("pergunta-container");

    if (loading) loading.style.display = "none"; // Esconde o loading
    if (perguntaContainer) perguntaContainer.style.display = "block"; // Mostra o container da pergunta

    const pergunta = this.perguntas[this.perguntaAtual]; // Pega a pergunta atual
    if (!pergunta) return;

    const perguntaTextoEl = document.getElementById("pergunta-texto");
    if (perguntaTextoEl) {
        perguntaTextoEl.textContent = pergunta.texto; // Define o texto da pergunta
    }

    const opcoesContainer = document.getElementById("opcoes-container"); 
    if (!opcoesContainer) return;

    opcoesContainer.innerHTML = "";

    pergunta.opcoes.forEach((opcao, index) => { 
        // Para cada opcao, cria um botão
        const botaoOpcao = document.createElement("button");
        botaoOpcao.className = "opcao";
        botaoOpcao.textContent = opcao;
        botaoOpcao.onclick = () => this.selecionarResposta(index);
        // mesmo caso de contexto do botão próximo, uso arrow function para manter o 'this' correto
        opcoesContainer.appendChild(botaoOpcao);
    });


    const btnProximo = document.getElementById("btn-proximo");
    if (btnProximo) {
        btnProximo.disabled = true; // Começa desabilitado até o usuário selecionar uma resposta
        btnProximo.textContent = this.perguntaAtual === this.perguntas.length - 1 ? "Finalizar" : "Próxima";
    }

    this.atualizarProgresso();
};


Quiz.prototype.selecionarResposta = function (indiceOpcao) {
    this.respostas[this.perguntaAtual] = indiceOpcao; // Armazena a resposta do usuário

    const opcoes = document.querySelectorAll(".opcao");
    opcoes.forEach(function (opcao, index) {
        opcao.classList.toggle("selecionada", index === indiceOpcao);
        // Adiciona a classe 'selecionada' para mostrar visualmente qual foi a opção escolhida
    });

    const btnProximo = document.getElementById("btn-proximo");
    if (btnProximo) {
        btnProximo.disabled = false; // Só depois habilita o botão de próxima
    }
};

// Avança para a próxima pergunta ou finaliza o quiz
Quiz.prototype.proximaPergunta = function () {
    if (typeof this.respostas[this.perguntaAtual] === "undefined") {
        return;
    }

    this.perguntaAtual++;

    if (this.perguntaAtual < this.perguntas.length) { // Se ainda houverem perguntas...
        this.exibirPergunta();
    } else {
        this.finalizarQuiz();
    }
};

// Essa função é o gran finale do quiz, onde mostro o resultado e o resumo
Quiz.prototype.finalizarQuiz = function () {
    const containerQuiz = document.querySelector(".container-quiz");
    if (containerQuiz) {
       containerQuiz.innerHTML = "";
       containerQuiz.style.display = "flex";
       containerQuiz.style.opacity = "1";
    }

    let containerResultado = document.querySelector(".resultado");
    if (!containerResultado) {
        containerResultado = document.createElement("div");
        containerResultado.className = "resultado";
        containerQuiz.appendChild(containerResultado); 
    }


    const acertos = this.calcularAcertos();
    const total = this.perguntas.length;

    this.usuario.adicionarResultado(this.assunto, acertos, total);

    const perguntasErradas = [];
    this.perguntas.forEach((pergunta, index) => {
        if (pergunta.respostaCorreta !== this.respostas[index]) {
            // Compara a reposta correta (indice da opção correta) com a resposta do usuário
            perguntasErradas.push({ // Armazena detalhes da pergunta errada
                pergunta: pergunta.texto,
                suaResposta: typeof this.respostas[index] === "number" && this.respostas[index] >= 0 
                    ? pergunta.opcoes[this.respostas[index]] 
                    : "Não respondida",
                respostaCorreta: pergunta.opcoes[pergunta.respostaCorreta]
            });
        }
    });

    const listaErrosHtml = perguntasErradas.map(function (erro) {
        // Gera o HTML para cada pergunta errada
        return `
        <div class="erro-item">
            <p class="erro-pergunta">${erro.pergunta}</p>
            <p class="erro-sua-resposta">
                <span class="label-erro">Sua resposta:</span>
                <span class="resposta-errada">${erro.suaResposta}</span>
            </p>
            <p class="erro-resposta-correta">
                <span class="label-correto">Resposta correta:</span>
                <span class="resposta-certa">${erro.respostaCorreta}</span>
            </p>
        </div>
    `;
    }).join("");

    containerResultado.innerHTML = `
        <h2>Seu resultado</h2>
        <div class="pontuacao">
            Você acertou ${acertos} de ${total} perguntas.
        </div>
        <div class="secao-erros">
            <h3>Perguntas que você errou:</h3>
            ${listaErrosHtml || "<p>Parabéns, você acertou todas as perguntas!</p>"}
        </div>
        <div class="secao-resumo" id="resumo-container"></div>
        <div style="text-align:center; margin-top:20px;">
            <button class="btn-acao" id="btn-recomecar">Recomeçar</button>
        </div>
    `;

    const btnRecomecar = document.getElementById("btn-recomecar");
    if (btnRecomecar) {
        btnRecomecar.onclick = function () {
            location.reload(); // Recarrega a página, zerando o estado do quiz
        };
    }

    this.gerarResumo();
};


// Calcula o número de acertos do usuário
Quiz.prototype.calcularAcertos = function () {
    let acertos = 0;
    this.perguntas.forEach((pergunta, index) => {
        if (pergunta.respostaCorreta === this.respostas[index]) {
            // O index da resposta correta é comparado com o index da resposta do usuário
            acertos++;
        }
    });
    return acertos;
};

// Gera o resumo das perguntas erradas chamando a API, que consulta o Gemini
Quiz.prototype.gerarResumo = async function () {
    const resumoContainer = document.getElementById("resumo-container");
    if (!resumoContainer) return;

    resumoContainer.innerHTML = `
        <h3>Gerando resumo sobre os assuntos que você errou...</h3>
        <div class="loading-resumo">
            <div class="spinner"></div>
        </div>
    `;

    const perguntasErradas = [];
    this.perguntas.forEach((pergunta, index) => {
        if (pergunta.respostaCorreta !== this.respostas[index]) {
            perguntasErradas.push(pergunta.texto);
        }
    });

    try { // Chama a API para gerar o resumo
        const response = await fetch(`${this.urlbase}${API_CONFIG.rotas.gerarResumo}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                assunto: this.assunto,
                perguntasErradas: perguntasErradas
            })
        });

        if (!response.ok) { // Se a resposta não for OK, lança um erro
            const text = await response.text().catch(function () { return null; }); // Tenta pegar o texto da resposta
            throw new Error(`Erro na rota /gerar_resumo: ${response.status} ${text || ""}`); // Lança o erro com detalhes
        }

        const data = await response.json(); // Tenta converter a resposta para JSON

        if (!data || !data.resumo) { // Verifica se o JSON tem o campo esperado
            throw new Error("Resposta inválida do servidor ao gerar resumo.");
        }

        resumoContainer.innerHTML = `
            <h3>Resumo dos conceitos:</h3>
            <div class="resumo-texto">${data.resumo}</div>
        `;
    } catch (err) { // Em caso de erro, mostra a mensagem de erro no resumo e um toast
        resumoContainer.innerHTML = `
            <h3>Resumo dos conceitos:</h3>
            <p class="erro-resumo">${APP_CONSTANTS.mensagens.erroGerarResumo}</p>
        `;
        mostrarToast(APP_CONSTANTS.mensagens.erroGerarResumo);
    }
};

// Carrega as perguntas do quiz chamando a API
Quiz.prototype.carregarPerguntas = async function () {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "block";

    try {
        const response = await fetch(`${this.urlbase}${API_CONFIG.rotas.gerarPerguntas}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                assunto: this.assunto,
                dificuldade: this.dificuldade
            })
        });

        if (!response.ok) { // Se a resposta não for OK, lança um erro
            const text = await response.text().catch(function () { return null; });
            throw new Error(`Erro na rota /gerar_perguntas: ${response.status} ${text || ""}`);
        }

        const data = await response.json(); // Tenta converter a resposta para JSON

        if (!data || !data.perguntas) { // Verifica se o JSON tem o campo esperado
            throw new Error("Resposta inválida do servidor ao gerar perguntas.");
        }

        this.perguntas = data.perguntas.map(function (p) {
            // Essa parte é linda, ele pega a resposta da API e instancia um objeto Pergunta para cada uma
            return new Pergunta(p.pergunta, p.opcoes, p.respostaCorreta);
        });

        this.exibirPergunta(); // E chama o método para exibir a primeira pergunta
    } catch (err) { // Claro, sempre pode dar erro, então eu capturo aqui e exibo no toast
        if (loading) {
            loading.innerHTML = `<p class="erro">Não foi possível gerar as perguntas. Tente novamente mais tarde.</p>`;
        }
        mostrarToast(APP_CONSTANTS.mensagens.erroGerarPerguntas);
    }
};

// Tem a opção de quiz temporizado, que herda da classe Quiz. O funcionamento é quase
// igual, mas tem o timer para cada pergunta

function QuizTemporizado(assunto, dificuldade, tempoPorPergunta) {
    Quiz.call(this, assunto, dificuldade); // Chama o construtor da classe pai
    this.tempoPorPergunta = tempoPorPergunta; // Tempo em segundos para cada pergunta
    this.intervalo = null; // Armazena o intervalo do timer
}

QuizTemporizado.prototype = Object.create(Quiz.prototype); // Herda os métodos da classe Quiz
QuizTemporizado.prototype.constructor = QuizTemporizado; // Especifica que ele deve usar o construtor QuizTemporizado

// Aqui, eu sobrescrevo o método exibirPergunta para implementar a lógica do timer
QuizTemporizado.prototype.exibirPergunta = function () {
    Quiz.prototype.exibirPergunta.call(this);
    this.criarElementoTimer(); // Cria o elemento visual do timer
    this.iniciarTimer();
};

// Cria o elemento HTML para exibir o timer na tela
QuizTemporizado.prototype.criarElementoTimer = function () {
    const perguntaContainer = document.getElementById("pergunta-container");
    if (!perguntaContainer) return;
    
    // Remove timer anterior se existir
    const timerAntigo = document.getElementById("timer-display");
    if (timerAntigo) {
        timerAntigo.remove();
    }
    
    // Cria o novo elemento do timer
    const timerElement = document.createElement("div");
    timerElement.id = "timer-display";
    timerElement.className = "timer-display";
    timerElement.innerHTML = `
        <div class="timer-icon">⏱️</div>
        <div class="timer-texto">Tempo restante: <span id="timer-segundos">${this.tempoPorPergunta}</span>s</div>
    `;
    
    // Insere o timer antes do texto da pergunta
    const perguntaTexto = document.getElementById("pergunta-texto");
    if (perguntaTexto) {
        perguntaContainer.insertBefore(timerElement, perguntaTexto);
    }
};

// Cria um intervalo que decrementa o tempo restante e avança automaticamente se o tempo acabar
QuizTemporizado.prototype.iniciarTimer = function () {
    if (this.intervalo) clearInterval(this.intervalo);
    let tempoRestante = this.tempoPorPergunta; // Tempo em segundos
    const timerSegundos = document.getElementById("timer-segundos");
    const timerDisplay = document.getElementById("timer-display");
    
    this.intervalo = setInterval(() => { // Verifica o tempo restante a cada segundo
        tempoRestante--;
        
        // Atualiza o texto do timer
        if (timerSegundos) {
            timerSegundos.textContent = tempoRestante;
        }
        
        // Adiciona classe de alerta quando restam 5 segundos ou menos
        if (timerDisplay && tempoRestante <= 5) {
            timerDisplay.classList.add("timer-alerta");
        }
        
        if (tempoRestante <= 0) { // Se acabou o tempo, já era meu querido, passa para a próxima
            clearInterval(this.intervalo);
            
            // Se o usuário não respondeu, marca como não respondida
            if (typeof this.respostas[this.perguntaAtual] === "undefined") {
                this.respostas[this.perguntaAtual] = -1; // -1 indica que não foi respondida
            }
            
            // Avança para a próxima pergunta
            this.proximaPergunta();
        }
    }, 1000);
};

// Sobrescreve o método proximaPergunta para limpar o intervalo do timer
QuizTemporizado.prototype.proximaPergunta = function () {
    if (this.intervalo) {
        clearInterval(this.intervalo); // Limpa o timer antes de avançar
    }
    Quiz.prototype.proximaPergunta.call(this); // Chama o método da classe pai
};


function esperar(ms) {
    return new Promise(function (resolve, reject) {
        if (ms < 0) {
            reject(new Error("Tempo inválido"));
            return;
        }
        setTimeout(function () {
            resolve("Concluído");
        }, ms);
    });
}