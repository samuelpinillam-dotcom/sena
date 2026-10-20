<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['nombre_estudiante'])) {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit();
}

echo json_encode([
    "status" => "exito",
    "nombre" => $_SESSION['nombre_estudiante'],
    "curso" => $_SESSION['curso_estudiante'],
    "correo" => $_SESSION['correo_estudiante']
]);
?>