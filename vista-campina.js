/* Página do empreendimento (Vista Campina).
   1) Galeria: troca de foto principal + miniaturas.
      Para adicionar fotos: edite apenas window.EMP_GALLERY no HTML da página.
   2) Scroll reveal: ativa as animações dos blocos da seção "Experiência"
      (e reforça .reveal/.reveal-left/.reveal-right nesta página), usando
      apenas transform + opacity — sem blur nem custo de repaint alto. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initGallery();
    initScrollReveal();
    initHeroParallax();
  });

  /* ---------------------------------------------------------------------
     1) GALERIA
     --------------------------------------------------------------------- */
  function initGallery() {
    var images = window.EMP_GALLERY || [];
    var mainImg = document.getElementById('gallery-main-img');
    var thumbsRoot = document.getElementById('gallery-thumbs');
    if (!images.length || !mainImg || !thumbsRoot) return;

    function setMain(src, index) {
      mainImg.classList.remove('is-visible');
      // pequeno delay para permitir o fade-out antes de trocar o src
      window.setTimeout(function () {
        mainImg.src = src;
        mainImg.onload = function () {
          mainImg.classList.add('is-visible');
        };
      }, 120);

      thumbsRoot.querySelectorAll('button').forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === index);
      });
    }

    var fragment = document.createDocumentFragment();
    images.forEach(function (src, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Ver foto ' + (i + 1));
      var img = document.createElement('img');
      img.src = src;
      img.loading = 'lazy';
      img.alt = '';
      btn.appendChild(img);
      btn.addEventListener('click', function () {
        setMain(src, i);
      });
      fragment.appendChild(btn);
    });
    thumbsRoot.appendChild(fragment);

    setMain(images[0], 0);
  }

  /* ---------------------------------------------------------------------
     2) SCROLL REVEAL
     Ativa .active em qualquer elemento desta página com classe
     "reveal", "reveal-left" ou "reveal-right" assim que ele entra na tela.
     Não duplica o trabalho se o script.js global já cuidar disso: cada
     elemento só ganha .active uma vez, e o observer para de observá-lo
     depois (unobserve), então não há custo contínuo de scroll.
     --------------------------------------------------------------------- */
  function initScrollReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!targets.length) return;

    // Se o navegador não suportar IntersectionObserver, apenas mostra tudo.
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('active'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15
    });

    targets.forEach(function (el) {
      // Evita reprocessar um elemento que já esteja ativo
      // (ex.: caso o script.js global já tenha ativado antes).
      if (!el.classList.contains('active')) {
        observer.observe(el);
      }
    });
  }

  /* ---------------------------------------------------------------------
     3) PARALLAX LEVE NO HERO
     Desloca o wrapper .emp-hero-frame (não a imagem, que já tem a animação
     de Ken Burns) proporcionalmente ao scroll, só enquanto o hero está
     visível. Usa requestAnimationFrame para nunca rodar mais de uma vez
     por frame, e para de calcular assim que o hero sai da tela.
     Desativado com prefers-reduced-motion, e com intensidade reduzida em
     telas estreitas/touch para preservar a fluidez no celular.
     --------------------------------------------------------------------- */
  function initHeroParallax() {
    var frame = document.getElementById('emp-hero-frame');
    var heroSection = frame ? frame.closest('.emp-hero') : null;
    if (!frame || !heroSection) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    var isSmallScreen = window.matchMedia &&
      window.matchMedia('(max-width: 700px)').matches;
    var intensity = isSmallScreen ? 0.08 : 0.18; // fração do scroll aplicada
    var maxOffset = isSmallScreen ? 24 : 48; // px, limite do deslocamento

    var ticking = false;
    var lastY = null;

    function update() {
      ticking = false;

      var rect = heroSection.getBoundingClientRect();
      // Só calcula/aplica enquanto o hero estiver perto da viewport.
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      var offset = rect.top * intensity * -1;
      if (offset > maxOffset) offset = maxOffset;
      if (offset < -maxOffset) offset = -maxOffset;

      if (offset !== lastY) {
        frame.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0)';
        lastY = offset;
      }
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }
})();