const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/servicos", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM servico");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});


router.get("/funcionarios", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM funcionarios");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

router.get("/clientes", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM clientes");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

router.get("/agendamentos", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                a.id_agendamento,
                a.data,
                a.horario,
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
        res.status(500).json({ erro: error.message });
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
        res.status(500).json({ erro: error.message });
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
            id_agendamento: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Esse funcionário já possui agendamento nesse dia e horário"
            });
        }

        res.status(500).json({ erro: error.message });
    }
});

router.delete("/agendamentos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM agendamentos WHERE id_agendamento = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Agendamento não encontrado" });
        }

        res.json({ mensagem: "Agendamento removido com sucesso" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;