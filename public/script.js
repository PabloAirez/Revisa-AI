// Aqui, eu capturo os elementos DOM necessários 

const btnComecar = document.querySelector("#comecar");
const inputAssunto = document.querySelector("#assunto");
const inputDificuldade = document.querySelector("#dificuldade");
const inputTemporizado = document.querySelector("#temporizado");

// Achei legal deixar a opção de começar o quiz tanto com o clique no botão quanto com a tecla "Enter"
btnComecar.addEventListener("click", comecarQuiz);
document.addEventListener("keydown", comecarQuiz);

function comecarQuiz(e) {
    if ((e.type === "keydown" && e.key === "Enter") || e.type === "click") { // Verifico se o evento é um clique ou a tecla "Enter"
        const assunto = inputAssunto.value;
        const dificuldade = inputDificuldade.value;
        const temporizado = inputTemporizado && inputTemporizado.checked;

        let novoQuiz;
        if (temporizado) {
              // Como eu tenho dois objetos de quiz (um temporizado e outro não), eu verifico qual deles deve ser instanciado
            novoQuiz = new QuizTemporizado(assunto, dificuldade, 20);
        } else {
              // Instancio o quiz normal
            novoQuiz = new Quiz(assunto, dificuldade);
        }

        novoQuiz.comecarQuiz();
        // Evita que o quiz seja reiniciado a cada click do Enter
        removerEventos();
    }
}

function removerEventos() {
    document.removeEventListener("keydown", comecarQuiz);
    btnComecar.removeEventListener("click", comecarQuiz);
}
