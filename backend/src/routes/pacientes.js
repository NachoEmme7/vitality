import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calcularEdad, calcularIMC, calcularRequerimientos } from '../utils/nutrition.js';

const router = express.Router();

// Todas las rutas de gestión de pacientes son exclusivas del profesional
router.use(authenticateToken, requireRole('profesional'));

// Listar pacientes del profesional autenticado con último registro antropométrico y plan activo
router.get('/', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const { q } = req.query;

    let sql = `
      SELECT
        p.id_paciente, p.id_profesional, p.nombre, p.apellido, p.fecha_nacimiento,
        p.correo_electronico, p.sexo, p.nivel_actividad, p.antecedentes_medicos,
        p.restricciones_alimentarias,
        (SELECT r.peso_kg FROM Registros_Antropometricos r
          WHERE r.id_paciente = p.id_paciente
          ORDER BY r.fecha_registro DESC, r.id_registro DESC LIMIT 1) AS ultimo_peso,
        (SELECT r.altura_cm FROM Registros_Antropometricos r
          WHERE r.id_paciente = p.id_paciente
          ORDER BY r.fecha_registro DESC, r.id_registro DESC LIMIT 1) AS ultima_altura,
        (SELECT COUNT(*) FROM Planes_Alimenticios pl
          WHERE pl.id_paciente = p.id_paciente AND pl.estado = 'Aprobado') AS planes_aprobados
      FROM Pacientes p
      WHERE p.id_profesional = ?
    `;
    const params = [idProfesional];

    if (q && q.trim()) {
      sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ? OR p.correo_electronico LIKE ?)';
      const like = `%${q.trim()}%`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY p.apellido ASC, p.nombre ASC';

    const [rows] = await pool.query(sql, params);
    const enriched = rows.map((p) => {
      const edad = calcularEdad(p.fecha_nacimiento);
      const imcData =
        p.ultimo_peso && p.ultima_altura
          ? calcularIMC(p.ultimo_peso, p.ultima_altura)
          : { imc: null, clasificacion: 'Sin medición' };
      return {
        ...p,
        edad,
        imc: imcData.imc,
        clasificacion_imc: imcData.clasificacion,
      };
    });

    return res.json(enriched);
  } catch (error) {
    console.error('Error al listar pacientes:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de pacientes.' });
  }
});

