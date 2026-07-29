const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "index") {
    iniciarIndex();
  }

  if (page === "dashboard") {
    iniciarDashboard();
  }

  if (page === "cliente") {
    iniciarCliente();
  }

});

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.erro || data.mensagem || "Erro na requisição");
  }

  return data;
}

function formatarData(data) {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR");
}

function criarLinhaVazia(colspan, texto = "Nenhum registro encontrado") {
  return `<tr><td colspan="${colspan}" class="mensagem-vazia">${texto}</td></tr>`;
}

function limparElemento(elemento) {
  if (elemento) {
    elemento.innerHTML = "";
  }
}

/* INDEX */

async function iniciarIndex() {
  const statusApi = document.getElementById("status-api");
  const totalClientes = document.getElementById("total-clientes");
  const totalFuncionarios = document.getElementById("total-funcionarios");
  const totalServicos = document.getElementById("total-servicos");
  const totalAgendamentos = document.getElementById("total-agendamentos");
  const listaAgendamentosHome = document.getElementById("lista-agendamentos-home");

  try {
    const [clientes, funcionarios, servicos, agendamentos] = await Promise.all([
      request("/clientes"),
      request("/funcionarios"),
      request("/servicos"),
      request("/agendamentos")
    ]);

    statusApi.textContent = "Conexão com backend funcionando.";
    totalClientes.textContent = clientes.length;
    totalFuncionarios.textContent = funcionarios.length;
    totalServicos.textContent = servicos.length;
    totalAgendamentos.textContent = agendamentos.length;

    if (!agendamentos.length) {
      listaAgendamentosHome.innerHTML = criarLinhaVazia(6);
      return;
    }

    listaAgendamentosHome.innerHTML = agendamentos.map(item => `
      <tr>
        <td>${item.id_agendamentos}</td>
        <td>${formatarData(item.data)}</td>
        <td>${item.horario}</td>
        <td>${item.cliente}</td>
        <td>${item.servico}</td>
        <td>${item.funcionario}</td>
      </tr>
    `).join("");
  } catch (error) {
    statusApi.textContent = `Erro: ${error.message}`;
    listaAgendamentosHome.innerHTML = criarLinhaVazia(6, "Não foi possível carregar os agendamentos");
  }
}

/* DASHBOARD */

async function iniciarDashboard() {
  configurarFormularioClientes();
  configurarFormularioFuncionarios();
  configurarFormularioServicos();
  configurarFormularioAgendamentos();

  await carregarTudoDashboard();
}

async function carregarTudoDashboard() {
  await Promise.all([
    carregarClientes(),
    carregarFuncionarios(),
    carregarServicos()
  ]);

  await carregarSelectsAgendamento();
  const tabela = document.getElementById("lista-agendamentos");

if (tabela) {
    await carregarAgendamentos();
}
}

/* CLIENTES */

function configurarFormularioClientes() {
  const form = document.getElementById("form-cliente");
  const cancelar = document.getElementById("cancelar-cliente");

  form.addEventListener("submit", salvarCliente);
  cancelar.addEventListener("click", resetarFormularioCliente);
}

