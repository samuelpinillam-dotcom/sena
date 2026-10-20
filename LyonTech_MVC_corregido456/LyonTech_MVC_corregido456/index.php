<?php
// Vista/index.php — Landing pública de Lyon Technologies
// ✓ UNIVERSAL: funciona en la raíz o dentro de Vista/ · ✓ HTML semántico, CERO <div>
if (session_status() === PHP_SESSION_NONE) session_start();
 $enVista = (basename(__DIR__) === 'Vista');
 $R = $enVista ? '../' : '';
 $S = $enVista ? '' : 'Vista/';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lyon Technologies | Tu Tienda de Electrodomésticos y Tecnología</title>
    <link rel="stylesheet" href="<?= $R ?>Vista/css/base.css">
    <link rel="stylesheet" href="<?= $R ?>Vista/css/landing.css">
    <link rel="stylesheet" href="<?= $R ?>Vista/css/componentes.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="lt-landing">

<!-- ====== ENCABEZADO FIJO ====== -->
<header class="top-header">
    <p class="announce-bar" role="status">
        <i class="fas fa-truck-fast" aria-hidden="true"></i>
        Envío GRATIS en compras superiores a $2.000.000 · Garantía oficial en todos los productos
    </p>
    <nav class="navbar nav-container" aria-label="Navegación principal">
        <a href="#inicio" class="logo-link" aria-label="Lyon Technologies — ir al inicio">
            <img src="<?= $R ?>Vista/logo de empresa/logo.lyon-technologies.jpg" alt="Logo Lyon Technologies" class="brand-logo">
            <span class="brand-name">LYON <em>TECHNOLOGIES</em></span>
        </a>
        <ul class="nav-menu" id="navMenu">
            <li><a href="#inicio" class="nav-item">Inicio</a></li>
            <li><a href="#categorias" class="nav-item">Categorías</a></li>
            <li><a href="#catalogo" class="nav-item">Catálogo</a></li>
            <li><a href="#contacto" class="nav-item">Contáctanos</a></li>
        </ul>
        <nav class="nav-actions" aria-label="Acciones de cuenta">
            <a href="<?= $S ?>sistema.php" class="btn btn-secondary">Iniciar Sesión</a>
            <a href="<?= $S ?>sistema.php?action=register" class="btn btn-primary">Registrarse</a>
            <button class="nav-toggle" id="navToggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="navMenu">
                <i class="fas fa-bars" aria-hidden="true"></i>
            </button>
        </nav>
    </nav>
</header>

<!-- ====== HERO ====== -->
<section id="inicio" class="hero-section" aria-label="Presentación">
    <article class="hero-content">
        <p class="hero-tag">Tu Hogar Merece lo Mejor</p>
        <h1 class="hero-title">Electrodomésticos y <span>Tecnología Premium</span></h1>
        <p class="hero-subtitle">Computadores, televisores, línea blanca y accesorios con garantía oficial, entrega inmediata y los mejores precios de Bogotá.</p>
        <nav class="hero-buttons" aria-label="Llamados a la acción">
            <a href="#catalogo" class="btn btn-primary btn-large">Ver Catálogo <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
            <a href="#contacto" class="btn btn-outline btn-large">Contáctanos</a>
        </nav>
        <p class="hero-stats">
            <span><i class="fas fa-shield-halved" aria-hidden="true"></i> Garantía oficial</span>
            <span><i class="fas fa-truck-fast" aria-hidden="true"></i> Entrega inmediata</span>
            <span><i class="fas fa-face-smile" aria-hidden="true"></i> +1500 clientes felices</span>
        </p>
    </article>
    <i class="hero-glow" aria-hidden="true"></i>

    <article class="hero-float hero-float-1" aria-hidden="true">
        <i class="fas fa-microchip"></i>
        <p class="mb-0"><strong>GPU X200</strong><span>Desde $1.200.000</span></p>
    </article>
    <article class="hero-float hero-float-2" aria-hidden="true">
        <i class="fas fa-tv"></i>
        <p class="mb-0"><strong>Smart TV 4K</strong><span>Desde $3.200.000</span></p>
    </article>
    <article class="hero-float hero-float-3" aria-hidden="true">
        <i class="fas fa-truck-fast"></i>
        <p class="mb-0"><strong>Envío gratis</strong><span>En compras +$2.000.000</span></p>
    </article>
    <p class="hero-chip hero-chip-1" aria-hidden="true">4K · HDR10</p>
    <p class="hero-chip hero-chip-2" aria-hidden="true">GAMING</p>
    <p class="hero-chip hero-chip-3" aria-hidden="true">LÍNEA BLANCA</p>
</section>

