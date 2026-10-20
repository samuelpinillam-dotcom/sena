<?php
session_start();
header('Content-Type: application/json');

error_reporting(0);
ini_set('display_errors', 0);

if (!isset($_SESSION['correo']) && !isset($_SESSION['id_estudiante'])) {
    echo json_encode(["status" => "error", "mensaje" => "Sesión no iniciada"]);
    exit();
}

$conexion = new mysqli("localhost", "root", "", "comedor");

if ($conexion->connect_error) {
    echo json_encode(["status" => "error", "mensaje" => "Error de conexión"]);
    exit();
}

// Obtenemos el ID real del estudiante basado en su correo de sesión o ID actual
$id_estudiante = $_SESSION['id_estudiante'] ?? 0;
$correo = $_SESSION['correo'] ?? '';

if ($id_estudiante == 0 && !empty($correo)) {
    $stmt_u = $conexion->prepare("SELECT ID FROM estudiantes WHERE CORREO = ?");
    $stmt_u->bind_param("s", $correo);
    $stmt_u->execute();
    $res_u = $stmt_u->get_result()->fetch_assoc();
    if ($res_u) {
        $id_estudiante = $res_u['ID'];
    }
    $stmt_u->close();
}

// 1. Contar total de asistencias válidas (excluyendo las que tienen fecha en ceros)
$total = 0;
if ($stmt = $conexion->prepare("SELECT COUNT(*) as total FROM asistencia_huella WHERE ID_EST = ? AND FECHA_HORA != '0000-00-00 00:00:00'")) {
    $stmt->bind_param("i", $id_estudiante);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    $total = $res['total'] ?? 0;
    $stmt->close();
}

// 2. Obtener el historial reciente omitiendo los registros en ceros
$historial = [];
if ($stmt_h = $conexion->prepare("SELECT ID_ASISTENCIA, FECHA_HORA FROM asistencia_huella WHERE ID_EST = ? AND FECHA_HORA != '0000-00-00 00:00:00' ORDER BY ID_ASISTENCIA DESC LIMIT 5")) {
    $stmt_h->bind_param("i", $id_estudiante);
    $stmt_h->execute();
    $resultado_h = $stmt_h->get_result();
    while ($row = $resultado_h->fetch_assoc()) {
        $historial[] = $row;
    }
    $stmt_h->close();
}

$conexion->close();

echo json_encode([
    "status" => "exito",
    "total" => $total,
    "historial" => $historial
]);
?>