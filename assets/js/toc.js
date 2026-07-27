/**
 * Post table of contents — vanilla rewrite of jquery.toc.js
 */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function encodeId(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  }

  function getLevel(el) {
    return parseInt(el.nodeName.replace('H', ''), 10);
  }

  function buildToc(container) {
    var headers = Array.prototype.slice.call(
      document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6')
    ).filter(function (h) {
      if (!h.id) {
        var prev = h.previousElementSibling;
        if (prev && prev.getAttribute('name')) {
          h.id = prev.getAttribute('name').replace(/\./g, '-');
        }
      }
      return !!h.id;
    });

    if (headers.length < 2) {
      container.style.display = 'none';
      return null;
    }

    var highest = headers.map(getLevel).sort(function (a, b) { return a - b; })[0];
    var level = getLevel(headers[0]);
    var html = '<p><strong class="toc-title">文章目录</strong></p>\n<ul class="toc">';

    headers.forEach(function (header) {
      var thisLevel = getLevel(header);
      if (thisLevel === highest) {
        header.classList.add('top-level-header');
      }
      header.classList.add('clickable-header');

      if (thisLevel === level) {
        html += '<li class="toc-item toc-level-' + thisLevel + '">';
        html += '<a class="jumper" href="#' + encodeId(header.id) + '">';
        html += '<span class="toc-text">' + header.innerHTML + '</span></a>';
      } else if (thisLevel <= level) {
        for (var i = thisLevel; i < level; i++) {
          html += '</li></ul>';
        }
        html += '<li class="toc-item toc-level-' + thisLevel + '"><a class="jumper" href="#' + encodeId(header.id) + '">';
        html += '<span class="toc-text">' + header.innerHTML + '</span></a>';
      } else {
        for (var j = thisLevel; j > level; j--) {
          html += '<ul class="toc-child"><li class="toc-item toc-level-' + j + '">';
        }
        html += '<a class="jumper" href="#' + encodeId(header.id) + '">';
        html += '<span class="toc-text">' + header.innerHTML + '</span></a>';
      }
      level = thisLevel;
    });
    html += '</ul>';
    container.innerHTML = html;
    return headers;
  }

  ready(function () {
    var module = document.getElementById('post-directory-module');
    var directory = document.querySelector('.post-directory');
    if (!module || !directory) return;

    var headers = buildToc(directory);
    if (!headers) return;

    var jumpers = directory.querySelectorAll('.toc-item .jumper');
    var sectionOffsets = [];

    function calculateOffsets() {
      sectionOffsets = headers.map(function (h) { return h.offsetTop; });
    }
    calculateOffsets();
    window.addEventListener('load', calculateOffsets);

    function highlight() {
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      var highlightIndex = 0;
      var count = sectionOffsets.length;

      if (currentScroll + 60 > sectionOffsets[count - 1]) {
        highlightIndex = count;
      } else {
        for (var i = 0; i < count; i++) {
          if (currentScroll + 60 <= sectionOffsets[i]) {
            highlightIndex = i;
            break;
          }
        }
      }
      if (highlightIndex === 0) highlightIndex = 1;

      jumpers.forEach(function (el) { el.classList.remove('on'); });
      if (jumpers[highlightIndex - 1]) {
        jumpers[highlightIndex - 1].classList.add('on');
      }
    }

    var fixmeTop = module.offsetTop;
    window.addEventListener('scroll', function () {
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll >= fixmeTop) {
        module.style.top = '0';
        module.style.position = 'fixed';
        module.style.width = 'inherit';
      } else {
        module.style.position = 'inherit';
        module.style.width = 'inherit';
      }
      highlight();
    }, { passive: true });

    highlight();

    directory.addEventListener('click', function (e) {
      var link = e.target.closest('.jumper');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      history.replaceState(null, '', href);
    });
  });
})();
