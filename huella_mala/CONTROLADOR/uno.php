<?php
session_start();

// 1. La conexión a la base de datos va SIEMPRE independiente arriba
$conexion = new mysqli("localhost", "root", "", "comedor");

if ($conexion->connect_error) {
    die("Error de conexión con la base de datos: " . $conexion->connect_error);
}
$conexion->set_charset("utf8");

// 2. La lógica del login solo se ejecuta si el usuario envió el formulario
$n = "admon";
$pa = "12345";

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['usu']) && isset($_POST['pass'])) 
{
    $usuario = $_POST['usu'];
    $clave = $_POST['pass'];
     
    // Validar si es el Administrador
    if ($n == $usuario && $pa == $clave)
    {
        $_SESSION['admin'] = true;
        header("Location: ../VISTA/administrador.html");
        exit();
    }
    else
    {
        // Buscamos al estudiante ÚNICAMENTE por su correo
        $sql = "SELECT * FROM estudiantes WHERE CORREO = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("s", $usuario);
        $stmt->execute();
        $resultado = $stmt->get_result();

        if ($row = $resultado->fetch_assoc()) {
            
            // Verificamos si la contraseña escrita coincide con el hash encriptado de la BD
            if (password_verify($clave, $row['password'])) {
                
                // Guardamos la sesión usando los nombres exactos de las columnas
                $_SESSION['id_estudiante'] = $row['ID_EST'];
                $_SESSION['nombre_estudiante'] = $row['NOMBRE'];
                $_SESSION['curso_estudiante'] = $row['CURSO'];
                $_SESSION['correo_estudiante'] = $row['CORREO'];
                
                // Redirigimos al panel del estudiante
                header("Location: ../VISTA/dashboard_estudiante.html");
                exit();
                
            } else {
                echo "<script>alert('Contraseña incorrecta'); window.location='../VISTA/sesion.html';</script>";
            }
            
        } else {
            echo "<script>alert('El correo no está registrado'); window.location='../VISTA/sesion.html';</script>";
        }

        $stmt->close();
    }
}
?>