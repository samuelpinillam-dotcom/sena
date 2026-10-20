// Controlador/controlador-ventas.js — Carrito y facturación (sin <div>)
// Tienda (promos bajo cada producto) · carrito · buzón · emisión
// · marcar ENVIADA · anular · impresión

/* ---- Carrito compartido ---- */
function carritoHTML(dirId, accBtn, labelBtn) {
  const promo = Estado.promos.find(p => p.id_promocion === Estado.promoSel);
  const sub = Estado.carrito.reduce((s, i) => s + i.precio * i.cant, 0);
  const promoBase = promo ? Estado.carrito.filter(i => +i.id_producto === +promo.id_producto).reduce((s, i) => s + i.precio * i.cant, 0) : 0;
  const des = promoBase * (promo?.descuento || 0) / 100, iva = (sub - des) * 0.19;
  if (!Estado.carrito.length) return `<p class="text-muted mb-0 mt-2">El carrito está vacío: agrega productos para continuar.</p>`;
  return `<table class="table table-sm mt-3 mb-2"><tbody>${Estado.carrito.map((i, ix) =>
    `<tr><td>${Vista.esc(i.nombre)}</td><td>x${i.cant}</td><td>${Vista.money(i.precio * i.cant)}</td>
     <td style="width:50px"><button class="btn btn-sm btn-outline-danger" data-acc="c-quit" data-ix="${ix}">x×</button></td></tr>`).join('')}</tbody></table>
    <section class="row g-2 align-items-end text-start">
      <span class="col-md-6"><label class="form-label">Dirección de envío</label>
        <input id="${dirId}" class="form-control" placeholder="Calle 123 #45-67"></span>
      <span class="col-md-6 text-md-end">
        <p class="mb-1">Subtotal: <strong>${Vista.money(sub)}</strong> · Descuento: <strong>${Vista.money(des)}</strong> · IVA: <strong>${Vista.money(iva)}</strong></p>
        <p class="h5 mb-2">TOTAL: <span class="precio-producto">${Vista.money(sub - des + iva)}</span></p>
        <button class="btn btn-primary" data-acc="${accBtn}">${labelBtn}</button></span></section>`;
}

/* ---- TIENDA (Cliente) ---- */
async function modTienda() {
  const [prods, promos] = await Promise.all([Modelo.get('productos.php'), Modelo.get('promociones.php?activas=1')]);
  Estado.datos.productos = prods;
  Estado.promos = promos.filter(p => p.estado === 'Activa');
  if (esCliente() && !Estado.carrito.length) {
    const elegido = sessionStorage.getItem('lt_add');
    if (elegido) {
      const pSel = prods.find(p => String(p.nombre) === String(elegido));
      if (pSel && +pSel.cantidad > 0 && pSel.estado !== 'Inactivo') {
        Estado.carrito.push({ id_producto: pSel.id_producto, nombre: pSel.nombre, precio: +pSel.precio, cant: 1 });
      }
      sessionStorage.removeItem('lt_add');
    }
  }
  const sel = Estado.promos.find(p => p.id_promocion === Estado.promoSel);
  const strip = `<section class="promo-strip mb-3"><header class="promo-head"><i class="fas fa-tags"></i> Promociones para la compra — toca una para aplicarla</header>
    <section class="promo-body">${Estado.promos.length ? Estado.promos.map(p =>
      `<span class="promo-card" role="button" data-promo="${p.id_promocion}" style="${Estado.promoSel === p.id_promocion ? 'border-style:solid;background:rgba(255,138,30,.18);' : ''}">
        <span class="promo-pct">-${p.descuento}%</span><h6>${Vista.esc(p.nombre)}</h6>
        <small>Hasta ${Vista.fecha(p.fecha_fin)} · ${Estado.promoSel === p.id_promocion ? 'aplicada (toca para quitar)' : 'toca para aplicar'}</small></span>`).join('')
      : `<small class="text-muted">No hay promociones activas por ahora. Las que cree el equipo aparecerán aquí y debajo de cada producto.</small>`}</section></section>`;
  const car = Estado.carrito.length
    ? `<article class="card p-3 mb-3 lt-3d-in"><h6 class="fw-bold">🛒 Tu carrito</h6><span class="d-block" id="tCarrito">${carritoHTML('dirEnvio', 't-finalizar', 'Finalizar compra')}</span></article>` : '';
  const cards = prods.filter(p => p.estado !== 'Inactivo').map(p => {
    const st = +p.cantidad, agot = st <= 0;
    const aplicaPromo = sel && +sel.id_producto === +p.id_producto;
    const pv = aplicaPromo ? Math.round(p.precio * (1 - sel.descuento / 100) * 100) / 100 : null;
    const promosProducto = Estado.promos.filter(x => +x.id_producto === +p.id_producto);
    const promoBajo = promosProducto.length
      ? `<p class="prod-promo mb-1">🏷 <b>${promosProducto.map(x => `${Vista.esc(x.nombre)} -${x.descuento}%`).join('</b> · <b>')}</b>${aplicaPromo ? '<br>Pagando hoy: <b>' + Vista.money(pv) + '</b> en vez de ' + Vista.money(p.precio) + ' <span class="ahorro">Ahorras ' + Vista.money(p.precio - pv) + '</span>' : ''}</p>`
      : `<p class="prod-promo mb-1"><span class="sin-promo">Sin promociones activas por ahora.</span></p>`;
    return `<span class="col-md-6 col-xl-4"><article class="card card-producto p-3 h-100">
        ${Vista.media(p)}
        <h6 class="fw-bold mt-2 mb-1">${Vista.esc(p.nombre)}</h6>
        <p class="desc-producto text-muted mb-1">${Vista.esc(p.descripcion || '')}</p>
        <p class="precio-producto fw-bold mb-0">${Vista.money(pv ?? p.precio)} ${aplicaPromo ? `<span class="precio-tachado">${Vista.money(p.precio)}</span>` : ''}</p>
        <p class="text-muted mb-1" style="font-size:.85rem"><i class="fas fa-box"></i> ${agot ? 'Agotado' : 'Stock: ' + st}</p>
        ${promoBajo}
        <span class="d-flex gap-2 mt-2 mt-auto">
          <input type="number" class="form-control form-control-sm" style="width:72px" min="1" max="${st}" value="1" id="cant-${p.id_producto}" ${agot ? 'disabled' : ''}>
          <button class="btn btn-primary btn-sm btnBuy flex-grow-1" data-acc="t-add" data-id="${p.id_producto}" ${agot ? 'disabled' : ''}><i class="fas fa-cart-plus"></i> Comprar</button>
        </span></article></span>`;
  }).join('');
  return strip + car + `<section class="row g-3">${cards}</section>`
    + (cards ? '' : `<article class="card p-3">${Vista.empty('fa-box-open', 'No hay productos disponibles por ahora.')}</article>`);
}

