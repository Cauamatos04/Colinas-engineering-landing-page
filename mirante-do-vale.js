/* Página do empreendimento (Mirante do Vale).
   1) Galeria: componente premium com foto principal grande, setas,
      contador, barra de progresso e navegação por categorias.
   2) Parallax leve no hero (otimizado).
   3) Nota: Scroll reveal é centralizado no script.js global para evitar duplicação.
*/
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initGallery();
    initHeroParallax();
  });

  /* =====================================================================
     GALERIA
     ===================================================================== */
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

    /* Category rules derivadas automaticamente */
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

    /* Preload otimizado */
    var preloaded = {};
    function preload(i) {
      if (i < 0 || i >= total || preloaded[i]) return;
      var img = new Image();
      img.src = images[i];
      preloaded[i] = true;
    }

    /* Barra de progresso */
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

    /* Categorias */
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

    /* Render */
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

    /* Navegação por teclado */
    var keydownHandler = function (e) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', keydownHandler);

    /* Navegação por swipe */
    var touchStartX = null;
    frame.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    frame.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var deltaX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) goNext();
        else goPrev();
      }
      touchStartX = null;
    }, { passive: true });

    render(0);
    preload(1);
  }

  /* =====================================================================
     PARALLAX NO HERO — Otimizado
     ===================================================================== */
  function initHeroParallax() {
    var frame = document.getElementById('emp-hero-frame');
    var heroSection = frame ? frame.closest('.emp-hero') : null;
    if (!frame || !heroSection) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    var isSmallScreen = window.matchMedia &&
      window.matchMedia('(max-width: 700px)').matches;
    
    // Reduzir intensidade em telas pequenas
    var intensity = isSmallScreen ? 0.06 : 0.15;
    var maxOffset = isSmallScreen ? 20 : 40;

    var ticking = false;
    var lastY = null;
    var heroVisible = true;

    function update() {
      ticking = false;

      if (!heroVisible) return;

      var rect = heroSection.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        heroVisible = false;
        return;
      }

      var offset = rect.top * intensity * -1;
      if (offset > maxOffset) offset = maxOffset;
      if (offset < -maxOffset) offset = -maxOffset;

      if (Math.abs(offset - lastY) > 0.5) {
        frame.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
        lastY = offset;
      }
    }

    function onScroll() {
      heroVisible = true;
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }
})();