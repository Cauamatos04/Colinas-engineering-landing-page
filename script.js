/* ==========================================================================
   Colinas Engenharia — Camada de animação premium (versão otimizada)
   Organização:
   1. Utilitários / feature-detection
   2. Preloader
   3. Scroll: 100% nativo (sem Lenis) + refresh do ScrollTrigger
   4. Cursor personalizado (com pausa automática quando parado)
   5. Barra de progresso de leitura
   6. Navbar (estado "scrolled") + menu mobile
   7. Partículas do hero + parallax por mouse + intro (sem repaint no scroll)
   8. Títulos letra por letra (SplitType) + reveals de seção
   9. Botões: ripple ao clicar
   10. Cards: tilt 3D sincronizado ao rAF (desktop) / carrossel (desktop + mobile)
   11. Contadores animados
   12. Ano do rodapé
   13. Seção "Bastidores" (obra): animação de entrada repetível
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. Utilitários / feature-detection
   * ------------------------------------------------------------------ */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mqDesktopWidth = window.matchMedia('(min-width: 901px)');
  var mqMobileWidth = window.matchMedia('(max-width: 900px)');

  function isDesktopExperience() {
    return mqDesktopPointer.matches && mqDesktopWidth.matches;
  }

  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var hasSplitType = typeof window.SplitType !== 'undefined';

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  /* ------------------------------------------------------------------ *
   * 2. Preloader
   * ------------------------------------------------------------------ */
  function runPreloader(onComplete) {
    var preloader = document.getElementById('preloader');
    var logo = preloader ? preloader.querySelector('.preloader-logo') : null;
    var bar = preloader ? preloader.querySelector('.preloader-bar span') : null;

    if (!preloader) {
      onComplete();
      return;
    }

    document.body.classList.add('is-loading');

    if (prefersReducedMotion || !hasGSAP) {
      preloader.classList.add('is-done');
      preloader.style.display = 'none';
      document.body.classList.remove('is-loading');
      onComplete();
      return;
    }

    var tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: function () {
        preloader.classList.add('is-done');
        preloader.style.display = 'none';
        document.body.classList.remove('is-loading');
        onComplete();
      },
    });

    tl.to(logo, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9 })
      .to(bar, { width: '100%', duration: 0.9, ease: 'power2.inOut' }, '-=0.5')
      .to(preloader, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, '+=0.1');
  }

  /* ------------------------------------------------------------------ *
   * 3. Scroll — 100% nativo, em qualquer tela
   * ------------------------------------------------------------------ *
   * O Lenis rodava em desktop e reinterpretava o gesto de wheel/trackpad
   * via JS antes de mover a página — isso é, por definição, um atraso
   * entre o gesto do usuário e o conteúdo na tela. O scroll nativo do
   * navegador é composto direto pela GPU, sem depender de JavaScript, e é
   * sempre mais fluido do que qualquer smooth-scroll customizado.
   * O ScrollTrigger do GSAP funciona perfeitamente sobre scroll nativo —
   * só precisamos avisá-lo quando o layout muda de tamanho. */
  function initScrollTriggerRefresh() {
    if (!hasGSAP || !hasScrollTrigger) return;
    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
    });
    window.addEventListener('resize', debounce(function () {
      ScrollTrigger.refresh();
    }, 200));
  }

  /* ------------------------------------------------------------------ *
   * 4. Cursor personalizado (somente desktop com ponteiro fino)
   * ------------------------------------------------------------------ */
  function initCustomCursor() {
    if (!isDesktopExperience() || prefersReducedMotion) return;

    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    document.body.classList.add('cursor-ready');

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var ringX = mouseX;
    var ringY = mouseY;
    var rafId = null;

    function tick() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0) translate(-50%,-50%)';

      if (Math.abs(mouseX - ringX) < 0.1 && Math.abs(mouseY - ringY) < 0.1) {
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function ensureLoop() {
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    window.addEventListener(
      'mousemove',
      function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0) translate(-50%,-50%)';
        ensureLoop();
      },
      { passive: true }
    );

    var growTargets = 'a, button, .card, .btn, input, textarea';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(growTargets)) {
        document.body.classList.add('cursor-grow');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(growTargets)) {
        document.body.classList.remove('cursor-grow');
      }
    });

    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      if (document.body.classList.contains('cursor-ready')) {
        dot.style.opacity = '';
        ring.style.opacity = '';
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. Barra de progresso de leitura
   * ------------------------------------------------------------------ */
  function initProgressBar() {
    var bar = document.getElementById('progress-bar');
    if (!bar) return;

    var ticking = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', debounce(update, 150));
    update();
  }

  /* ------------------------------------------------------------------ *
   * 6. Navbar (estado "scrolled") + menu mobile
   * ------------------------------------------------------------------ */
  function initHeader() {
    var header = document.querySelector('.topbar');
    if (!header) return;
    var ticking = false;

    function apply() {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
        header.classList.remove('transparent');
      } else {
        header.classList.remove('scrolled');
        header.classList.add('transparent');
      }
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          requestAnimationFrame(apply);
          ticking = true;
        }
      },
      { passive: true }
    );
    apply();
  }

  function initMobileMenu() {
    var menuToggle = document.getElementById('menu-toggle');
    var nav = document.getElementById('primary-nav');
    var backdrop = document.getElementById('nav-backdrop');
    if (!menuToggle || !nav || !backdrop) return;

    function openMenu() {
      nav.classList.add('is-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Fechar menu');
      backdrop.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menu');
      backdrop.hidden = true;
      document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', function () {
      var isOpen = nav.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });

    backdrop.addEventListener('click', closeMenu);

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener(
      'resize',
      debounce(function () {
        if (window.innerWidth > 900) closeMenu();
      }, 150)
    );
  }

  /* ------------------------------------------------------------------ *
   * 7. Partículas do hero + parallax por mouse + intro
   * ------------------------------------------------------------------ */
  function createParticles(count) {
    var particlesRoot = document.getElementById('hero-particles');
    if (!particlesRoot) return;
    count = count || (isDesktopExperience() ? 22 : 8);
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'hero-particle';
      var size = 3 + Math.random() * 5;
      p.style.width = p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = 40 + Math.random() * 60 + '%';
      p.style.animationDuration = 6 + Math.random() * 8 + 's';
      p.style.animationDelay = Math.random() * 8 + 's';
      fragment.appendChild(p);
    }
    particlesRoot.appendChild(fragment);
  }

  function initHeroMouseParallax() {
    var hero = document.querySelector('.hero-premium');
    var shapes = document.querySelectorAll('.hero-premium .hero-shapes .shape');
    if (!hero || !shapes.length || prefersReducedMotion) return;

    var rafId = null;
    var pendingX = 0;
    var pendingY = 0;

    function apply() {
      shapes.forEach(function (s, i) {
        var depth = (i + 1) * 14;
        s.style.transform = 'translate3d(' + pendingX * depth + 'px,' + pendingY * depth + 'px,0)';
      });
      rafId = null;
    }

    function onMove(e) {
      var rect = hero.getBoundingClientRect();
      pendingX = (e.clientX - rect.left) / rect.width - 0.5;
      pendingY = (e.clientY - rect.top) / rect.height - 0.5;
      if (!rafId) rafId = requestAnimationFrame(apply);
    }
    function onLeave() {
      pendingX = 0;
      pendingY = 0;
      if (!rafId) rafId = requestAnimationFrame(apply);
    }

    if (hasGSAP && typeof gsap.matchMedia === 'function') {
      var mm = gsap.matchMedia();
      mm.add('(hover: hover) and (pointer: fine) and (min-width: 901px)', function () {
        hero.addEventListener('mousemove', onMove, { passive: true });
        hero.addEventListener('mouseleave', onLeave);
        return function () {
          hero.removeEventListener('mousemove', onMove);
          hero.removeEventListener('mouseleave', onLeave);
          onLeave();
        };
      });
    } else if (isDesktopExperience()) {
      hero.addEventListener('mousemove', onMove, { passive: true });
      hero.addEventListener('mouseleave', onLeave);
    }
  }

  function initHeroIntro() {
    var heroBg = document.getElementById('hero-bg');
    if (!heroBg) return;

    if (prefersReducedMotion || !hasGSAP) {
      heroBg.classList.add('breathe');
      return;
    }

    gsap.fromTo(heroBg, { scale: 1.08 }, { scale: 1, ease: 'power2.out', duration: 1.6 });
  }

  /* ------------------------------------------------------------------ *
   * 8. Títulos letra por letra (SplitType) + reveals de seção variados
   * ------------------------------------------------------------------ */
  var REVEAL_VARIANTS = ['reveal-left', 'reveal-scale', 'reveal-right', 'reveal-blur', 'reveal-rotate'];

  function assignRevealVariants() {
    var elements = document.querySelectorAll('.reveal');
    var lastVariant = null;
    var counter = 0;

    elements.forEach(function (el) {
      if (el.closest('.hero-premium')) return;

      if (el.classList.contains('card')) {
        el.classList.add('reveal-scale');
        return;
      }
      if (el.classList.contains('pillar')) {
        el.classList.add('reveal-blur');
        return;
      }
      if (el.classList.contains('indicator-item')) {
        el.classList.add('reveal-rotate');
        return;
      }

      var variant = REVEAL_VARIANTS[counter % REVEAL_VARIANTS.length];
      if (variant === lastVariant) {
        counter++;
        variant = REVEAL_VARIANTS[counter % REVEAL_VARIANTS.length];
      }
      el.classList.add(variant);
      lastVariant = variant;
      counter++;
    });
  }

  function initScrollReveal() {
    var scrollElements = document.querySelectorAll('.reveal');

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    scrollElements.forEach(function (element) {
      observer.observe(element);
    });
  }

  function initSplitTitles() {
    var titles = document.querySelectorAll('.split-title');
    if (!titles.length) return;

    if (prefersReducedMotion || !hasSplitType || !hasGSAP) return;

    titles.forEach(function (title) {
      var split = new SplitType(title, { types: 'chars, words' });

      gsap.set(split.chars, { opacity: 0, yPercent: 110, display: 'inline-block' });

      var trigger = hasScrollTrigger
        ? {
            trigger: title,
            start: 'top 85%',
            once: true,
          }
        : null;

      gsap.to(split.chars, {
        opacity: 1,
        yPercent: 0,
        duration: 0.6,
        stagger: 0.018,
        ease: 'power3.out',
        scrollTrigger: trigger,
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 9. Botões: ripple ao clicar
   * ------------------------------------------------------------------ */
  function initButtonRipple() {
    var buttons = document.querySelectorAll('.btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        var size = Math.max(rect.width, rect.height);
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
        btn.appendChild(ripple);
        window.setTimeout(function () {
          ripple.remove();
        }, 650);
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 10a. Cards (desktop): tilt 3D + reflexo, escrita no DOM sincronizada
   * ao requestAnimationFrame
   * ------------------------------------------------------------------ */
  function initTiltCards() {
    var cards = document.querySelectorAll('.tilt-card');
    if (!cards.length || prefersReducedMotion) return;

    var rafId = null;
    var activeCard = null;
    var pendingPx = 0.5;
    var pendingPy = 0.5;

    function apply() {
      rafId = null;
      if (!activeCard) return;
      var rotateX = (pendingPy - 0.5) * -8;
      var rotateY = (pendingPx - 0.5) * 8;
      activeCard.style.transform =
        'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-8px)';
      activeCard.style.setProperty('--mx', pendingPx * 100 + '%');
      activeCard.style.setProperty('--my', pendingPy * 100 + '%');
    }

    function onEnter(e) {
      activeCard = e.currentTarget;
      activeCard.style.willChange = 'transform';
    }

    function onMove(e) {
      var rect = e.currentTarget.getBoundingClientRect();
      pendingPx = (e.clientX - rect.left) / rect.width;
      pendingPy = (e.clientY - rect.top) / rect.height;
      if (!rafId) rafId = requestAnimationFrame(apply);
    }

    function onLeave(e) {
      var card = e.currentTarget;
      card.style.transform = '';
      card.style.willChange = '';
      if (activeCard === card) activeCard = null;
    }

    function attach() {
      cards.forEach(function (card) {
        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mousemove', onMove, { passive: true });
        card.addEventListener('mouseleave', onLeave);
      });
    }
    function detach() {
      cards.forEach(function (card) {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
        card.style.transform = '';
        card.style.willChange = '';
      });
    }

    if (hasGSAP && typeof gsap.matchMedia === 'function') {
      var mm = gsap.matchMedia();
      mm.add('(hover: hover) and (pointer: fine) and (min-width: 901px)', function () {
        attach();
        return detach;
      });
    } else if (isDesktopExperience()) {
      attach();
    }
  }

  /* ------------------------------------------------------------------ *
   * 10b. Carrossel de empreendimentos — dots (mobile) + setas (desktop)
   * ------------------------------------------------------------------ *
   * Um único IntersectionObserver por card mantém os dots (mobile) e o
   * estado ativo/inativo das setas (desktop) sincronizados com o scroll
   * nativo do trilho — sem reimplementar o scroll em JS. As setas apenas
   * chamam scrollBy() por um card de largura; o snap nativo faz o resto.
   * ------------------------------------------------------------------ */
  function initCardsCarousel() {
    var track = document.getElementById('cards-track');
    var dotsRoot = document.getElementById('cards-dots');
    var prevBtn = document.getElementById('carousel-prev');
    var nextBtn = document.getElementById('carousel-next');
    if (!track) return;

    var dotsObserver = null;

    function getCards() {
      return Array.prototype.slice.call(track.querySelectorAll('.card'));
    }

    /* --- Dots: reconstruídos e observados sempre que houver cards --- */
    function setupDots() {
      if (dotsObserver || !dotsRoot) return;
      var cards = getCards();
      if (!cards.length) return;

      if (!dotsRoot.childElementCount) {
        var fragment = document.createDocumentFragment();
        cards.forEach(function () {
          fragment.appendChild(document.createElement('span'));
        });
        dotsRoot.appendChild(fragment);
      }
      var dots = Array.prototype.slice.call(dotsRoot.children);

      function setActive(index) {
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      }
      setActive(0);

      dotsObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
              setActive(cards.indexOf(entry.target));
            }
          });
        },
        { root: track, threshold: [0.6] }
      );

      cards.forEach(function (card) {
        dotsObserver.observe(card);
      });
    }

    function teardownDots() {
      if (!dotsObserver) return;
      dotsObserver.disconnect();
      dotsObserver = null;
    }

    function syncDots() {
      if (mqMobileWidth.matches) setupDots();
      else teardownDots();
    }

    /* --- Setas (desktop): scroll por um card + estado disabled --- */
    function cardStep() {
      var cards = getCards();
      if (!cards.length) return track.clientWidth;
      var style = window.getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      return cards[0].getBoundingClientRect().width + gap;
    }

    function updateArrowState() {
      if (!prevBtn || !nextBtn) return;
      var maxScroll = track.scrollWidth - track.clientWidth - 2;
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= maxScroll;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        track.scrollBy({ left: -cardStep(), behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        track.scrollBy({ left: cardStep(), behavior: 'smooth' });
      });
    }

    var arrowTicking = false;
    track.addEventListener(
      'scroll',
      function () {
        if (!arrowTicking) {
          requestAnimationFrame(function () {
            updateArrowState();
            arrowTicking = false;
          });
          arrowTicking = true;
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', debounce(function () {
      updateArrowState();
      syncDots();
    }, 150));

    syncDots();
    mqMobileWidth.addEventListener('change', syncDots);
    updateArrowState();
  }

  /* ------------------------------------------------------------------ *
   * 11. Contadores animados
   * ------------------------------------------------------------------ */
  function initCounters() {
    var counters = document.querySelectorAll('.indicator-number');
    if (!counters.length) return;

    if (prefersReducedMotion) {
      counters.forEach(function (el) {
        el.textContent = (el.dataset.count || '0') + (el.dataset.suffix || '');
      });
      return;
    }

    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          if (el.dataset.done) return;
          el.dataset.done = 'true';

          var target = parseInt(el.dataset.count, 10) || 0;
          var suffix = el.dataset.suffix || '';
          var duration = 1400;
          var start = performance.now();

          function tick(now) {
            var progress = Math.min(1, (now - start) / duration);
            var eased = 1 - Math.pow(1 - progress, 3);
            var value = Math.round(target * eased);
            el.textContent = value.toLocaleString('pt-BR') + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);

          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------ *
   * 12. Ano do rodapé
   * ------------------------------------------------------------------ */
  function setFooterYear() {
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------ *
   * 13. Seção "Bastidores" — animação de entrada repetível
   * ------------------------------------------------------------------ *
   * Diferente do sistema genérico de .reveal (que roda uma única vez por
   * elemento e depois se desliga), esta seção precisa reencenar a entrada
   * toda vez que o usuário sai e volta a ela — por isso tem sua própria
   * ScrollTrigger com toggleActions, em vez de usar a classe ".reveal".
   * Com GSAP: cada "play"/"reset" reanima do estado inicial. Sem GSAP (ou
   * com prefers-reduced-motion), cai para um IntersectionObserver simples
   * que também alterna a classe a cada entrada/saída, sem instâncias
   * fantasmas do intervalo entre from/to.
   * ------------------------------------------------------------------ */
  function initObraReveal() {
    var media = document.getElementById('obra-media');
    var caption = document.getElementById('obra-caption');
    if (!media || !caption) return;

    if (prefersReducedMotion) {
      media.style.opacity = '1';
      caption.style.opacity = '1';
      return;
    }

    if (hasGSAP && hasScrollTrigger) {
      gsap.set(media, { opacity: 0, scale: 0.95, y: 30 });
      gsap.set(caption, { opacity: 0, x: 40 });

      ScrollTrigger.create({
        trigger: '.obra-construcao',
        start: 'top 78%',
        onEnter: function () {
          gsap.to(media, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'power2.out' });
          gsap.to(caption, { opacity: 1, x: 0, duration: 0.8, delay: 0.25, ease: 'power2.out' });
        },
        onLeave: function () {
          gsap.set(media, { opacity: 0, scale: 0.95, y: 30 });
          gsap.set(caption, { opacity: 0, x: 40 });
        },
        onEnterBack: function () {
          gsap.to(media, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'power2.out' });
          gsap.to(caption, { opacity: 1, x: 0, duration: 0.8, delay: 0.25, ease: 'power2.out' });
        },
        onLeaveBack: function () {
          gsap.set(media, { opacity: 0, scale: 0.95, y: 30 });
          gsap.set(caption, { opacity: 0, x: 40 });
        },
      });
      return;
    }

    // Sem GSAP/ScrollTrigger: alterna via CSS transitions, reencenando a
    // cada entrada na viewport (o observer nunca se desliga).
    media.style.transition = 'opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)';
    caption.style.transition = 'opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s';

    function setHidden() {
      media.style.opacity = '0';
      media.style.transform = 'scale(0.95) translateY(30px)';
      caption.style.opacity = '0';
      caption.style.transform = 'translateX(40px)';
    }
    function setVisible() {
      media.style.opacity = '1';
      media.style.transform = 'scale(1) translateY(0)';
      caption.style.opacity = '1';
      caption.style.transform = 'translateX(0)';
    }
    setHidden();

    var obraObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setVisible();
          else setHidden();
        });
      },
      { threshold: 0.2 }
    );
    obraObserver.observe(document.querySelector('.obra-construcao'));
  }

  /* ------------------------------------------------------------------ *
   * Inicialização
   * ------------------------------------------------------------------ */
  function init() {
    setFooterYear();
    createParticles();
    initHeader();
    initMobileMenu();
    initHeroMouseParallax();
    initHeroIntro();
    initProgressBar();
    initCustomCursor();
    initButtonRipple();
    initTiltCards();
    initCardsCarousel();
    initCounters();
    initObraReveal();

    assignRevealVariants();
    initScrollReveal();
    initSplitTitles();

    initScrollTriggerRefresh();
  }

  document.addEventListener('DOMContentLoaded', function () {
    runPreloader(init);
  });
})();