/* Biblioteca libre: Free Exercise DB (dominio público, licencia Unlicense)
 * https://github.com/yuhonas/free-exercise-db
 * La app descarga la lista y las fotos desde GitHub cuando las necesitas. */
(function () {
  const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/';
  const DATA_URL = BASE + 'dist/exercises.json';
  const IMG = (p) => BASE + 'exercises/' + p;

  const MUSCLE = {
    abdominals: 'Abdomen', quadriceps: 'Cuádriceps', hamstrings: 'Isquiotibiales', calves: 'Gemelos', glutes: 'Glúteos',
    adductors: 'Aductores', abductors: 'Abductores', chest: 'Pecho', lats: 'Dorsales', 'middle back': 'Espalda media',
    'lower back': 'Lumbares', traps: 'Trapecios', shoulders: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps',
    forearms: 'Antebrazos', neck: 'Cuello',
  };
  const GROUP = {
    abdominals: 'Abdomen', quadriceps: 'Piernas', hamstrings: 'Piernas', calves: 'Piernas', adductors: 'Piernas', abductors: 'Glúteos',
    glutes: 'Glúteos', chest: 'Pecho', lats: 'Espalda', 'middle back': 'Espalda', 'lower back': 'Espalda', traps: 'Espalda',
    shoulders: 'Hombros', biceps: 'Brazos', triceps: 'Brazos', forearms: 'Brazos', neck: 'Movilidad',
  };
  const EQUIP = {
    'body only': 'Sin equipo', null: 'Sin equipo', dumbbell: 'Mancuernas', kettlebells: 'Kettlebell', bands: 'Bandas elásticas',
    barbell: 'Barra', cable: 'Polea', machine: 'Máquina', 'medicine ball': 'Balón medicinal', 'exercise ball': 'Fitball',
    'foam roll': 'Rodillo', 'e-z curl bar': 'Barra Z', other: 'Otro',
  };
  const EQUIP_FILTERS = [
    ['home', 'Sin equipo', (x) => !x.equipment || x.equipment === 'body only'],
    ['dumbbell', 'Mancuernas', (x) => x.equipment === 'dumbbell'],
    ['bands', 'Bandas', (x) => x.equipment === 'bands'],
    ['kettlebells', 'Kettlebell', (x) => x.equipment === 'kettlebells'],
    ['ball', 'Balón / fitball', (x) => x.equipment === 'medicine ball' || x.equipment === 'exercise ball'],
    ['gym', 'Gimnasio', (x) => ['barbell', 'cable', 'machine', 'e-z curl bar'].includes(x.equipment)],
    ['all', 'Todo', () => true],
  ];
  const LEVEL = { beginner: 1, intermediate: 2, expert: 3 };

  // Nombres en español (ejercicios sin equipo). Los demás se muestran con su nombre original.
  const NAMES = {
    '3_4_Sit-Up': 'Abdominal 3/4', '90_90_Hamstring': 'Estiramiento isquios 90/90', 'Adductor_Groin': 'Estiramiento de aductores',
    'Air_Bike': 'Bicicleta en el aire', 'All_Fours_Quad_Stretch': 'Estiramiento de cuádriceps a cuatro patas', 'Alternate_Heel_Touchers': 'Toques de talón alternos',
    'Alternate_Leg_Diagonal_Bound': 'Saltos diagonales alternos', 'Ankle_Circles': 'Círculos de tobillo', 'Ankle_On_The_Knee': 'Tobillo sobre la rodilla',
    'Arm_Circles': 'Círculos de brazos', 'Bench_Dips': 'Fondos en banco', 'Bench_Jump': 'Salto al banco', 'Bent-Knee_Hip_Raise': 'Elevación de cadera con rodillas dobladas',
    'Body-Up': 'Body-up (plancha a extensión)', 'Body_Tricep_Press': 'Press de tríceps con el cuerpo', 'Bodyweight_Squat': 'Sentadilla con peso corporal',
    'Bodyweight_Walking_Lunge': 'Zancadas caminando', 'Bottoms_Up': 'Elevación de cadera invertida', 'Butt-Ups': 'Plancha con elevación de glúteos',
    'Butt_Lift_Bridge': 'Puente de glúteos', 'Calf_Stretch_Elbows_Against_Wall': 'Estiramiento de gemelos (codos en pared)',
    'Calf_Stretch_Hands_Against_Wall': 'Estiramiento de gemelos (manos en pared)', 'Carioca_Quick_Step': 'Carioca rápida', 'Cat_Stretch': 'Estiramiento del gato',
    'Chair_Lower_Back_Stretch': 'Estiramiento lumbar en silla', 'Childs_Pose': 'Postura del niño', 'Chin-Up': 'Dominadas supinas',
    'Chin_To_Chest_Stretch': 'Barbilla al pecho', 'Clock_Push-Up': 'Flexión reloj', 'Close-Grip_Push-Up_off_of_a_Dumbbell': 'Flexión cerrada sobre mancuerna',
    'Cocoons': 'Capullos (abdominal recogido)', 'Cross-Body_Crunch': 'Abdominal cruzado', 'Crossover_Reverse_Lunge': 'Zancada atrás cruzada',
    'Crunch_-_Hands_Overhead': 'Abdominal con brazos arriba', 'Crunch_-_Legs_On_Exercise_Ball': 'Abdominal con piernas en fitball', 'Crunches': 'Abdominales',
    'Dancers_Stretch': 'Estiramiento del bailarín', 'Dead_Bug': 'Bicho muerto', 'Decline_Crunch': 'Abdominal declinado', 'Decline_Oblique_Crunch': 'Oblicuo declinado',
    'Decline_Push-Up': 'Flexión declinada', 'Decline_Reverse_Crunch': 'Abdominal inverso declinado', 'Dips_-_Triceps_Version': 'Fondos de tríceps',
    'Double_Leg_Butt_Kick': 'Salto talones al glúteo', 'Dynamic_Back_Stretch': 'Estiramiento dinámico de espalda', 'Dynamic_Chest_Stretch': 'Estiramiento dinámico de pecho',
    'Elbow_Circles': 'Círculos de codos', 'Elbow_to_Knee': 'Codo a rodilla', 'Elbows_Back': 'Codos atrás', 'Fast_Skipping': 'Skipping rápido',
    'Flat_Bench_Leg_Pull-In': 'Encogimiento de piernas en banco', 'Flat_Bench_Lying_Leg_Raise': 'Elevación de piernas en banco', 'Floor_Glute-Ham_Raise': 'Curl nórdico en suelo',
    'Flutter_Kicks': 'Patadas de tijera', 'Freehand_Jump_Squat': 'Sentadilla con salto', 'Frog_Hops': 'Saltos de rana', 'Frog_Sit-Ups': 'Abdominal rana',
    'Front_Leg_Raises': 'Elevación frontal de pierna', 'Glute_Kickback': 'Patada de glúteo', 'Gorilla_Chin_Crunch': 'Dominada gorila con encogimiento',
    'Groin_and_Back_Stretch': 'Estiramiento de ingle y espalda', 'Groiners': 'Groiners (escalador abierto)', 'Hamstring_Stretch': 'Estiramiento de isquiotibiales',
    'Handstand_Push-Ups': 'Flexiones en pino', 'Hanging_Leg_Raise': 'Elevación de piernas colgado', 'Hanging_Pike': 'Pica colgado', 'Hip_Circles_prone': 'Círculos de cadera boca abajo',
    'Hug_Knees_To_Chest': 'Rodillas al pecho', 'Hyperextensions_With_No_Hyperextension_Bench': 'Hiperextensiones en suelo', 'Inchworm': 'Gusano',
    'Incline_Push-Up': 'Flexión inclinada', 'Incline_Push-Up_Close-Grip': 'Flexión inclinada cerrada', 'Incline_Push-Up_Medium': 'Flexión inclinada media',
    'Incline_Push-Up_Reverse_Grip': 'Flexión inclinada agarre invertido', 'Incline_Push-Up_Wide': 'Flexión inclinada abierta', 'Inverted_Row': 'Remo invertido',
    'Iron_Crosses_stretch': 'Cruz de hierro (estiramiento)', 'Isometric_Chest_Squeezes': 'Presión isométrica de pecho', 'Isometric_Neck_Exercise_-_Front_And_Back': 'Cuello isométrico (delante y atrás)',
    'Isometric_Neck_Exercise_-_Sides': 'Cuello isométrico (lados)', 'Isometric_Wipers': 'Limpiaparabrisas isométrico', 'Jackknife_Sit-Up': 'Abdominal navaja',
    'Janda_Sit-Up': 'Abdominal Janda', 'Knee_Across_The_Body': 'Rodilla cruzada', 'Knee_Circles': 'Círculos de rodillas', 'Knee_Tuck_Jump': 'Salto con rodillas al pecho',
    'Kneeling_Arm_Drill': 'Braceo de rodillas', 'Kneeling_Forearm_Stretch': 'Estiramiento de antebrazos de rodillas', 'Kneeling_Hip_Flexor': 'Flexor de cadera de rodillas',
    'Lateral_Bound': 'Salto lateral', 'Leg-Up_Hamstring_Stretch': 'Estiramiento de isquios pierna arriba', 'Leg_Lift': 'Elevación de pierna', 'Leg_Pull-In': 'Encogimiento de piernas',
    'Linear_3-Part_Start_Technique': 'Técnica de salida en 3 partes', 'Linear_Acceleration_Wall_Drill': 'Aceleración contra la pared', 'Looking_At_Ceiling': 'Mirar al techo',
    'Lower_Back_Curl': 'Extensión lumbar', 'Lying_Crossover': 'Cruce tumbado', 'Lying_Glute': 'Estiramiento de glúteo tumbado', 'Lying_Prone_Quadriceps': 'Cuádriceps boca abajo',
    'Middle_Back_Stretch': 'Estiramiento de espalda media', 'Mountain_Climbers': 'Escaladores', 'Moving_Claw_Series': 'Serie de garra en movimiento',
    'Natural_Glute_Ham_Raise': 'Curl nórdico', 'Oblique_Crunches': 'Abdominales oblicuos', 'Oblique_Crunches_-_On_The_Floor': 'Oblicuos en el suelo',
    'On_Your_Side_Quad_Stretch': 'Cuádriceps de lado', 'One_Arm_Against_Wall': 'Un brazo contra la pared', 'One_Half_Locust': 'Media langosta',
    'One_Knee_To_Chest': 'Una rodilla al pecho', 'Overhead_Stretch': 'Estiramiento por encima de la cabeza', 'Overhead_Triceps': 'Estiramiento de tríceps',
    'Pelvic_Tilt_Into_Bridge': 'Báscula pélvica a puente', 'Plank': 'Plancha', 'Plyo_Push-up': 'Flexión pliométrica', 'Prone_Manual_Hamstring': 'Isquios boca abajo con ayuda',
    'Pullups': 'Dominadas', 'Push-Up_Wide': 'Flexión abierta', 'Push-Ups_-_Close_Triceps_Position': 'Flexiones cerradas de tríceps', 'Push-Ups_With_Feet_Elevated': 'Flexiones con pies elevados',
    'Push_Up_to_Side_Plank': 'Flexión a plancha lateral', 'Pushups': 'Flexiones', 'Pushups_Close_and_Wide_Hand_Positions': 'Flexiones cerradas y abiertas',
    'Rear_Leg_Raises': 'Elevación de pierna atrás', 'Reverse_Crunch': 'Abdominal inverso', 'Rocket_Jump': 'Salto cohete', 'Runners_Stretch': 'Estiramiento del corredor',
    'Russian_Twist': 'Giro ruso', 'Scapular_Pull-Up': 'Dominada escapular', 'Scissor_Kick': 'Tijeras', 'Scissors_Jump': 'Saltos de tijera alternos',
    'Seated_Biceps': 'Estiramiento de bíceps sentado', 'Seated_Calf_Stretch': 'Estiramiento de gemelos sentado', 'Seated_Flat_Bench_Leg_Pull-In': 'Encogimiento sentado en banco',
    'Seated_Floor_Hamstring_Stretch': 'Isquios sentado en el suelo', 'Seated_Front_Deltoid': 'Estiramiento de hombro frontal sentado', 'Seated_Glute': 'Estiramiento de glúteo sentado',
    'Seated_Hamstring': 'Estiramiento de isquios sentado', 'Seated_Leg_Tucks': 'Recogimiento de piernas sentado', 'Seated_Overhead_Stretch': 'Estiramiento arriba sentado',
    'Shoulder_Circles': 'Círculos de hombros', 'Shoulder_Raise': 'Elevación de hombros', 'Shoulder_Stretch': 'Estiramiento de hombro', 'Side-Lying_Floor_Stretch': 'Estiramiento lateral en suelo',
    'Side_Bridge': 'Plancha lateral', 'Side_Jackknife': 'Navaja lateral', 'Side_Leg_Raises': 'Elevación lateral de pierna', 'Side_Lying_Groin_Stretch': 'Estiramiento de ingle de lado',
    'Side_Neck_Stretch': 'Estiramiento lateral de cuello', 'Side_Standing_Long_Jump': 'Salto lateral de longitud', 'Side_Wrist_Pull': 'Tirón lateral de muñeca',
    'Single-Arm_Push-Up': 'Flexión a un brazo', 'Single_Leg_Butt_Kick': 'Talón al glúteo a una pierna', 'Single_Leg_Glute_Bridge': 'Puente de glúteo a una pierna',
    'Sit-Up': 'Abdominal completo', 'Sit_Squats': 'Sentadilla a silla', 'Spider_Crawl': 'Gateo araña', 'Spinal_Stretch': 'Estiramiento de columna',
    'Split_Jump': 'Salto en zancada', 'Split_Squats': 'Sentadilla búlgara / split', 'Standing_Gastrocnemius_Calf_Stretch': 'Estiramiento de gemelo de pie',
    'Standing_Hip_Circles': 'Círculos de cadera de pie', 'Standing_Hip_Flexors': 'Flexores de cadera de pie', 'Standing_Lateral_Stretch': 'Estiramiento lateral de pie',
    'Standing_Long_Jump': 'Salto de longitud', 'Standing_Pelvic_Tilt': 'Báscula pélvica de pie', 'Standing_Soleus_And_Achilles_Stretch': 'Estiramiento de sóleo y Aquiles',
    'Standing_Toe_Touches': 'Tocar puntas de pie', 'Standing_Towel_Triceps_Extension': 'Extensión de tríceps con toalla', 'Star_Jump': 'Salto estrella',
    'Step-up_with_Knee_Raise': 'Subida al escalón con rodilla arriba', 'Stomach_Vacuum': 'Vacío abdominal', 'Superman': 'Superman', 'The_Straddle': 'Apertura de piernas sentado',
    'Toe_Touchers': 'Toques de puntas tumbado', 'Trail_Running_Walking': 'Correr / caminar por el monte', 'Tricep_Side_Stretch': 'Estiramiento lateral de tríceps',
    'Triceps_Stretch': 'Estiramiento de tríceps', 'Tuck_Crunch': 'Abdominal recogido', 'Upper_Back-Leg_Grab': 'Espalda alta agarrando piernas', 'Upper_Back_Stretch': 'Estiramiento de espalda alta',
    'Upward_Stretch': 'Estiramiento hacia arriba', 'V-Bar_Pullup': 'Dominada con agarre en V', 'Wide-Grip_Rear_Pull-Up': 'Dominada abierta tras nuca', 'Wind_Sprints': 'Sprints',
    'Windmills': 'Molinos', 'Worlds_Greatest_Stretch': 'El mejor estiramiento del mundo', 'Wrist_Circles': 'Círculos de muñecas',
  };

  const TIMED = /plank|bridge$|isometric|hold|wall sit|stretch|vacuum|straddle|running|walking|sprint|skipping|circles/i;
  function convert(x) {
    const cat = x.category;
    const lvl = LEVEL[x.level] || 1;
    const stretch = cat === 'stretching';
    const cardio = cat === 'plyometrics' || cat === 'cardio';
    const timed = stretch || cat === 'cardio' || TIMED.test(x.name) || TIMED.test(x.id.replace(/_/g, ' '));
    const met = stretch ? 2.3 : cardio ? 8 : ({ 1: 3.8, 2: 4.5, 3: 5.5 })[lvl];
    const groups = [...new Set([...(x.primaryMuscles || []), ...(x.secondaryMuscles || [])].map((m) => GROUP[m]).filter(Boolean))];
    if (stretch) groups.unshift('Movilidad');
    if (cardio) groups.unshift('Cardio');
    return {
      id: 'lib:' + x.id, libId: x.id, source: 'lib',
      name: NAMES[x.id] || x.name, originalName: x.name,
      groups: [...new Set(groups)].slice(0, 4), level: lvl, met,
      type: timed ? 'time' : 'reps', n: timed ? 30 : cardio ? 10 : 12, secPerRep: cardio ? 2 : 3,
      muscles: (x.primaryMuscles || []).map((m) => MUSCLE[m] || m),
      muscleKeys: [...new Set([...(x.primaryMuscles || []), ...(x.secondaryMuscles || [])])],
      equipment: EQUIP[x.equipment] || x.equipment || 'Sin equipo',
      steps: x.instructions || [], stepsLang: 'en',
      images: (x.images || []).map(IMG),
    };
  }

  let cache = null;
  async function load() {
    if (cache) return cache;
    const r = await fetch(DATA_URL);
    if (!r.ok) throw new Error('No se pudo descargar la biblioteca (' + r.status + ')');
    const raw = await r.json();
    cache = raw.map((x) => ({ raw: x, ex: convert(x) }));
    return cache;
  }

  window.LIBRARY = { load, convert, EQUIP_FILTERS, MUSCLE, hasSpanish: (id) => !!NAMES[id], SOURCE: 'https://github.com/yuhonas/free-exercise-db' };
})();
