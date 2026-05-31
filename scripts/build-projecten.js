/* ==========================================================================
   build-projecten.js
   Leest content/projecten/*.json en genereert:
     1. assets/data/projecten.json   (gecombineerde lijst voor de front-end)
     2. projecten/<slug>.html         (vindbare statische detailpagina per project)
     3. sitemap.xml                   (incl. alle projectpagina's)
   Draait automatisch via GitHub Actions, en kan lokaal met: node scripts/build-projecten.js
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'content', 'projecten');
const DATA_OUT = path.join(ROOT, 'assets', 'data', 'projecten.json');
const PAGES_OUT = path.join(ROOT, 'projecten');
const SITEMAP_OUT = path.join(ROOT, 'sitemap.xml');

const DOMAIN = 'https://www.saarloosvastgoedbv.nl';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function clip(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }

var CAT_LABELS = { woning: 'Woning', appartement: 'Appartement', bedrijfspand: 'Bedrijfspand', renovatie: 'Renovatie' };
function labelFor(p) { return p.categorie_label || CAT_LABELS[p.categorie] || p.categorie || ''; }

// Beeldpad voor statische projectpagina's (../assets/images/projecten/<bestand>) of externe URL.
function imgRel(v) {
  v = String(v == null ? '' : v).trim();
  if (!v) return '../assets/images/projecten/project-placeholder.webp';
  if (/^https?:\/\//.test(v)) return v;
  var base = v.split('/').pop();
  return '../assets/images/projecten/' + (base || 'project-placeholder.webp');
}
// Absolute URL t.b.v. og:image (projectfoto)
function imgAbs(v) {
  v = String(v == null ? '' : v).trim();
  if (/^https?:\/\//.test(v)) return v;
  var base = v.split('/').pop() || 'project-placeholder.webp';
  return DOMAIN + '/assets/images/projecten/' + base;
}

/* ---- 1. Inlezen ---- */
if (!fs.existsSync(SRC)) { console.error('Geen content/projecten/ map gevonden.'); process.exit(1); }
const files = fs.readdirSync(SRC).filter(function (f) { return f.endsWith('.json'); });
let projects = files.map(function (f) {
  return JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
});
// De omslag/uitgelichte afbeelding is altijd de EERSTE projectfoto.
projects.forEach(function (p) {
  if (p.fotos && p.fotos.length && p.fotos[0] && p.fotos[0].src) {
    p.uitgelichte_afbeelding = p.fotos[0].src;
  }
});
// nieuwste eerst
projects.sort(function (a, b) { return String(b.datum || '').localeCompare(String(a.datum || '')); });

/* ---- 2. projecten.json schrijven ---- */
fs.mkdirSync(path.dirname(DATA_OUT), { recursive: true });
fs.writeFileSync(DATA_OUT, JSON.stringify(projects, null, 2) + '\n', 'utf8');

/* ---- 3. Statische detailpagina's ---- */
fs.mkdirSync(PAGES_OUT, { recursive: true });

function galleryHTML(p) {
  var fotos = (p.fotos && p.fotos.length) ? p.fotos : [{ src: p.uitgelichte_afbeelding, alt: p.titel }];
  return fotos.map(function (f) {
    var src = imgRel(f.src);
    return '' +
      '          <button class="gallery__item" type="button" data-full="' + esc(src) + '" aria-label="Vergroot foto: ' + esc(f.alt) + '">\n' +
      '            <img src="' + esc(src) + '" alt="' + esc(f.alt) + '" width="1200" height="900" loading="lazy">\n' +
      '            <span class="zoom" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M11 8v6M8 11h6"/></svg></span>\n' +
      '          </button>';
  }).join('\n');
}

function factsHTML(p) {
  var f = p.feiten || {};
  var rows = [['Type', f.type], ['Oppervlakte', f.oppervlakte], ['Oplevering', f.oplevering], ['Status', f.status], ['Locatie', p.locatie]];
  return rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '            <div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
  }).join('\n');
}

function listHTML(arr) {
  return (arr || []).map(function (x) { return '            <li>' + esc(x) + '</li>'; }).join('\n');
}
function parasHTML(arr) {
  return (arr || []).map(function (x) { return '          <p>' + esc(x) + '</p>'; }).join('\n');
}

function pageHTML(p) {
  var url = DOMAIN + '/projecten/' + p.slug + '.html';
  var title = clip(p.titel + ' in ' + p.locatie + ' | Saarloos Vastgoed B.V.', 65);
  var desc = clip(p.korte_beschrijving, 160);
  var ogimg = imgAbs(p.uitgelichte_afbeelding);
  var werk = listHTML(p.werkzaamheden);
  var res = listHTML(p.resultaten);

  var ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/index.html' },
      { '@type': 'ListItem', position: 2, name: 'Projecten', item: DOMAIN + '/projecten.html' },
      { '@type': 'ListItem', position: 3, name: p.titel, item: url }
    ]
  };

  return '' +
