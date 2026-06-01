/* ==========================================================================
   SAARLOOS VASTGOED B.V. — script.js
   - Laadt header/footer via fetch()
   - Hamburgermenu (readyState-patroon, Escape, body.menu-open)
   - Projectfilter + dynamisch laden van projecten.json
   - Lightbox-galerij
   - Reveal-animaties + formulierafhandeling (Formspree)
   ========================================================================== */

/* Basispad: root-pagina's = "", pagina's in /projecten/ subfolder = "../".
   Wordt per pagina gezet via window.BASE vóór dit script wordt geladen. */
var BASE = (typeof window !== 'undefined' && window.BASE) ? window.BASE : '';

/* ----------------------------------------------------------------------
   Init-patroon — gebruik ALTIJD readyState-check (defer + DOMContentLoaded
   kan een race veroorzaken).
   ---------------------------------------------------------------------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

function boot() {
  loadComponents().then(function () {
    initMenu();
    markActiveNav();
    setFooterYear();
  });
  initReveal();
  initProjects();
  initDetailPage();
  initLightbox();
  initContactForm();
}

/* ----------------------------------------------------------------------
   1. Header & footer laden via fetch()
   ---------------------------------------------------------------------- */
function loadComponents() {
  var jobs = [];
  var header = document.getElementById('header-placeholder');
  var footer = document.getElementById('footer-placeholder');

  if (header) jobs.push(inject(header, BASE + 'components/header.html'));
  if (footer) jobs.push(inject(footer, BASE + 'components/footer.html'));

  return Promise.all(jobs);
}

function inject(el, url) {
  return fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error('Kon ' + url + ' niet laden');
      return r.text();
    })
    .then(function (html) {
      el.innerHTML = html;
      if (BASE) rewriteLinks(el);
    })
    .catch(function (err) { console.error(err); });
}

