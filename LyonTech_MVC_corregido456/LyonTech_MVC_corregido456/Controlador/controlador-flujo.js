/* ============================================================
  Controlador/controlador-flujo.js — Flujo operativo (FINAL · sin chat · sin bitácora)
  1 · Pedidos · 2 · Mis compras · 3 · Devoluciones (gestión)
  4 · Soporte (gestión) · 5 · Reportes (RF011: Admin consulta · Empleado genera)
  7 · Perfil · 11 · Etiquetas/Recibos · 8 · Eventos globales
============================================================ */

const FLU = ['Preparando', 'Enviado', 'Entregado'];

/* ---- 1 · Pedidos (kanban) ---- */
async function modPedidos() {
  const lista = await Modelo.get('pedidos.php');
  const cols = FLU.map((est, i) => `<section class="kb-col"><header class="kb-head"><h6>${['⏳','🚚','✅'][i]} · ${est}</h6><span class="kb-count">${lista.filter(p => p.estado === est).length}</span></header>${lista.filter(p => p.estado === est).map(p =>
      `<article class="kb-card"><p class="mb-1"><strong>P-${p.id_pedido}</strong> · ${Vista.esc(p.cliente)}</p><small>${Vista.esc(p.direccion)}</small>
       <span class="d-flex gap-2 flex-wrap">${rol() === 'Proveedor' && i < 2 ? `<button class="btn btn-sm btn-outline-warning" data-avanzar="${p.id_pedido}" data-est="${FLU[i + 1]}">→ ${FLU[i + 1]}</button>` : ''}
       ${rol() === 'Proveedor' && p.estado !== 'Entregado' ? `<button class="btn btn-sm btn-outline-info" data-acc="ent-crear" data-id="${p.id_pedido}" data-tipo="Etiqueta">🏷 Etiqueta</button>` : ''}
       ${rol() === 'Proveedor' && p.estado === 'Entregado' ? `<button class="btn btn-sm btn-outline-secondary" data-acc="ent-crear" data-id="${p.id_pedido}" data-tipo="Recibo">🧾 Recibo</button>` : ''}
       ${esAdmin() ? `<button class="btn btn-sm btn-outline-danger" data-delped="${p.id_pedido}">🗑</button>` : ''}</span></article>`).join('') || '<small>Vacío por ahora.</small>'}</section>`).join('');
  const crear = esAdmin() ? `<article class="card p-3 mb-3"><h6>Nuevo pedido administrativo</h6><section class="row g-2"><span class="col-md-5"><input id="pedCli" class="form-control" placeholder="Nombre del cliente"></span><span class="col-md-5"><input id="pedDir" class="form-control" placeholder="Dirección de envío"></span><span class="col-md-2"><button class="btn btn-primary w-100" data-acc="ped-crear">Crear</button></span></section></article>` : '';
  return crear + `<section class="kb-wrap">${cols}</section>`;
}

/* ---- 2 · Mis compras (Cliente) ---- */
async function modCompras() {
  const lista = await Modelo.get('pedidos.php');
  if (!lista.length) return `<article class="card p-3 lt-3d-in">${Vista.empty('fa-truck-fast', 'Todavía no tienes pedidos. Cuando compres en la Tienda aparecerán aquí con su estado en vivo.')}</article>`;
  return `<section class="row g-3">${lista.map(p => {
    const i = FLU.indexOf(p.estado), pct = Math.max(0, i * 50);
    return `<span class="col-md-6"><article class="card p-3 lt-3d-in">
      <span class="d-flex justify-content-between align-items-center mb-2"><strong>P-${p.id_pedido}</strong>${Vista.badge(p.estado)}</span>
      <p class="text-muted mb-2"><i class="fas fa-location-dot"></i> ${Vista.esc(p.direccion)}</p>
      <span class="lt-progress mb-1" style="display:block"><i style="width:${pct}%"></i></span>
      <small class="text-muted">Fecha: ${Vista.fecha(p.fecha)} · ${FLU.map((f, x) => x <= i ? f : '···').join(' → ')}</small></article></span>`;
  }).join('')}</section>`;
}

