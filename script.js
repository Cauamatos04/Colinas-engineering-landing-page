// Global script: year, particles, hero parallax, mobile menu, scroll reveal and counters
(function () {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const particlesRoot = document.getElementById('hero-particles');
  function createParticles(count = 22) {
    if (!particlesRoot) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'hero-particle';
      const size = 3 + Math.random() * 5;
      p.style.width = p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = 40 + Math.random() * 60 + '%';
      p.style.animationDuration = 6 + Math.random() * 8 + 's';
      p.style.animationDelay = Math.random() * 8 + 's';
      particlesRoot.appendChild(p);
    }
  }
  createParticles(22);

  const hero = document.querySelector('.hero-premium');
  const shapes = document.querySelectorAll('.hero-premium .hero-shapes .shape');
  if (hero && shapes.length && window.matchMedia('(min-width: 901px)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      shapes.forEach((s, i) => {
        const depth = (i + 1) * 14;
        s.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
      });
    });
    hero.addEventListener('mouseleave', () => {
      shapes.forEach((s) => (s.style.transform = 'translate3d(0,0,0)'));
    });
  }

  const header = document.querySelector('.topbar');
  function onScroll() {
    if (window.scrollY > 20) {
      header && header.classList.add('scrolled');
      header && header.classList.remove('transparent');
    } else {
      header && header.classList.remove('scrolled');
      header && header.classList.add('transparent');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');
  const backdrop = document.getElementById('nav-backdrop');

  function openMenu() {
    if (!nav || !menuToggle || !backdrop) return;
    nav.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu');
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!nav || !menuToggle || !backdrop) return;
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    backdrop.hidden = true;
    document.body.style.overflow = '';
  }

  if (menuToggle && nav && backdrop) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });

    backdrop.addEventListener('click', closeMenu);

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  const scrollElements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    },
    { threshold: 0.15 }
  );

  scrollElements.forEach((element) => observer.observe(element));

  // Contagem animada dos indicadores
  const counters = document.querySelectorAll('.indicator-number');
  if (counters.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.dataset.done) return;
          el.dataset.done = 'true';

          const target = parseInt(el.dataset.count, 10) || 0;
          const suffix = el.dataset.suffix || '';
          const duration = 1400;
          const start = performance.now();

          function tick(now) {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            el.textContent = value.toLocaleString('pt-BR') + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);

          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach((el) => {
      el.textContent = (el.dataset.count || '0') + (el.dataset.suffix || '');
    });
  }
})();