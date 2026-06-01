# Saarloos Vastgoed B.V. — website

Een complete, statische website (HTML/CSS/JS) met een ingebouwd adminportaal waarmee
Saarloos Vastgoed zelf projecten kan toevoegen, bewerken en verwijderen — zonder kennis
van programmeren. De klant logt in op een eigen `/admin`-pagina en raakt GitHub verder
nooit aan.

---

## 1. Mappenstructuur

```
saarloos-vastgoed/
├── index.html              Homepage
├── over-ons.html           Over ons
├── projecten.html          Projectoverzicht (filterbaar)
├── project-detail.html     Weergavepagina voor één project (?slug=...) — fallback
├── contact.html            Contact + formulier + Google Maps
├── privacy.html            Privacyverklaring (noindex)
├── style.css               Volledige vormgeving (donkerblauw + goud)
├── sitemap.xml             Wordt automatisch bijgewerkt
├── robots.txt              Inclusief AI-zoekmachines
├── netlify.toml            Config voor hosting via Netlify (optioneel)
├── llms.txt                Context voor AI-zoekmachines
├── favicon.ico
│
├── js/
│   └── script.js           Menu, filter, lightbox, formulier, projecten laden
│
├── components/
│   ├── header.html         Header + hamburgermenu (op elke pagina herbruikt)
│   └── footer.html         Footer (KvK, privacy, socials)
│
├── admin/                  HET ADMINPORTAAL
│   ├── index.html          Laadt Sveltia CMS
│   └── config.yml          Bepaalt de invulvelden + waar alles wordt opgeslagen
│
├── content/
│   └── projecten/          BRON: de tekst van elk project (1 .json per project)
│       ├── herenhuis-oude-delft.json
│       └── ...
│
├── projecten/              GEGENEREERD: vindbare projectpagina's (voor Google)
│   ├── herenhuis-oude-delft.html
│   └── ...
│
├── assets/
│   ├── data/
│   │   └── projecten.json  GEGENEREERD: gecombineerde lijst voor de front-end
│   ├── icons/              (iconen staan inline in de HTML)
│   └── images/
│       ├── favicon.ico
│       ├── favicon-180.png
│       ├── site/           BEDRIJFSFOTO'S (jij beheert) — hero, logo, eigenaar, enz.
│       │   ├── hero.webp
│       │   ├── og-image.webp
│       │   ├── over-pand.webp
│       │   ├── over-team.webp     ← bijv. foto van de eigenaar
│       │   ├── cta-pand.webp
│       │   └── logo.png           ← hier komt het logo (zie §4)
│       └── projecten/      PROJECTFOTO'S (klant uploadt hier via /admin)
│           ├── project-placeholder.webp
│           ├── herenhuis-oude-delft.webp
│           ├── herenhuis-oude-delft-1.webp
│           └── ...
│
├── scripts/                Hulpscripts (lokaal of via GitHub Action)
│   ├── build-projecten.js  Maakt projecten.json + projectpagina's + sitemap
│   ├── seed-projecten.js   Maakt de 10 voorbeeldprojecten
│   ├── gen-placeholders.py Maakt de placeholder-foto's
│   └── check.py            Drievoudige codecheck
│
└── .github/
    └── workflows/
        └── deploy.yml      Automatische bouw + publicatie
```

### De twee fotomappen — bewust gescheiden
- **`assets/images/site/`** — vaste bedrijfsfoto's (hero, logo, foto van de eigenaar).
  Die zet jij er eenmalig in. De klant komt hier niet aan.
- **`assets/images/projecten/`** — projectfoto's. Hier zet het CMS automatisch de
  foto's neer die de klant via `/admin` uploadt.

---

## 2. Online zetten (eenmalig)

1. Maak een **GitHub-repository** en zet al deze bestanden erin (VS Code → commit → push).
2. Ga in GitHub naar **Settings → Pages** en zet de bron op **GitHub Actions**.
3. De meegeleverde workflow (`.github/workflows/deploy.yml`) bouwt en publiceert de site
   automatisch.

> Eigen domein koppelen kan via **Settings → Pages → Custom domain**. De website verwijst
> overal al naar `https://www.saarloosvastgoedbv.nl`.

---

## 3. Het adminportaal — inloggen met GitHub (één klik)

Het portaal is bereikbaar op **`jouwdomein.nl/admin`**. Je klant ziet daar een net
inlogscherm met een **"Sign in with GitHub"-knop**, klikt één keer, en zit in een
overzichtelijk dashboard met de collectie **Projecten**. Hij ziet nergens code, mappen of
`.json`-bestanden — alleen invulvelden en een sleep-hier-je-foto's vak.

Om die knop te laten werken, zet je eenmalig een gratis OAuth-helper op (een klein
Cloudflare Worker-scriptje). Dat is nodig omdat de projecten in GitHub worden opgeslagen.
Dit doe je één keer; daarna hoef je er nooit meer naar om te kijken.

### Eenmalige opzet (ca. 15 minuten)

