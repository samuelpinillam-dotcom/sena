<?php
// api/config.php — Núcleo de la API + lógica de ventas (FINAL · sin bitácora · sin chat)
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', '0');

ob_start();

set_exception_handler(function ($e) {
    jsonOut(['ok' => false,
             'error' => 'Error del servidor: ' . $e->getMessage()
                      . ' — ' . basename($e->getFile()) . ':' . $e->getLine()], 500);
});

register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        http_response_code(500);
        while (ob_get_level() > 0) { ob_end_clean(); }
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Error fatal PHP: ' . $e['message']
            . ' — ' . basename($e['file']) . ':' . $e['line']], JSON_UNESCAPED_UNICODE);
    }
});

function _uLen(string $s): int   { return function_exists('mb_strlen') ? mb_strlen($s) : strlen($s); }
function _uCut(string $s, int $n): string { return function_exists('mb_substr') ? mb_substr($s, 0, $n) : substr($s, 0, $n); }

function jsonOut($data, int $code = 200): void {
    http_response_code($code);
    while (ob_get_level() > 0) { ob_end_clean(); }
    header('Content-Type: application/json; charset=utf-8');
    $j = json_encode($data, JSON_UNESCAPED_UNICODE);
    echo ($j === false) ? '{"ok":false,"error":"Error interno de codificación."}' : $j;
    exit;
}
function jsonOk($data = null): void               { jsonOut(['ok' => true, 'data' => $data]); }
function jsonError(string $m, int $c = 400): void { jsonOut(['ok' => false, 'error' => $m], $c); }

function jsonBody(): array {
    $d = json_decode(file_get_contents('php://input') ?: '[]', true);
    return is_array($d) ? $d : [];
}

function startSecureSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
        session_start();
    }
}
function requireLogin(): array {
    startSecureSession();
    if (empty($_SESSION['id_usuario'])) jsonError('No autorizado: inicia sesión.', 401);
    return $_SESSION;
}
function requireRole(array $roles): array {
    $s = requireLogin();
    $coincide = function (array $sesion) use ($roles): bool {
        $rolSesion = trim((string)($sesion['rol'] ?? ''));
        if ($rolSesion === '') return false;
        foreach ($roles as $r) {
            if (strcasecmp($rolSesion, trim((string)$r)) === 0) return true;
        }
        return false;
    };
    if ($coincide($s)) return $s;
    try {
        $st = db()->prepare('SELECT id_usuario, nombre, apellido, email, rol
                             FROM usuarios WHERE id_usuario = ? AND estado = "Activo"');
        $st->execute([(int)$s['id_usuario']]);
        $u = $st->fetch();
        if ($u) {
            $_SESSION['rol']      = $u['rol'];
            $_SESSION['nombre']   = $u['nombre'];
            $_SESSION['apellido'] = $u['apellido'];
            $_SESSION['email']    = $u['email'];
            if ($coincide($_SESSION)) return $_SESSION;
        }
    } catch (Throwable $e) { /* cae al 403 */ }
    jsonError('No tienes permisos para esta acción.', 403);
}

function vStr(array $b, string $k, int $max = 255): string {
    $v = trim((string)($b[$k] ?? ''));
    if ($v === '' || _uLen($v) > $max) jsonError("El campo '$k' es obligatorio (max. $max).");
    return $v;
}
function vEmail(array $b): string {
    $v = filter_var(trim((string)($b['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    if (!$v) jsonError('Correo electrónico inválido.');
    return strtolower($v);
}
function vNum(array $b, string $k, float $min = 0): float {
    if (!isset($b[$k]) || !is_numeric($b[$k]) || (float)$b[$k] < $min)
        jsonError("El campo '$k' debe ser un número >= $min.");
    return (float)$b[$k];
}
function buildUpdate(array $body, array $allowed): array {
    $sets = []; $vals = [];
    foreach ($allowed as $campo => $regla) {
        if (!array_key_exists($campo, $body)) continue;
        $v = $body[$campo];
        if (is_array($regla)) {
            if (!in_array($v, $regla, true)) jsonError("Valor inválido para '$campo'.");
        } elseif ($regla === 'str') {
            $v = trim((string)$v);
            if ($v === '') jsonError("El campo '$campo' no puede estar vacío.");
        } elseif ($regla === 'str_opt') {
            $v = trim((string)$v);
        } elseif ($regla === 'int' || $regla === 'float') {
            $v = ($regla === 'int' ? (int)$v : (float)$v);
            if ($v < 0) jsonError("El campo '$campo' no puede ser negativo.");
        }
        $sets[] = "$campo = ?";
        $vals[] = $v;
    }
    if (!$sets) jsonError('No hay campos para actualizar.');
    return [implode(', ', $sets), $vals];
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'Tienda_Electrodomesticos');
define('DB_USER', 'root');
define('DB_PASS', '');

function _columnaExiste(string $tabla, string $col): bool {
    $r = db()->prepare("SELECT COUNT(*) c FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?");
    $r->execute([$tabla, $col]);
    return (bool)$r->fetch()['c'];
}
function _autoReparar(): void {
    try {
        if (!_columnaExiste('venta_items', 'descuento_pct'))
            db()->exec("ALTER TABLE venta_items ADD COLUMN descuento_pct TINYINT UNSIGNED NOT NULL DEFAULT 0");
        if (!_columnaExiste('devoluciones', 'monto_reembolsado'))
            db()->exec("ALTER TABLE devoluciones ADD COLUMN monto_reembolsado DECIMAL(12,2) NULL AFTER nota_credito");
        if (!_columnaExiste('ventas', 'id_pedidos'))
            db()->exec("ALTER TABLE ventas ADD COLUMN id_pedidos INT NULL AFTER id_promocion");
        $t = db()->prepare("SELECT COLUMN_TYPE FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='devoluciones' AND COLUMN_NAME='estado'");
        $t->execute();
        $tipo = (string)($t->fetch()['COLUMN_TYPE'] ?? '');
        if ($tipo !== '' && strpos($tipo, 'Rechazada') === false)
            db()->exec("ALTER TABLE devoluciones MODIFY estado ENUM('Pendiente','Validada','Rechazada') NOT NULL DEFAULT 'Pendiente'");
        if (_columnaExiste('reportes_generados', 'id_reporte')) {
            foreach ([['desde','DATE NULL'], ['hasta','DATE NULL'],
                      ['id_producto','INT NULL'], ['id_cliente','INT NULL'],
                      ['total_ventas','DECIMAL(12,2) NOT NULL DEFAULT 0'],
                      ['cantidad_ventas','INT NOT NULL DEFAULT 0'],
                      ['datos_json','LONGTEXT NULL'], ['creado_por','INT NULL']] as [$col, $def]) {
                if (!_columnaExiste('reportes_generados', $col))
                    db()->exec("ALTER TABLE reportes_generados ADD COLUMN $col $def");
            }
            db()->exec("ALTER TABLE reportes_generados MODIFY titulo VARCHAR(150) NULL DEFAULT ''");
        }
    } catch (Throwable $e) { /* nunca romper el flujo */ }
}

function db(): PDO {
    static $pdo = null, $reparado = false;
    if ($pdo === null) {
        try {
            $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            jsonOut(['ok' => false, 'error' => 'No se pudo conectar a MySQL. Importa sql/schema.sql en phpMyAdmin.'], 500);
        }
    }
    if (!$reparado) { $reparado = true; _autoReparar(); }
    return $pdo;
}

/* Auditoría desactivada (bitácora eliminada según el documento) · no-op */
function logBD(string $detalle, string $accion = 'ACCION', string $modulo = ''): void { }

function ensureTablasSistema(): void {
    try {
        db()->exec("CREATE TABLE IF NOT EXISTS soporte_tecnico (
            id_soporte INT AUTO_INCREMENT PRIMARY KEY,
            id_usuario INT NULL, id_asignado INT NULL,
            asunto VARCHAR(150) NOT NULL, mensaje TEXT NOT NULL, respuesta TEXT NULL,
            estado ENUM('Abierto','En proceso','Cerrado') NOT NULL DEFAULT 'Abierto',
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        db()->exec("CREATE TABLE IF NOT EXISTS reportes_generados (
            id_reporte INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(150) NULL DEFAULT '',
            tipo VARCHAR(50) NOT NULL DEFAULT 'ventas',
            desde DATE NULL, hasta DATE NULL,
            id_producto INT NULL, id_cliente INT NULL,
            total_ventas DECIMAL(12,2) NOT NULL DEFAULT 0,
            cantidad_ventas INT NOT NULL DEFAULT 0,
            datos_json LONGTEXT NULL, creado_por INT NULL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        db()->exec("CREATE TABLE IF NOT EXISTS pedido_estados (
            id_estado INT AUTO_INCREMENT PRIMARY KEY, id_pedido INT NOT NULL,
            estado ENUM('Preparando','Enviado','Entregado') NOT NULL,
            id_usuario INT NULL,
            fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        db()->exec("CREATE TABLE IF NOT EXISTS entregas (
            id_entrega INT AUTO_INCREMENT PRIMARY KEY, id_pedido INT NOT NULL,
            codigo_seguimiento VARCHAR(30) NOT NULL UNIQUE,
            tipo ENUM('Etiqueta','Recibo') NOT NULL,
            transportadora VARCHAR(60) NOT NULL DEFAULT 'Mercado Envios',
            generado_por INT NULL,
            fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    } catch (PDOException $e) { /* silencio */ }
}

const PEDIDO_FLUJO = ['Preparando', 'Enviado', 'Entregado'];

function registrarVentaCompleta(array $items, ?int $idCliente, ?int $idPromo, array $s, string $direccionEnvio = ''): array {
    $items = array_values(array_filter($items, function ($i) {
        return (int)($i['id_producto'] ?? 0) > 0 && (int)($i['cantidad'] ?? 0) > 0;
    }));
    if (!$items) jsonError('El carrito está vacío o las cantidades son inválidas.');

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $clienteNombre = trim(($s['nombre'] ?? '') . ' ' . ($s['apellido'] ?? ''));

        if (($s['rol'] ?? '') === 'Cliente') {
            $idCliente = null;
            $st = $pdo->prepare('SELECT id_cliente FROM clientes WHERE email = ?');
            $st->execute([$s['email'] ?? '']);
            if ($c = $st->fetch()) {
                $idCliente = (int)$c['id_cliente'];
            } else {
                // Relación "TIENE": Usuario 1:1 Cliente
                $pdo->prepare('INSERT INTO clientes (nombre, email, telefono, id_usuario) VALUES (?,?,?,?)')
                    ->execute([$clienteNombre, $s['email'] ?? null, '', $s['id_usuario'] ?? null]);
                $idCliente = (int)$pdo->lastInsertId();
            }
            if ($direccionEnvio === '' && !empty($s['id_usuario'])) {
                $st = $pdo->prepare('SELECT direccion FROM usuarios WHERE id_usuario = ?');
                $st->execute([$s['id_usuario']]);
                $u = $st->fetch();
                $direccionEnvio = (string)($u['direccion'] ?? '');
            }
        } elseif ($idCliente) {
            $st = $pdo->prepare('SELECT nombre FROM clientes WHERE id_cliente = ?');
            $st->execute([$idCliente]);
            if ($c = $st->fetch()) $clienteNombre = $c['nombre'];
            else { $pdo->rollBack(); jsonError('Cliente no encontrado.'); }
        }
        if ($direccionEnvio === '') $direccionEnvio = 'Coordinar con el cliente';

        /* Promo activa (rombo "APLICA") */
        $descPct = 0; $promoProducto = 0;
        if ($idPromo) {
            $st = $pdo->prepare("SELECT descuento, id_producto FROM promociones
                                 WHERE id_promocion = ? AND estado = 'Activa'
                                   AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin");
            $st->execute([$idPromo]);
            if ($pr = $st->fetch()) { $descPct = (int)$pr['descuento']; $promoProducto = (int)$pr['id_producto']; }
            else { $idPromo = null; $promoProducto = 0; }
        }

        /* Líneas de venta + descuento de stock */
        $subtotal = 0.0; $lineas = [];
        $upd = $pdo->prepare('UPDATE productos SET cantidad = cantidad - ? WHERE id_producto = ?');
        foreach ($items as $it) {
            $pid = (int)$it['id_producto']; $cant = (int)$it['cantidad'];
            $st = $pdo->prepare('SELECT nombre, precio, cantidad, estado FROM productos WHERE id_producto = ? FOR UPDATE');
            $st->execute([$pid]);
            $p = $st->fetch();
            if (!$p || $p['estado'] === 'Inactivo') { $pdo->rollBack(); jsonError('Producto no disponible (ID ' . $pid . ').'); }
            if ((int)$p['cantidad'] < $cant) { $pdo->rollBack(); jsonError('Stock insuficiente de "' . $p['nombre'] . '" (disponible: ' . $p['cantidad'] . ').'); }
            $upd->execute([$cant, $pid]);
            $lineas[] = ['id_producto' => $pid, 'nombre' => $p['nombre'], 'precio' => (float)$p['precio'], 'cantidad' => $cant];
            $subtotal += (float)$p['precio'] * $cant;
        }

        $subtotal = round($subtotal, 2);
        $promoBase = 0.0;
        if ($idPromo && $promoProducto > 0) {
            foreach ($lineas as $l) {
                if ((int)$l['id_producto'] === $promoProducto)
                    $promoBase += (float)$l['precio'] * (int)$l['cantidad'];
            }
            if ($promoBase <= 0) { $pdo->rollBack(); jsonError('La promoción seleccionada solo puede aplicarse al producto asociado.'); }
        }
        $descuento = round($promoBase * $descPct / 100, 2);
        $base  = $subtotal - $descuento;
        $iva   = round($base * 0.19, 2);
        $total = round($base + $iva, 2);
        $numero = 'FAC-' . date('Ymd') . '-' . random_int(100, 999);

        /* Factura: emite (usuario) · recibe (cliente) */
        $pdo->prepare('INSERT INTO ventas (numero, id_cliente, id_usuario, cliente_nombre, subtotal, descuento, iva, total, id_promocion)
                       VALUES (?,?,?,?,?,?,?,?,?)')
            ->execute([$numero, $idCliente, $s['id_usuario'] ?? null, $clienteNombre, $subtotal, $descuento, $iva, $total, $idPromo]);
        $idVenta = (int)$pdo->lastInsertId();

        /* Líneas con % de descuento (para devoluciones justas) */
        $sti = $pdo->prepare('INSERT INTO venta_items (id_venta, id_producto, nombre, precio, cantidad, descuento_pct) VALUES (?,?,?,?,?,?)');
        foreach ($lineas as $l) {
            $pctLinea = ($idPromo && $promoProducto > 0 && (int)$l['id_producto'] === $promoProducto) ? $descPct : 0;
            $sti->execute([$idVenta, $l['id_producto'], $l['nombre'], $l['precio'], $l['cantidad'], $pctLinea]);
        }

        /* Pedido + relación "GENERA" */
        $pdo->prepare("INSERT INTO pedidos (id_cliente, cliente, direccion, estado) VALUES (?,?,?,'Preparando')")
            ->execute([$idCliente, $clienteNombre, $direccionEnvio]);
        $idPedido = (int)$pdo->lastInsertId();
        // ✔ Historial inicial garantizado (funciona con o sin trigger de la Parte B, sin duplicar)
        $chk = $pdo->prepare('SELECT COUNT(*) c FROM pedido_estados WHERE id_pedido = ?');
        $chk->execute([$idPedido]);
        if (!(int)$chk->fetch()['c']) {
            $pdo->prepare('INSERT INTO pedido_estados (id_pedido, estado, id_usuario) VALUES (?, "Preparando", ?)')
                ->execute([$idPedido, $s['id_usuario'] ?? null]);
        }
        $stPP = $pdo->prepare('INSERT IGNORE INTO pedido_productos (id_pedido, id_producto, cantidad) VALUES (?,?,?)');
        foreach ($lineas as $l) $stPP->execute([$idPedido, $l['id_producto'], $l['cantidad']]);

        /* Trazabilidad (la columna se auto-crea) */
        try {
            $pdo->prepare('UPDATE ventas SET id_pedidos = ? WHERE id_venta = ?')->execute([$idPedido, $idVenta]);
        } catch (Throwable $e2) { /* opcional */ }

        $pdo->commit();
        return ['id_venta' => $idVenta, 'numero' => $numero, 'id_pedidos' => 'P-' . $idPedido,
                'subtotal' => $subtotal, 'descuento' => $descuento,
                'iva' => $iva, 'total' => $total, 'items' => $lineas];
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}