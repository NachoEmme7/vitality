import express from 'express';
import pool from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calcularCaloriasComida } from '../utils/nutrition.js';

const router = express.Router();

router.use(authenticateToken, requireRole('profesional'));

// Listar todos los planes del profesional
router.get('/', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const [rows] = await pool.query(
      `SELECT pl.*,
              p.nombre AS paciente_nombre,
              p.apellido AS paciente_apellido,
              (SELECT COUNT(*) FROM Detalles_Comidas dc WHERE dc.id_plan = pl.id_plan) AS total_comidas
       FROM Planes_Alimenticios pl
       INNER JOIN Pacientes p ON p.id_paciente = pl.id_paciente
       WHERE pl.id_profesional = ?
       ORDER BY pl.fecha_creacion DESC`,
      [idProfesional]
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar planes:', error);
    return res.status(500).json({ error: 'Error al obtener los planes alimenticios.' });
  }
});

// Obtener un plan específico con todo su detalle de comidas
router.get('/:idPlan', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPlan = Number(req.params.idPlan);

    const [planes] = await pool.query(
      `SELECT pl.*,
              p.nombre AS paciente_nombre,
              p.apellido AS paciente_apellido,
              p.restricciones_alimentarias,
              p.antecedentes_medicos
       FROM Planes_Alimenticios pl
       INNER JOIN Pacientes p ON p.id_paciente = pl.id_paciente
       WHERE pl.id_plan = ? AND pl.id_profesional = ?`,
      [idPlan, idProfesional]
    );

    if (planes.length === 0) {
      return res.status(404).json({ error: 'Plan alimenticio no encontrado.' });
    }

    const [comidas] = await pool.query(
      `SELECT * FROM Detalles_Comidas
       WHERE id_plan = ?
       ORDER BY FIELD(dia_semana, 'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'),
                FIELD(momento_dia, 'Desayuno','Media Manana','Almuerzo','Merienda','Cena','Colacion'),
                id_detalle ASC`,
      [idPlan]
    );

    const comidasConKcal = comidas.map((c) => ({
      ...c,
      calorias: calcularCaloriasComida(c.gramos_proteina, c.gramos_carbohidratos, c.gramos_grasa),
    }));

    return res.json({
      ...planes[0],
      detalles_comidas: comidasConKcal,
    });
  } catch (error) {
    console.error('Error al obtener plan:', error);
    return res.status(500).json({ error: 'Error al obtener el plan alimenticio.' });
  }
});

