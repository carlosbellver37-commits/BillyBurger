/* Todas las animaciones. Sin GSAP o con movimiento reducido, la web queda estática y completa. */
(function (root) {
  'use strict';
  const NT = root.NT;
  const gsap = root.gsap;
  const ScrollTrigger = root.ScrollTrigger;
  // Decisión de diseño: los efectos van siempre activos, aunque el navegador (Safari, ahorro de batería, etc.)
  // pida "reducir movimiento". Solo se desactivan si GSAP no llega a cargar.
  const animated = Boolean(gsap && ScrollTrigger);
  const DESKTOP = '(min-width: 900px)';
  const TICKER_TEXT = ['Sencillamente delicioso', 'Pocitos', 'Prado', 'Punta Gorda', 'A domicilio o a recoger'];

  let lenis = null;

  function $$(selector, scope = document) { return gsap.utils.toArray(scope.querySelectorAll(selector)); }

  function buildTickers() {
    document.querySelectorAll('[data-ticker]').forEach((track) => {
      const items = Array.from({ length: 12 }, (_, i) => {
        const s = document.createElement('span');
        s.textContent = TICKER_TEXT[i % TICKER_TEXT.length];
        return s;
      });
      track.replaceChildren(...items);
      if (!animated) return;
      const dir = track.hasAttribute('data-reverse') ? 1 : -1;
      gsap.fromTo(track, { xPercent: dir > 0 ? -33.33 : 0 }, { xPercent: dir > 0 ? 0 : -33.33, duration: 26, ease: 'none', repeat: -1 });
    });
  }

  function initSmoothScroll() {
    // En pantallas táctiles el scroll nativo ya es fluido: Lenis solo añadiría trabajo por fotograma.
    if (!root.Lenis || root.matchMedia('(pointer: coarse)').matches) {
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a || a.getAttribute('href').length < 2) return;
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        root.scrollTo({ top: target.getBoundingClientRect().top + root.scrollY, behavior: 'smooth' });
      });
      return;
    }
    lenis = new root.Lenis({ lerp: 0.07, wheelMultiplier: 0.42, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    // Las escenas fijadas cambian la altura de la página: Lenis debe recalcular su límite de scroll.
    ScrollTrigger.addEventListener('refresh', () => lenis.resize());
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.start();
      lenis.scrollTo(target, { duration: 1.3, force: true });
    });
  }

  /* Intro: los ingredientes caen y se apilan. */
  function intro(onDone) {
    const layers = $$('.burger__layer');
    const metas = [...document.querySelector('.stage__meta').children];
    const count = document.querySelector('[data-loader-count]');
    const progress = { v: 0 };
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(progress, { v: 100, duration: 0.9, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(progress.v); } })
      .to('[data-loader]', { yPercent: -100, duration: 0.7, ease: 'expo.inOut', onComplete: () => document.querySelector('[data-loader]').classList.add('is-done') })
      .from('[data-title-a], [data-title-b]', { yPercent: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, '-=.35')
      // Caída continua y sin rebote: cada capa entra desde arriba con fundido y frena suave al asentarse.
      .from(layers, { y: () => -root.innerHeight * 0.75, rotation: () => gsap.utils.random(-5, 5), autoAlpha: 0, duration: 1.35, ease: 'power4.out', stagger: 0.12 }, '-=.9')
      .from(metas, { opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', stagger: 0.05 }, '-=.35')
      .from('.sticker--spin', { scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(1.8)' }, '-=.7')
      .from('.sticker--rate', { scale: 0, duration: 0.6, ease: 'back.out(2.4)' }, '-=.6');
  }

  function burgerParallax() {
    const burger = document.querySelector('[data-burger]');
    const stage = document.querySelector('[data-stage]');
    const xTo = gsap.quickTo(burger, 'rotationY', { duration: 0.8, ease: 'power3' });
    const rTo = gsap.quickTo(burger, 'rotation', { duration: 0.8, ease: 'power3' });
    gsap.set(stage, { perspective: 900 });
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const nx = e.clientX / root.innerWidth - 0.5;
      xTo(nx * 22);
      rTo(nx * 5);
    });
  }

  /* Despiece: fondo a rojo, capas separadas con etiquetas y vuelta a montar. */
  function stageTimeline(isDesktop) {
    const stage = document.querySelector('[data-stage]');
    const burger = document.querySelector('[data-burger]');
    const openScale = isDesktop ? 0.74 : 0.56;
    const openTop = isDesktop ? 54 : 52; // % de la altura de pantalla
    const gap = () => root.innerHeight * (isDesktop ? 0.1 : 0.085);
    const offsets = [2, 1, 0, -1, -2];
    const tilt = [-2.5, 2, -1.5, 2.5, -3];
    const layers = offsets.map((_, i) => document.querySelector(`[data-layer="${i}"]`));
    /* Altura en pantalla del centro de una capa ya separada, medida desde el centro de la pantalla. */
    const layerY = (i) => {
      const fromCentre = layers[i].offsetTop + layers[i].offsetHeight / 2 - burger.offsetHeight / 2;
      return (fromCentre + offsets[i] * gap()) * openScale + root.innerHeight * (openTop - 50) / 100;
    };

    const tl = gsap.timeline({
      scrollTrigger: { trigger: stage, start: 'top top', end: () => `+=${root.innerHeight * (isDesktop ? 4.2 : 3.2)}`, pin: true, scrub: isDesktop ? 0.6 : 0.35, anticipatePin: 1, invalidateOnRefresh: true },
    });
    tl.to('[data-hero-meta]', { autoAlpha: 0, duration: 0.5 }, 0)
      .to('[data-title-a]', { xPercent: -14, autoAlpha: 0.08, duration: 1 }, 0)
      .to('[data-title-b]', { xPercent: 14, autoAlpha: 0.08, duration: 1 }, 0)
      .to('[data-burger]', { scale: openScale, top: `${openTop}%`, duration: 1 }, 0);

    layers.forEach((layer, i) => tl.to(layer, { y: () => offsets[i] * gap(), rotation: tilt[i], ease: 'power2.inOut', duration: 1.2 }, 0.1));

    $$('[data-callout]').forEach((c) => {
      const i = Number(c.dataset.callout);
      gsap.set(c, { y: () => layerY(i) - c.offsetHeight / 2 });
      tl.fromTo(c, { autoAlpha: 0, x: c.classList.contains('callout--l') ? -40 : 40 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power2.out' }, 0.7 + (4 - i) * 0.2);
    });

    tl.to({}, { duration: 0.8 })
      .to('[data-callout]', { autoAlpha: 0, duration: 0.4 })
      .to(layers, { y: 0, rotation: 0, ease: 'power3.inOut', duration: 1 }, '<')
      .to(stage, { backgroundColor: '#0063C6', duration: 0.8 }, '<')
      .to('[data-burger]', { scale: isDesktop ? 0.55 : 0.5, top: isDesktop ? '74%' : '76%', duration: 1 }, '<')
      .fromTo('[data-stage-end]', { autoAlpha: 0, yPercent: -30 }, { autoAlpha: 1, yPercent: -75, duration: 0.8 }, '-=.6')
      .to({}, { duration: 0.5 });
  }

  /* Colección en horizontal sobre escritorio; en móvil es carrusel nativo. */
  function collectionScroll() {
    const track = document.querySelector('[data-collection-track]');
    const distance = () => track.scrollWidth - root.innerWidth;
    // Recorrido lento y con pausas: la colección se queda fija un rato al principio (se lee el título)
    // y otro al final (la inercia del scroll se gasta aquí y no se salta la carta).
    const travel = () => distance() * 1.8;
    const holdStart = () => root.innerHeight * 0.9;
    const holdEnd = () => root.innerHeight * 1.2;
    const pinST = ScrollTrigger.create({ trigger: '[data-collection]', start: 'top top', end: () => `+=${holdStart() + travel() + holdEnd()}`, pin: true, anticipatePin: 1, invalidateOnRefresh: true });
    const move = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: '[data-collection]', start: () => pinST.start + holdStart(), end: () => pinST.start + holdStart() + travel(), scrub: 0.9, invalidateOnRefresh: true },
    });
    $$('[data-panel-item]').forEach((panel) => {
      const anim = { trigger: panel, containerAnimation: move, start: 'left right', end: 'right left', scrub: true };
      gsap.fromTo(panel.querySelector('[data-panel-img]'), { rotation: -14, xPercent: 18, scale: 0.86 }, { rotation: 8, xPercent: -12, scale: 1.04, ease: 'none', scrollTrigger: anim });
      gsap.fromTo(panel.querySelector('.panel__ghost'), { xPercent: 12 }, { xPercent: -22, ease: 'none', scrollTrigger: anim });
    });
  }

  function reveals() {
    $$('[data-float]').forEach((n, i) => {
      gsap.fromTo(n, { rotation: i ? 9 : -9, yPercent: i ? 14 : -10 }, { rotation: i ? -6 : 7, yPercent: i ? -14 : 12, ease: 'none', scrollTrigger: { trigger: '.how', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
      gsap.to(n, { y: i ? -14 : 14, duration: 2.6 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
    $$('.how__n').forEach((n) => gsap.from(n, { scale: 0, rotation: -40, duration: 0.9, ease: 'back.out(2.2)', scrollTrigger: { trigger: n, start: 'top 90%', once: true } }));
    $$('[data-rise]').forEach((n) => gsap.from(n, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 88%', once: true } }));
    $$('.display--xl').forEach((n) => gsap.from(n, { yPercent: 18, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 90%', once: true } }));
    $$('[data-bleed-item]').forEach((n, i) => {
      const rot = [-8, 6, -5, 7][i % 4];
      gsap.fromTo(n, { yPercent: 14 + i * 5, rotation: rot - 7 }, { yPercent: -14 - i * 5, rotation: rot + 7, ease: 'none', scrollTrigger: { trigger: '[data-bleed]', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
    gsap.from('[data-bleed-text]', { xPercent: -8, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '[data-bleed]', start: 'top 55%', once: true } });
    gsap.fromTo('[data-parallax]', { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-parallax]', scrub: true } });
    gsap.from('.footer__big', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    counters();
  }

  function counters() {
    $$('[data-count]').forEach((n) => {
      const end = Number(n.dataset.count);
      const decimals = Number(n.dataset.decimals || 0);
      const state = { v: 0 };
      gsap.to(state, {
        v: end, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: n, start: 'top 90%', once: true },
        onUpdate: () => { n.textContent = state.v.toFixed(decimals).replace('.', ','); },
      });
    });
  }

  function navBehaviour() {
    const nav = document.querySelector('[data-nav]');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('is-hidden', self.direction === 1 && y > root.innerHeight * 4.2 && !nearOrder());
        nav.classList.toggle('is-solid', y > root.innerHeight * 4.2);
      },
    });
  }
  const nearOrder = () => Boolean(document.querySelector('dialog[open]'));

  function staggerIn(nodes) {
    if (!animated) return;
    gsap.fromTo(nodes, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.04, clearProps: 'transform,opacity', onComplete: () => ScrollTrigger.refresh() });
  }

  function bump(selector) {
    if (!animated) return;
    gsap.fromTo(selector, { scale: 1.2, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1, .45)', clearProps: 'transform' });
  }

  function setScrollLock(locked) {
    if (!lenis) return;
    if (locked) lenis.stop();
    else lenis.start();
  }

  function skipLoader() {
    document.querySelector('[data-loader]').classList.add('is-done');
    document.body.classList.remove('is-loading');
  }

  /* La entrada y las etiquetas del despiece miden las capas: se espera a que estén decodificadas y . */
  function whenHeroReady() {
    const decoded = Promise.all($$('.burger__layer').map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
    const timeout = new Promise((resolve) => setTimeout(resolve, 1500));
    return Promise.race([decoded, timeout]);
  }

  /* Durante la entrada la página aún no tiene las escenas fijadas: si se baja ahora, al crearlas el scroll queda a mitad
     de una escena y "se rompe". Se bloquea la rueda, el tacto y el teclado hasta que todo está listo. */
  const KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar']);
  const stopScroll = (e) => { if (e.type !== 'keydown' || KEYS.has(e.key)) e.preventDefault(); };
  function lockScroll() {
    document.documentElement.classList.add('is-locked');
    ['wheel', 'touchmove', 'keydown'].forEach((t) => root.addEventListener(t, stopScroll, { passive: false }));
  }
  function unlockScroll() {
    document.documentElement.classList.remove('is-locked');
    ['wheel', 'touchmove', 'keydown'].forEach((t) => root.removeEventListener(t, stopScroll));
  }

  function init() {
    buildTickers();
    if (!animated) {
      document.documentElement.classList.add('no-motion');
      skipLoader();
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    // La barra de direcciones del móvil cambia la altura al hacer scroll: sin esto cada cambio recalcula todas las escenas.
    ScrollTrigger.config({ ignoreMobileResize: true });
    root.history.scrollRestoration = 'manual';
    root.scrollTo(0, 0);
    lockScroll();
    initSmoothScroll();
    if (lenis) lenis.stop();
    burgerParallax();
    whenHeroReady().then(() => intro(startScrollScenes));
  }

  /* Se crean al terminar la entrada: así las animaciones de scroll leen los valores finales
     de cada elemento y no compiten con la entrada por el mismo título, capas o pegatinas. */
  function startScrollScenes() {
    // Si el navegador dejó bajar durante la entrada, se vuelve arriba antes de crear las escenas.
    root.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    gsap.matchMedia().add({ desktop: DESKTOP, mobile: '(max-width: 899px)' }, (ctx) => {
      stageTimeline(ctx.conditions.desktop);
      if (ctx.conditions.desktop) collectionScroll();
    });
    reveals();
    navBehaviour();
    document.body.classList.remove('is-loading');
    unlockScroll();
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
    keepScrollInSync();
    goToHash();
  }

  /* La carta y las fotos cargan imágenes en diferido y la página crece después del primer cálculo:
     sin recalcular, las escenas fijadas y el final de la página quedan desfasados. Se recalcula
     (con pausa) solo cuando la altura cambia de verdad, para no entrar en bucle con las escenas fijadas. */
  function keepScrollInSync() {
    let lastHeight = document.documentElement.scrollHeight;
    let timer = 0;
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const height = document.documentElement.scrollHeight;
        if (Math.abs(height - lastHeight) < 3) return;
        ScrollTrigger.refresh();
        lastHeight = document.documentElement.scrollHeight;
      }, 250);
    };
    if ('ResizeObserver' in root) new ResizeObserver(sync).observe(document.body);
    root.addEventListener('load', sync);
    document.fonts && document.fonts.ready.then(sync);
  }

  function goToHash() {
    const target = root.location.hash.length > 1 && document.querySelector(root.location.hash);
    if (target && lenis) lenis.scrollTo(target, { immediate: true, force: true });
    else if (target) target.scrollIntoView();
  }

  NT.motion = Object.freeze({ init, staggerIn, bump, setScrollLock });
})(globalThis);
