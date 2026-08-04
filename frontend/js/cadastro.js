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