'<!DOCTYPE html>\n' +
'<html lang="nl">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>' + esc(title) + '</title>\n' +
'  <meta name="description" content="' + esc(desc) + '">\n' +
'  <meta name="robots" content="index, follow">\n' +
'  <link rel="canonical" href="' + esc(url) + '">\n' +
'  <link rel="icon" href="../assets/images/favicon.ico">\n' +
'  <link rel="apple-touch-icon" href="../assets/images/favicon-180.png">\n' +
'\n' +
'  <meta property="og:title" content="' + esc(title) + '">\n' +
'  <meta property="og:description" content="' + esc(desc) + '">\n' +
'  <meta property="og:image" content="' + esc(ogimg) + '">\n' +
'  <meta property="og:url" content="' + esc(url) + '">\n' +
'  <meta property="og:type" content="article">\n' +
'  <meta property="og:locale" content="nl_NL">\n' +
'  <meta name="twitter:card" content="summary_large_image">\n' +
'\n' +
'  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">\n' +
'  <link rel="stylesheet" href="../style.css">\n' +
'\n' +
'  <script type="application/ld+json">\n' + JSON.stringify(ld, null, 2) + '\n  </script>\n' +
'</head>\n' +
'<body data-page="projecten">\n' +
'  <script>window.BASE = "../";</script>\n' +
'  <a class="skip-link" href="#main">Direct naar de inhoud</a>\n' +
'\n' +
'  <div id="header-placeholder"></div>\n' +
'\n' +
'  <main id="main">\n' +
'    <section class="detail-hero">\n' +
'      <div class="container">\n' +
'        <p class="breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="../projecten.html">Projecten</a><span aria-hidden="true">/</span>' + esc(p.titel) + '</p>\n' +
'        <p class="eyebrow">' + esc(labelFor(p)) + '</p>\n' +
'        <h1>' + esc(p.titel) + '</h1>\n' +
'        <p class="detail-hero__loc">' + esc(p.adres || p.locatie) + '</p>\n' +
'      </div>\n' +
'    </section>\n' +
'\n' +
'    <section class="section">\n' +
'      <div class="container">\n' +
'        <div class="detail-body">\n' +
'          <div class="detail-main reveal">\n' +
'            <h2>Over dit project</h2>\n' +
parasHTML(p.beschrijving) + '\n' +
(werk ? '            <h2>Uitgevoerde werkzaamheden</h2>\n            <ul class="checks">\n' + werk + '\n            </ul>\n' : '') +
(res ? '            <h2>Resultaat</h2>\n            <ul class="checks">\n' + res + '\n            </ul>\n' : '') +
'            <h2>Fotogalerij</h2>\n' +
'            <div class="gallery" data-gallery>\n' +
galleryHTML(p) + '\n' +
'            </div>\n' +
'          </div>\n' +
'          <aside class="detail-aside reveal">\n' +
'            <h3>Projectgegevens</h3>\n' +
'            <dl class="detail-facts">\n' +
factsHTML(p) + '\n' +
'            </dl>\n' +
'            <a class="btn btn--gold btn--block" href="../contact.html">Vraag naar dit project</a>\n' +
'            <p style="margin-top:1rem;text-align:center"><a href="../projecten.html" style="color:var(--gold-dark);text-decoration:underline;text-underline-offset:3px">Terug naar projecten</a></p>\n' +
'          </aside>\n' +
'        </div>\n' +
'      </div>\n' +
'    </section>\n' +
'  </main>\n' +
'\n' +
'  <div class="lightbox" data-lightbox aria-hidden="true">\n' +
'    <button class="lightbox__close" type="button" aria-label="Sluiten">&times;</button>\n' +
'    <button class="lightbox__nav lightbox__prev" type="button" aria-label="Vorige foto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg></button>\n' +
'    <img class="lightbox__img" src="" alt="">\n' +
'    <button class="lightbox__nav lightbox__next" type="button" aria-label="Volgende foto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button>\n' +
'    <span class="lightbox__counter"></span>\n' +
'  </div>\n' +
'\n' +
'  <div id="footer-placeholder"></div>\n' +
'\n' +
'  <a class="whatsapp-float" href="https://wa.me/31612345678" target="_blank" rel="noopener" aria-label="Stuur ons een WhatsApp-bericht">\n' +
'    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 5-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4zm-3 4.2c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.5 3.9 2.2.8 2.7.7 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.3l-1.4-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.2-.3.2-.5.1-.7-.3-1.4-.6-2.1-1.5-.2-.3.2-.5.3-.7.1-.1.2-.3.3-.5.1-.2 0-.3 0-.5l-.7-1.6c-.2-.4-.3-.4-.5-.4z"/></svg>\n' +
'  </a>\n' +
'\n' +
'  <script src="../js/script.js" defer></script>\n' +
'</body>\n' +
'</html>\n';
}

// oude gegenereerde pagina's opruimen
fs.readdirSync(PAGES_OUT).filter(function (f) { return f.endsWith('.html'); })
  .forEach(function (f) { fs.unlinkSync(path.join(PAGES_OUT, f)); });

projects.forEach(function (p) {
  fs.writeFileSync(path.join(PAGES_OUT, p.slug + '.html'), pageHTML(p), 'utf8');
});

/* ---- 4. sitemap.xml ---- */
var staticPages = [
  { loc: DOMAIN + '/', priority: '1.0' },
  { loc: DOMAIN + '/over-ons.html', priority: '0.8' },
  { loc: DOMAIN + '/projecten.html', priority: '0.9' },
  { loc: DOMAIN + '/contact.html', priority: '0.7' }
];
var projectUrls = projects.map(function (p) {
  return { loc: DOMAIN + '/projecten/' + p.slug + '.html', priority: '0.6' };
});
var all = staticPages.concat(projectUrls);
var today = new Date().toISOString().slice(0, 10);

var sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  all.map(function (u) {
    return '  <url>\n' +
      '    <loc>' + u.loc + '</loc>\n' +
      '    <lastmod>' + today + '</lastmod>\n' +
      '    <changefreq>monthly</changefreq>\n' +
      '    <priority>' + u.priority + '</priority>\n' +
      '  </url>';
  }).join('\n') + '\n</urlset>\n';

fs.writeFileSync(SITEMAP_OUT, sitemap, 'utf8');

console.log('Build klaar:');
console.log('  - ' + projects.length + ' projecten in assets/data/projecten.json');
console.log('  - ' + projects.length + ' statische paginas in projecten/');
console.log('  - sitemap.xml met ' + all.length + ' URLs');
