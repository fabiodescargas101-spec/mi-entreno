/* Avatares animados, clases, rangos y frases. Todo dibujado en SVG (arte original). */
(function () {
  // ---------- Poses ----------
  // Figura de perfil mirando a la derecha. Suelo en y = 91.
  // h cabeza · n hombros · p cadera · e codo · w mano · k rodilla · f pie (1 = lado cercano, 2 = lejano)
  const mk = (o) => {
    const q = { ...o };
    q.e2 = o.e2 || [o.e1[0] - 2, o.e1[1] + 1]; q.w2 = o.w2 || [o.w1[0] - 2, o.w1[1]];
    q.k2 = o.k2 || [o.k1[0] - 2, o.k1[1]]; q.f2 = o.f2 || [o.f1[0] - 2, o.f1[1]];
    return q;
  };
  const shift = (pose, dx, dy, over = {}) => {
    const q = {}; Object.keys(pose).forEach((k) => (q[k] = [pose[k][0] + dx, pose[k][1] + dy])); return { ...q, ...over };
  };
  const S = {};
  S.stand = mk({ h: [60, 17], n: [60, 27], p: [60, 54], e1: [62, 40], w1: [63, 52], e2: [58, 40], w2: [57, 52], k1: [61, 73], f1: [62, 91], k2: [59, 73], f2: [58, 91] });
  S.standFwd = { ...S.stand, e1: [70, 33], w1: [82, 33], e2: [68, 34], w2: [80, 34] };
  S.jackOpen = mk({ h: [60, 15], n: [60, 25], p: [60, 52], e1: [71, 17], w1: [78, 6], e2: [49, 17], w2: [42, 6], k1: [66, 71], f1: [72, 91], k2: [54, 71], f2: [48, 91] });
  S.jackClosed = mk({ h: [60, 17], n: [60, 27], p: [60, 54], e1: [66, 39], w1: [68, 51], e2: [54, 39], w2: [52, 51], k1: [61, 73], f1: [61, 91], k2: [59, 73], f2: [59, 91] });
  S.squat = mk({ h: [55, 38], n: [55, 48], p: [42, 68], e1: [67, 46], w1: [79, 46], e2: [65, 47], w2: [77, 47], k1: [60, 70], f1: [58, 91], k2: [58, 71], f2: [55, 91] });
  S.squatHands = mk({ h: [70, 52], n: [64, 60], p: [46, 70], e1: [69, 74], w1: [72, 90], k1: [62, 72], f1: [57, 91] });
  S.air = mk({ h: [60, 4], n: [60, 14], p: [60, 41], e1: [68, 4], w1: [74, -7], e2: [52, 4], w2: [46, -7], k1: [64, 59], f1: [61, 77], k2: [57, 59], f2: [55, 77] });
  S.lungeDown = mk({ h: [57, 36], n: [57, 46], p: [55, 70], e1: [58, 58], w1: [60, 69], k1: [73, 72], f1: [74, 91], k2: [47, 89], f2: [31, 91] });
  S.lungeUp = mk({ h: [60, 17], n: [60, 27], p: [58, 54], e1: [61, 40], w1: [62, 52], k1: [67, 72], f1: [74, 91], k2: [51, 72], f2: [44, 91] });
  S.pushUp = mk({ h: [95, 62], n: [86, 66], p: [61, 76], e1: [87, 78], w1: [87, 91], k1: [45, 83], f1: [28, 90] });
  S.pushDown = mk({ h: [93, 78], n: [84, 81], p: [58, 85], e1: [74, 81], w1: [87, 91], k1: [43, 88], f1: [28, 90] });
  S.kneeUp = mk({ h: [95, 62], n: [86, 66], p: [63, 80], e1: [87, 78], w1: [87, 91], k1: [48, 90], f1: [33, 82] });
  S.kneeDown = mk({ h: [93, 78], n: [84, 81], p: [63, 86], e1: [74, 81], w1: [87, 91], k1: [48, 90], f1: [33, 82] });
  S.plank = mk({ h: [91, 75], n: [82, 78], p: [57, 82], e1: [82, 90], w1: [95, 90], k1: [41, 86], f1: [24, 90] });
  S.plank2 = shift(S.plank, 0, 1, { p: [57, 84] });
  S.climbA = { ...S.pushUp, k1: [76, 80], f1: [67, 90] };
  S.climbB = { ...S.pushUp, k2: [76, 80], f2: [67, 90], k1: [45, 83], f1: [28, 90] };
  S.tap = { ...S.pushUp, e1: [80, 76], w1: [86, 66] };
  S.bridgeDown = mk({ h: [14, 85], n: [23, 88], p: [50, 89], e1: [35, 90], w1: [47, 90], k1: [66, 72], f1: [75, 91] });
  S.bridgeUp = mk({ h: [14, 85], n: [23, 88], p: [49, 77], e1: [35, 90], w1: [47, 90], k1: [66, 70], f1: [74, 91] });
  S.bridgeOneUp = { ...S.bridgeUp, k1: [66, 70], f1: [82, 64] };
  S.bridgeOneDown = { ...S.bridgeDown, k1: [66, 74], f1: [82, 70] };
  S.crunchDown = mk({ h: [14, 85], n: [23, 88], p: [50, 89], e1: [19, 78], w1: [13, 81], k1: [66, 72], f1: [75, 91] });
  S.crunchUp = mk({ h: [25, 70], n: [31, 78], p: [50, 89], e1: [31, 66], w1: [24, 68], k1: [66, 72], f1: [75, 91] });
  S.legDown = mk({ h: [14, 86], n: [23, 88], p: [50, 89], e1: [36, 90], w1: [48, 91], k1: [68, 87], f1: [87, 85] });
  S.legUp = { ...S.legDown, k1: [59, 73], f1: [64, 55], k2: [57, 73], f2: [62, 55] };
  S.vDown = mk({ h: [12, 86], n: [21, 88], p: [48, 89], e1: [9, 86], w1: [-2, 85], k1: [66, 88], f1: [85, 87] });
  S.vUp = mk({ h: [31, 63], n: [36, 71], p: [50, 89], e1: [47, 63], w1: [58, 57], k1: [61, 73], f1: [70, 57] });
  S.revDown = { ...S.crunchDown, e1: [36, 90], w1: [47, 90], k1: [62, 70], f1: [78, 70] };
  S.revUp = { ...S.crunchDown, e1: [36, 90], w1: [47, 90], p: [48, 84], k1: [46, 66], f1: [62, 62], k2: [44, 66], f2: [60, 62] };
  S.bikeA = mk({ h: [24, 73], n: [30, 80], p: [52, 89], e1: [28, 70], w1: [22, 72], k1: [56, 70], f1: [70, 76], k2: [68, 82], f2: [86, 80] });
  S.bikeB = { ...S.bikeA, k1: [68, 82], f1: [86, 80], k2: [56, 70], f2: [70, 76], e1: [36, 72], w1: [44, 72] };
  S.flutterA = mk({ h: [14, 86], n: [23, 88], p: [50, 89], e1: [36, 90], w1: [48, 91], k1: [68, 84], f1: [86, 78], k2: [68, 88], f2: [86, 87] });
  S.flutterB = { ...S.flutterA, k1: [68, 88], f1: [86, 87], k2: [68, 84], f2: [86, 78] };
  S.bugA = mk({ h: [14, 86], n: [23, 88], p: [50, 89], e1: [25, 77], w1: [27, 65], e2: [23, 77], w2: [25, 65], k1: [56, 72], f1: [68, 72], k2: [54, 72], f2: [66, 72] });
  S.bugB = { ...S.bugA, e2: [12, 82], w2: [2, 85], k1: [68, 86], f1: [86, 84] };
  S.twistA = mk({ h: [34, 59], n: [38, 68], p: [50, 89], e1: [50, 74], w1: [61, 70], k1: [64, 74], f1: [79, 80] });
  S.twistB = { ...S.twistA, e1: [40, 80], w1: [32, 86], e2: [38, 80], w2: [30, 86], h: [33, 60] };
  S.supDown = mk({ h: [88, 85], n: [78, 88], p: [51, 89], e1: [91, 89], w1: [103, 89], k1: [33, 90], f1: [14, 90] });
  S.supUp = mk({ h: [88, 78], n: [78, 83], p: [52, 88], e1: [91, 79], w1: [103, 75], k1: [34, 86], f1: [16, 80] });
  S.swimA = { ...S.supUp, w2: [101, 87], e2: [89, 87], f2: [14, 89], k2: [32, 89] };
  S.swimB = { ...S.supUp, w1: [103, 87], e1: [91, 87], f1: [16, 89], k1: [34, 89], e2: [89, 78], w2: [101, 74], k2: [32, 85], f2: [14, 79] };
  S.angelA = mk({ h: [88, 80], n: [78, 84], p: [52, 88], e1: [66, 82], w1: [55, 82], k1: [34, 89], f1: [16, 89] });
  S.angelB = { ...S.angelA, e1: [90, 78], w1: [102, 74], e2: [88, 78], w2: [100, 74] };
  S.quad = mk({ h: [85, 66], n: [76, 72], p: [50, 72], e1: [76, 82], w1: [76, 91], k1: [50, 90], f1: [32, 91] });
  S.birdDog = { ...S.quad, e1: [88, 68], w1: [100, 66], k2: [34, 70], f2: [16, 70] };
  S.donkey = { ...S.quad, k1: [36, 70], f1: [34, 52] };
  S.cow = { ...S.quad, h: [86, 62], n: [76, 73], p: [50, 73] };
  S.cat = { ...S.quad, h: [82, 78], n: [76, 70], p: [50, 69] };
  S.thorDown = { ...S.quad, e1: [70, 70], w1: [77, 66] };
  S.thorUp = { ...S.quad, e1: [78, 59], w1: [82, 47], h: [84, 64] };
  S.child = mk({ h: [70, 87], n: [60, 84], p: [40, 80], e1: [76, 88], w1: [92, 90], k1: [54, 90], f1: [28, 91] });
  S.child2 = { ...S.child, p: [40, 81], n: [61, 85], h: [71, 88], w1: [94, 90], w2: [92, 90] };
  S.cobraDown = mk({ h: [85, 84], n: [76, 87], p: [48, 89], e1: [72, 80], w1: [80, 90], k1: [30, 90], f1: [12, 90] });
  S.cobraUp = mk({ h: [76, 59], n: [70, 67], p: [48, 88], e1: [71, 79], w1: [73, 91], k1: [30, 90], f1: [12, 90] });
  S.hipFlex = mk({ h: [56, 30], n: [55, 40], p: [54, 66], e1: [62, 52], w1: [68, 64], k1: [70, 70], f1: [72, 91], k2: [44, 90], f2: [26, 91] });
  S.hipFlex2 = { ...S.hipFlex, h: [59, 31], n: [58, 41], p: [58, 68], w1: [70, 65], e1: [64, 53] };
  S.hamA = mk({ h: [64, 64], n: [58, 70], p: [40, 88], e1: [66, 77], w1: [75, 83], k1: [58, 88], f1: [77, 88] });
  S.hamB = { ...S.hamA, h: [69, 70], n: [62, 74], e1: [70, 80], w1: [80, 86], w2: [78, 86] };
  S.quadSt = mk({ h: [60, 17], n: [60, 27], p: [60, 54], e1: [56, 42], w1: [51, 61], e2: [66, 30], w2: [74, 24], k1: [61, 73], f1: [50, 63], k2: [59, 73], f2: [59, 91] });
  S.quadSt2 = { ...S.quadSt, f1: [49, 61], w1: [50, 59], h: [61, 18] };
  S.chestSt = mk({ h: [62, 17], n: [61, 27], p: [60, 54], e1: [49, 27], w1: [40, 17], e2: [62, 40], w2: [64, 52], k1: [61, 73], f1: [62, 91], k2: [58, 73], f2: [57, 91] });
  S.chestSt2 = { ...S.chestSt, h: [64, 17], n: [63, 27] };
  S.fig4A = mk({ h: [14, 86], n: [23, 88], p: [50, 89], e1: [44, 76], w1: [56, 72], k1: [56, 70], f1: [44, 64], k2: [62, 66], f2: [64, 52] });
  S.fig4B = { ...S.fig4A, k2: [58, 62], f2: [58, 48], k1: [52, 68], f1: [42, 60], w1: [54, 66] };
  S.sideDown = mk({ h: [14, 82], n: [23, 86], p: [52, 88], e1: [20, 76], w1: [13, 79], k1: [70, 88], f1: [88, 88], k2: [70, 90], f2: [88, 90] });
  S.sideUp = { ...S.sideDown, k1: [69, 80], f1: [86, 71] };
  S.sidePlank = mk({ h: [86, 64], n: [78, 69], p: [50, 79], e1: [80, 90], w1: [92, 90], e2: [80, 56], w2: [82, 44], k1: [34, 85], f1: [17, 90] });
  S.sidePlank2 = { ...S.sidePlank, p: [50, 80], h: [86, 65], w2: [83, 43] };
  S.wallSit = mk({ h: [46, 32], n: [44, 42], p: [44, 68], e1: [54, 52], w1: [47, 50], k1: [62, 68], f1: [62, 91] });
  S.wallSit2 = { ...S.wallSit, h: [46, 33], n: [44, 43] };
  S.tiptoe = shift(S.stand, 0, -4, { f1: [64, 91], f2: [60, 91] });
  S.kneeA = mk({ h: [60, 15], n: [60, 25], p: [60, 52], e1: [55, 37], w1: [58, 47], e2: [66, 36], w2: [74, 30], k1: [75, 46], f1: [73, 64], k2: [59, 71], f2: [58, 89] });
  S.kneeB = { ...S.kneeA, e1: [66, 36], w1: [74, 30], e2: [55, 37], w2: [58, 47], k1: [61, 71], f1: [62, 89], k2: [73, 46], f2: [71, 64] };
  S.kickA = { ...S.stand, e1: [56, 40], w1: [60, 50], e2: [64, 40], w2: [68, 50], k1: [60, 72], f1: [46, 62] };
  S.kickB = { ...S.stand, e1: [64, 40], w1: [68, 50], e2: [56, 40], w2: [60, 50], k2: [58, 72], f2: [44, 62] };
  S.boxA = mk({ h: [60, 18], n: [59, 28], p: [57, 55], e1: [72, 30], w1: [85, 29], e2: [63, 37], w2: [67, 26], k1: [64, 73], f1: [67, 91], k2: [52, 73], f2: [48, 91] });
  S.boxB = { ...S.boxA, e1: [64, 37], w1: [68, 26], e2: [70, 31], w2: [83, 30] };
  S.hop = shift(S.stand, 0, -6, { e1: [66, 38], w1: [70, 45], e2: [56, 38], w2: [52, 45] });
  S.hopLow = { ...S.stand, e1: [66, 40], w1: [70, 47], e2: [56, 40], w2: [52, 47] };
  S.sumoUp = mk({ h: [60, 17], n: [60, 27], p: [60, 54], e1: [66, 39], w1: [61, 43], e2: [54, 39], w2: [59, 43], k1: [68, 72], f1: [74, 91], k2: [52, 72], f2: [46, 91] });
  S.sumoDown = mk({ h: [60, 31], n: [60, 41], p: [60, 67], e1: [66, 53], w1: [61, 57], e2: [54, 53], w2: [59, 57], k1: [76, 68], f1: [78, 91], k2: [44, 68], f2: [42, 91] });
  S.skateA = mk({ h: [46, 28], n: [48, 38], p: [52, 62], e1: [40, 48], w1: [34, 58], e2: [58, 46], w2: [66, 52], k1: [46, 74], f1: [44, 91], k2: [58, 76], f2: [66, 88] });
  S.skateB = mk({ h: [74, 28], n: [72, 38], p: [68, 62], e1: [80, 48], w1: [86, 58], e2: [62, 46], w2: [54, 52], k1: [74, 74], f1: [76, 91], k2: [62, 76], f2: [54, 88] });
  S.stepA = mk({ h: [52, 17], n: [52, 27], p: [52, 54], e1: [54, 40], w1: [55, 52], k1: [68, 62], f1: [72, 78], k2: [50, 73], f2: [49, 91] });
  S.stepB = shift(S.stand, 14, -13, { k2: [60, 64], f2: [58, 80] });
  S.dipUp = mk({ h: [58, 18], n: [57, 28], p: [56, 54], e1: [50, 42], w1: [47, 56], k1: [74, 58], f1: [76, 91] });
  S.dipDown = mk({ h: [58, 31], n: [57, 41], p: [56, 66], e1: [42, 46], w1: [47, 56], k1: [74, 66], f1: [76, 91] });
  S.pikeUp = mk({ h: [84, 80], n: [78, 74], p: [54, 56], e1: [81, 83], w1: [84, 91], k1: [46, 73], f1: [38, 91] });
  S.pikeDown = mk({ h: [84, 88], n: [80, 82], p: [56, 60], e1: [74, 84], w1: [84, 91], k1: [47, 75], f1: [38, 91] });
  S.fold = mk({ h: [66, 86], n: [64, 79], p: [58, 52], e1: [67, 85], w1: [70, 91], k1: [60, 72], f1: [61, 91] });
  S.circA = mk({ h: [60, 17], n: [60, 27], p: [60, 54], e1: [72, 25], w1: [84, 22], e2: [48, 25], w2: [36, 22], k1: [62, 73], f1: [63, 91], k2: [58, 73], f2: [57, 91] });
  S.circB = { ...S.circA, e1: [72, 29], w1: [84, 32], e2: [48, 29], w2: [36, 32] };
  S.curtsyDown = mk({ h: [58, 36], n: [58, 46], p: [57, 70], e1: [60, 58], w1: [62, 69], k1: [72, 72], f1: [72, 91], k2: [54, 89], f2: [40, 89] });

  S.tuckAir = mk({ h: [60, 2], n: [60, 12], p: [60, 38], e1: [70, 20], w1: [80, 22], e2: [68, 21], w2: [78, 23], k1: [74, 30], f1: [66, 46], k2: [72, 31], f2: [64, 47] });
  S.bear = mk({ h: [85, 62], n: [76, 66], p: [48, 62], e1: [77, 78], w1: [78, 91], k1: [58, 80], f1: [42, 91] });
  S.bear2 = { ...S.bear, e1: [82, 78], w1: [86, 91], k1: [64, 80], f1: [48, 91], e2: [73, 78], w2: [72, 91], k2: [52, 80], f2: [36, 91] };
  S.latLunge = mk({ h: [56, 32], n: [55, 42], p: [52, 66], e1: [60, 52], w1: [56, 50], e2: [50, 52], w2: [54, 50], k1: [70, 78], f1: [86, 91], k2: [40, 72], f2: [40, 91] });
  S.hollow = mk({ h: [17, 77], n: [25, 81], p: [50, 89], e1: [13, 75], w1: [1, 71], k1: [68, 84], f1: [86, 79] });
  S.hollow2 = { ...S.hollow, h: [17, 78], n: [25, 82], k1: [68, 85], f1: [86, 81], w1: [1, 73] };
  S.splitAir = mk({ h: [58, 6], n: [58, 16], p: [57, 42], e1: [64, 26], w1: [68, 37], e2: [52, 26], w2: [48, 36], k1: [72, 50], f1: [72, 68], k2: [48, 58], f2: [34, 66] });
  S.starAir = mk({ h: [60, 4], n: [60, 14], p: [60, 41], e1: [72, 8], w1: [84, 2], e2: [48, 8], w2: [36, 2], k1: [68, 58], f1: [76, 75], k2: [52, 58], f2: [44, 75] });
  S.spiderDown = { ...S.pushDown, k1: [72, 82], f1: [60, 89] };
  S.pistolUp = mk({ h: [60, 17], n: [60, 27], p: [60, 54], e1: [68, 34], w1: [80, 34], e2: [66, 35], w2: [78, 35], k1: [77, 58], f1: [95, 61], k2: [60, 73], f2: [59, 91] });
  S.pistolDown = mk({ h: [58, 40], n: [57, 50], p: [44, 70], e1: [68, 48], w1: [80, 48], e2: [66, 49], w2: [78, 49], k1: [62, 68], f1: [80, 64], k2: [60, 72], f2: [57, 91] });
  S.plankJackA = { ...S.pushUp };
  S.plankJackB = { ...S.pushUp, f1: [30, 86], f2: [24, 90], k1: [46, 82], k2: [42, 84] };

  // Animación de cada ejercicio: secuencia de poses (+ accesorio opcional)
  const ANIM = {
    'jumping-jacks': ['jackClosed', 'jackOpen'], 'high-knees': ['kneeA', 'kneeB'], 'butt-kicks': ['kickA', 'kickB'],
    'burpees': ['stand', 'squatHands', 'pushUp', 'squatHands', 'air'], 'mountain-climbers': ['climbA', 'climbB'],
    'skater-jumps': ['skateA', 'skateB'], 'shadow-boxing': ['boxA', 'boxB'], 'jump-rope': ['hopLow', 'hop'],
    'squat': ['standFwd', 'squat'], 'jump-squat': ['squat', 'air'], 'sumo-squat': ['sumoUp', 'sumoDown'],
    'lunge': ['lungeUp', 'lungeDown'], 'reverse-lunge': ['stand', 'lungeDown'], 'wall-sit': ['wallSit', 'wallSit2', 'wall'],
    'glute-bridge': ['bridgeDown', 'bridgeUp'], 'single-leg-bridge': ['bridgeOneDown', 'bridgeOneUp'], 'calf-raise': ['stand', 'tiptoe'],
    'donkey-kick': ['quad', 'donkey'], 'side-leg-raise': ['sideDown', 'sideUp'], 'step-up': ['stepA', 'stepB', 'step'],
    'curtsy-lunge': ['stand', 'curtsyDown'], 'pushup': ['pushUp', 'pushDown'], 'knee-pushup': ['kneeUp', 'kneeDown'],
    'incline-pushup': ['pushUp', 'pushDown'], 'wide-pushup': ['pushUp', 'pushDown'], 'diamond-pushup': ['pushUp', 'pushDown'],
    'decline-pushup': ['pushUp', 'pushDown'], 'pike-pushup': ['pikeUp', 'pikeDown'], 'chair-dips': ['dipUp', 'dipDown', 'chair'],
    'plank-shoulder-tap': ['pushUp', 'tap'], 'arm-circles': ['circA', 'circB'], 'inchworm': ['stand', 'fold', 'pushUp', 'fold'],
    'superman': ['supDown', 'supUp'], 'reverse-snow-angel': ['angelA', 'angelB'], 'swimmer': ['swimA', 'swimB'], 'bird-dog': ['quad', 'birdDog'],
    'plank': ['plank', 'plank2'], 'side-plank': ['sidePlank', 'sidePlank2'], 'crunch': ['crunchDown', 'crunchUp'],
    'bicycle-crunch': ['bikeA', 'bikeB'], 'leg-raise': ['legDown', 'legUp'], 'russian-twist': ['twistA', 'twistB'],
    'flutter-kicks': ['flutterA', 'flutterB'], 'dead-bug': ['bugA', 'bugB'], 'v-up': ['vDown', 'vUp'], 'reverse-crunch': ['revDown', 'revUp'],
    'cat-cow': ['cow', 'cat'], 'child-pose': ['child', 'child2'], 'cobra': ['cobraDown', 'cobraUp'], 'hip-flexor-stretch': ['hipFlex', 'hipFlex2'],
    'hamstring-stretch': ['hamA', 'hamB'], 'quad-stretch': ['quadSt', 'quadSt2'], 'chest-stretch': ['chestSt', 'chestSt2'],
    'thoracic-rotation': ['thorDown', 'thorUp'], 'figure-four': ['fig4A', 'fig4B'],
    'squat-thrust': ['stand', 'squatHands', 'pushUp', 'squatHands'], 'tuck-jump': ['squat', 'tuckAir'], 'bear-crawl': ['bear', 'bear2'],
    'lateral-lunge': ['sumoUp', 'latLunge'], 'hollow-hold': ['hollow', 'hollow2'], 'split-jump': ['lungeDown', 'splitAir'],
    'plank-to-pushup': ['plank', 'pushUp'], 'star-jump': ['sumoDown', 'starAir'], 'spiderman-pushup': ['pushUp', 'spiderDown'],
    'pistol-squat': ['pistolUp', 'pistolDown'], 'plank-jack': ['plankJackA', 'plankJackB'],
    'burpee-tuck': ['stand', 'squatHands', 'pushUp', 'pushDown', 'squatHands', 'tuckAir'],
  };
  const PROPS = ['wall', 'step', 'chair'];

  // ---------- Clases de avatar ----------
  const CLASSES = {
    spartan: { name: 'Spartan', desc: 'Supersoldado blindado. Visor dorado, cero excusas.', near: '#b9bd9c', far: '#5f6350', accent: '#ffb21a' },
    gear: { name: 'Gear', desc: 'Soldado de la COG. Hombreras enormes y pañuelo rojo.', near: '#b4aca6', far: '#5c5550', accent: '#ff3b30' },
    slayer: { name: 'Slayer', desc: 'Armadura de combate infernal. Rasga y desgarra.', near: '#a8957d', far: '#5a4b3c', accent: '#ff5a1f' },
    ninja: { name: 'Ninja', desc: 'Del linaje del Dragón. Rápido, silencioso, letal.', near: '#8f8f99', far: '#45454d', accent: '#e11d2e' },
  };
  function headSVG(cls, c) {
    const base = `<circle r="7.6" fill="${c.near}"/>`;
    if (cls === 'gear') return `${base}<path d="M-7.4 -3.2 L7.4 -3.2 L7.6 -0.6 L-7.6 -0.6 Z" fill="${c.accent}"/><path d="M-7 -2 L-13 1 M-7 -1.4 L-12 3.4" stroke="${c.accent}" stroke-width="1.6" stroke-linecap="round"/><circle cx="4.6" cy="1.2" r="1.1" fill="#111"/>`;
    if (cls === 'slayer') return `${base}<path d="M-5 -6 L0 -11 L4 -6.4 Z" fill="${c.near}"/><rect x="0.6" y="-2.4" width="7.6" height="3.6" rx="1.4" fill="${c.accent}" class="visor"/><path d="M-3 2 L-3 6.6" stroke="${c.far}" stroke-width="1.4"/>`;
    if (cls === 'ninja') return `<circle r="7.6" fill="#26262b"/><rect x="0.8" y="-2" width="7.4" height="2.2" rx="1" fill="${c.accent}" class="visor"/><path d="M-6 -3 Q-13 -6 -18 -1 M-6 -1 Q-12 1 -17 4" stroke="${c.accent}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return `${base}<rect x="0.4" y="-3" width="8" height="4.8" rx="2.2" fill="${c.accent}" class="visor"/>`; // spartan
  }
  const SEGS = [['n', 'e2', 'far', 6.5], ['e2', 'w2', 'far', 6], ['p', 'k2', 'far', 7.5], ['k2', 'f2', 'far', 7], ['n', 'p', 'body', 12.5], ['p', 'k1', 'near', 8], ['k1', 'f1', 'near', 7.4], ['n', 'e1', 'near', 7], ['e1', 'w1', 'near', 6.4]];
  const PROP_SVG = {
    wall: '<rect x="29" y="0" width="8" height="92" rx="1.5" class="prop"/>',
    step: '<rect x="64" y="78.5" width="28" height="13" rx="2" class="prop"/>',
    chair: '<rect x="30" y="57" width="20" height="5" rx="1.5" class="prop"/><rect x="31" y="62" width="3.5" height="29" class="prop"/><rect x="45.5" y="62" width="3.5" height="29" class="prop"/>',
  };
  let uidN = 0;
  function figure(exId, opts = {}) {
    const avatar = opts.avatar && CLASSES[opts.avatar] ? opts.avatar : 'spartan';
    const c = CLASSES[avatar];
    let seq = (ANIM[exId] || ['stand', 'standFwd']).slice();
    const prop = seq.find((s) => PROPS.includes(s)); seq = seq.filter((s) => !PROPS.includes(s));
    const frames = seq.map((k) => S[k] || S.stand);
    const animated = !opts.still && frames.length > 1;
    const dur = opts.dur || Math.max(1.2, frames.length * 0.75);
    const loop = frames.concat([frames[0]]);
    const kt = loop.map((_, i) => (i / (loop.length - 1)).toFixed(3)).join(';');
    const spl = Array(loop.length - 1).fill('.45 0 .55 1').join(';');
    const anim = (attr, vals) => animated ? `<animate attributeName="${attr}" values="${vals.join(';')}" dur="${dur}s" keyTimes="${kt}" calcMode="spline" keySplines="${spl}" repeatCount="indefinite"/>` : '';
    const f0 = frames[0];
    const color = { near: c.near, far: c.far, body: c.near };
    const lines = SEGS.map(([a, b, kind, w]) => {
      const inner = animated ? anim('x1', loop.map((f) => f[a][0])) + anim('y1', loop.map((f) => f[a][1])) + anim('x2', loop.map((f) => f[b][0])) + anim('y2', loop.map((f) => f[b][1])) : '';
      return `<line x1="${f0[a][0]}" y1="${f0[a][1]}" x2="${f0[b][0]}" y2="${f0[b][1]}" stroke="${color[kind]}" stroke-width="${w}" stroke-linecap="round">${inner}</line>`;
    });
    // franja de armadura en el torso
    const stripe = `<line x1="${f0.n[0]}" y1="${f0.n[1]}" x2="${f0.p[0]}" y2="${f0.p[1]}" stroke="${c.accent}" stroke-width="2" stroke-linecap="round" opacity=".85" stroke-dasharray="0 3 30">${animated ? anim('x1', loop.map((f) => f.n[0])) + anim('y1', loop.map((f) => f.n[1])) + anim('x2', loop.map((f) => f.p[0])) + anim('y2', loop.map((f) => f.p[1])) : ''}</line>`;
    lines.splice(5, 0, stripe);
    const pad = avatar === 'gear' ? `<circle cx="${f0.n[0]}" cy="${f0.n[1]}" r="6.6" fill="${c.near}" stroke="${c.far}" stroke-width="1.2">${animated ? anim('cx', loop.map((f) => f.n[0])) + anim('cy', loop.map((f) => f.n[1])) : ''}</circle>` : '';
    const headAnim = animated ? `<animateTransform attributeName="transform" type="translate" values="${loop.map((f) => f.h.join(' ')).join(';')}" dur="${dur}s" keyTimes="${kt}" calcMode="spline" keySplines="${spl}" repeatCount="indefinite"/>` : '';
    const id = 'fg' + (++uidN);
    return `<svg class="fig ${opts.cls || ''}" viewBox="-6 -14 132 108" role="img" aria-label="Avatar haciendo el ejercicio">
      <defs><radialGradient id="${id}" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="${c.accent}" stop-opacity=".28"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="60" cy="92" rx="58" ry="14" fill="url(#${id})"/>
      <line x1="-2" y1="92.5" x2="122" y2="92.5" class="ground"/>
      ${prop ? PROP_SVG[prop] : ''}
      ${lines.join('')}${pad}
      <g transform="translate(${f0.h[0]} ${f0.h[1]})">${headAnim}${headSVG(avatar, c)}</g>
    </svg>`;
  }
  function portrait(avatar, kind = 'idle') { // idle = en guardia · victory = celebración
    return figure(kind === 'victory' ? '__victory' : '__idle', { avatar, dur: kind === 'victory' ? 1.4 : 1.8, cls: 'portrait' });
  }

  // ---------- Rangos ----------
  const RANKS = [
    { xp: 0, name: 'Recluta', icon: '🔰' },
    { xp: 300, name: 'Pelotón Delta · Novato', icon: '🪖' },
    { xp: 1000, name: 'Soldado de la COG', icon: '⚙️' },
    { xp: 2500, name: 'Paracaidista ODST', icon: '🪂' },
    { xp: 5000, name: 'Spartan', icon: '🛡️' },
    { xp: 9000, name: 'Spartan Veterano', icon: '⚔️' },
    { xp: 15000, name: 'Slayer', icon: '🔥' },
    { xp: 25000, name: 'Maestro Ninja del Dragón', icon: '🐉' },
    { xp: 40000, name: 'Leyenda', icon: '👑' },
  ];
  function rankFor(xp) {
    let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
    const r = RANKS[i], nx = RANKS[i + 1];
    return { ...r, index: i, next: nx || null, pct: nx ? (xp - r.xp) / (nx.xp - r.xp) * 100 : 100, toNext: nx ? nx.xp - xp : 0 };
  }

  // ---------- Frases ----------
  const LINES = {
    rest: ['Recargando escudos…', 'Respira. Los demonios no descansan; tú sí, un momento.', 'Cúbrete y recarga. Ya vuelves a la acción.', 'El dojo te observa. Respira hondo.', 'El Pelotón Delta no deja a nadie atrás.', 'Hidrátate, soldado.', 'Un Spartan nunca abandona una misión.', 'Rasga y desgarra… tus excusas.', 'La katana se afila en el descanso.', 'Siguiente oleada en camino.'],
    finish: ['Misión cumplida.', 'Zona despejada. Buen trabajo, soldado.', 'El infierno ya no es lo que era.', 'El clan del Dragón estaría orgulloso.', 'Oleada superada. Vuelve a la base.', 'Otro día, otra victoria.'],
    hello: ['Bienvenido a la base', 'Listo para el despliegue', 'El campo de batalla te espera', 'Hoy se entrena, mañana se presume'],
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Pose de retrato
  S.victory = mk({ h: [60, 15], n: [60, 25], p: [60, 52], e1: [68, 14], w1: [70, 1], e2: [52, 14], w2: [50, 1], k1: [64, 71], f1: [67, 91], k2: [56, 71], f2: [53, 91] });
  S.victory2 = shift(S.victory, 0, -5, { f1: [67, 87], f2: [53, 87], k1: [65, 67], k2: [55, 67] });
  ANIM.__idle = ['boxA', 'boxB'];
  ANIM.__victory = ['victory', 'victory2'];
  window.AVATAR = { figure, portrait, CLASSES, RANKS, rankFor, LINES, pick };
})();
