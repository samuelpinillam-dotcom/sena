/* ============================================================
  Controlador/controlador.js — NÚCLEO (HTML generado SIN <div>)
  1 · Estado global · 2 · Módulos por rol · 3 · Utilidades UI
  4 · Login/Registro · 5 · Dashboard y router · 6 · Panel resumen
  ✔ Sin Chat · Sin Bitácora (retirados del alcance)
  ✔ RF011: Admin consulta · Empleado genera reportes de ventas
  ✔ abrirModulo con red de seguridad (nunca queda "Cargando...")
============================================================ */

/* ---- 1 · Estado global compartido por los módulos ---- */
const Estado = {
  usuario: null, modulo: null, datos: {}, promos: [], carrito: [], promoSel: 0,
  ventas: [], devVentas: [], facturaActual: null,
  chatTimer: null, ultimoQuery: null, _cargaId: 0
};

/* ---- 2 · Módulos por rol (RF002 · diagrama de clases) ---- */
const MODULOS = {
  Administrador: [
    ['panel','fa-chart-pie','Resumen'], ['usuarios','fa-users-gear','Usuarios'],
    ['clientes','fa-address-book','Clientes'], ['productos','fa-boxes-stacked','Productos'],
    ['promociones','fa-tags','Promociones'], ['proveedores','fa-truck-field','Proveedores'],
    ['ventas','fa-file-invoice-dollar','Ventas'], ['pedidos','fa-truck-fast','Pedidos'],
    ['devoluciones','fa-rotate-left','Devoluciones'], ['reportes','fa-chart-line','Reportes'],
    ['soporte','fa-headset','Soporte']
  ],
  Empleado: [
    ['panel','fa-chart-pie','Resumen'], ['clientes','fa-address-book','Clientes'],
    ['productos','fa-boxes-stacked','Productos'], ['promociones','fa-tags','Promociones'],
    ['ventas','fa-file-invoice-dollar','Ventas'],
    ['devoluciones','fa-rotate-left','Devoluciones'],
    ['reportes','fa-chart-line','Reportes de ventas'],
    ['soporte','fa-headset','Soporte']
  ],
  Proveedor: [
    ['productos','fa-boxes-stacked','Productos'], ['pedidos','fa-truck-fast','Estados de envío']
  ],
  Cliente: [
    ['tienda','fa-store','Tienda'], ['compras','fa-truck-fast','Mis compras'],
    ['facturas','fa-file-invoice','Facturas'], ['devoluciones','fa-rotate-left','Devoluciones'],
    ['soporte','fa-headset','Soporte Técnico']
  ]
};

const TIT = {
  panel:['fa-chart-pie','Resumen de empresa','Indicadores en tiempo real'],
  usuarios:['fa-users-gear','Gestión de usuarios','CRUD completo de cuentas'],
  clientes:['fa-address-book','Clientes','CRUD completo'],
  productos:['fa-boxes-stacked','Productos','Catálogo e inventario'],
  promociones:['fa-tags','Promociones','Aparecen al instante en la Tienda del cliente'],
  proveedores:['fa-truck-field','Proveedores','CRUD y productos que suministran'],
  ventas:['fa-file-invoice-dollar','Ventas','Emitir, enviar, anular e imprimir facturas'],
  pedidos:['fa-truck-fast','Pedidos y envíos','Trazabilidad y estados (Logística)'],
  devoluciones:['fa-rotate-left','Devoluciones','Gestión: validar, rechazar y notas de crédito'],
  reportes:['fa-chart-line','Reportes','Admin consulta · Empleado genera reportes de ventas'],
  soporte:['fa-headset','Soporte Técnico','Gestión de tickets de clientes'],
  tienda:['fa-store','Tienda','Promociones activas debajo de cada producto'],
  compras:['fa-truck-fast','Mis compras','Seguimiento de tus pedidos'],
  facturas:['fa-file-invoice','Facturas','Tu buzón: abre, revisa e imprime']
};

