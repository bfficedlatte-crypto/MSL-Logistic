/* Things the visitor can actually operate.
   Progressive enhancement: every page works without this file. */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Gallery: lightbox with thumbnails, swipe and shareable links ---- */

  var cards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));
  var filters = document.querySelector('.projects__filters');

  if (cards.length && filters && !filters.querySelector('.projects__count')) {
    var count = document.createElement('span');
    count.className = 'projects__count';
    count.textContent = cards.length + ' projects';
    filters.appendChild(count);
  }

  var modal = document.getElementById('projectModal');
  var body = document.getElementById('projectModalBody');

  if (modal && body && cards.length) {
    var at = 0;

    function visible() {
      return cards.filter(function (c) { return c.style.display !== 'none'; });
    }

    function detailsOf(card) {
      var img = card.querySelector('img');
      var o = card.querySelector('.project-card__overlay');
      var t = card.querySelector('.project-card__title');
      return {
        src: img ? img.getAttribute('src') : '',
        alt: img ? (img.alt || '') : '',
        title: t ? t.textContent : 'Project',
        html: o ? o.innerHTML.replace(/<button[\s\S]*?<\/button>/, '') : ''
      };
    }

    function render(swap) {
      var list = visible();
      if (!list.length) return;
      at = (at + list.length) % list.length;
      var d = detailsOf(list[at]);

      var thumbs = list.map(function (c, i) {
        var td = detailsOf(c);
        return '<button type="button" class="modal__thumb' + (i === at ? ' is-on' : '') +
               '" data-go="' + i + '" aria-label="' + td.title + '"' +
               (i === at ? ' aria-current="true"' : '') + '>' +
               (td.src ? '<img src="' + td.src + '" alt="" loading="lazy">' : '') + '</button>';
      }).join('');

      body.innerHTML =
        '<div class="modal__figure' + (swap ? ' is-swapping' : '') + '">' +
          (d.src ? '<img src="' + d.src + '" alt="' + d.alt + '" draggable="false">' : '') +
        '</div>' +
        '<div>' + d.html + '</div>' +
        '<div class="modal__nav">' +
          '<button type="button" data-step="-1" aria-label="Previous project">&larr;</button>' +
          '<button type="button" data-step="1" aria-label="Next project">&rarr;</button>' +
          '<span>' + (at + 1) + ' of ' + list.length + '</span>' +
        '</div>' +
        '<div class="modal__thumbs">' + thumbs + '</div>';

      var fig = body.querySelector('.modal__figure');
      if (swap) requestAnimationFrame(function () { fig.classList.remove('is-swapping'); });

      body.querySelectorAll('[data-step]').forEach(function (b) {
        b.addEventListener('click', function () { at += parseInt(b.dataset.step, 10); render(true); });
      });
      body.querySelectorAll('[data-go]').forEach(function (b) {
        b.addEventListener('click', function () { at = parseInt(b.dataset.go, 10); render(true); });
      });

      // Drag or swipe the picture to move through the set.
      var x0 = null;
      function down(x) { x0 = x; }
      function up(x) {
        if (x0 === null) return;
        var dx = x - x0; x0 = null;
        if (Math.abs(dx) > 50) { at += dx < 0 ? 1 : -1; render(true); }
      }
      fig.addEventListener('mousedown', function (e) { e.preventDefault(); down(e.clientX); });
      fig.addEventListener('mouseup', function (e) { up(e.clientX); });
      fig.addEventListener('touchstart', function (e) { down(e.touches[0].clientX); }, { passive: true });
      fig.addEventListener('touchend', function (e) { up(e.changedTouches[0].clientX); });

      if (history.replaceState) history.replaceState(null, '', '#p' + (at + 1));
    }

    function open(card) {
      at = visible().indexOf(card);
      render(false);
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      var close = document.getElementById('projectModalClose');
      if (close) close.focus();
    }

    function shut() {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (history.replaceState) history.replaceState(null, '', location.pathname);
    }

    cards.forEach(function (card) {
      var btn = card.querySelector('.project-card__btn');
      if (btn) btn.addEventListener('click', function (e) { e.stopImmediatePropagation(); open(card); }, true);
    });

    ['projectModalClose', 'projectModalBackdrop'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', shut);
    });

    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') shut();
      if (e.key === 'ArrowRight') { at += 1; render(true); }
      if (e.key === 'ArrowLeft') { at -= 1; render(true); }
    });

    // A link like gallery.html#p3 opens that project straight away.
    var hash = (location.hash || '').match(/^#p(\d+)$/);
    if (hash) {
      var idx = parseInt(hash[1], 10) - 1;
      var list0 = visible();
      if (list0[idx]) open(list0[idx]);
    }
  }

  /* --- Testimonials: drag, keys, autoplay that yields to the visitor ---- */

  var slider = document.getElementById('testimonialSlider');
  var track = document.getElementById('testimonialTrack');

  if (slider && track) {
    var n = track.children.length, i = 0, timer = null, x0 = null, dx = 0;

    function go(k) {
      i = (k + n) % n;
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      var dots = document.getElementById('testimonialDots');
      dots && Array.prototype.forEach.call(dots.children, function (d, j) {
        d.classList.toggle('active', j === i);
      });
    }

    function play() { if (!still) timer = setInterval(function () { go(i + 1); }, 6500); }
    function stop() { clearInterval(timer); }

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', play);
    slider.addEventListener('focusin', stop);

    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { stop(); go(i + 1); }
      if (e.key === 'ArrowLeft') { stop(); go(i - 1); }
    });

    function down(x) { x0 = x; dx = 0; stop(); slider.classList.add('is-dragging'); }
    function move(x) {
      if (x0 === null) return;
      dx = x - x0;
      track.style.transform = 'translateX(calc(' + (-100 * i) + '% + ' + dx + 'px))';
    }
    function up() {
      if (x0 === null) return;
      slider.classList.remove('is-dragging');
      if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1)); else go(i);
      x0 = null;
      play();
    }

    slider.addEventListener('mousedown', function (e) { e.preventDefault(); down(e.clientX); });
    window.addEventListener('mousemove', function (e) { move(e.clientX); });
    window.addEventListener('mouseup', up);
    slider.addEventListener('touchstart', function (e) { down(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchmove', function (e) { move(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchend', up);

    go(0);
    play();
  }

  /* --- Contact form: checks as you type, not only on submit ------------- */

  var form = document.getElementById('contactForm');

  if (form) {
    var rules = {
      name: function (v) { return v.trim().length >= 2 || 'Enter your full name'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address'; },
      phone: function (v) { return !v || v.replace(/\D/g, '').length >= 7 || 'Enter a valid phone number'; },
      service: function (v) { return !!v || 'Choose a service'; },
      message: function (v) { return v.trim().length >= 10 || 'Tell us a little more, 10 characters or more'; }
    };

    function check(field, quiet) {
      var rule = rules[field.name];
      if (!rule) return true;
      var group = field.closest('.form__group');
      var slot = group && group.querySelector('.form__error');
      var res = rule(field.value);
      var ok = res === true;
      if (group) {
        group.classList.toggle('is-invalid', !ok && !quiet);
        group.classList.toggle('is-valid', ok && field.value !== '');
      }
      if (slot) slot.textContent = ok || quiet ? '' : res;
      return ok;
    }

    var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { check(f); });
      f.addEventListener('input', function () { check(f, !f.closest('.form__group').classList.contains('is-invalid')); });
      f.addEventListener('change', function () { check(f); });
    });

    var msg = form.querySelector('#message');
    if (msg) {
      var counter = document.createElement('span');
      counter.className = 'form__count';
      msg.closest('.form__group').appendChild(counter);
      var tick = function () { counter.textContent = msg.value.length + ' characters'; };
      msg.addEventListener('input', tick);
      tick();
    }

    form.addEventListener('submit', function (e) {
      var bad = fields.filter(function (f) { return !check(f); });
      if (bad.length) {
        e.preventDefault();
        e.stopImmediatePropagation();
        bad[0].focus();
      }
    }, true);
  }

  /* --- Contact details: click to copy ----------------------------------- */

  var flag = null;
  document.querySelectorAll('.contact__item a[href^="mailto:"], .contact__item a[href^="tel:"]').forEach(function (a) {
    a.classList.add('copy-btn');
    a.addEventListener('click', function (e) {
      if (!navigator.clipboard) return;
      e.preventDefault();
      navigator.clipboard.writeText(a.textContent.trim()).then(function () {
        if (!flag) {
          flag = document.createElement('div');
          flag.className = 'copy-flag';
          document.body.appendChild(flag);
        }
        var r = a.getBoundingClientRect();
        flag.textContent = 'Copied';
        flag.style.left = r.left + 'px';
        flag.style.top = (r.top - 28) + 'px';
        flag.classList.add('is-on');
        setTimeout(function () { flag.classList.remove('is-on'); }, 1400);
      });
    });
  });

  /* --- Deck: the image drifts against the pointer ----------------------- */

  if (!still && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.deck__card').forEach(function (card) {
      var img = card.querySelector('.deck__media img');
      if (!img) return;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = 'scale(1.06) translate(' + (-px * 14).toFixed(1) + 'px,' + (-py * 14).toFixed(1) + 'px)';
      });
      card.addEventListener('mouseleave', function () { img.style.transform = ''; });
    });
  }
})();

