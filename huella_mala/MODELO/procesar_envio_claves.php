<?php
include("../CONTROLADOR/uno.php");

require '../phpmailer/Exception.php';
require '../phpmailer/PHPMailer.php';
require '../phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

date_default_timezone_set('America/Bogota');

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['estudiantes_sel'])) {
    $ids_seleccionados = $_POST['estudiantes_sel'];
    $enviados = 0;

    foreach ($ids_seleccionados as $id_est) {
        $id_est = $conexion->real_escape_string($id_est);

        // Consultar datos del estudiante incluyendo el CURSO
        $res = $conexion->query("SELECT NOMBRE, CURSO, CORREO FROM estudiantes WHERE ID_EST = '$id_est'");
        if ($res && $res->num_rows > 0) {
            $row = $res->fetch_assoc();
            $nombre = $row['NOMBRE'];
            $curso = $row['CURSO'];
            $correo = $row['CORREO'];

            // Corrección automática por si al correo institucional le falta la 'l' final
            $correo = str_replace('@juandelcorra.edu.co', '@juandelcorral.edu.co', $correo);

            // Generar contraseña aleatoria de 8 caracteres
            $caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            $password_plana = substr(str_shuffle($caracteres), 0, 8);
            $password_hash = password_hash($password_plana, PASSWORD_DEFAULT);

            // Actualizar contraseña en la base de datos
            $conexion->query("UPDATE estudiantes SET PASSWORD = '$password_hash' WHERE ID_EST = '$id_est'");

            // --- GENERAR CÓDIGO QR ---
            // Contenido ajustado estrictamente al ID del estudiante para que el lector de la cámara lo reconozca
            $contenido_qr = $id_est;
            $qr_url = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" . urlencode($contenido_qr);

            // Enviar correo con PHPMailer
            $mail = new PHPMailer(true);
            try {
                $mail->isSMTP();
                $mail->Host       = 'smtp.gmail.com';
                $mail->SMTPAuth   = true;
                $mail->Username   = 'kevinsgonzalezc@juandelcorral.edu.co'; 
                $mail->Password   = 'jthsrbzrqnvzfovv'; 
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port       = 587;

                $mail->setFrom('kevinsgonzalezc@juandelcorral.edu.co', 'Sistema Olmes & Asociados');
                $mail->addAddress($correo, $nombre);

                $mail->isHTML(true);
                $mail->Subject = 'Tu acceso y Código QR personal - Sistema de Asistencia';
                
                // Cuerpo del mensaje con la clave y la imagen del QR incrustada
                $mail->Body    = "Hola <b>$nombre</b> (Curso: $curso),<br><br>
                                  Tu acceso al sistema ha sido procesado. Se te ha generado una contraseña:<br><br>
                                  <b>Contraseña:</b> <span style='font-size: 16px; color: #2e7d32;'>$password_plana</span><br><br>
                                  <b>Tu Código QR Personal de Asistencia:</b><br>
                                  <img src='$qr_url' alt='Código QR del estudiante' style='margin-top: 10px; border: 2px solid #ccc; padding: 5px;'><br><br>
                                  Guarda muy bien tu contraseña y ten a la mano este código QR para escanearlo en tus ingresos.<br><br>
                                  Atentamente,<br><b>Olmes & Asociados</b>";

                $mail->send();
                $enviados++;
            } catch (Exception $e) {
                continue;
            }
        }
    }

    // Pantalla de resultado final bonita
    echo '<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Resultado de Envío</title>
        <link rel="stylesheet" href="../VISTA/CSS/estilo.css">
        <link rel="stylesheet" href="../VISTA/CSS/asistencia_manual.css">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8f9fa;">
        <div class="manual-container" style="text-align: center; max-width: 500px;">
            <h2 style="color: #1b4d3e; margin-bottom: 15px;"><i class="fa-solid fa-circle-check" style="font-size: 48px; color: #28a745; display: block; margin-bottom: 10px;"></i> ¡Envío Exitoso!</h2>
            <p style="font-size: 16px; color: #555; margin-bottom: 25px;">Se han generado y enviado las contraseñas y códigos QR correctamente a <b>'.$enviados.'</b> estudiantes.</p>
            <a href="../VISTA/enviar_claves_vista.php" class="btn-registrar" style="text-decoration: none; display: inline-block;">Volver al panel</a>
        </div>
    </body>
    </html>';
} else {
    header("Location: ../VISTA/enviar_claves_vista.php");
}
?>