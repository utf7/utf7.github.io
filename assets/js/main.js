/**
 * Site helpers: geopattern banners, image lazy-loading.
 * No jQuery.
 */
(function () {
  function initGeoPatterns() {
    if (typeof GeoPattern === 'undefined') return;
    document.querySelectorAll('.geopattern').forEach(function (el) {
      var id = el.getAttribute('data-pattern-id') || '';
      var pattern = GeoPattern.generate(id);
      el.style.backgroundImage = pattern.toDataUrl();
    });
  }

  function lazyLoadImages() {
    document.querySelectorAll('.markdown-body img:not([loading])').forEach(function (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    initGeoPatterns();
    lazyLoadImages();
  });
})();
