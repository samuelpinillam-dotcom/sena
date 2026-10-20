<?php
// api/ventas.php — RF003 · RF004 · GESTIÓN COMPLETA
// GET: staff ve todas · cliente las suyas · POST: emitir
// PUT: marcar ENVIADA (gestión) · ANULAR (devuelve stock)
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();

function ventasConItems(array $ventas): array {
    if (!$ventas) return [];
    $ids = [];
    foreach ($ventas as $v) { $ids[] = (int)$v['id_venta']; }
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = db()->prepare("SELECT id_item, id_venta, nombre, precio, cantidad, descuento_pct
                         FROM venta_items WHERE id_venta IN ($in) ORDER BY id_item");
    $st->execute($ids);
    $map = [];
    foreach ($st->fetchAll() as $it) { $map[(int)$it['id_venta']][] = $it; }
    foreach ($ventas as &$v) {
        $v['items'] = $map[(int)$v['id_venta']] ?? [];
        $v['id_pedidos'] = !empty($v['id_pedidos']) ? 'P-' . (int)$v['id_pedidos'] : null;
    }
    return $ventas;
}

try {
    /* ---------- GET ---------- */
    if ($method === 'GET') {
        $s = requireLogin();
        if (($s['rol'] ?? '') === 'Cliente' || isset($_GET['mine'])) {
            $st = db()->prepare('SELECT * FROM ventas
                                 WHERE id_usuario = ?
                                    OR id_cliente = (SELECT id_cliente FROM clientes WHERE email = ? LIMIT 1)
                                 ORDER BY id_venta DESC');
            $st->execute([$s['id_usuario'], $s['email']]);
            jsonOk(ventasConItems($st->fetchAll()));
        }
        jsonOk(ventasConItems(db()->query('SELECT * FROM ventas ORDER BY id_venta DESC')->fetchAll()));
    }

    /* ---------- POST: emitir factura ---------- */
    if ($method === 'POST') {
        $s = requireLogin();
        $items     = is_array($body['items'] ?? null) ? $body['items'] : [];
        $idCliente = (int)($body['id_cliente'] ?? 0);
        $idPromo   = (int)($body['id_promocion'] ?? 0);
        $direccion = trim((string)($body['direccion_envio'] ?? ''));
        $r = registrarVentaCompleta(
            $items,
            $idCliente > 0 ? $idCliente : null,
            $idPromo   > 0 ? $idPromo   : null,
            $s,
            $direccion
        );
        logBD('Venta emitida: ' . $r['numero'] . ' por ' . ($s['nombre'] ?? ''), 'VENTA', 'Ventas');
        jsonOk($r);
    }

    /* ---------- PUT: gestionar (enviar / anular) ---------- */
    if ($method === 'PUT') {
        requireRole(['Administrador', 'Empleado']);
        $id = (int)($body['id_venta'] ?? 0);
        if ($id <= 0) jsonError('Factura no especificada.');

        /* ---- ✔ GESTIÓN: marcar como enviada ---- */
        if (($body['accion'] ?? '') === 'enviar') {
            $stE = db()->prepare('SELECT estado, numero FROM ventas WHERE id_venta = ?');
            $stE->execute([$id]);
            $ve = $stE->fetch();
            if (!$ve) jsonError('Factura no encontrada.', 404);
            if ($ve['estado'] !== 'Activa') jsonError('Solo las facturas Activas pueden marcarse como enviadas.');
            db()->prepare("UPDATE ventas SET estado = 'Enviada' WHERE id_venta = ?")->execute([$id]);
            logBD('Factura ' . $ve['numero'] . ' marcada como ENVIADA', 'EDITAR', 'Ventas');
            jsonOk(['enviada' => true]);
        }

        /* ---- ANULAR: devuelve stock ---- */
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $st = $pdo->prepare('SELECT * FROM ventas WHERE id_venta = ? FOR UPDATE');
            $st->execute([$id]);
            $v = $st->fetch();
            if (!$v) { $pdo->rollBack(); jsonError('Factura no encontrada.', 404); }
            if ($v['estado'] === 'Anulada') { $pdo->rollBack(); jsonError('La factura ya está anulada.'); }

            $sti = $pdo->prepare('SELECT id_producto, cantidad FROM venta_items WHERE id_venta = ?');
            $sti->execute([$id]);
            $up = $pdo->prepare('UPDATE productos SET cantidad = cantidad + ? WHERE id_producto = ?');
            foreach ($sti->fetchAll() as $it) {
                if (!empty($it['id_producto'])) $up->execute([(int)$it['cantidad'], (int)$it['id_producto']]);
            }
            $pdo->prepare("UPDATE ventas SET estado = 'Anulada', subtotal = 0, descuento = 0, iva = 0, total = 0 WHERE id_venta = ?")
                ->execute([$id]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
        logBD('Factura anulada: ' . $v['numero'] . ' · stock devuelto', 'EDITAR', 'Ventas');
        jsonOk(['anulada' => true]);
    }

    jsonError('Método no permitido.', 405);
} catch (Throwable $e) { jsonError('Error de BD: ' . $e->getMessage(), 500); }