/* ---- Facturas: ver e imprimir ---- */
function verFactura(v) {
  Estado.facturaActual = v;
  abrirModal(`<h5 class="fw-bold">Factura ${Vista.esc(v.numero)}</h5>${Vista.factura(v)}
    <nav class="lt-modal-actions"><button class="btn btn-outline-secondary" onclick="cerrarModal()">Cerrar</button>
    <button class="btn btn-primary" data-acc="v-print" data-id="${v.id_venta}"><i class="fas fa-print"></i> Imprimir factura</button></nav>`);
}
function imprimirFactura(v) {
  if (!v) return ltToast('Abre primero una factura.', 'error');
  if (!confirm('Se va a imprimir la factura ' + v.numero + '.\nSe abrirá el diálogo de impresión del navegador. ¿Continuar?')) return;
  const z = document.getElementById('ltPrintZone');
  z.innerHTML = Vista.factura(v); window.print(); z.innerHTML = '';
  ltToast('🖨 Impresión de ' + v.numero + ' enviada', 'ok');
}

/* ---- Buzón del Cliente ---- */
async function modFacturas() {
  Estado.usuario = await Modelo.get('auth.php?action=current');
  if (!Estado.usuario) return Vista.empty('fa-lock', 'Tu sesión expiró. Recarga la página (F5).');
  const vs = await Modelo.get('ventas.php?mine=1');
  Estado.ventas = vs;
  const bandeja = vs.length
    ? `<section class="bandeja">${vs.map(v => `<article class="mail-card ${v.estado === 'Anulada' ? 'anulada' : ''}" data-acc="v-ver" data-id="${v.id_venta}" role="button">
        <span class="mail-ico"><i class="fas ${v.estado === 'Anulada' ? 'fa-ban' : 'fa-file-invoice'}"></i></span>
        <span class="mail-body"><strong>${Vista.esc(v.numero)}</strong> · ${Vista.esc(v.cliente_nombre)}
          <small>${Vista.fecha(v.fecha)} · ${(v.items || []).length} producto(s)</small></span>
        <span class="mail-side">${Vista.badge(v.estado)}<strong>${Vista.money(v.total)}</strong></span></article>`).join('')}</section>`
    : Vista.empty('fa-envelope-open-text', 'Tu buzón está vacío: cuando compres en la Tienda, tu factura llegará aquí y podrás abrirla e imprimirla.');
  return `<article class="card p-3 lt-3d-in"><h6 class="fw-bold mb-1">📬 Buzón de facturas</h6>
    <p class="mb-2">Saldo disponible: <strong class="precio-producto">${Vista.money(Estado.usuario.saldo || 0)}</strong></p>
    <p class="text-muted small mb-0">Toca una factura para verla con su diseño oficial e imprimirla.</p>${bandeja}</article>`;
}

