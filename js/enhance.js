/* Things the visitor can actually operate.
   Progressive enhancement: every page works without this file. */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Gallery: filter count, lightbox with arrows, keys and swipe ------ */

  var cards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));
  var filters = document.querySelector('.projects__filters');

  if (cards.length && filters) {
    var count = document.createElement('span');
    count.className = 'projects__count';
    filters.appendChild(count);

    var tally = function () {
      var shown = cards.filter(function (c) { return c.style.display !== 'none'; }).length;
      count.textContent = shown + (shown === 1 ? ' project' : ' projects');
    };
    tally();
    filters.addEventListener('click', function () { setTimeout(tally, 0); });
  }

  var modal = document.getElementById('projectModal');
  var body = document.getElementById('projectModalBody');

  if (modal && body && cards.length) {
    var at = 0;

    function visible() {
      return cards.filter(function (c) { return c.style.display !== 'none'; });
    }

    function render() {
      var list = visible();
      if (!list.length) return;
      at = (at + list.length) % list.length;
      var card = list[at];
      var img = card.querySelector('img');
      var o = card.querySelector('.project-card__overlay');

      body.innerHTML =
        '<div class="modal__figure"><img src="' + img.getAttribute('src') + '" alt="' + img.alt + '"></div>' +
        '<div>' + o.innerHTML.replace(/<button[\s\S]*?<\/button>/, '') + '</div>' +
        '<div class="modal__nav">' +
          '<button type="button" data-step="-1" aria-label="Previous project">&larr;</button>' +
          '<button type="button" data-step="1" aria-label="Next project">&rarr;</button>' +
          '<span>' + (at + 1) + ' of ' + list.length + '</span>' +
        '</div>';

      body.querySelectorAll('[data-step]').forEach(function (b) {
        b.addEventListener('click', function () { at += parseInt(b.dataset.step, 10); render(); });
      });
    }

    function open(card) {
      at = visible().indexOf(card);
      render();
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      var close = document.getElementById('projectModalClose');
      close && close.focus();
    }

    function shut() {
      modal.hidden = true;
      document.body.style.overflow = '';
    }

    cards.forEach(function (card) {
      var btn = card.querySelector('.project-card__btn');
      btn && btn.addEventListener('click', function (e) {
        e.stopImmediatePropagation();
        open(card);
      }, true);
    });

    ['projectModalClose', 'projectModalBackdrop'].forEach(function (id) {
      var el = document.getElementById(id);
      el && el.addEventListener('click', shut);
    });

    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') shut();
      if (e.key === 'ArrowRight') { at += 1; render(); }
      if (e.key === 'ArrowLeft') { at -= 1; render(); }
    });
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
