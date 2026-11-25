import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Registro de Profesional de la Nutrición
router.post('/register-profesional', async (req, res) => {
  try {
    const { nombre, apellido, matricula, correo_electronico, contrasena } = req.body;
    if (!nombre || !apellido || !matricula || !correo_electronico || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const emailNorm = correo_electronico.trim().toLowerCase();
    const [existing] = await pool.query(
      'SELECT id_profesional FROM Profesionales WHERE correo_electronico = ? OR matricula = ?',
      [emailNorm, matricula.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Ya existe un profesional registrado con ese correo electrónico o matrícula.',
      });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const [result] = await pool.query(
      `INSERT INTO Profesionales (nombre, apellido, matricula, correo_electronico, contrasena)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre.trim(), apellido.trim(), matricula.trim(), emailNorm, hash]
    );

    const user = {
      id: result.insertId,
      rol: 'profesional',
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      matricula: matricula.trim(),
      correo_electronico: emailNorm,
    };

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    console.error('Error en register-profesional:', error);
    return res.status(500).json({ error: 'Error al registrar el profesional.' });
  }
});

// Inicio de sesión unificado (segregación automática por rol: profesional o paciente)
router.post('/login', async (req, res) => {
  try {
    const { correo_electronico, contrasena, tipo_usuario } = req.body;
    if (!correo_electronico || !contrasena) {
      return res.status(400).json({ error: 'Ingrese correo electrónico y contraseña.' });
    }

    const emailNorm = correo_electronico.trim().toLowerCase();

    // Si elige profesional o no especifica, buscamos primero en Profesionales
    if (!tipo_usuario || tipo_usuario === 'profesional') {
      const [profs] = await pool.query(
        'SELECT * FROM Profesionales WHERE correo_electronico = ?',
        [emailNorm]
      );
      if (profs.length > 0) {
        const prof = profs[0];
        const valid = await bcrypt.compare(contrasena, prof.contrasena);
        if (!valid) {
          return res.status(401).json({ error: 'Credenciales incorrectas.' });
        }
        const user = {
          id: prof.id_profesional,
          rol: 'profesional',
          nombre: prof.nombre,
          apellido: prof.apellido,
          matricula: prof.matricula,
          correo_electronico: prof.correo_electronico,
        };
        return res.json({ token: signToken(user), user });
      }
      if (tipo_usuario === 'profesional') {
        return res.status(401).json({ error: 'Credenciales incorrectas.' });
      }
    }

    // Buscar en Pacientes
    const [pacs] = await pool.query(
      'SELECT * FROM Pacientes WHERE correo_electronico = ?',
      [emailNorm]
    );
    if (pacs.length > 0) {
      const pac = pacs[0];
      const valid = await bcrypt.compare(contrasena, pac.contrasena);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciales incorrectas.' });
      }
      const user = {
        id: pac.id_paciente,
        id_profesional: pac.id_profesional,
        rol: 'paciente',
        nombre: pac.nombre,
        apellido: pac.apellido,
        correo_electronico: pac.correo_electronico,
      };
      return res.json({ token: signToken(user), user });
    }

    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

// Obtener perfil del usuario autenticado
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({ user: req.user });
});

export default router;
