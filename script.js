// Global script: year, particles and hero parallax
(function(){
    
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Particles generation
  const particlesRoot = document.getElementById('hero-particles');
  function createParticles(count=18){
    if(!particlesRoot) return;
    for(let i=0;i<count;i++){
      const p = document.createElement('div');
      p.className = 'hero-particle';
      const size = 6 + Math.random()*18;
      p.style.width = p.style.height = size + 'px';
      p.style.left = (Math.random()*100) + '%';
      p.style.top = (Math.random()*100) + '%';
      p.style.background = 'rgba(255,255,255,' + (0.03 + Math.random()*0.08) + ')';
      p.style.animationDelay = (Math.random()*6) + 's';
      p.style.transform = 'translateY(0)';
      particlesRoot.appendChild(p);
    }
  }
  createParticles(20);

  // Simple parallax on mouse move for hero shapes
  const hero = document.querySelector('.hero-premium');
  const shapes = document.querySelectorAll('.hero-premium .hero-shapes svg');
  if(hero && shapes.length){
    hero.addEventListener('mousemove', (e)=>{
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      shapes.forEach((s, i)=>{
        const depth = (i+1) * 6;
        s.style.transform = `translate3d(${x*depth}px, ${y*depth}px, 0)`;
      });
    });
    hero.addEventListener('mouseleave', ()=>{
      shapes.forEach(s=> s.style.transform='translate3d(0,0,0)');
    });
  }

  // Header scroll: toggle scrolled class
  const header = document.querySelector('.topbar');
  function onScroll(){
    if(window.scrollY > 20){
      header && header.classList.add('scrolled');
      header && header.classList.remove('transparent');
    } else {
      header && header.classList.remove('scrolled');
      header && header.classList.add('transparent');
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
    // Scroll reveal animation
  const reveals = document.querySelectorAll('.reveal');

  console.log(reveals);

  function revealOnScroll(){
    reveals.forEach((element)=>{
      const windowHeight = window.innerHeight;
      const elementTop = element.getBoundingClientRect().top;

      if(elementTop < windowHeight - 100){
        element.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();

  // Animação ao rolar a página
const scrollElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {

  entries.forEach((entry) => {

    if(entry.isIntersecting){

      entry.target.classList.add('active');

    } else {

      entry.target.classList.remove('active');

    }

  });

}, {
  threshold: 0.15
});
scrollElements.forEach((element)=>{
  observer.observe(element);
});
})();
