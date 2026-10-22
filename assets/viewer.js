// 플립북 뷰어 — 각 책 페이지의 <body data-*> 설정을 읽어 StPageFlip으로 띄웁니다.
//   data-dir   : 페이지 이미지 폴더 (p01.jpg, p02.jpg …)
//   data-pages : 전체 쪽수
//   data-w/h   : 페이지 원본 비율
//   data-mode  : spread(펼침면, 세로형 책) | single(한 쪽씩, 가로형 슬라이드)
(function () {
  var cfg = document.body.dataset;
  var total = +cfg.pages;
  var single = cfg.mode === 'single';
  var bookEl = document.getElementById('book');

  for (var i = 1; i <= total; i++) {
    var page = document.createElement('div');
    page.className = 'page';
    if (!single && (i === 1 || i === total)) page.dataset.density = 'hard';
    var img = document.createElement('img');
    img.src = cfg.dir + '/p' + String(i).padStart(2, '0') + '.jpg';
    img.alt = i + '쪽';
    img.draggable = false;
    page.appendChild(img);
    bookEl.appendChild(page);
  }

  // 라이브러리는 너비로 높이를 정하므로, 화면 높이에 맞도록 책 너비를 직접 계산합니다.
  var wrap = document.querySelector('.book-wrap');
  var fit = document.querySelector('.fit');
  var ratio = +cfg.w / +cfg.h;
  var SPREAD_MIN = 520; // 이보다 좁으면 한 쪽씩 보기
  function fitBook() {
    var W = wrap.clientWidth, H = wrap.clientHeight;
    var w = single ? Math.min(W, H * ratio) : Math.min(W, H * ratio * 2);
    if (!single && w < SPREAD_MIN) w = Math.min(W, H * ratio);
    fit.style.width = Math.floor(w) + 'px';
  }
  fitBook();
  window.addEventListener('resize', fitBook);

  // 주소 끝에 #5 처럼 쪽수를 붙이면 해당 쪽부터 열립니다.
  var start = Math.min(Math.max(parseInt(location.hash.slice(1), 10) || 1, 1), total) - 1;

  var pf = new St.PageFlip(bookEl, {
    width: +cfg.w,
    height: +cfg.h,
    size: 'stretch',
    // single 모드는 minWidth를 크게 잡아 항상 한 쪽씩 보이게 합니다.
    minWidth: single ? 100000 : SPREAD_MIN / 2,
    maxWidth: single ? 1400 : 720,
    minHeight: 200,
    maxHeight: 2400,
    showCover: !single,
    usePortrait: true,
    startPage: start,
    flippingTime: 750,
    maxShadowOpacity: 0.45,
    mobileScrollSupport: false
  });
  pf.loadFromHTML(bookEl.querySelectorAll('.page'));
  bookEl.style.minWidth = '0'; // single 모드용 큰 minWidth가 화면을 밀어내지 않도록

  var pg = document.getElementById('pg');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');

  function update() {
    var idx = pf.getCurrentPageIndex();
    var label = String(idx + 1);
    if (pf.getOrientation() === 'landscape' && idx > 0 && idx < total - 1) {
      var left = idx % 2 === 1 ? idx : idx - 1; // 표지 단독 → 이후 (2,3) (4,5) …
      label = (left + 1) + '–' + (left + 2);
    }
    pg.textContent = label + ' / ' + total;
    prev.disabled = idx === 0;
    next.disabled = idx >= total - 1 || (pf.getOrientation() === 'landscape' && idx >= total - 2 && idx % 2 === 1);
    history.replaceState(null, '', '#' + (idx + 1));
  }

  pf.on('init', update);
  pf.on('flip', update);
  pf.on('changeOrientation', update);
  prev.addEventListener('click', function () { pf.flipPrev(); });
  next.addEventListener('click', function () { pf.flipNext(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') pf.flipPrev();
    if (e.key === 'ArrowRight') pf.flipNext();
  });

  var fs = document.getElementById('fs');
  if (fs) fs.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });

  var loading = document.querySelector('.loading');
  if (loading) loading.remove();
})();
