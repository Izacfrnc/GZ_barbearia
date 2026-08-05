async function cadastrar() {

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const telefone = document.getElementById("telefone").value;
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;


    if (!nome || !email || !telefone || !senha || !confirmarSenha) {

        alert("Preencha todos os campos!");
        return;

    }


    if (senha !== confirmarSenha) {

        alert("As senhas não são iguais!");
        return;

    }


    try {

        const resposta = await fetch("http://localhost:3000/cadastro", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                nome: nome,
                email: email,
                telefone: telefone,
                senha: senha

            })

        });


        const dados = await resposta.json();



        if (resposta.ok) {

            alert("Conta criada com sucesso!");

            window.location.href = "../login.html";

        } else {

            alert(dados.erro);

        }



    } catch (erro) {

        console.error(erro);

        alert("Erro ao conectar com o servidor!");

    }

}



// ======================
// MODO ESCURO / CLARO
// ======================

function alternarTema() {

    document.body.classList.toggle("light");

    const botao = document.getElementById("temaBtn");


    if (document.body.classList.contains("light")) {

        localStorage.setItem("tema", "light");

        botao.innerHTML = "☀️";

    } else {

        localStorage.setItem("tema", "dark");

        botao.innerHTML = "🌙";

    }

}



window.onload = function () {

    const tema = localStorage.getItem("tema");

    const botao = document.getElementById("temaBtn");


    if (tema === "light") {

        document.body.classList.add("light");

        botao.innerHTML = "☀️";

    } else {

        botao.innerHTML = "🌙";

    }

}