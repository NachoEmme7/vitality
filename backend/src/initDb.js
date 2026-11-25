import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'vitality_db';

  console.log(`Conectando a MySQL en ${host}:${port} como ${user}...`);
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    await connection.query(`USE \`${database}\``);
    console.log('Base de datos y tablas creadas/verificadas correctamente.');

    // Verificar si ya existen datos
    const [existingProfs] = await connection.query('SELECT COUNT(*) AS total FROM Profesionales');
    if (existingProfs[0].total > 0) {
      console.log('Ya existen registros en la base de datos. Se omite la carga inicial de demostración.');
      return;
    }

    console.log('Cargando datos de demostración para Vitality...');
    const passProf = await bcrypt.hash('vitality123', 10);
    const passPac = await bcrypt.hash('paciente123', 10);

    // 1. Profesional demo
    const [profResult] = await connection.query(
      `INSERT INTO Profesionales (nombre, apellido, matricula, correo_electronico, contrasena)
       VALUES (?, ?, ?, ?, ?)`,
      ['Sofía', 'Mendoza', 'MP-4821', 'nutricionista@vitality.com', passProf]
    );
    const idProf = profResult.insertId;

    // 2. Pacientes demo
    const [pac1] = await connection.query(
      `INSERT INTO Pacientes
        (id_profesional, nombre, apellido, fecha_nacimiento, correo_electronico, contrasena, sexo, nivel_actividad, antecedentes_medicos, restricciones_alimentarias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idProf,
        'Lucas',
        'Fernández',
        '1995-04-12',
        'lucas@vitality.com',
        passPac,
        'M',
        'activo',
        'Sin patologías de base. Practica running 4 veces por semana.',
        'Intolerancia leve a la lactosa.',
      ]
    );
    const idPac1 = pac1.insertId;

    const [pac2] = await connection.query(
      `INSERT INTO Pacientes
        (id_profesional, nombre, apellido, fecha_nacimiento, correo_electronico, contrasena, sexo, nivel_actividad, antecedentes_medicos, restricciones_alimentarias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idProf,
        'Valentina',
        'Gómez',
        '1991-09-23',
        'valentina@vitality.com',
        passPac,
        'F',
        'moderado',
        'Hipotiroidismo controlado con levotiroxina.',
        'Vegetariana (ovolactovegetariana).',
      ]
    );
    const idPac2 = pac2.insertId;

    const [pac3] = await connection.query(
      `INSERT INTO Pacientes
        (id_profesional, nombre, apellido, fecha_nacimiento, correo_electronico, contrasena, sexo, nivel_actividad, antecedentes_medicos, restricciones_alimentarias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idProf,
        'Martín',
        'Peralta',
        '1984-01-30',
        'martin@vitality.com',
        passPac,
        'M',
        'ligero',
        'Hipertensión arterial estadio 1 controlada. Objetivo: reducción de peso gradual.',
        'Dieta hiposódica.',
      ]
    );
    const idPac3 = pac3.insertId;

    // 3. Registros antropométricos históricos
    const registros = [
      [idPac1, '2026-07-15', 79.4, 178, 18.2, 36.1],
      [idPac1, '2026-08-18', 78.1, 178, 16.9, 36.6],
      [idPac1, '2026-09-20', 77.2, 178, 15.8, 37.2],
      [idPac1, '2026-10-20', 76.5, 178, 14.9, 37.8],

      [idPac2, '2026-08-10', 64.5, 165, 27.4, 24.0],
      [idPac2, '2026-09-12', 63.2, 165, 26.1, 24.4],
      [idPac2, '2026-10-18', 62.1, 165, 24.9, 24.8],

      [idPac3, '2026-09-05', 94.8, 175, 29.5, 34.2],
      [idPac3, '2026-10-15', 91.6, 175, 27.8, 34.4],
    ];

    for (const r of registros) {
      await connection.query(
        `INSERT INTO Registros_Antropometricos
          (id_paciente, fecha_registro, peso_kg, altura_cm, porcentaje_grasa, masa_muscular_kg)
         VALUES (?, ?, ?, ?, ?, ?)`,
        r
      );
    }

    // 4. Plan alimenticio aprobado para Lucas
    const [plan1] = await connection.query(
      `INSERT INTO Planes_Alimenticios
        (id_paciente, id_profesional, objetivo_calorico, estado, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [
        idPac1,
        idProf,
        2450,
        'Aprobado',
        'Plan normocalórico alto en proteínas orientado a rendimiento deportivo (running). Priorizar hidratación de 2.8 L diarios y evitar lácteos con lactosa.',
      ]
    );
    const idPlan1 = plan1.insertId;

    const comidasPlan1 = [
      ['Lunes', 'Desayuno', 'Avena cocida (70g) con bebida de almendras, 1 banana, 20g de nueces y 1 scoop de proteína aislada sin lactosa.', 34, 72, 16],
      ['Lunes', 'Almuerzo', 'Pechuga de pollo grillada (180g), arroz integral (180g cocido), ensalada de espinaca, tomate cherry y 1 cda de aceite de oliva.', 48, 56, 15],
      ['Lunes', 'Merienda', '2 tostadas de pan integral con palta pisada (60g) y 2 huevos revueltos.', 18, 34, 18],
      ['Lunes', 'Cena', 'Filet de merluza al horno (200g) con puré de calabaza (220g) y brócoli al vapor.', 42, 38, 10],

      ['Martes', 'Desayuno', 'Panqueques de avena (60g) y 3 claras + 1 huevo entero con frutos rojos y miel (1 cdta).', 30, 58, 10],
      ['Martes', 'Almuerzo', 'Carne magra a la plancha (170g), quinoa cocida (160g) y vegetales salteados (zucchini, morrón, cebolla).', 46, 52, 14],
      ['Martes', 'Merienda', 'Yogur vegetal sin azúcar (200g) con granola casera (40g) y semillas de chía.', 14, 42, 12],
      ['Martes', 'Cena', 'Wok de pollo (160g) con fideos de arroz (150g cocidos), zanahoria, repollo y salsa de soja baja en sodio.', 40, 58, 11],

      ['Miercoles', 'Desayuno', 'Tostadas integrales (3 rebanadas) con pasta de maní natural (25g), rodajas de manzana y café negro.', 16, 62, 15],
      ['Miercoles', 'Almuerzo', 'Ensalada tibia de lentejas (180g cocidas), atún al natural (140g), huevo duro, pepino y oliva.', 49, 48, 14],
      ['Miercoles', 'Merienda', 'Licuado post-entreno: bebida de soja (250ml), banana, avena (30g) y cacao amargo.', 22, 54, 8],
      ['Miercoles', 'Cena', 'Pechuga de pavo o pollo (180g) con batata al horno (220g) y ensalada de rúcula.', 45, 52, 9],

      ['Jueves', 'Desayuno', 'Revuelto de 3 huevos con espinaca, 2 tostadas integrales y 1 naranja.', 26, 44, 16],
      ['Jueves', 'Almuerzo', 'Salmón o caballa al horno (160g) con arroz basmati (170g cocido) y espárragos.', 38, 54, 19],
      ['Jueves', 'Merienda', 'Galletas de arroz integral (4 u.) con hummus casero (60g) y almendras (20g).', 14, 38, 14],
      ['Jueves', 'Cena', 'Tortilla de papas al horno (200g papa + 3 huevos) con ensalada mixta verde.', 28, 46, 16],

      ['Viernes', 'Desayuno', 'Porridge de avena (70g) con canela, pera picada y 1 scoop de proteína vegetal.', 32, 68, 11],
      ['Viernes', 'Almuerzo', 'Fideos integrales (180g cocidos) con boloñesa magra casera (160g carne picada especial) y albahaca.', 46, 60, 14],
      ['Viernes', 'Merienda', 'Tostada integral con palta (50g) y pechuga de pavo natural (60g).', 20, 28, 12],
      ['Viernes', 'Cena', 'Bife magro (170g) con ensalada completa de hojas verdes, choclo y tomate.', 44, 34, 13],
    ];

    for (const c of comidasPlan1) {
      await connection.query(
        `INSERT INTO Detalles_Comidas
          (id_plan, dia_semana, momento_dia, descripcion_alimentos, gramos_proteina, gramos_carbohidratos, gramos_grasa)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [idPlan1, ...c]
      );
    }

    // 5. Plan alimenticio en borrador para Valentina
    const [plan2] = await connection.query(
      `INSERT INTO Planes_Alimenticios
        (id_paciente, id_profesional, objetivo_calorico, estado, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [
        idPac2,
        idProf,
        1850,
        'Aprobado',
        'Plan ovolactovegetariano equilibrado. Combinar legumbres con cereales integrales y asegurar aporte de hierro + vitamina C.',
      ]
    );
    const idPlan2 = plan2.insertId;

    const comidasPlan2 = [
      ['Lunes', 'Desayuno', 'Yogur natural griego (180g) con avena (40g), frutillas y 15g de almendras.', 20, 42, 11],
      ['Lunes', 'Almuerzo', 'Bowl de garbanzos tostados (150g), arroz yamaní (120g), palta, tomate y jugo de limón.', 22, 58, 14],
      ['Lunes', 'Merienda', '2 tostadas integrales con queso untable descremado y rodajas de kiwi.', 12, 32, 6],
      ['Lunes', 'Cena', 'Omelette de 2 huevos y 2 claras con champiñones, queso port salut light (30g) y ensalada verde.', 28, 14, 14],
    ];

    for (const c of comidasPlan2) {
      await connection.query(
        `INSERT INTO Detalles_Comidas
          (id_plan, dia_semana, momento_dia, descripcion_alimentos, gramos_proteina, gramos_carbohidratos, gramos_grasa)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [idPlan2, ...c]
      );
    }

    console.log('Datos de demostración cargados exitosamente.');
    console.log('Credenciales demo -> Profesional: nutricionista@vitality.com / vitality123');
    console.log('Credenciales demo -> Paciente:    lucas@vitality.com / paciente123');
  } finally {
    await connection.end();
  }
}

initDb().catch((err) => {
  console.error('Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