/* Coverage map: province shapes and the list drive each other. */
(function () {
  var svg = document.querySelector('.cover__map svg');
  var panel = document.querySelector('.cover__panel');
  if (!svg || !panel) return;

  var readNum = panel.querySelector('.cover__readout-num');
  var readLabel = panel.querySelector('.cover__readout-label');
  var rows = Array.prototype.slice.call(panel.querySelectorAll('.cover__row'));
  var shapes = Array.prototype.slice.call(svg.querySelectorAll('.prov'));
  var pins = Array.prototype.slice.call(svg.querySelectorAll('.cover__pin'));
  var locked = null;

  function show(key) {
    shapes.forEach(function (s) { s.classList.toggle('is-on', s.dataset.prov === key); });
    pins.forEach(function (n) { n.classList.toggle('is-on', n.dataset.prov === key); });
    rows.forEach(function (r) { r.classList.toggle('is-on', r.dataset.prov === key); });
    var row = rows.filter(function (r) { return r.dataset.prov === key; })[0];
    if (row) {
      readNum.textContent = row.querySelector('.cover__num').textContent;
      readLabel.textContent = 'districts in ' + row.querySelector('.cover__name').textContent +
                              ', capital ' + row.querySelector('.cover__hq').textContent;
    }
  }

  function reset() {
    if (locked) { show(locked); return; }
    shapes.forEach(function (s) { s.classList.remove('is-on'); });
    pins.forEach(function (n) { n.classList.remove('is-on'); });
    rows.forEach(function (r) { r.classList.remove('is-on'); });
    readNum.textContent = '77';
    readLabel.textContent = 'districts across 7 provinces';
  }

  function wire(el) {
    var key = el.dataset.prov;
    el.addEventListener('mouseenter', function () { show(key); });
    el.addEventListener('focus', function () { show(key); });
    el.addEventListener('mouseleave', reset);
    el.addEventListener('blur', reset);
    el.addEventListener('click', function () {
      locked = locked === key ? null : key;
      locked ? show(key) : reset();
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  }

  shapes.forEach(function (s) { if (s.dataset.prov) wire(s); });
  rows.forEach(wire);
})();

/* Hero typewriter: cycles the audiences the company moves for. */
(function () {
  var line = document.getElementById('typeLine');
  if (!line) return;

  var slot = line.querySelector('.type-line__text');
  var words = (line.dataset.words || '').split('|').filter(Boolean);
  if (!words.length || !slot) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    slot.textContent = words.join(', ');
    return;
  }

  var TYPE = 62, ERASE = 34, HOLD = 1700, GAP = 420;
  var w = 0, c = 0, erasing = false;

  slot.textContent = '';

  (function tick() {
    var word = words[w];
    if (!erasing) {
      c++;
      slot.textContent = word.slice(0, c);
      if (c === word.length) { erasing = true; return setTimeout(tick, HOLD); }
      return setTimeout(tick, TYPE + Math.random() * 45);
    }
    c--;
    slot.textContent = word.slice(0, c);
    if (c === 0) {
      erasing = false;
      w = (w + 1) % words.length;
      return setTimeout(tick, GAP);
    }
    setTimeout(tick, ERASE);
  })();
})();

/* Process rail: the consignment marker advances as you scroll the section. */
(function () {
  var body = document.querySelector('.track__body');
  if (!body) return;

  var steps = Array.prototype.slice.call(body.querySelectorAll('.track__step'));
  var fill = document.getElementById('trackFill');
  var pip = document.getElementById('trackPip');
  var rail = body.querySelector('.track__rail');
  if (!steps.length || !fill || !rail) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    steps.forEach(function (s) { s.classList.add('is-on'); });
    fill.style.height = '100%';
    return;
  }

  var ticking = false;

  function frame() {
    ticking = false;
    var box = body.getBoundingClientRect();
    if (box.bottom < 0 || box.top > window.innerHeight) return;
    var mark = window.innerHeight * 0.62;   // the line a step must cross to count
    var railTop = rail.getBoundingClientRect().top;
    var reached = -1;

    steps.forEach(function (step, i) {
      var r = step.getBoundingClientRect();
      var on = r.top < mark;
      step.classList.toggle('is-on', on);
      if (on) reached = i;
    });

    if (reached < 0) {
      fill.style.height = '0px';
      pip && pip.classList.remove('is-on');
      return;
    }

    var last = steps[reached].getBoundingClientRect();
    var y = Math.max(0, last.top + last.height / 2 - railTop);
    fill.style.height = Math.min(y, rail.offsetHeight) + 'px';
    if (pip) {
      pip.style.top = Math.min(y, rail.offsetHeight) + 'px';
      pip.classList.add('is-on');
    }
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }, { passive: true });
  window.addEventListener('resize', frame);
  frame();
})();