// Obtener expediente completo de un paciente
router.get('/:id', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPaciente = Number(req.params.id);

    const [pacs] = await pool.query(
      `SELECT id_paciente, id_profesional, nombre, apellido, fecha_nacimiento,
              correo_electronico, sexo, nivel_actividad, antecedentes_medicos,
              restricciones_alimentarias
       FROM Pacientes
       WHERE id_paciente = ? AND id_profesional = ?`,
      [idPaciente, idProfesional]
    );

    if (pacs.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }

    const paciente = pacs[0];
    const [registros] = await pool.query(
      `SELECT * FROM Registros_Antropometricos
       WHERE id_paciente = ?
       ORDER BY fecha_registro ASC, id_registro ASC`,
      [idPaciente]
    );

    const [planes] = await pool.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM Detalles_Comidas dc WHERE dc.id_plan = p.id_plan) AS total_comidas
       FROM Planes_Alimenticios p
       WHERE p.id_paciente = ? AND p.id_profesional = ?
       ORDER BY p.fecha_creacion DESC`,
      [idPaciente, idProfesional]
    );

    const registrosConImc = registros.map((r) => ({
      ...r,
      ...calcularIMC(r.peso_kg, r.altura_cm),
    }));

    return res.json({
      ...paciente,
      edad: calcularEdad(paciente.fecha_nacimiento),
      registros_antropometricos: registrosConImc,
      planes_alimenticios: planes,
    });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return res.status(500).json({ error: 'Error al obtener el expediente del paciente.' });
  }
});

// Crear nuevo paciente (y opcionalmente su primera medición antropométrica)
router.post('/', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const {
      nombre,
      apellido,
      fecha_nacimiento,
      correo_electronico,
      contrasena,
      sexo = 'F',
      nivel_actividad = 'moderado',
      antecedentes_medicos = '',
      restricciones_alimentarias = '',
      peso_kg,
      altura_cm,
      porcentaje_grasa,
      masa_muscular_kg,
    } = req.body;

    if (!nombre || !apellido || !fecha_nacimiento || !correo_electronico || !contrasena) {
      return res.status(400).json({
        error: 'Nombre, apellido, fecha de nacimiento, correo y contraseña inicial son obligatorios.',
      });
    }

    const emailNorm = correo_electronico.trim().toLowerCase();
    const [existing] = await pool.query(
      'SELECT id_paciente FROM Pacientes WHERE correo_electronico = ?',
      [emailNorm]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe un paciente con ese correo electrónico.' });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const [result] = await pool.query(
      `INSERT INTO Pacientes
        (id_profesional, nombre, apellido, fecha_nacimiento, correo_electronico, contrasena, sexo, nivel_actividad, antecedentes_medicos, restricciones_alimentarias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idProfesional,
        nombre.trim(),
        apellido.trim(),
        fecha_nacimiento,
        emailNorm,
        hash,
        sexo,
        nivel_actividad,
        antecedentes_medicos || null,
        restricciones_alimentarias || null,
      ]
    );

    const idPaciente = result.insertId;

    // Si se enviaron peso y altura iniciales, crear primer registro antropométrico
    if (peso_kg && altura_cm) {
      const hoy = new Date().toISOString().slice(0, 10);
      await pool.query(
        `INSERT INTO Registros_Antropometricos
          (id_paciente, fecha_registro, peso_kg, altura_cm, porcentaje_grasa, masa_muscular_kg)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          idPaciente,
          hoy,
          Number(peso_kg),
          Number(altura_cm),
          porcentaje_grasa ? Number(porcentaje_grasa) : null,
          masa_muscular_kg ? Number(masa_muscular_kg) : null,
        ]
      );
    }

    return res.status(201).json({
      id_paciente: idPaciente,
      message: 'Paciente registrado correctamente.',
    });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return res.status(500).json({ error: 'Error al registrar el paciente.' });
  }
});

// Actualizar datos clínicos y personales del paciente
router.put('/:id', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPaciente = Number(req.params.id);
    const {
      nombre,
      apellido,
      fecha_nacimiento,
      correo_electronico,
      sexo,
      nivel_actividad,
      antecedentes_medicos,
      restricciones_alimentarias,
      nueva_contrasena,
    } = req.body;

    const [pacs] = await pool.query(
      'SELECT id_paciente FROM Pacientes WHERE id_paciente = ? AND id_profesional = ?',
      [idPaciente, idProfesional]
    );
    if (pacs.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }

    await pool.query(
      `UPDATE Pacientes
       SET nombre = ?, apellido = ?, fecha_nacimiento = ?, correo_electronico = ?,
           sexo = ?, nivel_actividad = ?, antecedentes_medicos = ?, restricciones_alimentarias = ?
       WHERE id_paciente = ? AND id_profesional = ?`,
      [
        nombre.trim(),
        apellido.trim(),
        fecha_nacimiento,
        correo_electronico.trim().toLowerCase(),
        sexo || 'F',
        nivel_actividad || 'moderado',
        antecedentes_medicos || null,
        restricciones_alimentarias || null,
        idPaciente,
        idProfesional,
      ]
    );

    if (nueva_contrasena && nueva_contrasena.length >= 6) {
      const hash = await bcrypt.hash(nueva_contrasena, 10);
      await pool.query('UPDATE Pacientes SET contrasena = ? WHERE id_paciente = ?', [
        hash,
        idPaciente,
      ]);
    }

    return res.json({ message: 'Expediente del paciente actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return res.status(500).json({ error: 'Error al actualizar el paciente.' });
  }
});

// Eliminar paciente
router.delete('/:id', async (req, res) => {
  try {
    const idProfesional = req.user.id;
    const idPaciente = Number(req.params.id);
    const [result] = await pool.query(
      'DELETE FROM Pacientes WHERE id_paciente = ? AND id_profesional = ?',
      [idPaciente, idProfesional]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }
    return res.json({ message: 'Paciente eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return res.status(500).json({ error: 'Error al eliminar el paciente.' });
  }
});

// Calcular requerimientos calóricos y macronutrientes con fórmulas estandarizadas
router.post('/calcular-requerimientos', (req, res) => {
  try {
    const {
      peso_kg,
      altura_cm,
      edad,
      sexo,
      nivel_actividad,
      formula,
      objetivo,
      pct_proteina,
      pct_carbohidratos,
      pct_grasa,
    } = req.body;

    if (!peso_kg || !altura_cm || !edad) {
      return res.status(400).json({ error: 'Peso, altura y edad son obligatorios.' });
    }

    const resultado = calcularRequerimientos({
      peso_kg,
      altura_cm,
      edad,
      sexo,
      nivel_actividad,
      formula,
      objetivo,
      pct_proteina,
      pct_carbohidratos,
      pct_grasa,
    });

    return res.json(resultado);
  } catch (error) {
    console.error('Error al calcular requerimientos:', error);
    return res.status(500).json({ error: 'Error al calcular requerimientos nutricionales.' });
  }
});

export default router;
