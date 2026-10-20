document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Cargar datos de sesión
        let resSesion = await fetch('../MODELO/obtener_sesion_estudiante.php');
        let dataSesion = await resSesion.json();
        if (dataSesion.status === "exito") {
            document.getElementById('txtNombreEstudiante').textContent = dataSesion.nombre;
            document.getElementById('txtCursoEstudiante').textContent = dataSesion.curso;
            document.getElementById('txtCorreoEstudiante').textContent = dataSesion.correo;
        } else {
            window.location.href = "sesion.html";
            return;
        }

        // 2. Cargar Menú del Día
        let resMenu = await fetch('../MODELO/obtener_menu.php');
        let dataMenu = await resMenu.json();
        if (dataMenu.status === "exito") {
            document.getElementById('txtNomMenu').textContent = dataMenu.nombre_menu;
            document.getElementById('txtIngreMenu').textContent = dataMenu.ingredientes;
        }

        // 3. Cargar Asistencias e Historial
        let resAsis = await fetch('../MODELO/obtener_asistencias_estudiante.php');
        let dataAsis = await resAsis.json();
        
        if (dataAsis.status === "exito") {
            document.getElementById('txtTotalAsistencias').textContent = dataAsis.total;
            
            let tbody = document.getElementById('tablaHistorial');
            tbody.innerHTML = "";

            if (dataAsis.historial && dataAsis.historial.length > 0) {
                dataAsis.historial.forEach(item => {
                    let fechaOriginal = item.FECHA_HORA; // Ejemplo: "2026-09-30 22:02:20"
                    let fechaFormateada = fechaOriginal;
                    
                    if (fechaOriginal && fechaOriginal !== "0000-00-00 00:00:00") {
                        let partes = fechaOriginal.split(" ");
                        let fechaPartes = partes[0].split("-"); // [2026, 09, 30]
                        let anio = fechaPartes[0];
                        let mes = fechaPartes[1];
                        let dia = fechaPartes[2];
                        
                        let horaPartes = partes[1]; // "22:02:20"
                        let [h, m, s] = horaPartes.split(":");
                        let horaInt = parseInt(h, 10);
                        let ampm = horaInt >= 12 ? 'PM' : 'AM';
                        horaInt = horaInt % 12;
                        horaInt = horaInt ? horaInt : 12;
                        
                        let hora12 = `${String(horaInt).padStart(2, '0')}:${m}:${s} ${ampm}`;
                        fechaFormateada = `${dia}/${mes}/${anio} ${hora12}`;
                    }

                    tbody.innerHTML += `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px; font-weight: bold;">#${item.ID_ASISTENCIA}</td>
                            <td style="padding: 10px; color: #333;"><i class="fa-regular fa-clock" style="color: #2e7d32;"></i> ${fechaFormateada}</td>
                        </tr>
                    `;
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #666;">No tienes registros de huella todavía.</td></tr>`;
            }
        } else {
            document.getElementById('tablaHistorial').innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #e65100;">No se pudo cargar el historial de asistencias.</td></tr>`;
        }

    } catch (error) {
        console.error("Error general:", error);
        document.getElementById('tablaHistorial').innerHTML = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: red;">Error de conexión con el servidor.</td></tr>`;
    }
});