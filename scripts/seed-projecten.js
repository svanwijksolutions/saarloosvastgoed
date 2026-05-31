/* Seed: schrijft 10 voorbeeldprojecten weg als losse JSON-bestanden
   in content/projecten/. Dit is de bron die Sveltia CMS later bewerkt. */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'content', 'projecten');
fs.mkdirSync(DIR, { recursive: true });


function gallery(slug, n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push({ src: `${slug}-${i}.webp`, alt: `Projectfoto ${i}` });
  }
  return out;
}

const projecten = [
  {
    slug: 'herenhuis-oude-delft',
    titel: 'Herenhuis aan de Oude Delft',
    categorie: 'woning',
    locatie: 'Delft',
    adres: 'Oude Delft 142, 2611 CG Delft',
    datum: '2025-11',
    korte_beschrijving: 'Een monumentaal herenhuis aan de gracht, met respect voor het oorspronkelijke karakter naar deze tijd gebracht.',
    beschrijving: [
      'Dit klassieke herenhuis aan de Oude Delft verkeerde bouwkundig in goede staat, maar voldeed niet meer aan de wensen van moderne bewoning. Wij hebben het pand aangekocht, een totaalplan ontwikkeld en de woning volledig laten verbouwen.',
      'De uitdaging lag in het verenigen van twee werelden: het waardevolle, beschermde interieur behouden én een comfortabele, energiezuinige woning realiseren. Door nauwe afstemming met de gemeente en gespecialiseerde restauratiepartners is dat gelukt.'
    ],
    werkzaamheden: [
      'Aankoop en bouwkundige opname van het monument',
      'Restauratie van de originele stucplafonds en paneeldeuren',
      'Volledig nieuwe installaties (elektra, cv, ventilatie)',
      'Vloerverwarming en na-isolatie binnenzijde',
      'Nieuwe keuken en twee badkamers',
      'Herstel van de tuin en achtergevel'
    ],
    resultaten: [
      'Energielabel van G naar B zonder het aanzicht aan te tasten',
      'Volledig verkocht binnen drie weken na oplevering',
      'Behoud van alle monumentale details'
    ],
    feiten: { type: 'Herenhuis (rijksmonument)', oppervlakte: '248 m²', oplevering: 'November 2025', status: 'Verkocht' },
    uitgelichte_afbeelding: 'herenhuis-oude-delft.webp',
    fotos: gallery('herenhuis-oude-delft', 6)
  },
  {
    slug: 'penthouse-kop-van-zuid',
    titel: 'Penthouse Kop van Zuid',
    categorie: 'appartement',
    locatie: 'Rotterdam',
    adres: 'Wilhelminakade 305, 3072 AP Rotterdam',
    datum: '2025-09',
    korte_beschrijving: 'Een ruim penthouse met uitzicht over de Maas, hoogwaardig afgewerkt voor een veeleisende koper.',
    beschrijving: [
      'Voor dit penthouse op de Kop van Zuid verzorgden wij de complete binnentransformatie. De vorige indeling benutte het uitzicht onvoldoende; ons ontwerp opende de leefruimte volledig naar de rivier.',
      'Materialen zijn met zorg gekozen: natuursteen, eikenhout en messing accenten die rust en allure uitstralen zonder opdringerig te zijn.'
    ],
    werkzaamheden: [
      'Herindeling van de volledige verdieping',
      'Maatwerk keuken met natuurstenen werkblad',
      'Twee en-suite badkamers',
      'Domotica voor verlichting, zonwering en klimaat',
      'Akoestische maatregelen en vloerverwarming'
    ],
    resultaten: [
      'Woonoppervlak optimaal benut voor licht en uitzicht',
      'Opgeleverd binnen de afgesproken planning',
      'Hoge waardestijging ten opzichte van aankoop'
    ],
    feiten: { type: 'Penthouse', oppervlakte: '186 m²', oplevering: 'September 2025', status: 'Bewoond' },
    uitgelichte_afbeelding: 'penthouse-kop-van-zuid.webp',
    fotos: gallery('penthouse-kop-van-zuid', 5)
  },
  {
    slug: 'kantoorvilla-statenkwartier',
    titel: 'Kantoorvilla Statenkwartier',
    categorie: 'bedrijfspand',
    locatie: 'Den Haag',
    adres: 'Frederik Hendriklaan 58, 2582 BW Den Haag',
    datum: '2025-07',
    korte_beschrijving: 'Een statige villa herbestemd tot representatief kantoor voor een advocatenkantoor.',
    beschrijving: [
      'Deze karakteristieke villa in het Statenkwartier was toe aan een tweede leven. In opdracht en in eigen beheer transformeerden wij het pand tot een representatief kantoor, met behoud van de waardige uitstraling.',
      'Functionaliteit en uitstraling gingen hier hand in hand: vergaderruimtes, een ontvangst en moderne werkplekken, ingepast in een klassieke schil.'
    ],
    werkzaamheden: [
      'Herbestemming van woon- naar kantoorfunctie',
      'Brandveiligheid en vluchtwegen conform regelgeving',
      'Nieuwe data- en netwerkinfrastructuur',
      'Klimaatinstallatie met warmtepomp',
      'Herstel van de gevel en het schilderwerk'
    ],
    resultaten: [
      'Volledig verhuurd vóór oplevering',
      'Energieprestatie sterk verbeterd',
      'Monumentale uitstraling behouden'
    ],
    feiten: { type: 'Kantoorvilla', oppervlakte: '320 m²', oplevering: 'Juli 2025', status: 'Verhuurd' },
    uitgelichte_afbeelding: 'kantoorvilla-statenkwartier.webp',
    fotos: gallery('kantoorvilla-statenkwartier', 5)
  },
  {
    slug: 'jaren30-woning-leiden',
    titel: "Jaren '30 woning Leiden",
    categorie: 'renovatie',
    locatie: 'Leiden',
    adres: 'Burggravenlaan 27, 2313 HM Leiden',
    datum: '2025-05',
    korte_beschrijving: 'Een gedateerde jaren \'30 woning duurzaam gerenoveerd met behoud van de authentieke charme.',
    beschrijving: [
      'Deze geliefde jaren \'30 woning was tientallen jaren niet aangepakt. De eigenaren wilden blijven wonen, maar dan in een comfortabel en energiezuinig huis. Wij verzorgden de volledige renovatie van plan tot oplevering.',
      'Kenmerkende details zoals de glas-in-loodramen, paneeldeuren en de schouw zijn behouden en in ere hersteld, terwijl het comfort naar 2025 is gebracht.'
    ],
    werkzaamheden: [
      'Volledige na-isolatie van dak, vloer en gevel',
      'Vervanging installaties en aansluiting warmtepomp',
      'Herstel originele glas-in-loodramen',
      'Nieuwe keuken en badkamer',
      'Schilderwerk binnen en buiten'
    ],
    resultaten: [
      'Energielabel van F naar A',
      'Stookkosten meer dan gehalveerd',
      'Authentieke uitstraling volledig behouden'
    ],
    feiten: { type: 'Tussenwoning', oppervlakte: '134 m²', oplevering: 'Mei 2025', status: 'Bewoond' },
    uitgelichte_afbeelding: 'jaren30-woning-leiden.webp',
    fotos: gallery('jaren30-woning-leiden', 6)
  },
  {
    slug: 'twee-onder-een-kap-zoetermeer',
    titel: 'Twee-onder-een-kap Zoetermeer',
    categorie: 'woning',
    locatie: 'Zoetermeer',
    adres: 'Vlamingstraat 9, 2713 RG Zoetermeer',
    datum: '2025-03',
    korte_beschrijving: 'Een ruime, energieneutrale gezinswoning ontwikkeld en gebouwd op een vrije kavel.',
    beschrijving: [
      'Op een vrije kavel ontwikkelden wij deze moderne twee-onder-een-kapwoning. Van grondaankoop tot sleuteloplevering hebben wij het hele traject begeleid.',
      'Het ontwerp combineert een tijdloze architectuur met een duurzame, gasloze installatie en doordachte indeling voor een groeiend gezin.'
    ],
    werkzaamheden: [
      'Aankoop kavel en ontwerptraject',
      'Gasloze nieuwbouw met warmtepomp en zonnepanelen',
      'Hoogwaardige schil en triple beglazing',
      'Complete afwerking en tuinaanleg'
    ],
    resultaten: [
      'Energieneutrale woning (label A+++)',
      'Opgeleverd binnen budget',
      'Tevreden bewoners sinds oplevering'
    ],
    feiten: { type: 'Twee-onder-een-kap', oppervlakte: '162 m²', oplevering: 'Maart 2025', status: 'Bewoond' },
    uitgelichte_afbeelding: 'twee-onder-een-kap-zoetermeer.webp',
    fotos: gallery('twee-onder-een-kap-zoetermeer', 5)
  },
  {
    slug: 'appartementen-de-werf-schiedam',
    titel: 'Appartementen De Werf',
    categorie: 'appartement',
    locatie: 'Schiedam',
    adres: 'Lange Haven 71, 3111 CB Schiedam',
    datum: '2025-01',
    korte_beschrijving: 'Acht stadsappartementen gerealiseerd in een voormalig pakhuis aan de Lange Haven.',
    beschrijving: [
      'Een leegstaand pakhuis aan de historische Lange Haven boden wij een nieuwe toekomst. Het pand is herontwikkeld tot acht karaktervolle stadsappartementen.',
      'De industriële sfeer van het oorspronkelijke gebouw is bewust behouden en gecombineerd met het comfort dat huurders vandaag verwachten.'
    ],
    werkzaamheden: [
      'Herontwikkeling van pakhuis naar acht woningen',
      'Constructieve aanpassingen en nieuwe trappenhuizen',
      'Individuele installaties per appartement',
      'Behoud van staalconstructie en metselwerk',
      'Gemeenschappelijke entree en bergingen'
    ],
    resultaten: [
      'Alle acht appartementen binnen een maand verhuurd',
      'Leegstaand pand teruggebracht in de stad',
      'Behoud van industrieel erfgoed'
    ],
    feiten: { type: 'Appartementencomplex (8 units)', oppervlakte: '640 m²', oplevering: 'Januari 2025', status: 'Verhuurd' },
    uitgelichte_afbeelding: 'appartementen-de-werf-schiedam.webp',
    fotos: gallery('appartementen-de-werf-schiedam', 6)
  },
  {
    slug: 'bedrijfsunit-vlaardingen',
    titel: 'Bedrijfsunit Vlaardingen',
    categorie: 'bedrijfspand',
    locatie: 'Vlaardingen',
    adres: 'Industrieweg 44, 3133 EE Vlaardingen',
    datum: '2024-11',
    korte_beschrijving: 'Een verouderde bedrijfsunit gemoderniseerd tot flexibele bedrijfsruimte met kantoor.',
    beschrijving: [
      'Deze bedrijfsunit op een goed ontsloten locatie was sterk verouderd. Wij kochten het pand aan en moderniseerden het tot een flexibel inzetbare bedrijfsruimte met representatief kantoorgedeelte.',
      'De combinatie van werkruimte, opslag en kantoor maakt het pand geschikt voor een brede groep ondernemers.'
    ],
    werkzaamheden: [
      'Aankoop en strip van de bestaande unit',
      'Nieuwe overheaddeuren en gevelbeplating',
      'Geïsoleerd kantoorgedeelte met pantry',
      'LED-verlichting en krachtstroom',
      'Bestrating en parkeerterrein'
    ],
    resultaten: [
      'Direct verhuurd na oplevering',
      'Lagere energielasten door isolatie en LED',
      'Flexibel indeelbare ruimte'
    ],
    feiten: { type: 'Bedrijfsunit', oppervlakte: '410 m²', oplevering: 'November 2024', status: 'Verhuurd' },
    uitgelichte_afbeelding: 'bedrijfsunit-vlaardingen.webp',
    fotos: gallery('bedrijfsunit-vlaardingen', 4)
  },
  {
    slug: 'grachtenpand-gouda',
    titel: 'Grachtenpand Gouda',
    categorie: 'renovatie',
    locatie: 'Gouda',
    adres: 'Turfmarkt 18, 2801 HA Gouda',
    datum: '2024-09',
    korte_beschrijving: 'Een verwaarloosd grachtenpand volledig gerenoveerd en teruggebracht in oude glorie.',
    beschrijving: [
      'Dit grachtenpand in het hart van Gouda verkeerde in vervallen staat. Met een zorgvuldige, gefaseerde renovatie hebben wij het pand constructief hersteld en bewoonbaar gemaakt.',
      'Funderingsherstel, vochtbestrijding en het herstel van de voorgevel waren bepalend voor het eindresultaat: een pand dat er weer decennia tegenaan kan.'
    ],
    werkzaamheden: [
      'Funderingsherstel en vochtbestrijding',
      'Herstel van de historische voorgevel',
      'Volledig nieuwe indeling en installaties',
      'Restauratie van houten kozijnen',
      'Nieuwe keuken en badkamers'
    ],
    resultaten: [
      'Constructief volledig hersteld',
      'Vochtproblemen definitief opgelost',
      'Beeldbepalend pand behouden voor de stad'
    ],
    feiten: { type: 'Grachtenpand', oppervlakte: '210 m²', oplevering: 'September 2024', status: 'Verkocht' },
    uitgelichte_afbeelding: 'grachtenpand-gouda.webp',
    fotos: gallery('grachtenpand-gouda', 6)
  },
  {
    slug: 'vrijstaande-villa-rijswijk',
    titel: 'Vrijstaande villa Rijswijk',
    categorie: 'woning',
    locatie: 'Rijswijk',
    adres: 'Van Vredenburchweg 211, 2284 TC Rijswijk',
    datum: '2024-06',
    korte_beschrijving: 'Een ruime vrijstaande villa aangekocht, verbouwd en met winst doorverkocht.',
    beschrijving: [
      'Deze vrijstaande villa bood veel potentie, maar was gedateerd. Wij kochten het pand aan, stelden een verbouwplan op en voerden de renovatie in eigen beheer uit.',
      'Een lichte, open leefruimte, een nieuwe keuken en een verzorgde tuin maakten het verschil bij de doorverkoop.'
    ],
    werkzaamheden: [
      'Aankoop en verbouwplan',
      'Open leefruimte en nieuwe keuken',
      'Renovatie van twee badkamers',
      'Verduurzaming en schilderwerk',
      'Aanleg van de tuin'
    ],
    resultaten: [
      'Aantrekkelijke verkoopprijs gerealiseerd',
      'Verkocht binnen een maand',
      'Comfort en uitstraling sterk verbeterd'
    ],
    feiten: { type: 'Vrijstaande villa', oppervlakte: '224 m²', oplevering: 'Juni 2024', status: 'Verkocht' },
    uitgelichte_afbeelding: 'vrijstaande-villa-rijswijk.webp',
    fotos: gallery('vrijstaande-villa-rijswijk', 5)
  },
  {
    slug: 'loft-pakhuis-rotterdam',
    titel: 'Loft-transformatie pakhuis',
    categorie: 'appartement',
    locatie: 'Rotterdam',
    adres: 'Sint-Jobskade 12, 3024 EJ Rotterdam',
    datum: '2024-03',
    korte_beschrijving: 'Een ruwe pakhuisverdieping omgevormd tot een lichte, eigentijdse loft.',
    beschrijving: [
      'Op de bovenste verdieping van een oud pakhuis realiseerden wij een ruime loft. De uitdaging: industriële ruwheid behouden en tegelijk een warme, leefbare woning maken.',
      'Grote stalen raampartijen, een vrije plattegrond en eerlijke materialen geven deze woning een uitgesproken karakter.'
    ],
    werkzaamheden: [
      'Transformatie van bedrijfs- naar woonruimte',
      'Nieuwe stalen raampartijen',
      'Open plattegrond met vrijstaand keukenblok',
      'Vloerverwarming en geluidsisolatie',
      'Maatwerk badkamer'
    ],
    resultaten: [
      'Onderscheidende woning in een gewild gebied',
      'Snel verkocht aan een enthousiaste koper',
      'Industrieel karakter optimaal benut'
    ],
    feiten: { type: 'Loft-appartement', oppervlakte: '148 m²', oplevering: 'Maart 2024', status: 'Verkocht' },
    uitgelichte_afbeelding: 'loft-pakhuis-rotterdam.webp',
    fotos: gallery('loft-pakhuis-rotterdam', 5)
  }
];

projecten.forEach(function (p) {
  const file = path.join(DIR, p.slug + '.json');
  fs.writeFileSync(file, JSON.stringify(p, null, 2) + '\n', 'utf8');
});

console.log('Geschreven: ' + projecten.length + ' projectbestanden in content/projecten/');