<!-- ====== CATEGORÍAS ====== -->
<section id="categorias" class="servicios-section" aria-label="Categorías">
    <section class="container">
        <h2 class="section-title center">Nuestras Categorias</h2>
        <p class="section-subtitle center">Todo lo que tu hogar y tu setup necesitan, en un solo lugar.</p>
        <section class="servicios-grid">
            <article class="servicio-card">
                <p class="servicio-icon"><i class="fas fa-microchip" aria-hidden="true"></i></p>
                <h3>Tecnología &amp; Gaming</h3>
                <p>Tarjetas gráficas, procesadores, memorias y componentes para armar tu PC soñada.</p>
            </article>
            <article class="servicio-card">
                <p class="servicio-icon"><i class="fas fa-tv" aria-hidden="true"></i></p>
                <h3>Audio &amp; Video</h3>
                <p>Televisores 4K, barras de sonido y todo para tu cine en casa.</p>
            </article>
            <article class="servicio-card">
                <p class="servicio-icon"><i class="fas fa-house" aria-hidden="true"></i></p>
                <h3>Hogar &amp; Línea Blanca</h3>
                <p>Neveras, lavadoras, aires acondicionados y microondas con eficiencia inteligente.</p>
            </article>
        </section>
    </section>
</section>

<!-- ====== CATÁLOGO ====== -->
<section id="catalogo" class="productos-section" aria-label="Catálogo de productos">
    <section class="container">
        <h2 class="section-title center">Catálogo Lyon</h2>
        <p class="section-subtitle center">Productos disponibles en inventario, listos para entrega.</p>
        <section class="catalogo-grid">
            <?php
            // Catálogo visual de la landing (los 9 productos de la BD).
            $productosLanding = [
                [1,'GPU X200','Tarjeta gráfica 8GB GDDR6 · Ray Tracing',1200000,'5 unidades','fa-microchip'],
                [2,'Intel i7 13700','Procesador de 12 núcleos híbridos',850000,'3 unidades','fa-brain'],
                [3,'Kit RAM 16GB DDR4','2x8GB alta frecuencia · Disipación',220000,'En stock','fa-memory'],
                [4,'Television LG 55" 4K','Smart TV Ultra HD · HDR10',3200000,'En stock','fa-tv'],
                [5,'Barra Sony 2.1','Barra de sonido con subwoofer',650000,'En stock','fa-volume-up'],
                [6,'Nevera LG 300L','Inverter · Ahorro energético',2500000,'En stock','fa-snowflake'],
                [7,'Lavadora Samsung 18kg','Automática · Carga frontal',1900000,'En stock','fa-water'],
                [8,'A/A Whirlpool','Aire acondicionado Inverter',1800000,'En stock','fa-fan'],
                [9,'Microondas Challenger','Capacidad familiar · Digital',480000,'En stock','fa-fire'],
            ];
            foreach ($productosLanding as [$id,$nom,$desc,$precio,$stock,$ico]):
            ?>
            <article class="catalogo-card">
                <figure class="catalogo-media">
                    <i class="fas <?= $ico ?> media-fallback" aria-hidden="true"></i>
                    <img class="prod-img"
                         src="<?= $R ?>Vista/imagenes/imagen%20<?= $id ?>.jpg"
                         data-fb="<?= $R ?>Vista/imagenes/imagen%20<?= $id ?>.png"
                         alt="<?= htmlspecialchars($nom) ?>" loading="lazy">
                </figure>
                <section class="catalogo-body">
                    <h3 class="catalogo-name"><?= htmlspecialchars($nom) ?></h3>
                    <p class="catalogo-desc"><?= htmlspecialchars($desc) ?></p>
                    <p class="catalogo-price"><?= number_format($precio, 0, ',', '.') ?></p>
                    <p class="catalogo-stock"><i class="fas fa-box" aria-hidden="true"></i> <?= $stock ?></p>
                    <a href="<?= $S ?>sistema.php?add=<?= urlencode($nom) ?>" class="btn btn-primary">Comprar</a>
                </section>
            </article>
            <?php endforeach; ?>
        </section>
    </section>
</section>

<!-- ====== CONTACTO ====== -->
<section id="contacto" class="servicios-section" aria-label="Contacto">
    <section class="container">
        <h2 class="section-title center">Contáctanos</h2>
        <p class="section-subtitle center">Estamos listos para asesorarte en tu próxima compra.</p>
        <section class="contacto-grid">
            <article class="contacto-card">
                <p><i class="fas fa-location-dot" aria-hidden="true"></i></p>
                <h4>Visítanos</h4>
                <p>Cra 56bis #78-12</p>
            </article>
            <article class="contacto-card">
                <p><i class="fas fa-envelope" aria-hidden="true"></i></p>
                <h4>Escríbenos</h4>
                <p>comercial@lyontechnologies.net</p>
            </article>
            <article class="contacto-card">
                <p><i class="fas fa-clock" aria-hidden="true"></i></p>
                <h4>Horario</h4>
                <p>8:00 AM a 8:00 PM</p>
            </article>
        </section>
    </section>
</section>

<!-- ====== FOOTER ====== -->
<footer class="main-footer">
    <p class="container footer-content mb-0">&copy; <?= date('Y') ?> Lyon Technologies. Todos los derechos reservados.</p>
</footer>

<script src="<?= $R ?>Modelo/modelo.js"></script>
<script src="<?= $R ?>Vista/vista.js"></script>
<script src="<?= $R ?>Vista/vista-intro.js"></script>
<script src="<?= $R ?>Vista/vista-landing.js"></script>
</body>
</html>