/* CEO message: the quote lights up word by word as it comes into view. */
(function () {
  var card = document.querySelector('.ceo__card');
  if (!card) return;

  var quote = card.querySelector('.ceo__quote');
  if (!quote) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    card.classList.add('is-on');
    return;
  }

  // Wrap each word so it can be timed, leaving the sentence intact for readers.
  var words = quote.textContent.trim().split(/\s+/);
  quote.textContent = '';
  words.forEach(function (word, i) {
    var span = document.createElement('span');
    span.className = 'w';
    span.style.setProperty('--i', i);
    span.textContent = word;
    quote.appendChild(span);
    if (i < words.length - 1) quote.appendChild(document.createTextNode(' '));
  });
  quote.classList.add('is-split');
  card.classList.add('is-armed');

  if (!('IntersectionObserver' in window)) {
    card.classList.add('is-on');
    quote.classList.add('is-on');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      card.classList.add('is-on');
      quote.classList.add('is-on');
      io.disconnect();
    });
  }, { threshold: 0.3 });

  io.observe(card);
})();

/* About: the three cards arrive one after another and ink their icons in. */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.pillar'));
  if (!cards.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)) {
    cards.forEach(function (c) { c.classList.add('is-on'); });
    return;
  }

  cards.forEach(function (c) { c.classList.add('is-armed'); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-on');
      io.unobserve(e.target);
    });
  }, { threshold: 0.25 });

  cards.forEach(function (c) { io.observe(c); });
})();

