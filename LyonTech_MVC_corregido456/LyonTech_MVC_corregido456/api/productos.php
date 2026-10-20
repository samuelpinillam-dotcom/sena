<?php
// api/productos.php — CRUD + abastecimiento (RF002 · CU003 · CU004)
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    if ($method === 'GET') {
        requireLogin();
        jsonOk(db()->query('SELECT * FROM productos ORDER BY id_producto ASC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador', 'Empleado']);
        $nombre = vStr($body, 'nombre', 120);
        $desc   = trim((string)($body['descripcion'] ?? ''));
        $precio = vNum($body, 'precio'); $costo = vNum($body, 'costo');
        $cant   = (int)vNum($body, 'cantidad'); $min = (int)vNum($body, 'stock_minimo');
        if ($cant < 0 || $min < 0) jsonError('Cantidad inválida, verifique los datos.');
        try {
            db()->prepare('INSERT INTO productos (nombre, descripcion, precio, costo, cantidad, stock_minimo) VALUES (?,?,?,?,?,?)')
                ->execute([$nombre, $desc, $precio, $costo, $cant, $min]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('Ya existe un producto con ese nombre.'); // CU003 2.a
            throw $e;
        }
        logBD('Producto creado: ' . $nombre, 'CREAR', 'Productos');
        jsonOk(['id_producto' => (int)db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador', 'Empleado', 'Proveedor']);
        $id = (int)($body['id_producto'] ?? 0);
        if ($id <= 0) jsonError('Producto no especificado.');                          // CU004 2.a

        // ABASTECER (Inventario.AUMENTAR_INV del diagrama)
        if (isset($body['abastecer'])) {
            $cant = (int)vNum($body, 'abastecer', 1);
            if ($cant <= 0) jsonError('Cantidad inválida, verifique los datos.');      // CU004 2.b
            db()->prepare('UPDATE productos SET cantidad = cantidad + ? WHERE id_producto = ?')->execute([$cant, $id]);
            logBD('Abastecimiento: ' . $cant . ' uds → producto #' . $id, 'EDITAR', 'Inventario');
            jsonOk(['abastecido' => true]);
        }
        requireRole(['Administrador', 'Empleado']);
        [$sets, $vals] = buildUpdate($body, [
            'nombre' => 'str', 'descripcion' => 'str_opt', 'precio' => 'float', 'costo' => 'float',
            'cantidad' => 'int', 'stock_minimo' => 'int', 'estado' => ['Activo', 'Inactivo']
        ]);
        $vals[] = $id;
        try {
            db()->prepare("UPDATE productos SET $sets WHERE id_producto = ?")->execute($vals);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('Ya existe un producto con ese nombre.');
            throw $e;
        }
        logBD('Producto #' . $id . ' actualizado', 'EDITAR', 'Productos');
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador']);
        $id = (int)($_GET['id'] ?? 0);
        db()->prepare('DELETE FROM productos WHERE id_producto = ?')->execute([$id]);
        logBD('Producto eliminado #' . $id, 'ELIMINAR', 'Productos');
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) { jsonError('Error de BD: ' . $e->getMessage(), 500); }