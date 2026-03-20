const express = require("express");
const router = express.Router();
const db = require("./db");

const erro500 = (res, error) => res.status(500).json({ erro: error.message });

async function listar(res, tabela) {
  try {
    const [rows] = await db.query(`SELECT * FROM ${tabela}`);
    res.json(rows);
  } catch (error) {
    erro500(res, error);
  }
}

async function criar(req, res, tabela, campos) {
  try {
    const valores = campos.map(c => req.body[c]);

    if (valores.some(v => v === undefined || v === null || v === "")) {
      return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const sql = `
      INSERT INTO ${tabela} (${campos.join(", ")})
      VALUES (${campos.map(() => "?").join(", ")})
    `;

    const [result] = await db.query(sql, valores);
    res.status(201).json({ mensagem: "Criado com sucesso", id: result.insertId });
  } catch (error) {
    erro500(res, error);
  }
}

async function atualizar(req, res, tabela, idCampo, campos) {
  try {
    const { id } = req.params;
    const valores = campos.map(c => req.body[c]);

    if (valores.some(v => v === undefined || v === null || v === "")) {
      return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const sql = `
      UPDATE ${tabela}
      SET ${campos.map(c => `${c} = ?`).join(", ")}
      WHERE ${idCampo} = ?
    `;

    const [result] = await db.query(sql, [...valores, id]);

    if (!result.affectedRows) {
      return res.status(404).json({ erro: "Registro não encontrado" });
    }

    res.json({ mensagem: "Atualizado com sucesso" });
  } catch (error) {
    erro500(res, error);
  }
}

async function remover(req, res, tabela, idCampo, nome = "Registro") {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      `DELETE FROM ${tabela} WHERE ${idCampo} = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ erro: `${nome} não encontrado` });
    }

    res.json({ mensagem: "Removido com sucesso" });
  } catch (error) {
    erro500(res, error);
  }
}

/* CLIENTES */
router.get("/clientes", (req, res) => listar(res, "clientes"));
router.post("/clientes", (req, res) =>
  criar(req, res, "clientes", ["nome", "telefone"])
);
router.put("/clientes/:id", (req, res) =>
  atualizar(req, res, "clientes", "id_clientes", ["nome", "telefone"])
);
router.delete("/clientes/:id", (req, res) =>
  remover(req, res, "clientes", "id_clientes", "Cliente")
);

/* FUNCIONÁRIOS */
router.get("/funcionarios", (req, res) => listar(res, "funcionarios"));
router.post("/funcionarios", (req, res) =>
  criar(req, res, "funcionarios", ["nome"])
);
router.put("/funcionarios/:id", (req, res) =>
  atualizar(req, res, "funcionarios", "id_funcionarios", ["nome"])
);
router.delete("/funcionarios/:id", (req, res) =>
  remover(req, res, "funcionarios", "id_funcionarios", "Funcionário")
);

/* SERVIÇOS */
router.get("/servicos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM servico");
    res.json(rows);
  } catch (error) {
    erro500(res, error);
  }
});

router.post("/servicos", (req, res) =>
  criar(req, res, "servico", ["tipo"])
);
router.put("/servicos/:id", (req, res) =>
  atualizar(req, res, "servico", "id_servico", ["tipo"])
);
router.delete("/servicos/:id", (req, res) =>
  remover(req, res, "servico", "id_servico", "Serviço")
);

/* AGENDAMENTOS */
router.get("/agendamentos", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id_agendamentos,
        a.data,
        a.horario,
        a.clientes_id_clientes,
        a.servico_id_servico,
        a.funcionarios_id_funcionarios,
        c.nome AS cliente,
        s.tipo AS servico,
        f.nome AS funcionario
      FROM agendamentos a
      INNER JOIN clientes c
        ON a.clientes_id_clientes = c.id_clientes
      INNER JOIN servico s
        ON a.servico_id_servico = s.id_servico
      INNER JOIN funcionarios f
        ON a.funcionarios_id_funcionarios = f.id_funcionarios
      ORDER BY a.data, a.horario
    `);

    res.json(rows);
  } catch (error) {
    erro500(res, error);
  }
});

router.get("/disponibilidade", async (req, res) => {
  try {
    const { data, funcionarioId } = req.query;

    if (!data || !funcionarioId) {
      return res.status(400).json({ erro: "Informe data e funcionarioId" });
    }

    const [rows] = await db.query(`
      SELECT horario
      FROM agendamentos
      WHERE data = ? AND funcionarios_id_funcionarios = ?
      ORDER BY horario
    `, [data, funcionarioId]);

    res.json(rows);
  } catch (error) {
    erro500(res, error);
  }
});

router.post("/agendamentos", async (req, res) => {
  try {
    const {
      data,
      horario,
      clientes_id_clientes,
      servico_id_servico,
      funcionarios_id_funcionarios
    } = req.body;

    if (
      !data ||
      !horario ||
      !clientes_id_clientes ||
      !servico_id_servico ||
      !funcionarios_id_funcionarios
    ) {
      return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const [existe] = await db.query(`
      SELECT id_agendamentos
      FROM agendamentos
      WHERE data = ? AND horario = ? AND funcionarios_id_funcionarios = ?
    `, [data, horario, funcionarios_id_funcionarios]);

    if (existe.length) {
      return res.status(409).json({
        erro: "Esse funcionário já possui agendamento nesse dia e horário"
      });
    }

    const [result] = await db.query(`
      INSERT INTO agendamentos
      (data, horario, clientes_id_clientes, servico_id_servico, funcionarios_id_funcionarios)
      VALUES (?, ?, ?, ?, ?)
    `, [
      data,
      horario,
      clientes_id_clientes,
      servico_id_servico,
      funcionarios_id_funcionarios
    ]);

    res.status(201).json({
      mensagem: "Agendamento criado com sucesso",
      id_agendamentos: result.insertId
    });
  } catch (error) {
    erro500(res, error);
  }
});

router.put("/agendamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      data,
      horario,
      clientes_id_clientes,
      servico_id_servico,
      funcionarios_id_funcionarios
    } = req.body;

    if (
      !data ||
      !horario ||
      !clientes_id_clientes ||
      !servico_id_servico ||
      !funcionarios_id_funcionarios
    ) {
      return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const [existe] = await db.query(`
      SELECT id_agendamentos
      FROM agendamentos
      WHERE data = ?
        AND horario = ?
        AND funcionarios_id_funcionarios = ?
        AND id_agendamentos <> ?
    `, [data, horario, funcionarios_id_funcionarios, id]);

    if (existe.length) {
      return res.status(409).json({
        erro: "Esse funcionário já possui agendamento nesse dia e horário"
      });
    }

    const [result] = await db.query(`
      UPDATE agendamentos
      SET
        data = ?,
        horario = ?,
        clientes_id_clientes = ?,
        servico_id_servico = ?,
        funcionarios_id_funcionarios = ?
      WHERE id_agendamentos = ?
    `, [
      data,
      horario,
      clientes_id_clientes,
      servico_id_servico,
      funcionarios_id_funcionarios,
      id
    ]);

    if (!result.affectedRows) {
      return res.status(404).json({ erro: "Agendamento não encontrado" });
    }

    res.json({ mensagem: "Agendamento atualizado com sucesso" });
  } catch (error) {
    erro500(res, error);
  }
});

router.delete("/agendamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM agendamentos WHERE id_agendamentos = ?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ erro: "Agendamento não encontrado" });
    }

    res.json({ mensagem: "Agendamento removido com sucesso" });
  } catch (error) {
    erro500(res, error);
  }
});

module.exports = router;