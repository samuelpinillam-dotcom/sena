<?php
// api/promociones.php — RF008 · una promoción pertenece a UN producto existente
// Diagrama ER: rombo "APLICA" (Promociones -> Inventario, N:1)
require_once __DIR__ . '/config.php';
ensureTablasSistema();
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    if ($method === 'GET') {
        $where = '';
        if (!empty($_GET['activas'])) {
            $where = "WHERE p.estado='Activa' AND CURRENT_DATE BETWEEN p.fecha_inicio AND p.fecha_fin AND pr.estado='Activo'";
        }
        $st = db()->prepare("SELECT p.*, pr.nombre AS nombre_producto, pr.precio AS precio_producto
                             FROM promociones p JOIN productos pr ON pr.id_producto=p.id_producto
                             $where ORDER BY p.fecha_inicio DESC, p.id_promocion DESC");
        $st->execute();
        jsonOk($st->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador','Empleado']);
        $pid = (int)($body['id_producto'] ?? 0);
        $desc = (int)($body['descuento'] ?? 0);
        $ini = trim((string)($body['fecha_inicio'] ?? ''));
        $fin = trim((string)($body['fecha_fin'] ?? ''));
        if ($pid <= 0) jsonError('Debes seleccionar un producto existente.');
        if ($desc < 1 || $desc > 100) jsonError('El descuento debe estar entre 1% y 100%.');
        if (!$ini || !$fin || $fin < $ini) jsonError('Las fechas de la promoción no son válidas.');
        $st = db()->prepare("SELECT id_producto,nombre FROM productos WHERE id_producto=? AND estado='Activo'");
        $st->execute([$pid]);
        $prod = $st->fetch();
        if (!$prod) jsonError('El producto seleccionado no existe o está inactivo.');
        $st = db()->prepare("SELECT id_promocion FROM promociones WHERE id_producto=? AND estado='Activa'
                             AND fecha_inicio <= ? AND fecha_fin >= ? LIMIT 1");
        $st->execute([$pid,$fin,$ini]);
        if ($st->fetch()) jsonError('Ese producto ya tiene una promoción activa que se cruza con esas fechas.');
        db()->prepare('INSERT INTO promociones (id_producto,nombre,descuento,fecha_inicio,fecha_fin,estado) VALUES (?,?,?,?,?,"Activa")')
            ->execute([$pid,$prod['nombre'],$desc,$ini,$fin]);
        logBD('Promoción creada para producto #' . $pid, 'CREAR', 'Promociones');
        jsonOk(['id_promocion' => (int)db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador','Empleado']);
        $id = (int)($body['id_promocion'] ?? 0);
        if ($id <= 0) jsonError('Promoción no especificada.');
        $cur = db()->prepare('SELECT * FROM promociones WHERE id_promocion=?'); $cur->execute([$id]);
        $actual = $cur->fetch();
        if (!$actual) jsonError('Promoción no encontrada.',404);
        $pid = (int)($body['id_producto'] ?? $actual['id_producto']);
        $desc = (int)($body['descuento'] ?? $actual['descuento']);
        $ini = trim((string)($body['fecha_inicio'] ?? $actual['fecha_inicio']));
        $fin = trim((string)($body['fecha_fin'] ?? $actual['fecha_fin']));
        $estado = (($body['estado'] ?? $actual['estado']) === 'Activa') ? 'Activa' : 'Inactiva';
        if ($pid <= 0 || $desc < 1 || $desc > 100 || !$ini || !$fin || $fin < $ini) jsonError('Datos de promoción inválidos.');
        $st = db()->prepare("SELECT nombre FROM productos WHERE id_producto=? AND estado='Activo'"); $st->execute([$pid]);
        $prod = $st->fetch();
        if (!$prod) jsonError('El producto seleccionado no existe o está inactivo.');
        if ($estado === 'Activa') {
            $st = db()->prepare("SELECT id_promocion FROM promociones WHERE id_producto=? AND id_promocion<>? AND estado='Activa'
                                 AND fecha_inicio <= ? AND fecha_fin >= ? LIMIT 1");
            $st->execute([$pid,$id,$fin,$ini]);
            if ($st->fetch()) jsonError('Ese producto ya tiene otra promoción activa en ese período.');
        }
        db()->prepare('UPDATE promociones SET id_producto=?, nombre=?, descuento=?, fecha_inicio=?, fecha_fin=?, estado=? WHERE id_promocion=?')
            ->execute([$pid,$prod['nombre'],$desc,$ini,$fin,$estado,$id]);
        logBD('Promoción actualizada #' . $id, 'EDITAR', 'Promociones');
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador']);
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) jsonError('Promoción no especificada.');
        db()->prepare('DELETE FROM promociones WHERE id_promocion=?')->execute([$id]);
        logBD('Promoción eliminada #' . $id, 'ELIMINAR', 'Promociones');
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.',405);
} catch (PDOException $e) { jsonError('Error de BD: ' . $e->getMessage(),500); }