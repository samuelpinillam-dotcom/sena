<?php
// sistema.php — Ingreso al sistema + Dashboard por roles
// ✔ UNIVERSAL: funciona en la RAÍZ del proyecto o dentro de Vista/
//   (detecta su ubicación y arma las rutas automáticamente)
if (session_status() === PHP_SESSION_NONE) session_start();
 $abrirRegistro = (($_GET['action'] ?? '') === 'register') ? 'true' : 'false';

// --- Detección de ubicación ---
// Si este archivo está dentro de la carpeta Vista/, los recursos de la raíz
// necesitan el prefijo "../"; si está en la raíz, el prefijo es "".
 $enVista = (basename(__DIR__) === 'Vista');
 $R = $enVista ? '../' : '';   // prefijo hacia la raíz del proyecto
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lyon Technologies — Sistema</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="<?= $R ?>Vista/css/base.css">
    <link rel="stylesheet" href="<?= $R ?>Vista/css/landing.css">
    <link rel="stylesheet" href="<?= $R ?>Vista/css/sistema.css">
    <link rel="stylesheet" href="<?= $R ?>Vista/css/componentes.css">
    <style>
    /* ===== Animaciones premium · Login y Registro ===== */
    @keyframes ltCardIn{
        0%{opacity:0;transform:perspective(1000px) rotateX(14deg) translateY(46px) scale(.94);
           filter:blur(10px) brightness(1.6)}
        100%{opacity:1;transform:perspective(1000px) rotateX(0) translateY(0) scale(1);
           filter:blur(0) brightness(1)}
    }
    #homeView{animation:ltCardIn 1s cubic-bezier(.22,1,.36,1) .1s backwards;
              transform-style:preserve-3d;will-change:transform;
              transition:transform .3s ease-out}
    @keyframes ltGradMovil{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    #homeView h4{
        background:linear-gradient(100deg,#ffb400,#ff8a00,#ff6a00,#00c8f5,#3ddcff,#0576b8,#ffb400);
        background-size:300% 100%;
        -webkit-background-clip:text;background-clip:text;
        -webkit-text-fill-color:transparent;color:transparent;
        animation:ltCampoIn .7s cubic-bezier(.22,1,.36,1) .25s backwards,
                  ltGradMovil 6s ease infinite}
    @keyframes ltCampoIn{
        from{opacity:0;transform:translateY(22px) scale(.985);filter:blur(4px)}
        60%{filter:blur(0)}
        to{opacity:1;transform:none;filter:none}}
    #homeView .btn-group{animation:ltCampoIn .55s cubic-bezier(.22,1,.36,1) .35s backwards}
    #formLogin>*,#formRegister>*{animation:ltCampoIn .55s cubic-bezier(.22,1,.36,1) backwards}
    #formRegister>.row{animation:none}
    #formRegister>.row>div{animation:ltCampoIn .55s cubic-bezier(.22,1,.36,1) backwards}
    #formRegister>.row>div:nth-child(1){animation-delay:.40s}
    #formRegister>.row>div:nth-child(2){animation-delay:.48s}
    #formLogin>*:nth-child(1){animation-delay:.42s}
    #formLogin>*:nth-child(2){animation-delay:.52s}
    #formLogin>*:nth-child(3){animation-delay:.62s}
    #formRegister>*:nth-child(2){animation-delay:.56s}
    #formRegister>*:nth-child(3){animation-delay:.64s}
    #formRegister>*:nth-child(4){animation-delay:.72s}
    #formRegister>*:nth-child(5){animation-delay:.80s}
    #formRegister>*:nth-child(6){animation-delay:.88s}
    #formRegister>*:nth-child(7){animation-delay:.96s}
    #formRegister>*:nth-child(8){animation-delay:1.04s}
    #formRegister>*:nth-child(9){animation-delay:1.16s}
    #formRegister>*:nth-child(10){animation-delay:1.28s}
    #homeView .form-control,#homeView .form-select{
        transition:transform .35s cubic-bezier(.22,1,.36,1),
                   box-shadow .35s ease,border-color .35s ease,background .35s ease}
    #homeView .form-control:focus,#homeView .form-select:focus{
        transform:translateY(-3px) scale(1.01);
        box-shadow:0 12px 32px rgba(0,200,245,.28),0 0 0 .22rem rgba(0,200,245,.12);
        border-color:var(--cyan)}
    #homeView .btn-primary{position:relative;overflow:hidden}
    #homeView .btn-primary::after{
        content:"";position:absolute;top:0;left:-90%;width:55%;height:100%;
        background:linear-gradient(105deg,transparent,rgba(255,255,255,.5) 45%,transparent 60%);
        transform:skewX(-18deg);pointer-events:none;
        animation:ltBrilloBtn 3.2s ease 1.4s infinite}
    @keyframes ltBrilloBtn{0%{left:-90%}55%,100%{left:135%}}
    #homeView.tilt{transform:perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}
    </style>
</head>
<body>

<!-- ====== NAVBAR ====== -->
<nav class="navbar navbar-expand-lg">
    <a class="navbar-brand d-flex align-items-center gap-3" href="<?= $R ?>index.php">
        <div class="logoCircle">
            <img src="<?= $R ?>Vista/logo de empresa/logo.lyon-technologies.jpg" alt="Logo Lyon Technologies" class="logoImg">
        </div>
        <span class="brand-text">LYON <em>TECHNOLOGIES</em></span>
    </a>
</nav>

