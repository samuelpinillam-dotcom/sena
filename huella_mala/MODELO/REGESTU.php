<?php
include("conecta.php"); // O como llames a tu archivo de conexión

// Recibir los datos enviados por POST desde REGESTU.html
$nombre = $_POST['nom'];
$curso = $_POST['cur'];
$correo = $_POST['co'];

// Insertar en la tabla estudiantes
$sql = "INSERT INTO estudiantes (NOMBRE, CURSO, CORREO) VALUES ('$nombre', '$curso', '$correo')";

if ($conexion->query($sql) === TRUE) {
    // Redirige automáticamente a exito.html ubicado en la raíz del proyecto
    header("Location: ../VISTA/exito.html");
exit();
} else {
    echo "Error: " . $sql . "<br>" . $conexion->error;
}
?>