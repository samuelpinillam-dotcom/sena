<?php
// api/auth.php — RF001 · CU001 (registrar) · CU002 (iniciar sesión)
// RQNF016: contraseñas con hash · Mensajes de error según flujos del CU001/CU002
require_once __DIR__ . '/config.php';

startSecureSession();
 $action = $_GET['action'] ?? '';
 $body   = jsonBody();

switch ($action) {
    case 'register': doRegister($body); break;
    case 'login':    doLogin($body);    break;
    case 'current':  doCurrent();       break;
    case 'logout':   doLogout();        break;
    default: jsonError('Acción no válida.', 404);
}

function validarComunes(array $b): array {
    $nombre   = vStr($b, 'nombre', 80);
    $apellido = vStr($b, 'apellido', 80);
    if (!preg_match("/^[\p{L} ]+$/u", "$nombre $apellido"))
        jsonError('Nombre y apellido: solo letras y espacios.');            // CU001 2.b
    $tipo = strtoupper(vStr($b, 'tipo_documento', 5));
    if (!in_array($tipo, ['CC', 'TI', 'CE'], true)) jsonError('Tipo de documento inválido.');
    $doc = vStr($b, 'numero_documento', 20);
    if (!preg_match('/^\d{5,20}$/', $doc)) jsonError('Número de documento inválido (solo dígitos, 5 a 20).');
    $email = vEmail($b);
    $rol = ucfirst(strtolower(trim((string)($b['rol'] ?? 'Cliente'))));
    if (!in_array($rol, ['Administrador', 'Empleado', 'Proveedor', 'Cliente'], true)) $rol = 'Cliente';
    $dir = vStr($b, 'direccion', 160);
    $tel = vStr($b, 'telefono', 20);
    if (!preg_match('/^\d{7,15}$/', $tel)) jsonError('Teléfono inválido (7 a 15 dígitos).');
    return [$nombre, $apellido, $tipo, $doc, $email, $rol, $dir, $tel];
}

function doRegister(array $b): void {
    [$nombre, $apellido, $tipo, $doc, $email, $rol, $dir, $tel] = validarComunes($b);
    $pass = (string)($b['password'] ?? '');
    if (strlen($pass) < 6) jsonError('La contraseña debe tener al menos 6 caracteres.');

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, email, password, rol, direccion, telefono, estado)
                       VALUES (?,?,?,?,?,?,?,?,?,"Activo")')
            ->execute([$nombre, $apellido, $tipo, $doc, $email,
                       password_hash($pass, PASSWORD_DEFAULT), $rol, $dir, $tel]);
        $id = (int)$pdo->lastInsertId();

        // Relación "TIENE" del diagrama ER: Usuario 1:1 Cliente y Usuario 1:1 Proveedor
        if ($rol === 'Cliente') {
            $pdo->prepare('INSERT INTO clientes (id_usuario, nombre, email, telefono) VALUES (?,?,?,?)')
                ->execute([$id, trim($nombre . ' ' . $apellido), $email, $tel]);
        }
        if ($rol === 'Proveedor') {
            $pdo->prepare('INSERT INTO proveedores (id_usuario, nombre, contacto) VALUES (?,?,?)')
                ->execute([$id, trim($nombre . ' ' . $apellido), $tel]);
        }
        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        // ✔ E1 CORREGIDO: mensaje del caso de uso CU001 2.a en vez de SQLSTATE crudo
        if ($e->getCode() === '23000') jsonError('Este correo o documento ya está registrado.');
        throw $e;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
    logBD('Registro de cuenta: ' . $email . ' (rol ' . $rol . ')', 'CREAR', 'Auth');
    jsonOk(['registrado' => true, 'nombre' => $nombre, 'rol' => $rol, 'id_usuario' => $id]);
}

function doLogin(array $b): void {
    $email = vEmail($b);
    $pass  = (string)($b['password'] ?? '');
    $st = db()->prepare('SELECT * FROM usuarios WHERE email = ?');
    $st->execute([$email]);
    $u = $st->fetch();
    if (!$u || !password_verify($pass, $u['password']))
        jsonError('Los datos ingresados no son correctos.', 401);        // CU002 3.a
    if ($u['estado'] === 'Inactivo') jsonError('Tu cuenta está inactiva. Contacta al administrador.', 403);
    iniciarSesion((int)$u['id_usuario']);
    logBD('Inició sesión: ' . $email, 'LOGIN', 'Auth');
}

function _datosUsuario(int $id): array {
    $st = db()->prepare('SELECT u.id_usuario,u.nombre,u.apellido,u.tipo_documento,u.numero_documento,
                                u.email,u.rol,u.direccion,u.telefono,u.estado,COALESCE(c.saldo,0) saldo
                         FROM usuarios u LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
                         WHERE u.id_usuario = ?');
    $st->execute([$id]);
    return (array)$st->fetch();
}

function iniciarSesion(int $id): void {
    $u = _datosUsuario($id);
    session_regenerate_id(true);
    $_SESSION = ['id_usuario' => (int)$u['id_usuario'], 'nombre' => $u['nombre'],
                 'apellido' => $u['apellido'], 'email' => $u['email'], 'rol' => $u['rol']];
    jsonOk($u);                                                          // CU002: redirige por rol (JS)
}

function doCurrent(): void {
    if (empty($_SESSION['id_usuario'])) jsonOk(null);
    $u = _datosUsuario((int)$_SESSION['id_usuario']);
    if (!$u || $u['estado'] === 'Inactivo') { $_SESSION = []; jsonOk(null); }
    jsonOk($u);
}

function doLogout(): void {
    logBD('Cerró sesión', 'LOGOUT', 'Auth');
    $_SESSION = [];
    session_destroy();
    jsonOk(['mensaje' => 'Sesión cerrada correctamente.']);
}