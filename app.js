'use strict';
/* Mi Entreno — app personal de ejercicios en casa con copia en Google Drive. */

// ============ Utilidades ============
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const todayStr = (d = new Date()) => d.toLocaleDateString('sv-SE'); // AAAA-MM-DD en hora local
const parseDay = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const DAY = 86400000;
const num = (n, d = 1) => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: d });
const fmtDay = (s, opts = { day: 'numeric', month: 'short' }) => parseDay(s).toLocaleDateString('es-ES', opts);
const fmtMin = (sec) => { const m = Math.round(sec / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`; };
const clock = (sec) => { sec = Math.max(0, Math.ceil(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const toNum = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };

const EX = Object.fromEntries(window.EXERCISES.map((e) => [e.id, e]));
const L = window.LIBRARY;
const MM = window.MUSCLEMAP;
const PG = window.PROGRAMS;
const allExercises = () => [...window.EXERCISES, ...state.libExercises];
function registerLib() { state.libExercises.forEach((e) => { EX[e.id] = e; }); }
const LEVELS = ['', 'Normal', 'Heroico', 'Legendario'];
const A = window.AVATAR;
const exName = (ex) => ex.alias || ex.name;
const exSub = (ex) => (ex.alias && ex.alias !== ex.name ? ex.name : ex.originalName && ex.originalName !== ex.name ? ex.originalName : '');
function exVisual(ex, opts = {}) { // foto (biblioteca) o avatar animado
  if (ex.images && ex.images.length) {
    const [a, b] = ex.images;
    const img = (src) => `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
    return `<span class="photo ${!opts.still && b ? 'anim' : ''}">${img(a)}${!opts.still && b ? img(b) : ''}</span>`;
  }
  return A.figure(ex.id, { avatar: avatarId(), still: opts.still });
}
const avatarId = () => (A.CLASSES[state.profile.avatar] ? state.profile.avatar : 'atleta');
const totalXP = () => state.sessions.reduce((a, s) => a + (s.xp ?? Math.round(s.kcal + 25)), 0);

// ============ Datos ============
const KEY = 'mientreno:datos:v1';
const SYNC_KEY = 'mientreno:sync:v1';
const defaults = () => ({
  version: 1, updatedAt: 0,
  profile: { name: '', avatar: 'atleta', avatarV2: true, sex: '', birthYear: '', heightCm: '', startWeight: '', goalWeight: '', goalDate: '',
    activity: '', cardioGoal: '', stepsGoal: '', waterGoal: '', sleepGoal: '' },
  weights: [],         // { date, kg, waist? }
  sessions: [],        // { id, date (ISO), routineId, routineName, durationSec, activeSec, kcal, exercises: [{ id, reps?, sec }] }
  customRoutines: [],  // misma forma que ROUTINES
  libExercises: [],    // ejercicios añadidos desde la Biblioteca libre
  overrides: {},       // cambios personales a misiones de la app: { [id]: { warmup?, items, cooldown? } }
  programs: {},        // progreso de campañas: { [id]: { day, log: [{ day, date }], last } }
  measures: [],        // { date, neck?, chest?, arm?, waist?, hip?, thigh?, calf?, fat? }
  days: {},            // registro diario: { [AAAA-MM-DD]: { steps?, sleep?, water?, kcalIn? } }
  settings: { sound: true, voice: true },
});
const normalize = (s) => {
  const d = defaults();
  return { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) }, settings: { ...d.settings, ...(s.settings || {}) },
    weights: s.weights || [], sessions: s.sessions || [], customRoutines: s.customRoutines || [], libExercises: s.libExercises || [],
    overrides: s.overrides || {}, programs: s.programs || {}, measures: s.measures || [], days: s.days || {} };
};
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.version) { const n = normalize(s); if (!(s.profile && s.profile.avatarV2)) { n.profile.avatar = 'atleta'; n.profile.avatarV2 = true; } return n; } // nuevo avatar humano
  } catch (e) {}
  return defaults();
}
function loadSync() { try { return JSON.parse(localStorage.getItem(SYNC_KEY)) || {}; } catch (e) { return {}; } }
let state = loadState();
let sync = loadSync(); // { clientId, connected, fileId, lastSyncedAt, lastSyncTime, token, tokenExp } — solo de este dispositivo
const saveSync = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch (e) {} };
function persist() { registerLib(); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('No se pudo guardar en el dispositivo'); } }
function save() { state.updatedAt = Date.now(); persist(); Drive.schedulePush(); }

// ============ Cálculos ============
const sortedWeights = () => [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
const currentWeight = () => { const w = sortedWeights(); return w.length ? w[w.length - 1].kg : (toNum(state.profile.startWeight) || 70); };
const kcalFor = (met, sec, kg = currentWeight()) => (met * 3.5 * kg / 200) * (sec / 60);
const exActiveSec = (ex, n) => (ex.type === 'time' ? n : n * (ex.secPerRep || 3)) * (ex.perSide ? 2 : 1);
const withOverride = (r) => (state.overrides[r.id] ? { ...r, ...state.overrides[r.id] } : r);
const allRoutines = () => [...state.customRoutines, ...window.ROUTINES.map(withOverride)];
const findRoutine = (id) => { const r = state.customRoutines.find((x) => x.id === id) || window.ROUTINES.find((x) => x.id === id); return r ? withOverride(r) : undefined; };

function routineEstimate(r) { // usa los mismos pasos que el reproductor
  let active = 0, kcal = 0, total = 0, rests = 0;
  buildSteps(r).forEach((s) => {
    if (s.kind === 'ex') { const sec = s.sec ?? exActiveSec(s.ex, s.n); active += sec; kcal += kcalFor(s.ex.met, sec); total += sec; }
    else { total += s.sec; rests += s.sec; }
  });
  return { active, kcal: kcal + kcalFor(1.5, rests), total };
}

function linReg(points) { // points: [{x (días), y}]
  const n = points.length; if (n < 2) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n, my = points.reduce((s, p) => s + p.y, 0) / n;
  let num_ = 0, den = 0; points.forEach((p) => { num_ += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; });
  return den ? num_ / den : null; // kg por día
}

function goalInfo() {
  const w = sortedWeights();
  const p = state.profile;
  const goal = toNum(p.goalWeight);
  const current = w.length ? w[w.length - 1].kg : toNum(p.startWeight);
  const start = toNum(p.startWeight) ?? (w.length ? w[0].kg : null);
  const info = { current, start, goal, hasGoal: goal != null && current != null && start != null };
  if (current != null) {
    const last7 = w.filter((x) => parseDay(x.date) >= new Date(Date.now() - 7 * DAY));
    info.avg7 = last7.length ? last7.reduce((s, x) => s + x.kg, 0) / last7.length : null;
    const h = toNum(p.heightCm); if (h) info.bmi = current / ((h / 100) ** 2);
  }
  // Ritmo: regresión de los últimos 35 días
  const since = Date.now() - 35 * DAY;
  const recent = w.filter((x) => parseDay(x.date).getTime() >= since);
  if (recent.length >= 2 && (parseDay(recent[recent.length - 1].date) - parseDay(recent[0].date)) / DAY >= 5) {
    const t0 = parseDay(recent[0].date).getTime();
    info.ratePerDay = linReg(recent.map((x) => ({ x: (parseDay(x.date).getTime() - t0) / DAY, y: x.kg })));
  }
  if (!info.hasGoal) return info;
  const losing = goal < start;
  info.losing = losing;
  info.remaining = losing ? current - goal : goal - current; // >0 falta, <=0 conseguido
  const totalChange = Math.abs(start - goal);
  info.done = info.remaining <= 0;
  info.pct = totalChange ? clamp((totalChange - Math.max(0, info.remaining)) / totalChange * 100, 0, 100) : 100;
  info.changed = losing ? start - current : current - start;
  if (!info.done && info.ratePerDay) {
    const towards = losing ? -info.ratePerDay : info.ratePerDay; // kg/día hacia el objetivo
    if (towards > 0.005) { info.daysToGoal = info.remaining / towards; info.eta = new Date(Date.now() + info.daysToGoal * DAY); }
    else info.wrongWay = true;
  }
  if (!info.done && p.goalDate) {
    const days = (parseDay(p.goalDate) - parseDay(todayStr())) / DAY;
    info.daysLeft = days;
    if (days > 0) { info.neededPerWeek = info.remaining / days * 7; info.dailyKcal = info.remaining * 7700 / days; }
  }
  return info;
}

const weekStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
function weekStats(offset = 0) {
  const s = weekStart(new Date()); s.setDate(s.getDate() - offset * 7);
  const e = new Date(s.getTime() + 7 * DAY);
  const list = state.sessions.filter((x) => { const d = new Date(x.date); return d >= s && d < e; });
  return { start: s, count: list.length, sec: list.reduce((a, x) => a + x.durationSec, 0), kcal: list.reduce((a, x) => a + x.kcal, 0) };
}
function streak() {
  const days = new Set(state.sessions.map((x) => todayStr(new Date(x.date))));
  let d = new Date(); if (!days.has(todayStr(d))) d = new Date(Date.now() - DAY);
  let n = 0; while (days.has(todayStr(d))) { n++; d = new Date(d.getTime() - DAY); }
  return n;
}

// ---------- Cardio, recuperación y calorías ----------
const ACT = Object.fromEntries(PG.ACTIVITIES.map(([id, name, icon, met]) => [id, { id, name, icon, met }]));
const ptsFor = (met, sec) => (met >= 6 ? 2 : met >= 3 ? 1 : 0) * sec / 60; // puntos cardio: 1/min moderado, 2/min intenso
function sessionPoints(s) {
  if (s.met) return ptsFor(s.met, s.activeSec || s.durationSec);
  return (s.exercises || []).reduce((a, x) => { const e = EX[x.id]; return a + (e ? ptsFor(e.met, x.sec || 0) : 0); }, 0);
}
const sessionsOn = (day) => state.sessions.filter((s) => todayStr(new Date(s.date)) === day);
const weekPoints = () => { const s = weekStart(new Date()); return state.sessions.filter((x) => new Date(x.date) >= s).reduce((a, x) => a + sessionPoints(x), 0); };
const goalNum = (k, def) => toNum(state.profile[k]) || def;
const dayLog = (day = todayStr()) => state.days[day] || {};
function setDay(day, patch) { state.days[day] = { ...dayLog(day), ...patch }; }
function bmrNow() {
  const p = state.profile, h = toNum(p.heightCm), y = toNum(p.birthYear);
  if (!h || !y || !p.sex) return null;
  return 10 * currentWeight() + 6.25 * h - 5 * (new Date().getFullYear() - y) + (p.sex === 'h' ? 5 : -161); // Mifflin-St Jeor
}
const ACTIVITY_LEVELS = [['1.2', 'Sedentario: oficina, casi sin caminar'], ['1.375', 'Ligero: caminas algo cada día'], ['1.55', 'Moderado: mucho tiempo de pie o caminando'], ['1.725', 'Activo: trabajo físico'], ['1.9', 'Muy activo: trabajo físico duro']];
function dayCalories(day = todayStr()) {
  const bmr = bmrNow(); if (!bmr) return null;
  const kg = currentWeight(), log = dayLog(day);
  const ex = sessionsOn(day).reduce((a, s) => a + Math.max(0, s.kcal - kcalFor(1, s.durationSec, kg)), 0); // neto: sin lo que gastarías en reposo
  const factor = toNum(state.profile.activity) || 1.375;
  const neat = log.steps ? bmr * 0.15 + log.steps * 0.00057 * kg : bmr * (factor - 1);
  return { bmr, neat, neatLabel: log.steps ? `${num(log.steps, 0)} pasos` : 'según tu nivel de actividad', ex, total: bmr + neat + ex, eaten: log.kcalIn || 0 };
}
function intakeTarget() { // kcal que conviene comer al día para tu objetivo
  if (!bmrNow()) return null;
  const days = Array.from({ length: 7 }, (_, i) => todayStr(new Date(Date.now() - i * DAY)));
  const avg = days.reduce((a, d) => a + dayCalories(d).total, 0) / 7;
  const g = goalInfo();
  let adj = 0, why = 'para mantener tu peso';
  if (g.hasGoal && !g.done) {
    const perDay = g.dailyKcal && g.daysLeft > 0 ? g.dailyKcal : 550;
    adj = g.losing ? -Math.min(perDay, 1000, avg * 0.25) : Math.min(perDay, 500);
    why = `para ${g.losing ? 'bajar' : 'subir'} ~${num(Math.abs(adj) * 7 / 7700, 2)} kg/semana`;
  }
  const floor = g.losing ? (state.profile.sex === 'm' ? 1200 : 1500) : 0;
  return { avg, target: Math.max(floor, avg + adj), why };
}
function recovery() {
  const now = Date.now(); let load = 0;
  state.sessions.forEach((s) => { const h = (now - new Date(s.date).getTime()) / 3600000; if (h >= 0 && h < 72) load += sessionPoints(s) * Math.exp(-h / 20); });
  const sl = dayLog().sleep;
  const pct = clamp(100 - load * 1.1 + (sl ? (sl - 7) * 6 : 0), 5, 100);
  return { pct, label: pct >= 75 ? 'Lista para misión dura' : pct >= 45 ? 'Mejor una misión moderada' : 'Toca recuperar', hasData: state.sessions.length > 0 || !!sl };
}

// ---------- Medidas corporales ----------
const MEASURES = [['neck', 'Cuello'], ['chest', 'Pecho'], ['arm', 'Brazo'], ['waist', 'Cintura'], ['hip', 'Cadera'], ['thigh', 'Muslo'], ['calf', 'Pantorrilla']];
const sortedMeasures = () => [...state.measures].sort((a, b) => a.date.localeCompare(b.date));
function bodyFat(m) { // % de grasa: el que anotes tú o el método de la Marina de EE. UU. (cuello, cintura, cadera y altura)
  if (!m) return null; if (m.fat) return m.fat;
  const h = toNum(state.profile.heightCm), sx = state.profile.sex;
  if (!h || !m.neck || !m.waist) return null;
  if (sx === 'h' && m.waist > m.neck) return 495 / (1.0324 - 0.19077 * Math.log10(m.waist - m.neck) + 0.15456 * Math.log10(h)) - 450;
  if (sx === 'm' && m.hip && m.waist + m.hip > m.neck) return 495 / (1.29579 - 0.35004 * Math.log10(m.waist + m.hip - m.neck) + 0.221 * Math.log10(h)) - 450;
  return null;
}
const fatLabel = (f, sx) => { const t = sx === 'm' ? [21, 25, 32] : [14, 18, 25]; return f < t[0] ? 'Atlético' : f < t[1] ? 'En forma' : f < t[2] ? 'Normal' : 'Alto'; };

// ---------- Campañas ----------
const progState = (pid) => state.programs[pid] || { day: 0, log: [] };
const findProg = (pid) => PG.PROGRAMS.find((p) => p.id === pid);
const activeProg = () => PG.PROGRAMS.map((p) => ({ p, st: progState(p.id) })).filter(({ p, st }) => st.day > 0 && st.day < p.days.length).sort((a, b) => (b.st.last || 0) - (a.st.last || 0))[0];

// ============ UI general ============
let tab = 'hoy';
const view = () => $('#view');
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}
function openModal(html) { modalBack = null; curView = null; $('#modal-body').innerHTML = html; $('#modal').classList.add('open'); $('#modal').scrollTop = 0; $('#modal-body').scrollTop = 0; }
function closeModal() { modalBack = null; curView = null; $('#modal').classList.remove('open'); }
function go(t) { tab = t; closeModal(); render(); window.scrollTo(0, 0); }

function render() {
  const bb = $('#back-btn'); if (bb) bb.hidden = tab === 'hoy' && !(tab === 'ejercicios' && exMode !== 'mine');
  document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  ({ hoy: renderHoy, entrenar: renderEntrenar, ejercicios: renderEjercicios, progreso: renderProgreso, ajustes: renderAjustes })[tab]();
  Drive.renderChip();
}

