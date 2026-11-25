/**
 * Algoritmos matemáticos estandarizados de nutrición clínica:
 * - Índice de Masa Corporal (IMC) y clasificación OMS
 * - Tasa Metabólica Basal (TMB): Mifflin-St Jeor y Harris-Benedict revisada
 * - Gasto Energético Total (GET) por factor de actividad
 * - Objetivo calórico diario y distribución de macronutrientes (proteínas, carbohidratos, grasas)
 */

export const FACTORES_ACTIVIDAD = {
  sedentario: { factor: 1.2, label: 'Sedentario (poco o nada de ejercicio)' },
  ligero: { factor: 1.375, label: 'Ligero (ejercicio 1-3 días/semana)' },
  moderado: { factor: 1.55, label: 'Moderado (ejercicio 3-5 días/semana)' },
  activo: { factor: 1.725, label: 'Activo (ejercicio intenso 6-7 días/semana)' },
  muy_activo: { factor: 1.9, label: 'Muy activo (entrenamiento físico doble o trabajo físico)' },
};

export const AJUSTES_OBJETIVO = {
  deficit_moderado: { delta: -400, label: 'Descenso de peso saludable (-400 kcal)' },
  deficit_suave: { delta: -250, label: 'Descenso gradual (-250 kcal)' },
  mantenimiento: { delta: 0, label: 'Mantenimiento normocalórico (0 kcal)' },
  superavit_suave: { delta: 250, label: 'Ganancia muscular magra (+250 kcal)' },
  superavit_moderado: { delta: 400, label: 'Aumento de masa corporal (+400 kcal)' },
};

export function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return Math.max(1, edad);
}

export function calcularIMC(pesoKg, alturaCm) {
  const alturaM = Number(alturaCm) / 100;
  if (!alturaM || alturaM <= 0) return { imc: 0, clasificacion: 'Sin datos' };
  const imc = Number((Number(pesoKg) / (alturaM * alturaM)).toFixed(2));
  let clasificacion = 'Normopeso';
  if (imc < 18.5) clasificacion = 'Bajo peso';
  else if (imc < 25) clasificacion = 'Normopeso';
  else if (imc < 30) clasificacion = 'Sobrepeso';
  else if (imc < 35) clasificacion = 'Obesidad grado I';
  else if (imc < 40) clasificacion = 'Obesidad grado II';
  else clasificacion = 'Obesidad grado III';
  return { imc, clasificacion };
}

export function calcularRequerimientos({
  peso_kg,
  altura_cm,
  edad,
  sexo = 'F',
  nivel_actividad = 'moderado',
  formula = 'mifflin',
  objetivo = 'mantenimiento',
  pct_proteina = 25,
  pct_carbohidratos = 50,
  pct_grasa = 25,
}) {
  const peso = Number(peso_kg);
  const altura = Number(altura_cm);
  const anios = Number(edad);

  let tmb = 0;
  if (formula === 'harris') {
    // Harris-Benedict revisada (Roza & Shizgal)
    tmb =
      sexo === 'M'
        ? 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * anios
        : 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * anios;
  } else {
    // Mifflin-St Jeor (estándar clínico actual)
    tmb =
      sexo === 'M'
        ? 10 * peso + 6.25 * altura - 5 * anios + 5
        : 10 * peso + 6.25 * altura - 5 * anios - 161;
  }

  const actividadInfo = FACTORES_ACTIVIDAD[nivel_actividad] || FACTORES_ACTIVIDAD.moderado;
  const ajusteInfo = AJUSTES_OBJETIVO[objetivo] || AJUSTES_OBJETIVO.mantenimiento;

  const get = tmb * actividadInfo.factor;
  const objetivoCalorico = Math.max(1200, Math.round(get + ajusteInfo.delta));

  // Normalizar porcentajes para asegurar suma = 100
  const sumaPct = Number(pct_proteina) + Number(pct_carbohidratos) + Number(pct_grasa);
  const pProt = sumaPct > 0 ? Number(pct_proteina) / sumaPct : 0.25;
  const pCarb = sumaPct > 0 ? Number(pct_carbohidratos) / sumaPct : 0.5;
  const pGrasa = sumaPct > 0 ? Number(pct_grasa) / sumaPct : 0.25;

  const kcalProteina = Math.round(objetivoCalorico * pProt);
  const kcalCarbohidratos = Math.round(objetivoCalorico * pCarb);
  const kcalGrasa = Math.round(objetivoCalorico * pGrasa);

  const gramosProteina = Math.round(kcalProteina / 4);
  const gramosCarbohidratos = Math.round(kcalCarbohidratos / 4);
  const gramosGrasa = Math.round(kcalGrasa / 9);

  const { imc, clasificacion } = calcularIMC(peso, altura);

  return {
    formula: formula === 'harris' ? 'Harris-Benedict revisada' : 'Mifflin-St Jeor',
    imc,
    clasificacion_imc: clasificacion,
    tmb: Math.round(tmb),
    get: Math.round(get),
    objetivo_calorico: objetivoCalorico,
    macronutrientes: {
      proteinas: {
        gramos: gramosProteina,
        kcal: kcalProteina,
        porcentaje: Math.round(pProt * 100),
      },
      carbohidratos: {
        gramos: gramosCarbohidratos,
        kcal: kcalCarbohidratos,
        porcentaje: Math.round(pCarb * 100),
      },
      grasas: {
        gramos: gramosGrasa,
        kcal: kcalGrasa,
        porcentaje: Math.round(pGrasa * 100),
      },
    },
  };
}

export function calcularCaloriasComida(proteina, carbohidratos, grasa) {
  return Math.round(Number(proteina || 0) * 4 + Number(carbohidratos || 0) * 4 + Number(grasa || 0) * 9);
}
