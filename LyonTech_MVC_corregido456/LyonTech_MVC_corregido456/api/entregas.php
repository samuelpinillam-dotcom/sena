<?php
// api/entregas.php — Etiquetas de envío y recibos de entrega (Encargado de Logística)
// RF007 · CU004-3 (etiqueta) · CU005-1 (recibo solo si "Entregado")
require_once __DIR__ . '/config.php';
 $method = $_SERVER['REQUEST_METHOD'];
 $body   = jsonBody();
try {
    if ($method === 'GET') {
        requireRole(['Proveedor', 'Administrador', 'Empleado']);
        jsonOk(db()->query('SELECT e.*, p.cliente, p.direccion, p.estado
                            FROM entregas e JOIN pedidos p ON p.id_pedido = e.id_pedido
                            ORDER BY e.id_entrega DESC')->fetchAll());
    }
    if ($method === 'POST') {
        $s = requireRole(['Proveedor', 'Administrador']);
        $idPedido = (int)($body['id_pedido'] ?? 0);
        $tipo = (($body['tipo'] ?? 'Etiqueta') === 'Recibo') ? 'Recibo' : 'Etiqueta';
        if ($idPedido <= 0) jsonError('Debe seleccionar un pedido.');
        $st = db()->prepare('SELECT estado, direccion, cliente FROM pedidos WHERE id_pedido = ?');
        $st->execute([$idPedido]); $p = $st->fetch();
        if (!$p) jsonError('Pedido no encontrado.', 404);
        // Flujo según caso de uso: etiqueta ANTES de entregar; recibo SOLO si está "Entregado"
        if ($tipo === 'Recibo' && $p['estado'] !== 'Entregado')
            jsonError('Solo los pedidos "Entregado" tienen recibo de entrega.');
        if ($tipo === 'Etiqueta' && $p['estado'] === 'Entregado')
            jsonError('El pedido ya fue entregado: genera el recibo.');
        $cod = ($tipo === 'Etiqueta' ? 'ETQ-' : 'REC-') . date('Ymd') . '-' . random_int(100, 999);
        db()->prepare('INSERT INTO entregas (id_pedido, codigo_seguimiento, tipo, generado_por) VALUES (?,?,?,?)')
            ->execute([$idPedido, $cod, $tipo, $s['id_usuario']]);
        logBD('Generó ' . $tipo . ' ' . $cod . ' del pedido P-' . $idPedido, 'CREAR', 'Logística');
        // ✔ CORREGIDO: transportadora incluida para que el documento impreso la muestre
        jsonOk(['id_entrega' => (int)db()->lastInsertId(), 'codigo' => $cod, 'tipo' => $tipo,
                'id_pedido' => $idPedido, 'cliente' => $p['cliente'], 'direccion' => $p['direccion'],
                'transportadora' => 'Mercado Envios']);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) { jsonError('Error de BD: ' . $e->getMessage(), 500); }