// Crear un nuevo plan alimenticio
router.post('/', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const {
      id_paciente,
      objetivo_calorico,
      estado = 'Borrador',
      observaciones = '',
    } = req.body;

    if (!id_paciente || !objetivo_calorico) {
      return res.status(400).json({
        error: 'El paciente y el objetivo calórico diario son obligatorios.',
      });
    }

    const [pacs] = await pool.query(
      'SELECT id_paciente FROM Pacientes WHERE id_paciente = ? AND id_profesional = ?',
      [Number(id_paciente), idProfesional]
    );
    if (pacs.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }

    const [result] = await pool.query(
      `INSERT INTO Planes_Alimenticios
        (id_paciente, id_profesional, objetivo_calorico, estado, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [Number(id_paciente), idProfesional, Number(objetivo_calorico), estado, observaciones || null]
    );

    return res.status(201).json({
      id_plan: result.insertId,
      message: 'Plan alimenticio creado correctamente.',
    });
  } catch (error) {
    console.error('Error al crear plan:', error);
    return res.status(500).json({ error: 'Error al crear el plan alimenticio.' });
  }
});

// Actualizar cabecera del plan (objetivo calórico, estado: Borrador/Aprobado/Archivado, observaciones)
router.put('/:idPlan', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPlan = Number(req.params.idPlan);
    const { objetivo_calorico, estado, observaciones } = req.body;

    const [result] = await pool.query(
      `UPDATE Planes_Alimenticios
       SET objetivo_calorico = COALESCE(?, objetivo_calorico),
           estado = COALESCE(?, estado),
           observaciones = ?
       WHERE id_plan = ? AND id_profesional = ?`,
      [
        objetivo_calorico ? Number(objetivo_calorico) : null,
        estado || null,
        observaciones ?? null,
        idPlan,
        idProfesional,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan alimenticio no encontrado.' });
    }

    return res.json({ message: 'Plan alimenticio actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    return res.status(500).json({ error: 'Error al actualizar el plan alimenticio.' });
  }
});

// Duplicar un plan alimenticio completo (con todas sus comidas) en estado Borrador
router.post('/:idPlan/duplicar', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const idProfesional = req.user.id;
    const idPlan = Number(req.params.idPlan);
    const targetPacienteId = req.body?.id_paciente ? Number(req.body.id_paciente) : null;

    const [planes] = await connection.query(
      'SELECT * FROM Planes_Alimenticios WHERE id_plan = ? AND id_profesional = ?',
      [idPlan, idProfesional]
    );
    if (planes.length === 0) {
      return res.status(404).json({ error: 'Plan alimenticio no encontrado.' });
    }

    const original = planes[0];
    const idPacienteFinal = targetPacienteId || original.id_paciente;

    if (targetPacienteId) {
      const [pacs] = await connection.query(
        'SELECT id_paciente FROM Pacientes WHERE id_paciente = ? AND id_profesional = ?',
        [targetPacienteId, idProfesional]
      );
      if (pacs.length === 0) {
        return res.status(404).json({ error: 'Paciente destino no encontrado.' });
      }
    }

    await connection.beginTransaction();

    const [newPlan] = await connection.query(
      `INSERT INTO Planes_Alimenticios
        (id_paciente, id_profesional, objetivo_calorico, estado, observaciones)
       VALUES (?, ?, ?, 'Borrador', ?)`,
      [idPacienteFinal, idProfesional, original.objetivo_calorico, original.observaciones]
    );
    const newPlanId = newPlan.insertId;

    await connection.query(
      `INSERT INTO Detalles_Comidas
        (id_plan, dia_semana, momento_dia, descripcion_alimentos, gramos_proteina, gramos_carbohidratos, gramos_grasa)
       SELECT ?, dia_semana, momento_dia, descripcion_alimentos, gramos_proteina, gramos_carbohidratos, gramos_grasa
       FROM Detalles_Comidas
       WHERE id_plan = ?`,
      [newPlanId, idPlan]
    );

    await connection.commit();
    return res.status(201).json({
      id_plan: newPlanId,
      message: 'Plan alimenticio duplicado en estado Borrador.',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al duplicar plan:', error);
    return res.status(500).json({ error: 'Error al duplicar el plan alimenticio.' });
  } finally {
    connection.release();
  }
});

// Copiar comidas de un día hacia otro día dentro del mismo plan
router.post('/:idPlan/copiar-dia', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const idProfesional = req.user.id;
    const idPlan = Number(req.params.idPlan);
    const { dia_origen, dia_destino, reemplazar = true } = req.body;

    if (!dia_origen || !dia_destino || dia_origen === dia_destino) {
      return res.status(400).json({ error: 'Selecciona un día de origen y un día de destino distintos.' });
    }

    const [planes] = await connection.query(
      'SELECT id_plan FROM Planes_Alimenticios WHERE id_plan = ? AND id_profesional = ?',
      [idPlan, idProfesional]
    );
    if (planes.length === 0) {
      return res.status(404).json({ error: 'Plan alimenticio no encontrado.' });
    }

    const [origenRows] = await connection.query(
      'SELECT * FROM Detalles_Comidas WHERE id_plan = ? AND dia_semana = ?',
      [idPlan, dia_origen]
    );
    if (origenRows.length === 0) {
      return res.status(400).json({ error: `No hay comidas cargadas en ${dia_origen} para copiar.` });
    }

    await connection.beginTransaction();

    if (reemplazar) {
      await connection.query(
        'DELETE FROM Detalles_Comidas WHERE id_plan = ? AND dia_semana = ?',
        [idPlan, dia_destino]
      );
    }

    await connection.query(
      `INSERT INTO Detalles_Comidas
        (id_plan, dia_semana, momento_dia, descripcion_alimentos, gramos_proteina, gramos_carbohidratos, gramos_grasa)
       SELECT id_plan, ?, momento_dia, descripcion_alimentos, gramos_proteina, gramos_carbohidratos, gramos_grasa
       FROM Detalles_Comidas
       WHERE id_plan = ? AND dia_semana = ?`,
      [dia_destino, idPlan, dia_origen]
    );

    await connection.commit();
    return res.status(201).json({
      message: `Se copiaron ${origenRows.length} comida(s) de ${dia_origen} a ${dia_destino}.`,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al copiar día:', error);
    return res.status(500).json({ error: 'Error al copiar las comidas al día destino.' });
  } finally {
    connection.release();
  }
});

// Eliminar un plan completo
router.delete('/:idPlan', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPlan = Number(req.params.idPlan);

    const [result] = await pool.query(
      'DELETE FROM Planes_Alimenticios WHERE id_plan = ? AND id_profesional = ?',
      [idPlan, idProfesional]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan alimenticio no encontrado.' });
    }
    return res.json({ message: 'Plan alimenticio eliminado.' });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    return res.status(500).json({ error: 'Error al eliminar el plan.' });
  }
});

// Agregar comida a un plan (Detalles_Comidas)
router.post('/:idPlan/comidas', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPlan = Number(req.params.idPlan);
    const {
      dia_semana,
      momento_dia,
      descripcion_alimentos,
      gramos_proteina = 0,
      gramos_carbohidratos = 0,
      gramos_grasa = 0,
    } = req.body;

    if (!dia_semana || !momento_dia || !descripcion_alimentos) {
      return res.status(400).json({
        error: 'Día de la semana, momento del día y descripción de alimentos son obligatorios.',
      });
    }

    const [planes] = await pool.query(
      'SELECT id_plan FROM Planes_Alimenticios WHERE id_plan = ? AND id_profesional = ?',
      [idPlan, idProfesional]
    );
    if (planes.length === 0) {
      return res.status(404).json({ error: 'Plan alimenticio no encontrado.' });
    }

    const [result] = await pool.query(
      `INSERT INTO Detalles_Comidas
        (id_plan, dia_semana, momento_dia, descripcion_alimentos, gramos_proteina, gramos_carbohidratos, gramos_grasa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        idPlan,
        dia_semana,
        momento_dia,
        descripcion_alimentos.trim(),
        Number(gramos_proteina || 0),
        Number(gramos_carbohidratos || 0),
        Number(gramos_grasa || 0),
      ]
    );

    return res.status(201).json({
      id_detalle: result.insertId,
      id_plan: idPlan,
      dia_semana,
      momento_dia,
      descripcion_alimentos: descripcion_alimentos.trim(),
      gramos_proteina: Number(gramos_proteina || 0),
      gramos_carbohidratos: Number(gramos_carbohidratos || 0),
      gramos_grasa: Number(gramos_grasa || 0),
      calorias: calcularCaloriasComida(gramos_proteina, gramos_carbohidratos, gramos_grasa),
    });
  } catch (error) {
    console.error('Error al agregar comida:', error);
    return res.status(500).json({ error: 'Error al agregar la comida al plan.' });
  }
});

