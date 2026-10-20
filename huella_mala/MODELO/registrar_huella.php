<?php
include("conecta.php");

date_default_timezone_set('America/Bogota');
header('Content-Type: application/json; charset=utf-8');

$id_est = "";
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['id_huella'])) {
    $id_est = $_POST['id_huella'];
} elseif (isset($_GET['id'])) {
    $id_est = $_GET['id'];
}

$response = array("status" => "error", "message" => "ID no proporcionado.");

if (!empty($id_est)) {
    $id_est = $conexion->real_escape_string($id_est);

    // 1. Verificamos que el estudiante exista y traemos su foto
    // (Ajusta los nombres de columnas 'ID_EST', 'NOMBRE', 'CURSO', 'FOTO' si en tu BD se llaman diferente)
    $verificar = "SELECT * FROM estudiantes WHERE ID_EST = '$id_est'";
    $resultado = $conexion->query($verificar);

    if ($resultado && $resultado->num_rows > 0) {
        $row = $resultado->fetch_assoc();
        
        $nombreEstudiante = isset($row['NOMBRE']) ? $row['NOMBRE'] : "Estudiante";
        $cursoEstudiante = isset($row['CURSO']) ? $row['CURSO'] : "";
        // Ajusta la ruta de la carpeta donde guardas las fotos de los estudiantes subidas
        $fotoEstudiante = isset($row['FOTO']) && !empty($row['FOTO']) ? "../VISTA/uploads/" . $row['FOTO'] : "../VISTA/img/default.png";

        // 2. Insertamos la asistencia en la tabla correspondiente
        $sql = "INSERT INTO asistencia_huella (ID_EST, fecha_hora) VALUES ('$id_est', NOW())";

        if ($conexion->query($sql)) {
            $fechaLegible = date('d/m/Y h:i A');
            
            // 3. Respuesta con éxito, datos, foto y mensaje
            $response = array(
                "status" => "exito",
                "nombre" => $nombreEstudiante,
                "curso" => $cursoEstudiante,
                "foto" => $fotoEstudiante,
                "message" => "Asistencia registrada correctamente a las " . $fechaLegible
            );
        } else {
            $response = array(
                "status" => "error", 
                "message" => "Error al guardar en la base de datos: " . $conexion->error
            );
        }
    } else {
        $response = array(
            "status" => "error", 
            "message" => "El ID de estudiante no se encuentra registrado en el sistema."
        );
    }
}

echo json_encode($response);
exit;
?>