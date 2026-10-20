<?php
// api/clientes.php — RF014 · CRUD de clientes (Administrador, Empleado)
// Diagrama ER: Cliente "Tiene" 1:1 con Usuario · "Recibe" Emisión de facturas
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    if ($method === 'GET') {
        requireRole(['Administrador', 'Empleado']);
        jsonOk(db()->query('SELECT * FROM clientes ORDER BY id_cliente DESC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador', 'Empleado']);
        $nombre = vStr($body, 'nombre', 120);
        $email  = trim((string)($body['email'] ?? ''));
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Correo inválido.');
        $tel = trim((string)($body['telefono'] ?? ''));
        if ($tel !== '' && !preg_match('/^\d{7,15}$/', $tel)) jsonError('Teléfono inválido.');
        try {
            db()->prepare('INSERT INTO clientes (nombre, email, telefono) VALUES (?,?,?)')
                ->execute([$nombre, $email, $tel]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('Ya existe un cliente con ese correo.');  // CU010 2.a
            throw $e;
        }
        logBD('Cliente creado: ' . $nombre, 'CREAR', 'Clientes');
        jsonOk(['id_cliente' => (int)db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador', 'Empleado']);
        $id = (int)($body['id_cliente'] ?? 0);
        if ($id <= 0) jsonError('Cliente no especificado.');
        try {
            [$sets, $vals] = buildUpdate($body, ['nombre' => 'str', 'email' => 'str_opt', 'telefono' => 'str_opt']);
            $vals[] = $id;
            db()->prepare("UPDATE clientes SET $sets WHERE id_cliente = ?")->execute($vals);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('Ya existe un cliente con ese correo.');
            throw $e;
        }
        logBD('Cliente #' . $id . ' actualizado', 'EDITAR', 'Clientes');
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador']);
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) jsonError('Cliente no especificado.');
        // ✔ DELETE real: las ventas del cliente conservan cliente_nombre
        // (FK ventas.id_cliente ON DELETE SET NULL, según el modelo relacional)
        db()->prepare('DELETE FROM clientes WHERE id_cliente = ?')->execute([$id]);
        logBD('Cliente #' . $id . ' eliminado', 'ELIMINAR', 'Clientes');
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) { jsonError('Error de BD: ' . $e->getMessage(), 500); }