/* ---- 3 · Utilidades UI (sin divs) ---- */
function ltToast(msg, tipo = '') {
  const zona = document.getElementById('ltToasts');
  if (!zona) { console.log('TOAST:', msg); return; }
  const d = document.createElement('section');           // ← sin div
  d.className = 'lt-toast ' + tipo; d.textContent = msg;
  zona.appendChild(d);
  setTimeout(() => d.remove(), 4200);
}
function abrirModal(html) {
  cerrarModal();
  const ov = document.createElement('section');          // ← sin div
  ov.className = 'lt-modal-overlay';
  ov.innerHTML = `<aside class="lt-modal"><article class="card p-4">${html}</article></aside>`;
  ov.addEventListener('click', e => { if (e.target === ov) cerrarModal(); });
  document.body.appendChild(ov);
}
function cerrarModal() { document.querySelectorAll('.lt-modal-overlay').forEach(o => o.remove()); }
function getCurrent() { return Estado.usuario; }
function normalizeRole(u) { return (u && (u.rol || u.role)) || ''; }
const rol = () => normalizeRole(Estado.usuario);
const esAdmin = () => rol() === 'Administrador';
const esCliente = () => rol() === 'Cliente';
function tabla(head, filas, vacio) {
  return filas.length
    ? `<section class="table-responsive"><table class="table align-middle"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${filas.join('')}</tbody></table></section>`
    : Vista.empty('fa-inbox', vacio);
}
/* El núcleo conoce las vistas; las funciones las define cada controlador */
function vistaDe(id) {
  const mapa = {
    panel: modPanel, tienda: modTienda, compras: modCompras, facturas: modFacturas,
    ventas: modVentas, pedidos: modPedidos, devoluciones: modDevoluciones,
    soporte: modSoporte, reportes: modReportes,
    usuarios: () => modEntidad('usuarios'), clientes: () => modEntidad('clientes'),
    productos: modProductos, promociones: () => modEntidad('promociones'),
    proveedores: () => modEntidad('proveedores')
  };
  return mapa[id];
}

