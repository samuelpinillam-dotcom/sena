<?php
// 1. Incluir conexión y la librería de PHPMailer
include("../CONTROLADOR/uno.php");

require 'phpmailer/Exception.php';
require 'phpmailer/PHPMailer.php';
require 'phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

date_default_timezone_set('America/Bogota');

// 2. Consultar estudiantes que asistieron HOY y tienen correo
$sql = "SELECT DISTINCT e.ID_EST, e.NOMBRE, e.CORREO 
        FROM estudiantes e 
        INNER JOIN asistencia_huella a ON e.ID_EST = a.ID_EST 
        WHERE DATE(a.fecha_hora) = CURDATE() AND e.CORREO IS NOT NULL AND e.CORREO != ''";

$resultado = $conexion->query($sql);
$enviados = 0;

if ($resultado && $resultado->num_rows > 0) {
    while ($row = $resultado->fetch_assoc()) {
        $id_est = $row['ID_EST'];
        $nombre = $row['NOMBRE'];
        $correo = $row['CORREO'];

        // 3. Generar contraseña aleatoria de 8 caracteres
        $caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        $password_plana = substr(str_shuffle($caracteres), 0, 8);
        
        // Encriptar contraseña para guardarla de forma segura
        $password_hash = password_hash($password_plana, PASSWORD_DEFAULT);

        // 4. Actualizar la contraseña en la base de datos
        $update = "UPDATE estudiantes SET PASSWORD = '$password_hash' WHERE ID_EST = '$id_est'";
        $conexion->query($update);

        // 5. Configurar PHPMailer para enviar el correo real desde Gmail
        $mail = new PHPMailer(true);

        try {
            // Configuración del servidor SMTP de Gmail
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'tucorreo@gmail.com'; // <-- PON TU CORREO DE GMAIL AQUÍ
            $mail->Password   = 'xxxx xxxx xxxx xxxx'; // <-- PON TU CONTRASEÑA DE APLICACIÓN DE GMAIL AQUÍ
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            // Remitente y destinatario
            $mail->setFrom('tucorreo@gmail.com', 'Sistema Olmes & Asociados');
            $mail->addAddress($correo, $nombre);

            // Contenido del correo
            $mail->isHTML(true);
            $mail->Subject = 'Tu nueva contraseña de acceso al sistema';
            $mail->Body    = "Hola <b>$nombre</b>,<br><br>Tu asistencia del día de hoy ha sido registrada con éxito. Se te ha asignado una contraseña de acceso para la plataforma:<br><br>
                              <b>Contraseña:</b> <span style='font-size: 16px; color: #2e7d32;'>$password_plana</span><br><br>
                              Guárdala muy bien para tus próximos ingresos.<br><br>Atentamente,<br><b>Olmes & Asociados</b>";

            $mail->send();
            $enviados++;
        } catch (Exception $e) {
            // Si algún correo falla, continúa con los demás
            continue;
        }
    }
    echo "¡Proceso finalizado! Se generaron y enviaron contraseñas a $enviados estudiantes que asistieron hoy.";
} else {
    echo "No hay estudiantes con asistencia registrada el día de hoy que tengan un correo válido.";
}
?>