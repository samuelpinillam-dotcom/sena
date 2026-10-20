document.addEventListener("DOMContentLoaded", () => {
    const conectarBtn = document.getElementById('conectarBtn');
    const estadoSensor = document.getElementById('estadoSensor');
    
    const tarjetaExito = document.getElementById('tarjetaExito');
    const txtNombre = document.getElementById('txtNombre');
    const txtCurso = document.getElementById('txtCurso');
    const txtHora = document.getElementById('txtHora');
    const btnSiguiente = document.getElementById('btnSiguiente');

    let esperandoSiguiente = false; // Bandera para pausar el sensor mientras ven la tarjeta

    // ==========================================
    // 1. LÓGICA PARA GUARDAR ESTUDIANTE (FORMULARIO)
    // ==========================================
    const formRegistroEstudiante = document.getElementById('formRegistroEstudiante');
    const mensajeRegistroForm = document.getElementById('mensajeRegistroForm');

    if (formRegistroEstudiante) {
        formRegistroEstudiante.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que la página se recargue y se desconecte el puerto serial
            
            const nombre = document.getElementById('nombreEstudiante').value;
            const curso = document.getElementById('cursoEstudiante').value;
            const correo = document.getElementById('correoEstudiante').value;

            mensajeRegistroForm.textContent = "Guardando en la base de datos...";
            mensajeRegistroForm.style.color = "#007bff";

            try {
                let respuesta = await fetch('../MODELO/guardar_estudiante.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `nombre=${encodeURIComponent(nombre)}&curso=${encodeURIComponent(curso)}&correo=${encodeURIComponent(correo)}`
                });
                
                let resultado = await respuesta.json();

                if(resultado.status === "exito") {
                    mensajeRegistroForm.textContent = "✅ " + resultado.message;
                    mensajeRegistroForm.style.color = "#28a745";
                    formRegistroEstudiante.reset(); // Limpia los campos del formulario tras guardar
                } else {
                    mensajeRegistroForm.textContent = "❌ " + resultado.message;
                    mensajeRegistroForm.style.color = "#d9534f";
                }
            } catch (error) {
                console.error("Error al registrar:", error);
                mensajeRegistroForm.textContent = "❌ Error de conexión con el servidor PHP.";
                mensajeRegistroForm.style.color = "#d9534f";
            }
        });
    }

    // ==========================================
    // 2. LÓGICA ORIGINAL DEL LECTOR BIOMÉTRICO (ARDUINO)
    // ==========================================

    // Evento del botón "Siguiente Estudiante"
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', () => {
            tarjetaExito.style.display = "none";
            estadoSensor.style.display = "block";
            estadoSensor.textContent = "🟢 Conectado y escuchando huellas...";
            estadoSensor.style.color = "#28a745";
            esperandoSiguiente = false; // Volvemos a habilitar la lectura de huellas
        });
    }

    if (conectarBtn) {
        conectarBtn.addEventListener('click', async () => {
            try {
                const port = await navigator.serial.requestPort();
                await port.open({ baudRate: 9600 });

                estadoSensor.textContent = "🟢 Conectado y escuchando huellas...";
                estadoSensor.style.color = "#28a745";
                conectarBtn.style.display = "none";

                const textDecoder = new TextDecoderStream();
                port.readable.pipeTo(textDecoder.writable);
                const reader = textDecoder.readable.getReader();

                let buffer = "";

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        reader.releaseLock();
                        break;
                    }

                    // Si estamos mostrando la tarjeta, ignoramos las lecturas hasta que le den clic en "Siguiente"
                    if (esperandoSiguiente) {
                        continue; 
                    }

                    if (value) {
                        buffer += value;
                        let lines = buffer.split("\n");
                        buffer = lines.pop();

                        for (let line of lines) {
                            let textoLimpio = line.trim();
                            console.log("Dato recibido del sensor:", textoLimpio);

                            let numeroLimpio = textoLimpio.replace(/\D/g, ""); 

                            if (numeroLimpio !== "") {
                                console.log("¡ID detectado! Enviando a la base de datos...", numeroLimpio);
                                
                                try {
                                    let respuesta = await fetch(`../MODELO/registrar_huella.php?id=${numeroLimpio}`);
                                    let resultadoJson = await respuesta.json();
                                    
                                    if(resultadoJson.status === "exito") {
                                        esperandoSiguiente = true; // Pausamos nuevas lecturas

                                        txtNombre.textContent = resultadoJson.nombre;
                                        txtCurso.textContent = resultadoJson.curso;
                                        txtHora.textContent = resultadoJson.hora;

                                        estadoSensor.style.display = "none";
                                        tarjetaExito.style.display = "block";
                                    } else {
                                        tarjetaExito.style.display = "none";
                                        estadoSensor.style.display = "block";
                                        estadoSensor.innerHTML = `❌ ${resultadoJson.message}`;
                                        estadoSensor.style.color = "#d9534f";

                                        // Si hay error (ej: ID no registrado), regresamos a escuchar en 3 segundos automáticamente
                                        setTimeout(() => {
                                            if (!esperandoSiguiente) {
                                                estadoSensor.textContent = "🟢 Conectado y escuchando huellas...";
                                                estadoSensor.style.color = "#28a745";
                                            }
                                        }, 3000);
                                    }

                                } catch (err) {
                                    console.error("Error al comunicarse con el PHP:", err);
                                    tarjetaExito.style.display = "none";
                                    estadoSensor.style.display = "block";
                                    estadoSensor.textContent = "❌ Error al procesar la respuesta del servidor.";
                                    estadoSensor.style.color = "#d9534f";
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                estadoSensor.textContent = "❌ Error al conectar con el puerto.";
                estadoSensor.style.color = "red";
            }
        });
    }
    
});

// Función para ocultar y mostrar el formulario rápido de estudiante
function toggleFormulario() {
    let seccion = document.getElementById('seccionFormulario');
    let boton = document.getElementById('btnToggleForm');

    if (seccion.style.display === "none") {
        seccion.style.display = "block";
        boton.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Ocultar Formulario';
        boton.style.backgroundColor = "#1b4d3e";
    } else {
        seccion.style.display = "none";
        boton.innerHTML = '<i class="fa-solid fa-eye"></i> Mostrar Formulario';
        boton.style.backgroundColor = "#28a745";
    }
}