/* ---- 4 · Login / Registro (RF001 · CU001 · CU002) ---- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const $ = id => document.getElementById(id);
    const bL = $('btnTabLogin'), bR = $('btnTabRegister');
    const fL = $('formLogin'), fR = $('formRegister');

    function setTab(login) {
      if (fL) fL.style.display = login ? 'block' : 'none';
      if (fR) fR.style.display = login ? 'none' : 'block';
      if (bL) {
        bL.classList.toggle('active', login);
        bL.classList.toggle('btn-primary', login);
        bL.classList.toggle('btn-outline-primary', !login);
      }
      if (bR) {
        bR.classList.toggle('active', !login);
        bR.classList.toggle('btn-primary', !login);
        bR.classList.toggle('btn-outline-primary', login);
      }
    }
    if (bL && bR) {
      bL.addEventListener('click', () => setTab(true));
      bR.addEventListener('click', () => setTab(false));
      if (window.LT_ABRIR_REGISTRO || new URLSearchParams(location.search).get('action') === 'register') setTab(false);
    }
    if (fL) fL.addEventListener('submit', async e => {
      e.preventDefault();
      try {
        renderDashboardFor(await Modelo.post('auth.php?action=login',
          { email: $('loginEmail').value.trim(), password: $('loginPass').value }));
      } catch (err) { console.error(err); ltToast('⛔ ' + err.message, 'error'); }
    });
    if (fR) fR.addEventListener('submit', async e => {
      e.preventDefault();
      const d = { nombre: $('regName').value.trim(), apellido: $('regLastName').value.trim(),
                  tipo_documento: $('regDocumentType').value, numero_documento: $('regDocument').value.trim(),
                  direccion: $('regAddress').value.trim(), email: $('regEmail').value.trim(),
                  telefono: $('regPhone').value.trim(), password: $('regPass').value,
                  rol: $('regRol') ? $('regRol').value : 'Cliente' };
      const letras = v => /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(v);
      if (!letras(d.nombre) || !letras(d.apellido)) return ltToast('Nombre y apellido: solo letras y espacios.', 'error');
      if (!d.tipo_documento) return ltToast('Selecciona el tipo de documento.', 'error');
      if (!/^\d{5,20}$/.test(d.numero_documento)) return ltToast('Documento: solo números (5 a 20 dígitos).', 'error');
      if (!/^\d{7,15}$/.test(d.telefono)) return ltToast('Teléfono: solo números (7 a 15 dígitos).', 'error');
      if (d.password.length < 6) return ltToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      if (!d.rol) return ltToast('Selecciona un rol.', 'error');
      const btn = fR.querySelector('button[type="submit"], button:not([type])');
      if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta...'; }
      try {
        await Modelo.post('auth.php?action=register', d);
        // CU001 paso "y acceder": entra directo al dashboard con el rol elegido
        const u = await Modelo.post('auth.php?action=login', { email: d.email, password: d.password });
        ltToast('✅ Cuenta creada. ¡Bienvenido, ' + u.nombre + '!', 'ok');
        renderDashboardFor(u);
      } catch (err) { console.error('REGISTRO →', err); ltToast('⛔ ' + err.message, 'error'); }
      finally { if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta y acceder'; } }
    });
    const bl = $('btnLogout');
    if (bl) bl.addEventListener('click', async () => {
      try { await Modelo.post('auth.php?action=logout'); } catch (_) {}
      location.reload();
    });
    const bp = $('btnProfile');
    if (bp) bp.addEventListener('click', perfilAbrir);

    Modelo.usuarioActual().then(u => { if (u) renderDashboardFor(u); });
  } catch (err) { console.error('Error al iniciar:', err); alert('Error al iniciar: ' + err.message); }
});

/* ---- 5 · Dashboard y router (RF001: redirige según su rol) ---- */
function renderDashboardFor(u) {
  Estado.usuario = u;
  document.getElementById('homeView').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('dashWelcome').textContent = `Hola, ${u.nombre} — ${rol()}`;
  pintarModulos();
  abrirModulo({ Cliente: 'tienda', Administrador: 'panel', Empleado: 'panel', Proveedor: 'productos' }[rol()] || 'panel');
}
function pintarModulos() {
  document.getElementById('moduleList').innerHTML = (MODULOS[rol()] || []).map(([id, ico, t]) =>
    `<button type="button" class="lt-mod-btn list-group-item" data-mod="${id}">
        <span class="lt-mod-ico"><i class="fas ${ico}"></i></span>
        <span class="lt-mod-txt"><strong>${t}</strong></span></button>`).join('');
}
async function abrirModulo(id) {
  if (!MODULOS[rol()]?.some(m => m[0] === id)) return;   // el rol solo abre sus módulos
  if (Estado.chatTimer) { clearInterval(Estado.chatTimer); Estado.chatTimer = null; }
  Estado.modulo = id;
  Estado.ultimoQuery = null;
  document.querySelectorAll('#moduleList .lt-mod-btn').forEach(b => b.classList.toggle('active', b.dataset.mod === id));
  const ca = document.getElementById('contentArea');
  if (!ca) return;
  const [ico, t, s] = TIT[id] || ['fa-circle', id, ''];

  const stamp = ++Estado._cargaId;
  try { ca.innerHTML = Vista.header(ico, t, s) +
    `<article class="card p-4 lt-3d-in"><h5 class="fw-bold mb-0"><span class="spinner-border spinner-border-sm me-2"></span>Cargando...</h5></article>`; }
  catch (_) { ca.innerHTML = `<article class="card p-4">Cargando…</article>`; }

  /* ✔ RED DE SEGURIDAD: si a los 12s sigue "Cargando...", muestra el porqué */
  const red = setTimeout(() => {
    if (Estado._cargaId === stamp && ca.innerHTML.includes('Cargando...')) {
      ca.innerHTML = Vista.header(ico, t, s) +
        `<article class="card p-4">${Vista.empty('fa-plug-circle-xmark',
          'El servidor no respondió. Verifica que XAMPP (Apache + MySQL) esté encendido y recarga con Ctrl + Shift + R. Detalle técnico: F12 → Console / Network.')}</article>`;
    }
  }, 12000);

  try {
    const fn = vistaDe(id);
    const html = fn ? await fn() : null;
    if (Estado._cargaId !== stamp) return;   // se abrió otro módulo mientras cargaba
    clearTimeout(red);
    ca.innerHTML = html ?? Vista.empty('fa-circle-question', 'Módulo no disponible.');
  } catch (err) {
    clearTimeout(red);
    if (Estado._cargaId !== stamp) return;
    ca.innerHTML = Vista.header(ico, t, s) +
      `<article class="card p-4 lt-3d-in">${Vista.empty('fa-triangle-exclamation', Vista.esc(err.message))}</article>`;
    ltToast(err.message, 'error');
  }
  if (id === 'reportes' && typeof reportesLista === 'function') {
    try { reportesLista(); } catch (_) {}
  }
}

