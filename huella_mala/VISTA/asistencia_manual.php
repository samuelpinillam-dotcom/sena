<?php
// 1. Conexión a la base de datos
include("../CONTROLADOR/uno.php");

date_default_timezone_set('America/Bogota');
$mensaje = "";
$tipo_alerta = "";

// 2. Obtener la lista de cursos únicos para el primer selector
$query_cursos = "SELECT DISTINCT CURSO FROM estudiantes ORDER BY CURSO ASC";
$resultado_cursos = $conexion->query($query_cursos);

// Curso seleccionado actualmente (si ya se envió el formulario de filtro)
$curso_seleccionado = isset($_POST['curso']) ? $conexion->real_escape_string($_POST['curso']) : '';

// 3. Procesar el guardado masivo de asistencia si se envió la lista
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['guardar_asistencia'])) {
    if (isset($_POST['asistencia']) && is_array($_POST['asistencia'])) {
        $registros_exitosos = 0;
        
        foreach ($_POST['asistencia'] as $id_est => $estado) {
            $id_est = $conexion->real_escape_string($id_est);
            $estado = $conexion->real_escape_string($estado); // '1' para chulito, '0' para X
            
            if ($estado == '1') {
                // Insertar asistencia en la base de datos
                $sql = "INSERT INTO asistencia_huella (ID_EST, fecha_hora) VALUES ('$id_est', NOW())";
                if ($conexion->query($sql)) {
                    $registros_exitosos++;
                }
            }
        }
        $mensaje = "¡Se registraron $registros_exitosos asistencias correctamente para el curso $curso_seleccionado!";
        $tipo_alerta = "exito";
    } else {
        $mensaje = "No se seleccionó ningún estado de asistencia.";
        $tipo_alerta = "error";
    }
}

