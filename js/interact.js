/* Pointer detail: trailing cursor ring and magnetic buttons.
   Rects are cached on enter and the loop sleeps when nothing is moving. */
(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || still) return;

  var dot = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');

  if (dot && ring) {
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    var running = false, shown = false;

    function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      // Stop the loop once the ring has caught up; a mousemove wakes it again.
      if (Math.abs(mx - rx) < 0.4 && Math.abs(my - ry) < 0.4) { running = false; return; }
      requestAnimationFrame(follow);
    }

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      if (!shown) { shown = true; dot.classList.add('is-active'); ring.classList.add('is-active'); }
      if (!running) { running = true; requestAnimationFrame(follow); }
    }, { passive: true });

    var targets = 'a, button, .row, .deck__card, .plate, .project-card, input, select, textarea';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(targets)) { ring.classList.add('is-hover'); dot.classList.add('is-hover'); }
    }, { passive: true });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(targets)) { ring.classList.remove('is-hover'); dot.classList.remove('is-hover'); }
    }, { passive: true });
  }

  /* Magnetic buttons: one rect read per enter, one transform write per frame. */
  var PULL = 0.28;
  document.querySelectorAll('.btn, .header__cta, .testimonials__btn').forEach(function (el) {
    var box = null, queued = false, tx = 0, ty = 0;

    el.addEventListener('mouseenter', function () {
      box = el.getBoundingClientRect();
      el.style.willChange = 'transform';
    }, { passive: true });

    el.addEventListener('mousemove', function (e) {
      if (!box) return;
      tx = (e.clientX - (box.left + box.width / 2)) * PULL;
      ty = (e.clientY - (box.top + box.height / 2)) * PULL;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        el.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
      });
    }, { passive: true });

    el.addEventListener('mouseleave', function () {
      box = null;
      el.style.transition = 'transform .45s cubic-bezier(.22,.61,.36,1)';
      el.style.transform = '';
      setTimeout(function () { el.style.transition = ''; el.style.willChange = ''; }, 460);
    }, { passive: true });
  });
})();
