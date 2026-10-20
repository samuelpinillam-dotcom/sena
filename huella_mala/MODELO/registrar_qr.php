<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

if (file_exists("../CONTROLADOR/uno.php")) {
    include("../CONTROLADOR/uno.php");
} else {
    echo json_encode(['status' => 'error', 'message' => 'Error crítico: No se encontró el archivo de conexión uno.php']);
    exit;
}

date_default_timezone_set('America/Bogota');

if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'No se recibió el ID del estudiante.']);
    exit;
}

$id_est = $conexion->real_escape_string($_GET['id']);

// 1. Buscar al estudiante (eliminamos 'FOTO' porque esa columna no existe en la tabla)
$sql = "SELECT ID_EST, NOMBRE, CURSO FROM estudiantes WHERE ID_EST = '$id_est'";
$resultado = $conexion->query($sql);

if ($resultado && $resultado->num_rows > 0) {
    $row = $resultado->fetch_assoc();
    
    $nombre = $row['NOMBRE'];
    $curso = $row['CURSO'];

    // 2. Registrar la asistencia en la tabla asistencia_huella
    $fecha_hora = date('Y-m-d H:i:s');
    $sql_insert = "INSERT INTO asistencia_huella (ID_EST, FECHA_HORA) VALUES ('$id_est', '$fecha_hora')";
    
    if ($conexion->query($sql_insert)) {
        echo json_encode([
            'status' => 'exito',
            'nombre' => $nombre,
            'curso' => $curso,
            'foto' => 'img/default.png', // Imagen por defecto para que no falle la vista
            'message' => '¡Asistencia registrada correctamente por QR!'
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Error al guardar en la base de datos: ' . $conexion->error
        ]);
    }
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'El código QR con ID "' . $id_est . '" no existe en la base de datos.'
    ]);
}
?>