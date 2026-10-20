let audioCtx = null;
let sonidoActivado = true;
let backgroundMusicTimer = null;

function inicializarAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function alternarSonido() {
    sonidoActivado = !sonidoActivado;
    let iconos = sonidoActivado ? "🔊" : "🔇";
    document.querySelectorAll("#btn-audio, #btn-audio-juego").forEach(b => b.innerText = iconos);
    
    if (!sonidoActivado) {
        detenerMusicaFondo();
    } else {
        iniciarMusicaFondo();
        reproducirClick();
    }
}

function reproducirClick() {
    if (!sonidoActivado) return;
    inicializarAudio();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

function reproducirDrop() {
    if (!sonidoActivado) return;
    inicializarAudio();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function reproducirExito() {
    if (!sonidoActivado) return;
    inicializarAudio();
    let notas = [523.25, 659.25, 783.99, 1046.50];
    notas.forEach((freq, idx) => {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.15);
    });
}

function reproducirError() {
    if (!sonidoActivado) return;
    inicializarAudio();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
}

function iniciarMusicaFondo() {
    detenerMusicaFondo();
    if (!sonidoActivado) return;
    let secuencia = [261.63, 329.63, 392.00, 523.25];
    let paso = 0;
    backgroundMusicTimer = setInterval(() => {
        if (!sonidoActivado) return;
        inicializarAudio();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(secuencia[paso], audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
        paso = (paso + 1) % secuencia.length;
    }, 600);
}

function detenerMusicaFondo() {
    if (backgroundMusicTimer) {
        clearInterval(backgroundMusicTimer);
        backgroundMusicTimer = null;
    }
}

let modoActual = 'suma';
let ejercicioActual = 1;
let valoresFiguras = {};
let resultadoMeta = 0;
let colocadas = {};
let simboloOp = '+';
let operadorMisterioElegido = '+';
let iconosDisponibles = ['🔴', '🟦', '⭐', '🔺', '🟩', '🟡', '🟣', '🔷'];
let figurasActuales = [];

const bancoProblemasJefe = [
    { texto: "En una granja hay 24 gallinas y se reparten equitativamente en 4 corrales. ¿Cuántas gallinas hay por corral?", op: '÷', a: 24, b: 4 },
    { texto: "María tiene 4 cajas y en cada caja guarda 6 juguetes. ¿Cuántos juguetes tiene en total?", op: '×', a: 4, b: 6 },
    { texto: "Juan tenía 15 caramelos y su mamá le dio 8 más. ¿Cuántos caramelos tiene ahora?", op: '+', a: 15, b: 8 },
    { texto: "En un árbol había 18 pájaros y volaron 7. ¿Cuántos pájaros se quedaron?", op: '-', a: 18, b: 7 },
    { texto: "Se quieren repartir 35 libros en partes iguales entre 5 repisas. ¿Cuántos libros van en cada repisa?", op: '÷', a: 35, b: 5 }
];
let problemaActualJefe = null;

function iniciarModo(modo) {
    reproducirClick();
    modoActual = modo;
    ejercicioActual = 1;
    document.getElementById('menu-modos').style.display = 'none';
    document.getElementById('pantalla-final').style.display = 'none';
    document.getElementById('juego-area').style.display = 'block';
    
    iniciarMusicaFondo();

    let nombresModos = {
        'suma': 'Modo Suma (+)',
        'resta': 'Modo Resta (-)',
        'multiplicacion': 'Modo Multiplicación (×)',
        'division': 'Modo División (÷)',
        'misterio': 'Modo Misterio',
        'jefe': 'JEFE FINAL'
    };
    document.getElementById('titulo-modo').innerText = nombresModos[modo];
    generarNuevoEjercicio();
}

function volverMenu() {
    reproducirClick();
    detenerMusicaFondo();
    document.getElementById('juego-area').style.display = 'none';
    document.getElementById('pantalla-final').style.display = 'none';
    document.getElementById('menu-modos').style.display = 'block';
}

function generarNuevoEjercicio() {
    colocadas = {};
    document.getElementById('mensaje').innerText = '';
    document.getElementById('btn-siguiente').style.display = 'none';
    document.getElementById('btn-comprobar').style.display = 'inline-block';
    document.getElementById('ejercicio-num').innerText = ejercicioActual;

    document.getElementById('slot-0').innerHTML = 'Vacíame';
    document.getElementById('slot-1').innerHTML = 'Vacíame';
    document.getElementById('input-resultado-usuario').value = '';

    let mezclaFiguras = [...iconosDisponibles].sort(() => Math.random() - 0.5);
    figurasActuales = mezclaFiguras.slice(0, 4);

    valoresFiguras = {};
    figurasActuales.forEach(fig => {
        valoresFiguras[fig] = Math.floor(Math.random() * 8) + 2;
    });

    let indicesAleatorios = [...figurasActuales].sort(() => Math.random() - 0.5);
    let figA = indicesAleatorios[0];
    let figB = indicesAleatorios[1];
    let vA = valoresFiguras[figA];
    let vB = valoresFiguras[figB];

    if (modoActual === 'suma') {
        simboloOp = '+';
        resultadoMeta = vA + vB;
        configurarVistaNormal();
    } else if (modoActual === 'resta') {
        simboloOp = '-';
        if (vA < vB) { let t = vA; vA = vB; vB = t; }
        valoresFiguras[figA] = vA;
        valoresFiguras[figB] = vB;
        resultadoMeta = vA - vB;
        configurarVistaNormal();
    } else if (modoActual === 'multiplicacion') {
        simboloOp = '×';
        resultadoMeta = vA * vB;
        configurarVistaNormal();
    } else if (modoActual === 'division') {
        simboloOp = '÷';
        vB = Math.floor(Math.random() * 3) + 2;
        vA = vB * (Math.floor(Math.random() * 4) + 2);
        valoresFiguras[figA] = vA;
        valoresFiguras[figB] = vB;
        resultadoMeta = vA / vB;
        configurarVistaNormal();
    } else if (modoActual === 'misterio') {
        let ops = ['+', '-', '×', '÷'];
        simboloOp = ops[Math.floor(Math.random() * ops.length)];
        if (simboloOp === '+') resultadoMeta = vA + vB;
        else if (simboloOp === '-') { if(vA < vB){let t=vA;vA=vB;vB=t;} valoresFiguras[figA]=vA; valoresFiguras[figB]=vB; resultadoMeta = vA - vB; }
        else if (simboloOp === '×') resultadoMeta = vA * vB;
        else if (simboloOp === '÷') { vB = Math.random()>0.5? 2:3; vA = vB * (Math.floor(Math.random() * 3)+2); valoresFiguras[figA]=vA; valoresFiguras[figB]=vB; resultadoMeta = vA / vB; }
        configurarVistaMisterio();
    } else if (modoActual === 'jefe') {
        configurarVistaJefe();
        return;
    }

    document.getElementById('resultado-objetivo').innerText = `= ${resultadoMeta}`;
    renderizarBanco();
}

function configurarVistaNormal() {
    document.getElementById('contenedor-problema').style.display = 'none';
    document.getElementById('meta-container').style.display = 'block';
    document.getElementById('selector-op-container').style.display = 'none';
    document.getElementById('input-jefe-wrapper').style.display = 'none';
    document.getElementById('op-simbolo').style.display = 'flex';
    document.getElementById('op-simbolo').innerText = simboloOp;
}

function configurarVistaMisterio() {
    document.getElementById('contenedor-problema').style.display = 'none';
    document.getElementById('meta-container').style.display = 'block';
    document.getElementById('selector-op-container').style.display = 'flex';
    document.getElementById('input-jefe-wrapper').style.display = 'none';
    document.getElementById('op-simbolo').style.display = 'flex';
    document.getElementById('op-simbolo').innerText = '?';
    operadorMisterioElegido = '+';
    actualizarSeleccionUI('+');
}

function configurarVistaJefe() {
    document.getElementById('contenedor-problema').style.display = 'block';
    document.getElementById('meta-container').style.display = 'none';
    document.getElementById('selector-op-container').style.display = 'flex';
    document.getElementById('input-jefe-wrapper').style.display = 'flex';
    document.getElementById('op-simbolo').style.display = 'flex';
    document.getElementById('op-simbolo').innerText = '?';

    problemaActualJefe = bancoProblemasJefe[Math.floor(Math.random() * bancoProblemasJefe.length)];
    document.getElementById('texto-problema').innerText = `🧩 ${problemaActualJefe.texto}`;

    let indicesAleatorios = [...figurasActuales].sort(() => Math.random() - 0.5);
    valoresFiguras[indicesAleatorios[0]] = problemaActualJefe.a;
    valoresFiguras[indicesAleatorios[1]] = problemaActualJefe.b;

    operadorMisterioElegido = '+';
    actualizarSeleccionUI('+');
    renderizarBanco();
}

function seleccionarOperadorMisterio(op) {
    reproducirClick();
    operadorMisterioElegido = op;
    actualizarSeleccionUI(op);
    if (modoActual === 'misterio' || modoActual === 'jefe') {
        document.getElementById('op-simbolo').innerText = op;
    }
}

function actualizarSeleccionUI(op) {
    let botones = document.querySelectorAll('.op-btn');
    botones.forEach(btn => {
        if (btn.innerText === op) btn.classList.add('seleccionado');
        else btn.classList.remove('seleccionado');
    });
}

function renderizarBanco() {
    const banco = document.getElementById('figuras-banco');
    banco.innerHTML = '';
    
    let figurasVisuales = [...figurasActuales].sort(() => Math.random() - 0.5);

    figurasVisuales.forEach(fig => {
        let figuraDiv = document.createElement('div');
        figuraDiv.classList.add('figura');
        figuraDiv.draggable = true;
        
        figuraDiv.innerHTML = `
            <span class="icono-fig">${fig}</span>
            <span class="valor-dentro">${valoresFiguras[fig]}</span>
        `;
        
        figuraDiv.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ figura: fig, valor: valoresFiguras[fig] }));
        };

        banco.appendChild(figuraDiv);
    });
}

