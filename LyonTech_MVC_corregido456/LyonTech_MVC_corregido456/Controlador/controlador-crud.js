/* ============================================================
  Controlador/controlador-crud.js — CRUD de entidades (sin <div>)
  usuarios · clientes · productos · promociones · proveedores
  + vista especial de productos y abastecimiento (Proveedor)
  ✔ Abastecer incluye stock mínimo (CU004)
  ✔ Botón 📜 historial de movimientos (CU004 paso 5)
============================================================ */

/* ---- Configuración de cada entidad (tabla, campos, columnas) ---- */
const ENT = {
  usuarios: { api: 'usuarios.php', id: 'id_usuario', titulo: 'usuario',
    head: ['#','Nombre','Documento','Correo','Rol','Estado'],
    cols: [ r => r.id_usuario,
            r => `<strong>${Vista.esc(r.nombre)}</strong> ${Vista.esc(r.apellido)}`,
            r => Vista.esc(r.tipo_documento + ' ' + r.numero_documento),
            r => Vista.esc(r.email),
            r => Vista.badge(r.rol), r => Vista.badge(r.estado) ],
    campos: [
      { n:'nombre', l:'Nombre', req:1 }, { n:'apellido', l:'Apellido', req:1 },
      { n:'tipo_documento', l:'Tipo de documento', t:'select', op:['CC','TI','CE'], req:1 },
      { n:'numero_documento', l:'Número de documento', req:1 },
      { n:'email', l:'Correo', t:'email', req:1 },
      { n:'password', l:'Contraseña', t:'password', req:0 },
      { n:'rol', l:'Rol', t:'select', op:['Administrador','Empleado','Proveedor','Cliente'], req:1 },
      { n:'direccion', l:'Dirección', req:1 }, { n:'telefono', l:'Teléfono', req:1 },
      { n:'estado', l:'Estado', t:'select', op:['Activo','Inactivo'], solo:'editar' } ] },

  clientes: { api: 'clientes.php', id: 'id_cliente', titulo: 'cliente',
    head: ['#','Nombre','Correo','Teléfono'],
    cols: [ r => r.id_cliente, r => `<strong>${Vista.esc(r.nombre)}</strong>`,
            r => Vista.esc(r.email || '—'), r => Vista.esc(r.telefono || '—') ],
    campos: [ { n:'nombre', l:'Nombre', req:1 }, { n:'email', l:'Correo', t:'email' }, { n:'telefono', l:'Teléfono' } ] },

  productos: { api: 'productos.php', id: 'id_producto', titulo: 'producto',
    head: ['','Producto','Precio','Costo','Stock','Mín.','Estado'],
    cols: [ r => Vista.thumb(r),
            r => `<strong>${Vista.esc(r.nombre)}</strong><br><small class="text-muted">${Vista.esc(r.descripcion || '')}</small>`,
            r => Vista.money(r.precio), r => Vista.money(r.costo),
            r => (+r.cantidad <= +r.stock_minimo ? '⚠️ ' : '') + r.cantidad, r => r.stock_minimo,
            r => Vista.badge(r.estado) ],
    campos: [
      { n:'nombre', l:'Nombre', req:1 }, { n:'descripcion', l:'Descripción', t:'textarea' },
      { n:'precio', l:'Precio', t:'number', req:1, num:1 },
      { n:'costo', l:'Costo', t:'number', req:1, num:1 },
      { n:'cantidad', l:'Cantidad en stock', t:'number', req:1, num:1 },
      { n:'stock_minimo', l:'Stock mínimo', t:'number', req:1, num:1 },
      { n:'estado', l:'Estado', t:'select', op:['Activo','Inactivo'], solo:'editar' } ] },

  promociones: { api: 'promociones.php', id: 'id_promocion', titulo: 'promoción',
    head: ['#','Nombre','Descuento','Inicio','Fin','Estado'],
    cols: [ r => r.id_promocion, r => `<strong>${Vista.esc(r.nombre)}</strong>`,
            r => '—' + r.descuento + '%',
            r => Vista.esc(r.fecha_inicio), r => Vista.esc(r.fecha_fin), r => Vista.badge(r.estado) ],
    campos: [
      { n:'id_producto', l:'Producto existente', t:'producto', req:1 },
      { n:'nombre', l:'Nombre de la promoción', req:1 },
      { n:'descuento', l:'Descuento (%)', t:'number', req:1, num:1 },
      { n:'fecha_inicio', l:'Fecha inicio', t:'date', req:1 },
      { n:'fecha_fin', l:'Fecha fin', t:'date', req:1 },
      { n:'estado', l:'Estado', t:'select', op:['Activa','Inactiva'], solo:'editar' } ] },

  proveedores: { api: 'proveedores.php', id: 'id_proveedor', titulo: 'proveedor',
    head: ['#','Nombre','Contacto','Productos que suministra'],
    cols: [ r => r.id_proveedor, r => `<strong>${Vista.esc(r.nombre)}</strong>`,
            r => Vista.esc(r.contacto || '—'), r => `<small class="text-muted">${Vista.esc(r.productos || '—')}</small>` ],
    campos: [ { n:'nombre', l:'Nombre', req:1 }, { n:'contacto', l:'Contacto' },
      { n:'productos', l:'Productos que suministra', t:'textarea', hint:'Separados por coma' } ] }
};