/* ---- Ventas (Admin/Empleado): GESTIÓN COMPLETA ---- */
async function modVentas() {
  const [ventas, clientes, productos, promos] = await Promise.all([
    Modelo.get('ventas.php'), Modelo.get('clientes.php'), Modelo.get('productos.php'), Modelo.get('promociones.php?activas=1')]);
  Estado.ventas = ventas; Estado.datos.clientes = clientes;
  Estado.datos.productos = productos; Estado.promos = promos;

  const emitir = `<article class="card p-3 mb-3 lt-3d-in"><h6 class="fw-bold mb-2">🧾 Emitir nueva factura</h6>
    <section class="row g-2 text-start">
      <span class="col-md-4"><label class="form-label">Cliente</label>
        <select id="vCli" class="form-select"><option value="0">Mostrador (sin cliente)</option>
        ${clientes.map(c => `<option value="${c.id_cliente}">${Vista.esc(c.nombre)}</option>`).join('')}</select></span>
      <span class="col-md-4"><label class="form-label">Promoción</label>
        <select id="vPromo" class="form-select"><option value="0">Sin promoción</option>
        ${promos.map(p => `<option value="${p.id_promocion}">${Vista.esc(p.nombre)} (-${p.descuento}%)</option>`).join('')}</select></span>
      <span class="col-md-4"><label class="form-label">Producto</label>
        <select id="vProd" class="form-select">${productos.filter(p => +p.cantidad > 0 && p.estado !== 'Inactivo')
          .map(p => `<option value="${p.id_producto}">${Vista.esc(p.nombre)} — ${Vista.money(p.precio)} (stock ${p.cantidad})</option>`).join('')}</select></span>
      <span class="col-md-2"><label class="form-label">Cantidad</label><input id="vCant" type="number" min="1" value="1" class="form-control"></span>
      <span class="col-6 col-md-2 d-flex align-items-end"><button class="btn btn-outline-warning w-100" data-acc="v-add">+ Agregar</button></span>
      <span class="col-12" id="vCarrito">${carritoHTML('vDir', 'v-emitir', '💾 Emitir factura')}</span></section></article>`;
  const tb = tabla(['Número','Fecha','Cliente','Total','Estado','Acciones'],
    ventas.map(v => `<tr ${v.estado === 'Anulada' ? 'style="opacity:.55"' : ''}>
        <td><strong>${Vista.esc(v.numero)}</strong></td><td>${Vista.fecha(v.fecha)}</td>
        <td>${Vista.esc(v.cliente_nombre)}</td><td>${Vista.money(v.total)}</td><td>${Vista.badge(v.estado)}</td>
        <td class="text-nowrap"><button class="btn btn-sm btn-outline-secondary me-1" data-acc="v-ver" data-id="${v.id_venta}">👁</button>
        <button class="btn btn-sm btn-outline-secondary me-1" data-acc="v-print" data-id="${v.id_venta}">🖨</button>
        ${v.estado === 'Activa' ? `<button class="btn btn-sm btn-outline-success me-1" data-acc="v-enviar" data-id="${v.id_venta}">🚚 Enviar</button>` : ''}
        ${v.estado !== 'Anulada' ? `<button class="btn btn-sm btn-outline-danger" data-acc="v-anular" data-id="${v.id_venta}">Anular</button>` : ''}</td></tr>`),
    'Aún no hay facturas emitidas. Usa el panel superior para la primera.');
  return emitir + `<article class="card p-3">${tb}</article>`;
}
function vAdd() {
  const pid = document.getElementById('vProd').value;
  const p = Estado.datos.productos.find(x => String(x.id_producto) === String(pid));
  const q = Math.max(1, parseInt(document.getElementById('vCant').value || '1'));
  if (!p || q > +p.cantidad) return ltToast('Stock insuficiente: hay ' + (p ? p.cantidad : 0) + ' unidades.', 'error');
  Estado.promoSel = +document.getElementById('vPromo').value || 0;
  const ex = Estado.carrito.find(i => String(i.id_producto) === String(pid));
  if (ex) ex.cant = Math.min(+p.cantidad, ex.cant + q);
  else Estado.carrito.push({ id_producto: p.id_producto, nombre: p.nombre, precio: +p.precio, cant: q });
  document.getElementById('vCarrito').innerHTML = carritoHTML('vDir', 'v-emitir', '💾 Emitir factura');
  ltToast('🛒 ' + p.nombre + ' agregado', 'ok');
}
async function vEmitir() {
  if (!Estado.carrito.length) return ltToast('El carrito está vacío.', 'error');
  const selC = document.getElementById('vCli');
  const dir = (document.getElementById('vDir')?.value || '').trim();
  const r = await Modelo.post('ventas.php', {
    items: Estado.carrito.map(i => ({ id_producto: i.id_producto, cantidad: i.cant })),
    id_cliente: +selC.value || 0, id_promocion: Estado.promoSel || 0, direccion_envio: dir });
  const venta = { id_venta: r.id_venta, numero: r.numero, fecha: new Date().toISOString(), estado: 'Activa',
    cliente_nombre: selC.selectedOptions[0]?.textContent || 'Mostrador', subtotal: r.subtotal, descuento: r.descuento,
    iva: r.iva, total: r.total, items: Estado.carrito.map(i => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cant })), id_pedidos: r.id_pedidos };
  Estado.carrito = []; Estado.promoSel = 0;
  ltToast('✅ Factura ' + r.numero + ' emitida', 'ok');
  abrirModulo('ventas'); verFactura(venta);
}