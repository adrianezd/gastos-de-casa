'use strict';
// Gastos de casa: hoja de gastos por mes y por persona.
// Los fijos se repiten solos desde el mes en que se crean; los variables son de un mes.
// Todo en localStorage (gastos-de-casa-v1).

const CLAVE = 'gastos-de-casa-v1', CLAVE_UI = 'gastos-de-casa-ui';
const NCOLORES = 8;
const CATS = ['Vivienda', 'Luz', 'Agua', 'Gas', 'Internet y móvil', 'Supermercado', 'Comer fuera', 'Transporte', 'Gasolina', 'Seguros', 'Salud', 'Ropa', 'Ocio', 'Suscripciones', 'Regalos', 'Mascotas', 'Educación', 'Niños', 'Otros'];
const CADA = [[1, 'Mensual'], [2, 'Bimestral'], [3, 'Trimestral'], [6, 'Semestral'], [12, 'Anual']];
const SUG = {
  f: [['Alquiler', 'Vivienda'], ['Hipoteca', 'Vivienda'], ['Comunidad', 'Vivienda'], ['Luz', 'Luz'], ['Agua', 'Agua'], ['Internet', 'Internet y móvil'], ['Móvil', 'Internet y móvil'], ['Seguro del coche', 'Seguros'], ['Gimnasio', 'Salud'], ['Netflix', 'Suscripciones']],
  v: [['Supermercado', 'Supermercado'], ['Gasolina', 'Gasolina'], ['Cena fuera', 'Comer fuera'], ['Farmacia', 'Salud'], ['Ropa', 'Ropa'], ['Cine', 'Ocio'], ['Regalo', 'Regalos']]
};
const COLS = { f: ['pagado', 'concepto', 'cat', 'persona', 'cada', 'importe'], v: ['dia', 'concepto', 'cat', 'persona', 'importe'] };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ICO = {
  izq: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>',
  der: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>'
};

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const r2 = n => Math.round(n * 100) / 100;
const eur = n => r2(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const num = n => n ? n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' }) : '';
const corto = n => Math.round(n).toLocaleString('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });

// Meses como 'AAAA-MM'
const mk = (y, m) => y + '-' + String(m).padStart(2, '0');
const partes = k => k.split('-').map(Number);
const hoyK = () => { const d = new Date(); return mk(d.getFullYear(), d.getMonth() + 1); };
const sumaMes = (k, n) => { const [y, m] = partes(k); const t = y * 12 + m - 1 + n; return mk(Math.floor(t / 12), t % 12 + 1); };
const difMes = (a, b) => { const [y1, m1] = partes(a), [y2, m2] = partes(b); return (y2 - y1) * 12 + m2 - m1; };
const nombreMes = k => { const [y, m] = partes(k); return MESES[m - 1] + ' ' + y; };
const diasMes = k => { const [y, m] = partes(k); return new Date(y, m, 0).getDate(); };

// Acepta 12,50 · 1.200 · 12.5 · €12 y sumas como 12,5+8 o =3*4
function leerImporte(s) {
  s = String(s == null ? '' : s).replace(/€|\s/g, '');
  if (s[0] === '=') s = s.slice(1);
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(/,/g, '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^[0-9+\-*/().]+$/.test(s)) return NaN;
  try { const v = Function('"use strict";return (' + s + ')')(); return Number.isFinite(v) ? r2(v) : NaN; } catch (e) { return NaN; }
}

// ---------- Datos ----------
function nuevo() { return { v: 1, personas: [{ id: uid(), nombre: 'Yo', c: 0 }], fijos: [], variables: [] }; }
function valido(d) { return d && Array.isArray(d.personas) && d.personas.length > 0 && Array.isArray(d.fijos) && Array.isArray(d.variables); }
function cargar() { try { const d = JSON.parse(localStorage.getItem(CLAVE)); if (valido(d)) return d; } catch (e) { /* datos dañados: empezamos de cero */ } return nuevo(); }
let D = cargar();
let sinGuardar = false, tGuardar = 0;
function guardar() {
  clearTimeout(tGuardar);
  try { localStorage.setItem(CLAVE, JSON.stringify(D)); }
  catch (e) { if (!sinGuardar) aviso('No se puede guardar en este navegador. Prueba fuera del modo incógnito.'); sinGuardar = true; }
}
function guardarLuego() { clearTimeout(tGuardar); tGuardar = setTimeout(guardar, 400); }
window.addEventListener('pagehide', guardar);
document.addEventListener('visibilitychange', () => { if (document.hidden) guardar(); });
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* sin permiso */ }

let UI = {};
try { UI = JSON.parse(localStorage.getItem(CLAVE_UI)) || {}; } catch (e) { UI = {}; }
const S = { vista: UI.vista || 'mes', modo: UI.modo || 'persona', mes: hoyK(), anio: partes(hoyK())[0], filtro: '', ultima: '', armado: '' };
function guardarUI() { try { localStorage.setItem(CLAVE_UI, JSON.stringify({ vista: S.vista, modo: S.modo })); } catch (e) { /* da igual */ } }

const persona = id => D.personas.find(p => p.id === id);
const color = p => `var(--p${(p ? p.c : 0) % NCOLORES})`;

function fijoEnMes(f, k) {
  if (k < f.desde || (f.hasta && k > f.hasta)) return false;
  return difMes(f.desde, k) % (f.cada || 1) === 0;
}
function importeFijo(f, k) { let v = 0; for (const i of f.importes) if (i.desde <= k) v = i.importe; return v; }
function filasMes(k) {
  const fijos = D.fijos.filter(f => fijoEnMes(f, k)).map(f => ({ tipo: 'f', id: f.id, concepto: f.concepto, cat: f.cat, persona: f.persona, importe: importeFijo(f, k), ref: f }));
  const vars = D.variables.filter(v => v.mes === k).map(v => ({ tipo: 'v', id: v.id, concepto: v.concepto, cat: v.cat, persona: v.persona, importe: v.importe, ref: v }));
  return { fijos, vars };
}
// Lo que le toca a una persona de un gasto. Compartido se reparte a partes iguales.
function parte(fila, pid) {
  if (persona(fila.persona)) return fila.persona === pid ? fila.importe : 0;
  return fila.importe / D.personas.length;
}
const valor = fila => S.filtro ? parte(fila, S.filtro) : fila.importe;
const visible = fila => !S.filtro || fila.persona === S.filtro || !persona(fila.persona);
const suma = (l, fn) => l.reduce((s, x) => s + fn(x), 0);

// ---------- Pintado ----------
const vista = $('#vista');
function render() {
  if (S.filtro && !persona(S.filtro)) S.filtro = '';
  document.querySelectorAll('.tabs button').forEach(b => b.toggleAttribute('aria-current', b.dataset.val === S.vista));
  document.querySelectorAll('.tabs button[aria-current]').forEach(b => b.setAttribute('aria-current', 'page'));
  const cats = new Set(CATS);
  D.fijos.concat(D.variables).forEach(x => x.cat && cats.add(x.cat));
  $('#cats').innerHTML = [...cats].map(c => `<option value="${esc(c)}">`).join('');
  vista.innerHTML = S.vista === 'anio' ? vistaAnio() : S.vista === 'ajustes' ? vistaAjustes() : vistaMes();
  if (S.vista === 'mes') pintarTotales();
}

function chipsPersonas() {
  if (D.personas.length < 2) return '';
  return `<div class="chips" role="group" aria-label="Ver gastos de">
    <button class="chip${S.filtro ? '' : ' on'}" data-acc="filtro" data-val="">Todos</button>
    ${D.personas.map(p => `<button class="chip${S.filtro === p.id ? ' on' : ''}" data-acc="filtro" data-val="${p.id}"><span class="punto" style="background:${color(p)}"></span>${esc(p.nombre)}</button>`).join('')}
  </div>`;
}

function selPersona(val) {
  return `<select data-campo="persona" aria-label="Persona">${D.personas.map(p => `<option value="${p.id}"${p.id === val ? ' selected' : ''}>${esc(p.nombre)}</option>`).join('')}<option value="*"${persona(val) ? '' : ' selected'}>Compartido</option></select>`;
}
function selCada(val) {
  return `<select data-campo="cada" aria-label="Cada cuánto">${CADA.map(([n, t]) => `<option value="${n}"${n === val ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
}
const inCat = v => `<input data-campo="cat" list="cats" value="${esc(v)}" placeholder="Categoría" aria-label="Categoría" autocomplete="off">`;
const inConcepto = (v, ph) => `<input data-campo="concepto" value="${esc(v)}" placeholder="${ph}" aria-label="Concepto" autocomplete="off">`;
const inImporte = v => `<input data-campo="importe" value="${num(v)}" placeholder="0,00" inputmode="decimal" aria-label="Importe en euros" autocomplete="off">`;
const btnQuitar = `<button class="quitar" data-acc="borrar" aria-label="Quitar fila">${ICO.x}</button>`;
function personaPorDefecto() {
  if (S.filtro) return S.filtro;
  if (S.ultima && (S.ultima === '*' || persona(S.ultima))) return S.ultima;
  return D.personas.length > 1 ? '*' : D.personas[0].id;
}

function vistaMes() {
  const k = S.mes, { fijos, vars } = filasMes(k);
  const fv = fijos.filter(visible), vv = vars.filter(visible).sort((a, b) => (a.ref.dia || 99) - (b.ref.dia || 99));
  const pd = personaPorDefecto(), dias = diasMes(k);
  const esHoy = k === hoyK();
  const sinP = D.personas.length < 2 ? ' sin-persona' : '';

  const filaF = (x, i) => `<tr data-tipo="f" data-id="${x.id}"${x.ref.pagados && x.ref.pagados[k] ? ' class="pagado"' : ''}>
      <td class="n">${i + 1}</td>
      <td class="c-ok"><input type="checkbox" data-campo="pagado"${x.ref.pagados && x.ref.pagados[k] ? ' checked' : ''} aria-label="Pagado"></td>
      <td class="c-concepto">${inConcepto(x.concepto, 'Concepto')}</td>
      <td class="c-cat">${inCat(x.cat)}</td>
      <td class="c-persona">${selPersona(x.persona)}</td>
      <td class="c-cada">${selCada(x.ref.cada || 1)}</td>
      <td class="c-imp imp">${inImporte(x.importe)}</td>
      <td class="c-x">${btnQuitar}</td>
    </tr>`;
  const filaV = (x, i) => `<tr data-tipo="v" data-id="${x.id}">
      <td class="n">${i + 1}</td>
      <td class="c-dia"><input type="number" data-campo="dia" min="1" max="${dias}" value="${x.ref.dia || ''}" inputmode="numeric" aria-label="Día"></td>
      <td class="c-concepto">${inConcepto(x.concepto, 'Concepto')}</td>
      <td class="c-cat">${inCat(x.cat)}</td>
      <td class="c-persona">${selPersona(x.persona)}</td>
      <td class="c-imp imp">${inImporte(x.importe)}</td>
      <td class="c-x">${btnQuitar}</td>
    </tr>`;
  const sugs = t => `<div class="sugs"><span>Ideas:</span>${SUG[t].map((s, i) => `<button class="sug" data-acc="sug" data-tipo="${t}" data-val="${i}">${s[0]}</button>`).join('')}</div>`;

  return `
  <div class="mesnav">
    <button class="flecha" data-acc="mes" data-val="-1" aria-label="Mes anterior">${ICO.izq}</button>
    <button class="mes-tit${esHoy ? '' : ' lejos'}" data-acc="hoy"><h2>${cap(nombreMes(k))}</h2><small>${esHoy ? 'Este mes' : 'Volver a este mes'}</small></button>
    <button class="flecha" data-acc="mes" data-val="1" aria-label="Mes siguiente">${ICO.der}</button>
  </div>
  ${chipsPersonas()}
  <div id="kpis" class="kpis"></div>

  <section class="bloque${sinP}">
    <div class="bloque-head"><h3>Fijos</h3><span id="pagados" class="nota"></span></div>
    <div class="hoja"><table class="tabla">
      <thead><tr><th class="n"></th><th class="c-ok" title="Pagado">✓</th><th>Concepto</th><th>Categoría</th><th class="c-persona">Persona</th><th>Cada</th><th class="imp">Importe €</th><th></th></tr></thead>
      <tbody>${fv.map(filaF).join('')}
        <tr class="nueva" data-tipo="nf">
          <td class="n">+</td><td class="c-ok"></td>
          <td class="c-concepto">${inConcepto('', fv.length ? 'Nuevo fijo' : 'Alquiler, luz, internet…')}</td>
          <td class="c-cat">${inCat('')}</td>
          <td class="c-persona">${selPersona(pd)}</td>
          <td class="c-cada">${selCada(1)}</td>
          <td class="c-imp imp">${inImporte(0)}</td><td></td>
        </tr>
      </tbody>
      <tfoot><tr><td class="n"></td><td colspan="${sinP ? 4 : 5}">Total fijos</td><td class="imp" id="tot-f"></td><td></td></tr></tfoot>
    </table></div>
    ${fv.length ? '' : sugs('f')}
    <p class="nota">Se repiten solos los meses siguientes. Si cambias un importe, cuenta desde este mes.</p>
  </section>

  <section class="bloque${sinP}">
    <div class="bloque-head"><h3>Variables</h3><span id="nvars" class="nota"></span></div>
    <div class="hoja"><table class="tabla">
      <thead><tr><th class="n"></th><th class="c-dia">Día</th><th>Concepto</th><th>Categoría</th><th class="c-persona">Persona</th><th class="imp">Importe €</th><th></th></tr></thead>
      <tbody>${vv.map(filaV).join('')}
        <tr class="nueva" data-tipo="nv">
          <td class="n">+</td>
          <td class="c-dia"><input type="number" data-campo="dia" min="1" max="${dias}" value="${esHoy ? new Date().getDate() : ''}" inputmode="numeric" aria-label="Día"></td>
          <td class="c-concepto">${inConcepto('', vv.length ? 'Nuevo gasto' : 'Súper, gasolina, cena…')}</td>
          <td class="c-cat">${inCat('')}</td>
          <td class="c-persona">${selPersona(pd)}</td>
          <td class="c-imp imp">${inImporte(0)}</td><td></td>
        </tr>
      </tbody>
      <tfoot><tr><td class="n"></td><td colspan="${sinP ? 3 : 4}">Total variables</td><td class="imp" id="tot-v"></td><td></td></tr></tfoot>
    </table></div>
    ${vv.length ? '' : sugs('v')}
    <p class="nota">Escribe en la última fila para añadir. Enter baja de fila y el importe acepta sumas como 12,5+8.</p>
  </section>

  ${D.personas.length > 1 && !S.filtro ? `<section class="tarjeta"><h3>Lo que lleva cada uno</h3><p class="nota" style="margin:0 0 12px">Lo compartido se reparte a partes iguales.</p><div id="reparto" class="reparto"></div></section>` : ''}
  ${D.personas.length < 2 ? `<p class="nota" style="text-align:center">¿Lo compartís? Añade a más gente en <button class="chip" data-acc="vista" data-val="ajustes" style="vertical-align:middle">Personas</button></p>` : ''}`;
}

// Totales del mes sin repintar la hoja, para no perder la celda en la que se escribe
function pintarTotales() {
  if (S.vista !== 'mes' || !$('#kpis')) return;
  const k = S.mes, { fijos, vars } = filasMes(k);
  const prev = filasMes(sumaMes(k, -1));
  const tf = suma(fijos, valor), tv = suma(vars, valor), t = tf + tv;
  const tp = suma(prev.fijos, valor) + suma(prev.vars, valor);
  const quien = S.filtro ? persona(S.filtro).nombre : '';
  let comp = '';
  if (tp > 0 && t > 0) {
    const d = t - tp, pct = Math.round(d / tp * 100);
    comp = Math.abs(d) < 0.01 ? `Igual que en ${MESES[partes(sumaMes(k, -1))[1] - 1]}`
      : `${d > 0 ? '▲' : '▼'} ${eur(Math.abs(d))} ${d > 0 ? 'más' : 'menos'} que en ${MESES[partes(sumaMes(k, -1))[1] - 1]}${Math.abs(pct) >= 1 ? ` · ${Math.abs(pct)} %` : ''}`;
  }
  $('#kpis').innerHTML = `
    <div class="kpi grande"><span>${quien ? 'Le toca a ' + esc(quien) : 'Total del mes'}</span><b>${eur(t)}</b>${comp ? `<small>${comp}</small>` : ''}</div>
    <div class="kpi"><span>Fijos</span><b>${eur(tf)}</b>${t ? `<small>${Math.round(tf / t * 100)} % del total</small>` : ''}</div>
    <div class="kpi"><span>Variables</span><b>${eur(tv)}</b>${t ? `<small>${vars.filter(visible).length} gastos</small>` : ''}</div>`;
  $('#tot-f').textContent = eur(tf);
  $('#tot-v').textContent = eur(tv);
  const fv = fijos.filter(visible), pag = fv.filter(x => x.ref.pagados && x.ref.pagados[k]).length;
  $('#pagados').textContent = fv.length ? `${pag} de ${fv.length} pagados` : '';
  const nv = vars.filter(visible).length;
  $('#nvars').textContent = nv ? `${nv} ${nv === 1 ? 'gasto' : 'gastos'}` : '';
  const rep = $('#reparto');
  if (rep) {
    const filas = fijos.concat(vars), max = Math.max(1, ...D.personas.map(p => suma(filas, x => parte(x, p.id))));
    rep.innerHTML = D.personas.map(p => {
      const pf = suma(fijos, x => parte(x, p.id)), pv = suma(vars, x => parte(x, p.id)), pt = pf + pv;
      return `<div class="rp" title="${esc(p.nombre)}: fijos ${eur(pf)}, variables ${eur(pv)}">
        <span class="rp-nom"><span class="punto" style="background:${color(p)}"></span><b>${esc(p.nombre)}</b></span>
        <span class="rp-barra"><i style="width:${pt / max * 100}%;background:${color(p)}"></i></span>
        <span class="rp-val">${eur(pt)}<small>${eur(pf)} fijos · ${eur(pv)} var.</small></span>
      </div>`;
    }).join('');
  }
}

function datosAnio(y) {
  const ks = MES_C.map((_, i) => mk(y, i + 1)), meses = ks.map(filasMes);
  const fila = (tit, fn, extra) => ({ tit, vals: meses.map(m => fn(m)), ...extra });
  let filas = [];
  if (S.modo === 'persona') {
    filas = D.personas.map(p => fila(p.nombre, m => suma(m.fijos.concat(m.vars), x => parte(x, p.id)), { p }));
  } else if (S.modo === 'tipo') {
    filas = [fila('Fijos', m => suma(m.fijos, valor)), fila('Variables', m => suma(m.vars, valor))];
  } else {
    const cats = {};
    meses.forEach((m, i) => m.fijos.concat(m.vars).forEach(x => {
      const c = (x.cat || '').trim() || 'Sin categoría', v = valor(x);
      if (!v) return;
      (cats[c] = cats[c] || new Array(12).fill(0))[i] += v;
    }));
    filas = Object.entries(cats).map(([tit, vals]) => ({ tit, vals })).sort((a, b) => suma(b.vals, v => v) - suma(a.vals, v => v));
  }
  const total = { tit: 'Total', vals: meses.map(m => S.modo === 'persona' ? suma(m.fijos.concat(m.vars), x => x.importe) : suma(m.fijos.concat(m.vars), valor)) };
  return { ks, filas, total };
}

function vistaAnio() {
  const y = S.anio, hoy = hoyK(), { ks, filas, total } = datosAnio(y);
  const reales = ks.filter(k => k <= hoy).length;
  const celda = (v, k) => `<td class="celda${k > hoy ? ' prev' : ''}${k === hoy ? ' actual' : ''}${v ? '' : ' cero'}" data-acc="ir-mes" data-val="${k}">${v ? corto(v) : '—'}</td>`;
  // La media empieza en el primer mes con gastos, para no contar meses antes de usar la app
  const ini = total.vals.findIndex((v, i) => i < reales && v > 0), nMedia = ini < 0 ? 0 : reales - ini;
  const media = vals => nMedia ? suma(vals.slice(ini, reales), v => v) / nMedia : 0;
  const tr = (f, cls) => `<tr${cls ? ` class="${cls}"` : ''}><td class="fila-tit" title="${esc(f.tit)}">${f.p ? `<span class="punto" style="background:${color(f.p)}"></span>` : ''}${esc(f.tit)}</td>${f.vals.map((v, i) => celda(v, ks[i])).join('')}<td class="tot">${corto(suma(f.vals, v => v))}</td><td>${nMedia ? corto(media(f.vals)) : '—'}</td></tr>`;
  const modos = [['persona', 'Por persona'], ['tipo', 'Fijos y variables'], ['cat', 'Por categoría']].filter(m => m[0] !== 'persona' || D.personas.length > 1);
  if (!modos.some(m => m[0] === S.modo)) S.modo = modos[0][0];
  const tAnio = suma(total.vals, v => v), tReal = suma(total.vals.slice(0, reales), v => v);
  const quien = S.filtro && S.modo !== 'persona' ? persona(S.filtro).nombre : '';
  return `
  <div class="mesnav">
    <button class="flecha" data-acc="anio" data-val="-1" aria-label="Año anterior">${ICO.izq}</button>
    <div class="mes-tit"><h2>${y}</h2><small>${quien ? 'Lo que le toca a ' + esc(quien) : 'Pulsa un mes para abrirlo'}</small></div>
    <button class="flecha" data-acc="anio" data-val="1" aria-label="Año siguiente">${ICO.der}</button>
  </div>
  <div class="chips" role="group" aria-label="Agrupar">${modos.map(([m, t]) => `<button class="chip${S.modo === m ? ' on' : ''}" data-acc="modo" data-val="${m}">${t}</button>`).join('')}</div>
  ${S.modo !== 'persona' ? chipsPersonas() : ''}
  <div class="kpis">
    <div class="kpi grande"><span>${reales === 12 ? 'Total del año' : reales ? 'Llevas gastado' : 'Previsto'}</span><b>${eur(reales ? tReal : tAnio)}</b>${reales && reales < 12 ? `<small>Con los fijos que faltan: ${eur(tAnio)}</small>` : ''}</div>
    <div class="kpi"><span>Media al mes</span><b>${nMedia ? eur(tReal / nMedia) : '—'}</b></div>
    <div class="kpi"><span>Mes más caro</span><b>${(() => { let im = -1, mx = 0; total.vals.slice(0, reales).forEach((v, i) => { if (v > mx) { mx = v; im = i; } }); return im < 0 ? '—' : cap(MESES[im]); })()}</b></div>
  </div>
  <div class="hoja"><table class="tabla anio">
    <thead><tr><th class="fila-tit"></th>${MES_C.map((m, i) => `<th class="mesc" data-acc="ir-mes" data-val="${ks[i]}">${m}</th>`).join('')}<th>Total</th><th>Media</th></tr></thead>
    <tbody>${filas.length ? filas.map(f => tr(f)).join('') : `<tr><td class="fila-tit">Sin gastos</td>${'<td class="cero">—</td>'.repeat(14)}</tr>`}</tbody>
    <tfoot>${tr(total, 'total')}</tfoot>
  </table></div>
  <p class="nota">Euros redondeados. ${reales < 12 ? 'Los meses en cursiva aún no han llegado y solo cuentan los fijos previstos. ' : ''}La media cuenta los meses ya pasados desde el primero con gastos.</p>
  <div class="fila" style="margin-top:14px"><button class="btn sec" data-acc="excel">Exportar a Excel</button></div>`;
}

function vistaAjustes() {
  const uso = id => D.fijos.filter(f => f.persona === id).length + D.variables.filter(v => v.persona === id).length;
  return `
  <section class="tarjeta" style="margin-top:10px">
    <h3>Personas</h3>
    <p class="nota" style="margin:0">Cada gasto es de una persona o compartido. Toca el color para cambiarlo.</p>
    <div class="personas">${D.personas.map(p => `<div class="persona">
      <button class="color" data-acc="p-color" data-val="${p.id}" aria-label="Cambiar color de ${esc(p.nombre)}"><span class="punto" style="background:${color(p)}"></span></button>
      <input data-acc="p-nombre" data-val="${p.id}" value="${esc(p.nombre)}" aria-label="Nombre" maxlength="30">
      ${D.personas.length > 1 ? `<button class="quitar${S.armado === 'p-' + p.id ? ' armado' : ''}" data-acc="p-borrar" data-val="${p.id}" aria-label="Quitar a ${esc(p.nombre)}" title="${uso(p.id) ? 'Sus gastos pasarán a compartidos' : 'Quitar'}">${ICO.x}</button>` : ''}
    </div>`).join('')}</div>
    <form class="alta" data-acc="p-alta"><input id="p-nueva" placeholder="Nombre" maxlength="30" aria-label="Nombre de la nueva persona" autocomplete="off"><button class="btn">Añadir</button></form>
  </section>
  <section class="tarjeta">
    <h3>Tus datos</h3>
    <p class="nota" style="margin:0 0 12px">Se guardan solo en este navegador. Guarda una copia para pasarlos a otro móvil o por si borras el historial.</p>
    <div class="fila"><button class="btn sec" data-acc="copia">Guardar copia</button><button class="btn sec" data-acc="cargar">Cargar copia</button></div>
    <div class="fila" style="margin-top:10px"><button class="btn sec" data-acc="excel-todo">Exportar todo a Excel</button></div>
  </section>
  <section class="tarjeta">
    <h3>Empezar de cero</h3>
    <p class="nota" style="margin:0 0 12px">Borra personas, fijos y gastos de todos los meses.</p>
    <button class="btn peligro${S.armado === 'todo' ? ' armado' : ''}" data-acc="borrar-todo">${S.armado === 'todo' ? 'Pulsa otra vez para borrar' : 'Borrar todo'}</button>
  </section>`;
}

// ---------- Edición de celdas ----------
let deshacer = null;
function foto() { deshacer = JSON.stringify(D); }
// Si se sigue editando, deshacer ya no vuelve atrás para no perder lo nuevo
function soltarDeshacer() { if (!deshacer) return; deshacer = null; const b = $('#aviso button'); if (b) ocultarAviso(); }
function fila(tr) {
  if (tr.dataset.tipo === 'f') return D.fijos.find(f => f.id === tr.dataset.id);
  if (tr.dataset.tipo === 'v') return D.variables.find(v => v.id === tr.dataset.id);
  return null;
}
function ponerImporteFijo(f, k, v) {
  const e = f.importes.find(i => i.desde === k);
  if (e) e.importe = v; else { f.importes.push({ desde: k, importe: v }); f.importes.sort((a, b) => a.desde < b.desde ? -1 : 1); }
}
// Quita cambios de importe que repiten el anterior
function compactar(f) { f.importes = f.importes.filter((i, n, l) => n === 0 || i.importe !== l[n - 1].importe); }

function editar(tr, el, final) {
  const x = fila(tr); if (!x) return;
  const c = el.dataset.campo, k = S.mes;
  soltarDeshacer();
  if (c === 'importe') {
    const v = leerImporte(el.value);
    el.classList.toggle('mal', Number.isNaN(v));
    if (Number.isNaN(v)) { if (final) aviso('Ese importe no se entiende. Prueba con 12,50'); return; }
    if (tr.dataset.tipo === 'f') { ponerImporteFijo(x, k, v); if (final) compactar(x); } else x.importe = v;
    if (final) el.value = num(v);
  } else if (c === 'pagado') {
    x.pagados = x.pagados || {};
    if (el.checked) x.pagados[k] = true; else delete x.pagados[k];
    tr.classList.toggle('pagado', el.checked);
  } else if (c === 'dia') {
    const d = Math.round(+el.value);
    x.dia = d >= 1 && d <= diasMes(k) ? d : null;
    if (final) el.value = x.dia || '';
  } else if (c === 'cada') {
    x.cada = +el.value || 1;
  } else if (c === 'persona') {
    x.persona = el.value; S.ultima = el.value;
  } else {
    x[c] = el.value.trim();
  }
  pintarTotales();
  guardarLuego();
}

// La fila de abajo crea la fila de verdad en cuanto se escribe un concepto o un importe
function crear(tr, campo) {
  const tipo = tr.dataset.tipo === 'nf' ? 'f' : 'v', val = c => { const e = tr.querySelector(`[data-campo="${c}"]`); return e ? e.value : ''; };
  const importe = leerImporte(val('importe'));
  if (Number.isNaN(importe)) { tr.querySelector('[data-campo="importe"]').classList.add('mal'); aviso('Ese importe no se entiende. Prueba con 12,50'); return; }
  if (!val('concepto').trim() && !importe) return;
  soltarDeshacer();
  const base = { id: uid(), concepto: val('concepto').trim(), cat: val('cat').trim(), persona: val('persona') || personaPorDefecto() };
  S.ultima = base.persona;
  if (tipo === 'f') D.fijos.push({ ...base, cada: +val('cada') || 1, desde: S.mes, hasta: null, importes: [{ desde: S.mes, importe }], pagados: {} });
  else { const d = Math.round(+val('dia')); D.variables.push({ ...base, mes: S.mes, dia: d >= 1 && d <= diasMes(S.mes) ? d : null, importe }); }
  guardar(); render();
  // Seguimos en la fila nueva, en la celda siguiente a la que se ha escrito
  const cols = COLS[tipo].filter(c => c !== 'pagado' && (c !== 'persona' || D.personas.length > 1));
  const sig = cols[cols.indexOf(campo) + 1];
  const destino = sig ? `tr[data-id="${base.id}"] [data-campo="${sig}"]` : `tr[data-tipo="n${tipo}"] [data-campo="concepto"]`;
  enfocar(destino);
}
function enfocar(sel) {
  const e = vista.querySelector(sel);
  if (e) { e.focus({ preventScroll: false }); if (e.select && e.tagName === 'INPUT' && e.type !== 'checkbox') e.select(); }
}

vista.addEventListener('input', e => {
  const el = e.target, tr = el.closest('tr[data-tipo]');
  if (tr && (tr.dataset.tipo === 'f' || tr.dataset.tipo === 'v') && el.dataset.campo === 'importe') editar(tr, el, false);
  if (tr && tr.dataset.tipo.startsWith('n') && el.dataset.campo === 'importe') el.classList.remove('mal');
});
vista.addEventListener('change', e => {
  const el = e.target, tr = el.closest('tr[data-tipo]');
  if (tr) {
    if (tr.dataset.tipo === 'nf' || tr.dataset.tipo === 'nv') { if (['concepto', 'importe'].includes(el.dataset.campo)) crear(tr, el.dataset.campo); return; }
    editar(tr, el, true);
    return;
  }
  if (el.dataset.acc === 'p-nombre') {
    const p = persona(el.dataset.val), n = el.value.trim();
    if (p && n) { p.nombre = n; guardar(); } else if (p) el.value = p.nombre;
  }
});
vista.addEventListener('keydown', e => {
  const el = e.target;
  if (!el.closest || !el.closest('.tabla')) return;
  if (e.key === 'Escape') { el.blur(); return; }
  if (e.key !== 'Enter' || el.tagName !== 'INPUT') return;
  e.preventDefault();
  const tr = el.closest('tr[data-tipo]'), c = el.dataset.campo;
  if (tr.dataset.tipo.startsWith('n')) { el.blur(); return; }
  const sig = (e.shiftKey ? tr.previousElementSibling : tr.nextElementSibling);
  const destino = sig && sig.querySelector(`[data-campo="${c}"]`);
  if (destino) { destino.focus(); if (destino.select) destino.select(); } else el.blur();
});
vista.addEventListener('focusin', e => {
  const el = e.target;
  if (el.dataset && el.dataset.campo === 'importe' && el.closest('.tabla')) setTimeout(() => { if (document.activeElement === el) el.select(); }, 0);
});

// ---------- Acciones ----------
document.addEventListener('submit', e => {
  if (e.target.dataset.acc !== 'p-alta') return;
  e.preventDefault();
  const n = $('#p-nueva').value.trim();
  if (!n) { $('#p-nueva').focus(); return; }
  const usados = D.personas.map(p => p.c);
  let c = 0; while (usados.includes(c) && c < NCOLORES - 1) c++;
  D.personas.push({ id: uid(), nombre: n, c });
  guardar(); render(); enfocar('#p-nueva');
  aviso(n + ' ya puede apuntar gastos');
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-acc]');
  if (!b || b.tagName === 'INPUT' || b.tagName === 'FORM') return;
  const acc = b.dataset.acc, val = b.dataset.val;
  if (acc !== 'borrar-todo' && acc !== 'p-borrar') S.armado = '';
  switch (acc) {
    case 'vista': S.vista = val; guardarUI(); render(); scrollTo(0, 0); break;
    case 'mes': S.mes = sumaMes(S.mes, +val); render(); break;
    case 'hoy': S.mes = hoyK(); render(); break;
    case 'anio': S.anio += +val; render(); break;
    case 'modo': S.modo = val; guardarUI(); render(); break;
    case 'filtro': S.filtro = val; render(); break;
    case 'ir-mes': S.mes = val; S.vista = 'mes'; guardarUI(); render(); scrollTo(0, 0); break;
    case 'sug': {
      const [concepto, cat] = SUG[b.dataset.tipo][+val];
      const tr = vista.querySelector(`tr[data-tipo="n${b.dataset.tipo}"]`);
      tr.querySelector('[data-campo="concepto"]').value = concepto;
      tr.querySelector('[data-campo="cat"]').value = cat;
      crear(tr, 'cat');
      const nueva = b.dataset.tipo === 'f' ? D.fijos[D.fijos.length - 1] : D.variables[D.variables.length - 1];
      enfocar(`tr[data-id="${nueva.id}"] [data-campo="importe"]`);
      break;
    }
    case 'borrar': borrarFila(b.closest('tr')); break;
    case 'deshacer':
      if (deshacer) { D = JSON.parse(deshacer); deshacer = null; guardar(); render(); ocultarAviso(); }
      break;
    case 'p-color': { const p = persona(val); p.c = (p.c + 1) % NCOLORES; guardar(); render(); break; }
    case 'p-borrar': {
      if (S.armado !== 'p-' + val) { S.armado = 'p-' + val; render(); aviso('Pulsa otra vez para quitarla'); setTimeout(() => { if (S.armado === 'p-' + val) { S.armado = ''; render(); } }, 3500); break; }
      S.armado = '';
      const p = persona(val); foto();
      D.personas = D.personas.filter(q => q.id !== val);
      D.fijos.concat(D.variables).forEach(x => { if (x.persona === val) x.persona = '*'; });
      if (S.filtro === val) S.filtro = '';
      guardar(); render(); aviso(`${p.nombre} quitada. Sus gastos pasan a compartidos`, true);
      break;
    }
    case 'copia': {
      const f = new Date().toISOString().slice(0, 10);
      descargar(`gastos-de-casa-${f}.json`, JSON.stringify(D, null, 1), 'application/json');
      aviso('Copia guardada en descargas');
      break;
    }
    case 'cargar': $('#f-copia').click(); break;
    case 'excel': exportar(S.anio); break;
    case 'excel-todo': exportar(null); break;
    case 'borrar-todo':
      if (S.armado !== 'todo') { S.armado = 'todo'; render(); setTimeout(() => { if (S.armado === 'todo') { S.armado = ''; render(); } }, 3500); break; }
      S.armado = ''; foto(); D = nuevo(); S.filtro = ''; guardar(); render(); aviso('Todo borrado', true);
      break;
  }
});

function borrarFila(tr) {
  const x = fila(tr); if (!x) return;
  foto();
  if (tr.dataset.tipo === 'v') {
    D.variables = D.variables.filter(v => v !== x);
    aviso('Gasto borrado', true);
  } else {
    // Antes de este mes se queda; si no había aparecido antes, se borra entero
    const ant = sumaMes(S.mes, -1);
    if (ant < x.desde) { D.fijos = D.fijos.filter(f => f !== x); aviso('Fijo borrado', true); }
    else { x.hasta = ant; aviso('Fijo quitado desde este mes', true); }
  }
  guardar(); render();
}

$('#f-copia').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  f.text().then(t => {
    const d = JSON.parse(t);
    if (!valido(d)) throw new Error('no vale');
    foto(); D = d; S.filtro = ''; guardar(); render();
    aviso('Copia cargada', true);
  }).catch(() => aviso('Ese archivo no es una copia de Gastos de casa'));
});

