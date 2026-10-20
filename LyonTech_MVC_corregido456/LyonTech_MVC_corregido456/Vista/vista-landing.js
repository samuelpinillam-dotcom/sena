/* ==========================================================
   Vista/vista-landing.js — Vida y animaciones de la landing
   1 · Fallback de imágenes (jpg → png → ícono)
   2 · Menú móvil
   3 · Tilt 3D de las tarjetas del catálogo
   4 · REVEAL: animación ÚNICA por sección al entrar en pantalla
      (cada elemento tiene su animación asignada en landing.css:
       · Categorías: izquierda / abajo / derecha
       · Catálogo: 5 entradas neón rotando + retardo escalonado
       · Contacto: zoom / subida / flip
       · Inicio (hero): lo dispara vista-intro.js con lt-hero-in)
   ========================================================== */
(function () {
  'use strict';

  /* ---------- 1 · Fallback de imágenes ---------- */
  document.querySelectorAll('.prod-img[data-fb]').forEach(function (img) {
    img.addEventListener('error', function () {
      var fb = img.getAttribute('data-fb');
      if (fb) { img.removeAttribute('data-fb'); img.src = fb; }
      else { img.remove(); } // deja ver el ícono decorativo de fondo
    });
  });

  /* ---------- 2 · Menú móvil ---------- */
  var tog = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  if (tog && menu) {
    tog.addEventListener('click', function () {
      var abierto = menu.classList.toggle('open');
      tog.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); });
    });
  }

  /* ---------- 3 · Tilt 3D del catálogo ---------- */
  document.querySelectorAll('.catalogo-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - .5;
      var py = (e.clientY - r.top) / r.height - .5;
      card.style.setProperty('--px', px.toFixed(3));
      card.style.setProperty('--py', py.toFixed(3));
      var media = card.querySelector('.catalogo-media');
      if (media) {
        media.style.setProperty('--mx', ((px + .5) * 100).toFixed(1) + '%');
        media.style.setProperty('--my', ((py + .5) * 100).toFixed(1) + '%');
      }
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--px', '0');
      card.style.setProperty('--py', '0');
    });
  });

  /* ---------- 4 · REVEAL: una animación distinta por sección ---------- */
  /* Le ponemos .lt-reveal a cada pieza; landing.css ya define qué
     animación y retardo le corresponde (--lt-anim / --lt-d).
     Si este JS fallara, nada queda oculto: las clases no se agregan. */
  var plan = [
    '#categorias .section-title',
    '#categorias .section-subtitle',
    '#categorias .servicio-card',
    '#catalogo .section-title',
    '#catalogo .section-subtitle',
    '#catalogo .catalogo-card',
    '#contacto .section-title',
    '#contacto .section-subtitle',
    '#contacto .contacto-card'
  ];
  var objetivos = [];
  plan.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (!el.classList.contains('lt-reveal')) el.classList.add('lt-reveal');
      objetivos.push(el);
    });
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('lt-in');  // dispara SU animación única
          io.unobserve(en.target);           // solo la primera vez
        }
      });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    objetivos.forEach(function (el) { io.observe(el); });
  } else {
    objetivos.forEach(function (el) { el.classList.add('lt-in'); });
  }
})();