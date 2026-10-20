document.addEventListener("DOMContentLoaded", function () {
    const html5QrCode = new Html5Qrcode("reader");
    const readerDiv = document.getElementById("reader");
    const cardResultado = document.getElementById("cardResultado");
    const contenidoResultado = document.getElementById("contenidoResultado");
    const btnSiguiente = document.getElementById("btnSiguiente");
    
    let isProcessing = false; // Bandera para evitar lecturas múltiples en racha

    function onScanSuccess(decodedText, decodedResult) {
        if (isProcessing) return; // Si ya está procesando un código, ignora los demás
        isProcessing = true;

        // Detenemos el escáner de manera segura
        html5QrCode.stop().then(() => {
            readerDiv.style.display = "none";
            registrarAsistenciaQR(decodedText);
        }).catch(err => {
            console.warn("Advertencia al pausar la cámara:", err);
            readerDiv.style.display = "none";
            registrarAsistenciaQR(decodedText);
        });
    }

    function registrarAsistenciaQR(idEstudiante) {
        fetch('../MODELO/registrar_qr.php?id=' + encodeURIComponent(idEstudiante))
            .then(response => {
                return response.text().then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        throw new Error("El archivo PHP devolvió un formato no válido: " + text);
                    }
                });
            })
            .then(data => {
                cardResultado.style.display = "block";

                if (data.status === 'exito') {
                    cardResultado.className = "card-resultado card-exito";
                    contenidoResultado.innerHTML = `
                        <img src="${data.foto}" alt="Foto Estudiante" class="estudiante-foto" onerror="this.src='../IMG/default.png'">
                        <h3>¡Acceso Autorizado!</h3>
                        <p><strong>Nombre:</strong> ${data.nombre}</p>
                        <p><strong>Curso:</strong> ${data.curso}</p>
                        <p><small>${data.message}</small></p>
                    `;
                } else {
                    cardResultado.className = "card-resultado card-error";
                    contenidoResultado.innerHTML = `
                        <h3>Acceso Denegado</h3>
                        <p>${data.message}</p>
                    `;
                }

                btnSiguiente.style.display = "inline-block";
            })
            .catch(error => {
                console.error('Error detallado:', error);
                cardResultado.style.display = "block";
                cardResultado.className = "card-resultado card-error";
                contenidoResultado.innerHTML = `
                    <h3>Error de Servidor</h3>
                    <p style="font-size: 12px; word-break: break-all; text-align: left; background: #fff; padding: 10px; border-radius: 5px;">${error.message}</p>
                `;
                btnSiguiente.style.display = "inline-block";
            });
    }

    btnSiguiente.addEventListener("click", function () {
        cardResultado.style.display = "none";
        btnSiguiente.style.display = "none";
        readerDiv.style.display = "block";
        isProcessing = false; // Liberamos la bandera para permitir nuevos escaneos
        iniciarCamara();
    });

    function iniciarCamara() {
        html5QrCode.start(
            { facingMode: "user" }, 
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 } 
            },
            onScanSuccess
        ).catch(err => {
            console.error("Error al iniciar la cámara:", err);
            // Si la cámara ya estaba corriendo, intentamos ignorarlo o reiniciar de forma limpia
        });
    }

    iniciarCamara();
});