/* About cards: open for detail, and lean slightly toward the pointer. */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.pillar'));
  if (!cards.length) return;

  cards.forEach(function (card) {
    var toggle = card.querySelector('.pillar__toggle');
    var panel = card.querySelector('.pillar__panel');
    if (!toggle || !panel) return;

    panel.removeAttribute('hidden');
    panel.style.height = '0px';
    panel.style.transition = 'height .4s cubic-bezier(.22,.61,.36,1)';

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      card.classList.toggle('is-open', !open);
      toggle.querySelector('.pillar__toggle-text').textContent = open ? 'Details' : 'Close';
      panel.style.height = open ? '0px' : panel.scrollHeight + 'px';
    });

    window.addEventListener('resize', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') panel.style.height = panel.scrollHeight + 'px';
    });
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  cards.forEach(function (card) {
    var box = null, queued = false, rx = 0, ry = 0;

    card.addEventListener('mouseenter', function () { box = card.getBoundingClientRect(); }, { passive: true });

    card.addEventListener('mousemove', function (e) {
      if (!box) return;
      ry = ((e.clientX - box.left) / box.width - 0.5) * 5;   // degrees
      rx = ((e.clientY - box.top) / box.height - 0.5) * -5;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        card.style.transform =
          'perspective(800px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
      });
    }, { passive: true });

    card.addEventListener('mouseleave', function () {
      box = null;
      card.style.transform = '';
    }, { passive: true });
  });
})();

