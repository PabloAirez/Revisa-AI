// Primeiro, seleciono os elementos do DOM
const btnComecar = document.querySelector("#comecar");
const inputAssunto = document.querySelector("#assunto");
const inputDificuldade = document.querySelector("#dificuldade");

/* Adiciona os eventos de click e keydown para saber 
quando o cara quer iniciar o quiz
*/
btnComecar.addEventListener("click", comecarQuiz);
document.addEventListener("keydown", comecarQuiz);


/* Função que inicia o quiz com base no assunto e dificuldade selecionados
*/
function comecarQuiz(e) {
       if ((e.type === "keydown" && e.key === "Enter") || e.type === "click") {
              const novoQuiz = new Quiz(inputAssunto.value, inputDificuldade.value);
              novoQuiz.comecarQuiz();
              removerEventos();
       }

}

/*Remove os eventos para evitar múltiplos inícios*/

function removerEventos(){
    document.body.removeEventListener("keydown", comecarQuiz);
    btnComecar.removeEventListener("click", comecarQuiz);
}