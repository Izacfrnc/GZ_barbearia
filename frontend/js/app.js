const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  console.log("Página inicializada:", page);

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
  const fetchOptions = {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  };

  console.log("API request", url, fetchOptions);

  let response;
  try {
    response = await fetch(`${API_URL}${url}`, fetchOptions);
  } catch (error) {
    console.error("Fetch falhou", error);
    throw new Error("Não foi possível conectar ao backend. Verifique se o servidor está rodando.");
  }

  const data = await response.json().catch(() => ({}));
  console.log("API response", url, response.status, data);

  if (!response.ok) {
    console.error("API error", url, response.status, data);
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

    if (statusApi) statusApi.textContent = "Conexão com backend funcionando.";
    if (totalClientes) totalClientes.textContent = clientes.length;
    if (totalFuncionarios) totalFuncionarios.textContent = funcionarios.length;
    if (totalServicos) totalServicos.textContent = servicos.length;
    if (totalAgendamentos) totalAgendamentos.textContent = agendamentos.length;

    if (!agendamentos.length) {
      if (listaAgendamentosHome) listaAgendamentosHome.innerHTML = criarLinhaVazia(6);
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
  if (!form) return;

  form.addEventListener("submit", salvarCliente);
  if (cancelar) cancelar.addEventListener("click", resetarFormularioCliente);
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

  if (!nome || !telefone) {
    alert("Preencha nome e telefone para salvar o cliente.");
    return;
  }

  const payload = { nome, telefone };
  console.log("Salvar cliente submit", { id, payload });

  try {
    const response = id
      ? await request(`/clientes/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        })
      : await request("/clientes", {
          method: "POST",
          body: JSON.stringify(payload)
        });

    console.log("Salvar cliente resposta", response);
    resetarFormularioCliente();
    await carregarClientes();
    await carregarSelectsAgendamento();
  } catch (error) {
    console.error("Salvar cliente erro", error);
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
  if (!form) return;

  form.addEventListener("submit", salvarFuncionario);
  if (cancelar) cancelar.addEventListener("click", resetarFormularioFuncionario);
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

  if (!nome) {
    alert("Preencha o nome do funcionário.");
    return;
  }

  const payload = { nome };
  console.log("Salvar funcionario submit", { id, payload });

  try {
    const response = id
      ? await request(`/funcionarios/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        })
      : await request("/funcionarios", {
          method: "POST",
          body: JSON.stringify(payload)
        });

    console.log("Salvar funcionario resposta", response);
    resetarFormularioFuncionario();
    await carregarFuncionarios();
    await carregarSelectsAgendamento();
  } catch (error) {
    console.error("Salvar funcionario erro", error);
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
  if (!form) return;

  form.addEventListener("submit", salvarServico);
  if (cancelar) cancelar.addEventListener("click", resetarFormularioServico);
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

  if (!tipo) {
    alert("Preencha o tipo de serviço.");
    return;
  }

  const payload = { tipo };
  console.log("Salvar servico submit", { id, payload });

  try {
    const response = id
      ? await request(`/servicos/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        })
      : await request("/servicos", {
          method: "POST",
          body: JSON.stringify(payload)
        });

    console.log("Salvar servico resposta", response);
    resetarFormularioServico();
    await carregarServicos();
    await carregarSelectsAgendamento();
  } catch (error) {
    console.error("Salvar servico erro", error);
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
  if (!form) return;

  const cancelar = document.getElementById("cancelar-agendamento");
  const verificar = document.getElementById("verificar-disponibilidade");
  const dataInput = document.getElementById("agendamento-data");
  const funcionarioInput = document.getElementById("agendamento-funcionario");
  const horarioSelect = document.getElementById("agendamento-horario");
  const horarioEhSelect = horarioSelect && horarioSelect.tagName === "SELECT";

  form.addEventListener("submit", salvarAgendamento);
  if (cancelar) cancelar.addEventListener("click", resetarFormularioAgendamento);
  if (verificar) verificar.addEventListener("click", verificarDisponibilidade);

  if (dataInput && funcionarioInput && horarioEhSelect) {
    dataInput.addEventListener("change", () => carregarHorariosDisponiveis());
    funcionarioInput.addEventListener("change", () => carregarHorariosDisponiveis());
  }
}

async function carregarAgendamentos() {
  const tbody = document.getElementById("lista-agendamentos");
  if (!tbody) return;

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

  carregarHorariosDisponiveis();
}

function horarioValido(horario) {
  if (!horario) return false;
  const [h, m] = horario.split(":").map(Number);
  if ([h, m].some(n => Number.isNaN(n))) return false;
  const total = h * 60 + m;
  const emIntervaloManha = total >= 450 && total <= 660; // 07:30 a 11:00
  const emIntervaloTarde = total >= 810 && total <= 1110; // 13:30 a 18:30
  return (emIntervaloManha || emIntervaloTarde) && m % 30 === 0;
}

function gerarHorariosPadrao() {
  const horarios = [];
  const adicionarIntervalos = (inicio, fim) => {
    let total = inicio;
    while (total <= fim) {
      const horas = String(Math.floor(total / 60)).padStart(2, "0");
      const minutos = String(total % 60).padStart(2, "0");
      horarios.push(`${horas}:${minutos}`);
      total += 30;
    }
  };

  adicionarIntervalos(450, 660); // 07:30 a 11:00
  adicionarIntervalos(810, 1110); // 13:30 a 18:30
  return horarios;
}

function preencherSelectHorario(horariosOcupados, horarioAtual = "") {
  const select = document.getElementById("agendamento-horario");
  if (!select || select.tagName !== "SELECT") return;

  const horarios = gerarHorariosPadrao();
  const disponiveis = horarios.filter(h => !horariosOcupados.includes(h) || h === horarioAtual);

  if (!disponiveis.length) {
    select.innerHTML = `<option value="">Nenhum horário disponível</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = `<option value="">Selecione um horário</option>` + disponiveis.map(h =>
    `<option value="${h}"${h === horarioAtual ? " selected" : ""}>${h}</option>`
  ).join("");
}

async function carregarHorariosDisponiveis(horarioAtual = "") {
  const data = document.getElementById("agendamento-data")?.value;
  const funcionarioId = document.getElementById("agendamento-funcionario")?.value;
  const lista = document.getElementById("lista-disponibilidade");
  const horarioSelect = document.getElementById("agendamento-horario");

  if (!data || !funcionarioId) {
    if (horarioSelect && horarioSelect.tagName === "SELECT") {
      horarioSelect.innerHTML = `<option value="">Selecione data e funcionário</option>`;
      horarioSelect.disabled = true;
    }
    return;
  }

  try {
    const horarios = await request(`/disponibilidade?data=${data}&funcionarioId=${funcionarioId}`);
    const ocupados = horarios.map(item => item.horario);
    preencherSelectHorario(ocupados, horarioAtual);

    if (lista) {
      limparElemento(lista);
      if (!ocupados.length) {
        lista.innerHTML = "<li>Nenhum horário ocupado nessa data.</li>";
      } else {
        lista.innerHTML = ocupados.map(item => `<li>${item.horario}</li>`).join("");
      }
    }
  } catch (error) {
    alert(error.message);
  }
}

async function salvarAgendamento(event) {
  event.preventDefault();

  const id = document.getElementById("agendamento-id").value;
  const data = document.getElementById("agendamento-data").value;
  const horario = document.getElementById("agendamento-horario").value;
  const clientes_id_clientes = document.getElementById("agendamento-cliente").value;
  const servico_id_servico = document.getElementById("agendamento-servico").value;
  const funcionarios_id_funcionarios = document.getElementById("agendamento-funcionario").value;

  if (!data || !horario || !clientes_id_clientes || !servico_id_servico || !funcionarios_id_funcionarios) {
    alert("Preencha todos os campos do agendamento antes de enviar.");
    return;
  }

  if (!horarioValido(horario)) {
    alert("Horário inválido. Escolha um horário entre 07:30 e 11:30 ou entre 13:30 e 19:00, em intervalos de 30 minutos.");
    return;
  }

  const payload = {
    data,
    horario,
    clientes_id_clientes,
    servico_id_servico,
    funcionarios_id_funcionarios
  };
  console.log("Salvar agendamento submit", { id, payload });

  try {
    const response = id
      ? await request(`/agendamentos/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        })
      : await request("/agendamentos", {
          method: "POST",
          body: JSON.stringify(payload)
        });

    console.log("Salvar agendamento resposta", response);
    resetarFormularioAgendamento();
    await carregarAgendamentos();
    limparListaDisponibilidade();
  } catch (error) {
    alert(error.message);
  }
}

async function editarAgendamento(item) {
  document.getElementById("agendamento-id").value = item.id_agendamentos;
  document.getElementById("agendamento-data").value = item.data ? item.data.split("T")[0] : "";
  document.getElementById("agendamento-cliente").value = item.clientes_id_clientes;
  document.getElementById("agendamento-servico").value = item.servico_id_servico;
  document.getElementById("agendamento-funcionario").value = item.funcionarios_id_funcionarios;
  await carregarHorariosDisponiveis(item.horario);
  document.getElementById("agendamento-horario").value = item.horario;
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
  const data = document.getElementById("agendamento-data")?.value;
  const funcionarioId = document.getElementById("agendamento-funcionario")?.value;
  const lista = document.getElementById("lista-disponibilidade");

  if (!data || !funcionarioId) {
    alert("Selecione data e funcionário.");
    return;
  }

  try {
    const horarios = await request(`/disponibilidade?data=${data}&funcionarioId=${funcionarioId}`);
    if (lista) {
      limparElemento(lista);

      if (!horarios.length) {
        lista.innerHTML = "<li>Nenhum horário ocupado nessa data.</li>";
        return;
      }

      lista.innerHTML = horarios.map(item => `<li>${item.horario}</li>`).join("");
    }
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
const temaAtivo = temaSalvo === "dark" || temaSalvo === "escuro";

if (temaAtivo) {
    document.body.classList.add("dark");
    if (botao) {
        botao.textContent = "☀️";
    }
}

if (botao) {
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
}

async function iniciarCliente() {
  configurarFormularioClientes();
  configurarFormularioAgendamentos();
  await carregarSelectsAgendamento();
}