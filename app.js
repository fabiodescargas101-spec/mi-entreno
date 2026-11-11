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
const avatarId = () => state.profile.avatar || 'spartan';
const totalXP = () => state.sessions.reduce((a, s) => a + (s.xp ?? Math.round(s.kcal + 25)), 0);

// ============ Datos ============
const KEY = 'mientreno:datos:v1';
const SYNC_KEY = 'mientreno:sync:v1';
const defaults = () => ({
  version: 1, updatedAt: 0,
  profile: { name: '', avatar: 'spartan', sex: '', birthYear: '', heightCm: '', startWeight: '', goalWeight: '', goalDate: '' },
  weights: [],         // { date, kg, waist? }
  sessions: [],        // { id, date (ISO), routineId, routineName, durationSec, activeSec, kcal, exercises: [{ id, reps?, sec }] }
  customRoutines: [],  // misma forma que ROUTINES
  libExercises: [],    // ejercicios añadidos desde la Biblioteca libre
  settings: { sound: true, voice: true },
});
const normalize = (s) => {
  const d = defaults();
  return { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) }, settings: { ...d.settings, ...(s.settings || {}) },
    weights: s.weights || [], sessions: s.sessions || [], customRoutines: s.customRoutines || [], libExercises: s.libExercises || [] };
};
function loadState() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.version) return normalize(s); } catch (e) {} return defaults(); }
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
const allRoutines = () => [...state.customRoutines, ...window.ROUTINES];
const findRoutine = (id) => allRoutines().find((r) => r.id === id);

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

// ============ UI general ============
let tab = 'hoy';
const view = () => $('#view');
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}
function openModal(html) { $('#modal-body').innerHTML = html; $('#modal').classList.add('open'); $('#modal').scrollTop = 0; }
function closeModal() { $('#modal').classList.remove('open'); }
function go(t) { tab = t; closeModal(); render(); window.scrollTo(0, 0); }

function render() {
  document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  ({ hoy: renderHoy, entrenar: renderEntrenar, ejercicios: renderEjercicios, progreso: renderProgreso, ajustes: renderAjustes })[tab]();
  Drive.renderChip();
}

const bar = (pct) => `<div class="bar"><span style="width:${clamp(pct, 0, 100).toFixed(1)}%"></span></div>`;
const stat = (val, label) => `<div class="stat"><b>${val}</b><small>${label}</small></div>`;