/* ---- 3 · Devoluciones — GESTIÓN COMPLETA ---- */
async function modDevoluciones() {
  const lista = await Modelo.get('devoluciones.php');
  Estado.datos.devoluciones = lista;
  if (esCliente()) {
    Estado.devVentas = (await Modelo.get('ventas.php?mine=1')).filter(v => v.estado !== 'Anulada');
    const form = `<article class="card p-3 mb-3 lt-3d-in"><h6 class="fw-bold mb-2">↩ Solicitar devolución</h6>
      <section class="row g-2 text-start">
        <span class="col-md-6"><label class="form-label">Factura</label>
          <select id="dvV" class="form-select"><option value="">Selecciona…</option>
          ${Estado.devVentas.map(v => `<option value="${v.id_venta}">${Vista.esc(v.numero)} — ${Vista.money(v.total)}</option>`).join('')}</select></span>
        <span class="col-md-6"><label class="form-label">Producto comprado</label>
          <select id="dvI" class="form-select"><option value="">Elige la factura primero</option></select></span>
        <span class="col-4 col-md-2"><label class="form-label">Cantidad</label><input id="dvC" type="number" min="1" value="1" class="form-control"></span>
        <span class="col-8 col-md-6"><label class="form-label">Motivo</label><input id="dvM" class="form-control" placeholder="Ej: llegó con detalles"></span>
        <span class="col-md-4 d-flex align-items-end"><button class="btn btn-primary w-100" data-acc="d-enviar">Enviar solicitud</button></span>
      </section></article>`;
    const mis = tabla(['Factura','Producto','Cant.','Motivo','Estado','Nota crédito','Fecha','Acciones'],
      lista.map(d =>
        `<tr><td>${Vista.esc(d.venta_numero || d.id_venta)}</td><td>${Vista.esc(d.producto_nombre || '—')}</td>
         <td>${d.cantidad}</td><td>${Vista.esc(d.motivo)}</td><td>${Vista.badge(d.estado)}</td>
         <td>${Vista.esc(d.nota_credito || '—')}</td><td>${Vista.fecha(d.fecha)}</td>
         <td>${d.estado === 'Pendiente' ? `<button class="btn btn-sm btn-outline-secondary me-1" data-acc="d-edit" data-id="${d.id_devolucion}">✏ Modificar</button><button class="btn btn-sm btn-outline-danger" data-acc="d-del" data-id="${d.id_devolucion}">✖ Cancelar</button>` : ''}</td></tr>`),
      'No has solicitado devoluciones. Puedes hacerlo desde el formulario de arriba.');
    return form + `<article class="card p-3">${mis}</article>`;
  }
  /* ---- STAFF: validar · rechazar · editar · nota de crédito ---- */
  const filas = lista.map(d =>
    `<tr><td>${d.id_devolucion}</td><td>${Vista.esc(d.venta_numero || d.id_venta)}</td>
     <td>${Vista.esc(d.producto_nombre || '—')}</td><td>${d.cantidad}</td><td>${Vista.esc(d.motivo)}</td><td>${Vista.badge(d.estado)}</td>
     <td class="text-nowrap">${d.estado === 'Pendiente'
        ? `<button class="btn btn-sm btn-outline-success me-1" data-acc="d-validar" data-id="${d.id_devolucion}">✅ Validar</button>
           <button class="btn btn-sm btn-outline-danger me-1" data-acc="d-rechazar" data-id="${d.id_devolucion}">⛔ Rechazar</button>
           <button class="btn btn-sm btn-outline-secondary" data-acc="d-edit" data-id="${d.id_devolucion}">✏</button>`
        : (d.estado === 'Validada' && !d.nota_credito ? `<button class="btn btn-sm btn-outline-warning" data-acc="d-nota" data-id="${d.id_devolucion}">Nota de crédito</button>` : Vista.esc(d.nota_credito || '—'))}</td></tr>`);
  return `<article class="card p-3 lt-3d-in">${tabla(['#','Factura','Producto','Cant.','Motivo','Estado','Gestión'], filas, 'No hay solicitudes de devolución por ahora.')}</article>`;
}

