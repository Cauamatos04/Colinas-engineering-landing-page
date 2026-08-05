/* ==========================================================================
   Colinas Engenharia — Camada de animação premium
   Organização:
   1. Utilitários / feature-detection
   2. Preloader
   3. Scroll: 100% nativo (sem Lenis) + refresh do ScrollTrigger
   4. Cursor personalizado
   5. Barra de progresso de leitura
   6. Navbar (estado "scrolled") + menu mobile
   7. Hero: slider minimalista (nome + botão + troca suave de imagem)
   8. Títulos letra por letra (SplitType) + reveals de seção
   9. Botões: ripple ao clicar
   10. Cards: tilt 3D (desktop) / carrossel (desktop + mobile)
   11. Contadores animados
   12. Ano do rodapé
   13. Seção "Obras em Construção": animação de entrada repetível
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
   * via JS antes de mover a página — um atraso perceptível entre o gesto
   * do usuário e a rolagem na tela. O scroll nativo é composto pela GPU,
   * sem depender de JavaScript, e é sempre mais fluido. O ScrollTrigger
   * do GSAP funciona perfeitamente sobre scroll nativo — só precisa ser
   * avisado quando o layout muda de tamanho. */
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

    var growTargets = 'a, button, .card, .btn, .btn-line, .btn-obra, .hero-cta, input, textarea';
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
   * 7. Hero — slider minimalista
   * ------------------------------------------------------------------ *
   * Cada slide carrega o nome e o link do empreendimento em data-attrs.
   * Trocar de slide altera apenas: imagem ativa (crossfade via CSS),
   * texto do nome e href do botão "Saiba mais". Sem parallax, sem
   * partículas, sem zoom — só a troca suave definida no CSS
   * (.hero-slide { transition: opacity } ). Avança automaticamente a
   * cada 7s e para de avançar quando o usuário interage com os dots.
   * ------------------------------------------------------------------ */
  function initHeroSlider() {
    var root = document.getElementById('hero-slider');
    var dotsRoot = document.getElementById('hero-dots');
    var nameEl = document.getElementById('hero-name');
    var ctaEl = document.getElementById('hero-cta');
    if (!root || !nameEl || !ctaEl) return;

    var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
    if (!slides.length) return;

    var currentIndex = slides.findIndex(function (slide) {
      return slide.classList.contains('is-active');
    });
    if (currentIndex < 0) currentIndex = 0;

    var dots = [];
    if (dotsRoot && slides.length > 1) {
      var fragment = document.createDocumentFragment();
      slides.forEach(function (slide, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Ver ' + (slide.dataset.name || 'empreendimento ' + (i + 1)));
        if (i === currentIndex) {
          dot.classList.add('is-active');
          dot.setAttribute('aria-selected', 'true');
        } else {
          dot.setAttribute('aria-selected', 'false');
        }
        dot.addEventListener('click', function () {
          goTo(i);
          resetAutoplay();
        });
        fragment.appendChild(dot);
        dots.push(dot);
      });
      dotsRoot.appendChild(fragment);
    }

    function applyContent(slide) {
      var name = slide.dataset.name || '';
      var href = slide.dataset.href || '#';
      nameEl.textContent = name;
      ctaEl.setAttribute('href', href);
    }

    function goTo(index) {
      if (index === currentIndex) return;
      slides[currentIndex].classList.remove('is-active');
      currentIndex = index;
      slides[currentIndex].classList.add('is-active');
      applyContent(slides[currentIndex]);

      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === currentIndex);
        dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
      });
    }

    var autoplayId = null;

    function startAutoplay() {
      if (slides.length < 2 || prefersReducedMotion) return;
      autoplayId = window.setInterval(function () {
        goTo((currentIndex + 1) % slides.length);
      }, 7000);
    }

    function stopAutoplay() {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    applyContent(slides[currentIndex]);
    startAutoplay();

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });
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
      if (el.closest('.hero-minimal') || el.closest('.proj-hero')) return;

      if (el.classList.contains('card') || el.classList.contains('proj-card')) {
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
   * 9. Botões: ripple ao clicar (pílulas .btn, retangulares .btn-line,
   * botão da Obra .btn-obra e botão da Hero .hero-cta)
   * ------------------------------------------------------------------ */
  function initButtonRipple() {
    var buttons = document.querySelectorAll('.btn, .btn-line, .btn-obra, .hero-cta');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        var size = Math.max(rect.width, rect.height);
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
        btn.style.position = btn.style.position || 'relative';
        btn.style.overflow = 'hidden';
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
   * 11. Contadores animados (páginas internas que usem .indicator-number)
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
   * 13. Seção "Obras em Construção" — animação de entrada repetível
   * ------------------------------------------------------------------ *
   * Diferente do sistema genérico de .reveal (que roda uma única vez por
   * elemento e depois se desliga), esta seção precisa reencenar a entrada
   * toda vez que o usuário sai e volta a ela — por isso tem sua própria
   * ScrollTrigger com onEnter/onLeave/onEnterBack/onLeaveBack, em vez de
   * usar a classe ".reveal". Fade-up + translateY(30px), 800ms. Sem GSAP
   * (ou com prefers-reduced-motion), cai para um IntersectionObserver
   * simples com o mesmo comportamento.
   * ------------------------------------------------------------------ */
  function initObraReveal() {
    var media = document.getElementById('obra-media');
    var card = document.getElementById('obra-card');
    if (!media || !card) return;

    if (prefersReducedMotion) {
      media.style.opacity = '1';
      card.style.opacity = '1';
      return;
    }

    if (hasGSAP && hasScrollTrigger) {
      gsap.set(media, { opacity: 0, y: 30 });
      gsap.set(card, { opacity: 0, y: 30 });

      ScrollTrigger.create({
        trigger: '.obra-construcao',
        start: 'top 78%',
        onEnter: function () {
          gsap.to(media, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
          gsap.to(card, { opacity: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'power2.out' });
        },
        onLeave: function () {
          gsap.set(media, { opacity: 0, y: 30 });
          gsap.set(card, { opacity: 0, y: 30 });
        },
        onEnterBack: function () {
          gsap.to(media, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
          gsap.to(card, { opacity: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'power2.out' });
        },
        onLeaveBack: function () {
          gsap.set(media, { opacity: 0, y: 30 });
          gsap.set(card, { opacity: 0, y: 30 });
        },
      });
      return;
    }

    media.style.transition = 'opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)';
    card.style.transition = 'opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s';

    function setHidden() {
      media.style.opacity = '0';
      media.style.transform = 'translateY(30px)';
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
    }
    function setVisible() {
      media.style.opacity = '1';
      media.style.transform = 'translateY(0)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
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
    initHeader();
    initMobileMenu();
    initHeroSlider();
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