async function carregarClientes() {
  const tbody = document.getElementById("lista-clientes");

  try {
    const clientes = await request("/clientes");

    if (!clientes.length) {
      tbody.innerHTML = criarLinhaVazia(4);
      return;
    }

    tbody.innerHTML = clientes.map(cliente => `
      <tr>
        <td>${cliente.id_clientes}</td>
        <td>${cliente.nome}</td>
        <td>${cliente.telefone}</td>
        <td>
          <div class="acoes">
            <button type="button" onclick='editarCliente(${JSON.stringify(cliente)})'>Editar</button>
            <button type="button" class="perigo" onclick='excluirCliente(${cliente.id_clientes})'>Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = criarLinhaVazia(4, error.message);
  }
}

async function salvarCliente(event) {
  event.preventDefault();

  const id = document.getElementById("cliente-id").value;
  const nome = document.getElementById("cliente-nome").value.trim();
  const telefone = document.getElementById("cliente-telefone").value.trim();

  const payload = { nome, telefone };

  try {
    if (id) {
      await request(`/clientes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await request("/clientes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    resetarFormularioCliente();
    await carregarClientes();
    await carregarSelectsAgendamento();
  } catch (error) {
    alert(error.message);
  }
}

function editarCliente(cliente) {
  document.getElementById("cliente-id").value = cliente.id_clientes;
  document.getElementById("cliente-nome").value = cliente.nome;
  document.getElementById("cliente-telefone").value = cliente.telefone;
}

async function excluirCliente(id) {
  if (!confirm("Excluir cliente?")) return;

  try {
    await request(`/clientes/${id}`, { method: "DELETE" });
    await carregarClientes();
    await carregarSelectsAgendamento();
    await carregarAgendamentos();
  } catch (error) {
    alert(error.message);
  }
}

function resetarFormularioCliente() {
  document.getElementById("form-cliente").reset();
  document.getElementById("cliente-id").value = "";
}

/* FUNCIONÁRIOS */

function configurarFormularioFuncionarios() {
  const form = document.getElementById("form-funcionario");
  const cancelar = document.getElementById("cancelar-funcionario");

  form.addEventListener("submit", salvarFuncionario);
  cancelar.addEventListener("click", resetarFormularioFuncionario);
}

async function carregarFuncionarios() {
  const tbody = document.getElementById("lista-funcionarios");

  try {
    const funcionarios = await request("/funcionarios");

    if (!funcionarios.length) {
      tbody.innerHTML = criarLinhaVazia(3);
      return;
    }

    tbody.innerHTML = funcionarios.map(funcionario => `
      <tr>
        <td>${funcionario.id_funcionarios}</td>
        <td>${funcionario.nome}</td>
        <td>
          <div class="acoes">
            <button type="button" onclick='editarFuncionario(${JSON.stringify(funcionario)})'>Editar</button>
            <button type="button" class="perigo" onclick='excluirFuncionario(${funcionario.id_funcionarios})'>Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = criarLinhaVazia(3, error.message);
  }
}

async function salvarFuncionario(event) {
  event.preventDefault();

  const id = document.getElementById("funcionario-id").value;
  const nome = document.getElementById("funcionario-nome").value.trim();

  const payload = { nome };

  try {
    if (id) {
      await request(`/funcionarios/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await request("/funcionarios", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    resetarFormularioFuncionario();
    await carregarFuncionarios();
    await carregarSelectsAgendamento();
  } catch (error) {
    alert(error.message);
  }
}

function editarFuncionario(funcionario) {
  document.getElementById("funcionario-id").value = funcionario.id_funcionarios;
  document.getElementById("funcionario-nome").value = funcionario.nome;
}

async function excluirFuncionario(id) {
  if (!confirm("Excluir funcionário?")) return;

  try {
    await request(`/funcionarios/${id}`, { method: "DELETE" });
    await carregarFuncionarios();
    await carregarSelectsAgendamento();
    await carregarAgendamentos();
  } catch (error) {
    alert(error.message);
  }
}

function resetarFormularioFuncionario() {
  document.getElementById("form-funcionario").reset();
  document.getElementById("funcionario-id").value = "";
}

/* SERVIÇOS */

function configurarFormularioServicos() {
  const form = document.getElementById("form-servico");
  const cancelar = document.getElementById("cancelar-servico");

  form.addEventListener("submit", salvarServico);
  cancelar.addEventListener("click", resetarFormularioServico);
}

async function carregarServicos() {
  const tbody = document.getElementById("lista-servicos");

  try {
    const servicos = await request("/servicos");

    if (!servicos.length) {
      tbody.innerHTML = criarLinhaVazia(3);
      return;
    }

    tbody.innerHTML = servicos.map(servico => `
      <tr>
        <td>${servico.id_servico}</td>
        <td>${servico.tipo}</td>
        <td>
          <div class="acoes">
            <button type="button" onclick='editarServico(${JSON.stringify(servico)})'>Editar</button>
            <button type="button" class="perigo" onclick='excluirServico(${servico.id_servico})'>Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = criarLinhaVazia(3, error.message);
  }
}

async function salvarServico(event) {
  event.preventDefault();

  const id = document.getElementById("servico-id").value;
  const tipo = document.getElementById("servico-tipo").value.trim();

  const payload = { tipo };

  try {
    if (id) {
      await request(`/servicos/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await request("/servicos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    resetarFormularioServico();
    await carregarServicos();
    await carregarSelectsAgendamento();
  } catch (error) {
    alert(error.message);
  }
}

function editarServico(servico) {
  document.getElementById("servico-id").value = servico.id_servico;
  document.getElementById("servico-tipo").value = servico.tipo;
}

async function excluirServico(id) {
  if (!confirm("Excluir serviço?")) return;

  try {
    await request(`/servicos/${id}`, { method: "DELETE" });
    await carregarServicos();
    await carregarSelectsAgendamento();
    await carregarAgendamentos();
  } catch (error) {
    alert(error.message);
  }
}

function resetarFormularioServico() {
  document.getElementById("form-servico").reset();
  document.getElementById("servico-id").value = "";
}

/* AGENDAMENTOS */

function configurarFormularioAgendamentos() {
  const form = document.getElementById("form-agendamento");
  const cancelar = document.getElementById("cancelar-agendamento");
  const verificar = document.getElementById("verificar-disponibilidade");

  form.addEventListener("submit", salvarAgendamento);
  cancelar.addEventListener("click", resetarFormularioAgendamento);
  verificar.addEventListener("click", verificarDisponibilidade);
}

async function carregarAgendamentos() {
  const tbody = document.getElementById("lista-agendamentos");

  try {
    const agendamentos = await request("/agendamentos");

    if (!agendamentos.length) {
      tbody.innerHTML = criarLinhaVazia(7);
      return;
    }

    tbody.innerHTML = agendamentos.map(item => `
      <tr>
        <td>${item.id_agendamentos}</td>
        <td>${formatarData(item.data)}</td>
        <td>${item.horario}</td>
        <td>${item.cliente}</td>
        <td>${item.servico}</td>
        <td>${item.funcionario}</td>
        <td>
          <div class="acoes">
            <button type="button" onclick='editarAgendamento(${JSON.stringify(item)})'>Editar</button>
            <button type="button" class="perigo" onclick='excluirAgendamento(${item.id_agendamentos})'>Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = criarLinhaVazia(7, error.message);
  }
}

async function carregarSelectsAgendamento() {
  const [clientes, servicos, funcionarios] = await Promise.all([
    request("/clientes"),
    request("/servicos"),
    request("/funcionarios")
  ]);

  const selectCliente = document.getElementById("agendamento-cliente");
  const selectServico = document.getElementById("agendamento-servico");
  const selectFuncionario = document.getElementById("agendamento-funcionario");

  if (!selectCliente || !selectServico || !selectFuncionario) return;

  selectCliente.innerHTML = '<option value="">Selecione</option>' + clientes.map(cliente =>
    `<option value="${cliente.id_clientes}">${cliente.id_clientes} - ${cliente.nome}</option>`
  ).join("");

  selectServico.innerHTML = '<option value="">Selecione</option>' + servicos.map(servico =>
    `<option value="${servico.id_servico}">${servico.id_servico} - ${servico.tipo}</option>`
  ).join("");

  selectFuncionario.innerHTML = '<option value="">Selecione</option>' + funcionarios.map(funcionario =>
    `<option value="${funcionario.id_funcionarios}">${funcionario.id_funcionarios} - ${funcionario.nome}</option>`
  ).join("");
}

async function salvarAgendamento(event) {
  event.preventDefault();

  const id = document.getElementById("agendamento-id").value;
  const data = document.getElementById("agendamento-data").value;
  const horario = document.getElementById("agendamento-horario").value;
  const clientes_id_clientes = document.getElementById("agendamento-cliente").value;
  const servico_id_servico = document.getElementById("agendamento-servico").value;
  const funcionarios_id_funcionarios = document.getElementById("agendamento-funcionario").value;

  const payload = {
    data,
    horario,
    clientes_id_clientes,
    servico_id_servico,
    funcionarios_id_funcionarios
  };

  try {
    if (id) {
      await request(`/agendamentos/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await request("/agendamentos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    resetarFormularioAgendamento();
    await carregarAgendamentos();
    limparListaDisponibilidade();
  } catch (error) {
    alert(error.message);
  }
}

function editarAgendamento(item) {
  document.getElementById("agendamento-id").value = item.id_agendamentos;
  document.getElementById("agendamento-data").value = item.data ? item.data.split("T")[0] : "";
  document.getElementById("agendamento-horario").value = item.horario;
  document.getElementById("agendamento-cliente").value = item.clientes_id_clientes;
  document.getElementById("agendamento-servico").value = item.servico_id_servico;
  document.getElementById("agendamento-funcionario").value = item.funcionarios_id_funcionarios;
}

async function excluirAgendamento(id) {
  if (!confirm("Excluir agendamento?")) return;

  try {
    await request(`/agendamentos/${id}`, { method: "DELETE" });
    await carregarAgendamentos();
    limparListaDisponibilidade();
  } catch (error) {
    alert(error.message);
  }
}

function resetarFormularioAgendamento() {
  document.getElementById("form-agendamento").reset();
  document.getElementById("agendamento-id").value = "";
  limparListaDisponibilidade();
}

async function verificarDisponibilidade() {
  const data = document.getElementById("agendamento-data").value;
  const funcionarioId = document.getElementById("agendamento-funcionario").value;
  const lista = document.getElementById("lista-disponibilidade");

  if (!data || !funcionarioId) {
    alert("Selecione data e funcionário.");
    return;
  }

  try {
    const horarios = await request(`/disponibilidade?data=${data}&funcionarioId=${funcionarioId}`);
    limparElemento(lista);

    if (!horarios.length) {
      lista.innerHTML = "<li>Nenhum horário ocupado nessa data.</li>";
      return;
    }

    lista.innerHTML = horarios.map(item => `<li>${item.horario}</li>`).join("");
  } catch (error) {
    alert(error.message);
  }
}

function limparListaDisponibilidade() {
  const lista = document.getElementById("lista-disponibilidade");
  if (lista) {
    lista.innerHTML = "";
  }
}

const botao = document.getElementById("tema");

const temaSalvo = localStorage.getItem("tema");

if (temaSalvo === "dark") {
    document.body.classList.add("dark");
    botao.textContent = "☀️";
}

botao.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {

        localStorage.setItem("tema", "dark");
        botao.textContent = "☀️";

    } else {

        localStorage.setItem("tema", "light");
        botao.textContent = "🌙";

    }

});


async function iniciarCliente() {
    configurarFormularioClientes();
    configurarFormularioAgendamentos();
    await carregarClientes();
    await carregarSelectsAgendamento();

    const tabela = document.getElementById("lista-agendamentos");

    if (tabela) {
        await carregarAgendamentos();
    }
}