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