/* ---- CRUD genérico ---- */
async function modEntidad(ent) {
  const cfg = ENT[ent];
  const lista = await Modelo.get(cfg.api);
  Estado.datos[ent] = lista;
  if (ent === 'promociones') Estado.datos.productos = await Modelo.get('productos.php');
  const filas = lista.map(r => `<tr>${cfg.cols.map(c => `<td>${c(r)}</td>`).join('')}
      <td class="text-nowrap"><button class="btn btn-sm btn-outline-secondary me-1" data-acc="e-edit" data-ent="${ent}" data-id="${r[cfg.id]}">✏ Modificar</button>
      ${esAdmin() ? `<button class="btn btn-sm btn-outline-danger" data-acc="e-del" data-ent="${ent}" data-id="${r[cfg.id]}">🗑</button>` : ''}</td></tr>`);
  return `<article class="card p-3 lt-3d-in">
    <nav class="lt-toolbar"><span class="text-muted small">${lista.length} registro(s)</span>
    <button class="btn btn-primary" data-acc="e-crear" data-ent="${ent}">➕ Nuevo ${cfg.titulo}</button></nav>
    ${tabla(cfg.head, filas, 'Aún no hay ' + cfg.titulo + 's. Usa «➕ Nuevo» para crear el primero.')}</article>`;
}
function abrirFormEnt(ent, id) {
  const cfg = ENT[ent];
  const datos = id ? (Estado.datos[ent] || []).find(r => String(r[cfg.id]) === String(id)) || {} : {};
  const campos = cfg.campos.filter(c => id ? c.solo !== 'crear' : c.solo !== 'editar');
  const body = campos.map(c => {
    const v = datos[c.n] ?? '';
    let inp;
    if (c.t === 'select') inp = `<select class="form-select" name="${c.n}">${c.op.map(o => `<option ${String(v) === String(o) ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    else if (c.t === 'producto') inp = `<select class="form-select" name="id_producto" required><option value="">Selecciona un producto existente</option>${(Estado.datos.productos || []).filter(p => p.estado !== 'Inactivo').map(p => `<option value="${p.id_producto}" ${String(v) === String(p.id_producto) ? 'selected' : ''}>${Vista.esc(p.nombre)}</option>`).join('')}</select>`;
    else if (c.t === 'textarea') inp = `<textarea class="form-control" name="${c.n}" rows="2" placeholder="${Vista.esc(c.hint || '')}">${Vista.esc(v)}</textarea>`;
    // ✔ la contraseña solo es "required" al CREAR, no al editar
    else inp = `<input class="form-control" name="${c.n}" type="${c.t || 'text'}" value="${Vista.esc(v)}" ${(c.req || (ent === 'usuarios' && c.n === 'password' && !id)) ? 'required' : ''}>`;
    return `<span class="col-md-6 mb-2"><label class="form-label">${c.l}</label>${inp}</span>`;
  }).join('');

  abrirModal(`<h5 class="fw-bold">${id ? '✏ Modificar' : '➕ Nuevo'} ${cfg.titulo}${id ? ' #' + id : ''}</h5>
    <form id="formEnt" data-ent="${ent}" ${id ? 'data-id="' + id + '"' : ''} class="row text-start">${body}
      <span class="col-12 d-flex gap-2 justify-content-end mt-2">
      <button type="button" class="btn btn-outline-secondary" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-primary">💾 Guardar cambios</button></span></form>`);
  document.getElementById('formEnt').addEventListener('submit', guardarEnt);
}
async function guardarEnt(e) {
  e.preventDefault();
  const f = e.target, ent = f.dataset.ent, id = f.dataset.id, cfg = ENT[ent];
  const fd = Object.fromEntries(new FormData(f).entries());
  const cuerpo = {};
  cfg.campos.forEach(c => { if (c.n in fd && !(c.n === 'password' && !fd[c.n])) cuerpo[c.n] = c.num ? Number(fd[c.n]) : fd[c.n]; });
  try {
    if (id) { cuerpo[cfg.id] = Number(id); await Modelo.put(cfg.api, cuerpo); }
    else await Modelo.post(cfg.api, cuerpo);
    ltToast('✅ Cambios guardados correctamente', 'ok'); cerrarModal(); abrirModulo(Estado.modulo);
  } catch (err) { ltToast(err.message, 'error'); }
}
async function eliminarEnt(ent, id) {
  const cfg = ENT[ent];
  if (!confirm(`¿Eliminar ${cfg.titulo} #${id}? Esta acción no se puede deshacer.`)) return;
  try {
    await Modelo.del(cfg.api + '?id=' + id);
    ltToast('🗑 Registro eliminado', 'ok');
    abrirModulo(Estado.modulo);
  } catch (err) { ltToast(err.message, 'error'); }
}

/* ---- Productos: Admin/Empleado CRUD · Proveedor SOLO abastece ---- */
async function modProductos() {
  const lista = await Modelo.get('productos.php');
  Estado.datos.productos = lista;
  if (rol() === 'Proveedor') {
    const filas = lista.map(p => `<tr><td style="width:64px">${Vista.thumb(p)}</td>
      <td><strong>${Vista.esc(p.nombre)}</strong></td><td>${p.cantidad}</td><td>${p.stock_minimo}</td>
      <td><button class="btn btn-sm btn-outline-warning" data-acc="e-abs" data-id="${p.id_producto}"><i class="fas fa-plus"></i> Abastecer</button></td></tr>`);
    return `<article class="card p-3 lt-3d-in">${tabla(['','Producto','Stock','Mínimo','Acción'], filas, 'No hay productos en el catálogo todavía.')}</article>`;
  }
  const filas = lista.map(p => `<tr ${+p.cantidad <= +p.stock_minimo ? 'style="background:rgba(255,138,30,.08)"' : ''}>
      <td style="width:64px">${Vista.thumb(p)}</td>
      <td><strong>${Vista.esc(p.nombre)}</strong><br><small class="text-muted">${Vista.esc(p.descripcion || '')}</small></td>
      <td>${Vista.money(p.precio)}</td><td>${Vista.money(p.costo)}</td>
      <td>${+p.cantidad <= +p.stock_minimo ? '⚠️ ' : ''}${p.cantidad}</td><td>${p.stock_minimo}</td><td>${Vista.badge(p.estado)}</td>
      <td class="text-nowrap"><button class="btn btn-sm btn-outline-secondary me-1" data-acc="e-edit" data-ent="productos" data-id="${p.id_producto}">✏</button>
      <button class="btn btn-sm btn-outline-info me-1" data-acc="p-mov" data-id="${p.id_producto}" title="Historial de movimientos">📜</button>
      ${esAdmin() ? `<button class="btn btn-sm btn-outline-danger" data-acc="e-del" data-ent="productos" data-id="${p.id_producto}">🗑</button>` : ''}</td></tr>`);
  return `<article class="card p-3 lt-3d-in">
    <nav class="lt-toolbar"><span class="text-muted small">${lista.length} productos · filas resaltadas = stock bajo</span>
    <button class="btn btn-primary" data-acc="e-crear" data-ent="productos">➕ Nuevo producto</button></nav>
    ${tabla(ENT.productos.head, filas, 'Aún no hay productos. Crea el primero.')}</article>`;
}
function abrirAbastecer(id) {
  const p = (Estado.datos.productos || []).find(x => String(x.id_producto) === String(id));
  abrirModal(`<h5 class="fw-bold">📦 Abastecer — ${Vista.esc(p?.nombre || '')}</h5>
    <label class="form-label campo">Cantidad a agregar al inventario
      <input id="abC" type="number" min="1" value="10" class="form-control"></label>
    <label class="form-label campo">Nuevo stock mínimo (opcional · vacío = sin cambio)
      <input id="abM" type="number" min="0" value="${p?.stock_minimo ?? ''}" class="form-control"></label>
    <nav class="lt-modal-actions"><button class="btn btn-outline-secondary" onclick="cerrarModal()">Cancelar</button>
    <button class="btn btn-primary" data-acc="abs-save" data-id="${id}">Confirmar abastecimiento</button></nav>`);
}