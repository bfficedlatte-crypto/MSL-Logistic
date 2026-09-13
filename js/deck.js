/* Services deck: cards recede as the next one covers them.
   Progressive enhancement — without this file the deck still stacks. */
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.deck__card'));
  if (!cards.length) return;

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fade each card in as it arrives, once.
  if ('IntersectionObserver' in window && !still) {
    cards.forEach(function (c) { c.style.opacity = '0'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.opacity = '1';
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }

  if (still) return;

  var SCALE = 0.06;   // how far a covered card shrinks
  var LIFT  = 16;     // how far it drifts up, in px
  var DIM   = 0.4;    // how much its content fades
  var ticking = false;

  function frame() {
    ticking = false;
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var next = cards[i + 1];
      var p = 0;

      if (next) {
        var rect = card.getBoundingClientRect();
        var gap = next.getBoundingClientRect().top - rect.top;
        // Spread the recede over more scrolling than the card's own height,
        // so it eases across a longer distance instead of finishing at once.
        var travel = Math.min(rect.height * 1.7, window.innerHeight * 0.95);
        p = 1 - Math.min(Math.max(gap / travel, 0), 1);
        p = p * p * (3 - 2 * p); // ease the ends so it never snaps
      }

      card.style.transform =
        'translate3d(0,' + (-LIFT * p).toFixed(2) + 'px,0) scale(' + (1 - SCALE * p).toFixed(4) + ')';

      var body = card.querySelector('.deck__body');
      if (body) body.style.opacity = (1 - DIM * p).toFixed(3);
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
