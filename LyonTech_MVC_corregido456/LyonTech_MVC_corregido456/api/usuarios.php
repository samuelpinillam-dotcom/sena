<?php
// api/usuarios.php — RF002 · RF013 · RF014 (CRUD Administrador)
// ✔ E3 CORREGIDO: al crear Cliente/Proveedor se crea su fila 1:1 (relación "Tiene" del ER)
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    if ($method === 'GET') {
        requireRole(['Administrador']);
        jsonOk(db()->query('SELECT id_usuario, nombre, apellido, tipo_documento, numero_documento,
                                   email, rol, direccion, telefono, estado
                            FROM usuarios ORDER BY id_usuario DESC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador']);
        $nombre   = vStr($body, 'nombre', 80);
        $apellido = vStr($body, 'apellido', 80);
        if (!preg_match("/^[\p{L} ]+$/u", "$nombre $apellido")) jsonError('Nombre y apellido: solo letras y espacios.');
        $tipo = strtoupper(vStr($body, 'tipo_documento', 5));
        if (!in_array($tipo, ['CC', 'TI', 'CE'], true)) jsonError('Tipo de documento inválido.');
        $doc = vStr($body, 'numero_documento', 20);
        if (!preg_match('/^\d{5,20}$/', $doc)) jsonError('Documento inválido.');
        $email = vEmail($body);
        $rol   = ucfirst(strtolower(trim((string)($body['rol'] ?? 'Cliente'))));
        if (!in_array($rol, ['Administrador', 'Empleado', 'Proveedor', 'Cliente'], true)) jsonError('Rol inválido.');
        $dir = vStr($body, 'direccion', 160);
        $tel = vStr($body, 'telefono', 20);
        if (!preg_match('/^\d{7,15}$/', $tel)) jsonError('Teléfono inválido.');
        $pass = (string)($body['password'] ?? '');
        if (strlen($pass) < 6) jsonError('La contraseña debe tener al menos 6 caracteres.');
        try {
            db()->prepare('INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, email, password, rol, direccion, telefono, estado)
                           VALUES (?,?,?,?,?,?,?,?,?,"Activo")')
                ->execute([$nombre, $apellido, $tipo, $doc, $email,
                           password_hash($pass, PASSWORD_DEFAULT), $rol, $dir, $tel]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('Este correo o documento ya está registrado.');
            throw $e;
        }
        $id = (int)db()->lastInsertId();
        if ($rol === 'Cliente')
            db()->prepare('INSERT INTO clientes (id_usuario, nombre, email, telefono) VALUES (?,?,?,?)')
                ->execute([$id, trim($nombre . ' ' . $apellido), $email, $tel]);
        if ($rol === 'Proveedor')
            db()->prepare('INSERT INTO proveedores (id_usuario, nombre, contacto) VALUES (?,?,?)')
                ->execute([$id, trim($nombre . ' ' . $apellido), $tel]);
        logBD('Usuario ' . $email . ' creado con rol ' . $rol, 'CREAR', 'Usuarios');
        jsonOk(['id_usuario' => $id]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador']);
        $id = (int)($body['id_usuario'] ?? 0);
        if ($id <= 0) jsonError('Usuario no especificado.');
        if (array_key_exists('email', $body) &&
            !filter_var(trim((string)$body['email']), FILTER_VALIDATE_EMAIL)) jsonError('Correo electrónico inválido.');
        [$sets, $vals] = buildUpdate($body, [
            'nombre' => 'str', 'apellido' => 'str', 'direccion' => 'str', 'telefono' => 'str',
            'email' => 'str', 'tipo_documento' => 'str', 'numero_documento' => 'str',
            'rol'    => ['Administrador', 'Empleado', 'Proveedor', 'Cliente'],
            'estado' => ['Activo', 'Inactivo'],
        ]);
        if (array_key_exists('password', $body) && $body['password'] !== '') {
            if (strlen((string)$body['password']) < 6) jsonError('La contraseña debe tener al menos 6 caracteres.');
            $sets[] = 'password = ?';
            $vals[] = password_hash((string)$body['password'], PASSWORD_DEFAULT);
        }
        $vals[] = $id;
        try { db()->prepare("UPDATE usuarios SET $sets WHERE id_usuario = ?")->execute($vals); }
        catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('Este correo o documento ya está registrado.');
            throw $e;
        }
        logBD('Usuario #' . $id . ' actualizado', 'EDITAR', 'Usuarios');
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador']);
        $id = (int)($_GET['id'] ?? 0);
        if ($id === (int)($_SESSION['id_usuario'] ?? 0)) jsonError('No puedes eliminar tu propia cuenta.');
        db()->prepare('DELETE FROM usuarios WHERE id_usuario = ?')->execute([$id]);
        logBD('Usuario #' . $id . ' eliminado', 'ELIMINAR', 'Usuarios');
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) { jsonError('Error de BD: ' . $e->getMessage(), 500); }