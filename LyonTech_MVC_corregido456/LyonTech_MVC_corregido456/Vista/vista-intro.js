/* ==========================================================
   Vista/vista-intro.js — Intro cinematográfica SIN barra de carga
   ✔ A PRUEBA DE ERRORES: si algo falla, la página se muestra igual.
   ========================================================== */
(function () {
  'use strict';

  var CERRADO = false;

  /* Garantiza que la página SIEMPRE se vea al final */
  function terminar() {
    if (CERRADO) return;
    CERRADO = true;
    document.documentElement.style.overflow = '';   // devolver el scroll
    document.body.classList.add('lt-hero-in');      // entrada del hero
    var ov = document.getElementById('ltIntro');
    if (ov) ov.remove();
    var extra = document.getElementById('ltIntroExtraCSS');
    if (extra) extra.remove();
  }

  /* RED DE SEGURIDAD: pase lo que pase, a los 3.5s se ve la página */
  setTimeout(terminar, 3500);

  try {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { terminar(); return; }

    var imgLogo = document.querySelector('.logoImg, .brand-logo');
    var logoSrc = imgLogo ? imgLogo.getAttribute('src')
                          : 'Vista/logo de empresa/logo.lyon-technologies.jpg';

    var ov = document.createElement('div');
    ov.id = 'ltIntro';
    ov.setAttribute('aria-hidden', 'true');
    // Sin .lti-bar (barra de carga) y sin .lti-flash (parpadeo)
    ov.innerHTML =
      '<img class="lti-logo" src="' + logoSrc + '" alt="Lyon Technologies">' +
      '<div class="lti-rays"></div>' +
      '<div class="lti-ring"></div><div class="lti-ring"></div><div class="lti-ring"></div>' +
      '<div class="lti-sparks"></div>' +
      '<div class="lti-word"></div>';

    var word = ov.querySelector('.lti-word');
    'LYON TECHNOLOGIES'.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.innerHTML = (ch === ' ') ? '&nbsp;' : ch;
      s.style.animation = 'ltiLetra .55s cubic-bezier(.3,1.4,.5,1) both';
      s.style.animationDelay = (0.45 + i * 0.075).toFixed(3) + 's';
      word.appendChild(s);
    });

    var sparks = ov.querySelector('.lti-sparks');
    for (var i = 0; i < 26; i++) {
      var sp = document.createElement('i');
      sp.style.left = (4 + Math.random() * 92).toFixed(1) + '%';
      sp.style.setProperty('--h', Math.round(6 + Math.random() * 12) + 'px');
      sp.style.animationDelay = (Math.random() * 2.2).toFixed(2) + 's';
      sp.style.animationDuration = (1.6 + Math.random() * 1.2).toFixed(2) + 's';
      sparks.appendChild(sp);
    }

    var extra = document.createElement('style');
    extra.id = 'ltIntroExtraCSS';
    extra.textContent =
      '#ltIntro.lti-out{animation:ltiSalidaLuz .7s cubic-bezier(.4,0,.2,1) forwards}' +
      '@keyframes ltiSalidaLuz{to{opacity:0;visibility:hidden;transform:scale(1.07)}}';
    document.head.appendChild(extra);

    document.body.appendChild(ov);
    document.documentElement.style.overflow = 'hidden';

    setTimeout(function () {
      if (CERRADO) return;
      ov.classList.add('lti-out');          // salida de luz suave
      document.documentElement.style.overflow = '';
      document.body.classList.add('lt-hero-in');
    }, 2300);

    setTimeout(terminar, 3000);

  } catch (err) {
    console.error('Intro falló (la página se muestra igual):', err);
    terminar();
  }
})();