<main class="container py-4">

    <!-- =========== INGRESO / REGISTRO =========== -->
    <section id="homeView" class="card p-4 mx-auto" style="max-width:720px;">
        <h4 class="mb-4 fw-bold">Ingreso al Sistema</h4>

        <div class="btn-group w-100 mb-4" role="group">
            <button id="btnTabLogin" class="btn btn-primary active" type="button">Iniciar sesión</button>
            <button id="btnTabRegister" class="btn btn-outline-primary" type="button">Registrarse</button>
        </div>

        <!-- LOGIN -->
        <form id="formLogin" class="text-start" novalidate>
            <div class="mb-2">
                <label class="form-label" for="loginEmail">Correo electrónico</label>
                <input id="loginEmail" type="email" class="form-control" required placeholder="ejemplo@correo.com">
            </div>
            <div class="mb-4">
                <label class="form-label" for="loginPass">Contraseña</label>
                <input id="loginPass" type="password" class="form-control" required minlength="4" placeholder="Contraseña">
            </div>
            <button type="submit" class="btn btn-primary w-100">Ingresar</button>
        </form>

        <!-- REGISTRO -->
        <form id="formRegister" class="text-start" style="display:none;" novalidate>
            <div class="row">
                <div class="col-md-6 mb-2">
                    <label class="form-label" for="regName">Nombre</label>
                    <input id="regName" class="form-control" required pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]+" title="Solo letras y espacios" placeholder="Tu nombre">
                </div>
                <div class="col-md-6 mb-2">
                    <label class="form-label" for="regLastName">Apellido</label>
                    <input id="regLastName" class="form-control" required pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]+" title="Solo letras y espacios" placeholder="Tu apellido">
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label" for="regDocumentType">Tipo de documento</label>
                <select id="regDocumentType" class="form-select" required>
                    <option value="">Selecciona un tipo de documento</option>
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="TI">Tarjeta de identidad</option>
                    <option value="CE">Cédula de extranjería</option>
                </select>
            </div>
            <div class="mb-2">
                <label class="form-label" for="regDocument">Número de documento</label>
                <input id="regDocument" class="form-control" required pattern="[0-9]+" title="Solo números" inputmode="numeric" placeholder="Número de documento">
            </div>
            <div class="mb-2">
                <label class="form-label" for="regAddress">Dirección</label>
                <input id="regAddress" type="text" class="form-control" required placeholder="Ej: Calle 123 #45-67">
            </div>
            <div class="mb-2">
                <label class="form-label" for="regEmail">Correo</label>
                <input id="regEmail" type="email" class="form-control" required placeholder="ejemplo@correo.com">
            </div>
            <div class="mb-2">
                <label class="form-label" for="regPhone">Teléfono</label>
                <input id="regPhone" class="form-control" required minlength="7" maxlength="15" pattern="[0-9]+" title="Solo números" inputmode="numeric" placeholder="Ej: 3101234567">
            </div>
            <div class="mb-2">
                <label class="form-label" for="regPass">Contraseña</label>
                <input id="regPass" type="password" class="form-control" required minlength="6" placeholder="mínimo 6 caracteres">
            </div>
            <div class="mb-3">
                <label class="form-label" for="regRol">Rol</label>
                <select id="regRol" class="form-select" required>
                    <option value="">Selecciona un rol</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Empleado">Empleado</option>
                    <option value="Proveedor">Proveedor</option>
                    <option value="Administrador">Administrador</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary w-100">Crear cuenta y acceder</button>
        </form>
    </section>

    <!-- =========== DASHBOARD =========== -->
    <section id="dashboard" class="mt-4" style="display:none;">
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h3 id="dashWelcome" class="fw-bold mb-0">Panel</h3>
            <div>
                <button id="btnLogout" class="btn btn-outline-danger me-2">Cerrar sesión</button>
                <button id="btnProfile" class="btn btn-outline-secondary">Mi perfil</button>
            </div>
        </div>
        <div class="row">
            <aside class="col-md-3 mb-3">
                <div class="card p-3">
                    <h6 class="mb-2 fw-bold">Módulos</h6>
                    <div id="moduleList" class="list-group list-group-flush"></div>
                </div>
            </aside>
            <div class="col-md-9">
                <div id="contentArea">
                    <div class="card p-4">
                        <h5 class="fw-bold mb-2">Panel principal</h5>
                        <p class="mb-0">Selecciona un módulo para comenzar.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<!-- ====== FOOTER ====== -->
<footer class="site-footer container mt-4">
    <p class="text-center py-3 mb-0">Visítanos: Cra 56bis #78-12 • Correo: comercial@lyontechnologies.net • Horario: 8:00 AM a 8:00 PM</p>
</footer>

<div id="ltToasts"></div>
<div id="ltPrintZone"></div>

<!-- MVC: Modelo → Vista → Controlador (rutas universales) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= $R ?>Modelo/modelo.js"></script>
<script src="<?= $R ?>Vista/vista.js"></script>
<script src="<?= $R ?>Vista/vista-intro.js"></script>
<script src="<?= $R ?>Vista/vista-landing.js"></script>
<script src="<?= $R ?>Controlador/controlador.js"></script>
<script src="<?= $R ?>Controlador/controlador-crud.js"></script>
<script src="<?= $R ?>Controlador/controlador-ventas.js"></script>
<script src="<?= $R ?>Controlador/controlador-flujo.js"></script>
<script>
// Puente PHP → JS: producto elegido en la landing + pestaña de registro
(function () {
    var params = new URLSearchParams(location.search);
    var add = params.get('add');
    if (add) { sessionStorage.setItem('lt_add', add); history.replaceState(null, '', location.pathname); }
    window.LT_ABRIR_REGISTRO = <?= $abrirRegistro ?>;
})();
// Tilt 3D de la tarjeta
(function () {
    var card = document.getElementById('homeView');
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.classList.add('tilt');
        card.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 4).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 3).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
})();
</script>
</body>
</html>