/* ---- 6 · Panel de resumen (Admin/Empleado · RF011) — sin divs ---- */
function Kpi(color, ico, t, v, s) {
  return `<button type="button" class="kpi-card ${color}"><i class="fas ${ico} kpi-bg"></i>
    <span class="kpi-txt"><small>${t}</small><strong>${v}</strong><small>${s}</small></span></button>`;
}
async function modPanel() {
  const r = await Modelo.get('reportes.php?op=resumen');
  const k = `<section class="kpi-grid mb-3">
      ${Kpi('kpi-green','fa-sack-dollar','Ventas de hoy', Vista.money(r.ventas_dia.total), r.ventas_dia.cantidad + ' facturas')}
      ${Kpi('kpi-blue','fa-calendar','Ventas del mes', Vista.money(r.ventas_mes.total), r.ventas_mes.cantidad + ' facturas')}
      ${Kpi('kpi-yellow','fa-truck','Pedidos pendientes', r.pedidos.pendientes, r.pedidos.entregados + ' entregados de ' + r.pedidos.total)}
      ${Kpi('kpi-red','fa-triangle-exclamation','Stock bajo', r.stock_bajo.length, 'productos por reponer')}</section>`;
  const max = Math.max(1, ...(r.ventas_diarias || []).map(d => +d.total));
  const chart = (r.ventas_diarias || []).length
      ? `<section class="chart-bars">${r.ventas_diarias.map(d =>
          `<span class="bar" style="height:${Math.max(6, Math.round(+d.total / max * 100))}%"><span>${Vista.money(d.total)}</span><b>${(String(d.fecha).slice(8))}</b></span>`).join('')}</section>`
      : Vista.empty('fa-chart-column', 'Aún no hay ventas. Emite la primera factura para ver la gráfica.');
  const pct = r.pedidos.total ? Math.round(r.pedidos.entregados / r.pedidos.total * 100) : 0;
  const donut = `<section class="d-flex gap-3 align-items-center flex-wrap">
      <span class="donut" style="background:conic-gradient(#1a9e5c ${pct * 3.6}deg, #123055 0)"><span>${pct}%</span></span>
      <ul class="donut-legend list-unstyled mb-0">
          <li><span class="dot" style="background:#1a9e5c"></span> Entregados: ${r.pedidos.entregados}</li>
          <li><span class="dot" style="background:#123055"></span> Pendientes: ${r.pedidos.pendientes}</li>
          <li><span class="dot" style="background:var(--orange)"></span> Total: ${r.pedidos.total}</li></ul></section>`;
  const bajo = tabla(['Producto','Stock','Mínimo','Estado'],
      r.stock_bajo.map(p =>
      `<tr><td>${Vista.esc(p.nombre)}</td><td>${p.cantidad}</td><td>${p.stock_minimo}</td><td>${Vista.badge(p.estado)}</td></tr>`),
      'Todo el inventario está por encima del mínimo ✓');
  return Vista.header('fa-chart-pie', 'Resumen de empresa', 'Indicadores en tiempo real')
      + `<article class="card p-3 lt-3d-in">${k}</article>`
      + `<section class="kb-wrap">
          <section class="kb-col"><header class="kb-head"><h6>📈 Ventas · últimos 14 días</h6></header>${chart}</section>
          <section class="kb-col"><header class="kb-head"><h6>🚚 Estado de pedidos</h6></header>${donut}</section>
          <section class="kb-col"><header class="kb-head"><h6>⚠ Stock bajo</h6></header>${bajo}</section></section>`;
}