// 4. Consultar estudiantes del curso seleccionado
$estudiantes_curso = null;
if (!empty($curso_seleccionado)) {
    $sql_est = "SELECT ID_EST, NOMBRE FROM estudiantes WHERE CURSO = '$curso_seleccionado' ORDER BY NOMBRE ASC";
    $estudiantes_curso = $conexion->query($sql_est);
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paso de Lista por Curso - Olmes & Asociados</title>

    <link rel="stylesheet" href="../VISTA/CSS/estilo.css">
    <link rel="stylesheet" href="../VISTA/CSS/asistencia_manual.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>

<body>

    <header>
        <div class="logo">
            <h1>Olmes & Asociados</h1>
            <p>Sistema Administrador</p>
        </div>

        <nav>
            <ul class="menu">
                <li><a href="../VISTA/administrador.html">Inicio</a></li>
                <li>
                    <a href="#" class="activo">Ingreso</a>
                    <ul class="submenu">
                        <li><a href="../VISTA/registro_huella.html"><i class="fa-solid fa-fingerprint"></i> Huellero Físico</a></li>
                        <li><a href="../VISTA/escaner_qr.html"><i class="fa-solid fa-qrcode"></i> Escanear Código QR</a></li>
                        <li><a href="asistencia_manual.php"><i class="fa-solid fa-keyboard"></i> Registro Digital / Manual</a></li>
                         <li><a href="enviar_claves_vista.php"><i class="fa-solid fa-envelope-circle-check"></i> Enviar Contraseñas</a></li>
                    </ul>
                </li>
                <li><a href="../VISTA/REGESTU.html">Estudiantes</a></li>
                <li><a href="../VISTA/CONSULTA.html">Consultar</a></li>
                <li><a href="../VISTA/actulizar.html">Actualizar</a></li>
                <li><a href="../VISTA/eliminar.html">Eliminar</a></li>
                <li><a href="logout_admin.php" style="background-color: #d9534f; color: white; border-radius: 4px;">Salir</a></li>
            </ul>
        </nav>
    </header>

    <section class="contenido">
        <div class="manual-container" style="max-width: 800px;">
            <h2><i class="fa-solid fa-clipboard-user"></i> Paso de Lista por Curso</h2>
            <p style="color: #666; margin-bottom: 25px;">Seleccione el curso para cargar la lista de estudiantes y registrar quiénes pasan a almorzar.</p>

            <!-- Alerta dinámica -->
            <?php if (!empty($mensaje)): ?>
                <div class="alerta alerta-<?php echo $tipo_alerta; ?>">
                    <?php echo $mensaje; ?>
                </div>
            <?php endif; ?>

            <!-- FORMULARIO 1: Seleccionar el curso -->
            <div class="filtro-curso-card">
                <form action="asistencia_manual.php" method="POST" class="filtro-grid">
                    <div class="form-group">
                        <label for="curso"><i class="fa-solid fa-graduation-cap"></i> Seleccionar Curso:</label>
                        <select name="curso" id="curso" class="form-control" required>
                            <option value="">-- Seleccione un curso --</option>
                            <?php
                            if ($resultado_cursos && $resultado_cursos->num_rows > 0) {
                                while ($c = $resultado_cursos->fetch_assoc()) {
                                    $selected = ($curso_seleccionado == $c['CURSO']) ? 'selected' : '';
                                    echo '<option value="'.$c['CURSO'].'" '.$selected.'>Curso: '.$c['CURSO'].'</option>';
                                }
                            }
                            ?>
                        </select>
                    </div>
                    <button type="submit" class="btn-cargar-lista">
                        <i class="fa-solid fa-filter"></i> Cargar Lista
                    </button>
                </form>
            </div>

            <!-- FORMULARIO 2: Tabla de estudiantes con Chulito y X -->
            <?php if (!empty($curso_seleccionado)): ?>
                <form action="asistencia_manual.php" method="POST">
                    <input type="hidden" name="curso" value="<?php echo $curso_seleccionado; ?>">

                    <h3 style="margin-top: 20px; color: #1b4d3e;">Estudiantes del Curso: <?php echo $curso_seleccionado; ?></h3>
                    
                    <?php if ($estudiantes_curso && $estudiantes_curso->num_rows > 0): ?>
                        <table class="tabla-asistencia">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre del Estudiante</th>
                                    <th style="text-align: center;">Asistencia (✅ Pasa / ❌ No está)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php while($est = $estudiantes_curso->fetch_assoc()): ?>
                                    <tr>
                                        <td><?php echo $est['ID_EST']; ?></td>
                                        <td><?php echo $est['NOMBRE']; ?></td>
                                        <td style="text-align: center;">
                                            <div class="opciones-asistencia">
                                                <!-- Botón Chulito (Asistió) -->
                                                <label class="btn-check" id="lbl_check_<?php echo $est['ID_EST']; ?>">
                                                    <input type="radio" name="asistencia[<?php echo $est['ID_EST']; ?>]" value="1" class="radio-asistencia" required onchange="marcarOpcion(<?php echo $est['ID_EST']; ?>, '1')">
                                                    <i class="fa-solid fa-check"></i> Sí
                                                </label>
                                                
                                                <!-- Botón X (No Asistió) -->
                                                <label class="btn-x" id="lbl_x_<?php echo $est['ID_EST']; ?>">
                                                    <input type="radio" name="asistencia[<?php echo $est['ID_EST']; ?>]" value="0" class="radio-asistencia" onchange="marcarOpcion(<?php echo $est['ID_EST']; ?>, '0')">
                                                    <i class="fa-solid fa-xmark"></i> No
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endwhile; ?>
                            </tbody>
                        </table>

                        <button type="submit" name="guardar_asistencia" class="btn-registrar" style="margin-top: 25px;">
                            <i class="fa-solid fa-floppy-disk"></i> Guardar Asistencia del Curso
                        </button>
                    <?php else: ?>
                        <p style="color: #d9534f; margin-top: 15px;">No se encontraron estudiantes registrados en este curso.</p>
                    <?php endif; ?>
                </form>
            <?php endif; ?>

        </div>
    </section>

    <footer>
        <p>© 2026 Olmes & Asociados | Sistema CRUD Empresarial</p>
    </footer>

    <!-- Archivo JS separado -->
    <script src="../VISTA/JS/asistencia_manual.js"></script>
</body>
</html>