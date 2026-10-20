<?php
// api/proveedores.php — RF012 · CRUD normalizado (proveedor_productos)
// Diagrama ER: Proveedor -Abastece/Suministra-> Inventario (N:M vía proveedor_productos)
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();

function sincronizarProductosProveedor(int $idProv, string $lista): void {
    db()->prepare('DELETE FROM proveedor_productos WHERE id_proveedor = ?')->execute([$idProv]);
    foreach (preg_split('/[,\n;]+/', $lista) as $t) {
        $t = trim($t);
        if ($t === '') continue;
        $st = db()->prepare('SELECT id_producto FROM productos WHERE nombre = ? LIMIT 1');
        $st->execute([$t]);
        if ($r = $st->fetch()) {
            db()->prepare('INSERT IGNORE INTO proveedor_productos (id_proveedor, id_producto) VALUES (?,?)')
                ->execute([$idProv, (int)$r['id_producto']]);
        }
    }
}
try {
    if ($method === 'GET') {
        requireRole(['Administrador', 'Empleado']);
        jsonOk(db()->query(
            "SELECT p.id_proveedor, p.nombre, p.contacto, p.fecha,
                    COALESCE((SELECT GROUP_CONCAT(pr.nombre SEPARATOR ', ')
                     FROM proveedor_productos pp
                     JOIN productos pr ON pr.id_producto = pp.id_producto
                     WHERE pp.id_proveedor = p.id_proveedor), '') AS productos
             FROM proveedores p ORDER BY p.id_proveedor DESC")->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador']);
        $nombre = vStr($body, 'nombre', 120);
        db()->prepare('INSERT INTO proveedores (nombre, contacto) VALUES (?,?)')
            ->execute([$nombre, trim((string)($body['contacto'] ?? ''))]);
        $id = (int)db()->lastInsertId();
        sincronizarProductosProveedor($id, (string)($body['productos'] ?? ''));
        logBD('Proveedor creado: ' . $nombre, 'CREAR', 'Proveedores');
        jsonOk(['id_proveedor' => $id]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador']);
        $id = (int)($body['id_proveedor'] ?? 0);
        if ($id <= 0) jsonError('Proveedor no especificado.');
        [$sets, $vals] = buildUpdate($body, ['nombre' => 'str', 'contacto' => 'str_opt']);
        $vals[] = $id;
        db()->prepare("UPDATE proveedores SET $sets WHERE id_proveedor = ?")->execute($vals);
        if (array_key_exists('productos', $body))
            sincronizarProductosProveedor($id, (string)($body['productos'] ?? ''));
        logBD('Proveedor #' . $id . ' actualizado', 'EDITAR', 'Proveedores');
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador']);
        $id = (int)($_GET['id'] ?? 0);
        db()->prepare('DELETE FROM proveedores WHERE id_proveedor = ?')->execute([$id]);
        logBD('Proveedor #' . $id . ' eliminado', 'ELIMINAR', 'Proveedores');
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}