/* Campañas (packs de varios días), habilidades de armadura, entrenos por zona del cuerpo y objetivos.
 * Se carga después de exercises.js. */
(function () {
  const EX = Object.fromEntries(window.EXERCISES.map((e) => [e.id, e]));

  // ---------- Habilidades de armadura (tipo de misión) ----------
  const ABILITIES = {
    sprint: { name: 'Sprint', icon: '⚡', desc: 'Carrera, intervalos y trail. Velocidad cuando más la necesitas.' },
    jetpack: { name: 'Propulsor', icon: '🚀', desc: 'Potencia y saltos: piernas explosivas para subir.' },
    lock: { name: 'Bloqueo de armadura', icon: '🛡️', desc: 'Fuerza y core de acero.' },
    camo: { name: 'Camuflaje activo', icon: '👁️', desc: 'Sin saltos ni ruido: los vecinos no se enteran.' },
    evade: { name: 'Evasión', icon: '💨', desc: 'Agilidad, equilibrio y cambios de dirección.' },
    shield: { name: 'Escudo regenerador', icon: '💠', desc: 'Movilidad, estiramientos y recuperación.' },
  };
  const TAGS = { // misiones que ya existían
    'r-principiante': ['camo', 'fuerza'], 'r-intermedio': ['lock', 'fuerza'], 'r-avanzado': ['jetpack', 'fuerza', 'quemagrasa'],
    'r-hiit': ['sprint', 'quemagrasa', 'cardio'], 'r-cardio-suave': ['camo', 'cardio', 'quemagrasa'], 'r-abs': ['lock', 'core'],
    'r-piernas': ['jetpack', 'fuerza', 'trail'], 'r-superior': ['lock', 'fuerza'], 'r-espalda': ['shield', 'fuerza'], 'r-estira': ['shield', 'estirar'],
    'r-ciudadela': ['lock', 'fuerza', 'quemagrasa'], 'r-emergencia': ['evade', 'fuerza', 'quemagrasa'], 'r-camino-ninja': ['camo', 'cardio'],
    'r-pesadilla': ['jetpack', 'quemagrasa'], 'r-leyenda-spartan': ['jetpack', 'fuerza'], 'r-horda': ['sprint', 'quemagrasa'],
    'r-maestro-dragon': ['evade', 'fuerza'], 'r-circuito-asalto': ['sprint', 'quemagrasa', 'cardio'], 'r-infierno-tabata': ['jetpack', 'quemagrasa'],
    'r-quemagrasa': ['sprint', 'quemagrasa'], 'r-piramide': ['lock', 'fuerza'],
  };
  window.ROUTINES.forEach((r) => { const t = TAGS[r.id]; if (t) { r.ability = r.ability || t[0]; r.tags = r.tags || t.slice(1); } });

  // ---------- Centrado en el cuerpo: 3 niveles por zona, generados con tu arsenal ----------
  const BODY = [
    ['abs', 'Abdominales', 'Abdomen'], ['brazos', 'Brazos', 'Brazos'], ['pecho', 'Pecho', 'Pecho'], ['piernas', 'Piernas', 'Piernas'],
    ['gluteos', 'Glúteos', 'Glúteos'], ['espalda', 'Espalda', 'Espalda'], ['hombros', 'Hombros', 'Hombros'],
  ];
  const LV = ['Normal', 'Heroico', 'Legendario'];
  const homeOk = (e) => !e.outdoor && (!e.equip || /mesa|silla|escal/i.test(e.equip));
  const lower = ['Piernas', 'Glúteos'];
  const STRETCH = { Abdomen: ['cobra', 'child-pose'], Brazos: ['chest-stretch', 'child-pose'], Pecho: ['chest-stretch', 'child-pose'], Piernas: ['quad-stretch', 'hamstring-stretch'], 'Glúteos': ['figure-four', 'hip-flexor-stretch'], Espalda: ['child-pose', 'cat-cow'], Hombros: ['chest-stretch', 'child-pose'] };
  function bodyRoutine(key, label, group, L) {
    const allowed = [[1], [1, 2], [2, 3]][L - 1];
    const pool = window.EXERCISES.filter((e) => homeOk(e) && e.groups[0] !== 'Movilidad' && e.groups.includes(group));
    const score = (e) => (e.groups[0] === group ? 0 : 10) + (allowed.includes(e.level) ? 0 : 20) + (L === 3 ? 3 - e.level : e.level);
    const want = [6, 7, 8][L - 1];
    const pick = pool.slice().sort((a, b) => score(a) - score(b) || a.id.localeCompare(b.id)).slice(0, want);
    const k = [1, 1.2, 1.4][L - 1];
    const items = pick.map((e) => ({ ex: e.id, n: e.type === 'time' ? Math.round(e.n * k / 5) * 5 : Math.round(e.n * k) }));
    const warm = lower.includes(group) ? [{ ex: 'jumping-jacks', n: 30 }, { ex: 'leg-swing', n: 8 }] : [{ ex: 'jumping-jacks', n: 30 }, { ex: 'arm-circles', n: 20 }];
    return {
      id: `bf-${key}-${L}`, name: `${label} ${LV[L - 1]}`, level: L, rest: [30, 25, 20][L - 1], rounds: [2, 3, 3][L - 1], bodyFocus: key,
      ability: lower.includes(group) ? 'jetpack' : group === 'Abdomen' ? 'lock' : 'lock', tags: ['fuerza', 'zona'],
      desc: `${label}: nivel ${LV[L - 1].toLowerCase()}. ${['Para empezar con buena técnica.', 'Más volumen y ejercicios más exigentes.', 'Solo para veteranos: máxima dificultad.'][L - 1]}`,
      warmup: warm, items, cooldown: (STRETCH[group] || []).map((id) => ({ ex: id, n: EX[id].n })),
    };
  }
  const bodyRoutines = BODY.flatMap(([key, label, group]) => [1, 2, 3].map((L) => bodyRoutine(key, label, group, L)));
  window.ROUTINES.push(...bodyRoutines);

  // ---------- Campañas (packs de varios días) ----------
  const PROGRAMS = [
    { id: 'p-cumbre', name: 'Operación Cumbre', kicker: 'Preparación para subir el cerro · 4 semanas', ability: 'sprint', theme: 'mountain', fig: 'power-hike',
      desc: 'Trail, cuestas, escaleras y piernas a una pierna. Cuatro semanas para llegar a la cima con fuerza y bajar sin destrozarte.',
      days: ['r-reconocimiento', 'r-torre-asalto', 'r-reconocimiento', 'r-post-trail',
        'r-pilar-hierro', 'r-sprint-cresta', 'r-descenso', 'r-pulmones-acero',
        'r-torre-asalto', 'r-sprint', 'r-pilar-hierro', 'r-marcha-forzada',
        'r-sprint-cresta', 'r-descenso', 'r-reconocimiento', 'r-calentar-correr'],
      finale: 'Día de la cumbre: calienta y sube el cerro. Después registra la subida en «Registrar › Actividad».' },
    { id: 'p-forja', name: 'Forja de Calistenia', kicker: 'Fuerza con tu peso · 12 días', ability: 'lock', theme: 'steel', fig: 'pullup',
      desc: 'De los fundamentos a la dominada: tirar, empujar, pierna y core. Necesitas una barra o una mesa firme.',
      days: ['r-forja-base', 'r-contraataque', 'r-forja-base', 'r-pilar-hierro', 'r-ascenso-vertical', 'r-bloqueo-armadura',
        'r-forja-base', 'r-contraataque', 'r-ascenso-vertical', 'r-pilar-hierro', 'r-bloqueo-armadura', 'r-ultimo-bastion'] },
    { id: 'p-recluta', name: 'De Recluta a Spartan', kicker: 'Cuerpo completo en casa · 20 días', ability: 'jetpack', theme: 'fire', fig: 'burpees',
      desc: 'La campaña clásica: empieza suave y termina con las misiones legendarias.',
      days: ['r-principiante', 'r-cardio-suave', 'r-abs', 'r-principiante', 'r-estira', 'r-intermedio', 'r-hiit', 'r-piernas', 'r-superior', 'r-espalda',
        'r-intermedio', 'r-quemagrasa', 'r-abs', 'r-ciudadela', 'r-estira', 'r-avanzado', 'r-circuito-asalto', 'r-emergencia', 'r-camino-ninja', 'r-leyenda-spartan'] },
  ];

  // ---------- Objetivos populares ----------
  const GOALS = [
    ['quemagrasa', 'Quema grasa', ['r-quemagrasa', 'r-hiit', 'r-circuito-asalto', 'r-sprint-casa', 'r-cardio-suave', 'r-horda', 'r-infierno-tabata', 'r-pulmones-acero']],
    ['musculo', 'Aumentar músculo', ['r-contraataque', 'r-ascenso-vertical', 'r-pilar-hierro', 'r-superior', 'r-leyenda-spartan', 'r-piramide', 'bf-pecho-3', 'bf-piernas-3']],
    ['montana', 'Resistencia de montaña', ['r-pulmones-acero', 'r-marcha-forzada', 'r-torre-asalto', 'r-sprint-cresta', 'r-descenso', 'r-reconocimiento', 'r-sprint']],
    ['mantener', 'Mantenimiento', ['r-intermedio', 'r-ciudadela', 'r-forja-base', 'r-espalda', 'r-camino-ninja', 'r-estira']],
  ];
  const STRETCHES = ['r-alivio-lumbar', 'r-antes-dormir', 'r-calentar-correr', 'r-post-trail', 'r-estira'];

  // ---------- Actividades que registras a mano (MET del Compendio de actividad física) ----------
  const ACTIVITIES = [
    ['caminar', 'Caminar', '🚶', 3.8], ['cerro', 'Senderismo / subir cerro', '⛰️', 6.0], ['trail', 'Trail running', '🏔️', 9.0],
    ['correr', 'Correr', '🏃', 9.8], ['bici', 'Bicicleta', '🚴', 7.5], ['futbol', 'Fútbol', '⚽', 7.0], ['nadar', 'Natación', '🏊', 7.0],
    ['escaleras', 'Escaleras', '🪜', 8.8], ['gym', 'Gimnasio / pesas', '🏋️', 5.0], ['yoga', 'Yoga / movilidad', '🧘', 2.8], ['otro', 'Otro deporte', '🎯', 6.0],
  ];

  window.PROGRAMS = { ABILITIES, BODY, PROGRAMS, GOALS, STRETCHES, ACTIVITIES };
})();
