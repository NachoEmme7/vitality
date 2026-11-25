// Asistente clínico-operativo (solo alertas preventivas y utilidades, sin diagnóstico médico)

const RESTRICTION_RULES = [
  {
    id: 'lactosa',
    label: 'Intolerancia a la lactosa',
    restrictionTerms: ['lactosa', 'lacteo', 'lácteo', 'sin leche'],
    foodTerms: ['leche', 'queso', 'yogur', 'yogurt', 'crema', 'manteca', 'ricota', 'dulce de leche', 'helado'],
    safeContextTerms: ['sin lactosa', 'deslactosad', 'vegetal', 'almendra', 'soja', 'avena', 'coco'],
  },
  {
    id: 'gluten',
    label: 'Celiaquía / Sin TACC',
    restrictionTerms: ['celiaqu', 'gluten', 'tacc', 'trigo'],
    foodTerms: ['trigo', 'pan ', 'pan,', 'tostada', 'fideo', 'pasta', 'harina', 'galleta', 'avena', 'cebada', 'centeno', 'empanada', 'pizza'],
    safeContextTerms: ['sin tacc', 'sin gluten', 'de arroz', 'integral sin gluten'],
  },
  {
    id: 'vegetariano',
    label: 'Dieta vegetariana',
    restrictionTerms: ['vegetarian'],
    foodTerms: ['pollo', 'pechuga', 'carne', 'bife', 'vacun', 'cerdo', 'pescado', 'merluza', 'atun', 'atún', 'salmon', 'salmón', 'pavo', 'jamon', 'jamón', 'caballa', 'boloñesa', 'bolognesa'],
    safeContextTerms: ['soja', 'vegetal', 'tofu', 'lenteja'],
  },
  {
    id: 'vegano',
    label: 'Dieta vegana',
    restrictionTerms: ['vegan'],
    foodTerms: ['pollo', 'carne', 'pescado', 'huevo', 'clara', 'queso', 'leche', 'yogur', 'miel', 'manteca', 'atun', 'atún', 'merluza'],
    safeContextTerms: ['vegetal', 'vegano', 'vegana'],
  },
  {
    id: 'sodio',
    label: 'Dieta hiposódica',
    restrictionTerms: ['hiposodic', 'hiposódic', 'sin sal', 'bajo sodio', 'hipertension', 'hipertensión'],
    foodTerms: ['salsa de soja', 'fiambre', 'jamon', 'jamón', 'salame', 'embutido', 'caldo', 'snack', 'sal gruesa', 'sal fina'],
    safeContextTerms: ['baja en sodio', 'sin sal', 'bajo en sodio'],
  },
  {
    id: 'frutos_secos',
    label: 'Alergia a frutos secos / maní',
    restrictionTerms: ['mani', 'maní', 'nuez', 'nueces', 'almendra', 'frutos secos'],
    foodTerms: ['mani', 'maní', 'nuez', 'nueces', 'almendra', 'avellana', 'castaña', 'pistacho', 'pasta de maní'],
    safeContextTerms: [],
  },
];