/* ---- 4 · Soporte — GESTIÓN COMPLETA ---- */
async function modSoporte() {
  const lista = await Modelo.get('soporte.php');
  Estado.datos.soporte = lista;
  if (esCliente()) {
    return `<article class="card p-3 mb-3 lt-3d-in"><h6 class="fw-bold mb-2">🎧 Generar ticket de soporte</h6>
      <label class="form-label campo">Asunto<input id="soA" class="form-control" placeholder="Ej: no llegó mi pedido" maxlength="150"></label>
      <label class="form-label campo">Describe tu problema<textarea id="soM" class="form-control" rows="3" placeholder="Cuéntanos qué pasó"></textarea></label>
      <button class="btn btn-primary mt-2" data-acc="so-crear">Generar ticket</button></article>
      <article class="card p-3">${tabla(['#','Asunto','Estado','Respuesta del equipo','Fecha'],
        lista.map(t =>
          `<tr><td>${t.id_soporte}</td><td><strong>${Vista.esc(t.asunto)}</strong><br><small class="text-muted">${Vista.esc(t.mensaje)}</small></td>
           <td>${Vista.badge(t.estado)}</td><td>${t.respuesta ? `<span style="color:#7dffb0">${Vista.esc(t.respuesta)}</span>` : '—'}</td>
           <td>${Vista.fecha(t.fecha)}</td></tr>`), 'No tienes tickets todavía. Escríbenos si algo falla.')}</article>`;
  }
  return `<article class="card p-3 lt-3d-in">${tabla(['#','Cliente','Asunto','Estado','Asignado a','Fecha','Gestión'],
    lista.map(t =>
      `<tr><td>${t.id_soporte}</td><td>${Vista.esc((t.nombre || '') + ' ' + (t.apellido || ''))}</td>
       <td><strong>${Vista.esc(t.asunto)}</strong><br><small class="text-muted">${Vista.esc(t.mensaje)}</small>${t.respuesta ? `<br><small style="color:#7dffb0">↩ ${Vista.esc(t.respuesta)}</small>` : ''}</td>
       <td>${Vista.badge(t.estado)}</td><td>${t.id_asignado ? '#' + t.id_asignado : '—'}</td><td>${Vista.fecha(t.fecha)}</td>
       <td><button class="btn btn-sm btn-outline-secondary" data-acc="s-resp" data-id="${t.id_soporte}">⚙ Gestionar</button></td></tr>`),
    'No hay tickets abiertos.')}</article>`;
}
function abrirRespuesta(id) {
  const t = (Estado.datos.soporte || []).find(x => +x.id_soporte === +id) || {};
  abrirModal(`<h5 class="fw-bold">🎫 Gestionar ticket #${id}</h5><section class="row text-start g-2">
    <span class="col-md-6"><label class="form-label">Estado</label>
      <select id="soE" class="form-select">
        ${['Abierto','En proceso','Cerrado'].map(e => `<option ${t.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
      </select></span>
    <span class="col-md-6"><label class="form-label">Asignar a (ID de empleado/admin, opcional)</label>
      <input id="soA2" type="number" min="1" class="form-control" value="${t.id_asignado || ''}" placeholder="Ej: 2"></span>
    <span class="col-12"><label class="form-label">Respuesta para el cliente</label><textarea id="soR" class="form-control" rows="3">${Vista.esc(t.respuesta || '')}</textarea></span></section>
    <nav class="lt-modal-actions"><button class="btn btn-outline-secondary" onclick="cerrarModal()">Cancelar</button>
    <button class="btn btn-primary" data-acc="so-save" data-id="${id}">💾 Guardar gestión</button></nav>`);
}

/* ---- 5 · Reportes — RF011: Admin CONSULTA · Empleado GENERA ventas ---- */
async function modReportes() {
  if (esAdmin()) {
    return `<article class="card p-3 mb-3 lt-3d-in"><h6 class="fw-bold mb-2">📊 Consultar reportes</h6>
      <section class="row g-2 text-start">
        <span class="col-md-3"><label class="form-label">Tipo de reporte</label>
          <select id="rTipo" class="form-select"><option value="ventas">Ventas</option><option value="inventario">Inventario</option><option value="devoluciones">Devoluciones</option><option value="envios">Envíos</option></select></span>
        <span class="col-md-3"><label class="form-label">Desde (ventas)</label><input id="rDesde" type="date" class="form-control"></span>
        <span class="col-md-3"><label class="form-label">Hasta (ventas)</label><input id="rHasta" type="date" class="form-control"></span>
        <span class="col-md-3 d-flex align-items-end"><button class="btn btn-primary w-100" data-acc="r-consultar">Consultar</button></span>
      </section></article>
      <article class="card p-3 mb-3" id="rResultado">${Vista.empty('fa-table', 'Elige tipo y presiona Consultar. Podrás exportar el resultado en CSV.')}</article>
      <article class="card p-3"><h6 class="fw-bold mb-2">🗂 Reportes generados por empleados</h6><span id="rLista">Cargando…</span></article>`;
  }
  /* ---- EMPLEADO: GENERAR reportes de ventas por fecha, producto y cliente ---- */
  const [prods, clientes] = await Promise.all([Modelo.get('productos.php'), Modelo.get('clientes.php')]);
  return `<article class="card p-3 mb-3 lt-3d-in"><h6 class="fw-bold mb-2">📈 Generar reporte de ventas</h6>
    <section class="row g-2 text-start">
      <span class="col-md-3"><label class="form-label">Desde</label><input id="rDesde" type="date" class="form-control"></span>
      <span class="col-md-3"><label class="form-label">Hasta</label><input id="rHasta" type="date" class="form-control"></span>
      <span class="col-md-3"><label class="form-label">Producto (opcional)</label>
        <select id="rProd" class="form-select"><option value="0">Todos</option>${prods.map(p => `<option value="${p.id_producto}">${Vista.esc(p.nombre)}</option>`).join('')}</select></span>
      <span class="col-md-3"><label class="form-label">Cliente (opcional)</label>
        <select id="rCli" class="form-select"><option value="0">Todos</option>${clientes.map(c => `<option value="${c.id_cliente}">${Vista.esc(c.nombre)}</option>`).join('')}</select></span>
      <span class="col-12"><button class="btn btn-primary w-100" data-acc="r-crear">Generar reporte</button></span>
    </section></article>
    <article class="card p-3 mb-3" id="rResultado">${Vista.empty('fa-table', 'Define el rango y presiona Generar para ver el detalle y exportarlo.')}</article>
    <article class="card p-3"><h6 class="fw-bold mb-2">🗂 Mis reportes generados</h6><span id="rLista">Cargando…</span></article>`;
}
async function reportesLista() {
  const lista = await Modelo.get('reportes.php');
  const z = document.getElementById('rLista');
  if (!z) return;
  z.innerHTML = tabla(['#','Tipo','Rango','Total ventas','Facturas','Generado por','Fecha','Acciones'],
    lista.map(r => `<tr><td>${r.id_reporte}</td><td>${Vista.esc(r.tipo)}</td>
      <td>${Vista.esc(r.desde || '—')} → ${Vista.esc(r.hasta || '—')}</td>
      <td>${Vista.money(r.total_ventas)}</td><td>${r.cantidad_ventas}</td>
      <td>${Vista.esc((r.usuario_genera || '—') + ' ' + (r.apellido || ''))}</td><td>${Vista.fecha(r.fecha_creacion)}</td>
      <td class="text-nowrap"><button class="btn btn-sm btn-outline-warning me-1" data-acc="r-export" data-id="${r.id_reporte}">📥 Exportar</button>
      <button class="btn btn-sm btn-outline-danger" data-acc="r-del" data-id="${r.id_reporte}">🗑</button></td></tr>`),
    'Aún no hay reportes generados.');
}

/* ---- 7 · Perfil ---- */
function perfilAbrir() {
  const u = Estado.usuario;
  const fila = (l, v) => `<span class="pf"><small>${l}</small><b>${Vista.esc(v || '—')}</b></span>`;
  abrirModal(`<h5 class="fw-bold">Mi perfil</h5>
    <section class="perfil-grid2 mb-3">
      ${fila('Nombre', u.nombre + ' ' + u.apellido)}${fila('Rol', rol())}
      ${fila('Correo', u.email)}${fila('Documento', (u.tipo_documento || '') + ' ' + (u.numero_documento || ''))}
      ${fila('Dirección', u.direccion)}${fila('Teléfono', u.telefono)}</section>
    <nav class="lt-modal-actions"><button class="btn btn-outline-secondary" onclick="cerrarModal()">Cerrar</button>
    <button class="btn btn-primary" data-acc="p-edit">✏ Modificar datos</button></nav>`);
}
function perfilEditar() {
  const u = Estado.usuario;
  abrirModal(`<h5 class="fw-bold">✏ Modificar mis datos</h5><section class="row text-start g-2">
    <span class="col-md-6"><label class="form-label">Nombre</label><input id="pfN" class="form-control" value="${Vista.esc(u.nombre)}"></span>
    <span class="col-md-6"><label class="form-label">Apellido</label><input id="pfA" class="form-control" value="${Vista.esc(u.apellido)}"></span>
    <span class="col-md-6"><label class="form-label">Dirección</label><input id="pfD" class="form-control" value="${Vista.esc(u.direccion || '')}"></span>
    <span class="col-md-6"><label class="form-label">Teléfono</label><input id="pfT" class="form-control" value="${Vista.esc(u.telefono || '')}"></span></section>
    <nav class="lt-modal-actions"><button class="btn btn-outline-secondary" onclick="cerrarModal()">Cancelar</button>
    <button class="btn btn-primary" data-acc="p-save">💾 Guardar cambios</button></nav>`);
}

/* ---- 11 · ETIQUETAS Y RECIBOS (Logística) ---- */
function verEntrega(e, tipo) {
  abrirModal(`<h5 class="fw-bold">${tipo === 'Recibo' ? '🧾 Recibo de entrega' : '🏷 Etiqueta de envío'} ${Vista.esc(e.codigo)}</h5>
    <section id="entDoc" style="background:#fff;color:#111;padding:16px;border-radius:10px;font-family:Arial;text-align:left">
      <h3 style="margin:0 0 4px">LYON TECHNOLOGIES</h3>
      <p class="mb-1" style="font-size:12px;color:#555">Cra 56bis #78-12 · Bogotá D.C. · comercial@lyontechnologies.net</p><hr>
      <p class="mb-1"><b>${tipo === 'Recibo' ? 'RECIBO DE ENTREGA' : 'ETIQUETA DE ENVÍO'}</b> · Código: <b>${Vista.esc(e.codigo)}</b></p>
      <p class="mb-1">Pedido: <b>P-${e.id_pedido}</b></p>
      <p class="mb-1">Cliente: <b>${Vista.esc(e.cliente || '—')}</b></p>
      <p class="mb-1">Dirección: ${Vista.esc(e.direccion || '—')}</p>
      <p class="mb-1">Transportadora: ${Vista.esc(e.transportadora || 'Mercado Envios')}</p>
      <p class="mb-1">Fecha: ${new Date().toLocaleString()}</p>
      ${tipo === 'Recibo' ? `<p style="margin-top:14px">Recibido conforme: ___________________</p>`
        : `<p style="margin-top:14px;font-family:monospace;font-size:18px;letter-spacing:3px">|| ||| || || ||| ||||</p>`}
    </section>
    <nav class="lt-modal-actions"><button class="btn btn-outline-secondary" onclick="cerrarModal()">Cerrar</button>
    <button class="btn btn-primary" data-acc="ent-print">🖨 Imprimir</button></nav>`);
}

/* 8 · EVENTOS GLOBALES */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-acc],[data-promo],[data-mod],[data-avanzar],[data-delped]');
  if (!el) return;
  const d = el.dataset;
  try {
    if (d.mod && el.classList.contains('lt-mod-btn')) return abrirModulo(d.mod);
    if (el.hasAttribute('data-promo')) { Estado.promoSel = Estado.promoSel === +d.promo ? 0 : +d.promo; return abrirModulo('tienda'); }
    if (d.avanzar) { await Modelo.put('pedidos.php', { id: +d.avanzar, estado: d.est }); ltToast(`Pedido P-${d.avanzar} → ${d.est}`, 'ok'); return abrirModulo(Estado.modulo); }
    if (d.delped) { if (!confirm(`¿Eliminar pedido P-${d.delped}?`)) return; await Modelo.del('pedidos.php?id=' + d.delped); ltToast('Pedido eliminado', 'ok'); return abrirModulo(Estado.modulo); }
    if (!d.acc) return;
    switch (d.acc) {
      /* ---- Ventas / carrito ---- */
      case 'v-add': vAdd(); break;
      case 'c-quit': Estado.carrito.splice(+d.ix, 1); abrirModulo(Estado.modulo); break;
      case 'v-emitir': await vEmitir(); break;
      case 't-add': {
        const p = Estado.datos.productos.find(x => String(x.id_producto) === String(d.id));
        if (!p) break;
        const q = Math.max(1, parseInt(document.getElementById('cant-' + d.id)?.value || '1'));
        if (q > +p.cantidad) return ltToast(`Solo hay ${p.cantidad} unidades de "${p.nombre}".`, 'error');
        const ex = Estado.carrito.find(i => String(i.id_producto) === String(d.id));
        if (ex) ex.cant = Math.min(+p.cantidad, ex.cant + q);
        else Estado.carrito.push({ id_producto: p.id_producto, nombre: p.nombre, precio: +p.precio, cant: q });
        ltToast('✅ ' + p.nombre + ' agregado', 'ok');
        abrirModulo('tienda'); break;
      }
      case 't-finalizar': {
        if (!Estado.carrito.length) return ltToast('Tu carrito está vacío.', 'error');
        const dir = (document.getElementById('dirEnvio')?.value || '').trim();
        const r = await Modelo.post('ventas.php', { items: Estado.carrito.map(i => ({ id_producto: i.id_producto, cantidad: i.cant })), id_promocion: Estado.promoSel || 0, direccion_envio: dir });
        const venta = { id_venta: r.id_venta, numero: r.numero, fecha: new Date().toISOString(), estado: 'Activa',
          cliente_nombre: Estado.usuario.nombre + ' ' + Estado.usuario.apellido,
          subtotal: r.subtotal, descuento: r.descuento,
          iva: r.iva, total: r.total, items: Estado.carrito.map(i => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cant })), id_pedidos: r.id_pedidos };
        Estado.carrito = []; Estado.promoSel = 0;
        ltToast('✅ Compra exitosa: ' + r.numero + '. Tu factura ya está en el buzón.', 'ok');
        abrirModulo('facturas'); verFactura(venta); break;
      }
      case 'v-ver': {
        const v = Estado.ventas.find(x => String(x.id_venta) === String(d.id))
          || (String(Estado.facturaActual?.id_venta) === String(d.id) ? Estado.facturaActual : null);
        if (v) verFactura(v); break;
      }
      case 'v-print': {
        const v = Estado.ventas.find(x => String(x.id_venta) === String(d.id))
          || (String(Estado.facturaActual?.id_venta) === String(d.id) ? Estado.facturaActual : null);
        imprimirFactura(v); break;
      }
      case 'v-enviar':
        await Modelo.put('ventas.php', { id_venta: +d.id, accion: 'enviar' });
        ltToast('Factura marcada como ENVIADA 🚚', 'ok'); abrirModulo(Estado.modulo); break;
      case 'v-anular':
        if (confirm('¿Anular esta factura? El stock de los productos volverá al inventario.')) {
          await Modelo.put('ventas.php', { id_venta: +d.id, accion: 'anular' });
          ltToast('Factura anulada y stock devuelto', 'ok'); abrirModulo(Estado.modulo);
        } break;
      /* ---- CRUD entidades ---- */
      case 'e-crear': abrirFormEnt(d.ent, null); break;
      case 'e-edit': abrirFormEnt(d.ent, d.id); break;
      case 'e-del': await eliminarEnt(d.ent, d.id); break;
      case 'e-abs': abrirAbastecer(d.id); break;
      case 'abs-save': {
        const cuerpo = { id_producto: +d.id, abastecer: +document.getElementById('abC').value };
        const min = document.getElementById('abM')?.value;
        if (min !== '' && min !== null && !isNaN(+min)) cuerpo.stock_minimo = +min;
        await Modelo.put('productos.php', cuerpo);
        ltToast('📦 Inventario abastecido', 'ok'); cerrarModal(); abrirModulo(Estado.modulo); break;
      }
      /* ---- Historial de movimientos (CU004 paso 5) ---- */
      case 'p-mov': {
        const r = await Modelo.get('productos.php?op=movimientos&id=' + d.id);
        const p = (Estado.datos.productos || []).find(x => String(x.id_producto) === String(d.id)) || {};
        abrirModal(`<h5 class="fw-bold">📜 Movimientos — ${Vista.esc(p.nombre || ('#' + d.id))}</h5>
          ${tabla(['Fecha','Movimiento','Cantidad'],
          r.map(m => `<tr><td>${Vista.fecha(m.fecha)}</td><td>${Vista.esc(m.detalle)}</td>
          <td style="color:${+m.cantidad > 0 ? '#7dffb0' : '#ff9a9a'}">${+m.cantidad > 0 ? '+' : ''}${m.cantidad}</td></tr>`),
          'Sin movimientos registrados para este producto.')}`); break;
      }
      /* ---- Devoluciones: GESTIÓN COMPLETA ---- */
      case 'd-enviar': {
        const idV = +document.getElementById('dvV').value, idI = +document.getElementById('dvI').value;
        if (!idV || !idI) return ltToast('Selecciona factura y producto.', 'error');
        await Modelo.post('devoluciones.php', { id_venta: idV, id_item: idI,
          cantidad: +document.getElementById('dvC').value,
          motivo: document.getElementById('dvM').value.trim() });
        ltToast('Solicitud enviada: un empleado la gestionará pronto.', 'ok');
        abrirModulo('devoluciones'); break;
      }
      case 'd-validar': {
        const r = await Modelo.put('devoluciones.php', { id_devolucion: +d.id, accion: 'validar' });
        ltToast(`✅ Devolución validada · factura ${r.venta} · reembolso ${Vista.money(r.monto_reembolsado)}`, 'ok');
        abrirModulo(Estado.modulo); break;
      }
      case 'd-rechazar': {
        const razon = prompt('Razón del rechazo (opcional):');
        if (razon === null) break;
        await Modelo.put('devoluciones.php', { id_devolucion: +d.id, accion: 'rechazar', razon: razon.trim() });
        ltToast('Devolución rechazada', 'ok'); abrirModulo(Estado.modulo); break;
      }
      case 'd-edit': {
        const x = (Estado.datos.devoluciones || []).find(v => +v.id_devolucion === +d.id) || {};
        abrirModal(`<h5>Modificar devolución #${d.id}</h5><label class="form-label campo">Cantidad<input id="dvEditC" type="number" min="1" value="${x.cantidad || 1}" class="form-control"></label><label class="form-label campo">Motivo<input id="dvEditM" class="form-control" value="${Vista.esc(x.motivo || '')}"></label><button class="btn btn-primary mt-2" data-acc="d-save" data-id="${d.id}">Guardar</button>`); break;
      }
      case 'd-save': {
        await Modelo.put('devoluciones.php', { id_devolucion: +d.id, accion: 'editar',
          cantidad: +document.getElementById('dvEditC').value,
          motivo: document.getElementById('dvEditM').value.trim() });
        cerrarModal(); ltToast('Devolución actualizada', 'ok'); abrirModulo('devoluciones'); break;
      }
      case 'd-del': { if (confirm('¿Cancelar esta devolución pendiente?')) { await Modelo.del('devoluciones.php?id=' + d.id); abrirModulo('devoluciones'); } break; }
      case 'd-nota': {
        const r = await Modelo.put('devoluciones.php', { id_devolucion: +d.id, accion: 'nota' });
        ltToast('Nota de crédito ' + r.nota_credito + ' generada', 'ok');
        abrirModulo(Estado.modulo); break;
      }
      /* ---- Soporte: GESTIÓN COMPLETA ---- */
      case 'so-crear':
        await Modelo.post('soporte.php',
          { asunto: document.getElementById('soA').value.trim(), mensaje: document.getElementById('soM').value.trim() });
        ltToast('🎫 Ticket generado', 'ok'); abrirModulo('soporte'); break;
      case 's-resp': abrirRespuesta(d.id); break;
      case 'so-save': {
        const cuerpo = { id_soporte: +d.id,
          estado: document.getElementById('soE').value,
          respuesta: document.getElementById('soR').value.trim() };
        const asig = document.getElementById('soA2')?.value;
        if (asig) cuerpo.asignar = +asig;
        await Modelo.put('soporte.php', cuerpo);
        ltToast('Ticket gestionado ✔', 'ok'); cerrarModal(); abrirModulo(Estado.modulo); break;
      }
      /* ---- Etiquetas / Recibos (Logística) ---- */
      case 'ent-crear': {
        const r = await Modelo.post('entregas.php', { id_pedido: +d.id, tipo: d.tipo });
        ltToast('✅ ' + d.tipo + ' ' + r.codigo + ' generada', 'ok');
        verEntrega(r, d.tipo); break;
      }
      case 'ent-print': {
        const z = document.getElementById('ltPrintZone');
        z.innerHTML = document.getElementById('entDoc').outerHTML;
        window.print(); z.innerHTML = '';
        ltToast('🖨 Documento enviado a impresión', 'ok'); break;
      }
      /* ---- Reportes (RF011) ---- */
      case 'r-consultar': {
        const tipo = document.getElementById('rTipo').value;
        const qs = new URLSearchParams({ op: 'consultar', tipo: tipo,
          desde: document.getElementById('rDesde').value, hasta: document.getElementById('rHasta').value }).toString();
        const r = await Modelo.get('reportes.php?' + qs);
        const z = document.getElementById('rResultado');
        z.innerHTML = tabla(r.head.map(h => h.replace(/_/g, ' ')),
          r.filas.map(f => `<tr>${r.head.map(h => `<td>${Vista.esc(f[h] ?? '—')}</td>`).join('')}</tr>`),
          'No hay información para los parámetros seleccionados.')
          + `<button class="btn btn-outline-warning mt-2" data-acc="r-export-cons">📥 Exportar CSV</button>`;
        Estado.ultimoQuery = qs; break;
      }
      case 'r-crear': {
        const r = await Modelo.post('reportes.php', {
          desde: document.getElementById('rDesde').value, hasta: document.getElementById('rHasta').value,
          id_producto: +document.getElementById('rProd').value || 0,
          id_cliente: +document.getElementById('rCli').value || 0 });
        const z = document.getElementById('rResultado');
        z.innerHTML = `<p class="mb-2">✅ Reporte #${r.id_reporte} generado · <strong>${r.cantidad_ventas}</strong> factura(s) · Total: <strong>${Vista.money(r.total_ventas)}</strong></p>`
          + tabla(r.head, r.filas.map(f => `<tr>${r.head.map(h => `<td>${Vista.esc(f[h] ?? '—')}</td>`).join('')}</tr>`), '')
          + `<button class="btn btn-outline-warning mt-2" data-acc="r-export" data-id="${r.id_reporte}">📥 Exportar CSV</button>`;
        ltToast('Reporte generado', 'ok'); reportesLista(); break;
      }
      case 'r-export': window.location.href = Modelo.base() + 'reportes.php?export=' + d.id; break;
      case 'r-export-cons': window.location.href = Modelo.base() + 'reportes.php?' + (Estado.ultimoQuery || 'op=consultar&tipo=ventas') + '&export=1'; break;
      case 'r-del':
        if (confirm('¿Eliminar este reporte?')) { await Modelo.del('reportes.php?id=' + d.id); reportesLista(); }
        break;
      /* ---- Pedidos ---- */
      case 'ped-crear': {
        const c = document.getElementById('pedCli').value.trim(), dir2 = document.getElementById('pedDir').value.trim();
        if (!c || !dir2) return ltToast('Completa cliente y dirección.', 'error');
        await Modelo.post('pedidos.php', { cliente: c, direccion: dir2 });
        ltToast('Pedido creado', 'ok'); abrirModulo('pedidos'); break;
      }
      /* ---- Perfil ---- */
      case 'p-edit': perfilEditar(); break;
      case 'p-save':
        await Modelo.put('perfil.php', { nombre: document.getElementById('pfN').value.trim(),
          apellido: document.getElementById('pfA').value.trim(),
          direccion: document.getElementById('pfD').value.trim(),
          telefono: document.getElementById('pfT').value.trim() });
        Estado.usuario = await Modelo.get('auth.php?action=current');
        document.getElementById('dashWelcome').textContent = `Hola, ${Estado.usuario.nombre} — ${rol()}`;
        ltToast('✅ Perfil actualizado', 'ok'); cerrarModal(); perfilAbrir(); break;
    }
  } catch (err) { ltToast(err.message, 'error'); }
});
document.addEventListener('change', e => {
  /* Devoluciones: al elegir factura, cargar sus productos */
  if (e.target.id === 'dvV') {
    const v = Estado.devVentas.find(x => String(x.id_venta) === e.target.value);
    const s = document.getElementById('dvI');
    s.innerHTML = (v && v.items.length)
      ? v.items.map(i => `<option value="${i.id_item}">${Vista.esc(i.nombre)} (compraste ${i.cantidad})</option>`).join('')
      : '<option value="">Esta factura no tiene productos</option>';
  }
  /* Ventas: al cambiar promoción, recalcular carrito */
  if (e.target.id === 'vPromo') {
    Estado.promoSel = +e.target.value || 0;
    const c = document.getElementById('vCarrito');
    if (c) c.innerHTML = carritoHTML('vDir', 'v-emitir', '💾 Emitir factura');
  }
});