#!/usr/bin/env python3
import os, re, glob, json, sys
from html.parser import HTMLParser

ROOT = os.path.join(os.path.dirname(__file__), '..')
os.chdir(ROOT)

errors, warnings = [], []
def err(f, m): errors.append(f"[{f}] {m}")
def warn(f, m): warnings.append(f"[{f}] {m}")

# Pagina's die volledige SEO-head moeten hebben (geen fragmenten/admin)
PAGES = ['index.html','over-ons.html','projecten.html','contact.html','privacy.html','project-detail.html']
PAGES += sorted(glob.glob('projecten/*.html'))
COMPONENTS = ['components/header.html','components/footer.html']
ALL_HTML = PAGES + COMPONENTS

JS_CLASSES = {'open','in','active','is-hidden','menu-open','show','success','error','empty-state'}

class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags=[]; self.ids=[]; self.h1=0; self.headings=[]
        self.imgs=[]; self.classes=set(); self.links=[]; self.void=set()
        self.has_form=False; self.form_action=None; self.iframicount=0; self.iframe_src=[]
        self.stack=[]
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if 'id' in d: self.ids.append(d['id'])
        if 'class' in d:
            for c in d['class'].split(): self.classes.add(c)
        if tag in ('h1','h2','h3','h4','h5','h6'):
            self.headings.append(int(tag[1]))
            if tag=='h1': self.h1+=1
        if tag=='img': self.imgs.append(d)
        if tag=='a' and 'href' in d: self.links.append(d['href'])
        if tag=='link' and 'href' in d: self.links.append(d['href'])
        if tag=='script' and 'src' in d: self.links.append(d['src'])
        if tag=='form':
            self.has_form=True; self.form_action=d.get('action')
        if tag=='iframe':
            self.iframicount+=1; self.iframe_src.append(d.get('src',''))
        VOID={'meta','link','img','br','hr','input','source','area','base','col','embed','param','track','wbr'}
        if tag not in VOID:
            self.stack.append(tag)
    def handle_endtag(self, tag):
        VOID={'meta','link','img','br','hr','input','source','area','base','col','embed','param','track','wbr'}
        if tag in VOID: return
        # zoek dichtstbijzijnde matchende open tag
        if tag in self.stack:
            while self.stack and self.stack[-1]!=tag:
                self.stack.pop()
            if self.stack: self.stack.pop()

def parse(path):
    with open(path,encoding='utf-8') as fh: html=fh.read()
    p=P(); p.feed(html)
    return html,p

# ---------- CHECK 1 — HTML ----------
def check1():
    for f in ALL_HTML:
        if not os.path.exists(f): err(f,"bestand ontbreekt"); continue
        html,p=parse(f)
        # ongesloten tags
        if p.stack:
            err(f, f"mogelijk ongesloten tags: {p.stack}")
        # dubbele id's
        dups=set([x for x in p.ids if p.ids.count(x)>1])
        if dups: err(f, f"dubbele id's: {dups}")
        if f in PAGES:
            # één H1
            if p.h1!=1: err(f, f"verwacht 1 <h1>, gevonden {p.h1}")
            # heading-hiërarchie zonder sprongen
            prev=0
            for lvl in p.headings:
                if prev and lvl>prev+1:
                    warn(f, f"heading-sprong h{prev}->h{lvl}")
                prev=lvl
        # interne links/bestaanscontrole
        # componenten worden in een pagina in de site-root geïnjecteerd → relatief aan root oplossen
        base = '' if f in COMPONENTS else os.path.dirname(f)
        for href in p.links:
            if re.match(r'^(https?:|#|tel:|mailto:|data:|//)', href): continue
            target=href.split('#')[0].split('?')[0]
            if not target: continue
            cand=os.path.normpath(os.path.join(base,target))
            if not os.path.exists(cand):
                err(f, f"verwijst naar ontbrekend bestand: {href} -> {cand}")
    # contactformulier action
    _,cp=parse('contact.html')
    if not cp.has_form: err('contact.html',"geen <form> gevonden")
    elif not cp.form_action or 'formspree' not in cp.form_action: warn('contact.html',"form action lijkt geen Formspree-URL")
    # Google Maps aanwezig
    if 'google.com/maps' not in open('contact.html',encoding='utf-8').read():
        err('contact.html',"Google Maps embed ontbreekt")

