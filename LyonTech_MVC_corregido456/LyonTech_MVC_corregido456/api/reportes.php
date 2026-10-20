<?php
// api/reportes.php — RF011
// CU005 Admin: CONSULTAR reportes (ventas/inventario/devoluciones/envíos) + exportar CSV
// CU007 Empleado: GENERAR reportes de VENTAS por fecha, producto y cliente
// Modelo relacional: tabla reportes_generados (total_ventas, cantidad_ventas, creado_por)
require_once __DIR__ . '/config.php';
ensureTablasSistema();
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    /* ---------- Resumen de empresa (KPIs del panel) — Admin y Empleado ---------- */
    if ($method === 'GET' && ($_GET['op'] ?? '') === 'resumen') {
        requireRole(['Administrador', 'Empleado']);
        $pdo = db();
        $na = "estado <> 'Anulada'";
        $dia = $pdo->query("SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM ventas WHERE $na AND DATE(fecha)=CURDATE()")->fetch();
        $mes = $pdo->query("SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM ventas WHERE $na AND YEAR(fecha)=YEAR(CURDATE()) AND MONTH(fecha)=MONTH(CURDATE())")->fetch();
        $diarias = $pdo->query("SELECT DATE(fecha) fecha, COUNT(*) c, COALESCE(SUM(total),0) total FROM ventas
                                WHERE $na AND fecha >= CURDATE() - INTERVAL 14 DAY GROUP BY DATE(fecha) ORDER BY fecha")->fetchAll();
        $stockBajo = $pdo->query("SELECT id_producto, nombre, cantidad, stock_minimo, estado FROM productos
                                  WHERE cantidad <= stock_minimo AND estado='Activo' ORDER BY cantidad ASC")->fetchAll();
        $ped = ['pendientes' => 0, 'entregados' => 0, 'total' => 0];
        foreach ($pdo->query('SELECT estado, COUNT(*) c FROM pedidos GROUP BY estado')->fetchAll() as $r) {
            $ped['total'] += (int)$r['c'];
            if ($r['estado'] === 'Entregado') $ped['entregados'] = (int)$r['c'];
            else $ped['pendientes'] += (int)$r['c'];
        }
        jsonOk([
            'ventas_dia' => ['cantidad' => (int)$dia['c'], 'total' => (float)$dia['t']],
            'ventas_mes' => ['cantidad' => (int)$mes['c'], 'total' => (float)$mes['t']],
            'ventas_diarias' => $diarias, 'stock_bajo' => $stockBajo, 'pedidos' => $ped,
        ]);
    }

    /* ---------- CU005 Admin: CONSULTA en vivo por tipo + export CSV ---------- */
    if ($method === 'GET' && ($_GET['op'] ?? '') === 'consultar') {
        requireRole(['Administrador']);
        $tipo  = in_array($_GET['tipo'] ?? '', ['ventas','inventario','devoluciones','envios'], true) ? $_GET['tipo'] : 'ventas';
        $desde = preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['desde'] ?? '') ? $_GET['desde'] : null;
        $hasta = preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['hasta'] ?? '') ? $_GET['hasta'] : null;
        $filas = []; $head = [];
        if ($tipo === 'ventas') {
            $head = ['numero_factura','fecha','cliente','subtotal','descuento','iva','total','estado'];
            $sql = "SELECT v.numero AS numero_factura, v.fecha, v.cliente_nombre AS cliente, v.subtotal, v.descuento, v.iva, v.total, v.estado
                    FROM ventas v WHERE 1";
            $p = [];
            if ($desde) { $sql .= " AND DATE(v.fecha) >= ?"; $p[] = $desde; }
            if ($hasta) { $sql .= " AND DATE(v.fecha) <= ?"; $p[] = $hasta; }
            $sql .= " ORDER BY v.id_venta DESC";
            $st = db()->prepare($sql); $st->execute($p);
            $filas = $st->fetchAll();
        } elseif ($tipo === 'inventario') {
            $head = ['id_producto','nombre','stock_actual','stock_minimo','precio','estado'];
            $filas = db()->query('SELECT id_producto, nombre, cantidad AS stock_actual, stock_minimo, precio, estado FROM productos ORDER BY id_producto')->fetchAll();
        } elseif ($tipo === 'devoluciones') {
            $head = ['id_devolucion','fecha','factura','producto','cantidad','motivo','estado','nota_credito'];
            $filas = db()->query('SELECT d.id_devolucion, d.fecha, v.numero AS factura, i.nombre AS producto,
                                  d.cantidad, d.motivo, d.estado, d.nota_credito
                                  FROM devoluciones d LEFT JOIN ventas v ON v.id_venta = d.id_venta
                                  LEFT JOIN venta_items i ON i.id_item = d.id_item
                                  ORDER BY d.id_devolucion DESC')->fetchAll();
        } else {
            $head = ['id_entrega','fecha','pedido','cliente','codigo_seguimiento','tipo','transportadora','estado_pedido'];
            $filas = db()->query('SELECT e.id_entrega, e.fecha_generacion AS fecha, e.id_pedido AS pedido, p.cliente,
                                  e.codigo_seguimiento, e.tipo, e.transportadora, p.estado AS estado_pedido
                                  FROM entregas e JOIN pedidos p ON p.id_pedido = e.id_pedido
                                  ORDER BY e.id_entrega DESC')->fetchAll();
        }
        if (isset($_GET['export'])) {
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="reporte_' . $tipo . '.csv"');
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $head, ';');
            foreach ($filas as $f) fputcsv($out, array_map(function ($x) {
                return is_array($x) ? json_encode($x, JSON_UNESCAPED_UNICODE) : $x;
            }, array_values($f)), ';');
            fclose($out); exit;
        }
        jsonOk(['tipo' => $tipo, 'head' => $head, 'filas' => $filas]);
    }

    /* ---------- Exportar un reporte GUARDADO (creador o Admin) ---------- */
    if ($method === 'GET' && isset($_GET['export'])) {
        $s = requireLogin();
        $id = (int)$_GET['export'];
        $st = db()->prepare('SELECT * FROM reportes_generados WHERE id_reporte = ?');
        $st->execute([$id]);
        $r = $st->fetch();
        if (!$r) jsonError('Reporte no encontrado.', 404);
        if ($s['rol'] !== 'Administrador' && (int)$r['creado_por'] !== (int)$s['id_usuario'])
            jsonError('No tienes permisos para esta acción.', 403);
        $filas = json_decode($r['datos_json'] ?? '', true);
        if (!is_array($filas)) $filas = [];
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="reporte_ventas_' . $id . '.csv"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['numero_factura','fecha','cliente','producto','precio','cantidad','subtotal_linea','descuento_pct'], ';');
        foreach ($filas as $f) fputcsv($out, $f, ';');
        fclose($out); exit;
    }

    /* ---------- Lista de reportes: Admin ve todos · Empleado los suyos ---------- */
    if ($method === 'GET') {
        $s = requireLogin();
        if ($s['rol'] === 'Administrador') {
            jsonOk(db()->query('SELECT r.*, u.nombre AS usuario_genera, u.apellido
                                FROM reportes_generados r LEFT JOIN usuarios u ON u.id_usuario = r.creado_por
                                ORDER BY r.id_reporte DESC')->fetchAll());
        }
        $st = db()->prepare('SELECT r.*, u.nombre AS usuario_genera, u.apellido
                             FROM reportes_generados r LEFT JOIN usuarios u ON u.id_usuario = r.creado_por
                             WHERE r.creado_por = ? ORDER BY r.id_reporte DESC');
        $st->execute([$s['id_usuario']]);
        jsonOk($st->fetchAll());
    }

    /* ---------- CU007 Empleado: GENERAR reporte de ventas ---------- */
    if ($method === 'POST') {
        $s = requireRole(['Empleado', 'Administrador']);
        $desde = preg_match('/^\d{4}-\d{2}-\d{2}$/', $body['desde'] ?? '') ? $body['desde'] : null;
        $hasta = preg_match('/^\d{4}-\d{2}-\d{2}$/', $body['hasta'] ?? '') ? $body['hasta'] : null;
        $idProd = (int)($body['id_producto'] ?? 0);
        $idCli  = (int)($body['id_cliente'] ?? 0);
        if (!$desde || !$hasta) jsonError('Debe seleccionar al menos un filtro (rango de fechas).');  // CU005 2.a
        if ($hasta < $desde) jsonError('El rango de fechas es inválido.');

        $sql = "SELECT v.numero AS numero_factura, DATE(v.fecha) AS fecha, v.cliente_nombre AS cliente,
                       i.nombre AS producto, i.precio, i.cantidad,
                       ROUND(i.precio * i.cantidad, 2) AS subtotal_linea, i.descuento_pct
                FROM ventas v JOIN venta_items i ON i.id_venta = v.id_venta
                WHERE v.estado <> 'Anulada' AND DATE(v.fecha) BETWEEN ? AND ?";
        $p = [$desde, $hasta];
        if ($idProd > 0) { $sql .= " AND i.id_producto = ?"; $p[] = $idProd; }
        if ($idCli  > 0) { $sql .= " AND v.id_cliente  = ?"; $p[] = $idCli; }
        $sql .= " ORDER BY v.fecha ASC";
        $st = db()->prepare($sql); $st->execute($p);
        $filas = $st->fetchAll();
        if (!$filas) jsonError('No hay información para los parámetros seleccionados.');  // CU005 2.b
        $totalVentas = array_sum(array_column($filas, 'subtotal_linea'));
        $cantidadVentas = count(array_unique(array_column($filas, 'numero_factura')));

        db()->prepare('INSERT INTO reportes_generados (tipo, desde, hasta, id_producto, id_cliente, total_ventas, cantidad_ventas, datos_json, creado_por)
                       VALUES ("ventas",?,?,?,?,?,?,?,?)')
            ->execute([$desde, $hasta, $idProd ?: null, $idCli ?: null, $totalVentas, $cantidadVentas,
                       json_encode($filas, JSON_UNESCAPED_UNICODE), $s['id_usuario']]);
        logBD('Reporte de ventas generado: ' . $desde . ' → ' . $hasta, 'CREAR', 'Reportes');
        jsonOk(['id_reporte' => (int)db()->lastInsertId(),
                'total_ventas' => round((float)$totalVentas, 2),
                'cantidad_ventas' => (int)$cantidadVentas,
                'head' => ['numero_factura','fecha','cliente','producto','precio','cantidad','subtotal_linea','descuento_pct'],
                'filas' => $filas]);
    }

    /* ---------- Eliminar reporte (Admin o su creador) ---------- */
    if ($method === 'DELETE') {
        $s = requireLogin();
        $id = (int)($_GET['id'] ?? 0);
        $st = db()->prepare('SELECT creado_por FROM reportes_generados WHERE id_reporte = ?');
        $st->execute([$id]);
        $r = $st->fetch();
        if (!$r) jsonError('Reporte no encontrado.', 404);
        if ($s['rol'] !== 'Administrador' && (int)$r['creado_por'] !== (int)$s['id_usuario'])
            jsonError('No tienes permisos para esta acción.', 403);
        db()->prepare('DELETE FROM reportes_generados WHERE id_reporte = ?')->execute([$id]);
        logBD('Reporte #' . $id . ' eliminado', 'ELIMINAR', 'Reportes');
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}