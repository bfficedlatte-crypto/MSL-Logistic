/* Pointer-driven detail: trailing cursor ring and magnetic buttons.
   Progressive enhancement — nothing here is required for the page to work. */
(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || still) return;

  var dot = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');

  if (dot && ring) {
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my, shown = false;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      if (!shown) {
        shown = true;
        dot.classList.add('is-active');
        ring.classList.add('is-active');
      }
    }, { passive: true });

    (function follow() {
      // The ring lags the pointer slightly, which is what makes it feel alive.
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(follow);
    })();

    var targets = 'a, button, .row, .deck__card, .plate, .project-card, input, select, textarea';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(targets)) { ring.classList.add('is-hover'); dot.classList.add('is-hover'); }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(targets)) { ring.classList.remove('is-hover'); dot.classList.remove('is-hover'); }
    });

    document.addEventListener('mouseleave', function () {
      dot.classList.remove('is-active'); ring.classList.remove('is-active');
    });
  }

  // Buttons lean toward the pointer while it is near them.
  var PULL = 0.28, RADIUS = 90;
  document.querySelectorAll('.btn, .header__cta, .testimonials__btn').forEach(function (el) {
    el.style.willChange = 'transform';
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      if (Math.abs(dx) > RADIUS || Math.abs(dy) > RADIUS) return;
      el.style.transform = 'translate(' + (dx * PULL).toFixed(1) + 'px,' + (dy * PULL).toFixed(1) + 'px)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transition = 'transform .45s cubic-bezier(.22,.61,.36,1)';
      el.style.transform = '';
      setTimeout(function () { el.style.transition = ''; }, 460);
    });
  });
})();
