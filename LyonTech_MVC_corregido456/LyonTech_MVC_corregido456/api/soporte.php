<?php
// api/soporte.php — Tickets: cliente genera, staff responde/asigna
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    if ($method === 'GET') {
        $s = requireLogin();
        if (($s['rol'] ?? '') === 'Cliente') {
            $st = db()->prepare('SELECT * FROM soporte_tecnico WHERE id_usuario = ? ORDER BY id_soporte DESC');
            $st->execute([$s['id_usuario']]);
            jsonOk($st->fetchAll());
        }
        requireRole(['Administrador', 'Empleado']);
        jsonOk(db()->query('SELECT s.*, u.nombre, u.apellido FROM soporte_tecnico s
                            LEFT JOIN usuarios u ON u.id_usuario = s.id_usuario
                            ORDER BY s.id_soporte DESC')->fetchAll());
    }
    if ($method === 'POST') {
        $s = requireLogin();
        $asunto  = vStr($body, 'asunto', 150);
        $mensaje = vStr($body, 'mensaje', 2000);
        db()->prepare('INSERT INTO soporte_tecnico (id_usuario, asunto, mensaje) VALUES (?,?,?)')
            ->execute([$s['id_usuario'], $asunto, $mensaje]);
        logBD('Ticket de soporte: ' . $asunto, 'CREAR', 'Soporte');
        jsonOk(['id_soporte' => (int)db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        $s = requireRole(['Administrador', 'Empleado']);
        $id = (int)($body['id_soporte'] ?? 0);
        if ($id <= 0) jsonError('Ticket no especificado.');
        $sets = []; $vals = [];
        if (isset($body['estado'])) {
            if (!in_array($body['estado'], ['Abierto', 'En proceso', 'Cerrado'], true)) jsonError('Estado inválido.');
            $sets[] = 'estado = ?'; $vals[] = $body['estado'];
        }
        if (array_key_exists('respuesta', $body)) { $sets[] = 'respuesta = ?'; $vals[] = trim((string)$body['respuesta']); }
        if (!empty($body['asignar'])) { $sets[] = 'id_asignado = ?'; $vals[] = (int)$body['asignar']; }
        if (!$sets) jsonError('Nada que actualizar.');
        $vals[] = $id;
        db()->prepare('UPDATE soporte_tecnico SET ' . implode(', ', $sets) . ' WHERE id_soporte = ?')->execute($vals);
        logBD('Ticket #' . $id . ' gestionado', 'EDITAR', 'Soporte');
        jsonOk(['actualizado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) { jsonError('Error de BD: ' . $e->getMessage(), 500); }