/* Headline figures count up when they scroll into view. */
(function () {
  var nums = Array.prototype.slice.call(document.querySelectorAll('.stats__number[data-target]'));
  if (!nums.length) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function run(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    if (still || !window.requestAnimationFrame) { el.textContent = target + suffix; return; }

    var start = null, dur = 1300;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    nums.forEach(run);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      run(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -5% 0px' });

  nums.forEach(function (n) { io.observe(n); });

  // Safety net: if nothing has fired after two seconds, show the numbers anyway.
  setTimeout(function () {
    nums.forEach(function (n) { if (n.textContent.trim() === '0') { run(n); io.unobserve(n); } });
  }, 2000);
})();

/* Gallery: staggered arrival, animated filtering, click anywhere to open. */
(function () {
  var grid = document.getElementById('projectsGrid');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('.projects__filter'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A magnifier badge, and the whole image opens the lightbox.
  cards.forEach(function (card) {
    var frame = card.querySelector('.project-card__image');
    var btn = card.querySelector('.project-card__btn');
    if (!frame || !btn) return;

    var zoom = document.createElement('span');
    zoom.className = 'project-card__zoom';
    zoom.setAttribute('aria-hidden', 'true');
    zoom.textContent = '+';
    frame.appendChild(zoom);

    frame.setAttribute('tabindex', '0');
    frame.setAttribute('role', 'button');
    var titleEl = card.querySelector('.project-card__title');
    frame.setAttribute('aria-label', 'Open ' + (titleEl ? titleEl.textContent : 'project') + ' details');
    frame.addEventListener('click', function () { btn.click(); });
    frame.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

  if (still) { cards.forEach(function (c) { c.classList.add('is-in'); }); }
  else {
    document.documentElement.classList.add('js-gal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = cards.indexOf(e.target);
          e.target.style.transitionDelay = (Math.max(i, 0) % 3) * 110 + 'ms';
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
      cards.forEach(function (c) { io.observe(c); });
    } else {
      cards.forEach(function (c) { c.classList.add('is-in'); });
    }
  }

  // Take over filtering so cards fade out and back in rather than snapping.
  filters.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopImmediatePropagation();

      filters.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      var want = btn.getAttribute('data-filter');
      var keep = cards.filter(function (c) {
        return want === 'all' || (c.getAttribute('data-category') || '').indexOf(want) > -1;
      });

      cards.forEach(function (c) {
        if (keep.indexOf(c) > -1) return;
        c.classList.add('is-out');
        setTimeout(function () { if (c.classList.contains('is-out')) c.style.display = 'none'; }, still ? 0 : 300);
      });

      keep.forEach(function (c, i) {
        c.style.display = '';
        c.classList.remove('is-out');
        c.style.transitionDelay = still ? '0ms' : (i % 3) * 90 + 'ms';
        c.classList.add('is-in');
      });

      var count = document.querySelector('.projects__count');
      if (count) count.textContent = keep.length + (keep.length === 1 ? ' project' : ' projects');
    }, true);
  });
})();

/* Services: search, tag filters, view switch and an enquiry basket. */
(function () {
  var list = document.getElementById('svcList');
  if (!list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.deck__card'));
  var search = document.getElementById('svcSearch');
  var tagWrap = document.getElementById('svcTags');
  var countEl = document.getElementById('svcCount');
  var viewBtn = document.getElementById('svcView');
  var bar = document.getElementById('svcBar');
  var barCount = document.getElementById('svcBarCount');
  var clearBtn = document.getElementById('svcClear');
  var goLink = document.getElementById('svcGo');

  var picked = [];
  var activeTag = null;

  /* Build the tag filters from the cards themselves. */
  var seen = [];
  cards.forEach(function (c) {
    (c.getAttribute('data-tags') || '').split('|').forEach(function (t) {
      if (t && seen.indexOf(t) === -1) seen.push(t);
    });
  });

  if (tagWrap) {
    seen.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tools__tag';
      b.textContent = t;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        activeTag = activeTag === t ? null : t;
        Array.prototype.forEach.call(tagWrap.children, function (x) {
          var on = x.textContent === activeTag;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', String(on));
        });
        apply();
      });
      tagWrap.appendChild(b);
    });
  }

  var empty = document.createElement('p');
  empty.className = 'svc-empty';
  empty.hidden = true;
  empty.textContent = 'No services match that. Try another word, or clear the filter.';
  list.parentNode.insertBefore(empty, list.nextSibling);

  function apply() {
    var q = (search && search.value || '').trim().toLowerCase();
    var shown = 0;

    cards.forEach(function (c) {
      var hay = (c.getAttribute('data-name') + ' ' + c.getAttribute('data-tags') + ' ' +
                 (c.querySelector('.deck__desc') || {}).textContent).toLowerCase();
      var okText = !q || hay.indexOf(q) > -1;
      var okTag = !activeTag || (c.getAttribute('data-tags') || '').split('|').indexOf(activeTag) > -1;
      var on = okText && okTag;
      c.classList.toggle('is-hidden', !on);
      if (on) shown++;
    });

    if (countEl) countEl.textContent = shown + (shown === 1 ? ' service' : ' services');
    empty.hidden = shown !== 0;
  }

  if (search) search.addEventListener('input', apply);

  if (viewBtn) {
    viewBtn.addEventListener('click', function () {
      var grid = list.classList.toggle('deck__list--grid');
      viewBtn.setAttribute('aria-pressed', String(grid));
      viewBtn.textContent = grid ? 'List view' : 'Grid view';
    });
  }

  /* Basket: pick services, then carry them into the enquiry form. */
  function refreshBar() {
    if (!bar) return;
    if (barCount) barCount.textContent = picked.length + (picked.length === 1 ? ' service selected' : ' services selected');
    bar.classList.toggle('is-up', picked.length > 0);
    if (goLink) {
      goLink.href = picked.length
        ? 'contact.html?services=' + encodeURIComponent(picked.join(', ')) + '#contactForm'
        : 'contact.html#contactForm';
    }
  }

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.deck__pick');
    if (!btn) return;
    var name = btn.getAttribute('data-service');
    var card = btn.closest('.deck__card');
    var on = picked.indexOf(name) === -1;

    if (on) picked.push(name);
    else picked.splice(picked.indexOf(name), 1);

    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('.deck__pick-text').textContent = on ? 'Added' : 'Add to enquiry';
    if (card) card.classList.toggle('is-picked', on);
    refreshBar();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      picked = [];
      cards.forEach(function (c) {
        c.classList.remove('is-picked');
        var b = c.querySelector('.deck__pick');
        if (b) { b.setAttribute('aria-pressed', 'false'); b.querySelector('.deck__pick-text').textContent = 'Add to enquiry'; }
      });
      refreshBar();
    });
  }

  apply();
  refreshBar();
})();

/* Contact form picks up services chosen on the services page. */
(function () {
  var form = document.getElementById('contactForm');
  if (!form || !location.search) return;

  var m = location.search.match(/[?&]services=([^&]+)/);
  if (!m) return;

  var names = decodeURIComponent(m[1].replace(/\+/g, ' '));
  var msg = form.querySelector('#message');
  var select = form.querySelector('#service');

  if (msg && !msg.value) {
    msg.value = 'I would like a quote for: ' + names + '.\n\n';
    msg.dispatchEvent(new Event('input'));
  }

  if (select) {
    var first = names.split(',')[0].trim().toLowerCase();
    Array.prototype.forEach.call(select.options, function (o) {
      if (o.value && first.indexOf(o.textContent.trim().toLowerCase().split(' ')[0]) > -1) {
        select.value = o.value;
      }
    });
  }
})();
