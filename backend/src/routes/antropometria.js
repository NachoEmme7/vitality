import express from 'express';
import pool from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calcularIMC } from '../utils/nutrition.js';

const router = express.Router();

router.use(authenticateToken, requireRole('profesional'));

// Agregar un registro antropométrico a un paciente
router.post('/:idPaciente', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPaciente = Number(req.params.idPaciente);
    const { fecha_registro, peso_kg, altura_cm, porcentaje_grasa, masa_muscular_kg } = req.body;

    if (!fecha_registro || !peso_kg || !altura_cm) {
      return res.status(400).json({
        error: 'Fecha de registro, peso (kg) y altura (cm) son obligatorios.',
      });
    }

    const [pacs] = await pool.query(
      'SELECT id_paciente FROM Pacientes WHERE id_paciente = ? AND id_profesional = ?',
      [idPaciente, idProfesional]
    );
    if (pacs.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }

    const [result] = await pool.query(
      `INSERT INTO Registros_Antropometricos
        (id_paciente, fecha_registro, peso_kg, altura_cm, porcentaje_grasa, masa_muscular_kg)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idPaciente,
        fecha_registro,
        Number(peso_kg),
        Number(altura_cm),
        porcentaje_grasa !== '' && porcentaje_grasa !== null && porcentaje_grasa !== undefined
          ? Number(porcentaje_grasa)
          : null,
        masa_muscular_kg !== '' && masa_muscular_kg !== null && masa_muscular_kg !== undefined
          ? Number(masa_muscular_kg)
          : null,
      ]
    );

    const imcInfo = calcularIMC(peso_kg, altura_cm);
    return res.status(201).json({
      id_registro: result.insertId,
      id_paciente: idPaciente,
      fecha_registro,
      peso_kg: Number(peso_kg),
      altura_cm: Number(altura_cm),
      porcentaje_grasa: porcentaje_grasa ? Number(porcentaje_grasa) : null,
      masa_muscular_kg: masa_muscular_kg ? Number(masa_muscular_kg) : null,
      ...imcInfo,
    });
  } catch (error) {
    console.error('Error al crear registro antropométrico:', error);
    return res.status(500).json({ error: 'Error al guardar la medición antropométrica.' });
  }
});

// Eliminar un registro antropométrico
router.delete('/:idRegistro', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idRegistro = Number(req.params.idRegistro);

    const [result] = await pool.query(
      `DELETE r FROM Registros_Antropometricos r
       INNER JOIN Pacientes p ON p.id_paciente = r.id_paciente
       WHERE r.id_registro = ? AND p.id_profesional = ?`,
      [idRegistro, idProfesional]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado.' });
    }
    return res.json({ message: 'Registro antropométrico eliminado.' });
  } catch (error) {
    console.error('Error al eliminar registro antropométrico:', error);
    return res.status(500).json({ error: 'Error al eliminar el registro.' });
  }
});

export default router;