/* Past relatieve links/bronnen aan voor pagina's in een subfolder. */
function rewriteLinks(scope) {
  var nodes = scope.querySelectorAll('[href], [src]');
  nodes.forEach(function (node) {
    ['href', 'src'].forEach(function (attr) {
      if (!node.hasAttribute(attr)) return;
      var val = node.getAttribute(attr);
      if (/^(https?:|#|tel:|mailto:|\/|data:)/.test(val)) return;
      node.setAttribute(attr, BASE + val);
    });
  });
}

/* ----------------------------------------------------------------------
   2. Hamburgermenu
   ---------------------------------------------------------------------- */
function initMenu() {
  var toggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (!toggle || !mobileMenu) return;

  var menuLinks = mobileMenu.querySelectorAll('a');
  var whatsappFloat = document.querySelector('.whatsapp-float');

  function openMenu() {
    mobileMenu.classList.add('open');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Menu sluiten');
    if (whatsappFloat) whatsappFloat.style.display = 'none';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menu openen');
    if (whatsappFloat) whatsappFloat.style.display = 'flex';
  }

  toggle.addEventListener('click', function () {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  menuLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
}

/* ----------------------------------------------------------------------
   3. Actieve navigatie markeren
   ---------------------------------------------------------------------- */
function markActiveNav() {
  var page = document.body.getAttribute('data-page');
  if (!page) return;
  document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (a) {
    a.setAttribute('aria-current', 'page');
  });
}

/* ----------------------------------------------------------------------
   4. Footer-jaartal
   ---------------------------------------------------------------------- */
function setFooterYear() {
  var el = document.querySelector('[data-year]');
  if (el) el.textContent = new Date().getFullYear();
}

/* ----------------------------------------------------------------------
   5. Reveal-animaties
   ---------------------------------------------------------------------- */
function initReveal() {
  var items = document.querySelectorAll('.reveal');
  if (!items.length || !('IntersectionObserver' in window)) {
    items.forEach(function (i) { i.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // Gestaffeld: elementen die samen in beeld komen, verschijnen kort na elkaar
        var siblings = Array.prototype.slice.call(
          entry.target.parentNode ? entry.target.parentNode.querySelectorAll(':scope > .reveal') : [entry.target]
        );
        var idx = siblings.indexOf(entry.target);
        var delay = idx > 0 ? (idx % 4) * 90 : 0;
        setTimeout(function () { entry.target.classList.add('in'); }, delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (i) { io.observe(i); });

  initParallax();
}

/* Subtiele parallax op de hero-afbeelding bij scrollen */
function initParallax() {
  var heroImg = document.querySelector('.hero__media img');
  if (!heroImg) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Niet op telefoons/kleine schermen: daar verstoort het transformeren het soepel scrollen
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;

  var ticking = false;
  function update() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (y < window.innerHeight) {
      heroImg.style.transform = 'translateY(' + (y * 0.18) + 'px) scale(1.06)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* ----------------------------------------------------------------------
   6. Projecten laden, renderen en filteren
   ---------------------------------------------------------------------- */
function initProjects() {
  var grid = document.querySelector('[data-projects-grid]');
  if (!grid) return;

  var limit = parseInt(grid.getAttribute('data-limit'), 10) || 0; // 0 = alle
  var filterBar = document.querySelector('[data-filter-bar]');

  fetch(BASE + 'assets/data/projecten.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var projects = Array.isArray(data) ? data : (data.projecten || []);
      // Nieuwste eerst (op datum indien aanwezig)
      projects.sort(function (a, b) {
        return String(b.datum || '').localeCompare(String(a.datum || ''));
      });
      if (limit > 0) projects = projects.slice(0, limit);

      grid.innerHTML = projects.map(cardHTML).join('');
      reObserveReveals(grid);

      if (filterBar) initFilter(filterBar, grid);
    })
    .catch(function (err) {
      console.error(err);
      grid.innerHTML = '<p class="empty-state">Projecten konden niet worden geladen.</p>';
    });
}

var CAT_LABELS = { woning: 'Woning', appartement: 'Appartement', bedrijfspand: 'Bedrijfspand', renovatie: 'Renovatie' };
function labelFor(p) { return p.categorie_label || CAT_LABELS[p.categorie] || p.categorie || ''; }

function coverFile(p) {
  // De omslag is de EERSTE projectfoto; valt terug op uitgelichte_afbeelding.
  if (p.fotos && p.fotos.length && p.fotos[0] && p.fotos[0].src) return imgFile(p.fotos[0].src);
  return imgFile(p.uitgelichte_afbeelding);
}

function cardHTML(p) {
  var img = coverFile(p);
  var url = BASE + 'projecten/' + p.slug + '.html';
  return '' +
    '<a class="project-card reveal" href="' + url + '" data-category="' + esc(p.categorie) + '">' +
      '<div class="project-card__media">' +
        '<img src="' + img + '" alt="' + esc(p.titel) + ' — ' + esc(p.locatie) + '" width="600" height="400" loading="lazy">' +
        '<span class="project-card__tag">' + esc(labelFor(p)) + '</span>' +
        '<div class="project-card__overlay">' +
          '<span class="loc">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
            esc(p.locatie) +
          '</span>' +
          '<h3>' + esc(p.titel) + '</h3>' +
        '</div>' +
      '</div>' +
      '<div class="project-card__body">' +
        '<p>' + esc(p.korte_beschrijving) + '</p>' +
        '<span class="project-card__more">Bekijk project <span class="arrow" aria-hidden="true">&rarr;</span></span>' +
      '</div>' +
    '</a>';
}

function initFilter(bar, grid) {
  var buttons = bar.querySelectorAll('.filter-btn');
  var dropdown = document.querySelector('[data-filter-select]');

  function applyFilter(cat) {
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-filter') === cat;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (dropdown && dropdown.value !== cat) dropdown.value = cat;

    var cards = grid.querySelectorAll('.project-card');
    var shown = 0;
    cards.forEach(function (card) {
      var match = (cat === 'alle' || card.getAttribute('data-category') === cat);
      card.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    var empty = grid.querySelector('.empty-state');
    if (empty) empty.remove();
    if (shown === 0) {
      var p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'Geen projecten in deze categorie.';
      grid.appendChild(p);
    }
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.getAttribute('data-filter')); });
  });
  if (dropdown) {
    dropdown.addEventListener('change', function () { applyFilter(dropdown.value); });
  }
}

function reObserveReveals(scope) {
  var items = scope.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (i) { i.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  items.forEach(function (i) { io.observe(i); });
}

/* ----------------------------------------------------------------------
   6b. Client-side detailpagina (project-detail.html?slug=...)
   Dient als fallback/weergavepagina. De vindbare (geïndexeerde) versie is
   de statische pagina in /projecten/<slug>.html — daar verwijst de canonical
   van deze pagina naar.
   ---------------------------------------------------------------------- */
function initDetailPage() {
  var root = document.querySelector('[data-detail]');
  if (!root) return;

  var slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) { root.innerHTML = notFound(); return; }

  fetch(BASE + 'assets/data/projecten.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var list = Array.isArray(data) ? data : (data.projecten || []);
      var p = list.filter(function (x) { return x.slug === slug; })[0];
      if (!p) { root.innerHTML = notFound(); return; }

      document.title = p.titel + ' | Saarloos Vastgoed B.V.';
      var canon = document.querySelector('link[rel="canonical"]');
      if (canon) canon.setAttribute('href', 'https://www.saarloosvastgoedbv.nl/projecten/' + p.slug + '.html');

      renderDetail(root, p);
      reObserveReveals(root);
      initLightbox(); // opnieuw initialiseren nu de galerij bestaat
    })
    .catch(function (err) { console.error(err); root.innerHTML = notFound(); });
}

function notFound() {
  return '<div class="container" style="padding:2rem 0 4rem">' +
    '<p class="empty-state">Dit project kon niet worden gevonden. ' +
    '<a href="' + BASE + 'projecten.html" style="color:var(--gold-dark);text-decoration:underline">Bekijk alle projecten</a>.</p></div>';
}

function renderDetail(root, p) {
  var feiten = p.feiten || {};
  var factRows = [
    ['Type', feiten.type],
    ['Oppervlakte', feiten.oppervlakte],
    ['Oplevering', feiten.oplevering],
    ['Status', feiten.status],
    ['Locatie', p.locatie]
  ].filter(function (r) { return r[1]; }).map(function (r) {
    return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
  }).join('');

  var beschrijving = (p.beschrijving || []).map(function (par) {
    return '<p>' + esc(par) + '</p>';
  }).join('');

  var werk = (p.werkzaamheden || []).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('');
  var resultaten = (p.resultaten || []).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');

  var fotos = p.fotos && p.fotos.length ? p.fotos : [{ src: p.uitgelichte_afbeelding, alt: p.titel }];
  var gallery = fotos.map(function (f) {
    var src = imgFile(f.src);
    return '<button class="gallery__item" type="button" data-full="' + src + '" aria-label="Vergroot foto: ' + esc(f.alt) + '">' +
      '<img src="' + src + '" alt="' + esc(f.alt) + '" width="1200" height="900" loading="lazy">' +
      '<span class="zoom" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M11 8v6M8 11h6"/></svg></span>' +
      '</button>';
  }).join('');

  root.innerHTML = '' +
    '<section class="detail-hero">' +
      '<div class="container">' +
        '<p class="breadcrumb"><a href="' + BASE + 'index.html">Home</a><span aria-hidden="true">/</span>' +
          '<a href="' + BASE + 'projecten.html">Projecten</a><span aria-hidden="true">/</span>' + esc(p.titel) + '</p>' +
        '<p class="eyebrow">' + esc(labelFor(p)) + '</p>' +
        '<h1>' + esc(p.titel) + '</h1>' +
        '<p class="detail-hero__loc">' + esc(p.adres || p.locatie) + '</p>' +
      '</div>' +
    '</section>' +
    '<section class="section"><div class="container">' +
      '<div class="detail-body">' +
        '<div class="detail-main reveal">' +
          '<h2>Over dit project</h2>' + beschrijving +
          (werk ? '<h2>Uitgevoerde werkzaamheden</h2><ul class="checks">' + werk + '</ul>' : '') +
          (resultaten ? '<h2>Resultaat</h2><ul class="checks">' + resultaten + '</ul>' : '') +
          '<div class="gallery" data-gallery>' + gallery + '</div>' +
        '</div>' +
        '<aside class="detail-aside reveal">' +
          '<h3>Projectgegevens</h3>' +
          '<dl class="detail-facts">' + factRows + '</dl>' +
          '<a class="btn btn--gold btn--block" href="' + BASE + 'contact.html">Vraag naar dit project</a>' +
          '<p style="margin-top:1rem;text-align:center"><a href="' + BASE + 'projecten.html" style="color:var(--gold-dark);text-decoration:underline;text-underline-offset:3px">Terug naar projecten</a></p>' +
        '</aside>' +
      '</div>' +
    '</div></section>';
}

/* ----------------------------------------------------------------------
   7. Lightbox-galerij
   ---------------------------------------------------------------------- */
function initLightbox() {
  var gallery = document.querySelector('[data-gallery]');
  var lightbox = document.querySelector('[data-lightbox]');
  if (!gallery || !lightbox) return;

  var imgEl = lightbox.querySelector('.lightbox__img');
  var counter = lightbox.querySelector('.lightbox__counter');
  var btnClose = lightbox.querySelector('.lightbox__close');
  var btnPrev = lightbox.querySelector('.lightbox__prev');
  var btnNext = lightbox.querySelector('.lightbox__next');

  var triggers = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__item'));
  var sources = triggers.map(function (t) { return t.getAttribute('data-full') || t.querySelector('img').src; });
  var alts = triggers.map(function (t) { var i = t.querySelector('img'); return i ? i.alt : ''; });
  var current = 0;

  function show(i) {
    current = (i + sources.length) % sources.length;
    imgEl.src = sources[current];
    imgEl.alt = alts[current];
    if (counter) counter.textContent = (current + 1) + ' / ' + sources.length;
  }
  function open(i) { show(i); lightbox.classList.add('open'); document.body.style.overflow = 'hidden'; btnClose.focus(); }
  function close() { lightbox.classList.remove('open'); document.body.style.overflow = ''; }

  triggers.forEach(function (t, i) {
    t.addEventListener('click', function () { open(i); });
  });
  if (btnClose) btnClose.addEventListener('click', close);
  if (btnPrev) btnPrev.addEventListener('click', function () { show(current - 1); });
  if (btnNext) btnNext.addEventListener('click', function () { show(current + 1); });

  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
}

/* ----------------------------------------------------------------------
   8. Contactformulier (Formspree)
   ---------------------------------------------------------------------- */
function initContactForm() {
  var form = document.querySelector('[data-contact-form]');
  if (!form) return;
  var status = form.querySelector('.form-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Versturen…'; }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (res) {
        if (res.ok) {
          showStatus(status, 'success', 'Bedankt voor uw bericht. Wij nemen zo spoedig mogelijk contact met u op.');
          form.reset();
        } else {
          showStatus(status, 'error', 'Er ging iets mis bij het versturen. Bel ons gerust op 06 12 34 56 78.');
        }
      })
      .catch(function () {
        showStatus(status, 'error', 'Er ging iets mis bij het versturen. Bel ons gerust op 06 12 34 56 78.');
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = original; }
      });
  });
}

function showStatus(el, type, msg) {
  if (!el) return;
  el.className = 'form-status show ' + type;
  el.textContent = msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ----------------------------------------------------------------------
   Hulpfunctie — HTML-escaping tegen onbedoelde injectie
   ---------------------------------------------------------------------- */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Beeldpad voor PROJECTfoto's normaliseren. Accepteert een kale bestandsnaam
   ("herenhuis-1.webp"), een pad ("assets/images/projecten/herenhuis-1.webp"),
   of een volledige URL. Projectfoto's staan in assets/images/projecten/.
   Het CMS slaat hier het pad op dat met public_folder is ingesteld; we nemen
   altijd de bestandsnaam en zetten er de juiste projectmap voor. */
function imgFile(v) {
  v = String(v == null ? '' : v).trim();
  if (!v) return BASE + 'assets/images/projecten/project-placeholder.webp';
  if (/^https?:\/\//.test(v)) return v;
  var base = v.split('/').pop();
  return BASE + 'assets/images/projecten/' + (base || 'project-placeholder.webp');
}