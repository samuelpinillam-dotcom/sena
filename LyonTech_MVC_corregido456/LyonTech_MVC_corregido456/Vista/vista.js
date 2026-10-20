/* ============================================================
  Vista/vista.js — Capa de presentación (helpers visuales)
  ✓ base(): detecta si se navega desde Vista/ y antepone ../
  ✓ HTML semántico: el HTML generado NO contiene <div>
============================================================ */
const Vista = {

  base() {
    return location.pathname.toLowerCase().includes('/vista/') ? '../' : '';
  },

  /* ---------- Utilidades base ---------- */
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  },
  money(n) {
    return '$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
  },
  fecha(f) {
    if (!f) return '—';
    const d = new Date(f);
    return isNaN(d) ? Vista.esc(f)
      : d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  badge(e) {
    const map = {
      'activo':'badge-estado-activo',     'activa':'badge-estado-activo',
      'inactivo':'badge-estado-inactivo', 'inactiva':'badge-estado-inactivo',
      'anulada':'badge-estado-inactivo',  'rechazada':'badge-estado-inactivo',
      'cerrado':'badge-estado-inactivo',  'cerrada':'badge-estado-inactivo',
      'pendiente':'badge-estado-pendiente','preparando':'badge-estado-pendiente',
      'abierto':'badge-estado-pendiente',  'ajustada':'badge-estado-pendiente',
      'proveedor':'badge-estado-pendiente',
      'enviada':'badge-estado-enviada',   'enviado':'badge-estado-enviada',
      'validada':'badge-estado-enviada',  'en proceso':'badge-estado-enviada',
      'empleado':'badge-estado-enviada',
      'administrador':'badge-estado-descuento','descuento':'badge-estado-descuento',
      'cliente':'badge-estado-activo'
    };
    const k = String(e || '').toLowerCase().trim();
    return `<span class="badge ${map[k] || 'badge-estado-inactivo'}">${Vista.esc(e)}</span>`;
  },

  /* ---------- Piezas de UI (sin divs) ---------- */
  empty(icon, msg) {
    return `<p class="lt-empty"><i class="fas ${icon}"></i>${Vista.esc(msg)}</p>`;
  },
  header(ico, t, s) {
    return `<header class="lt-mod-header">
      <span class="lt-mh-ico"><i class="fas ${ico}"></i></span>
      <span class="lt-mh-txt"><h4>${Vista.esc(t)}</h4><small>${Vista.esc(s || '')}</small></span>
    </header>`;
  },

  /* ---------- Imágenes de productos ---------- */
  iconoProducto(p) {
    const n = ((p.nombre || '') + ' ' + (p.descripcion || '')).toLowerCase();
    if (/gpu|gráfic|grafic|procesad|ram|intel|core|ddr/.test(n)) return 'fa-microchip';
    if (/tv|televis/.test(n))  return 'fa-tv';
    if (/barra|sonido|audio/.test(n)) return 'fa-volume-up';
    if (/nevera|refriger/.test(n)) return 'fa-snowflake';
    if (/lavadora/.test(n)) return 'fa-water';
    if (/aire|a\/a|whirlpool/.test(n)) return 'fa-fan';
    if (/microondas/.test(n)) return 'fa-fire';
    return 'fa-box';
  },
  _candidatos(id) {
    const B = Vista.base() + 'Vista/imagenes/';
    return [
      B + 'imagen%20' + id + '.jpg',
      B + 'imagen%20' + id + '.png',
      B + 'imagen' + id + '.jpg',
      B + 'imagen' + id + '.png',
      B + id + '.jpg',
      B + id + '.png'
    ];
  },
  _nextImg(img) {
    try {
      const cands = JSON.parse(img.dataset.cands || '[]');
      const step = (+img.dataset.step || 0) + 1;
      if (step < cands.length) { img.dataset.step = step; img.src = cands[step]; return; }
    } catch (e) { /* nada */ }
    img.remove();
  },
  media(p) {
    const cands = Vista._candidatos(p.id_producto);
    return `<figure class="media-3d m-0">
      <span class="media-ico"><i class="fas ${Vista.iconoProducto(p)}"></i></span>
      <img class="prod-img" src="${cands[0]}" data-cands='${JSON.stringify(cands)}' data-step="0"
           alt="${Vista.esc(p.nombre)}" loading="lazy" onerror="Vista._nextImg(this)">
      </figure>`;
  },
  thumb(p) {
    const c = Vista._candidatos(p.id_producto);
    return `<span class="thumb-wrap" style="display:inline-block"><i class="fas ${Vista.iconoProducto(p)}"></i>
      <img class="thumb-prod" src="${c[0]}" alt=""
           onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${c[1]}';}else{this.remove();}">
      </span>`;
  },

  /* ---------- Factura con diseño oficial (sin divs) ---------- */
  factura(v) {
    const items = v.items || [];
    const cls = v.estado === 'Anulada' ? 'b-anu'
              : v.estado === 'Ajustada' ? 'b-aju'
              : v.estado === 'Enviada'  ? 'b-env' : 'b-act';
    const filas = items.length
      ? items.map(i =>
    `<tr><td>${Vista.esc(i.nombre)}</td><td>${i.cantidad ?? i.cant ?? 1}</td>
        <td>${Vista.money(i.precio)}</td><td>${Vista.money((i.precio * (i.cantidad ?? i.cant ?? 1)))}</td></tr>`).join('')
      : `<tr><td colspan="4" style="text-align:center">Sin detalle de productos</td></tr>`;
    return `<article class="factura-doc">
        <p class="fd-top m-0"></p>
        <header class="fd-head">
          <span class="fd-brand">
            <span class="fd-logo">L</span><h4>LYON TECHNOLOGIES</h4><small>Cra 56bis #78-12 · Bogotá D.C.</small></span>
          <span class="fd-num"><h3>${Vista.esc(v.numero)}</h3>
            <small>Factura de venta · <span class="fd-badge ${cls}">${Vista.esc(v.estado)}</span></small></span>
        </header>
        <section class="fd-info">
          <p class="m-0"><small>Cliente</small><b>${Vista.esc(v.cliente_nombre || 'Cliente general')}</b></p>
          <p class="m-0"><small>Fecha</small><b>${Vista.fecha(v.fecha)}</b></p>
          <p class="m-0"><small>Pedido</small><b>${Vista.esc(v.id_pedidos || '—')}</b></p>
        </section>
        <table class="fd-table">
          <thead><tr><th>Producto</th><th>Cant.</th><th>Vlr. unidad</th><th>Subtotal</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
        <section class="fd-tot"><table>
          <tr><td>Subtotal</td><td>${Vista.money(v.subtotal)}</td></tr>
          <tr><td>Descuento</td><td>-${Vista.money(v.descuento)}</td></tr>
          <tr><td>IVA (19%)</td><td>${Vista.money(v.iva)}</td></tr>
          <tr class="grand"><td>TOTAL</td><td>${Vista.money(v.total)}</td></tr>
        </table></section>
        <footer class="fd-foot">¡Gracias por su compra! · Lyon Technologies · comercial@lyontechnologies.net</footer>
      </article>`;
  }
};