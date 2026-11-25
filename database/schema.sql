-- Vitality: Plataforma Web de Gestión Integral para Consultorios Nutricionales
-- Esquema Relacional MySQL (5 tablas exactas según especificaciones)

CREATE DATABASE IF NOT EXISTS vitality_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vitality_db;

-- 1. Tabla Profesionales
CREATE TABLE IF NOT EXISTS Profesionales (
  id_profesional INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  matricula VARCHAR(50) NOT NULL UNIQUE,
  correo_electronico VARCHAR(150) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 2. Tabla Pacientes
CREATE TABLE IF NOT EXISTS Pacientes (
  id_paciente INT AUTO_INCREMENT PRIMARY KEY,
  id_profesional INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  correo_electronico VARCHAR(150) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  sexo ENUM('M', 'F') DEFAULT 'F',
  nivel_actividad ENUM('sedentario', 'ligero', 'moderado', 'activo', 'muy_activo') DEFAULT 'moderado',
  antecedentes_medicos TEXT NULL,
  restricciones_alimentarias TEXT NULL,
  CONSTRAINT fk_pacientes_profesional
    FOREIGN KEY (id_profesional) REFERENCES Profesionales(id_profesional)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Tabla Registros_Antropometricos
CREATE TABLE IF NOT EXISTS Registros_Antropometricos (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente INT NOT NULL,
  fecha_registro DATE NOT NULL,
  peso_kg DECIMAL(5,2) NOT NULL,
  altura_cm DECIMAL(5,2) NOT NULL,
  porcentaje_grasa DECIMAL(5,2) NULL,
  masa_muscular_kg DECIMAL(5,2) NULL,
  CONSTRAINT fk_antropometria_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. Tabla Planes_Alimenticios
CREATE TABLE IF NOT EXISTS Planes_Alimenticios (
  id_plan INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente INT NOT NULL,
  id_profesional INT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  objetivo_calorico INT NOT NULL,
  estado ENUM('Borrador', 'Aprobado', 'Archivado') NOT NULL DEFAULT 'Borrador',
  observaciones TEXT NULL,
  CONSTRAINT fk_planes_paciente
    FOREIGN KEY (id_paciente) REFERENCES Pacientes(id_paciente)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_planes_profesional
    FOREIGN KEY (id_profesional) REFERENCES Profesionales(id_profesional)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. Tabla Detalles_Comidas
CREATE TABLE IF NOT EXISTS Detalles_Comidas (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_plan INT NOT NULL,
  dia_semana ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo') NOT NULL,
  momento_dia ENUM('Desayuno', 'Media Manana', 'Almuerzo', 'Merienda', 'Cena', 'Colacion') NOT NULL,
  descripcion_alimentos TEXT NOT NULL,
  gramos_proteina DECIMAL(6,2) NOT NULL DEFAULT 0,
  gramos_carbohidratos DECIMAL(6,2) NOT NULL DEFAULT 0,
  gramos_grasa DECIMAL(6,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_detalles_plan
    FOREIGN KEY (id_plan) REFERENCES Planes_Alimenticios(id_plan)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_pacientes_profesional ON Pacientes(id_profesional);
CREATE INDEX idx_antropometria_paciente_fecha ON Registros_Antropometricos(id_paciente, fecha_registro);
CREATE INDEX idx_planes_paciente ON Planes_Alimenticios(id_paciente);
CREATE INDEX idx_detalles_plan_dia ON Detalles_Comidas(id_plan, dia_semana);
