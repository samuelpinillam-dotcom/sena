<?php
session_start();
header('Content-Type: application/json');

// Conexión a la base de datos comedor
$conexion = new mysqli("localhost", "root", "", "comedor");

if ($conexion->connect_error) {
    echo json_encode(["status" => "error", "mensaje" => "Error de conexión"]);
    exit();
}

// Consultamos el menú registrado
$sql = "SELECT * FROM menu LIMIT 1";
$resultado = $conexion->query($sql);

if ($row = $resultado->fetch_assoc()) {
    echo json_encode([
        "status" => "exito",
        "nombre_menu" => $row['NOM_MENU'],
        "ingredientes" => $row['INGRE_MENU']
    ]);
} else {
    echo json_encode([
        "status" => "vacio",
        "nombre_menu" => "No disponible",
        "ingredientes" => "No hay menú registrado para hoy."
    ]);
}

$conexion->close();
?>