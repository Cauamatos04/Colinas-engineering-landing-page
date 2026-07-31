/* Galeria da página de empreendimento.
   Para adicionar fotos: edite apenas window.EMP_GALLERY no HTML da página. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
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
  });
})();