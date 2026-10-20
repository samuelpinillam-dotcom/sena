<?php
header('Content-Type: application/json');

$conexion = new mysqli("localhost", "root", "", "comedor");

if ($conexion->connect_error) {
    echo json_encode(["status" => "error", "message" => "Error de conexión a la base de datos"]);
    exit();
}

$nombre = $_POST['nombre'] ?? '';
$curso = $_POST['curso'] ?? '';
$correo = $_POST['correo'] ?? '';

if(empty($nombre) || empty($curso) || empty($correo)) {
    echo json_encode(["status" => "error", "message" => "Por favor completa todos los campos"]);
    exit();
}

$sql = "INSERT INTO estudiantes (nombre, curso, correo) VALUES (?, ?, ?)";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("sss", $nombre, $curso, $correo);

if ($stmt->execute()) {
    echo json_encode(["status" => "exito", "message" => "¡Estudiante guardado con éxito!"]);
} else {
    echo json_encode(["status" => "error", "message" => "Error al registrar en la base de datos"]);
}

$stmt->close();
$conexion->close();
?>