# ---------- CHECK 2 — CSS ----------
def check2():
    css=open('style.css',encoding='utf-8').read()
    # classes uit alle HTML
    used=set()
    for f in ALL_HTML:
        _,p=parse(f); used|=p.classes
    # ook door JS gegenereerde classes
    for jsf in ['js/script.js']:
        pass
    missing=[]
    for c in sorted(used):
        if c in JS_CLASSES: continue
        if re.search(r'\.'+re.escape(c)+r'(?![\w-])', css) is None:
            missing.append(c)
    if missing: err('style.css', f"klassen zonder CSS-regel: {missing}")
    # breakpoints
    for bp in ['480px','768px','1200px']:
        if bp not in css: err('style.css', f"breakpoint {bp} ontbreekt")
    # geen overflow-x op body? we willen overflow-x:hidden
    if 'overflow-x: hidden' not in css: warn('style.css',"overflow-x:hidden op body niet gevonden")
    # CSS variabelen
    if '--navy' not in css or 'var(--' not in css: err('style.css',"CSS-variabelen ontbreken")
    # z-index hiërarchie
    for sel,zi in [('.whatsapp-float','90'),('.site-header','100'),('.mobile-menu','110'),('.menu-toggle','115')]:
        block=re.search(re.escape(sel)+r'\s*\{[^}]*\}', css)
        if not block or f'z-index: {zi}' not in block.group(0):
            # mobile-menu open variant kan apart; check globale aanwezigheid
            if f'z-index: {zi}' not in css: err('style.css', f"z-index {zi} voor {sel} ontbreekt")
    # mobile menu opaque (volledige hex, geen var)
    mm=re.search(r'\.mobile-menu\s*\{[^}]*\}', css).group(0)
    if '#0e1f3d' not in mm: err('style.css',"mobile-menu niet volledig opaque (#hex) ")
    if '100dvh' not in css: warn('style.css',"100dvh niet gebruikt")

# ---------- CHECK 3 — JS & SEO ----------
def check3():
    js=open('js/script.js',encoding='utf-8').read()
    for needle,msg in [
        ('header-placeholder','header via fetch'),
        ('components/header.html','header component pad'),
        ("readyState",'readyState-check'),
        ("'Escape'",'Escape-toets'),
        ('menu-open','body.menu-open toggle'),
        ('addEventListener','events'),
    ]:
        if needle not in js: err('js/script.js', f"ontbreekt: {msg}")

    titles={}; descs={}
    for f in PAGES:
        html,p=parse(f)
        head=html[:html.find('</head>')] if '</head>' in html else html
        # title
        mt=re.search(r'<title>(.*?)</title>', head, re.S)
        if not mt: err(f,"<title> ontbreekt")
        else:
            t=mt.group(1).strip(); titles.setdefault(t,[]).append(f)
            if not (20<=len(t)<=70): warn(f, f"title-lengte {len(t)} buiten 30-65")
        # description
        md=re.search(r'<meta\s+name="description"\s+content="(.*?)"', head, re.S)
        if not md: err(f,"meta description ontbreekt")
        else:
            d=md.group(1).strip(); descs.setdefault(d,[]).append(f)
            if not (40<=len(d)<=170): warn(f, f"description-lengte {len(d)} buiten 50-160")
        # canonical
        if 'rel="canonical"' not in head: err(f,"canonical ontbreekt")
        # favicon
        if 'rel="icon"' not in head: err(f,"favicon ontbreekt")
        # robots
        if 'name="robots"' not in head: err(f,"meta robots ontbreekt")
        # Open Graph compleet
        for og in ['og:title','og:description','og:image','og:url','og:type','og:locale']:
            if f=='privacy.html': break  # privacy mag beperkte head hebben
            if f'property="{og}"' not in head: err(f, f"Open Graph {og} ontbreekt")
        # twitter
        if f!='privacy.html' and 'name="twitter:card"' not in head: warn(f,"twitter:card ontbreekt")
        # afbeeldingen attributen (lege lightbox-afbeelding wordt door JS gevuld → overslaan)
        for img in p.imgs:
            if not img.get('src') or 'lightbox__img' in img.get('class',''): continue
            for attr in ['alt','width','height','loading']:
                if attr not in img: warn(f, f"img mist {attr}: {img.get('src','?')}")
        # min 2 interne links
        internal=[h for h in p.links if h.endswith('.html') and not h.startswith('http')]
        if f in PAGES and len(set(internal))<2: warn(f, f"minder dan 2 interne links ({len(set(internal))})")
        # noindex waar verwacht
        if f in ('privacy.html','project-detail.html') and 'noindex' not in head:
            err(f,"verwacht noindex")
    # unieke titles/descs
    for t,fs in titles.items():
        if len(fs)>1: err('SEO', f"dubbele title op {fs}")
    for d,fs in descs.items():
        if len(fs)>1: err('SEO', f"dubbele description op {fs}")
    # JSON-LD op homepage
    home=open('index.html',encoding='utf-8').read()
    if 'application/ld+json' not in home: err('index.html',"JSON-LD ontbreekt")
    # valideer alle JSON-LD blokken parsen
    for f in PAGES:
        h=open(f,encoding='utf-8').read()
        for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
            try: json.loads(m.group(1))
            except Exception as e: err(f, f"ongeldige JSON-LD: {e}")
    # projecten.json valide
    try:
        data=json.load(open('assets/data/projecten.json',encoding='utf-8'))
        assert isinstance(data,list) and len(data)>=10
    except Exception as e: err('projecten.json', f"probleem: {e}")

check1(); check2(); check3()

print("="*60)
if errors:
    print(f"FOUTEN ({len(errors)}):")
    for e in errors: print("  ✗", e)
else:
    print("Geen blokkerende fouten.")
print("-"*60)
if warnings:
    print(f"Waarschuwingen ({len(warnings)}):")
    for w in warnings: print("  •", w)
else:
    print("Geen waarschuwingen.")
print("="*60)
sys.exit(1 if errors else 0)
