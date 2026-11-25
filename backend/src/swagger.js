export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Vitality API — Gestión Integral para Consultorios Nutricionales',
    version: '1.1.0',
    description:
      'API REST del sistema Vitality (UTN FRLR · Tecnicatura Universitaria en Programación). Implementa autenticación JWT con segregación de roles: Profesional (CRUD completo) y Paciente (Solo lectura).',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Servidor de desarrollo local',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Salud', description: 'Estado del servicio y base de datos' },
    { name: 'Autenticación', description: 'Login y registro profesional con JWT' },
    { name: 'Dashboard', description: 'KPIs y resumen del consultorio' },
    { name: 'Pacientes', description: 'Expedientes, historia clínica y calculadora nutricional' },
    { name: 'Antropometría', description: 'Registros históricos de peso, altura, IMC, grasa y músculo' },
    { name: 'Planes Alimenticios', description: 'Gestión, duplicación, copia de días y comidas semanales' },
    { name: 'Portal Paciente', description: 'Acceso de solo lectura exclusivo para pacientes' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Salud'],
        summary: 'Verificar estado de la API y conexión MySQL',
        security: [],
        responses: { 200: { description: 'Servicio y base de datos operativos' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión como Profesional o Paciente',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['correo_electronico', 'contrasena', 'tipo_usuario'],
                properties: {
                  correo_electronico: { type: 'string', example: 'nutricionista@vitality.com' },
                  contrasena: { type: 'string', example: 'vitality123' },
                  tipo_usuario: { type: 'string', enum: ['profesional', 'paciente'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Token JWT y datos del usuario' }, 401: { description: 'Credenciales inválidas' } },
      },
    },
    '/api/auth/register-profesional': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar un nuevo profesional matriculado',
        security: [],
        responses: { 201: { description: 'Profesional registrado' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Obtener el perfil del usuario autenticado',
        responses: { 200: { description: 'Datos de sesión activa' } },
      },
    },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'KPIs del consultorio y últimos planes creados',
        responses: { 200: { description: 'Estadísticas del profesional' } },
      },
    },
    '/api/pacientes': {
      get: {
        tags: ['Pacientes'],
        summary: 'Listar pacientes del profesional autenticado',
        responses: { 200: { description: 'Listado de pacientes' } },
      },
      post: {
        tags: ['Pacientes'],
        summary: 'Crear un nuevo paciente y sus credenciales de acceso',
        responses: { 201: { description: 'Paciente creado' } },
      },
    },
    '/api/pacientes/{id}': {
      get: {
        tags: ['Pacientes'],
        summary: 'Obtener expediente completo (historia clínica, antropometría y planes)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle completo del paciente' } },
      },
      put: {
        tags: ['Pacientes'],
        summary: 'Actualizar datos e historia clínica del paciente',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Paciente actualizado' } },
      },
      delete: {
        tags: ['Pacientes'],
        summary: 'Eliminar paciente y registros asociados',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Paciente eliminado' } },
      },
    },
    '/api/pacientes/calcular-requerimientos': {
      post: {
        tags: ['Pacientes'],
        summary: 'Calcular IMC, TMB (Mifflin-St Jeor / Harris-Benedict), GET y macronutrientes',
        responses: { 200: { description: 'Resultados del cálculo nutricional' } },
      },
    },
    '/api/antropometria/{idPaciente}': {
      post: {
        tags: ['Antropometría'],
        summary: 'Registrar nueva medición antropométrica',
        parameters: [{ name: 'idPaciente', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 201: { description: 'Medición registrada' } },
      },
    },
    '/api/antropometria/{idRegistro}': {
      delete: {
        tags: ['Antropometría'],
        summary: 'Eliminar una medición antropométrica',
        parameters: [{ name: 'idRegistro', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Medición eliminada' } },
      },
    },
    '/api/planes': {
      get: {
        tags: ['Planes Alimenticios'],
        summary: 'Listar todos los planes alimenticios del profesional',
        responses: { 200: { description: 'Listado de planes' } },
      },
      post: {
        tags: ['Planes Alimenticios'],
        summary: 'Crear un nuevo plan alimenticio',
        responses: { 201: { description: 'Plan creado' } },
      },
    },
    '/api/planes/{idPlan}': {
      get: {
        tags: ['Planes Alimenticios'],
        summary: 'Obtener detalle de un plan y todas sus comidas',
        parameters: [{ name: 'idPlan', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle del plan' } },
      },
      put: {
        tags: ['Planes Alimenticios'],
        summary: 'Actualizar objetivo calórico, estado (Borrador/Aprobado/Archivado) y observaciones',
        parameters: [{ name: 'idPlan', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Plan actualizado' } },
      },
      delete: {
        tags: ['Planes Alimenticios'],
        summary: 'Eliminar un plan alimenticio',
        parameters: [{ name: 'idPlan', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Plan eliminado' } },
      },
    },
    '/api/planes/{idPlan}/duplicar': {
      post: {
        tags: ['Planes Alimenticios'],
        summary: 'Clonar un plan completo con todas sus comidas en estado Borrador',
        parameters: [{ name: 'idPlan', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 201: { description: 'Plan duplicado correctamente' } },
      },
    },
    '/api/planes/{idPlan}/copiar-dia': {
      post: {
        tags: ['Planes Alimenticios'],
        summary: 'Copiar las comidas de un día de la semana hacia otro día del mismo plan',
        parameters: [{ name: 'idPlan', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 201: { description: 'Comidas copiadas al día destino' } },
      },
    },
    '/api/planes/{idPlan}/comidas': {
      post: {
        tags: ['Planes Alimenticios'],
        summary: 'Agregar una comida a un plan',
        parameters: [{ name: 'idPlan', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 201: { description: 'Comida agregada' } },
      },
    },
    '/api/planes/{idPlan}/comidas/{idDetalle}': {
      put: {
        tags: ['Planes Alimenticios'],
        summary: 'Editar una comida del plan',
        parameters: [
          { name: 'idPlan', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'idDetalle', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Comida actualizada' } },
      },
      delete: {
        tags: ['Planes Alimenticios'],
        summary: 'Eliminar una comida del plan',
        parameters: [
          { name: 'idPlan', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'idDetalle', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Comida eliminada' } },
      },
    },
    '/api/portal-paciente/resumen': {
      get: {
        tags: ['Portal Paciente'],
        summary: 'Obtener perfil, evolución antropométrica y planes aprobados del paciente autenticado',
        responses: { 200: { description: 'Resumen de solo lectura para el paciente' } },
      },
    },
  },
};
