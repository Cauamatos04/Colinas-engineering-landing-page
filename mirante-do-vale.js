/* Página do empreendimento (Vista Catolé).
   1) Galeria: componente premium com foto principal grande, setas,
      contador, barra de progresso e navegação por categorias.
      Para adicionar fotos: edite apenas window.EMP_GALLERY no HTML da página.
      As categorias são derivadas automaticamente do nome de cada arquivo em
      window.EMP_GALLERY (o array em si nunca é alterado nem reordenado).
   2) Scroll reveal: ativa as animações dos blocos da seção "Experiência"
      (e reforça .reveal/.reveal-left/.reveal-right nesta página), usando
      apenas transform + opacity — sem blur nem custo de repaint alto.
   3) Parallax leve no hero. */
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

    var frame = document.getElementById('gallery-frame');
    var mainImg = document.getElementById('gallery-main-img');
    var prevBtn = document.getElementById('gallery-prev');
    var nextBtn = document.getElementById('gallery-next');
    var progressRoot = document.getElementById('gallery-progress');
    var categoriesRoot = document.getElementById('gallery-categories');
    var counterCurrent = document.getElementById('gallery-counter-current');
    var counterTotal = document.getElementById('gallery-counter-total');

    if (!images.length || !frame || !mainImg) return;

    var total = images.length;
    var currentIndex = 0;

    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }

    if (counterTotal) counterTotal.textContent = pad(total);

    /* -----------------------------------------------------------------
       Categorias: derivadas do nome de cada arquivo em window.EMP_GALLERY,
       sem alterar o array original. Cada regra só entra na navegação se
       existir pelo menos uma imagem correspondente — assim nunca aparece
       uma categoria "vazia" apontando para nada.
       ----------------------------------------------------------------- */
    var CATEGORY_RULES = [
      { label: 'Fachada', match: /fachada|hero/i },
      { label: 'Lobby', match: /salao(?!-festas)|convivencia|lavandeira/i },
      { label: 'Lazer', match: /area-gourmet|salao-festas|solarium|quadra|playground/i },
      { label: 'Piscina', match: /piscina|pool/i },
      { label: 'Academia', match: /academia|crossfit/i },
      { label: 'Market', match: /mini-mercado/i }
    ];

    var indexToCategory = images.map(function (src) {
      for (var i = 0; i < CATEGORY_RULES.length; i++) {
        if (CATEGORY_RULES[i].match.test(src)) return CATEGORY_RULES[i].label;
      }
      return null;
    });

    var categories = [];
    CATEGORY_RULES.forEach(function (rule) {
      var firstIndex = indexToCategory.indexOf(rule.label);
      if (firstIndex !== -1) {
        categories.push({ label: rule.label, firstIndex: firstIndex });
      }
    });

    /* -----------------------------------------------------------------
       Preload
       ----------------------------------------------------------------- */
    var preloaded = {};
    function preload(i) {
      if (i < 0 || i >= total || preloaded[i]) return;
      var img = new Image();
      img.src = images[i];
      preloaded[i] = true;
    }

    /* -----------------------------------------------------------------
       Barra de progresso
       ----------------------------------------------------------------- */
    var progressDots = [];
    if (progressRoot) {
      var fragProgress = document.createDocumentFragment();
      images.forEach(function () {
        var dot = document.createElement('span');
        dot.className = 'emp-gallery-progress-dot';
        fragProgress.appendChild(dot);
        progressDots.push(dot);
      });
      progressRoot.appendChild(fragProgress);
    }

    /* -----------------------------------------------------------------
       Categorias (navegação)
       ----------------------------------------------------------------- */
    var categoryButtons = [];
    if (categoriesRoot && categories.length) {
      var fragCats = document.createDocumentFragment();
      categories.forEach(function (cat) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emp-gallery-cat-btn';
        btn.textContent = cat.label;
        btn.addEventListener('click', function () {
          goTo(cat.firstIndex);
        });
        fragCats.appendChild(btn);
        categoryButtons.push(btn);
      });
      categoriesRoot.appendChild(fragCats);
    }

    function updateCategoryState() {
      var activeLabel = indexToCategory[currentIndex];
      categoryButtons.forEach(function (btn, i) {
        btn.classList.toggle('is-active', categories[i].label === activeLabel);
      });
    }

    /* -----------------------------------------------------------------
       Render
       ----------------------------------------------------------------- */
    function render(index) {
      currentIndex = index;
      var src = images[index];

      mainImg.classList.remove('is-visible');

      window.setTimeout(function () {
        mainImg.src = src;
        mainImg.onload = function () {
          mainImg.classList.add('is-visible');
        };
      }, 160);

      if (counterCurrent) counterCurrent.textContent = pad(index + 1);

      progressDots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });

      updateCategoryState();
      preload(index + 1);
      preload(index - 1);
    }

    function goTo(index) {
      var next = ((index % total) + total) % total;
      render(next);
    }

    function goNext() { goTo(currentIndex + 1); }
    function goPrev() { goTo(currentIndex - 1); }

    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    /* -----------------------------------------------------------------
       Teclado (← →)
       ----------------------------------------------------------------- */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    });

    /* -----------------------------------------------------------------
       Swipe (celular)
       ----------------------------------------------------------------- */
    var touchStartX = null;

    frame.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    frame.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var deltaX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) {
          goNext();
        } else {
          goPrev();
        }
      }
      touchStartX = null;
    }, { passive: true });

    render(0);
    preload(1);
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