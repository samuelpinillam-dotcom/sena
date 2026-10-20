<?php
$conexion = new mysqli("localhost", "root", "", "comedor");

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}
else
        echo "<br> conexion a la BDD establecida<br>";
?>  