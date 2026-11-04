/* BioHack motion layer — только анимации.
   Ничего не меняет в разметке, тексте, цветах и вёрстке: добавляет плавное появление
   элементов главной/каталога, мягкое парение иллюстрации и появление шапки.
   Уважает системную настройку «уменьшить движение». Безопасно подключать повторно. */
(function () {
  if (window.__bhMotion) return;
  if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) return;

  var host = document.getElementById('tab-directory');
  if (!host) return;
  window.__bhMotion = true;

  var EASE = 'cubic-bezier(.22,.8,.24,1)';
  var css = [
    '@keyframes bhm-float{0%,100%{translate:0 0}50%{translate:0 -7px}}',
    '@keyframes bhm-drop{from{opacity:0;translate:0 -14px}to{opacity:1;translate:0 0}}',
    /* исходное состояние: скрыто, без transition (чтобы не было «мигания») */
    'html.bhm [data-bhm]{opacity:0;transform:translate3d(0,22px,0);transition:none!important}',
    'html.bhm .shell-title-line[data-bhm]{transform:translate3d(0,.45em,0)}',
    /* появление */
    'html.bhm [data-bhm].bhm-in{opacity:1;transform:none;will-change:opacity,transform;',
    'transition:opacity .7s ' + EASE + ' var(--bhm-d,0ms),transform .7s ' + EASE + ' var(--bhm-d,0ms)!important}',
    /* живая трансляция и панель урока всегда показываем как есть */
    '#live-mirror [data-bhm],#live-panel [data-bhm]{opacity:1!important;transform:none!important}',
    /* шапка и иллюстрация */
    'html.bhm .bio-shell-header{animation:bhm-drop .6s ' + EASE + ' both}',
    'html.bhm #directory-content .shell-game-preview-art img{animation:bhm-float 7s ease-in-out infinite}'
  ].join('');

  var st = document.createElement('style');
  st.id = 'bh-motion-style';
  st.textContent = '@media (prefers-reduced-motion: no-preference){' + css + '}';
  document.head.appendChild(st);
  document.documentElement.classList.add('bhm');

  var SEL = [
    '.shell-home-intro .shell-eyebrow',
    '.shell-home-intro .shell-title-line',
    '.shell-home-intro .shell-lead',
    '.shell-home-intro .shell-stats > span',
    '.shell-home-intro .shell-game-preview',
    '.shell-catalog-heading',
    '.shell-course-card',
    '.shell-topic'
  ].join(',');

  var io = new IntersectionObserver(function (entries) {
    var vis = entries.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) {
      var A = a.boundingClientRect, B = b.boundingClientRect;
      return (A.top - B.top) || (A.left - B.left);
    });
    vis.forEach(function (e, i) {
      var el = e.target, d = Math.min(i * 70, 420);
      io.unobserve(el);
      el.style.setProperty('--bhm-d', d + 'ms');
      requestAnimationFrame(function () { el.classList.add('bhm-in'); });
      /* после показа возвращаем элемент сайту — его собственные hover-эффекты работают как раньше */
      setTimeout(function () {
        el.removeAttribute('data-bhm');
        el.classList.remove('bhm-in');
        el.style.removeProperty('--bhm-d');
      }, 1300 + d);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  function scan() {
    var nodes = host.querySelectorAll(SEL);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.__bhm) continue;
      el.__bhm = 1;
      el.setAttribute('data-bhm', '');
      io.observe(el);
    }
  }

  scan();
  new MutationObserver(scan).observe(host, { childList: true, subtree: true });
})();