// ---------- HOY ----------
function renderHoy() {
  const g = goalInfo();
  const wk = weekStats(), st = streak();
  const callsign = esc(state.profile.name || A.CLASSES[avatarId()].name);
  const xp = totalXP(), rk = A.rankFor(xp);
  let goalCard;
  if (g.current == null) {
    goalCard = `<div class="card accent-card"><h3>Empieza aquí</h3><p>Registra tu peso y ponte un objetivo para ver cuánto te falta.</p>
      <div class="row"><button class="btn" data-action="weight">Registrar peso</button><button class="btn ghost" data-action="tab" data-tab="ajustes">Poner objetivo</button></div></div>`;
  } else if (!g.hasGoal) {
    goalCard = `<div class="card"><div class="big">${num(g.current)} <small>kg</small></div><p class="muted">Peso actual${g.bmi ? ` · IMC ${num(g.bmi)}` : ''}</p>
      <p>Pon un peso objetivo para ver tu progreso y cuánto te falta.</p><button class="btn ghost" data-action="tab" data-tab="ajustes">Poner objetivo</button></div>`;
  } else {
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
    goalCard = `<div class="card">
      <div class="goal-head"><div><small class="muted">Te faltan</small><div class="big">${g.done ? '0' : num(g.remaining)} <small>kg</small></div></div>
      <div class="right"><small class="muted">Actual → meta</small><div class="mid">${num(g.current)} → ${num(g.goal)} kg</div></div></div>
      ${bar(g.pct)}
      <div class="row between muted small"><span>${g.changed >= 0 ? (g.losing ? '−' : '+') : (g.losing ? '+' : '−')}${num(Math.abs(g.changed))} kg desde ${num(g.start)} kg</span><span>${num(g.pct, 0)} %</span></div>
      ${line}
      ${g.avg7 ? `<p class="muted small">Media últimos 7 días: ${num(g.avg7)} kg${g.bmi ? ` · IMC ${num(g.bmi)}` : ''}</p>` : ''}
    </div>`;
  }
  const last = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const suggested = (last && findRoutine(last.routineId)) || window.ROUTINES[0];
  const loggedToday = state.weights.some((w) => w.date === todayStr());
  view().innerHTML = `
    <div class="hero card">
      <div class="hero-fig">${A.portrait(avatarId())}</div>
      <div class="hero-info">
        <small class="kicker">${A.pick(A.LINES.hello)}</small>
        <h1 class="callsign">${callsign}</h1>
        <div class="rank">${rk.icon} ${esc(rk.name)}</div>
        <div class="xpbar"><span style="width:${rk.pct.toFixed(1)}%"></span></div>
        <small class="muted">${num(xp, 0)} XP${rk.next ? ` · ${num(rk.toNext, 0)} para <b>${esc(rk.next.name)}</b>` : ' · rango máximo'}</small>
      </div>
    </div>
    ${goalCard}
    <div class="row">
      <button class="btn big-btn" data-action="routine" data-id="${esc(suggested.id)}">▶ Desplegar</button>
      <button class="btn ghost big-btn" data-action="weight">${loggedToday ? '✓ Peso de hoy' : '⚖️ Registrar peso'}</button>
    </div>
    <div class="card"><h3>Informe semanal</h3>
      <div class="stats">${stat(wk.count, 'entrenos')}${stat(Math.round(wk.sec / 60), 'minutos')}${stat(num(wk.kcal, 0), 'kcal')}${stat(st, st === 1 ? 'día seguido' : 'días seguidos')}</div>
    </div>
    ${last ? `<div class="card"><h3>Última misión</h3><p><b>${esc(last.routineName)}</b></p><p class="muted">${new Date(last.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · ${fmtMin(last.durationSec)} · ${num(last.kcal, 0)} kcal</p></div>` : ''}
  `;
}

// ---------- ENTRENAR ----------
function routineCard(r, custom) {
  const e = routineEstimate(r);
  return `<button class="card routine" data-action="routine" data-id="${esc(r.id)}">
    <div class="row between"><b>${esc(r.name)}</b>${custom ? '<span class="tag">Mía</span>' : `<span class="tag lvl${r.level}">${LEVELS[r.level] || ''}</span>`}</div>
    ${r.desc ? `<p class="muted small">${esc(r.desc)}</p>` : ''}
    <p class="small">⏱ ${fmtMin(e.total)} · 🔥 ~${num(e.kcal, 0)} kcal · ${r.items.length} ejercicios${(r.rounds || 1) > 1 ? ` × ${r.rounds} vueltas` : ''}</p>
  </button>`;
}
function renderEntrenar() {
  view().innerHTML = `
    <h1>Misiones</h1>
    <div class="row between"><h2>Mis misiones</h2><button class="btn small" data-action="new-routine">+ Crear misión</button></div>
    ${state.customRoutines.length ? state.customRoutines.map((r) => routineCard(r, true)).join('') : '<p class="muted">Aún no tienes misiones propias. Crea una con los ejercicios que quieras.</p>'}
    <h2>Campaña</h2>
    ${window.ROUTINES.map((r) => routineCard(r, false)).join('')}`;
}
const itLabel = (ex, it) => (it.t ? it.t + ' s' : ex.type === 'reps' ? '×' + it.n : it.n + ' s');
const exListHtml = (items) => `<ol class="ex-list">${items.map((it) => { const ex = EX[it.ex]; if (!ex) return ''; return `<li data-action="ex" data-id="${ex.id}"><span class="mini-fig">${exVisual(ex, { still: true })}</span><span>${esc(exName(ex))}${exSub(ex) ? `<small class="muted sub">${esc(exSub(ex))}</small>` : ''}</span><b>${itLabel(ex, it)}${ex.perSide && !it.t ? ' <small>por lado</small>' : ''}</b></li>`; }).join('')}</ol>`;
function showRoutine(id) {
  const r = findRoutine(id); if (!r) return;
  const e = routineEstimate(r);
  const custom = state.customRoutines.some((x) => x.id === id);
  openModal(`
    <h2>${esc(r.name)}</h2>
    ${r.desc ? `<p class="muted">${esc(r.desc)}</p>` : ''}
    <div class="stats">${stat(fmtMin(e.total), 'duración')}${stat('~' + num(e.kcal, 0), 'kcal')}${stat(r.rounds || 1, 'oleadas')}${stat(r.rest + ' s', 'descanso')}</div>
    ${r.warmup ? `<h3 class="phase-h">🔥 Calentamiento</h3>${exListHtml(r.warmup)}` : ''}
    ${r.warmup ? `<h3 class="phase-h">⚔️ Oleadas ×${r.rounds || 1}</h3>` : ''}${exListHtml(r.items)}
    ${r.cooldown ? `<h3 class="phase-h">🧘 Vuelta a la calma</h3>${exListHtml(r.cooldown)}` : ''}
    <button class="btn block big-btn" data-action="start" data-id="${esc(r.id)}">▶ Iniciar misión</button>
    <div class="row">
      ${custom ? `<button class="btn ghost" data-action="edit-routine" data-id="${esc(r.id)}">Editar</button><button class="btn ghost danger" data-action="del-routine" data-id="${esc(r.id)}">Borrar</button>`
        : `<button class="btn ghost" data-action="copy-routine" data-id="${esc(r.id)}">Copiar y personalizar</button>`}
    </div>`);
}

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
const modeTabs = () => `<div class="seg"><button class="${exMode === 'mine' ? 'on' : ''}" data-action="mode" data-m="mine">⚔️ Mi arsenal (${allExercises().length})</button><button class="${exMode === 'lib' ? 'on' : ''}" data-action="mode" data-m="lib">🌐 Biblioteca libre</button></div>`;
function renderEjercicios() {
  if (exMode === 'lib') return renderLibrary();
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

// ---------- BIBLIOTECA LIBRE ----------
let libEquip = 'home', libGroup = '', libQuery = '', libShown = 40, libData = null;
const libById = (id) => EX[id] || libData?.find((x) => x.ex.id === id)?.ex;
const owned = (id) => state.libExercises.some((e) => e.id === id);
function renderLibrary() {
  view().innerHTML = `<h1>Arsenal</h1>${modeTabs()}
    <p class="muted small">Más de 800 ejercicios gratis con fotos, de <a href="${L.SOURCE}" target="_blank" rel="noopener">Free Exercise DB</a> (dominio público). Añade los que quieras y úsalos en tus misiones.</p>
    <input id="lib-q" type="search" placeholder="Buscar (español o inglés)…" value="${esc(libQuery)}">
    <div class="chips">${L.EQUIP_FILTERS.map(([k, label]) => `<button class="chip ${libEquip === k ? 'on' : ''}" data-action="lib-equip" data-k="${k}">${label}</button>`).join('')}</div>
    <div class="chips">${['', ...window.GROUPS].map((g) => `<button class="chip ${g === libGroup ? 'on' : ''}" data-action="lib-group" data-g="${esc(g)}">${g || 'Todos'}</button>`).join('')}</div>
    <div id="lib-list"><p class="muted">Cargando biblioteca…</p></div>`;
  if (libData) return renderLibList();
  L.load().then((d) => { libData = d; renderLibList(); })
    .catch((e) => { const el = $('#lib-list'); if (el) el.innerHTML = `<p class="warn-text">${esc(e.message)}. Necesitas conexión a internet la primera vez.</p><button class="btn ghost" data-action="lib-retry">Reintentar</button>`; });
}
function renderLibList() {
  const box = $('#lib-list'); if (!box || !libData) return;
  const f = (L.EQUIP_FILTERS.find((x) => x[0] === libEquip) || L.EQUIP_FILTERS[0])[2];
  const q = libQuery.toLowerCase();
  const list = libData.filter(({ raw, ex }) => f(raw) && (!libGroup || ex.groups.includes(libGroup)) && (!q || (ex.name + ' ' + ex.originalName + ' ' + ex.muscles.join(' ')).toLowerCase().includes(q)));
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
  openModal(`<div class="fig-stage">${exVisual(e)}</div><h2 class="mb0">${esc(exName(e))}</h2>${exSub(e) ? `<p class="muted mt0">${esc(exSub(e))}</p>` : ''}
    ${lib ? `<p class="small">💪 ${esc(e.muscles.join(', '))} · 🏋️ ${esc(e.equipment)}</p>` : ''}
    <div class="row wrap">${e.groups.map((g) => `<span class="tag">${g}</span>`).join('')}<span class="tag lvl${e.level}">${LEVELS[e.level]}</span></div>
    ${e.stepsLang === 'en' ? '<h3>Instrucciones (en inglés)</h3>' : ''}<ol class="steps">${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${e.tip ? `<p class="tip">💡 ${esc(e.tip)}</p>` : ''}
    <p class="muted small">Por defecto: ${e.type === 'reps' ? e.n + ' repeticiones' : e.n + ' segundos'}${e.perSide ? ' por lado' : ''} · Intensidad ${e.met} MET · ~${num(kcalFor(e.met, 60), 1)} kcal por minuto con tu peso (${num(currentWeight())} kg)</p>
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
    <div class="card"><h3>Calorías quemadas por semana</h3>${weeklyBars()}
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
      <div class="avatars">${Object.entries(A.CLASSES).map(([id, c]) => `<button class="avatar-opt ${avatarId() === id ? 'on' : ''}" data-action="avatar" data-id="${id}">${A.figure('squat', { avatar: id, dur: 2.2 })}<b>${c.name}</b><small>${esc(c.desc)}</small></button>`).join('')}</div>
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
      ${tdeeHtml()}
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
  const p = state.profile, kg = currentWeight(), h = toNum(p.heightCm), y = toNum(p.birthYear);
  if (!h || !y || !p.sex || !state.weights.length) return '';
  const age = new Date().getFullYear() - y;
  const bmr = 10 * kg + 6.25 * h - 5 * age + (p.sex === 'h' ? 5 : -161);
  return `<p class="tip">Tu metabolismo basal estimado es <b>${num(bmr, 0)} kcal/día</b>. Con poca actividad gastas unas <b>${num(bmr * 1.375, 0)} kcal/día</b> en total. Para bajar ~0,5 kg/semana, come unas ${num(bmr * 1.375 - 550, 0)} kcal/día.</p>`;
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
    <p class="center muted small">${after.icon} ${esc(after.name)}${after.next ? ` · faltan ${num(after.toNext, 0)} XP para ${esc(after.next.name)}` : ''}</p>
    <p class="center muted small">Llevas ${weekStats().count} entreno${weekStats().count === 1 ? '' : 's'} esta semana · ${num(weekStats().kcal, 0)} kcal</p>
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
    updatedAt: Date.now() });
}

// ============ Eventos ============
document.addEventListener('click', (ev) => {
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
    case 'routine': return showRoutine(id);
    case 'start': return startWorkout(id);
    case 'ex': return showExercise(id);
    case 'group': exGroup = el.dataset.g; return renderEjercicios();
    case 'mode': exMode = el.dataset.m; closeModal(); tab = 'ejercicios'; render(); window.scrollTo(0, 0); return;
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
  }
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
  if (f && ev.target.name) { state.profile[ev.target.name] = ev.target.value.trim(); save(); if (['sex', 'heightCm', 'birthYear'].includes(ev.target.name)) render(); return; }
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