**Stap A — repo invullen in `admin/config.yml`**
Vervang `GEBRUIKERSNAAM/REPONAAM` door je eigen repo, bijv. `saarloosvastgoed/website`.

**Stap B — Cloudflare Worker uitrollen (de inlog-helper)**
1. Maak een gratis account op cloudflare.com.
2. Ga naar de repository `sveltia/sveltia-cms-auth` op GitHub en volg de knop
   **"Deploy to Cloudflare"** (of importeer/clone hem in Cloudflare Workers).
3. Na het uitrollen toont Cloudflare een Worker-URL, bijv.
   `https://sveltia-cms-auth.<subdomein>.workers.dev`. Noteer die.

**Stap C — GitHub OAuth-app registreren**
1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Vul in:
   - *Application name:* Saarloos Vastgoed CMS (of iets anders)
   - *Homepage URL:* `https://www.saarloosvastgoedbv.nl`
   - *Authorization callback URL:* je Worker-URL gevolgd door `/callback`
     (bijv. `https://sveltia-cms-auth.<subdomein>.workers.dev/callback`)
3. Klik **Register**, daarna **Generate a new client secret**.
4. Je krijgt nu een **Client ID** en **Client Secret**.

**Stap D — sleutels in de Worker zetten**
Zet in Cloudflare (Worker → Settings → Variables) deze waarden:
- `GITHUB_CLIENT_ID` = de Client ID uit stap C
- `GITHUB_CLIENT_SECRET` = de Client Secret uit stap C
- `ALLOWED_DOMAINS` = `www.saarloosvastgoedbv.nl` (zo kan alleen jouw site inloggen)

**Stap E — Worker koppelen in `admin/config.yml`**
Voeg onder `backend:` de regel toe met je Worker-URL:
```yaml
backend:
  name: github
  repo: saarloosvastgoed/website
  branch: main
  base_url: https://sveltia-cms-auth.<subdomein>.workers.dev
```

**Stap F — klant toegang geven**
1. Je klant maakt een gratis account op github.com.
2. GitHub → jouw repo → **Settings → Collaborators → Add people** → nodig zijn
   GitHub-gebruikersnaam uit (met schrijfrechten).
3. Hij accepteert de uitnodiging (komt per e-mail).

Klaar. Vanaf nu gaat je klant naar `jouwdomein.nl/admin`, klikt op **Sign in with
GitHub**, en kan projecten toevoegen.

---

## 4. Zo voegt de klant een project toe (en wat er automatisch gebeurt)

In het portaal klikt de klant op **Projecten → Nieuw**, vult de velden in (titel,
categorie, locatie, beschrijving, enz.) en voegt onder **Foto's** één of meer foto's toe.
De **eerste foto** wordt automatisch de omslag op de overzichtskaart, met de titel en
locatie eroverheen (met een donkere tint zodat de tekst leesbaar blijft). De volgorde van
foto's kan hij wijzigen door ze te slepen. Bij **opslaan**:

- de **tekst** komt als nieuw bestand in `content/projecten/<naam>.json`;
- de **foto's** komen in `assets/images/projecten/`;
- de GitHub Action maakt automatisch de vindbare projectpagina in `projecten/`, werkt
  `assets/data/projecten.json` en `sitemap.xml` bij, en publiceert de site opnieuw.

Binnen één à twee minuten staat het project live. De klant hoeft dus alleen het formulier
in te vullen; alle mappen, pagina's en links worden automatisch goed gezet.

---

## 5. Nog zelf in te vullen (placeholders)

| Onderdeel | Waar | Wat te doen |
|---|---|---|
| **Logo** | `assets/images/site/logo.png` | Plaats je logo (transparante PNG, ~vierkant). In `components/header.html` en `components/footer.html` staat per stuk uitleg: vervang het blok "Jouw logo" door de `<img>`-regel die er (uitgecommentarieerd) al bij staat. |
| **Contactformulier** | `contact.html` | Maak een gratis formulier op https://formspree.io en vervang `https://formspree.io/f/your-form-id` door je eigen endpoint. |
| **Social media** | `components/footer.html` | Vervang de `#`-links van Instagram en LinkedIn door je echte profielen. |
| **Bedrijfsfoto's** | `assets/images/site/` | De huidige beelden zijn nette placeholders. Vervang ze door echte foto's — houd dezelfde bestandsnaam aan. |
| **Projectfoto's** | via `/admin` | Worden door de klant geüpload naar `assets/images/projecten/`. |
| **Bedrijfsgegevens** | div. | KvK (87654321), BTW en adres (Vermeerstraat 14, Delft) zijn voorbeeldwaarden — pas ze aan. |

---

## 6. Lokaal opnieuw genereren (optioneel)

```
node scripts/build-projecten.js   # projecten.json + projectpagina's + sitemap
python3 scripts/check.py          # de codecontrole
```

De voorbeelddata komt uit `scripts/seed-projecten.js` en de placeholder-afbeeldingen uit
`scripts/gen-placeholders.py` (alleen nodig als je opnieuw voorbeelddata wilt opbouwen).
