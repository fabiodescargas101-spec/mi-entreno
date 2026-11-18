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

  // ---------- Poses nuevas: calistenia, carrera y montaña ----------
  S.runA = mk({ h: [64, 16], n: [63, 26], p: [59, 53], e1: [54, 37], w1: [53, 47], e2: [69, 36], w2: [75, 29], k1: [72, 63], f1: [69, 80], k2: [53, 71], f2: [43, 82] });
  S.runB = mk({ h: [64, 18], n: [63, 28], p: [59, 55], e1: [69, 38], w1: [75, 31], e2: [54, 39], w2: [53, 49], k1: [53, 73], f1: [43, 84], k2: [72, 65], f2: [69, 82] });
  S.jogA = mk({ h: [62, 16], n: [61, 26], p: [59, 53], e1: [56, 37], w1: [58, 47], e2: [66, 37], w2: [71, 32], k1: [67, 69], f1: [66, 88], k2: [55, 72], f2: [49, 86] });
  S.jogB = mk({ h: [62, 17], n: [61, 27], p: [59, 54], e1: [66, 38], w1: [71, 33], e2: [56, 38], w2: [58, 48], k1: [55, 73], f1: [49, 87], k2: [67, 70], f2: [66, 89] });
  S.sprintA = mk({ h: [69, 19], n: [66, 29], p: [57, 54], e1: [53, 39], w1: [48, 48], e2: [74, 35], w2: [79, 25], k1: [74, 57], f1: [70, 74], k2: [49, 70], f2: [35, 75] });
  S.sprintB = mk({ h: [69, 21], n: [66, 31], p: [57, 56], e1: [74, 37], w1: [79, 27], e2: [53, 41], w2: [48, 50], k1: [49, 72], f1: [35, 77], k2: [74, 59], f2: [70, 76] });
  S.hikeA = mk({ h: [71, 23], n: [67, 32], p: [57, 56], e1: [69, 45], w1: [70, 58], e2: [58, 45], w2: [53, 54], k1: [73, 66], f1: [75, 84], k2: [52, 73], f2: [45, 91] });
  S.hikeB = mk({ h: [71, 24], n: [67, 33], p: [57, 57], e1: [62, 46], w1: [58, 56], e2: [69, 45], w2: [71, 57], k1: [55, 74], f1: [47, 91], k2: [72, 67], f2: [75, 85] });
  S.walkA = mk({ h: [60, 16], n: [60, 26], p: [60, 53], e1: [56, 39], w1: [53, 50], e2: [64, 39], w2: [67, 50], k1: [65, 72], f1: [70, 91], k2: [56, 72], f2: [50, 90] });
  S.walkB = mk({ h: [60, 17], n: [60, 27], p: [60, 54], e1: [64, 40], w1: [67, 51], e2: [56, 40], w2: [53, 51], k1: [56, 73], f1: [50, 91], k2: [65, 73], f2: [70, 91] });
  S.downA = mk({ h: [56, 18], n: [57, 28], p: [60, 55], e1: [67, 37], w1: [74, 42], e2: [52, 37], w2: [46, 42], k1: [67, 71], f1: [71, 89], k2: [57, 74], f2: [55, 91] });
  S.downB = mk({ h: [56, 19], n: [57, 29], p: [60, 56], e1: [66, 38], w1: [73, 44], e2: [52, 38], w2: [46, 44], k1: [58, 74], f1: [55, 91], k2: [67, 72], f2: [71, 90] });
  S.hang = mk({ h: [64, 18], n: [60, 26], p: [59, 52], e1: [61, 15], w1: [62, 4], e2: [59, 15], w2: [60, 4], k1: [63, 70], f1: [58, 86], k2: [61, 70], f2: [56, 86] });
  S.hang2 = { ...S.hang, n: [60, 24], h: [64, 16], p: [59, 50], k1: [63, 68], f1: [58, 84], k2: [61, 68], f2: [56, 84] };
  S.pullTop = mk({ h: [66, -3], n: [61, 9], p: [59, 36], e1: [70, 13], w1: [62, 4], e2: [68, 13], w2: [60, 4], k1: [64, 54], f1: [58, 70], k2: [62, 54], f2: [56, 70] });
  S.hangKnees = { ...S.hang2, p: [59, 49], k1: [73, 44], f1: [73, 62], k2: [71, 45], f2: [71, 63] };
  S.rowDown = mk({ h: [89, 67], n: [80, 70], p: [50, 80], e1: [81, 60], w1: [82, 50], e2: [79, 60], w2: [80, 50], k1: [35, 85], f1: [20, 90] });
  S.rowUp = mk({ h: [89, 54], n: [80, 57], p: [50, 74], e1: [70, 60], w1: [82, 50], e2: [68, 60], w2: [80, 50], k1: [35, 82], f1: [20, 90] });
  S.archerDown = { ...S.pushDown, e2: [97, 89], w2: [106, 91] };
  S.hinduUp = mk({ h: [92, 57], n: [84, 66], p: [58, 83], e1: [85, 78], w1: [86, 91], k1: [42, 87], f1: [26, 90] });
  S.lsit = mk({ h: [48, 56], n: [48, 66], p: [50, 82], e1: [49, 78], w1: [50, 91], e2: [47, 78], w2: [48, 91], k1: [67, 82], f1: [85, 81] });
  S.lsit2 = { ...S.lsit, p: [50, 80], k1: [67, 79], f1: [85, 76], k2: [65, 79], f2: [83, 76] };
  S.handstand = mk({ h: [50, 82], n: [45, 72], p: [42, 46], e1: [46, 82], w1: [46, 91], e2: [44, 82], w2: [44, 91], k1: [41, 27], f1: [40, 8], k2: [43, 27], f2: [42, 8] });
  S.handstand2 = { ...S.handstand, n: [45, 70], h: [50, 80], p: [42, 44], k1: [41, 25], f1: [40, 6], k2: [43, 25], f2: [42, 6] };
  S.bulgUp = mk({ h: [62, 17], n: [62, 27], p: [60, 54], e1: [64, 40], w1: [66, 51], k1: [66, 72], f1: [68, 91], k2: [48, 72], f2: [33, 62] });
  S.bulgDown = mk({ h: [63, 33], n: [62, 43], p: [56, 68], e1: [65, 55], w1: [67, 66], k1: [70, 72], f1: [70, 91], k2: [44, 84], f2: [33, 62] });
  S.cossack = mk({ h: [53, 44], n: [52, 54], p: [48, 74], e1: [62, 56], w1: [71, 52], e2: [60, 57], w2: [69, 53], k1: [70, 86], f1: [90, 91], k2: [38, 74], f2: [40, 91] });
  S.squatArms = { ...S.squat, e1: [46, 54], w1: [37, 60], e2: [44, 55], w2: [35, 61] };
  S.broadAir = mk({ h: [76, 10], n: [73, 20], p: [64, 45], e1: [82, 14], w1: [90, 8], e2: [80, 15], w2: [88, 9], k1: [80, 51], f1: [80, 69], k2: [78, 53], f2: [77, 71] });
  S.broadLand = shift(S.squat, 26, 0);
  S.boxAir = shift(S.tuckAir, 6, -6);
  S.onBox = shift(S.stand, 18, -13);
  S.rdlUp = mk({ h: [60, 17], n: [60, 27], p: [60, 54], e1: [61, 40], w1: [62, 52], k1: [61, 73], f1: [62, 91], k2: [56, 71], f2: [51, 87] });
  S.rdlDown = mk({ h: [86, 47], n: [78, 50], p: [58, 56], e1: [78, 62], w1: [78, 74], e2: [76, 62], w2: [76, 74], k1: [61, 74], f1: [62, 91], k2: [40, 56], f2: [23, 57] });
  S.calfStep = shift(S.stand, 16, -13, { k2: [72, 62], f2: [68, 74] });
  S.calfStepUp = shift(S.calfStep, 0, -4);
  S.downDog = { ...S.pikeUp, h: [85, 82], n: [79, 76] };
  S.downDog2 = { ...S.pikeUp, h: [84, 84], n: [79, 78], p: [55, 54], f1: [39, 91], k1: [47, 72] };
  S.legSwingA = { ...S.stand, e2: [66, 30], w2: [72, 24], k1: [70, 66], f1: [80, 79] };
  S.legSwingB = { ...S.stand, e2: [66, 30], w2: [72, 24], k1: [52, 72], f1: [42, 86] };

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
  Object.assign(ANIM, {
    'pullup': ['hang', 'pullTop', 'bar'], 'negative-pullup': ['pullTop', 'pullTop', 'hang', 'bar'], 'dead-hang': ['hang', 'hang2', 'bar'],
    'hanging-knee-raise': ['hang2', 'hangKnees', 'bar'], 'australian-row': ['rowDown', 'rowUp', 'lowbar'], 'archer-pushup': ['pushUp', 'archerDown'],
    'hindu-pushup': ['pikeUp', 'pushDown', 'hinduUp', 'pushDown'], 'l-sit': ['lsit', 'lsit2'], 'wall-handstand': ['handstand', 'handstand2', 'wall'],
    'bulgarian-split-squat': ['bulgUp', 'bulgDown', 'bench'], 'cossack-squat': ['sumoUp', 'cossack'], 'broad-jump': ['squatArms', 'broadAir', 'broadLand'],
    'box-jump': ['squatArms', 'boxAir', 'onBox', 'step'], 'single-leg-rdl': ['rdlUp', 'rdlDown'], 'single-leg-calf-raise': ['calfStep', 'calfStepUp', 'step'],
    'run-in-place': ['jogA', 'jogB'], 'jog-easy': ['jogA', 'jogB', 'trail'], 'run-steady': ['runA', 'runB', 'trail'], 'sprint': ['sprintA', 'sprintB', 'trail'],
    'hill-sprint': ['sprintA', 'sprintB', 'hill'], 'power-hike': ['hikeA', 'hikeB', 'hill'], 'stair-climb': ['stepA', 'stepB', 'stairs'],
    'walk-recovery': ['walkA', 'walkB', 'trail'], 'downhill-run': ['downA', 'downB', 'hilldown'], 'a-skip': ['kneeA', 'kneeB'], 'strides': ['runA', 'runB', 'trail'],
    'backpack-hike': ['hikeA', 'hikeB', 'hill'], 'down-dog': ['downDog', 'downDog2'], 'leg-swing': ['legSwingA', 'legSwingB'],
  });

  const PROPS = ['wall', 'step', 'chair', 'bar', 'lowbar', 'bench', 'stairs', 'hill', 'hilldown', 'trail'];
  const BACK_PROPS = ['hill', 'hilldown', 'trail']; // decorados que van detrás de la figura

  // ---------- Clases de avatar ----------
  // skin = piel o armadura · top = camiseta/coraza · bottom = pantalón · shoe = calzado · hair = pelo (solo humanos)
  const CLASSES = {
    atleta: { name: 'Atleta', desc: 'Humano, sin armadura. Se ve claro cada movimiento.', skin: '#d6a07a', top: '#2a2f38', bottom: '#20242b', shoe: '#ff6b1a', hair: '#2a1d16', accent: '#ff6b1a', human: true },
    atleta2: { name: 'Atleta (ella)', desc: 'Humana, ropa deportiva y coleta.', skin: '#e3b08c', top: '#3a2a3f', bottom: '#22232b', shoe: '#ff3b30', hair: '#3b2416', accent: '#ff3b30', human: true, ponytail: true },
    spartan: { name: 'Spartan', desc: 'Supersoldado blindado. Visor dorado, cero excusas.', skin: '#b9bd9c', top: '#8e9277', bottom: '#5f6350', shoe: '#3d4033', accent: '#ffb21a' },
    gear: { name: 'Gear', desc: 'Soldado de la COG. Hombreras enormes y pañuelo rojo.', skin: '#b4aca6', top: '#8a837d', bottom: '#5c5550', shoe: '#3a3532', accent: '#ff3b30', pads: true },
    slayer: { name: 'Slayer', desc: 'Armadura de combate infernal. Rasga y desgarra.', skin: '#a8957d', top: '#7d6c58', bottom: '#5a4b3c', shoe: '#3a3128', accent: '#ff5a1f' },
    ninja: { name: 'Ninja', desc: 'Del linaje del Dragón. Rápido, silencioso, letal.', skin: '#8f8f99', top: '#2b2b31', bottom: '#26262b', shoe: '#1b1b1f', accent: '#e11d2e', scarf: true },
  };
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const ch = (s) => Math.round(((n >> s) & 255) * f); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
  const PROP_SVG = {
    wall: '<rect x="29" y="0" width="8" height="92" rx="1.5" class="prop"/>',
    step: '<rect x="64" y="78.5" width="28" height="13" rx="2" class="prop"/>',
    chair: '<rect x="30" y="57" width="20" height="5" rx="1.5" class="prop"/><rect x="31" y="62" width="3.5" height="29" class="prop"/><rect x="45.5" y="62" width="3.5" height="29" class="prop"/>',
    bench: '<rect x="18" y="62" width="24" height="5" rx="1.5" class="prop"/><rect x="19" y="67" width="3.5" height="24" class="prop"/><rect x="37.5" y="67" width="3.5" height="24" class="prop"/>',
    bar: '<rect x="30" y="2" width="62" height="4" rx="2" class="prop"/><rect x="28" y="-12" width="4" height="104" rx="1.5" class="prop" opacity=".55"/><rect x="90" y="-12" width="4" height="104" rx="1.5" class="prop" opacity=".55"/>',
    lowbar: '<rect x="66" y="48" width="34" height="4" rx="2" class="prop"/><rect x="96" y="48" width="4" height="44" rx="1.5" class="prop" opacity=".6"/>',
    stairs: '<path d="M60 92 V80 H74 V68 H88 V56 H122 V92 Z" class="prop"/>',
    hill: '<path d="M-6 92 L30 58 L48 70 L78 34 L104 56 L126 44 V92 Z" class="scene"/><path d="M78 34 L71 42 L76 41 L80 45 L84 40 Z" class="snow"/>',
    hilldown: '<path d="M-6 44 L22 30 L50 54 L84 46 L126 74 V92 H-6 Z" class="scene"/>',
    trail: '<path d="M-6 92 L14 70 L30 80 L56 52 L80 76 L98 62 L126 82 V92 Z" class="scene"/>',
  };

  // ---------- Dibujo del cuerpo ----------
  // Partes del cuerpo con volumen: cada segmento es un trazo grueso con un "vientre" muscular cerca de la articulación de arriba.
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]], mul: (a, k) => [a[0] * k, a[1] * k],
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    norm: (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
  };
  const faceDir = (f) => { const u = V.norm(V.sub(f.h, f.n)); const c1 = [-u[1], u[0]], c2 = [u[1], -u[0]]; return (c1[0] - 0.3 * c1[1]) >= (c2[0] - 0.3 * c2[1]) ? c1 : c2; };
  const toeOf = (f, k, a) => { // dirección del pie: perpendicular a la espinilla, hacia delante/arriba
    const s = V.norm(V.sub(f[a], f[k])); const c1 = [-s[1], s[0]], c2 = [s[1], -s[0]];
    const d = (c1[0] - 0.6 * c1[1]) >= (c2[0] - 0.6 * c2[1]) ? c1 : c2;
    return V.add(f[a], V.mul(d, 5.6));
  };
  // Puntos derivados de una pose
  const D = {
    shoulderCap: (f) => V.lerp(f.n, f.p, 0.08), chest: (f) => V.lerp(f.n, f.p, 0.3), waist: (f) => V.lerp(f.n, f.p, 0.7),
    neckTop: (f) => V.lerp(f.n, f.h, 0.62), band1: (f) => V.lerp(f.n, f.p, 0.8), band2: (f) => V.lerp(f.n, f.p, 0.84), hipTop: (f) => V.lerp(f.p, f.n, 0.12),
    toe1: (f) => toeOf(f, 'k1', 'f1'), toe2: (f) => toeOf(f, 'k2', 'f2'),
    visor: (f) => V.add(f.h, V.mul(faceDir(f), 3.4)),
    hair: (f) => V.add(V.add(f.h, V.mul(V.norm(V.sub(f.h, f.n)), 1.5)), V.mul(faceDir(f), -1.3)),
    face: (f) => V.add(f.h, V.mul(faceDir(f), 1.1)),
    tail: (f) => V.add(V.add(f.h, V.mul(faceDir(f), -7.5)), V.mul(V.norm(V.sub(f.n, f.h)), 7)),
    scarf: (f) => V.add(V.lerp(f.n, f.h, 0.4), V.mul(faceDir(f), -11)),
  };
  ['e1', 'e2', 'k1', 'k2'].forEach((j) => { // vientre muscular del brazo y del muslo
    const top = j[0] === 'e' ? 'n' : 'p';
    D['b' + j] = (f) => V.lerp(f[top], f[j], 0.55);
  });
  ['w1', 'w2', 'f1', 'f2'].forEach((j) => { const mid = j[0] === 'w' ? 'e' + j[1] : 'k' + j[1]; D['c' + j] = (f) => V.lerp(f[mid], f[j], 0.45); });
  const pt = (f, key) => (D[key] ? D[key](f) : f[key]);
  const r1 = (v) => Math.round(v * 10) / 10;

  let uidN = 0;
  function figure(exId, opts = {}) {
    const avatar = opts.avatar && CLASSES[opts.avatar] ? opts.avatar : 'atleta';
    const c = CLASSES[avatar];
    let seq = (ANIM[exId] || ['stand', 'standFwd']).slice();
    const props = seq.filter((s) => PROPS.includes(s)); seq = seq.filter((s) => !PROPS.includes(s));
    const frames = seq.map((k) => S[k] || S.stand);
    const animated = !opts.still && frames.length > 1;
    const dur = opts.dur || Math.max(1.6, frames.length * 0.85);
    const loop = frames.concat([frames[0]]);
    const kt = loop.map((_, i) => (i / (loop.length - 1)).toFixed(3)).join(';');
    const spl = Array(loop.length - 1).fill('.45 0 .55 1').join(';');
    const anim = (attr, vals) => `<animate attributeName="${attr}" values="${vals.join(';')}" dur="${dur}s" keyTimes="${kt}" calcMode="spline" keySplines="${spl}" repeatCount="indefinite"/>`;
    const f0 = frames[0];
    const line = (a, b, w, color, extra = '') => {
      const A0 = pt(f0, a), B0 = pt(f0, b);
      const inner = animated ? ['x1', 'y1', 'x2', 'y2'].map((attr, i) => anim(attr, loop.map((f) => r1((i < 2 ? pt(f, a) : pt(f, b))[i % 2])))).join('') : '';
      return `<line x1="${r1(A0[0])}" y1="${r1(A0[1])}" x2="${r1(B0[0])}" y2="${r1(B0[1])}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${extra}>${inner}</line>`;
    };
    const dot = (a, r, color, extra = '') => {
      const A0 = pt(f0, a);
      const inner = animated ? anim('cx', loop.map((f) => r1(pt(f, a)[0]))) + anim('cy', loop.map((f) => r1(pt(f, a)[1]))) : '';
      return `<circle cx="${r1(A0[0])}" cy="${r1(A0[1])}" r="${r}" fill="${color}"${extra}>${inner}</circle>`;
    };
    // Colores: lado lejano más oscuro para dar profundidad
    const skinN = c.skin, skinF = shade(c.skin, 0.68), topC = c.top, topF = shade(c.top, 0.75), botN = c.bottom, botF = shade(c.bottom, 0.7);
    const armTop = c.human ? skinN : c.top, armTopF = c.human ? skinF : topF;
    const OUT = '#0b0b0d';
    const limb = (side) => { // side 2 = lejano, 1 = cercano
      const far = side === '2';
      const sk = far ? skinF : skinN, bo = far ? botF : botN, at = far ? armTopF : armTop, sh = far ? shade(c.shoe, 0.7) : c.shoe;
      return {
        leg: [['p', 'k' + side, 9.6, bo], ['p', 'bk' + side, 11.4, bo], ['k' + side, 'f' + side, 7.2, c.human ? sk : bo], ['k' + side, 'cf' + side, 8.2, c.human ? sk : bo], ['f' + side, 'toe' + side, 4.6, sh]],
        arm: [['n', 'e' + side, 6.4, at], ['n', 'be' + side, 7.8, at], ['e' + side, 'w' + side, 5.2, sk], ['e' + side, 'cw' + side, 6.0, sk]],
        hand: ['w' + side, 3.1, sk],
      };
    };
    const L2 = limb('2'), L1 = limb('1');
    const torso = [['n', 'p', 13.5, topC], ['shoulderCap', 'chest', 16.5, topC], ['waist', 'hipTop', 12.5, topC], ['hipTop', 'p', 13, botN]];
    const parts = []; // [tipo, args]
    const pushSeg = (arr) => arr.forEach((s) => parts.push(['l', s]));
    pushSeg(L2.leg); pushSeg(L2.arm); parts.push(['d', L2.hand]);
    pushSeg(L1.leg);
    parts.push(['l', ['n', 'neckTop', 5.6, c.human ? skinN : shade(c.skin, 0.85)]]);
    pushSeg(torso);
    if (c.pads) parts.push(['d', ['shoulderCap', 7.2, c.skin]]);
    parts.push(['head']);
    pushSeg(L1.arm); parts.push(['d', L1.hand]);
    // 1.ª pasada: contorno oscuro · 2.ª pasada: color
    const outline = parts.map(([k, a]) => k === 'l' ? line(a[0], a[1], a[2] + 2.4, OUT) : k === 'd' ? dot(a[0], a[1] + 1.2, OUT) : dot('h', 8.4, OUT)).join('');
    const head = () => {
      if (c.human) return dot('hair', 7.2, c.hair) + dot('face', 6.6, skinN) + (c.ponytail ? line('hair', 'tail', 3.6, c.hair) : '');
      return dot('h', 7.3, c.skin) + dot('visor', 3, c.accent, ' class="visor"') + (c.scarf ? line('neckTop', 'scarf', 2.4, c.accent) : '');
    };
    const fill = parts.map(([k, a]) => k === 'l' ? line(a[0], a[1], a[2], a[3]) : k === 'd' ? dot(a[0], a[1], a[2]) : head()).join('');
    // franja de color en la camiseta / armadura
    // Silueta fantasma de la posición final para ver el recorrido del movimiento
    let ghost = '';
    if (animated && !opts.noGhost) {
      const g = frames[Math.min(1, frames.length - 1)];
      const gl = (a, b, w) => { const A0 = pt(g, a), B0 = pt(g, b); return `<line x1="${r1(A0[0])}" y1="${r1(A0[1])}" x2="${r1(B0[0])}" y2="${r1(B0[1])}" stroke-width="${w}" stroke-linecap="round"/>`; };
      ghost = `<g class="ghost" stroke="${c.accent}">${[['p', 'k2', 9], ['k2', 'f2', 7], ['n', 'e2', 6], ['e2', 'w2', 5], ['n', 'p', 13], ['p', 'k1', 9], ['k1', 'f1', 7], ['n', 'e1', 6], ['e1', 'w1', 5], ['n', 'neckTop', 5]].map(([a, b, w]) => gl(a, b, w)).join('')}<circle cx="${r1(g.h[0])}" cy="${r1(g.h[1])}" r="7" fill="${c.accent}" stroke="none"/></g>`;
    }
    const id = 'fg' + (++uidN);
    const back = props.filter((p) => BACK_PROPS.includes(p)).map((p) => PROP_SVG[p]).join('');
    const front = props.filter((p) => !BACK_PROPS.includes(p)).map((p) => PROP_SVG[p]).join('');
    return `<svg class="fig ${opts.cls || ''}" viewBox="-6 -14 132 108" role="img" aria-label="Avatar haciendo el ejercicio">
      <defs><radialGradient id="${id}" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="${c.accent}" stop-opacity=".28"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient></defs>
      ${back}<ellipse cx="60" cy="92" rx="58" ry="14" fill="url(#${id})"/>
      <line x1="-2" y1="92.5" x2="122" y2="92.5" class="ground"/>
      ${front}${ghost}<g class="body">${outline}${fill}</g>
    </svg>`;
  }
  function portrait(avatar, kind = 'idle') { // idle = en guardia · victory = celebración
    return figure(kind === 'victory' ? '__victory' : '__idle', { avatar, dur: kind === 'victory' ? 1.4 : 1.8, cls: 'portrait', noGhost: true });
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
