/* ══════════════════════════════════════════════════════════════
   MENSAJES.JS — Envío real SIN salir de la página (AJAX)
   Los mensajes llegan a delpinwaresoftware@gmail.com vía FormSubmit
   ══════════════════════════════════════════════════════════════ */

const formulario = document.querySelector('form');
const btnEnviar  = formulario ? formulario.querySelector('button[type="submit"]') : null;
const textoBotonOriginal = btnEnviar ? btnEnviar.innerHTML : '';

/* ── 1. Pre-seleccionar asunto si llega desde una página de servicio ── */
const params   = new URLSearchParams(window.location.search);
const servicio = params.get('servicio');
const selectAsunto = formulario ? formulario.querySelector('select') : null;

if (servicio && selectAsunto) {
    const busqueda = servicio.toLowerCase();
    const opcion = [...selectAsunto.options].find(op =>
        (op.value || '').toLowerCase() === busqueda ||
        (op.dataset.servicio || '').toLowerCase() === busqueda ||
        op.text.toLowerCase().includes(busqueda)
    );
    if (opcion) selectAsunto.value = opcion.value;
}

/* ── 2. Utilidades de validación (tono formal) ── */
const limpiarError = (campo) => {
    if (!campo) return;
    campo.style.borderColor = '';
    const aviso = campo.parentElement.querySelector('.aviso-js');
    if (aviso) aviso.remove();
};

const marcarError = (campo, texto) => {
    if (!campo) return;
    campo.style.borderColor = '#e5484d';
    if (!campo.parentElement.querySelector('.aviso-js')) {
        const aviso = document.createElement('p');
        aviso.className = 'aviso-js';
        aviso.textContent = texto;
        aviso.style.cssText = 'margin:4px 0 0;font-size:12.5px;color:#e5484d;text-align:left;';
        campo.parentElement.appendChild(aviso);
    }
};

const esTextoValido    = (t) => t.trim().length >= 3 && /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(t.trim());
const esCorreoValido   = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t.trim());
const esTelefonoValido = (t) => {
    const digitos = t.replace(/\D/g, '');
    return digitos.length >= 7 && digitos.length <= 15;
};

/* ── 3. Aviso en pantalla (sin redirección) ── */
if (!document.getElementById('estilo-aviso-envio')) {
    const estilo = document.createElement('style');
    estilo.id = 'estilo-aviso-envio';
    estilo.textContent = '@keyframes msAvisoEntrar{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}' +
                         '.ms-aviso-envio{animation:msAvisoEntrar .35s ease both}';
    document.head.appendChild(estilo);
}

const mostrarAviso = (exito, titulo, texto) => {
    const previo = formulario.querySelector('.ms-aviso-envio');
    if (previo) previo.remove();

    const colorBorde  = exito ? 'rgba(0, 200, 151, .55)' : 'rgba(229, 72, 77, .55)';
    const colorFondo  = exito ? 'rgba(0, 200, 151, .12)' : 'rgba(229, 72, 77, .12)';
    const colorTexto  = exito ? '#d9f7ee' : '#ffe3e4';
    const colorFuerte = exito ? '#4be3ad' : '#ff9b9e';

    const aviso = document.createElement('div');
    aviso.className = 'ms-aviso-envio';
    aviso.setAttribute('role', 'alert');
    aviso.style.cssText = 'padding:14px 16px;border-radius:12px;margin-bottom:16px;' +
                          'font-size:14px;line-height:1.55;text-align:left;' +
                          'border:1px solid ' + colorBorde + ';background:' + colorFondo + ';color:' + colorTexto + ';';
    aviso.innerHTML = '<strong style="color:' + colorFuerte + ';">' + titulo + '</strong><br>' + texto;

    formulario.prepend(aviso);
    aviso.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => {
        aviso.style.transition = 'opacity .4s ease';
        aviso.style.opacity = '0';
        setTimeout(() => aviso.remove(), 400);
    }, 8000);
};

/* ── 4. Envío real por AJAX (no redirige) ── */
if (formulario) {
    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();

        const nombre   = formulario.querySelector('[name="Nombre completo"]');
        const correo   = formulario.querySelector('[name="Correo electrónico"]');
        const telefono = formulario.querySelector('[name="Teléfono"]');
        const asunto   = formulario.querySelector('[name="Asunto"]');
        const mensaje  = formulario.querySelector('[name="Mensaje"]');

        [nombre, correo, telefono, asunto, mensaje].forEach(limpiarError);

        let valido = true;

        if (nombre && !esTextoValido(nombre.value)) {
            marcarError(nombre, 'Escriba su nombre completo, por favor.');
            valido = false;
        }
        if (correo && !esCorreoValido(correo.value)) {
            marcarError(correo, 'Ingrese un correo electrónico válido.');
            valido = false;
        }
        if (telefono && telefono.value.trim() !== '' && !esTelefonoValido(telefono.value)) {
            marcarError(telefono, 'El teléfono debe contener de 7 a 15 dígitos.');
            valido = false;
        }
        if (asunto && asunto.value === '') {
            marcarError(asunto, 'Seleccione un asunto, por favor.');
            valido = false;
        }
        if (mensaje && mensaje.value.trim().length < 10) {
            marcarError(mensaje, 'Escriba su mensaje (mínimo 10 caracteres).');
            valido = false;
        }

        if (!valido) {
            const primerAviso = formulario.querySelector('.aviso-js');
            if (primerAviso) primerAviso.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        /* "Responder" en el correo → responde directo al cliente */
        const campoReply = formulario.querySelector('[name="_replyto"]');
        if (campoReply && correo) campoReply.value = correo.value.trim();

        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnEnviar.textContent = 'Enviando…';
        }

        fetch('https://formsubmit.co/ajax/delpinwaresoftware@gmail.com', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new FormData(formulario)
        })
            .then((respuesta) => respuesta.json())
            .then((datos) => {
                if (datos && (datos.success === 'true' || datos.success === true)) {
                    mostrarAviso(true,
                        'Mensaje enviado correctamente.',
                        'Gracias por contactarnos. Nuestro equipo le dará respuesta a la brevedad posible.');
                    formulario.reset();
                } else {
                    mostrarAviso(false,
                        'No fue posible enviar su mensaje.',
                        'Por favor, inténtelo nuevamente en unos minutos.');
                }
            })
            .catch(() => {
                mostrarAviso(false,
                    'No fue posible enviar su mensaje.',
                    'Verifique su conexión a internet e inténtelo de nuevo, por favor.');
            })
            .finally(() => {
                if (btnEnviar) {
                    btnEnviar.disabled = false;
                    btnEnviar.innerHTML = textoBotonOriginal;
                }
            });
    });

    /* El error se borra en cuanto el usuario corrige el campo */
    formulario.querySelectorAll('input, select, textarea').forEach((campo) => {
        campo.addEventListener('input', () => limpiarError(campo));
        campo.addEventListener('change', () => limpiarError(campo));
    });
}