function permitirSoltar(e) { e.preventDefault(); }

function soltarFigura(e, slotId) {
    e.preventDefault();
    reproducirDrop();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    colocadas[slotId] = data;
    
    let slotElement = document.getElementById(`slot-${slotId}`);
    slotElement.style.background = "#fff";
    slotElement.innerHTML = `<span class="icono-fig" style="font-size:22px;">${data.figura}</span><span class="valor-dentro" style="font-size:11px;">${data.valor}</span>`;
}

function verificarRespuesta() {
    reproducirClick();
    if (!colocadas[0] || !colocadas[1]) {
        reproducirError();
        document.getElementById('mensaje').innerText = '⚠️ ¡Debes colocar dos figuras en los espacios!';
        document.getElementById('mensaje').style.color = '#ffeb3b';
        return;
    }

    let v1 = colocadas[0].valor;
    let v2 = colocadas[1].valor;
    let opUsada = (modoActual === 'misterio' || modoActual === 'jefe') ? operadorMisterioElegido : simboloOp;

    if (opUsada === '-') {
        if (v1 < v2) {
            reproducirError();
            document.getElementById('mensaje').innerText = '🤔 Pista: En la resta básica, el primer número debe ser mayor o igual al segundo.';
            document.getElementById('mensaje').style.color = '#ff9900';
            return;
        }
    }

    if (opUsada === '÷') {
        if (v2 === 0 || v1 % v2 !== 0) {
            reproducirError();
            document.getElementById('mensaje').innerText = '🤔 Pista: Busca una división exacta (sin decimales ni residuos).';
            document.getElementById('mensaje').style.color = '#ff9900';
            return;
        }
    }

    let calculado = 0;
    if (opUsada === '+') calculado = v1 + v2;
    else if (opUsada === '-') calculado = v1 - v2;
    else if (opUsada === '×') calculado = v1 * v2;
    else if (opUsada === '÷') calculado = v1 / v2;

    const mensajeEl = document.getElementById('mensaje');

    if (modoActual === 'jefe') {
        let resultadoUsuario = parseFloat(document.getElementById('input-resultado-usuario').value);
        let resultadoRealFinal = 0;
        if (problemaActualJefe.op === '+') resultadoRealFinal = problemaActualJefe.a + problemaActualJefe.b;
        else if (problemaActualJefe.op === '-') resultadoRealFinal = problemaActualJefe.a - problemaActualJefe.b;
        else if (problemaActualJefe.op === '×') resultadoRealFinal = problemaActualJefe.a * problemaActualJefe.b;
        else if (problemaActualJefe.op === '÷') resultadoRealFinal = problemaActualJefe.a / problemaActualJefe.b;

        if (opUsada === problemaActualJefe.op && calculado === resultadoRealFinal && resultadoUsuario === resultadoRealFinal) {
            reproducirExito();
            mensajeEl.innerText = '🐉 ¡DERROTASTE AL JEFE! ¡Excelente razonamiento! 🏆';
            mensajeEl.style.color = '#69f0ae';
            activarSiguiente();
        } else {
            reproducirError();
            mensajeEl.innerText = '❌ El jefe resiste... Revisa el texto, el operador o tu cálculo final.';
            mensajeEl.style.color = '#ff6b6b';
        }
    } else if (modoActual === 'misterio') {
        if (opUsada === simboloOp && calculado === resultadoMeta) {
            reproducirExito();
            mensajeEl.innerText = '🎉 ¡ACERTASTE EL MISTERIO! 🌟';
            mensajeEl.style.color = '#69f0ae';
            activarSiguiente();
        } else {
            reproducirError();
            mensajeEl.innerText = '❌ El signo o las figuras no son correctos. ¡Piensa un poco más!';
            mensajeEl.style.color = '#ff6b6b';
        }
    } else {
        if (calculado === resultadoMeta) {
            reproducirExito();
            mensajeEl.innerText = '🎉 ¡CORRECTO! ¡Muy bien hecho! 🌟';
            mensajeEl.style.color = '#69f0ae';
            activarSiguiente();
        } else {
            reproducirError();
            mensajeEl.innerText = '❌ Ups, el resultado numérico no coincide. ¡Vuelve a repasar tu cálculo!';
            mensajeEl.style.color = '#ff6b6b';
        }
    }
}

function activarSiguiente() {
    document.getElementById('btn-comprobar').style.display = 'none';
    document.getElementById('btn-siguiente').style.display = 'inline-block';
}

function siguienteEjercicio() {
    reproducirClick();
    if (ejercicioActual < 10) {
        ejercicioActual++;
        generarNuevoEjercicio();
    } else {
        document.getElementById('juego-area').style.display = 'none';
        document.getElementById('pantalla-final').style.display = 'block';
    }
}