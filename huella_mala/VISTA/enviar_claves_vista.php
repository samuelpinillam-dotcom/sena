<?php
// Incluimos la conexión para listar a los estudiantes
include("../CONTROLADOR/uno.php");

date_default_timezone_set('America/Bogota');

// Consultar todos los estudiantes que tienen correo válido (sin requerir asistencia estricta de hoy)
$sql = "SELECT ID_EST, NOMBRE, CURSO, CORREO 
        FROM estudiantes 
        WHERE CORREO IS NOT NULL AND CORREO != ''
        ORDER BY NOMBRE ASC";

$resultado = $conexion->query($sql);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Envío de Contraseñas y QR - Olmes & Asociados</title>
    <link rel="stylesheet" href="CSS/estilo.css">
    <link rel="stylesheet" href="CSS/asistencia_manual.css">
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
                <li><a href="administrador.html">Inicio</a></li>
                <li>
                    <a href="#" class="activo">Ingreso</a>
                    <ul class="submenu">
                        <li><a href="registro_huella.html"><i class="fa-solid fa-fingerprint"></i> Huellero Físico</a></li>
                        <li><a href="escaner_qr.html"><i class="fa-solid fa-qrcode"></i> Escanear Código QR</a></li>
                        <li><a href="../MODELO/asistencia_manual.php"><i class="fa-solid fa-keyboard"></i> Registro Digital / Manual</a></li>
                        <li><a href="enviar_claves_vista.php"><i class="fa-solid fa-envelope-circle-check"></i> Enviar Contraseñas</a></li>
                    </ul>
                </li>
                <li><a href="REGESTU.html">Estudiantes</a></li>
                <li><a href="CONSULTA.html">Consultar</a></li>
                <li><a href="actulizar.html">Actualizar</a></li>
                <li><a href="eliminar.html">Eliminar</a></li>
                <li><a href="../MODELO/logout_admin.php" style="background-color: #d9534f; color: white; border-radius: 4px;">Salir</a></li>
            </ul>
        </nav>
    </header>

    <section class="contenido">
        <div class="manual-container" style="max-width: 900px;">
            <h2><i class="fa-solid fa-envelope-circle-check"></i> Enviar Contraseñas y Códigos QR</h2>
            <p style="color: #666; margin-bottom: 20px;">Utiliza el buscador para filtrar por nombre o curso, selecciona a los estudiantes deseados y haz clic en el botón inferior para enviarles sus accesos.</p>

            <!-- Barra de Búsqueda Corregida -->
            <div style="margin-bottom: 20px;">
                <div style="position: relative; display: flex; align-items: center;">
                    <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 15px; color: #888; font-size: 16px; pointer-events: none;"></i>
                    <input type="text" id="buscadorEstudiantes" placeholder="Buscar por nombre o curso..." onkeyup="filtrarTabla()" style="width: 100%; padding: 12px 15px 12px 45px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; outline: none;">
                </div>
            </div>

            <form action="../MODELO/procesar_envio_claves.php" method="POST">
                <?php if ($resultado && $resultado->num_rows > 0): ?>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center;">
                        <span style="font-weight: bold; color: #1b4d3e;">Total estudiantes con correo: <?php echo $resultado->num_rows; ?></span>
                        <div>
                            <button type="button" onclick="marcarTodos(true)" style="background: none; border: none; color: #2e7d32; font-weight: bold; cursor: pointer; margin-right: 15px;"><i class="fa-solid fa-check-double"></i> Seleccionar todos</button>
                            <button type="button" onclick="marcarTodos(false)" style="background: none; border: none; color: #c62828; font-weight: bold; cursor: pointer;"><i class="fa-solid fa-square"></i> Deseleccionar todos</button>
                        </div>
                    </div>

                    <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
                        <table class="tabla-asistencia" id="tablaEstudiantes" style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f8fafc; position: sticky; top: 0; z-index: 1;">
                                <tr>
                                    <th style="text-align: center; width: 50px; padding: 12px;"><i class="fa-solid fa-square-check"></i></th>
                                    <th style="padding: 12px;">ID</th>
                                    <th style="padding: 12px;">Nombre del Estudiante</th>
                                    <th style="padding: 12px;">Curso</th>
                                    <th style="padding: 12px;">Correo Electrónico</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php while($row = $resultado->fetch_assoc()): ?>
                                    <tr>
                                        <td style="text-align: center; padding: 10px;">
                                            <input type="checkbox" name="estudiantes_sel[]" value="<?php echo $row['ID_EST']; ?>" checked style="width: 18px; height: 18px; cursor: pointer;">
                                        </td>
                                        <td style="padding: 10px;"><?php echo $row['ID_EST']; ?></td>
                                        <td style="padding: 10px;"><?php echo $row['NOMBRE']; ?></td>
                                        <td style="padding: 10px;"><?php echo $row['CURSO']; ?></td>
                                        <td style="padding: 10px;"><code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; color: #475569;"><?php echo $row['CORREO']; ?></code></td>
                                    </tr>
                                <?php endwhile; ?>
                            </tbody>
                        </table>
                    </div>

                    <button type="submit" class="btn-registrar" style="margin-top: 25px; background-color: #1b4d3e; width: 100%; padding: 14px; font-size: 16px; cursor: pointer; color: white; border: none; border-radius: 6px;">
                        <i class="fa-solid fa-paper-plane"></i> Generar y Enviar Contraseñas y QR Seleccionados
                    </button>
                <?php else: ?>
                    <div class="alerta alerta-error" style="margin-top: 20px;">
                        No hay estudiantes registrados con un correo electrónico válido en la base de datos.
                    </div>
                <?php endif; ?>
            </form>
        </div>
    </section>

    <footer>
        <p>© 2026 Olmes & Asociados | Sistema CRUD Empresarial</p>
    </footer>

    <script>
        function marcarTodos(estado) {
            const checkboxes = document.querySelectorAll('input[name="estudiantes_sel[]"]');
            checkboxes.forEach(cb => {
                const fila = cb.closest('tr');
                if (fila.style.display !== 'none') {
                    cb.checked = estado;
                }
            });
        }

        function filtrarTabla() {
            let input = document.getElementById("buscadorEstudiantes");
            let filtro = input.value.toLowerCase();
            let tabla = document.getElementById("tablaEstudiantes");
            let filas = tabla.getElementsByTagName("tr");

            for (let i = 1; i < filas.length; i++) {
                let celdaNombre = filas[i].getElementsByTagName("td")[2];
                let celdaCurso = filas[i].getElementsByTagName("td")[3];
                
                if (celdaNombre && celdaCurso) {
                    let textoNombre = celdaNombre.textContent || celdaNombre.innerText;
                    let textoCurso = celdaCurso.textContent || celdaCurso.innerText;
                    
                    if (textoNombre.toLowerCase().indexOf(filtro) > -1 || textoCurso.toLowerCase().indexOf(filtro) > -1) {
                        filas[i].style.display = "";
                    } else {
                        filas[i].style.display = "none";
                    }
                }
            }
        }
    </script>
</body>
</html>