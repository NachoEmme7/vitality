import express from 'express';
import pool from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calcularEdad, calcularIMC, calcularCaloriasComida } from '../utils/nutrition.js';

const router = express.Router();

// Módulo de SOLO LECTURA exclusivo para el rol Paciente
router.use(authenticateToken, requireRole('paciente'));

router.get('/resumen', async (req, res) => {
  try {
    const idPaciente = req.user.id;

    const [pacs] = await pool.query(
      `SELECT p.id_paciente, p.nombre, p.apellido, p.fecha_nacimiento, p.correo_electronico,
              p.sexo, p.nivel_actividad, p.antecedentes_medicos, p.restricciones_alimentarias,
              pr.nombre AS profesional_nombre, pr.apellido AS profesional_apellido,
              pr.matricula AS profesional_matricula, pr.correo_electronico AS profesional_correo
       FROM Pacientes p
       INNER JOIN Profesionales pr ON pr.id_profesional = p.id_profesional
       WHERE p.id_paciente = ?`,
      [idPaciente]
    );

    if (pacs.length === 0) {
      return res.status(404).json({ error: 'Perfil de paciente no encontrado.' });
    }

    const perfil = {
      ...pacs[0],
      edad: calcularEdad(pacs[0].fecha_nacimiento),
    };

    const [registros] = await pool.query(
      `SELECT * FROM Registros_Antropometricos
       WHERE id_paciente = ?
       ORDER BY fecha_registro ASC, id_registro ASC`,
      [idPaciente]
    );

    const evolucion = registros.map((r) => ({
      ...r,
      ...calcularIMC(r.peso_kg, r.altura_cm),
    }));

    // El paciente solo visualiza planes en estado 'Aprobado' por su nutricionista
    const [planes] = await pool.query(
      `SELECT * FROM Planes_Alimenticios
       WHERE id_paciente = ? AND estado = 'Aprobado'
       ORDER BY fecha_creacion DESC`,
      [idPaciente]
    );

    const planesConComidas = [];
    for (const plan of planes) {
      const [comidas] = await pool.query(
        `SELECT * FROM Detalles_Comidas
         WHERE id_plan = ?
         ORDER BY FIELD(dia_semana, 'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'),
                  FIELD(momento_dia, 'Desayuno','Media Manana','Almuerzo','Merienda','Cena','Colacion'),
                  id_detalle ASC`,
        [plan.id_plan]
      );

      planesConComidas.push({
        ...plan,
        detalles_comidas: comidas.map((c) => ({
          ...c,
          calorias: calcularCaloriasComida(
            c.gramos_proteina,
            c.gramos_carbohidratos,
            c.gramos_grasa
          ),
        })),
      });
    }

    return res.json({
      perfil,
      evolucion,
      planes_aprobados: planesConComidas,
    });
  } catch (error) {
    console.error('Error en portal paciente:', error);
    return res.status(500).json({ error: 'Error al cargar tu información nutricional.' });
  }
});

export default router;
