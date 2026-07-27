/**
 * Lazy-load Pagefind on first search interaction (Chinese-friendly static search).
 */
(function () {
  var input = document.getElementById('search_box');
  var button = document.getElementById('site_search_do');
  var resultsEl = document.getElementById('search_results');
  if (!input || !resultsEl) return;

  var pagefind = null;
  var loading = null;

  function basePath() {
    // Prefer absolute site root; pagefind lives at /pagefind/
    return '/pagefind/';
  }

  function loadPagefind() {
    if (pagefind) return Promise.resolve(pagefind);
    if (loading) return loading;
    loading = import(basePath() + 'pagefind.js').then(function (mod) {
      pagefind = mod;
      return pagefind;
    }).catch(function (err) {
      loading = null;
      resultsEl.innerHTML = '<li>搜索索引未生成（请先运行 pagefind）</li>';
      throw err;
    });
    return loading;
  }

  function renderResults(search) {
    if (!search || !search.results || !search.results.length) {
      resultsEl.innerHTML = '<li>未找到结果</li>';
      return;
    }

    var top = search.results.slice(0, 10);
    Promise.all(top.map(function (r) { return r.data(); })).then(function (rows) {
      resultsEl.innerHTML = rows.map(function (row) {
        var title = row.meta && row.meta.title ? row.meta.title : row.url;
        return '<li><a href="' + row.url + '">' + title + '</a></li>';
      }).join('');
    });
  }

  function runSearch() {
    var query = (input.value || '').trim();
    if (!query) {
      resultsEl.innerHTML = '';
      return;
    }
    resultsEl.innerHTML = '<li>搜索中…</li>';
    loadPagefind().then(function (pf) {
      return pf.search(query);
    }).then(renderResults).catch(function () {
      /* error already shown */
    });
  }

  function warm() {
    loadPagefind().catch(function () {});
  }

  input.addEventListener('focus', warm, { once: true });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch();
    }
  });
  if (button) {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      runSearch();
    });
  }
})();
