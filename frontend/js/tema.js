
// ======================
// TEMA GLOBAL
// ======================

function aplicarTema() {
    const tema = localStorage.getItem("tema");

    const botao = document.getElementById("temaBtn");

    // Se não houver tema salvo, começa no escuro
    if (tema === "light") {
        document.body.classList.add("light");
        document.documentElement.classList.add("light");

        if (botao) {
            botao.innerHTML = "🌙";
        }
    } else {
        document.body.classList.remove("light");
        document.documentElement.classList.remove("light");

        if (botao) {
            botao.innerHTML = "☀️";
        }
    }
}

function alternarTema() {
    document.body.classList.toggle("light");
    document.documentElement.classList.toggle("light");

    const botao = document.getElementById("temaBtn");

    if (document.body.classList.contains("light")) {
        localStorage.setItem("tema", "light");

        if (botao) {
            botao.innerHTML = "🌙";
        }
    } else {
        localStorage.setItem("tema", "dark");

        if (botao) {
            botao.innerHTML = "☀️";
        }
    }
}

// Aplica o tema quando a página carregar
window.addEventListener("DOMContentLoaded", aplicarTema);