function normalize(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function detectRestrictionConflicts(descripcionAlimentos, restriccionesPaciente) {
  if (!descripcionAlimentos || !restriccionesPaciente) return [];
  const normDesc = ` ${normalize(descripcionAlimentos)} `;
  const normRestr = normalize(restriccionesPaciente);
  const warnings = [];

  for (const rule of RESTRICTION_RULES) {
    const applies = rule.restrictionTerms.some((term) => normRestr.includes(normalize(term)));
    if (!applies) continue;

    const hasSafeOverride = rule.safeContextTerms.some((term) => normDesc.includes(normalize(term)));
    if (hasSafeOverride) continue;

    const matchedFoods = rule.foodTerms.filter((term) => normDesc.includes(normalize(term)));
    if (matchedFoods.length > 0) {
      warnings.push({
        rule: rule.label,
        matched: matchedFoods.map((f) => f.trim()),
      });
    }
  }

  return warnings;
}

export function calculateCalorieDeviation(totalKcal, objetivoCalorico) {
  const target = Number(objetivoCalorico || 0);
  const total = Number(totalKcal || 0);
  if (target <= 0 || total <= 0) {
    return { status: 'empty', diffKcal: 0, diffPct: 0 };
  }
  const diffKcal = Math.round(total - target);
  const diffPct = Math.round((diffKcal / target) * 100);

  if (diffPct > 10) {
    return { status: 'high', diffKcal, diffPct };
  }
  if (diffPct < -10) {
    return { status: 'low', diffKcal, diffPct };
  }
  return { status: 'ok', diffKcal, diffPct };
}

export function calculateEvolutionDeltas(registros = []) {
  if (!registros || registros.length < 2) return null;
  const first = registros[0];
  const last = registros[registros.length - 1];

  const diff = (a, b) =>
    a !== null && a !== undefined && b !== null && b !== undefined
      ? Number((Number(b) - Number(a)).toFixed(1))
      : null;

  return {
    desde: String(first.fecha_registro).slice(0, 10),
    hasta: String(last.fecha_registro).slice(0, 10),
    peso: diff(first.peso_kg, last.peso_kg),
    grasa: diff(first.porcentaje_grasa, last.porcentaje_grasa),
    musculo: diff(first.masa_muscular_kg, last.masa_muscular_kg),
    imc: diff(first.imc, last.imc),
  };
}

export function buildWhatsAppPlanUrl(pacienteNombre, plan) {
  const texto = [
    `Hola ${pacienteNombre}, ¡tu nuevo plan alimenticio ya está aprobado en Vitality!`,
    `• Objetivo diario: ${plan.objetivo_calorico} kcal`,
    plan.observaciones ? `• Indicaciones: ${plan.observaciones}` : null,
    `Podés consultarlo en cualquier momento ingresando a tu Portal del Paciente.`,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export const MEAL_PRESETS = [
  {
    label: 'Desayuno — Avena con fruta, nueces y proteína vegetal',
    momento_dia: 'Desayuno',
    descripcion_alimentos:
      'Avena cocida (60g) con bebida de almendras, 1 banana en rodajas, 15g de nueces y 1 scoop de proteína vegetal.',
    gramos_proteina: 30,
    gramos_carbohidratos: 64,
    gramos_grasa: 13,
  },
  {
    label: 'Desayuno — Tostadas integrales con palta y huevos revueltos',
    momento_dia: 'Desayuno',
    descripcion_alimentos:
      '2 tostadas de pan integral con palta pisada (50g), 2 huevos revueltos y café o té sin azúcar.',
    gramos_proteina: 18,
    gramos_carbohidratos: 32,
    gramos_grasa: 16,
  },
  {
    label: 'Desayuno — Yogur griego con granola y frutos rojos',
    momento_dia: 'Desayuno',
    descripcion_alimentos:
      'Yogur natural griego descremado (180g) con granola sin azúcar (35g), frutillas y semillas de chía.',
    gramos_proteina: 19,
    gramos_carbohidratos: 38,
    gramos_grasa: 9,
  },
  {
    label: 'Media Mañana — Fruta fresca + almendras',
    momento_dia: 'Media Manana',
    descripcion_alimentos: '1 manzana o pera mediana con 20g de almendras naturales.',
    gramos_proteina: 5,
    gramos_carbohidratos: 22,
    gramos_grasa: 10,
  },
  {
    label: 'Almuerzo — Pollo grillado con arroz integral y ensalada',
    momento_dia: 'Almuerzo',
    descripcion_alimentos:
      'Pechuga de pollo grillada (170g), arroz integral cocido (160g), ensalada verde con tomate y 1 cda de aceite de oliva.',
    gramos_proteina: 45,
    gramos_carbohidratos: 48,
    gramos_grasa: 14,
  },
  {
    label: 'Almuerzo — Bowl vegetariano de garbanzos, quinoa y palta',
    momento_dia: 'Almuerzo',
    descripcion_alimentos:
      'Garbanzos cocidos (150g), quinoa cocida (130g), palta (50g), pepino, tomate cherry y limón.',
    gramos_proteina: 21,
    gramos_carbohidratos: 56,
    gramos_grasa: 13,
  },
  {
    label: 'Almuerzo — Carne magra con puré de batata y vegetales',
    momento_dia: 'Almuerzo',
    descripcion_alimentos:
      'Bife de carne magra a la plancha (160g) con puré de batata (200g) y brócoli al vapor.',
    gramos_proteina: 42,
    gramos_carbohidratos: 44,
    gramos_grasa: 11,
  },
  {
    label: 'Merienda — Licuado proteico con banana y avena',
    momento_dia: 'Merienda',
    descripcion_alimentos:
      'Licuado de bebida vegetal o leche descremada (250ml), 1 banana, 30g de avena y cacao amargo.',
    gramos_proteina: 14,
    gramos_carbohidratos: 52,
    gramos_grasa: 6,
  },
  {
    label: 'Merienda — Galletas de arroz con hummus y semillas',
    momento_dia: 'Merienda',
    descripcion_alimentos: '4 galletas de arroz integral con hummus casero (60g) y semillas de sésamo.',
    gramos_proteina: 9,
    gramos_carbohidratos: 34,
    gramos_grasa: 8,
  },
  {
    label: 'Cena — Merluza al horno con puré de calabaza',
    momento_dia: 'Cena',
    descripcion_alimentos:
      'Filet de merluza al horno con limón y hierbas (180g), puré de calabaza (220g) y ensalada de rúcula.',
    gramos_proteina: 38,
    gramos_carbohidratos: 34,
    gramos_grasa: 8,
  },
  {
    label: 'Cena — Omelette de vegetales con queso magro',
    momento_dia: 'Cena',
    descripcion_alimentos:
      'Omelette de 2 huevos y 2 claras con espinaca, champiñones, queso port salut light (30g) y ensalada mixta.',
    gramos_proteina: 29,
    gramos_carbohidratos: 12,
    gramos_grasa: 14,
  },
  {
    label: 'Colación — Puñado de frutos secos y chocolate 70%',
    momento_dia: 'Colacion',
    descripcion_alimentos: '20g de mix de frutos secos naturales + 15g de chocolate amargo 70% cacao.',
    gramos_proteina: 5,
    gramos_carbohidratos: 11,
    gramos_grasa: 15,
  },
];
