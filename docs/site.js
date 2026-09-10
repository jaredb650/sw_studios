(() => {
  'use strict';
  const root = document.documentElement;
  const featured = document.querySelector('[data-end]');
  if (featured && Date.now() > Date.parse(featured.dataset.end)) {
    document.querySelector('#event-status').textContent = 'EVENTO ANTERIOR';
    document.querySelector('#ticket-link span').textContent = 'Ver publicación original';
    document.querySelector('#eventos h2').textContent = 'Último evento publicado';
  }
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const read = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { sessionStorage.setItem(key, value); } catch { /* Storage is optional. */ } };
  let paused = preference.matches || read('shipwreck-motion') === 'paused';
  const toggle = document.querySelector('.motion-toggle');
  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.masthead');
  const ribbon = document.querySelector('.type-ribbon');
  const about = document.querySelector('.about');
  const poster = document.querySelector('.poster');
  const culture = [...document.querySelectorAll('.culture-line')];
  const sections = [...document.querySelectorAll('main section[id]')];
  let frame = 0;
  let observer;
  let loader;
  let loaderEnded = false;
  let loaderTimer;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function finishLoader() {
    if (loaderEnded) return;
    loaderEnded = true;
    clearTimeout(loaderTimer);
    if (loader) {
      if (loader.contains(document.activeElement)) document.activeElement.blur();
      loader.classList.add('is-done');
      setTimeout(() => loader.remove(), 850);
    }
    save('shipwreck-intro', 'seen');
    if (!paused && window.scrollY < 100) {
      root.classList.add('intro-enter');
      setTimeout(() => { root.classList.remove('intro-enter'); requestUpdate(); }, 1500);
    }
  }

  function applyMotion() {
    root.classList.toggle('motion-paused', paused);
    root.classList.toggle('motion-enabled', !paused);
    if (toggle) {
      toggle.hidden = false;
      toggle.textContent = paused ? 'Activar animación' : 'Pausar animación';
      toggle.setAttribute('aria-pressed', String(paused));
    }
    if (paused) finishLoader();
    requestUpdate();
  }

  function update() {
    frame = 0;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const scrollable = root.scrollHeight - vh;
    root.style.setProperty('--scroll-progress', String(scrollable > 0 ? clamp(y / scrollable, 0, 1) : 0));
    nav?.classList.toggle('is-scrolled', y > 30);
    let current;
    for (const section of sections) if (section.getBoundingClientRect().top <= 150) current = section.id;
    document.querySelectorAll('nav a').forEach(link => {
      if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (paused || document.hidden) return;
    const hr = hero?.getBoundingClientRect();
    if (hr && hr.bottom > 0) {
      const progress = clamp(-hr.top / hr.height, 0, 1);
      hero.style.setProperty('--title-drift', `${progress * -28}px`);
      hero.style.setProperty('--emblem-y', `${progress * 70}px`);
      hero.style.setProperty('--emblem-turn', `${-7 + progress * 22}deg`);
    }
    const rr = ribbon?.getBoundingClientRect();
    if (rr && rr.top < vh && rr.bottom > 0) ribbon.style.setProperty('--ribbon-x', `${-50 - clamp((vh - rr.top) / (vh + rr.height), 0, 1) * 260}px`);
    const ar = about?.getBoundingClientRect();
    if (ar && ar.top < vh && ar.bottom > 0) {
      const progress = clamp((vh - ar.top) / (vh + ar.height), 0, 1);
      about.style.setProperty('--about-turn', `${-12 + progress * 24}deg`);
      culture.forEach((line, i) => line.style.setProperty('--culture-x', `${(progress - .5) * (i === 1 ? -30 : 24)}px`));
    }
    if (poster && window.innerWidth > 680) {
      const pr = featured.getBoundingClientRect();
      if (pr.top < vh && pr.bottom > 0) poster.style.setProperty('--poster-y', `${clamp((vh * .3 - pr.top) * .045, -14, 24)}px`);
    }
  }
  function requestUpdate() { if (!frame) frame = requestAnimationFrame(update); }

  // The preloader is absent without JS, skips repeat visits, and has a hard deadline.
  if (!paused && !read('shipwreck-intro') && !location.hash && window.scrollY < 100) {
    loader = document.createElement('div');
    loader.className = 'preloader';
    loader.innerHTML = '<div class="preloader-logo" aria-hidden="true"><span class="brand-mark"></span><span class="brand-mark loader-fill"></span></div><p class="loader-wordmark">SHIPWRECK STUDIOS_</p><div class="loader-bottom"><span>SAN JUAN, PUERTO RICO</span><span class="loader-state" role="status">Cargando</span><button class="loader-skip" type="button">Saltar intro ↗</button></div>';
    document.body.append(loader);
    loaderTimer = setTimeout(finishLoader, 2600);
    loader.querySelector('button').addEventListener('click', finishLoader);
    const skipKey = event => {
      if (event.key === 'Tab' || event.key === 'Escape') { finishLoader(); document.removeEventListener('keydown', skipKey); }
    };
    document.addEventListener('keydown', skipKey);
    const logo = new Image();
    logo.src = new URL('./assets/shipwreck-logo.png', document.baseURI).href;
    const decode = image => image?.decode ? image.decode() : Promise.resolve();
    const assets = [decode(logo), document.fonts?.ready || Promise.resolve(), decode(document.querySelector('.poster img'))];
    let ready = 0;
    const tracked = assets.map(asset => Promise.resolve(asset).catch(() => {}).then(() => {
      ready++;
      loader.style.setProperty('--load', `${ready / assets.length * 100}%`);
      if (ready === assets.length) loader.querySelector('.loader-state').textContent = 'Listo';
    }));
    Promise.all([Promise.all(tracked), new Promise(resolve => setTimeout(resolve, 1050))]).then(finishLoader);
  } else { loaderEnded = true; }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
    document.querySelectorAll('.section-heading, .event-info, .series, .about h2, .archive-row, .visit-info').forEach((element, i) => {
      element.setAttribute('data-reveal', '');
      element.style.setProperty('--reveal-delay', `${element.classList.contains('archive-row') ? i % 3 * 60 : 0}ms`);
      observer.observe(element);
    });
  }
  toggle?.addEventListener('click', () => { paused = !paused; save('shipwreck-motion', paused ? 'paused' : 'enabled'); applyMotion(); });
  preference.addEventListener('change', event => { paused = event.matches || read('shipwreck-motion') === 'paused'; applyMotion(); });
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('pageshow', event => { if (event.persisted) finishLoader(); requestUpdate(); });
  document.addEventListener('visibilitychange', requestUpdate);
  applyMotion();
})();
