<?php
// api/pedidos.php — RF007 · Kanban de pedidos, transición de estados e historial
// Cliente ve los suyos · Proveedor/Administrador distribuyen (rombo DISTRIBUIR)
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    if ($method === 'GET') {
        $s = requireLogin();
        if (($s['rol'] ?? '') === 'Cliente') {
            $st = db()->prepare("SELECT * FROM pedidos
                WHERE id_cliente = (SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1)
                   OR (id_cliente IS NULL AND cliente = (SELECT CONCAT(nombre,' ',apellido) FROM usuarios WHERE id_usuario = ?))
                ORDER BY id_pedido DESC");
            $st->execute([$s['id_usuario'], $s['id_usuario']]);
            jsonOk($st->fetchAll());
        }
        requireRole(['Administrador', 'Empleado', 'Proveedor']);
        // Historial de seguimiento de UN pedido (CU005 paso 5)
        if (($_GET['op'] ?? '') === 'historial') {
            $id = (int)($_GET['id'] ?? 0);
            $st = db()->prepare('SELECT pe.*, u.nombre, u.apellido FROM pedido_estados pe
                                 LEFT JOIN usuarios u ON u.id_usuario = pe.id_usuario
                                 WHERE pe.id_pedido = ? ORDER BY pe.id_estado ASC');
            $st->execute([$id]);
            jsonOk($st->fetchAll());
        }
        jsonOk(db()->query('SELECT p.*,
              (SELECT GROUP_CONCAT(CONCAT(pr.nombre, " x", pp.cantidad) SEPARATOR ", ")
                 FROM pedido_productos pp JOIN productos pr ON pr.id_producto = pp.id_producto
                WHERE pp.id_pedido = p.id_pedido) AS items
              FROM pedidos p ORDER BY p.id_pedido DESC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador']);
        $cliente = vStr($body, 'cliente', 160);
        $dir     = vStr($body, 'direccion', 200);
        db()->prepare('INSERT INTO pedidos (cliente, direccion, estado) VALUES (?, ?, "Preparando")')
            ->execute([$cliente, $dir]);
        $id = (int)db()->lastInsertId();
        // ✔ Historial inicial garantizado (funciona con o sin trigger de la Parte B, sin duplicar)
        $chk = db()->prepare('SELECT COUNT(*) c FROM pedido_estados WHERE id_pedido = ?');
        $chk->execute([$id]);
        if (!(int)$chk->fetch()['c']) {
            db()->prepare('INSERT INTO pedido_estados (id_pedido, estado, id_usuario) VALUES (?, "Preparando", ?)')
                ->execute([$id, $_SESSION['id_usuario'] ?? null]);
        }
        logBD('Pedido administrativo P-' . $id . ' para ' . $cliente, 'CREAR', 'Pedidos');
        jsonOk(['id_pedido' => $id]);
    }
    if ($method === 'PUT') {
        $s = requireRole(['Proveedor', 'Administrador']);
        $id = (int)($body['id'] ?? 0);
        $nuevo = (string)($body['estado'] ?? '');
        if ($id <= 0) jsonError('Debe seleccionar un pedido para modificar.');           // CU005 2.a
        if (!in_array($nuevo, PEDIDO_FLUJO, true))
            jsonError('Estado no válido, seleccione una opción del listado.');           // CU005 2.b
        $st = db()->prepare('SELECT estado FROM pedidos WHERE id_pedido = ?');
        $st->execute([$id]); $p = $st->fetch();
        if (!$p) jsonError('Pedido no encontrado.', 404);
        $a = array_search($p['estado'], PEDIDO_FLUJO, true);
        $n = array_search($nuevo, PEDIDO_FLUJO, true);
        if ($n !== $a + 1) jsonError('Transición no permitida: ' . $p['estado'] . ' → ' . $nuevo . '.');
        $pdo = db(); $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE pedidos SET estado = ? WHERE id_pedido = ?')->execute([$nuevo, $id]);
            $pdo->prepare('INSERT INTO pedido_estados (id_pedido, estado, id_usuario) VALUES (?,?,?)')
                ->execute([$id, $nuevo, $s['id_usuario']]);
            $pdo->commit();
        } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
        logBD('Pedido P-' . $id . ' → ' . $nuevo, 'EDITAR', 'Pedidos');
        jsonOk(['actualizado' => true, 'estado' => $nuevo]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador']);
        $id = (int)($_GET['id'] ?? 0);
        db()->prepare('DELETE FROM pedidos WHERE id_pedido = ?')->execute([$id]);
        logBD('Eliminó pedido P-' . $id, 'ELIMINAR', 'Pedidos');
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) { jsonError('Error de BD: ' . $e->getMessage(), 500); }