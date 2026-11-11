/* Mapa muscular (frente y espalda) — dibujo propio en SVG.
 * Claves de músculo iguales a las de la Biblioteca libre. */
(function () {
  const LABEL = {
    chest: 'Pecho', shoulders: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebrazos', abdominals: 'Abdomen',
    quadriceps: 'Cuádriceps', adductors: 'Aductores', abductors: 'Abductores', hamstrings: 'Isquiotibiales', glutes: 'Glúteos',
    calves: 'Gemelos', lats: 'Dorsales', 'middle back': 'Espalda media', 'lower back': 'Lumbares', traps: 'Trapecios', neck: 'Cuello',
  };

  // Músculos de los ejercicios propios (el primero es el principal)
  const EX_MUSCLES = {
    'jumping-jacks': ['calves', 'shoulders', 'quadriceps'], 'high-knees': ['quadriceps', 'abdominals', 'calves'], 'butt-kicks': ['hamstrings', 'calves'],
    'burpees': ['quadriceps', 'chest', 'shoulders', 'triceps', 'abdominals'], 'mountain-climbers': ['abdominals', 'shoulders', 'quadriceps'],
    'skater-jumps': ['glutes', 'quadriceps', 'abductors'], 'shadow-boxing': ['shoulders', 'triceps', 'abdominals'], 'jump-rope': ['calves', 'quadriceps'],
    'squat': ['quadriceps', 'glutes', 'hamstrings'], 'jump-squat': ['quadriceps', 'glutes', 'calves'], 'sumo-squat': ['adductors', 'glutes', 'quadriceps'],
    'lunge': ['quadriceps', 'glutes', 'hamstrings'], 'reverse-lunge': ['glutes', 'quadriceps', 'hamstrings'], 'wall-sit': ['quadriceps', 'glutes'],
    'glute-bridge': ['glutes', 'hamstrings', 'lower back'], 'single-leg-bridge': ['glutes', 'hamstrings'], 'calf-raise': ['calves'],
    'donkey-kick': ['glutes', 'hamstrings'], 'side-leg-raise': ['abductors', 'glutes'], 'step-up': ['quadriceps', 'glutes'],
    'curtsy-lunge': ['glutes', 'quadriceps', 'adductors', 'abductors'], 'pushup': ['chest', 'triceps', 'shoulders'], 'knee-pushup': ['chest', 'triceps', 'shoulders'],
    'incline-pushup': ['chest', 'triceps'], 'wide-pushup': ['chest', 'shoulders'], 'diamond-pushup': ['triceps', 'chest'], 'decline-pushup': ['chest', 'shoulders', 'triceps'],
    'pike-pushup': ['shoulders', 'triceps', 'traps'], 'chair-dips': ['triceps', 'shoulders', 'chest'], 'plank-shoulder-tap': ['abdominals', 'shoulders'],
    'arm-circles': ['shoulders'], 'inchworm': ['hamstrings', 'abdominals', 'shoulders'], 'superman': ['lower back', 'glutes', 'middle back'],
    'reverse-snow-angel': ['middle back', 'traps', 'shoulders'], 'swimmer': ['lower back', 'glutes', 'shoulders'], 'bird-dog': ['lower back', 'abdominals', 'glutes'],
    'plank': ['abdominals', 'shoulders'], 'side-plank': ['abdominals', 'abductors'], 'crunch': ['abdominals'], 'bicycle-crunch': ['abdominals'],
    'leg-raise': ['abdominals'], 'russian-twist': ['abdominals'], 'flutter-kicks': ['abdominals', 'quadriceps'], 'dead-bug': ['abdominals'], 'v-up': ['abdominals'],
    'reverse-crunch': ['abdominals'], 'cat-cow': ['lower back', 'middle back'], 'child-pose': ['lower back', 'lats'], 'cobra': ['abdominals', 'lower back'],
    'hip-flexor-stretch': ['quadriceps'], 'hamstring-stretch': ['hamstrings'], 'quad-stretch': ['quadriceps'], 'chest-stretch': ['chest', 'shoulders'],
    'thoracic-rotation': ['middle back'], 'figure-four': ['glutes'], 'squat-thrust': ['quadriceps', 'shoulders', 'abdominals'],
    'tuck-jump': ['quadriceps', 'calves', 'abdominals'], 'bear-crawl': ['shoulders', 'abdominals', 'quadriceps'], 'lateral-lunge': ['adductors', 'quadriceps', 'glutes'],
    'hollow-hold': ['abdominals'], 'split-jump': ['quadriceps', 'glutes', 'calves'], 'plank-to-pushup': ['triceps', 'shoulders', 'abdominals'],
    'star-jump': ['quadriceps', 'calves', 'shoulders'], 'spiderman-pushup': ['chest', 'abdominals', 'triceps'], 'pistol-squat': ['quadriceps', 'glutes'],
    'plank-jack': ['abdominals', 'shoulders', 'abductors'], 'burpee-tuck': ['quadriceps', 'chest', 'abdominals', 'shoulders'],
  };
  const FROM_GROUP = { Pecho: ['chest'], Espalda: ['middle back', 'lats'], Hombros: ['shoulders'], Brazos: ['triceps', 'biceps'], Abdomen: ['abdominals'], Piernas: ['quadriceps', 'hamstrings'], 'Glúteos': ['glutes'], Cardio: ['quadriceps', 'calves'] };
  const FROM_ES = Object.fromEntries(Object.entries(LABEL).map(([k, v]) => [v, k]));
  function musclesOf(ex) {
    if (!ex) return [];
    if (ex.muscleKeys && ex.muscleKeys.length) return ex.muscleKeys;
    if (EX_MUSCLES[ex.id]) return EX_MUSCLES[ex.id];
    if (ex.muscles && ex.muscles.length) { const k = ex.muscles.map((m) => FROM_ES[m]).filter(Boolean); if (k.length) return k; }
    return [...new Set((ex.groups || []).flatMap((g) => FROM_GROUP[g] || []))];
  }

  // ---------- Dibujo ----------
  const E = (cx, cy, rx, ry, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
  const P = (d) => `<path d="${d}"/>`;
  const R = (x, y, w, h, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
  const BASE_FRONT = E(100, 30, 17, 21) + E(45, 192, 7, 10) + E(155, 192, 7, 10) + P('M78 178 L122 178 L118 200 L100 210 L82 200 Z') + E(84, 286, 9, 8) + E(116, 286, 9, 8) + E(84, 366, 10, 6) + E(116, 366, 10, 6);
  const BASE_BACK = E(100, 30, 17, 21) + E(45, 192, 7, 10) + E(155, 192, 7, 10) + E(84, 286, 9, 8) + E(116, 286, 9, 8) + E(84, 366, 10, 6) + E(116, 366, 10, 6) + P('M80 178 L120 178 L118 186 L82 186 Z');
  const FRONT = [
    ['neck', P('M92 48 L108 48 L110 62 L90 62 Z')],
    ['traps', P('M90 58 L70 70 L90 68 Z') + P('M110 58 L130 70 L110 68 Z')],
    ['shoulders', E(64, 82, 15, 16) + E(136, 82, 15, 16)],
    ['chest', P('M99 68 L80 68 Q70 74 72 92 Q76 106 99 106 Z') + P('M101 68 L120 68 Q130 74 128 92 Q124 106 101 106 Z')],
    ['biceps', E(57, 116, 9, 20, 8) + E(143, 116, 9, 20, -8)],
    ['forearms', E(50, 160, 8, 24, 10) + E(150, 160, 8, 24, -10)],
    ['abdominals', R(88, 110, 24, 66, 6) + P('M86 108 L76 110 Q74 140 82 176 L87 176 Z') + P('M114 108 L124 110 Q126 140 118 176 L113 176 Z')],
    ['adductors', P('M92 204 L100 212 L98 250 L90 236 Z') + P('M108 204 L100 212 L102 250 L110 236 Z')],
    ['quadriceps', E(82, 240, 13, 40, 4) + E(118, 240, 13, 40, -4)],
    ['calves', E(84, 326, 9, 30) + E(116, 326, 9, 30)],
  ];
  const BACK = [
    ['neck', P('M92 48 L108 48 L110 60 L90 60 Z')],
    ['middle back', P('M90 96 L110 96 L108 150 L92 150 Z')],
    ['lats', P('M80 86 Q72 112 84 160 L92 156 Q89 120 94 100 Z') + P('M120 86 Q128 112 116 160 L108 156 Q111 120 106 100 Z')],
    ['traps', P('M100 52 L74 70 L100 118 L126 70 Z')],
    ['shoulders', E(64, 82, 15, 16) + E(136, 82, 15, 16)],
    ['triceps', E(57, 116, 9, 20, 8) + E(143, 116, 9, 20, -8)],
    ['forearms', E(50, 160, 8, 24, 10) + E(150, 160, 8, 24, -10)],
    ['lower back', R(87, 152, 26, 28, 6)],
    ['abductors', E(72, 196, 5, 13) + E(128, 196, 5, 13)],
    ['glutes', E(88, 202, 13, 17) + E(112, 202, 13, 17)],
    ['hamstrings', E(84, 250, 12, 36) + E(116, 250, 12, 36)],
    ['calves', E(84, 322, 11, 28) + E(116, 322, 11, 28)],
  ];
  const heatFill = (h) => `rgba(255,${Math.round(150 - 110 * h)},${Math.round(40 - 20 * h)},${(0.3 + 0.7 * h).toFixed(2)})`;
  function side(regions, base, title, opts) {
    const g = regions.map(([k, shapes]) => {
      const h = opts.heat ? opts.heat[k] || 0 : 0;
      const cls = ['mm-r', opts.selected === k ? 'sel' : '', h ? 'hot' : ''].join(' ');
      const fill = opts.selected === k ? '' : h ? ` style="fill:${heatFill(h)}"` : '';
      const act = opts.clickable ? ` data-action="muscle" data-m="${k}" role="button" tabindex="0" aria-label="${LABEL[k]}"` : '';
      return `<g class="${cls}"${fill}${act}><title>${LABEL[k]}</title>${shapes}</g>`;
    }).join('');
    return `<figure class="mm-side"><svg viewBox="20 0 160 380" class="mm-svg" role="img" aria-label="Mapa muscular: ${title}"><g class="mm-base">${base}</g>${g}<g class="mm-lines"><path d="M100 112 V174 M89 126 H111 M89 142 H111 M89 158 H111"/></g></svg><figcaption>${title}</figcaption></figure>`;
  }
  function svg(opts = {}) {
    const back = side(BACK, BASE_BACK, 'Espalda', opts).replace('<g class="mm-lines"><path d="M100 112 V174 M89 126 H111 M89 142 H111 M89 158 H111"/></g>', '');
    return `<div class="mm ${opts.small ? 'small' : ''}">${side(FRONT, BASE_FRONT, 'Frente', opts)}${back}</div>`;
  }

  window.MUSCLEMAP = { LABEL, EX_MUSCLES, musclesOf, svg };
})();
