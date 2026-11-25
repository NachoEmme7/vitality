import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import pool, { testConnection } from './db.js';
import { authenticateToken, requireRole } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import pacientesRoutes from './routes/pacientes.js';
import antropometriaRoutes from './routes/antropometria.js';
import planesRoutes from './routes/planes.js';
import pacientePortalRoutes from './routes/pacientePortal.js';
import { swaggerSpec } from './swagger.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Salud del servicio
app.get('/api/health', async (_req, res) => {
  try {
    await testConnection();
    return res.json({ status: 'ok', service: 'Vitality API', database: 'connected' });
  } catch (error) {
    return res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

// Documentación interactiva Swagger / OpenAPI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Vitality API Docs' }));

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/antropometria', antropometriaRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/portal-paciente', pacientePortalRoutes);

// Estadísticas del tablero principal para el profesional
app.get('/api/dashboard', authenticateToken, requireRole('profesional'), async (req, res) => {
  try {
    const idProf = req.user.id;
    const [[{ total_pacientes }]] = await pool.query(
      'SELECT COUNT(*) AS total_pacientes FROM Pacientes WHERE id_profesional = ?',
      [idProf]
    );
    const [[{ planes_aprobados }]] = await pool.query(
      "SELECT COUNT(*) AS planes_aprobados FROM Planes_Alimenticios WHERE id_profesional = ? AND estado = 'Aprobado'",
      [idProf]
    );
    const [[{ planes_borrador }]] = await pool.query(
      "SELECT COUNT(*) AS planes_borrador FROM Planes_Alimenticios WHERE id_profesional = ? AND estado = 'Borrador'",
      [idProf]
    );
    const [[{ total_mediciones }]] = await pool.query(
      `SELECT COUNT(*) AS total_mediciones
       FROM Registros_Antropometricos r
       INNER JOIN Pacientes p ON p.id_paciente = r.id_paciente
       WHERE p.id_profesional = ?`,
      [idProf]
    );

    const [ultimosPlanes] = await pool.query(
      `SELECT pl.id_plan, pl.fecha_creacion, pl.objetivo_calorico, pl.estado,
              p.id_paciente, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
       FROM Planes_Alimenticios pl
       INNER JOIN Pacientes p ON p.id_paciente = pl.id_paciente
       WHERE pl.id_profesional = ?
       ORDER BY pl.fecha_creacion DESC
       LIMIT 5`,
      [idProf]
    );

    return res.json({
      kpis: {
        total_pacientes,
        planes_aprobados,
        planes_borrador,
        total_mediciones,
      },
      ultimos_planes: ultimosPlanes,
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    return res.status(500).json({ error: 'Error al cargar el panel de control.' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`Vitality Backend escuchando en http://localhost:${PORT}`);
});