// ---------- Exportar ----------
function descargar(nombre, texto, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
  a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
// CSV con punto y coma y coma decimal, que es lo que abre bien el Excel en español
function exportar(y) {
  const cel = v => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const n2 = v => r2(v).toFixed(2).replace('.', ',');
  const lineas = [];
  let ks;
  if (y) {
    ks = MES_C.map((_, i) => mk(y, i + 1));
    const { filas, total } = datosAnio(y);
    lineas.push(['Resumen ' + y, ...MES_C, 'Total'].map(cel).join(';'));
    filas.concat([total]).forEach(f => lineas.push([cel(f.tit), ...f.vals.map(n2), n2(suma(f.vals, v => v))].join(';')));
    lineas.push('');
  } else {
    const todos = D.fijos.map(f => f.desde).concat(D.variables.map(v => v.mes)).sort();
    if (!todos.length) { aviso('Aún no hay gastos que exportar'); return; }
    const fin = hoyK() > todos[todos.length - 1] ? hoyK() : todos[todos.length - 1];
    ks = []; for (let k = todos[0]; k <= fin; k = sumaMes(k, 1)) ks.push(k);
  }
  lineas.push(['Mes', 'Tipo', 'Día', 'Concepto', 'Categoría', 'Persona', 'Importe', 'Pagado'].join(';'));
  ks.forEach(k => {
    const { fijos, vars } = filasMes(k);
    const nom = x => persona(x.persona) ? persona(x.persona).nombre : 'Compartido';
    fijos.forEach(x => lineas.push([k, 'Fijo', '', x.concepto, x.cat, nom(x), n2(x.importe), x.ref.pagados && x.ref.pagados[k] ? 'Sí' : 'No'].map((v, i) => i === 6 ? v : cel(v)).join(';')));
    vars.sort((a, b) => (a.ref.dia || 99) - (b.ref.dia || 99)).forEach(x => lineas.push([k, 'Variable', x.ref.dia || '', x.concepto, x.cat, nom(x), n2(x.importe), ''].map((v, i) => i === 6 ? v : cel(v)).join(';')));
  });
  descargar(`gastos-${y || 'todo'}.csv`, '﻿' + lineas.join('\r\n'), 'text/csv;charset=utf-8');
  aviso('Descargado. Ábrelo con Excel');
}

// ---------- Avisos ----------
let tAviso = 0;
function aviso(txt, conDeshacer) {
  const a = $('#aviso');
  a.innerHTML = `<span>${esc(txt)}</span>${conDeshacer && deshacer ? '<button data-acc="deshacer">Deshacer</button>' : ''}`;
  a.hidden = false;
  clearTimeout(tAviso); tAviso = setTimeout(ocultarAviso, conDeshacer ? 6000 : 3000);
}
function ocultarAviso() { $('#aviso').hidden = true; }

render();