// Editar una comida de un plan
router.put('/:idPlan/comidas/:idDetalle', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPlan = Number(req.params.idPlan);
    const idDetalle = Number(req.params.idDetalle);
    const {
      dia_semana,
      momento_dia,
      descripcion_alimentos,
      gramos_proteina,
      gramos_carbohidratos,
      gramos_grasa,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE Detalles_Comidas dc
       INNER JOIN Planes_Alimenticios pl ON pl.id_plan = dc.id_plan
       SET dc.dia_semana = ?, dc.momento_dia = ?, dc.descripcion_alimentos = ?,
           dc.gramos_proteina = ?, dc.gramos_carbohidratos = ?, dc.gramos_grasa = ?
       WHERE dc.id_detalle = ? AND dc.id_plan = ? AND pl.id_profesional = ?`,
      [
        dia_semana,
        momento_dia,
        descripcion_alimentos.trim(),
        Number(gramos_proteina || 0),
        Number(gramos_carbohidratos || 0),
        Number(gramos_grasa || 0),
        idDetalle,
        idPlan,
        idProfesional,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Detalle de comida no encontrado.' });
    }

    return res.json({ message: 'Comida actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar comida:', error);
    return res.status(500).json({ error: 'Error al actualizar la comida.' });
  }
});

// Eliminar una comida de un plan
router.delete('/:idPlan/comidas/:idDetalle', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPlan = Number(req.params.idPlan);
    const idDetalle = Number(req.params.idDetalle);

    const [result] = await pool.query(
      `DELETE dc FROM Detalles_Comidas dc
       INNER JOIN Planes_Alimenticios pl ON pl.id_plan = dc.id_plan
       WHERE dc.id_detalle = ? AND dc.id_plan = ? AND pl.id_profesional = ?`,
      [idDetalle, idPlan, idProfesional]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Detalle de comida no encontrado.' });
    }

    return res.json({ message: 'Comida eliminada del plan.' });
  } catch (error) {
    console.error('Error al eliminar comida:', error);
    return res.status(500).json({ error: 'Error al eliminar la comida.' });
  }
});

export default router;
