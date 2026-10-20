<?php
// api/devoluciones.php — RF007 · GESTIÓN COMPLETA
// Cliente: solicita / edita / cancela las suyas
// Staff:   valida (reembolso+stock+factura) · rechaza · nota de crédito
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    /* ---------------- GET ---------------- */
    if ($method === 'GET') {
        $s = requireRole(['Administrador', 'Empleado', 'Cliente']);
        if ($s['rol'] === 'Cliente') {
            $st = db()->prepare('SELECT d.*, v.numero AS venta_numero, i.nombre AS producto_nombre, i.precio
                                 FROM devoluciones d
                                 JOIN ventas v           ON v.id_venta = d.id_venta
                                 LEFT JOIN venta_items i ON i.id_item  = d.id_item
                                 WHERE v.id_usuario = ?
                                    OR v.id_cliente = (SELECT id_cliente FROM clientes WHERE email = ? LIMIT 1)
                                 ORDER BY d.id_devolucion DESC');
            $st->execute([$s['id_usuario'], $s['email']]);
            jsonOk($st->fetchAll());
        }
        jsonOk(db()->query('SELECT d.*, v.numero AS venta_numero, i.nombre AS producto_nombre, i.precio, c.nombre AS cliente_nombre
                            FROM devoluciones d
                            LEFT JOIN ventas v      ON v.id_venta   = d.id_venta
                            LEFT JOIN venta_items i ON i.id_item    = d.id_item
                            LEFT JOIN clientes c    ON c.id_cliente = v.id_cliente
                            ORDER BY d.id_devolucion DESC')->fetchAll());
    }

    /* ---------------- POST: solicitar ---------------- */
    if ($method === 'POST') {
        $s = requireRole(['Administrador', 'Empleado', 'Cliente']);
        $idVenta  = (int)($body['id_venta'] ?? 0);
        $idItem   = (int)($body['id_item'] ?? 0);
        $cantidad = (int)($body['cantidad'] ?? 0);
        $motivo   = vStr($body, 'motivo', 255);
        if ($idVenta <= 0 || $idItem <= 0 || $cantidad <= 0) jsonError('Factura, producto y cantidad son obligatorios.');

        $st = db()->prepare('SELECT v.estado, v.numero, v.id_usuario, v.id_cliente,
                                    i.id_producto, i.nombre, i.cantidad, i.precio, i.descuento_pct
                             FROM ventas v JOIN venta_items i ON i.id_venta = v.id_venta
                             WHERE v.id_venta = ? AND i.id_item = ?');
        $st->execute([$idVenta, $idItem]);
        $row = $st->fetch();
        if (!$row) jsonError('La factura o el producto no existen.');
        if (($s['rol'] ?? '') === 'Cliente') {
            $stc = db()->prepare('SELECT id_cliente FROM clientes WHERE email = ? LIMIT 1');
            $stc->execute([$s['email']]);
            $myCliente = (int)($stc->fetch()['id_cliente'] ?? 0);
            $propia = ((int)$row['id_usuario'] === (int)$s['id_usuario'])
                   || ($myCliente > 0 && (int)$row['id_cliente'] === $myCliente);
            if (!$propia) jsonError('Solo puedes solicitar devoluciones de tus propias compras.', 403);
        }
        if ($row['estado'] === 'Anulada') jsonError('No se pueden devolver productos de una factura anulada.');

        $sum = db()->prepare("SELECT COALESCE(SUM(cantidad),0) devuelto FROM devoluciones WHERE id_item = ? AND estado = 'Validada'");
        $sum->execute([$idItem]);
        $devueltoTotal = (int)($sum->fetch()['devuelto'] ?? 0);
        if ($cantidad > ((int)$row['cantidad'] - $devueltoTotal)) jsonError('La cantidad excede lo que queda disponible para devolver.');

        db()->prepare('INSERT INTO devoluciones (id_venta, id_item, cantidad, motivo) VALUES (?,?,?,?)')
            ->execute([$idVenta, $idItem, $cantidad, $motivo]);
        logBD('Devolución solicitada: ' . $row['numero'] . ' — ' . $row['nombre'] . ' x ' . $cantidad, 'CREAR', 'Devoluciones');
        jsonOk(['id_devolucion' => (int)db()->lastInsertId()]);
    }

    /* ---------------- PUT: editar · validar · rechazar · nota ---------------- */
    if ($method === 'PUT') {
        $s = requireRole(['Administrador', 'Empleado', 'Cliente']);
        $id     = (int)($body['id_devolucion'] ?? 0);
        $accion = $body['accion'] ?? '';
        if ($id <= 0) jsonError('Devolución no especificada.');

        $st = db()->prepare('SELECT d.*, v.numero AS venta_numero, v.id_cliente, v.id_usuario, v.id_venta,
                                    i.nombre AS producto_nombre, i.id_producto, i.precio,
                                    i.cantidad AS cantidad_original, i.descuento_pct
                             FROM devoluciones d
                             LEFT JOIN ventas v      ON v.id_venta = d.id_venta
                             LEFT JOIN venta_items i ON i.id_item  = d.id_item
                             WHERE d.id_devolucion = ?');
        $st->execute([$id]);
        $d = $st->fetch();
        if (!$d) jsonError('Devolución no encontrada.', 404);

        /* ---- editar solicitud pendiente (dueño o staff) ---- */
        if ($accion === 'editar') {
            if ($d['estado'] !== 'Pendiente') jsonError('Solo puedes editar devoluciones pendientes.');
            if (($s['rol'] ?? '') === 'Cliente') {
                $stc = db()->prepare('SELECT id_cliente FROM clientes WHERE email = ? LIMIT 1');
                $stc->execute([$s['email']]);
                $myCliente = (int)($stc->fetch()['id_cliente'] ?? 0);
                if ((int)$d['id_usuario'] !== (int)$s['id_usuario'] && (int)$d['id_cliente'] !== $myCliente)
                    jsonError('No puedes editar esta devolución.', 403);
            }
            $cantidad = (int)($body['cantidad'] ?? 0);
            $motivo   = trim((string)($body['motivo'] ?? ''));
            if ($cantidad <= 0) jsonError('Cantidad inválida.');
            if ($motivo === '') jsonError('El motivo es obligatorio.');
            $sum = db()->prepare("SELECT COALESCE(SUM(cantidad),0) devuelto FROM devoluciones WHERE id_item = ? AND estado = 'Validada'");
            $sum->execute([(int)$d['id_item']]);
            $ya = (int)($sum->fetch()['devuelto'] ?? 0);
            if ($cantidad > ((int)($d['cantidad_original'] ?? $d['cantidad']) - $ya))
                jsonError('La cantidad excede lo disponible para devolver.');
            db()->prepare('UPDATE devoluciones SET cantidad = ?, motivo = ? WHERE id_devolucion = ?')
                ->execute([$cantidad, $motivo, $id]);
            logBD('Devolución #' . $id . ' editada', 'EDITAR', 'Devoluciones');
            jsonOk(['actualizado' => true]);
        }

        /* ---- ✔ RECHAZAR (gestión completa · solo staff) ---- */
        if ($accion === 'rechazar') {
            if (($s['rol'] ?? '') === 'Cliente') jsonError('No tienes permisos para esta acción.', 403);
            if ($d['estado'] !== 'Pendiente') jsonError('Solo puedes rechazar devoluciones pendientes.');
            $razon = trim((string)($body['razon'] ?? ''));
            db()->prepare("UPDATE devoluciones SET estado = 'Rechazada' WHERE id_devolucion = ?")->execute([$id]);
            logBD('Devolución #' . $id . ' RECHAZADA' . ($razon !== '' ? ' — ' . $razon : ''), 'EDITAR', 'Devoluciones');
            jsonOk(['rechazada' => true]);
        }

        /* ---- validar: reembolso + stock + ajuste de factura (solo staff) ---- */
        if ($accion === 'validar') {
            if (($s['rol'] ?? '') === 'Cliente') jsonError('No tienes permisos para esta acción.', 403);
            if ($d['estado'] !== 'Pendiente') jsonError('La devolución ya fue validada.');
            $pdo = db();
            $pdo->beginTransaction();
            try {
                $sump = $pdo->prepare("SELECT COALESCE(SUM(cantidad),0) total FROM devoluciones WHERE id_item = ? AND estado = 'Validada'");
                $sump->execute([(int)$d['id_item']]);
                $yaDevuelto = (int)($sump->fetch()['total'] ?? 0);
                if ((int)$d['cantidad'] > ((int)$d['cantidad_original'] - $yaDevuelto)) {
                    $pdo->rollBack();
                    jsonError('La devolución supera la cantidad todavía disponible para devolver.');
                }

                $subtotalLinea  = round((float)$d['precio'] * (int)$d['cantidad'], 2);
                $descuentoLinea = round($subtotalLinea * (int)($d['descuento_pct'] ?? 0) / 100, 2);
                $montoReembolso = round(($subtotalLinea - $descuentoLinea) * 1.19, 2);

                $pdo->prepare("UPDATE devoluciones SET estado = 'Validada', monto_reembolsado = ?, id_usuario_valida = ? WHERE id_devolucion = ?")
                    ->execute([$montoReembolso, $_SESSION['id_usuario'] ?? null, $id]);

                if (!empty($d['id_producto'])) {
                    $pdo->prepare('UPDATE productos SET cantidad = cantidad + ? WHERE id_producto = ?')
                        ->execute([(int)$d['cantidad'], (int)$d['id_producto']]);
                }
                if (!empty($d['id_cliente'])) {
                    $pdo->prepare('UPDATE clientes SET saldo = saldo + ? WHERE id_cliente = ?')
                        ->execute([$montoReembolso, (int)$d['id_cliente']]);
                }

                $idVenta = (int)$d['id_venta'];
                $stSub = $pdo->prepare('SELECT i.cantidad, i.precio, i.descuento_pct,
                                               COALESCE((SELECT SUM(x.cantidad) FROM devoluciones x
                                                         WHERE x.id_item = i.id_item AND x.estado = "Validada"), 0) AS devuelto
                                        FROM venta_items i WHERE i.id_venta = ?');
                $stSub->execute([$idVenta]);
                $nuevoSubtotal = 0.0; $nuevoDescuento = 0.0; $todoDevuelto = true;
                foreach ($stSub->fetchAll() as $it) {
                    $restante = max(0, (int)$it['cantidad'] - (int)$it['devuelto']);
                    if ($restante > 0) $todoDevuelto = false;
                    $lineSub = (float)$it['precio'] * $restante;
                    $nuevoSubtotal  += $lineSub;
                    $nuevoDescuento += round($lineSub * (int)($it['descuento_pct'] ?? 0) / 100, 2);
                }
                $nuevoSubtotal  = round($nuevoSubtotal, 2);
                $nuevoDescuento = round($nuevoDescuento, 2);
                if ($todoDevuelto) {
                    $pdo->prepare("UPDATE ventas SET estado = 'Anulada', subtotal = 0, descuento = 0, iva = 0, total = 0 WHERE id_venta = ?")
                        ->execute([$idVenta]);
                    $logDetalle = 'ANULADA por devolución total';
                } else {
                    $base  = round($nuevoSubtotal - $nuevoDescuento, 2);
                    $iva   = round($base * 0.19, 2);
                    $total = round($base + $iva, 2);
                    $pdo->prepare("UPDATE ventas SET estado = 'Ajustada', subtotal = ?, descuento = ?, iva = ?, total = ? WHERE id_venta = ?")
                        ->execute([$nuevoSubtotal, $nuevoDescuento, $iva, $total, $idVenta]);
                    $logDetalle = 'AJUSTADA — nuevo total ' . $total;
                }
                $pdo->commit();
            } catch (Exception $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                throw $e;
            }
            logBD('Devolución validada: ' . $d['venta_numero'] . ' → ' . $logDetalle . ' · reembolso ' . $montoReembolso, 'EDITAR', 'Devoluciones');
            jsonOk(['validada' => true, 'venta' => $logDetalle, 'monto_reembolsado' => $montoReembolso]);
        }

        /* ---- nota de crédito (solo staff) ---- */
        if ($accion === 'nota') {
            if (($s['rol'] ?? '') === 'Cliente') jsonError('No tienes permisos para esta acción.', 403);
            if ($d['estado'] !== 'Validada') jsonError('Primero debes validar la devolución.');
            if (!empty($d['nota_credito'])) jsonError('Ya tiene nota de crédito: ' . $d['nota_credito']);
            $nc = 'NC-' . date('Ymd') . '-' . random_int(100, 999);
            db()->prepare('UPDATE devoluciones SET nota_credito = ? WHERE id_devolucion = ?')->execute([$nc, $id]);
            logBD('Nota de crédito ' . $nc . ' para factura ' . $d['venta_numero'], 'CREAR', 'Devoluciones');
            jsonOk(['nota_credito' => $nc]);
        }

        jsonError('Acción no válida.');
    }

    /* ---------------- DELETE: cancelar pendiente ---------------- */
    if ($method === 'DELETE') {
        $s = requireRole(['Administrador', 'Empleado', 'Cliente']);
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) jsonError('Devolución no especificada.');
        $st = db()->prepare('SELECT d.*, v.id_usuario, v.id_cliente
                             FROM devoluciones d JOIN ventas v ON v.id_venta = d.id_venta
                             WHERE d.id_devolucion = ?');
        $st->execute([$id]);
        $d = $st->fetch();
        if (!$d) jsonError('Devolución no encontrada.', 404);
        if ($d['estado'] !== 'Pendiente') jsonError('Solo puedes cancelar devoluciones pendientes.');
        if (($s['rol'] ?? '') === 'Cliente') {
            $stc = db()->prepare('SELECT id_cliente FROM clientes WHERE email = ? LIMIT 1');
            $stc->execute([$s['email']]);
            $myCliente = (int)($stc->fetch()['id_cliente'] ?? 0);
            if ((int)$d['id_usuario'] !== (int)$s['id_usuario'] && (int)$d['id_cliente'] !== $myCliente)
                jsonError('No puedes cancelar esta devolución.', 403);
        }
        db()->prepare('DELETE FROM devoluciones WHERE id_devolucion = ?')->execute([$id]);
        jsonOk(['eliminado' => true]);
    }

    jsonError('Método no permitido.', 405);
} catch (PDOException $e) { jsonError('Error de BD: ' . $e->getMessage(), 500); }