const bar = (pct) => `<div class="bar"><span style="width:${clamp(pct, 0, 100).toFixed(1)}%"></span></div>`;
const stat = (val, label) => `<div class="stat"><b>${val}</b><small>${label}</small></div>`;

// ---------- HOY ----------
function ringSvg(frac, cls = '') {
  const r = 52, c = 2 * Math.PI * r, f = clamp(frac, 0, 1);
  return `<svg viewBox="0 0 130 130" class="ring ${cls}" aria-hidden="true"><circle cx="65" cy="65" r="${r}" class="ring-bg"/><circle cx="65" cy="65" r="${r}" class="ring-fg" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 65 65)"/></svg>`;
}
function goalCardHtml() {
  const g = goalInfo();
  if (g.current == null) return `<div class="card accent-card"><h3>Empieza aquí</h3><p>Registra tu peso y ponte un objetivo para ver cuánto te falta.</p>
      <div class="row"><button class="btn" data-action="weight">Registrar peso</button><button class="btn ghost" data-action="tab" data-tab="ajustes">Poner objetivo</button></div></div>`;
  if (!g.hasGoal) return `<div class="card"><div class="big">${num(g.current)} <small>kg</small></div><p class="muted">Peso actual${g.bmi ? ` · IMC ${num(g.bmi)}` : ''}</p>
      <p>Pon un peso objetivo para ver tu progreso y cuánto te falta.</p><button class="btn ghost" data-action="tab" data-tab="ajustes">Poner objetivo</button></div>`;
  let line;
  if (g.done) line = `<p class="ok-text">🎉 ¡Objetivo conseguido! Estás en ${num(g.current)} kg (meta ${num(g.goal)} kg).</p>`;
  else {
    const parts = [];
    if (g.eta) parts.push(`A tu ritmo actual (${g.ratePerDay > 0 ? '+' : ''}${num(g.ratePerDay * 7, 2)} kg/semana) llegarás hacia el <b>${g.eta.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: g.eta.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}</b>.`);
    else if (g.wrongWay) parts.push(`Las últimas semanas vas en dirección contraria (${g.ratePerDay > 0 ? '+' : ''}${num(g.ratePerDay * 7, 2)} kg/semana). ¡Ánimo, se puede corregir!`);
    else parts.push('Registra tu peso varias veces durante al menos una semana para calcular tu ritmo.');
    if (g.daysLeft != null) {
      if (g.daysLeft > 0) parts.push(`Para llegar el ${fmtDay(state.profile.goalDate, { day: 'numeric', month: 'long' })} necesitas ${num(g.neededPerWeek, 2)} kg/semana${g.losing ? ` (déficit de ~${num(g.dailyKcal, 0)} kcal/día)` : ''}.${g.losing && g.neededPerWeek > 1 ? ' <span class="warn-text">Es un ritmo muy exigente; lo recomendable es 0,5–1 kg/semana.</span>' : ''}`);
      else parts.push('La fecha objetivo ya pasó: pon una nueva en Ajustes.');
    }
    line = parts.map((x) => `<p>${x}</p>`).join('');
  }
  return `<div class="card">
      <div class="goal-head"><div><small class="muted">Te faltan</small><div class="big">${g.done ? '0' : num(g.remaining)} <small>kg</small></div></div>
      <div class="right"><small class="muted">Actual → meta</small><div class="mid">${num(g.current)} → ${num(g.goal)} kg</div></div></div>
      ${bar(g.pct)}
      <div class="row between muted small"><span>${g.changed >= 0 ? (g.losing ? '−' : '+') : (g.losing ? '+' : '−')}${num(Math.abs(g.changed))} kg desde ${num(g.start)} kg</span><span>${num(g.pct, 0)} %</span></div>
      ${line}
      ${g.avg7 ? `<p class="muted small">Media últimos 7 días: ${num(g.avg7)} kg${g.bmi ? ` · IMC ${num(g.bmi)}` : ''}</p>` : ''}
    </div>`;
}
function caloriesCardHtml(compact) {
  const c = dayCalories(), t = intakeTarget();
  if (!c) return `<div class="card"><h3>🔥 Calorías de hoy</h3><p class="muted">Completa altura, año de nacimiento y sexo en Ajustes y registra tu peso para estimar cuánto gastas al día.</p><button class="btn ghost small" data-action="tab" data-tab="ajustes">Completar perfil</button></div>`;
  const bal = c.eaten ? c.eaten - c.total : null;
  return `<div class="card kcal-card"><div class="row between"><h3>🔥 Calorías de hoy</h3><button class="btn small ghost" data-action="log" data-k="food">+ Comida</button></div>
    <div class="kcal-split"><div><small class="muted">Gastadas (estimado)</small><b class="big-k">${num(c.total, 0)}</b><small>kcal</small></div><div><small class="muted">Comidas</small><b class="big-k">${c.eaten ? num(c.eaten, 0) : '—'}</b><small>${t ? `meta ${num(t.target, 0)}` : 'kcal'}</small></div></div>
    <div class="kbar"><span class="k-bmr" style="flex:${c.bmr.toFixed(0)}"></span><span class="k-neat" style="flex:${c.neat.toFixed(0)}"></span><span class="k-ex" style="flex:${Math.max(1, c.ex).toFixed(0)}"></span></div>
    <div class="klegend small"><span><i class="k-bmr"></i>Basal ${num(c.bmr, 0)}</span><span><i class="k-neat"></i>Día a día ${num(c.neat, 0)}</span><span><i class="k-ex"></i>Entrenos ${num(c.ex, 0)}</span></div>
    ${bal != null ? `<p class="small">${bal <= 0 ? `Déficit de <b>${num(-bal, 0)} kcal</b> hoy` : `Superávit de <b>${num(bal, 0)} kcal</b> hoy`}.</p>` : ''}
    ${!compact && t ? `<p class="muted small">Para tu objetivo come unas <b>${num(t.target, 0)} kcal/día</b> (${t.why}). Gasto medio de la última semana: ${num(t.avg, 0)} kcal/día.</p>` : ''}
  </div>`;
}
function renderHoy() {
  const wk = weekStats(), st = streak();
  const name = state.profile.name || A.CLASSES[avatarId()].name;
  const xp = totalXP(), rk = A.rankFor(xp);
  const pts = weekPoints(), ptsGoal = goalNum('cardioGoal', 150);
  const d = dayLog(), rec = recovery(), stepsGoal = goalNum('stepsGoal', 8000), waterGoal = goalNum('waterGoal', 2000);
  const last = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const ap = activeProg();
  view().innerHTML = `
    <div class="hero card">
      <div class="hero-fig">${A.portrait(avatarId())}</div>
      <div class="hero-info">
        <small class="kicker">${A.pick(A.LINES.hello)}</small>
        <h1 class="callsign">${esc(name)}</h1>
        <div class="rank">${rk.icon} ${esc(rk.name)}</div>
        <div class="xpbar"><span style="width:${rk.pct.toFixed(1)}%"></span></div>
        <small class="muted">${num(xp, 0)} XP${rk.next ? ` · ${num(rk.toNext, 0)} para <b>${esc(rk.next.name)}</b>` : ' · rango máximo'}</small>
      </div>
    </div>
    <div class="dash">
      <button class="ring-wrap" data-action="info-points">${ringSvg(pts / ptsGoal)}<span class="ring-c"><small>Cardio semanal</small><b>${num(Math.min(999, pts / ptsGoal * 100), 0)}%</b><span>${num(pts, 0)} de ${num(ptsGoal, 0)}</span></span></button>
      <div class="tiles">
        <button class="tile t-steps" data-action="log" data-k="steps"><span class="ti">👟</span><span><small>Pasos</small><b>${d.steps ? num(d.steps, 0) : '0'}</b>${d.steps ? `<em>${num(d.steps / stepsGoal * 100, 0)} % de ${num(stepsGoal, 0)}</em>` : '<em>Toca para anotar</em>'}</span></button>
        <button class="tile t-rec" data-action="info-rec"><span class="ti">🛡️</span><span><small>Recuperación</small><b>${rec.hasData ? num(rec.pct, 0) + ' %' : 'Sin datos'}</b><em>${rec.hasData ? rec.label : 'Entrena o anota tu sueño'}</em></span></button>
        <button class="tile t-sleep" data-action="log" data-k="sleep"><span class="ti">🌙</span><span><small>Sueño</small><b>${d.sleep ? num(d.sleep) + ' h' : 'Sin datos'}</b><em>${d.sleep ? `meta ${num(goalNum('sleepGoal', 8))} h` : 'Toca para anotar'}</em></span></button>
      </div>
    </div>
    <div class="row dash-btns"><button class="btn pill-btn" data-action="log-menu">＋ Registrar</button><button class="btn pill-btn alt" data-action="quick-start">🏃 Iniciar</button><button class="icon round" data-action="goals" aria-label="Editar metas">✎</button></div>
    <div class="card hello-card"><p class="hello-t">Hola, ${esc(name)}, haz el seguimiento de tu día…</p>
      <div class="hello-chips">${LOGS.map(([k, ic, l]) => `<button class="hchip" data-action="log" data-k="${k}">${ic} ${l}</button>`).join('')}</div>
      <div class="water"><span>💧 ${num(d.water || 0, 0)} / ${num(waterGoal, 0)} ml</span>${bar((d.water || 0) / waterGoal * 100)}<button class="btn small ghost" data-action="water-add" data-ml="250">+250 ml</button></div>
    </div>
    ${ap ? `<button class="card cont-card" data-action="prog-start" data-id="${ap.p.id}"><small class="kicker">Continúa tu campaña</small><b>${esc(ap.p.name)} · Día ${ap.st.day + 1} de ${ap.p.days.length}</b><span class="muted small">${esc(findRoutine(ap.p.days[ap.st.day])?.name || '')}</span>${bar(ap.st.day / ap.p.days.length * 100)}</button>` : ''}
    ${caloriesCardHtml(true)}
    ${goalCardHtml()}
    <div class="card"><h3>Informe semanal</h3>
      <div class="stats">${stat(wk.count, 'entrenos')}${stat(Math.round(wk.sec / 60), 'minutos')}${stat(num(wk.kcal, 0), 'kcal')}${stat(st, st === 1 ? 'día seguido' : 'días seguidos')}</div>
    </div>
    ${last ? `<div class="card"><h3>Última misión</h3><p><b>${esc(last.routineName)}</b></p><p class="muted">${new Date(last.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtMin(last.durationSec)} · ${num(last.kcal, 0)} kcal</p></div>` : ''}
    <button class="btn ghost block big-btn" data-action="tab" data-tab="progreso">🕘 Historial</button>
  `;
}

// ---------- Registrar (actividad, medidas, comida, agua, sueño, pasos, peso) ----------
const LOGS = [['activity', '🏃', 'Actividad'], ['measures', '📏', 'Medidas y grasa'], ['food', '🍽️', 'Comida'], ['water', '💧', 'Hidratación'], ['sleep', '🌙', 'Sueño'], ['steps', '👟', 'Pasos'], ['weight', '⚖️', 'Peso']];
const LOG_FIELDS = {
  steps: ['Pasos de hoy', 'steps', 'pasos', 'Míralos en el contador de pasos de tu móvil o reloj y anótalos aquí.', [1000, 2000]],
  sleep: ['Horas de sueño de anoche', 'sleep', 'horas', 'Dormir 7–9 h mejora la recuperación entre misiones.', [0.5, 1]],
  water: ['Agua de hoy', 'water', 'ml', 'Recomendado: unos 35 ml por kg de peso, más si entrenas o subes el cerro.', [250, 500]],
  food: ['Calorías comidas hoy', 'kcalIn', 'kcal', 'Total aproximado del día. Usa los botones para ir sumando lo que comes.', [100, 300, 500]],
};
const logNum = (v, k) => toNum(k === 'sleep' ? v : String(v).replace(/[.\s]/g, '').replace(',', '.')); // 10.000 pasos → 10000
function logMenu() {
  openModal(`<h2>Registrar</h2><div class="log-grid">${LOGS.map(([k, ic, l]) => `<button class="log-opt" data-action="log" data-k="${k}"><span>${ic}</span>${l}</button>`).join('')}</div><button class="btn ghost block" data-action="close">Cerrar</button>`);
  curView = logMenu;
}
function logModal(k) {
  if (k === 'weight') return weightModal();
  if (k === 'measures') return measureModal();
  if (k === 'activity') return activityModal();
  const [title, key, unit, help, adds] = LOG_FIELDS[k];
  const v = dayLog()[key];
  openModal(`<h2>${title}</h2>
    <label>${unit[0].toUpperCase() + unit.slice(1)}<input id="log-v" type="text" inputmode="decimal" value="${v != null ? v : ''}" placeholder="0"></label>
    <div class="row wrap">${adds.map((a) => `<button class="chip" data-action="log-add" data-k="${k}" data-a="${a}">+${num(a)} ${unit}</button>`).join('')}</div>
    <p class="muted small">${help}</p>
    <div class="row"><button class="btn" data-action="save-log" data-k="${k}">Guardar</button><button class="btn ghost" data-action="close">Cancelar</button></div>`);
  setTimeout(() => $('#log-v')?.focus(), 50);
}
function activityModal() {
  openModal(`<h2>Registrar actividad</h2>
    <p class="muted small">Para lo que haces fuera de la app: subir el cerro, correr, bici, fútbol…</p>
    <label>Tipo<select id="a-type">${PG.ACTIVITIES.map(([id, n, ic]) => `<option value="${id}">${ic} ${n}</option>`).join('')}</select></label>
    <div class="row"><label>Minutos<input id="a-min" type="number" inputmode="numeric" min="1" max="1000" placeholder="60"></label><label>Fecha<input id="a-date" type="date" value="${todayStr()}" max="${todayStr()}"></label></div>
    <div class="row"><label>Distancia (km, opcional)<input id="a-km" type="text" inputmode="decimal" placeholder="—"></label><label>Desnivel + (m, opcional)<input id="a-gain" type="number" inputmode="numeric" placeholder="—"></label></div>
    <label>Esfuerzo<select id="a-eff"><option value="0.85">Suave</option><option value="1" selected>Normal</option><option value="1.2">Duro</option></select></label>
    <p class="muted small">Calorías = MET × peso × tiempo, más el trabajo de subir tu peso por el desnivel. Suma XP, puntos cardio y calorías del día.</p>
    <div class="row"><button class="btn" data-action="save-activity">Guardar</button><button class="btn ghost" data-action="close">Cancelar</button></div>`);
}
function measureModal() {
  const last = sortedMeasures().slice(-1)[0] || {};
  openModal(`<h2>Medidas corporales</h2>
    <label>Fecha<input id="m-date" type="date" value="${todayStr()}" max="${todayStr()}"></label>
    <div class="m-grid">${MEASURES.map(([k, l]) => `<label>${l} (cm)<input data-m="${k}" type="text" inputmode="decimal" placeholder="${last[k] ? num(last[k]) : ''}"></label>`).join('')}
    <label>% grasa (opcional)<input data-m="fat" type="text" inputmode="decimal" placeholder="báscula"></label></div>
    <details class="p-how"><summary>Cómo medir bien</summary><ul class="steps">
      <li><b>Cuello</b>: justo debajo de la nuez, cinta un poco inclinada hacia delante.</li>
      <li><b>Cintura</b>: a la altura del ombligo, relajado y tras soltar el aire.</li>
      <li><b>Cadera</b>: en la parte más ancha de los glúteos.</li>
      <li><b>Brazo, muslo y pantorrilla</b>: en la parte más ancha, siempre del mismo lado.</li>
      <li>Mide por la mañana, en ayunas y cada 1–2 semanas.</li></ul></details>
    <p class="muted small">Con cuello, cintura${state.profile.sex === 'm' ? ', cadera' : ''} y tu altura calculo tu % de grasa (método de la Marina de EE. UU.). Si tu báscula te lo da, anótalo y uso ese.</p>
    <div class="row"><button class="btn" data-action="save-measure">Guardar</button><button class="btn ghost" data-action="close">Cancelar</button></div>`);
}
function goalsModal() {
  const p = state.profile;
  openModal(`<h2>Mis metas</h2><form id="goals-form">
    <label>Puntos cardio por semana<input name="cardioGoal" type="number" inputmode="numeric" value="${esc(p.cardioGoal)}" placeholder="150"></label>
    <p class="muted small">1 punto por minuto de actividad moderada y 2 por minuto intenso. La OMS recomienda 150 a la semana.</p>
    <div class="row"><label>Pasos al día<input name="stepsGoal" type="number" inputmode="numeric" value="${esc(p.stepsGoal)}" placeholder="8000"></label><label>Agua (ml)<input name="waterGoal" type="number" inputmode="numeric" value="${esc(p.waterGoal)}" placeholder="2000"></label></div>
    <label>Horas de sueño<input name="sleepGoal" type="text" inputmode="decimal" value="${esc(p.sleepGoal)}" placeholder="8"></label></form>
    <button class="btn block" data-action="save-goals">Guardar</button>`);
}

const itLabel = (ex, it) => (it.t ? it.t + ' s' : ex.type === 'reps' ? '×' + it.n : it.n + ' s');
// ---------- MISIONES ----------
let focusKey = 'abs', goalKey = 'quemagrasa';
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const bolts = (lvl) => `<span class="bolts" aria-label="Nivel ${LEVELS[lvl] || ''}">${[1, 2, 3].map((i) => `<i class="${i <= lvl ? 'on' : ''}">⚡</i>`).join('')}</span>`;
const lastDone = (id) => { const s = state.sessions.filter((x) => x.routineId === id).sort((a, b) => b.date.localeCompare(a.date))[0]; return s ? new Date(s.date) : null; };
const thumbEx = (r) => EX[(r.items.find((it) => EX[it.ex]) || {}).ex] || EX.squat;
const stepCount = (r) => buildSteps(r).filter((s) => s.kind === 'ex').length;
const allItems = (r) => [...(r.warmup || []), ...r.items, ...(r.cooldown || [])];
function mRow(r) {
  if (!r) return '';
  const e = routineEstimate(r), ld = lastDone(r.id), ab = PG.ABILITIES[r.ability];
  return `<button class="m-row" data-action="routine" data-id="${esc(r.id)}">
    <span class="m-thumb">${exVisual(thumbEx(r), { still: true })}</span>
    <span class="m-info"><b>${esc(r.name)}</b><small>${fmtMin(e.total)} · ${stepCount(r)} ejercicios${r.outdoor ? ' · 🌲' : ''}</small>${bolts(r.level || 1)}${ld ? `<small class="last">Última vez: ${ld.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</small>` : ''}</span>
    ${ab ? `<span class="m-ab" title="${esc(ab.name)}">${ab.icon}</span>` : ''}
  </button>`;
}
function programCard(p) {
  const st = progState(p.id), n = p.days.length, done = st.day >= n, d = Math.min(st.day, n - 1);
  const r = findRoutine(p.days[d]);
  return `<div class="prog-card theme-${p.theme}">
    <div class="prog-fig">${exVisual(EX[p.fig])}</div>
    <small class="kicker">${PG.ABILITIES[p.ability].icon} ${esc(p.kicker)}</small>
    <h2>${esc(p.name)}</h2>
    <p class="small">${done ? '¡Campaña completada! Puedes repetirla.' : `Día ${d + 1} de ${n} · ${esc(r ? r.name : '')}`}</p>
    ${bar(Math.min(st.day, n) / n * 100)}
    <button class="btn-pill" data-action="prog-start" data-id="${p.id}"><span>${done ? 'REPETIR CAMPAÑA' : `EMPEZAR DÍA ${d + 1}`}</span><i>→</i></button>
    <button class="link small" data-action="prog-open" data-id="${p.id}">Ver los ${n} días ›</button>
  </div>`;
}
function soloParaTi() {
  const g = goalInfo(), out = [];
  const add = (id) => { const r = findRoutine(id); if (r && !out.includes(r)) out.push(r); };
  if (recovery().pct < 45) add('r-post-trail');
  const h = muscleHeat(state.sessions.filter((x) => new Date(x.date) >= new Date(Date.now() - 7 * DAY)));
  const zones = [['abs', ['abdominals']], ['piernas', ['quadriceps', 'hamstrings', 'calves']], ['gluteos', ['glutes']], ['pecho', ['chest']], ['espalda', ['lats', 'middle back', 'lower back']], ['hombros', ['shoulders']], ['brazos', ['biceps', 'triceps']]];
  const lvl = clamp(Math.floor(A.rankFor(totalXP()).index / 3) + 1, 1, 3);
  zones.map(([k, ms]) => [k, ms.reduce((a, m) => a + (h[m] || 0), 0) / ms.length]).sort((a, b) => a[1] - b[1]).slice(0, 2).forEach(([k]) => add(`bf-${k}-${lvl}`));
  if (g.losing) ['r-quemagrasa', 'r-sprint-casa'].forEach(add);
  ['r-pilar-hierro', 'r-torre-asalto', 'r-reconocimiento', 'r-forja-base', 'r-contraataque', 'r-hiit'].forEach(add);
  return out;
}
const QUICK = [['recent', '🕘 Reciente'], ['short', '◔ 7–15 min'], ['long', '◕ Más de 15 min'], ['quemagrasa', '🔥 Quema grasa'], ['calistenia', '🤸 Calistenia'], ['trail', '⛰️ Trail y carrera'], ['estirar', '🧘 Estirar'], ['lvl2', '⚡⚡ Heroico'], ['lvl3', '⚡⚡⚡ Legendario'], ['home', '🏠 En casa'], ['outdoor', '🌲 Al aire libre']];
function quickList(q) {
  const all = allRoutines(), mins = (r) => routineEstimate(r).total / 60;
  if (q === 'recent') return ['Recientes', [...new Set([...state.sessions].sort((a, b) => b.date.localeCompare(a.date)).map((s) => s.routineId))].map(findRoutine).filter(Boolean)];
  if (q === 'short') return ['7–15 minutos', all.filter((r) => mins(r) >= 7 && mins(r) <= 15)];
  if (q === 'long') return ['Más de 15 minutos', all.filter((r) => mins(r) > 15)];
  if (q === 'home') return ['En casa', all.filter((r) => !r.outdoor)];
  if (q === 'outdoor') return ['Al aire libre', all.filter((r) => r.outdoor)];
  if (/^lvl\d$/.test(q)) return [LEVELS[+q[3]], all.filter((r) => r.level === +q[3])];
  if (q.startsWith('ab:')) { const a = PG.ABILITIES[q.slice(3)]; return [`${a.icon} ${a.name}`, all.filter((r) => r.ability === q.slice(3)), a.desc]; }
  if (q.startsWith('goal:')) { const g = PG.GOALS.find((x) => x[0] === q.slice(5)); return [g[1], g[2].map(findRoutine).filter(Boolean)]; }
  if (q === 'foryou') return ['Solo para ti', soloParaTi(), 'Según tu objetivo, tu recuperación y los músculos que menos has trabajado esta semana.'];
  if (q === 'all') return ['Todas las misiones', all];
  const names = { quemagrasa: 'Quema grasa', calistenia: 'Calistenia', trail: 'Trail y carrera', estirar: 'Estira y calienta' };
  return [names[q] || q, all.filter((r) => (r.tags || []).includes(q))];
}
function showQuick(q) {
  const [title, list, desc] = quickList(q);
  openModal(`<h2>${esc(title)}</h2>${desc ? `<p class="muted">${esc(desc)}</p>` : ''}<p class="muted small">${list.length} misiones</p>
    <div class="m-list">${list.map(mRow).join('') || '<p class="muted">Nada por aquí todavía.</p>'}</div><button class="btn ghost block" data-action="close">Cerrar</button>`);
  curView = () => showQuick(q);
}
function renderEntrenar() {
  const focus = PG.BODY.find((b) => b[0] === focusKey) || PG.BODY[0];
  const goal = PG.GOALS.find((g) => g[0] === goalKey) || PG.GOALS[0];
  const cumbre = findProg('p-cumbre');
  view().innerHTML = `
    <div class="row between page-head"><h1>Misiones</h1><span class="streak-fire" title="Días seguidos entrenando">🔥 ${streak()}</span></div>
    <div class="hscroll prog-row">${PG.PROGRAMS.map(programCard).join('')}</div>

    <h2>Habilidades de armadura</h2>
    <div class="hscroll ab-row">${Object.entries(PG.ABILITIES).map(([k, a]) => `<button class="ab-card ab-${k}" data-action="quick" data-q="ab:${k}"><span class="ab-ic">${a.icon}</span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></button>`).join('')}</div>

    <h2>Centrado en el cuerpo</h2>
    <div class="chips">${PG.BODY.map(([k, l]) => `<button class="chip ${k === focus[0] ? 'on' : ''}" data-action="focus" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="m-list">${[1, 2, 3].map((L) => mRow(findRoutine(`bf-${focus[0]}-${L}`))).join('')}</div>

    <div class="qgrid">${QUICK.map(([k, l]) => `<button class="qchip" data-action="quick" data-q="${k}">${l}</button>`).join('')}</div>

    <button class="banner create" data-action="new-routine"><span><b>CREA LA TUYA</b><small>Tus ejercicios, vueltas y descansos</small><span class="pill">IR</span></span><span class="banner-ic">✎</span></button>

    <h2>Recomendado <span class="badge-new">NUEVO</span></h2>
    <button class="banner reco" data-action="prog-open" data-id="p-cumbre"><span class="reco-txt"><b>OPERACIÓN CUMBRE</b><small>Prepárate para subir el cerro: trail, cuestas, escaleras y piernas de acero</small><span class="pill ghost">${cumbre.days.length} misiones</span></span><span class="reco-fig">${exVisual(EX['hill-sprint'])}</span></button>

    <div class="row between"><h2>Solo para ti</h2><button class="link" data-action="quick" data-q="foryou">Más ›</button></div>
    <div class="m-list">${soloParaTi().slice(0, 3).map(mRow).join('')}</div>

    <div class="row between"><h2>Estira y calienta</h2><button class="link" data-action="quick" data-q="estirar">Más ›</button></div>
    <div class="hscroll st-row">${PG.STRETCHES.map((id) => { const r = findRoutine(id); return r ? `<button class="st-card" data-action="routine" data-id="${id}"><span class="st-fig">${exVisual(thumbEx(r), { still: true })}</span><b>${esc(r.name)}</b><small>${fmtMin(routineEstimate(r).total)}</small></button>` : ''; }).join('')}</div>

    <h2>Objetivos populares</h2>
    <div class="chips">${PG.GOALS.map(([k, l]) => `<button class="chip ${k === goal[0] ? 'on' : ''}" data-action="goal" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="card goal-list">${goal[2].slice(0, 3).map(findRoutine).map(mRow).join('')}<button class="link right-link" data-action="quick" data-q="goal:${goal[0]}">Más ›</button></div>

    <div class="row between"><h2>Mis misiones</h2><button class="btn small" data-action="new-routine">+ Crear</button></div>
    ${state.customRoutines.length ? `<div class="m-list">${state.customRoutines.map(mRow).join('')}</div>` : '<p class="muted">Aún no tienes misiones propias. Crea una o copia cualquier misión y ajústala.</p>'}

    <button class="banner explore" data-action="quick" data-q="all"><b>Explorar todas las misiones</b><span class="pill">vamos</span></button>
    <button class="banner explore lib" data-action="mode" data-m="lib"><b>Más de 800 ejercicios en la Biblioteca</b><span class="pill">ver</span></button>`;
}
function showProgram(pid) {
  const p = findProg(pid); if (!p) return;
  const st = progState(pid);
  openModal(`<div class="d-head"><button class="icon" data-action="close" aria-label="Volver">←</button><div><small class="kicker">${PG.ABILITIES[p.ability].icon} Campaña · ${esc(p.kicker)}</small><h2 class="mb0">${esc(p.name)}</h2></div></div>
    <div class="fig-stage">${exVisual(EX[p.fig])}</div>
    <p class="muted">${esc(p.desc)}</p>
    ${bar(Math.min(st.day, p.days.length) / p.days.length * 100)}<p class="small muted">${Math.min(st.day, p.days.length)} de ${p.days.length} misiones completadas</p>
    <ol class="prog-days">${p.days.map((id, i) => { const r = findRoutine(id); const done = i < st.day, cur = i === st.day; return `<li class="${done ? 'done' : cur ? 'cur' : ''}"><button data-action="routine" data-id="${esc(id)}" data-prog="${p.id}" data-day="${i}"><span class="pd-n">${done ? '✓' : i + 1}</span><span class="grow"><b>Día ${i + 1} · ${esc(r ? r.name : id)}</b><small class="muted">${r ? `${fmtMin(routineEstimate(r).total)} · ${PG.ABILITIES[r.ability]?.icon || ''} ${PG.ABILITIES[r.ability]?.name || ''}` : ''}</small></span></button></li>`; }).join('')}</ol>
    ${p.finale ? `<p class="tip">🏔️ ${esc(p.finale)}</p>` : ''}
    <p class="muted small">Entre misión y misión deja 1 día de descanso si notas las piernas cargadas.</p>
    <div class="sticky-cta"><button class="btn block big-btn cta-grad" data-action="prog-start" data-id="${p.id}">${st.day >= p.days.length ? 'Repetir campaña' : `Empezar día ${st.day + 1}`}</button></div>
    ${st.day > 0 ? `<button class="btn ghost block danger" data-action="prog-reset" data-id="${p.id}">Reiniciar campaña</button>` : ''}`);
  curView = () => showProgram(pid);
}
function startProgram(pid) {
  const p = findProg(pid); const st = progState(pid);
  if (st.day >= p.days.length) { state.programs[pid] = { day: 0, log: st.log || [], last: Date.now() }; save(); }
  const day = progState(pid).day;
  showRoutine(p.days[day], false, { pid, day });
}

// ---------- Detalle de misión: ordenar, sustituir y ajustar ----------
let rCtx = null; // misión abierta y ejercicio seleccionado
const PHASES = [['warmup', '🔥 Calentamiento'], ['items', '⚔️ Oleadas'], ['cooldown', '🧘 Vuelta a la calma']];
const itLabelLong = (ex, it) => (it.t ? `${mmss(it.t)} a tope` : ex.type === 'reps' ? `×${it.n}${ex.perSide ? ' por lado' : ''}` : `${mmss(it.n)}${ex.perSide ? ' por lado' : ''}`);
const editable = (r) => JSON.parse(JSON.stringify({ warmup: r.warmup, items: r.items, cooldown: r.cooldown }));
function setRoutineParts(id, parts) { // en tus misiones se guarda directo; en las de la app, como ajuste personal
  const own = state.customRoutines.find((x) => x.id === id);
  if (own) Object.assign(own, parts); else state.overrides[id] = { ...(state.overrides[id] || {}), ...parts };
  save();
}
function showRoutine(id, keepScroll, prog) {
  const r = findRoutine(id); if (!r) return;
  if (prog === undefined && rCtx && rCtx.id === id) prog = rCtx.prog;
  const e = routineEstimate(r), custom = state.customRoutines.some((x) => x.id === id), ab = PG.ABILITIES[r.ability];
  const scroll = $('#modal-body').scrollTop;
  const equip = [...new Set(allItems(r).map((it) => EX[it.ex]?.equip).filter(Boolean))];
  const rows = (ph) => (r[ph] || []).map((it, i) => { const ex = EX[it.ex]; if (!ex) return ''; return `<li class="d-row" data-i="${i}">
      <span class="drag" data-drag="1" aria-label="Mover">≡</span>
      <button class="d-main" data-action="rex" data-phase="${ph}" data-i="${i}"><span class="d-fig">${exVisual(ex, { still: true })}</span><span class="d-txt"><b>${esc(exName(ex))}</b><small>${itLabelLong(ex, it)}</small></span></button>
      <button class="d-swap" data-action="swap" data-phase="${ph}" data-i="${i}" aria-label="Sustituir">⇄</button></li>`; }).join('');
  const pr = prog && findProg(prog.pid);
  openModal(`<div class="d-head"><button class="icon" data-action="${pr ? 'prog-open' : 'close'}" ${pr ? `data-id="${pr.id}"` : ''} aria-label="Volver">←</button><div><small class="kicker">${pr ? `${esc(pr.name)} · Día ${prog.day + 1}` : ab ? `${ab.icon} Habilidad de armadura: ${esc(ab.name)}` : 'Misión'}</small><h2 class="mb0">${esc(r.name)}</h2></div></div>
    ${r.desc ? `<p class="muted">${esc(r.desc)}</p>` : ''}
    <div class="stats">${stat(fmtMin(e.total), 'duración')}${stat('~' + num(e.kcal, 0), 'kcal')}${stat(r.rounds || 1, 'oleadas')}${stat((r.rest || 0) + ' s', 'descanso')}</div>
    ${r.outdoor ? '<p class="tip">🌲 Misión al aire libre: lleva el móvil contigo; el temporizador y la voz te guían en cada tramo.</p>' : ''}
    ${equip.length ? `<p class="small">🎒 Necesitas: <b>${esc(equip.join(' · '))}</b></p>` : ''}
    ${PHASES.map(([ph, label]) => r[ph] && r[ph].length ? `<h3 class="phase-h">${label}${ph === 'items' && (r.rounds || 1) > 1 ? ` ×${r.rounds}` : ''}</h3><ul class="d-list" data-phase="${ph}">${rows(ph)}</ul>` : '').join('')}
    <p class="muted small">Arrastra ≡ para cambiar el orden, toca ⇄ para sustituir y toca un ejercicio para ver cómo se hace y ajustar su tiempo.${state.overrides[id] ? ` <button class="link" data-action="reset-routine" data-id="${esc(id)}">Restaurar original</button>` : ''}</p>
    <div class="row">${custom ? `<button class="btn ghost" data-action="edit-routine" data-id="${esc(id)}">Editar</button><button class="btn ghost danger" data-action="del-routine" data-id="${esc(id)}">Borrar</button>` : `<button class="btn ghost" data-action="copy-routine" data-id="${esc(id)}">Copiar como mía</button>`}</div>
    <div class="sticky-cta"><button class="btn block big-btn cta-grad" data-action="start" data-id="${esc(id)}">Comienzo</button></div>`);
  rCtx = { id, prog, back: rCtx && rCtx.id === id ? rCtx.back : null };
  modalBack = prog ? () => showProgram(prog.pid) : rCtx.back; curView = () => showRoutine(id, false);
  if (keepScroll) $('#modal-body').scrollTop = scroll;
}
function routineList(r) { return PHASES.flatMap(([ph]) => (r[ph] || []).map((it, i) => ({ ph, i, it }))); }
const instrHtml = (ex) => `<h3 class="xs-lbl">INSTRUCCIONES${ex.stepsLang === 'en' ? ' (en inglés)' : ''}</h3><ol class="steps">${ex.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>${ex.tip ? `<p class="tip">💡 ${esc(ex.tip)}</p>` : ''}
  <h3 class="xs-lbl">ZONA PRINCIPAL</h3><div class="row wrap">${MM.musclesOf(ex).map((m, i) => `<span class="zone ${i === 0 ? 'main' : ''}">${esc(MM.LABEL[m] || m)}</span>`).join('')}</div>
  ${ex.equip ? `<p class="small">🎒 Necesitas: ${esc(ex.equip)}</p>` : ''}`;
function exSheet(phase, i) {
  const r = findRoutine(rCtx.id); const list = routineList(r);
  const k = list.findIndex((x) => x.ph === phase && x.i === i); const cur = list[k]; if (!cur) return showRoutine(rCtx.id);
  const ex = EX[cur.it.ex]; const isTime = cur.it.t != null || ex.type === 'time', val = cur.it.t ?? cur.it.n;
  openModal(`<div class="xs-head"><h2 class="xs-title">${esc(exName(ex))}</h2><button class="swap-link" data-action="swap" data-phase="${phase}" data-i="${i}"><span>⇄</span>Sustituir</button></div>
    ${exSub(ex) ? `<p class="muted mt0">${esc(exSub(ex))}</p>` : ''}
    <div class="fig-stage xs-fig">${exVisual(ex)}</div>
    <div class="xs-dur"><b class="xs-lbl">${isTime ? 'DURACIÓN' : 'REPETICIONES'}${ex.perSide && !cur.it.t ? ' <small>por lado</small>' : ''}</b>
      <div class="stepper"><button data-action="adj" data-d="-1" aria-label="Menos">−</button><span>${isTime ? mmss(val) : '×' + val}</span><button data-action="adj" data-d="1" aria-label="Más">+</button></div></div>
    ${instrHtml(ex)}
    <p class="muted small">~${num(kcalFor(ex.met, 60), 1)} kcal/min con tu peso · ${LEVELS[ex.level]}</p>
    <div class="xs-foot"><button class="icon" data-action="xs-nav" data-d="-1" ${k === 0 ? 'disabled' : ''} aria-label="Anterior">⏮</button><span>${k + 1}/${list.length}</span><button class="icon" data-action="xs-nav" data-d="1" ${k === list.length - 1 ? 'disabled' : ''} aria-label="Siguiente">⏭</button><button class="btn cta-grad" data-action="xs-close">CERRAR</button></div>`);
  Object.assign(rCtx, { phase, i, sheet: true });
  modalBack = () => { rCtx.sheet = false; showRoutine(rCtx.id, true); };
}
function adjustItem(d) {
  const r = findRoutine(rCtx.id), parts = editable(r), it = parts[rCtx.phase][rCtx.i], ex = EX[it.ex];
  const key = it.t != null ? 't' : 'n', isTime = key === 't' || ex.type === 'time';
  const step = isTime ? (it[key] >= 120 ? 30 : 5) : 1;
  it[key] = clamp(it[key] + d * step, isTime ? 5 : 1, 3600);
  setRoutineParts(rCtx.id, parts); exSheet(rCtx.phase, rCtx.i);
}
function swapModal(phase, i) {
  const r = findRoutine(rCtx.id); const cur = EX[r[phase][i].ex];
  const prim = MM.musclesOf(cur)[0], g0 = cur.groups[0];
  const cands = allExercises().filter((e) => e.id !== cur.id && (e.groups[0] === g0 || MM.musclesOf(e)[0] === prim))
    .sort((a, b) => (a.type === cur.type ? 0 : 1) - (b.type === cur.type ? 0 : 1) || Math.abs(a.level - cur.level) - Math.abs(b.level - cur.level) || exName(a).localeCompare(exName(b))).slice(0, 40);
  Object.assign(rCtx, { phase, i, fromSheet: !!rCtx.sheet });
  openModal(`<h2>Sustituir</h2><p class="muted small">En lugar de <b>${esc(exName(cur))}</b>, elige uno parecido (misma zona principal).</p>
    <div>${cands.map((e) => `<button class="card ex-row" data-action="swap-pick" data-id="${esc(e.id)}"><span class="mini-fig">${exVisual(e, { still: true })}</span><div class="grow"><b>${esc(exName(e))}</b><small class="muted">${exSub(e) ? esc(exSub(e)) + ' · ' : ''}${e.groups.join(', ')}</small></div><span class="tag lvl${e.level}">${LEVELS[e.level]}</span></button>`).join('')}</div>
    <button class="btn ghost block" data-action="swap-cancel">Volver</button>`);
  modalBack = () => (rCtx.fromSheet ? exSheet(rCtx.phase, rCtx.i) : showRoutine(rCtx.id, true));
}
function swapPick(newId) {
  const r = findRoutine(rCtx.id), parts = editable(r), it = parts[rCtx.phase][rCtx.i], ex = EX[newId];
  parts[rCtx.phase][rCtx.i] = it.t != null ? { ex: newId, t: it.t } : { ex: newId, n: ex.n };
  setRoutineParts(rCtx.id, parts); toast(`Cambiado por ${exName(ex)}`);
  return rCtx.fromSheet ? exSheet(rCtx.phase, rCtx.i) : showRoutine(rCtx.id, true);
}
// Arrastrar para ordenar (táctil y ratón)
let drag = null;
document.addEventListener('pointerdown', (ev) => {
  const h = ev.target.closest('[data-drag]'); if (!h || !rCtx) return;
  const li = h.closest('.d-row'); drag = { li, ul: li.parentElement, id: rCtx.id };
  li.classList.add('dragging'); try { h.setPointerCapture(ev.pointerId); } catch (e) {} ev.preventDefault();
});
document.addEventListener('pointermove', (ev) => {
  if (!drag) return; ev.preventDefault();
  const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.d-row');
  if (el && el !== drag.li && el.parentElement === drag.ul) { const b = el.getBoundingClientRect(); drag.ul.insertBefore(drag.li, ev.clientY < b.top + b.height / 2 ? el : el.nextSibling); }
  const m = $('#modal-body'); if (ev.clientY < 70) m.scrollTop -= 12; else if (ev.clientY > innerHeight - 70) m.scrollTop += 12;
}, { passive: false });
function endDrag() {
  if (!drag) return; const { ul, li, id } = drag; drag = null; li.classList.remove('dragging');
  const ph = ul.dataset.phase, order = [...ul.children].map((x) => +x.dataset.i);
  if (order.every((v, k) => v === k)) return;
  const parts = editable(findRoutine(id)); parts[ph] = order.map((k) => parts[ph][k]);
  setRoutineParts(id, parts); showRoutine(id, true); toast('Orden guardado');
}
document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);

// ---------- Editor de rutinas ----------
let draft = null, picking = false, pickQuery = '';
function editRoutine(id, copy) {
  const src = id ? findRoutine(id) : null;
  draft = src ? JSON.parse(JSON.stringify(src)) : { name: '', rest: 30, rounds: 2, items: [], level: 0 };
  if (copy || !src) { draft.id = 'c-' + uid(); if (copy) draft.name = src.name + ' (mía)'; }
  delete draft.desc;
  picking = false; renderDraft();
}
function renderDraft() {
  if (picking) {
    const q = pickQuery.toLowerCase();
    openModal(`<h2>Añadir ejercicio</h2>
      <input id="pick-q" type="search" placeholder="Buscar…" value="${esc(pickQuery)}">
      <div class="pick-list">${allExercises().filter((e) => !q || (e.name + ' ' + exName(e) + ' ' + (e.originalName || '')).toLowerCase().includes(q) || e.groups.join(' ').toLowerCase().includes(q))
        .map((e) => `<button class="pick" data-action="pick" data-id="${e.id}"><span>${e.source === 'lib' ? '📚 ' : ''}${esc(exName(e))}</span><small class="muted">${exSub(e) ? esc(exSub(e)) + ' · ' : ''}${e.groups.join(', ')}</small></button>`).join('')}</div>
      <button class="btn ghost block" data-action="pick-cancel">Volver</button>`);
    modalBack = () => { picking = false; renderDraft(); };
    return;
  }
  const e = routineEstimate(draft);
  openModal(`<h2>${draft.name ? 'Editar misión' : 'Nueva misión'}</h2>
    <label>Nombre<input id="d-name" value="${esc(draft.name)}" placeholder="Ej.: Operación Madrugada"></label>
    <div class="row"><label>Descanso (s)<input id="d-rest" type="number" min="0" max="300" value="${draft.rest}"></label>
    <label>Vueltas<input id="d-rounds" type="number" min="1" max="10" value="${draft.rounds || 1}"></label></div>
    <ol class="ex-list edit">${draft.items.map((it, i) => { const ex = EX[it.ex]; return `<li>
      <span>${esc(ex ? exName(ex) : it.ex)}<small class="muted"> ${it.t || !ex || ex.type !== 'reps' ? 'seg' : 'reps'}${ex && ex.perSide ? ' por lado' : ''}</small></span>
      <input type="number" min="1" max="600" value="${it.t ?? it.n}" data-n="${i}">
      <span class="mini"><button data-action="mv" data-i="${i}" data-d="-1" aria-label="Subir">↑</button><button data-action="mv" data-i="${i}" data-d="1" aria-label="Bajar">↓</button><button data-action="rm" data-i="${i}" aria-label="Quitar">✕</button></span>
    </li>`; }).join('')}</ol>
    <button class="btn ghost block" data-action="pick-open">+ Añadir ejercicio</button>
    <p class="muted small">Estimado: ${fmtMin(e.total)} · ~${num(e.kcal, 0)} kcal</p>
    <div class="row"><button class="btn" data-action="save-routine">Guardar</button><button class="btn ghost" data-action="close">Cancelar</button></div>`);
}
function readDraftInputs() {
  if (!draft || picking) return;
  const n = $('#d-name'); if (n) draft.name = n.value.trim();
  const r = $('#d-rest'); if (r) draft.rest = clamp(parseInt(r.value) || 0, 0, 300);
  const k = $('#d-rounds'); if (k) draft.rounds = clamp(parseInt(k.value) || 1, 1, 10);
  document.querySelectorAll('[data-n]').forEach((inp) => { const it = draft.items[+inp.dataset.n]; if (it) it[it.t != null ? 't' : 'n'] = clamp(parseInt(inp.value) || 1, 1, 600); });
}

// ---------- EJERCICIOS ----------
let exQuery = '', exGroup = '', exMode = 'mine';
const modeTabs = () => `<div class="seg">${[['mine', '⚔️ Arsenal'], ['map', '🗺️ Mapa'], ['lib', '🌐 Biblioteca']].map(([m, l]) => `<button class="${exMode === m ? 'on' : ''}" data-action="mode" data-m="${m}">${l}</button>`).join('')}</div>`;
function renderEjercicios() {
  if (exMode === 'lib') return renderLibrary();
  if (exMode === 'map') return renderMap();
  view().innerHTML = `<h1>Arsenal</h1>${modeTabs()}
    <input id="ex-q" type="search" placeholder="Buscar ejercicio…" value="${esc(exQuery)}">
    <div class="chips">${['', ...window.GROUPS].map((g) => `<button class="chip ${g === exGroup ? 'on' : ''}" data-action="group" data-g="${esc(g)}">${g || 'Todos'}</button>`).join('')}</div>
    <div id="ex-list"></div>`;
  renderExList();
}
function renderExList() {
  const q = exQuery.toLowerCase(), kg = currentWeight();
  const list = allExercises().filter((e) => (!exGroup || e.groups.includes(exGroup)) && (!q || (e.name + ' ' + exName(e) + ' ' + (e.originalName || '')).toLowerCase().includes(q)));
  $('#ex-list').innerHTML = list.length ? list.map((e) => `<button class="card ex-row" data-action="ex" data-id="${e.id}">
      <span class="mini-fig">${exVisual(e, { still: true })}</span>
      <div class="grow"><b>${e.source === 'lib' ? '📚 ' : ''}${esc(exName(e))}</b><small class="muted">${exSub(e) ? esc(exSub(e)) + ' · ' : ''}${e.groups.join(' · ')}</small></div>
      <div class="right"><span class="tag lvl${e.level}">${LEVELS[e.level]}</span><small class="muted">${num(kcalFor(e.met, 60, kg), 1)} kcal/min</small></div>
    </button>`).join('') + `<button class="card more-card" data-action="mode" data-m="lib">🌐 <b>¿Quieres más?</b> Más de 800 ejercicios gratis en la Biblioteca libre</button>` : '<p class="muted">No hay ejercicios con ese filtro.</p>';
}

// ---------- MAPA MUSCULAR ----------
let mapMuscle = '';
function renderMap() {
  const kg = currentWeight();
  let list = '';
  if (mapMuscle) {
    const label = MM.LABEL[mapMuscle];
    const ex = allExercises().map((e) => ({ e, i: MM.musclesOf(e).indexOf(mapMuscle) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
    list = `<div class="row between"><h2>${esc(label)}</h2><small class="muted">${ex.length} en tu arsenal</small></div>` +
      (ex.length ? ex.map(({ e, i }) => `<button class="card ex-row" data-action="ex" data-id="${esc(e.id)}">
        <span class="mini-fig">${exVisual(e, { still: true })}</span>
        <div class="grow"><b>${e.source === 'lib' ? '📚 ' : ''}${esc(exName(e))}</b><small class="muted">${i === 0 ? '🎯 Principal' : 'Secundario'} · ${exSub(e) ? esc(exSub(e)) : e.groups.join(', ')}</small></div>
        <div class="right"><span class="tag lvl${e.level}">${LEVELS[e.level]}</span><small class="muted">${num(kcalFor(e.met, 60, kg), 1)} kcal/min</small></div></button>`).join('') : '<p class="muted">Aún no tienes ejercicios para este músculo.</p>') +
      `<button class="card more-card" data-action="map-lib" data-m="${esc(mapMuscle)}">🌐 Ver ejercicios de <b>${esc(label)}</b> en la Biblioteca libre</button>`;
  }
  view().innerHTML = `<h1>Arsenal</h1>${modeTabs()}
    <p class="muted small">Toca un músculo para ver sus ejercicios.</p>
    <div class="mm-card card">${MM.svg({ selected: mapMuscle, clickable: true })}</div>
    <div id="map-list">${list}</div>`;
}
function muscleHeat(sessions) {
  const h = {};
  sessions.forEach((s) => (s.exercises || []).forEach((x) => {
    const ms = MM.musclesOf(EX[x.id]); const w = Math.max(1, x.sec || 20);
    ms.forEach((m, i) => { h[m] = (h[m] || 0) + w * (i === 0 ? 1 : 0.5); });
  }));
  const max = Math.max(0, ...Object.values(h));
  Object.keys(h).forEach((k) => { h[k] = max ? h[k] / max : 0; });
  return h;
}
const heatTop = (h) => Object.entries(h).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => MM.LABEL[k]).join(', ');

// ---------- BIBLIOTECA LIBRE ----------
let libEquip = 'home', libGroup = '', libQuery = '', libShown = 40, libData = null, libMuscle = '';
const libById = (id) => EX[id] || libData?.find((x) => x.ex.id === id)?.ex;
const owned = (id) => state.libExercises.some((e) => e.id === id);
function renderLibrary() {
  view().innerHTML = `<h1>Arsenal</h1>${modeTabs()}
    <p class="muted small">Más de 800 ejercicios gratis con fotos, de <a href="${L.SOURCE}" target="_blank" rel="noopener">Free Exercise DB</a> (dominio público). Añade los que quieras y úsalos en tus misiones.</p>
    <input id="lib-q" type="search" placeholder="Buscar (español o inglés)…" value="${esc(libQuery)}">
    <div class="chips">${L.EQUIP_FILTERS.map(([k, label]) => `<button class="chip ${libEquip === k ? 'on' : ''}" data-action="lib-equip" data-k="${k}">${label}</button>`).join('')}</div>
    ${libMuscle ? `<div class="chips"><button class="chip on" data-action="lib-muscle-clear">🎯 ${esc(MM.LABEL[libMuscle])} ✕</button></div>` : `<div class="chips">${['', ...window.GROUPS].map((g) => `<button class="chip ${g === libGroup ? 'on' : ''}" data-action="lib-group" data-g="${esc(g)}">${g || 'Todos'}</button>`).join('')}</div>`}
    <div id="lib-list"><p class="muted">Cargando biblioteca…</p></div>`;
  if (libData) return renderLibList();
  L.load().then((d) => { libData = d; renderLibList(); })
    .catch((e) => { const el = $('#lib-list'); if (el) el.innerHTML = `<p class="warn-text">${esc(e.message)}. Necesitas conexión a internet la primera vez.</p><button class="btn ghost" data-action="lib-retry">Reintentar</button>`; });
}
function renderLibList() {
  const box = $('#lib-list'); if (!box || !libData) return;
  const f = (L.EQUIP_FILTERS.find((x) => x[0] === libEquip) || L.EQUIP_FILTERS[0])[2];
  const q = libQuery.toLowerCase();
  const list = libData.filter(({ raw, ex }) => f(raw) && (libMuscle ? (raw.primaryMuscles || []).includes(libMuscle) : (!libGroup || ex.groups.includes(libGroup))) && (!q || (ex.name + ' ' + ex.originalName + ' ' + ex.muscles.join(' ')).toLowerCase().includes(q)));
  box.innerHTML = `<p class="muted small">${list.length} ejercicios</p>` + list.slice(0, libShown).map(({ ex }) => `<div class="card ex-row lib-row" data-action="ex" data-id="${esc(ex.id)}">
      <span class="mini-fig">${exVisual(ex, { still: true })}</span>
      <div class="grow"><b>${esc(ex.name)}</b><small class="muted">${esc(ex.muscles.join(', ') || ex.groups.join(', '))} · ${esc(ex.equipment)}</small></div>
      <div class="right"><span class="tag lvl${ex.level}">${LEVELS[ex.level]}</span>${owned(ex.id) ? '<small class="owned">✓ En tu arsenal</small>' : `<button class="btn small" data-action="lib-add" data-id="${esc(ex.id)}">+ Añadir</button>`}</div>
    </div>`).join('') + (list.length > libShown ? `<button class="btn ghost block" data-action="lib-more">Ver más (${list.length - libShown})</button>` : '');
}
function addLib(id) {
  const ex = libById(id); if (!ex || owned(id)) return;
  state.libExercises.push(JSON.parse(JSON.stringify(ex))); save();
  toast(`${ex.name} añadido a tu arsenal`);
}
function removeLib(id) {
  const used = state.customRoutines.filter((r) => r.items.some((it) => it.ex === id));
  if (!confirm(used.length ? `Lo usan tus misiones: ${used.map((r) => r.name).join(', ')}. Se quitará de ellas. ¿Seguro?` : '¿Quitar este ejercicio de tu arsenal?')) return false;
  state.libExercises = state.libExercises.filter((e) => e.id !== id);
  used.forEach((r) => { r.items = r.items.filter((it) => it.ex !== id); });
  delete EX[id]; save(); return true;
}
function showExercise(id) {
  const e = libById(id); if (!e) return;
  const lib = e.source === 'lib';
  rCtx = null;
  openModal(`<div class="xs-head"><h2 class="xs-title">${esc(exName(e))}</h2><span class="tag lvl${e.level}">${LEVELS[e.level]}</span></div>${exSub(e) ? `<p class="muted mt0">${esc(exSub(e))}</p>` : ''}
    <div class="fig-stage xs-fig">${exVisual(e)}</div>
    ${lib ? `<p class="small">💪 ${esc(e.muscles.join(', '))} · 🏋️ ${esc(e.equipment)}</p>` : ''}
    <div class="row wrap">${e.groups.map((g) => `<span class="tag">${g}</span>`).join('')}${e.outdoor ? '<span class="tag">🌲 Al aire libre</span>' : ''}</div>
    ${instrHtml(e)}
    <p class="muted small">Por defecto: ${e.type === 'reps' ? e.n + ' repeticiones' : mmss(e.n)}${e.perSide ? ' por lado' : ''} · Intensidad ${e.met} MET · ~${num(kcalFor(e.met, 60), 1)} kcal por minuto con tu peso (${num(currentWeight())} kg)</p>
    ${lib ? (owned(e.id) ? `<button class="btn ghost danger block" data-action="lib-remove" data-id="${esc(e.id)}">Quitar de mi arsenal</button>` : `<button class="btn block" data-action="lib-add" data-id="${esc(e.id)}">+ Añadir a mi arsenal</button>`) : ''}
    ${lib ? '<p class="muted small center">Fotos e instrucciones: Free Exercise DB (dominio público)</p>' : ''}
    <button class="btn ghost block" data-action="close">Cerrar</button>`);
}

// ---------- PROGRESO ----------
let range = 90;
function lineChart(pts, goal) {
  if (pts.length < 2) return '<p class="muted">Registra al menos dos pesos para ver la gráfica.</p>';
  const W = 340, H = 180, L = 34, R = 8, T = 10, B = 22;
  const xs = pts.map((p) => p.t), ys = pts.map((p) => p.y).concat(goal != null ? [goal] : []);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 === x0) x1 = x0 + DAY;
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const pad = Math.max(0.5, (y1 - y0) * 0.12); y0 -= pad; y1 += pad;
  const X = (t) => L + (t - x0) / (x1 - x0) * (W - L - R), Y = (v) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const area = `${line}L${X(pts[pts.length - 1].t).toFixed(1)},${H - B}L${X(pts[0].t).toFixed(1)},${H - B}Z`;
  const ticks = [0, 0.5, 1].map((f) => y0 + pad + f * (y1 - y0 - 2 * pad));
  const xt = [x0, (x0 + x1) / 2, x1];
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Gráfica de peso">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${L - 4}" y="${Y(v) + 3}" text-anchor="end">${num(v)}</text>`).join('')}
    ${xt.map((t, i) => `<text x="${X(t)}" y="${H - 6}" text-anchor="${['start', 'middle', 'end'][i]}">${new Date(t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</text>`).join('')}
    ${goal != null ? `<line x1="${L}" x2="${W - R}" y1="${Y(goal)}" y2="${Y(goal)}" class="goal"/><text x="${W - R}" y="${Y(goal) - 4}" text-anchor="end" class="goal-t">Meta ${num(goal)}</text>` : ''}
    <path d="${area}" class="area"/><path d="${line}" class="line"/>
    ${pts.length <= 40 ? pts.map((p) => `<circle cx="${X(p.t)}" cy="${Y(p.y)}" r="2.6" class="dot"/>`).join('') : ''}
  </svg>`;
}
function weeklyBars() {
  const weeks = Array.from({ length: 8 }, (_, i) => weekStats(7 - i));
  const max = Math.max(1, ...weeks.map((w) => w.kcal));
  return `<div class="bars">${weeks.map((w, i) => `<div class="bcol"><small>${w.kcal ? num(w.kcal, 0) : ''}</small><div class="b" style="height:${(w.kcal / max * 100).toFixed(1)}%"></div><small class="muted">${i === 7 ? 'esta' : w.start.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' })}</small></div>`).join('')}</div>`;
}
let measureKey = 'waist';
function measuresCardHtml() {
  const ms = sortedMeasures();
  if (!ms.length) return `<div class="card"><div class="row between"><h3>📏 Medidas corporales</h3><button class="btn small" data-action="log" data-k="measures">+ Medir</button></div><p class="muted">Anota cuello, pecho, brazo, cintura, cadera, muslo y pantorrilla. Verás cuánto cambia cada medida y tu % de grasa estimado.</p></div>`;
  const first = ms[0], last = ms[ms.length - 1];
  const valOf = (k) => [...ms].reverse().find((m) => m[k])?.[k];
  const firstOf = (k) => ms.find((m) => m[k])?.[k];
  const fat = bodyFat(last), kg = currentWeight(), sx = state.profile.sex;
  const fats = ms.map((m) => ({ t: parseDay(m.date).getTime(), y: bodyFat(m) })).filter((p) => p.y);
  const key = measureKey;
  const pts = key === 'fat' ? fats : ms.filter((m) => m[key]).map((m) => ({ t: parseDay(m.date).getTime(), y: m[key] }));
  return `<div class="card"><div class="row between"><h3>📏 Medidas corporales</h3><button class="btn small" data-action="log" data-k="measures">+ Medir</button></div>
    ${fat ? `<div class="fat-box"><div><small class="muted">Grasa corporal</small><b class="big-k">${num(fat)} %</b><small>${fatLabel(fat, sx)}${last.fat ? ' · báscula' : ' · estimado'}</small></div><div><small class="muted">Masa grasa</small><b>${num(kg * fat / 100)} kg</b><small class="muted">Masa magra</small><b>${num(kg * (1 - fat / 100))} kg</b></div></div>` : `<p class="muted small">Para estimar tu % de grasa anota cuello y cintura${sx === 'm' ? ' y cadera' : ''}, y completa altura y sexo en Ajustes.</p>`}
    <div class="m-vals">${MEASURES.map(([k, l]) => { const v = valOf(k), f = firstOf(k); if (!v) return ''; const d = v - f; return `<button class="m-val ${measureKey === k ? 'on' : ''}" data-action="mkey" data-k="${k}"><small>${l}</small><b>${num(v)}</b><em class="${d < 0 ? 'down' : d > 0 ? 'up' : 'muted'}">${d ? (d > 0 ? '+' : '') + num(d) + ' cm' : '—'}</em></button>`; }).join('')}${fats.length ? `<button class="m-val ${measureKey === 'fat' ? 'on' : ''}" data-action="mkey" data-k="fat"><small>% grasa</small><b>${num(fats[fats.length - 1].y)}</b><em class="muted">${fats.length > 1 ? (fats[fats.length - 1].y - fats[0].y > 0 ? '+' : '') + num(fats[fats.length - 1].y - fats[0].y) : '—'}</em></button>` : ''}</div>
    <p class="small muted">Gráfica: <b>${key === 'fat' ? '% grasa' : (MEASURES.find((m) => m[0] === key) || [, ''])[1]}</b> · desde el ${fmtDay(first.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
    ${pts.length >= 2 ? lineChart(pts, null) : '<p class="muted small">Con dos o más mediciones verás aquí la evolución.</p>'}
    <details class="p-how"><summary>Historial de medidas (${ms.length})</summary><ul class="log">${ms.slice().reverse().map((m) => `<li><span>${fmtDay(m.date, { day: 'numeric', month: 'short', year: '2-digit' })}</span><small class="grow">${MEASURES.filter(([k]) => m[k]).map(([k, l]) => `${l} ${num(m[k])}`).join(' · ')}${m.fat ? ` · grasa ${num(m.fat)} %` : ''}</small><button class="x" data-action="del-measure" data-date="${m.date}" aria-label="Borrar">✕</button></li>`).join('')}</ul></details>
  </div>`;
}
function caloriesDetailHtml() {
  if (!bmrNow()) return caloriesCardHtml();
  const days = Array.from({ length: 7 }, (_, i) => todayStr(new Date(Date.now() - (6 - i) * DAY)));
  const data = days.map((d) => ({ d, c: dayCalories(d) }));
  const max = Math.max(1, ...data.map((x) => Math.max(x.c.total, x.c.eaten)));
  return `${caloriesCardHtml()}
    <div class="card"><h3>Gasto estimado · últimos 7 días</h3>
      <div class="bars kbars">${data.map(({ d, c }) => `<div class="bcol"><small>${num(c.total / 1000, 1)}k</small><div class="b2"><div class="b" style="height:${(c.total / max * 100).toFixed(1)}%"></div>${c.eaten ? `<div class="b eat" style="height:${(c.eaten / max * 100).toFixed(1)}%"></div>` : ''}</div><small class="muted">${parseDay(d).toLocaleDateString('es-ES', { weekday: 'narrow' })}</small></div>`).join('')}</div>
      <div class="klegend small"><span><i class="k-ex"></i>Gastadas</span><span><i class="k-eat"></i>Comidas</span></div>
      <p class="muted small">Basal (Mifflin-St Jeor) + actividad diaria (por tus pasos o tu nivel de actividad) + entrenos y actividades (método MET, sin contar lo que gastarías en reposo). Es una estimación: ajústala según cómo cambie tu peso.</p></div>`;
}
function renderProgreso() {
  const ws = sortedWeights();
  const since = range ? Date.now() - range * DAY : 0;
  const pts = ws.filter((w) => parseDay(w.date).getTime() >= since).map((w) => ({ t: parseDay(w.date).getTime(), y: w.kg }));
  const g = goalInfo();
  const sessions = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date));
  const totKcal = state.sessions.reduce((a, s) => a + s.kcal, 0), totSec = state.sessions.reduce((a, s) => a + s.durationSec, 0);
  view().innerHTML = `<h1>Progreso</h1>
    <div class="card"><div class="row between"><h3>Peso</h3><button class="btn small" data-action="weight">+ Registrar</button></div>
      <div class="chips">${[[30, '30 días'], [90, '3 meses'], [365, '1 año'], [0, 'Todo']].map(([v, l]) => `<button class="chip ${range === v ? 'on' : ''}" data-action="range" data-v="${v}">${l}</button>`).join('')}</div>
      ${lineChart(pts, g.goal)}
      ${g.hasGoal ? `<p class="small">${g.done ? '🎉 Objetivo conseguido' : `Faltan <b>${num(g.remaining)} kg</b> · ${num(g.pct, 0)} % completado`}</p>` : ''}
    </div>
    ${measuresCardHtml()}
    ${caloriesDetailHtml()}
    ${(() => { const recent = state.sessions.filter((x) => new Date(x.date) >= new Date(Date.now() - 7 * DAY)); const h = muscleHeat(recent);
      return `<div class="card"><h3>Músculos trabajados · últimos 7 días</h3>${recent.length ? `${MM.svg({ heat: h })}<div class="mm-legend"><span>Poco</span><i></i><span>Mucho</span></div><p class="small">Más trabajados: <b>${esc(heatTop(h))}</b></p>` : '<p class="muted">Completa una misión para ver qué músculos trabajaste.</p>'}</div>`; })()}
    <div class="card"><h3>Calorías quemadas en entrenos por semana</h3>${weeklyBars()}
      <p class="small">Puntos cardio esta semana: <b>${num(weekPoints(), 0)}</b> de ${num(goalNum('cardioGoal', 150), 0)}.</p>
      <p class="muted small">Total: ${num(totKcal, 0)} kcal en ${state.sessions.length} entrenos (${fmtMin(totSec)}). Equivale a unos ${num(totKcal / 7700, 2)} kg de grasa.</p></div>
    <div class="card"><h3>Registros de peso</h3>
      ${ws.length ? `<ul class="log">${ws.slice().reverse().slice(0, 30).map((w, i, arr) => { const prev = arr[i + 1]; const d = prev ? w.kg - prev.kg : 0;
        return `<li><span>${fmtDay(w.date, { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })}</span><b>${num(w.kg)} kg</b><small class="${d < 0 ? 'down' : d > 0 ? 'up' : 'muted'}">${prev ? (d > 0 ? '+' : '') + num(d) : ''}</small>${w.waist ? `<small class="muted">cintura ${num(w.waist)}</small>` : '<small></small>'}<button class="x" data-action="del-weight" data-date="${w.date}" aria-label="Borrar">✕</button></li>`; }).join('')}</ul>` : '<p class="muted">Sin registros todavía.</p>'}
    </div>
    <div class="card"><h3>Historial de misiones</h3>
      ${sessions.length ? `<ul class="log">${sessions.slice(0, 40).map((s) => `<li><span>${new Date(s.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span><b class="grow">${esc(s.routineName)}</b><small>${fmtMin(s.durationSec)}</small><small>${num(s.kcal, 0)} kcal</small><button class="x" data-action="del-session" data-id="${s.id}" aria-label="Borrar">✕</button></li>`).join('')}</ul>` : '<p class="muted">Ninguna misión todavía. El campo de batalla te espera.</p>'}
    </div>`;
}
function weightModal() {
  const w = state.weights.find((x) => x.date === todayStr());
  openModal(`<h2>Registrar peso</h2>
    <label>Fecha<input id="w-date" type="date" value="${todayStr()}" max="${todayStr()}"></label>
    <label>Peso (kg)<input id="w-kg" type="text" inputmode="decimal" step="0.1" min="20" max="350" value="${w ? w.kg : ''}" placeholder="${num(currentWeight())}"></label>
    <label>Cintura (cm, opcional)<input id="w-waist" type="text" inputmode="decimal" step="0.5" min="30" max="250" value="${w && w.waist ? w.waist : ''}"></label>
    <p class="muted small">Consejo: pésate siempre a la misma hora, mejor por la mañana en ayunas.</p>
    <div class="row"><button class="btn" data-action="save-weight">Guardar</button><button class="btn ghost" data-action="close">Cancelar</button></div>`);
  setTimeout(() => $('#w-kg')?.focus(), 50);
}

// ---------- AJUSTES ----------
function renderAjustes() {
  const p = state.profile, s = state.settings;
  const origin = location.origin.startsWith('http') ? location.origin : '(abre la app desde su dirección web)';
  const last = sync.lastSyncTime ? new Date(sync.lastSyncTime).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca';
  view().innerHTML = `<h1>Ajustes</h1>
    <div class="card"><h3>Tu avatar</h3>
      <div class="avatars">${Object.entries(A.CLASSES).map(([id, c]) => `<button class="avatar-opt ${avatarId() === id ? 'on' : ''}" data-action="avatar" data-id="${id}">${A.figure('squat', { avatar: id, dur: 2.2, noGhost: true })}<b>${c.name}</b><small>${esc(c.desc)}</small></button>`).join('')}</div>
    </div>
    <form class="card" id="profile-form"><h3>Perfil y objetivo</h3>
      <label>Nombre en clave<input name="name" value="${esc(p.name)}" placeholder="Ej.: Jefe, Lobo, Hayabusa…"></label>
      <div class="row"><label>Altura (cm)<input name="heightCm" type="text" inputmode="decimal" value="${esc(p.heightCm)}"></label>
      <label>Año de nacimiento<input name="birthYear" type="number" value="${esc(p.birthYear)}"></label></div>
      <label>Sexo (para estimar tu gasto diario)<select name="sex"><option value="">—</option><option value="h" ${p.sex === 'h' ? 'selected' : ''}>Hombre</option><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Mujer</option></select></label>
      <div class="row"><label>Peso inicial (kg)<input name="startWeight" type="text" inputmode="decimal" step="0.1" value="${esc(p.startWeight)}" placeholder="${state.weights.length ? num(sortedWeights()[0].kg) : ''}"></label>
      <label>Peso objetivo (kg)<input name="goalWeight" type="text" inputmode="decimal" step="0.1" value="${esc(p.goalWeight)}"></label></div>
      <label>Fecha objetivo (opcional)<input name="goalDate" type="date" value="${esc(p.goalDate)}"></label>
      <p class="muted small">Si dejas vacío el peso inicial se usa tu primer registro.</p>
      <label>Nivel de actividad fuera de los entrenos<select name="activity">${ACTIVITY_LEVELS.map(([v, l]) => `<option value="${v}" ${(p.activity || '1.375') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${tdeeHtml()}
      <button type="button" class="btn ghost block" data-action="goals">🎯 Metas: cardio, pasos, agua y sueño</button>
    </form>
    <div class="card"><h3>Entrenamiento</h3>
      <label class="switch"><input type="checkbox" data-setting="sound" ${s.sound ? 'checked' : ''}> Pitidos de cuenta atrás</label>
      <label class="switch"><input type="checkbox" data-setting="voice" ${s.voice ? 'checked' : ''}> Anunciar ejercicios en voz alta</label>
    </div>
    <div class="card"><h3>Google Drive</h3>
      ${sync.connected ? `<p>✅ Conectado. Tus datos se guardan en un archivo privado de tu Drive que solo esta app puede ver.</p><p class="muted small">Última sincronización: ${last}</p>
        <div class="row"><button class="btn" data-action="drive-sync">Sincronizar ahora</button><button class="btn ghost" data-action="drive-off">Desconectar</button></div>`
      : `<p>Guarda una copia de todo en tu Google Drive y úsala en varios dispositivos.</p>
        <label>ID de cliente OAuth de Google<input id="client-id" value="${esc(sync.clientId || '')}" placeholder="xxxxxxxx.apps.googleusercontent.com" autocomplete="off" spellcheck="false"></label>
        <p class="muted small">Se crea gratis en Google Cloud (ver README). Como “origen autorizado” pon: <code>${esc(origin)}</code></p>
        <button class="btn" data-action="drive-on">Conectar con Google Drive</button>`}
    </div>
    <div class="card"><h3>Copia de seguridad manual</h3>
      <div class="row"><button class="btn ghost" data-action="export">Descargar archivo</button><label class="btn ghost file">Importar archivo<input type="file" id="import" accept="application/json,.json" hidden></label></div>
      <button class="btn ghost danger block" data-action="wipe">Borrar todos los datos de este dispositivo</button>
    </div>
    <p class="muted small center">Mi Entreno · las calorías son estimaciones (método MET). Consulta con un profesional antes de empezar si tienes alguna lesión o condición médica.</p>`;
}
function tdeeHtml() {
  const bmr = bmrNow(); if (!bmr || !state.weights.length) return '<p class="muted small">Completa altura, año de nacimiento, sexo y registra tu peso para estimar tu gasto calórico.</p>';
  const t = intakeTarget(), f = toNum(state.profile.activity) || 1.375;
  return `<p class="tip">Metabolismo basal estimado: <b>${num(bmr, 0)} kcal/día</b>. Con tu nivel de actividad gastas unas <b>${num(bmr * f, 0)} kcal/día</b> sin contar entrenos; tu media real de la última semana es ${num(t.avg, 0)} kcal/día. Para tu objetivo come unas <b>${num(t.target, 0)} kcal/día</b> (${t.why}).</p>`;
}

// ============ Reproductor de entrenamiento ============
const P = { r: null, steps: [], i: 0, elapsed: 0, running: false, last: 0, log: [], startedAt: 0, beeped: {}, wake: null, timer: null, total: 0 };
let audio = null;
function beep(freq = 880, dur = 0.12) {
  if (!state.settings.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0.25, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    o.start(); o.stop(audio.currentTime + dur);
  } catch (e) {}
}
function say(text) {
  if (!state.settings.voice || !('speechSynthesis' in window)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'es-ES'; speechSynthesis.speak(u); } catch (e) {}
}
function buildSteps(r) {
  const steps = [{ kind: 'prep', sec: 10 }];
  const rounds = r.rounds || 1;
  const phase = (items, name, rest) => items.forEach((it, i) => {
    const ex = EX[it.ex]; if (!ex) return;
    steps.push({ kind: 'ex', ex, n: it.n, t: it.t, sec: it.t || (ex.type === 'time' ? it.n * (ex.perSide ? 2 : 1) : null), phase: name });
    if (i < items.length - 1 && rest > 0) steps.push({ kind: 'rest', sec: rest });
  });
  if (r.warmup && r.warmup.length) { phase(r.warmup, 'warm', 10); steps.push({ kind: 'rest', sec: 30, label: 'Calentamiento listo · comienza la operación' }); }
  for (let k = 0; k < rounds; k++) {
    r.items.forEach((it, i) => {
      const ex = EX[it.ex]; if (!ex) return;
      steps.push({ kind: 'ex', ex, n: it.n, t: it.t, sec: it.t || (ex.type === 'time' ? it.n * (ex.perSide ? 2 : 1) : null), round: k + 1, rounds });
      const isLast = k === rounds - 1 && i === r.items.length - 1;
      if (!isLast && r.rest > 0) steps.push({ kind: 'rest', sec: i === r.items.length - 1 ? (r.roundRest ?? Math.max(45, r.rest * 2)) : r.rest, endRound: i === r.items.length - 1 });
    });
  }
  if (r.cooldown && r.cooldown.length) { steps.push({ kind: 'rest', sec: 45, label: '¡Operación completada! · vuelta a la calma' }); phase(r.cooldown, 'cool', 5); }
  return steps;
}
async function startWorkout(id) {
  const r = findRoutine(id); if (!r) return;
  P.prog = rCtx && rCtx.id === id && rCtx.prog ? rCtx.prog : null;
  closeModal();
  beep(1, 0.01); // desbloquea el audio con el toque del usuario
  Object.assign(P, { r, steps: buildSteps(r), i: 0, elapsed: 0, running: true, last: performance.now(), log: [], startedAt: Date.now(), beeped: {}, total: 0 });
  P.exCount = P.steps.filter((s) => s.kind === 'ex').length;
  $('#player').classList.add('open'); document.body.classList.add('noscroll');
  try { if ('wakeLock' in navigator) P.wake = await navigator.wakeLock.request('screen'); } catch (e) {}
  announce(); renderPlayer();
  clearInterval(P.timer); P.timer = setInterval(tick, 200);
}
function announce() {
  const s = P.steps[P.i]; if (!s) return;
  if (s.kind === 'prep') say(`Despliegue en diez segundos. Primero: ${P.steps[1]?.ex ? exName(P.steps[1].ex) : ''}`);
  else if (s.kind === 'ex') say(s.t ? `${exName(s.ex)}. ${s.t} segundos a tope` : s.ex.type === 'reps' ? `${exName(s.ex)}. ${s.n} repeticiones${s.ex.perSide ? ' por lado' : ''}` : `${exName(s.ex)}. ${s.n} segundos${s.ex.perSide ? ' por lado' : ''}`);
  else if (s.kind === 'rest') { const nx = P.steps[P.i + 1]; say(`${P.restLine} Siguiente: ${nx?.ex ? exName(nx.ex) : ''}`); }
}
function tick() {
  const now = performance.now();
  if (P.running) { const dt = (now - P.last) / 1000; P.elapsed += dt; P.total += dt; }
  P.last = now;
  const s = P.steps[P.i]; if (!s) return;
  if (s.sec != null) {
    const left = s.sec - P.elapsed;
    const whole = Math.ceil(left);
    if (whole <= 3 && whole >= 1 && !P.beeped[whole]) { P.beeped[whole] = true; beep(660); }
    if (s.kind === 'ex' && s.ex.perSide && !P.beeped.half && P.elapsed >= s.sec / 2) { P.beeped.half = true; beep(990, 0.25); say('Cambia de lado'); }
    if (left <= 0) { beep(1046, 0.3); nextStep(); return; }
  }
  updatePlayerTime();
}
function recordStep() {
  const s = P.steps[P.i]; if (!s || s.kind !== 'ex' || P.elapsed < 1) return;
  const cap = s.sec == null ? exActiveSec(s.ex, s.n) * 3 : s.sec; // por si te dejas el móvil sin tocar
  const sec = Math.min(P.elapsed, cap);
  P.log.push({ id: s.ex.id, reps: s.sec == null ? s.n : undefined, sec: Math.round(sec), kcal: kcalFor(s.ex.met, sec) });
}
function nextStep() { recordStep(); P.i++; P.elapsed = 0; P.beeped = {}; P.restLine = A.pick(A.LINES.rest); if (P.i >= P.steps.length) return finishWorkout(); announce(); renderPlayer(); }
function prevStep() {
  if (P.i <= 1) { P.elapsed = 0; P.beeped = {}; renderPlayer(); return; }
  let j = P.i - 1; if (P.steps[j].kind === 'rest') j--;
  const id = P.steps[j]?.ex?.id; const idx = P.log.map((l) => l.id).lastIndexOf(id); if (idx >= 0) P.log.splice(idx, 1);
  P.i = Math.max(1, j); P.elapsed = 0; P.beeped = {}; announce(); renderPlayer();
}
function stopPlayer() {
  clearInterval(P.timer); P.running = false;
  try { P.wake?.release(); } catch (e) {} P.wake = null;
  try { speechSynthesis.cancel(); } catch (e) {}
  $('#player').classList.remove('open'); document.body.classList.remove('noscroll');
}
function saveSessionFromLog() {
  if (!P.log.length) return null;
  const active = P.log.reduce((a, l) => a + l.sec, 0);
  const restSec = Math.max(0, P.total - active);
  const kcal = P.log.reduce((a, l) => a + l.kcal, 0) + kcalFor(1.5, restSec);
  const s = { id: uid(), date: new Date(P.startedAt).toISOString(), routineId: P.r.id, routineName: P.r.name, durationSec: Math.round(P.total), activeSec: Math.round(active), kcal: Math.round(kcal), xp: Math.round(kcal + 25 + (P.i >= P.steps.length ? 25 : 0)), exercises: P.log.map(({ id, reps, sec }) => ({ id, reps, sec })) };
  if (P.prog) { // avanza la campaña
    const { pid, day } = P.prog, st = progState(pid);
    s.program = pid;
    state.programs[pid] = { day: Math.max(st.day, day + 1), log: [...(st.log || []), { day, date: s.date }], last: Date.now() };
  }
  state.sessions.push(s); save(); return s;
}
function finishWorkout() {
  stopPlayer();
  const before = A.rankFor(totalXP());
  const s = saveSessionFromLog();
  const line = A.pick(A.LINES.finish);
  render();
  if (!s) return;
  const after = A.rankFor(totalXP());
  const up = after.index > before.index;
  say(up ? `${line} ¡Ascenso! Ahora eres ${after.name}.` : line);
  openModal(`<div class="center"><div class="fig-stage finish-fig">${A.portrait(avatarId(), 'victory')}</div><small class="kicker">${esc(s.routineName)}</small><h2 class="mission">${esc(line)}</h2>
    ${up ? `<div class="promo">⬆ ¡ASCENSO! ${after.icon} ${esc(after.name)}</div>` : ''}</div>
    <div class="stats">${stat(fmtMin(s.durationSec), 'tiempo')}${stat(s.kcal, 'kcal')}${stat('+' + s.xp, 'XP')}</div>
    <div class="xpbar"><span style="width:${after.pct.toFixed(1)}%"></span></div>
    ${(() => { const h = muscleHeat([s]); return Object.keys(h).length ? `<h3 class="center">Músculos trabajados</h3>${MM.svg({ heat: h, small: true })}<p class="center muted small">Sobre todo: ${esc(heatTop(h))}</p>` : ''; })()}
    <p class="center muted small">${after.icon} ${esc(after.name)}${after.next ? ` · faltan ${num(after.toNext, 0)} XP para ${esc(after.next.name)}` : ''}</p>
    <p class="center muted small">Llevas ${weekStats().count} entreno${weekStats().count === 1 ? '' : 's'} esta semana · ${num(weekStats().kcal, 0)} kcal · ${num(weekPoints(), 0)} puntos cardio</p>
    ${s.program ? (() => { const p = findProg(s.program), st = progState(p.id); return `<p class="center promo-sm">🏳️ ${esc(p.name)}: ${st.day >= p.days.length ? '¡campaña completada!' : `día ${st.day} de ${p.days.length} superado`}</p>`; })() : ''}
    <div class="row"><button class="btn" data-action="weight">⚖️ Registrar peso</button><button class="btn ghost" data-action="close">Cerrar</button></div>`);
}
function quitWorkout() {
  const wasRunning = P.running;
  P.running = false; renderPlayer();
  const resume = () => { P.running = wasRunning; P.last = performance.now(); renderPlayer(); };
  const hasWork = P.log.length > 0 || (P.steps[P.i]?.kind === 'ex' && P.elapsed > 5);
  if (!hasWork) { if (confirm('¿Salir del entrenamiento?')) stopPlayer(); else resume(); return; }
  if (confirm('¿Terminar ahora y guardar lo que llevas hecho?')) {
    recordStep(); stopPlayer(); const s = saveSessionFromLog(); render();
    if (s) toast(`Guardado: ${fmtMin(s.durationSec)} · ${s.kcal} kcal`);
  } else if (confirm('¿Salir SIN guardar?')) { stopPlayer(); render(); }
  else resume();
}
function renderPlayer() {
  const s = P.steps[P.i]; if (!s) return;
  const exIdx = P.steps.slice(0, P.i + 1).filter((x) => x.kind === 'ex').length;
  const next = P.steps.slice(P.i + 1).find((x) => x.kind === 'ex');
  let body;
  if (s.kind === 'ex') {
    body = `<div class="p-label">${s.phase === 'warm' ? 'Calentamiento · ' : s.phase === 'cool' ? 'Vuelta a la calma · ' : ''}${s.rounds > 1 ? `Oleada ${s.round}/${s.rounds} · ` : ''}Objetivo ${exIdx}/${P.exCount}</div>
      <div class="fig-stage player-fig">${exVisual(s.ex)}</div>
      <h2 class="p-name">${esc(exName(s.ex))}</h2>${exSub(s.ex) ? `<div class="p-real">${esc(exSub(s.ex))}</div>` : ''}
      ${s.sec == null ? `<div class="p-big">×${s.n}</div><div class="p-sub">${s.ex.perSide ? 'por lado · ' : ''}<span id="p-time"></span></div>` : `<div class="p-big" id="p-time"></div><div class="p-sub">${s.t ? 'a tope · todas las que puedas' : s.ex.perSide ? 'Cambia de lado al oír el aviso' : 'segundos'}</div>`}
      <details class="p-how"><summary>Cómo se hace${s.ex.stepsLang === 'en' ? ' (en inglés)' : ''}</summary><ol>${s.ex.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>${s.ex.tip ? `<p>💡 ${esc(s.ex.tip)}</p>` : ''}</details>`;
  } else {
    const isPrep = s.kind === 'prep';
    body = `<div class="p-label">${isPrep ? 'Despliegue en' : s.label ? esc(s.label) : s.endRound ? 'Oleada superada · recarga' : 'Recargando escudos'}</div>
      <div class="p-big" id="p-time"></div>
      ${!isPrep ? `<p class="p-quote">“${esc(P.restLine || A.LINES.rest[0])}”</p>` : ''}
      ${next ? `<div class="p-next-card"><span class="mini-fig">${exVisual(next.ex)}</span><div><small class="muted">Siguiente</small><b>${esc(exName(next.ex))}</b><small>${exSub(next.ex) ? esc(exSub(next.ex)) + ' · ' : ''}${itLabel(next.ex, next)}</small></div></div>` : ''}
      <button class="btn ghost small" data-action="p-plus">+10 s</button>`;
  }
  $('#player').innerHTML = `
    <div class="p-top"><button class="icon" data-action="p-quit" aria-label="Salir">✕</button><div class="p-title">${esc(P.r.name)}</div><div class="p-clock" id="p-total"></div></div>
    <div class="p-progress"><span style="width:${(P.i / P.steps.length * 100).toFixed(1)}%"></span></div>
    <div class="p-body ${s.kind}">${body}</div>
    <div class="p-controls">
      <button class="icon" data-action="p-prev" aria-label="Anterior">⏮</button>
      ${s.kind === 'ex' && s.sec == null ? `<button class="btn big-btn p-main" data-action="p-next">✓ Hecho</button>` : `<button class="btn big-btn p-main" data-action="p-pause">${P.running ? '❚❚ Pausa' : '▶ Seguir'}</button>`}
      <button class="icon" data-action="p-next" aria-label="Saltar">⏭</button>
    </div>
    ${!P.running ? '<div class="p-paused">En pausa</div>' : ''}`;
  updatePlayerTime();
}
function updatePlayerTime() {
  const s = P.steps[P.i]; if (!s) return;
  const t = $('#p-time'); if (t) t.textContent = s.sec != null ? Math.max(0, Math.ceil(s.sec - P.elapsed)) : clock(P.elapsed);
  const tt = $('#p-total'); if (tt) tt.textContent = clock(P.total);
}

// ============ Google Drive ============
class NeedAuth extends Error { constructor() { super('Hace falta iniciar sesión en Google'); } }
const Drive = {
  SCOPE: 'https://www.googleapis.com/auth/drive.appdata',
  FILE: 'mi-entreno-datos.json',
  API: 'https://www.googleapis.com/drive/v3',
  UP: 'https://www.googleapis.com/upload/drive/v3',
  status: 'off', busy: false, pushTimer: null, client: null, clientFor: null,
  setStatus(s) { this.status = s; this.renderChip(); },
  renderChip() {
    const c = $('#sync-chip'); if (!c) return;
    const map = { off: ['Sin Drive', ''], ok: ['Guardado', 'ok'], syncing: ['Guardando…', 'busy'], auth: ['Toca para guardar', 'warn'], error: ['Error · reintentar', 'warn'], pending: ['Pendiente', 'busy'] };
    const st = sync.connected ? this.status === 'off' ? 'auth' : this.status : 'off';
    const [txt, cls] = map[st] || map.off;
    c.textContent = '☁︎ ' + txt; c.className = 'chip-sync ' + cls; c.dataset.state = st;
  },
  loadGis() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = () => res(); s.onerror = () => rej(new Error('No se pudo cargar Google. ¿Tienes conexión?'));
      document.head.appendChild(s);
    });
  },
  validToken() { return sync.token && Date.now() < (sync.tokenExp || 0) - 60000 ? sync.token : null; },
  async getToken(interactive) {
    const t = this.validToken(); if (t) return t;
    if (!interactive) throw new NeedAuth();
    if (!sync.clientId) throw new Error('Falta el ID de cliente de Google');
    await this.loadGis();
    return new Promise((res, rej) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: sync.clientId, scope: this.SCOPE,
        callback: (r) => {
          if (r.error) return rej(new Error(r.error_description || r.error));
          if (!google.accounts.oauth2.hasGrantedAllScopes(r, this.SCOPE)) return rej(new Error('No diste permiso para usar Drive'));
          sync.token = r.access_token; sync.tokenExp = Date.now() + (Number(r.expires_in) || 3600) * 1000; saveSync(); res(sync.token);
        },
        error_callback: (e) => rej(new Error(e?.type === 'popup_closed' ? 'Ventana de Google cerrada' : e?.type === 'popup_failed_to_open' ? 'El navegador bloqueó la ventana de Google' : (e?.message || 'Error al iniciar sesión'))),
      });
      client.requestAccessToken({ prompt: sync.connected ? '' : 'consent' });
    });
  },
  async api(url, opts = {}, interactive) {
    const t = await this.getToken(interactive);
    const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + t } });
    if (r.status === 401) { sync.token = null; saveSync(); if (interactive) return this.api(url, opts, interactive); throw new NeedAuth(); }
    return r;
  },
  async findFile(interactive) {
    const q = encodeURIComponent(`name='${this.FILE}' and trashed=false`);
    const r = await this.api(`${this.API}/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc&pageSize=1`, {}, interactive);
    if (!r.ok) throw new Error('Drive: ' + r.status + ' ' + (await r.text()).slice(0, 160));
    return (await r.json()).files?.[0] || null;
  },
  async upload(interactive) {
    const body = JSON.stringify(state);
    if (sync.fileId) {
      const r = await this.api(`${this.UP}/files/${sync.fileId}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }, interactive);
      if (r.ok) return;
      if (r.status !== 404) throw new Error('Drive: ' + r.status);
      sync.fileId = null;
    }
    const boundary = 'b' + uid();
    const meta = JSON.stringify({ name: this.FILE, parents: ['appDataFolder'], mimeType: 'application/json' });
    const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
    const r = await this.api(`${this.UP}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body: multipart }, interactive);
    if (!r.ok) throw new Error('Drive: ' + r.status + ' ' + (await r.text()).slice(0, 160));
    sync.fileId = (await r.json()).id; saveSync();
  },
  async syncNow(interactive = true) {
    if (this.busy) { this.again = true; return; }
    this.busy = true; this.setStatus('syncing');
    try {
      const file = await this.findFile(interactive);
      let remote = null;
      if (file) {
        sync.fileId = file.id;
        const r = await this.api(`${this.API}/files/${file.id}?alt=media`, {}, interactive);
        if (!r.ok) throw new Error('Drive: ' + r.status);
        try { remote = normalize(await r.json()); } catch (e) { remote = null; }
      }
      const last = sync.lastSyncedAt || 0;
      let push = true;
      if (remote) {
        const remoteChanged = remote.updatedAt > last, localChanged = state.updatedAt > last;
        if (remoteChanged && !localChanged) { state = remote; persist(); push = false; }
        else if (remoteChanged && localChanged) { state = mergeStates(state, remote); persist(); }
        else if (!localChanged) push = false;
      }
      if (push) await this.upload(interactive);
      sync.connected = true; sync.lastSyncedAt = state.updatedAt; sync.lastSyncTime = Date.now(); saveSync();
      this.setStatus('ok');
      if (!$('#player').classList.contains('open') && !$('#modal').classList.contains('open')) render();
    } catch (e) {
      if (e instanceof NeedAuth) this.setStatus('auth');
      else { this.setStatus('error'); if (interactive) toast(e.message); console.warn(e); }
    } finally {
      this.busy = false;
      if (this.again) { this.again = false; this.syncNow(false); }
    }
  },
  schedulePush() {
    if (!sync.connected) return;
    this.setStatus(this.validToken() ? 'pending' : 'auth');
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.syncNow(false), 2000);
  },
  async connect() {
    const id = ($('#client-id')?.value || '').replace(/\s+/g, '');
    if (!/\.apps\.googleusercontent\.com$/.test(id)) { toast('Pega el ID de cliente (termina en .apps.googleusercontent.com)'); return; }
    if (!location.protocol.startsWith('http')) { toast('Abre la app desde su dirección web (https://…) para conectar Drive'); return; }
    sync.clientId = id; saveSync();
    try { await this.getToken(true); } catch (e) { toast(e.message); return; }
    sync.connected = true; saveSync();
    await this.syncNow(true);
    if (this.status === 'ok') { toast('¡Conectado a Google Drive!'); render(); }
  },
  disconnect() {
    if (!confirm('¿Desconectar Google Drive? Tus datos siguen en este dispositivo y en tu Drive.')) return;
    try { if (sync.token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(sync.token, () => {}); } catch (e) {}
    sync = { clientId: sync.clientId }; saveSync(); this.setStatus('off'); render();
  },
};
function mergeStates(a, b) { // a = local, b = remoto. Une registros de ambos.
  const newer = a.updatedAt >= b.updatedAt ? a : b, older = newer === a ? b : a;
  const byKey = (arr1, arr2, k) => { const m = new Map(); arr2.forEach((x) => m.set(x[k], x)); arr1.forEach((x) => m.set(x[k], x)); return [...m.values()]; };
  return normalize({ ...newer,
    weights: byKey(newer.weights, older.weights, 'date').sort((x, y) => x.date.localeCompare(y.date)),
    sessions: byKey(newer.sessions, older.sessions, 'id').sort((x, y) => x.date.localeCompare(y.date)),
    customRoutines: byKey(newer.customRoutines, older.customRoutines, 'id'),
    libExercises: byKey(newer.libExercises || [], older.libExercises || [], 'id'),
    measures: byKey(newer.measures || [], older.measures || [], 'date').sort((x, y) => x.date.localeCompare(y.date)),
    days: { ...(older.days || {}), ...(newer.days || {}) },
    overrides: { ...(older.overrides || {}), ...(newer.overrides || {}) },
    programs: (() => { const o = { ...(older.programs || {}) }; Object.entries(newer.programs || {}).forEach(([k, v]) => { const w = o[k]; o[k] = !w || v.day >= w.day ? v : w; }); return o; })(),
    updatedAt: Date.now() });
}

// ============ Eventos ============
function onClick(ev) {
  const el = ev.target.closest('[data-action],[data-tab]');
  if (!el) { if (ev.target.id === 'modal') closeModal(); return; }
  const a = el.dataset.action, id = el.dataset.id;
  if (!a && el.dataset.tab) return go(el.dataset.tab);
  switch (a) {
    case 'tab': return go(el.dataset.tab);
    case 'avatar': state.profile.avatar = id; save(); toast(`Clase elegida: ${A.CLASSES[id].name}`); return render();
    case 'close': return closeModal();
    case 'weight': return weightModal();
    case 'save-weight': {
      const date = $('#w-date').value || todayStr(), kg = toNum($('#w-kg').value), waist = toNum($('#w-waist').value);
      if (!kg || kg < 20 || kg > 350) return toast('Escribe un peso válido');
      state.weights = state.weights.filter((w) => w.date !== date);
      state.weights.push({ date, kg: Math.round(kg * 10) / 10, ...(waist ? { waist } : {}) });
      save(); closeModal(); render(); toast('Peso guardado');
      return;
    }
    case 'del-weight': if (confirm('¿Borrar este registro de peso?')) { state.weights = state.weights.filter((w) => w.date !== el.dataset.date); save(); render(); } return;
    case 'del-session': if (confirm('¿Borrar este entreno del historial?')) { state.sessions = state.sessions.filter((s) => s.id !== id); save(); render(); } return;
    case 'range': range = +el.dataset.v; return render();
    case 'routine': return showRoutine(id, false, el.dataset.prog ? { pid: el.dataset.prog, day: +el.dataset.day } : null);
    case 'focus': focusKey = el.dataset.k; return renderEntrenar();
    case 'goal': goalKey = el.dataset.k; return renderEntrenar();
    case 'quick': return showQuick(el.dataset.q);
    case 'prog-open': return showProgram(id);
    case 'prog-start': return startProgram(id);
    case 'prog-reset': if (confirm('¿Reiniciar la campaña desde el día 1? Tu historial de entrenos se mantiene.')) { delete state.programs[id]; save(); showProgram(id); render(); } return;
    case 'quick-start': { const ap = activeProg(); if (ap) return startProgram(ap.p.id);
      const last = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date)).find((x) => findRoutine(x.routineId));
      return showRoutine(last ? last.routineId : 'r-principiante', false, null); }
    case 'rex': return exSheet(el.dataset.phase, +el.dataset.i);
    case 'swap': return swapModal(el.dataset.phase, +el.dataset.i);
    case 'swap-pick': return swapPick(id);
    case 'swap-cancel': return rCtx.fromSheet ? exSheet(rCtx.phase, rCtx.i) : showRoutine(rCtx.id, true);
    case 'adj': return adjustItem(+el.dataset.d);
    case 'xs-nav': { const list = routineList(findRoutine(rCtx.id)); const k = list.findIndex((x) => x.ph === rCtx.phase && x.i === rCtx.i) + +el.dataset.d; if (list[k]) exSheet(list[k].ph, list[k].i); return; }
    case 'xs-close': rCtx.sheet = false; return showRoutine(rCtx.id);
    case 'reset-routine': if (confirm('¿Volver a la versión original de esta misión?')) { delete state.overrides[id]; save(); showRoutine(id); } return;
    case 'log-menu': return logMenu();
    case 'log': return logModal(el.dataset.k);
    case 'log-add': { const i = $('#log-v'); i.value = String(Math.round(((logNum(i.value, el.dataset.k) || 0) + +el.dataset.a) * 10) / 10).replace('.', ','); return; }
    case 'save-log': {
      const k = el.dataset.k, [, key] = LOG_FIELDS[k], v = logNum($('#log-v').value, k);
      if (v == null || v < 0) return toast('Escribe un número válido');
      if (k === 'sleep' && v > 24) return toast('Máximo 24 horas');
      setDay(todayStr(), { [key]: k === 'sleep' ? Math.round(v * 10) / 10 : Math.round(v) }); save(); closeModal(); render(); toast('Guardado'); return;
    }
    case 'water-add': setDay(todayStr(), { water: (dayLog().water || 0) + +el.dataset.ml }); save(); render(); toast(`+${el.dataset.ml} ml de agua`); return;
    case 'save-activity': {
      const a = ACT[$('#a-type').value], min = toNum($('#a-min').value), km = toNum($('#a-km').value), gain = toNum($('#a-gain').value), eff = toNum($('#a-eff').value) || 1;
      const date = $('#a-date').value || todayStr();
      if (!min || min < 1 || min > 1000) return toast('Escribe los minutos');
      const kg = currentWeight(), met = a.met * eff;
      const kcal = Math.round(kcalFor(met, min * 60, kg) + (gain ? kg * gain * 0.0094 : 0)); // subir tu peso: rendimiento muscular ~25 %
      const when = date === todayStr() ? new Date() : new Date(parseDay(date).getTime() + 12 * 3600000);
      const s = { id: uid(), date: new Date(when.getTime() - min * 60000).toISOString(), routineId: 'act-' + a.id, routineName: `${a.icon} ${a.name}${km ? ` · ${num(km)} km` : ''}${gain ? ` · +${num(gain, 0)} m` : ''}`,
        durationSec: Math.round(min * 60), activeSec: Math.round(min * 60), kcal, xp: Math.round(Math.min(kcal, 800) + 25), met, activity: { type: a.id, km: km || undefined, gain: gain || undefined }, exercises: [] };
      state.sessions.push(s); save(); closeModal(); render(); toast(`Guardado: ${a.name} · ${kcal} kcal · +${s.xp} XP`); return;
    }
    case 'save-measure': {
      const date = $('#m-date').value || todayStr(), m = { date };
      document.querySelectorAll('[data-m]').forEach((i) => { const v = toNum(i.value); if (v) m[i.dataset.m] = v; });
      if (Object.keys(m).length < 2) return toast('Anota al menos una medida');
      if (m.fat && (m.fat < 3 || m.fat > 70)) return toast('El % de grasa no parece válido');
      state.measures = state.measures.filter((x) => x.date !== date).concat([{ ...(state.measures.find((x) => x.date === date) || {}), ...m }]);
      if (m.waist) { const w = state.weights.find((x) => x.date === date); if (w) w.waist = m.waist; }
      save(); closeModal(); render(); const f = bodyFat(state.measures.find((x) => x.date === date)); toast(f ? `Medidas guardadas · grasa ~${num(f)} %` : 'Medidas guardadas'); return;
    }
    case 'del-measure': if (confirm('¿Borrar esta medición?')) { state.measures = state.measures.filter((m) => m.date !== el.dataset.date); save(); render(); } return;
    case 'mkey': measureKey = el.dataset.k; return render();
    case 'goals': return goalsModal();
    case 'save-goals': document.querySelectorAll('#goals-form [name]').forEach((i) => { state.profile[i.name] = i.value.trim(); }); save(); closeModal(); render(); toast('Metas guardadas'); return;
    case 'info-points': {
      const s0 = weekStart(new Date()), list = state.sessions.filter((x) => new Date(x.date) >= s0);
      return openModal(`<h2>Cardio semanal</h2><p>Ganas <b>1 punto por minuto</b> de actividad moderada (caminar rápido, movilidad intensa…) y <b>2 puntos por minuto</b> de actividad intensa (correr, HIIT, subir el cerro). Se reinicia cada lunes.</p>
        <p>Meta: <b>${num(goalNum('cardioGoal', 150), 0)} puntos</b> a la semana (la OMS recomienda 150 min moderados o 75 intensos).</p>
        ${list.length ? `<ul class="log">${list.map((x) => `<li><span>${new Date(x.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</span><b class="grow">${esc(x.routineName)}</b><small>+${num(sessionPoints(x), 0)} pts</small></li>`).join('')}</ul>` : '<p class="muted">Aún no tienes puntos esta semana.</p>'}
        <div class="row"><button class="btn" data-action="goals">Cambiar meta</button><button class="btn ghost" data-action="close">Cerrar</button></div>`);
    }
    case 'info-rec': { const r = recovery();
      return openModal(`<h2>Recuperación</h2><div class="big">${num(r.pct, 0)} %</div><p><b>${r.label}</b></p>
        <p class="muted">Estimación según la carga de tus entrenos de las últimas 72 horas (los más recientes pesan más) y las horas que dormiste anoche.</p>
        <ul class="steps"><li>75–100 %: puedes con una misión legendaria o cuestas.</li><li>45–75 %: mejor fuerza moderada, técnica o trote suave.</li><li>Menos de 45 %: movilidad, estiramientos o descanso.</li></ul>
        <div class="row"><button class="btn" data-action="log" data-k="sleep">🌙 Anotar sueño</button><button class="btn ghost" data-action="close">Cerrar</button></div>`); }
    case 'start': return startWorkout(id);
    case 'ex': return showExercise(id);
    case 'group': exGroup = el.dataset.g; return renderEjercicios();
    case 'mode': exMode = el.dataset.m; closeModal(); tab = 'ejercicios'; render(); window.scrollTo(0, 0); return;
    case 'muscle': mapMuscle = mapMuscle === el.dataset.m ? '' : el.dataset.m; renderMap(); if (mapMuscle) $('#map-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return;
    case 'map-lib': libMuscle = el.dataset.m; libEquip = 'home'; libShown = 40; exMode = 'lib'; render(); window.scrollTo(0, 0); return;
    case 'lib-muscle-clear': libMuscle = ''; libShown = 40; return renderLibrary();
    case 'lib-equip': libEquip = el.dataset.k; libShown = 40; return renderLibrary();
    case 'lib-group': libGroup = el.dataset.g; libShown = 40; return renderLibrary();
    case 'lib-more': libShown += 40; return renderLibList();
    case 'lib-retry': libData = null; return renderLibrary();
    case 'lib-add': addLib(id); if ($('#modal').classList.contains('open')) showExercise(id); if (exMode === 'lib') renderLibList(); return;
    case 'lib-remove': if (removeLib(id)) { closeModal(); render(); toast('Quitado de tu arsenal'); } return;
    case 'new-routine': return editRoutine(null);
    case 'edit-routine': return editRoutine(id);
    case 'copy-routine': return editRoutine(id, true);
    case 'del-routine': if (confirm('¿Borrar esta rutina?')) { state.customRoutines = state.customRoutines.filter((r) => r.id !== id); save(); closeModal(); render(); } return;
    case 'pick-open': readDraftInputs(); picking = true; pickQuery = ''; renderDraft(); setTimeout(() => $('#pick-q')?.focus(), 50); return;
    case 'pick-cancel': picking = false; return renderDraft();
    case 'pick': { const ex = EX[id]; draft.items.push({ ex: id, n: ex.n }); picking = false; return renderDraft(); }
    case 'mv': { readDraftInputs(); const i = +el.dataset.i, j = i + +el.dataset.d; if (j >= 0 && j < draft.items.length) [draft.items[i], draft.items[j]] = [draft.items[j], draft.items[i]]; return renderDraft(); }
    case 'rm': readDraftInputs(); draft.items.splice(+el.dataset.i, 1); return renderDraft();
    case 'save-routine': {
      readDraftInputs();
      if (!draft.name) return toast('Ponle un nombre a la rutina');
      if (!draft.items.length) return toast('Añade al menos un ejercicio');
      state.customRoutines = state.customRoutines.filter((r) => r.id !== draft.id).concat([draft]);
      save(); closeModal(); tab = 'entrenar'; render(); toast('Rutina guardada'); return;
    }
    case 'p-next': return nextStep();
    case 'p-prev': return prevStep();
    case 'p-pause': P.running = !P.running; P.last = performance.now(); return renderPlayer();
    case 'p-plus': { const s = P.steps[P.i]; if (s && s.sec != null) { s.sec += 10; P.beeped = {}; updatePlayerTime(); } return; }
    case 'p-quit': return quitWorkout();
    case 'drive-on': return Drive.connect();
    case 'drive-off': return Drive.disconnect();
    case 'drive-sync': return Drive.syncNow(true);
    case 'sync-chip': return sync.connected ? Drive.syncNow(true) : go('ajustes');
    case 'export': {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `mi-entreno-${todayStr()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
    }
    case 'wipe':
      if (confirm('Esto borra todos los datos de ESTE dispositivo (no los de Drive). ¿Seguro?')) { state = defaults(); persist(); sync.lastSyncedAt = 0; saveSync(); render(); toast('Datos borrados'); }
      return;
    case 'back': return backAction();
  }
}
// Al abrir una ficha desde otra ventana, «atrás» vuelve a la ventana anterior
const OPENERS = new Set(['routine', 'ex', 'log', 'prog-open', 'goals', 'info-points', 'info-rec']);
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  const prev = el && $('#modal').classList.contains('open') && el.closest('#modal') ? curView : null;
  onClick(ev);
  if (prev && OPENERS.has(el.dataset.action) && $('#modal').classList.contains('open') && !modalBack) {
    modalBack = prev; if (el.dataset.action === 'routine' && rCtx) rCtx.back = prev;
  }
});

// ============ Botón y gesto «atrás» del móvil ============
// La app guarda siempre una entrada extra en el historial: al pulsar atrás se navega dentro de la app
// (cierra el entreno o la ventana abierta, vuelve a la anterior o a la Base) y solo sale si lo pulsas dos veces en la Base.
let modalBack = null, curView = null, lastBack = 0;
function backAction() {
  if ($('#player').classList.contains('open')) { quitWorkout(); return true; }
  if ($('#modal').classList.contains('open')) { const f = modalBack; if (f) f(); else closeModal(); return true; }
  if (tab === 'ejercicios' && exMode !== 'mine') { exMode = 'mine'; render(); window.scrollTo(0, 0); return true; }
  if (tab !== 'hoy') { go('hoy'); return true; }
  return false;
}
try { history.replaceState({ root: true }, ''); history.pushState({ app: true }, ''); } catch (e) {}
window.addEventListener('popstate', () => {
  if (backAction()) { history.pushState({ app: true }, ''); return; }
  if (Date.now() - lastBack < 2500) { history.back(); return; } // segunda pulsación: salir
  lastBack = Date.now(); toast('Pulsa atrás otra vez para salir'); history.pushState({ app: true }, '');
});
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'ex-q') { exQuery = ev.target.value; renderExList(); }
  if (ev.target.id === 'lib-q') { libQuery = ev.target.value; libShown = 40; renderLibList(); }
  if (ev.target.id === 'pick-q') {
    pickQuery = ev.target.value; const pos = ev.target.selectionStart; renderDraft();
    const n = $('#pick-q'); n.focus(); n.setSelectionRange(pos, pos);
  }
});
document.addEventListener('change', (ev) => {
  const f = ev.target.closest('#profile-form');
  if (f && ev.target.name) { state.profile[ev.target.name] = ev.target.value.trim(); save(); if (['sex', 'heightCm', 'birthYear', 'activity', 'goalWeight', 'goalDate'].includes(ev.target.name)) render(); return; }
  if (ev.target.dataset.setting) { state.settings[ev.target.dataset.setting] = ev.target.checked; save(); return; }
  if (ev.target.id === 'import' && ev.target.files[0]) {
    ev.target.files[0].text().then((t) => {
      const data = JSON.parse(t); if (!data.version) throw new Error();
      if (!confirm('¿Importar este archivo? Se combinará con los datos actuales.')) return;
      state = mergeStates(state, normalize(data)); save(); render(); toast('Datos importados');
    }).catch(() => toast('Ese archivo no es una copia válida de Mi Entreno'));
  }
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && $('#modal').classList.contains('open')) closeModal(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if ($('#player').classList.contains('open') && P.running && 'wakeLock' in navigator) navigator.wakeLock.request('screen').then((w) => (P.wake = w)).catch(() => {});
    if (sync.connected && Drive.validToken() && !$('#player').classList.contains('open')) Drive.syncNow(false);
  }
});

// ============ Inicio ============
registerLib();
render();
if (sync.connected) { Drive.setStatus(Drive.validToken() ? 'ok' : 'auth'); if (Drive.validToken()) Drive.syncNow(false); }
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
