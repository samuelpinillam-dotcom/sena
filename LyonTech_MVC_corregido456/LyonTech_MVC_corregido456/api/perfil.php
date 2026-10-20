<?php
// api/perfil.php — CU005 cliente: cada usuario edita sus propios datos
// (nombre, apellido, dirección, teléfono) · sincroniza la relación "TIENE" 1:1
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    if ($method === 'PUT') {
        $s = requireLogin();
        $nombre   = vStr($body, 'nombre', 80);
        $apellido = vStr($body, 'apellido', 80);
        if (!preg_match("/^[\p{L} ]+$/u", "$nombre $apellido")) jsonError('Nombre y apellido: solo letras y espacios.');
        $dir = vStr($body, 'direccion', 160);
        $tel = vStr($body, 'telefono', 20);
        if (!preg_match('/^\d{7,15}$/', $tel)) jsonError('Teléfono inválido (7 a 15 dígitos).');

        $pdo = db();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE usuarios SET nombre = ?, apellido = ?, direccion = ?, telefono = ? WHERE id_usuario = ?')
                ->execute([$nombre, $apellido, $dir, $tel, $s['id_usuario']]);
            // Relación "TIENE": sincroniza el nombre denormalizado que usan Ventas y el Buzón
            if (($s['rol'] ?? '') === 'Cliente')
                $pdo->prepare('UPDATE clientes SET nombre = ?, telefono = ? WHERE id_usuario = ?')
                    ->execute([$nombre . ' ' . $apellido, $tel, $s['id_usuario']]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
        logBD('Perfil actualizado: ' . $nombre . ' ' . $apellido, 'EDITAR', 'Perfil');
        jsonOk(['actualizado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}