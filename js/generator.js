/**
 * Soul-DNA KI-Tool-Ideen-Generator — Ideen-Engine
 *
 * Reine Logik, keine DOM-Zugriffe. Läuft im Browser (ES-Module) genauso wie
 * unter Node (für die Tests in /tests). Es wird bewusst KEINE externe KI-API
 * angesprochen — die gesamte "Intelligenz" steckt in dieser Datei als
 * deterministisches, hochwertiges Template- und Extraktions-System, das die
 * eigenen Formulierungen der Nutzer:innen aufgreift statt generische Floskeln
 * zu produzieren.
 */

// ---------------------------------------------------------------------------
// Sprach-Hilfsmittel: einfache, aber im Deutschen erstaunlich treffsichere
// Substantiv-Erkennung über Großschreibung + Stoppwortliste.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'der','die','das','den','dem','des','ein','eine','einer','einem','einen','eines',
  'ich','du','er','sie','es','wir','ihr','man','sich','mich','dich','uns','euch',
  'mein','meine','meiner','meinem','meinen','dein','deine','ihre','ihrer','ihrem','ihren',
  'und','oder','aber','doch','auch','noch','nur','schon','sehr','immer','wieder',
  'ständig','häufig','oft','dabei','dadurch','damit','davon','daher','deshalb',
  'sodass','sondern','bei','mit','für','von','vor','nach','über','unter','zwischen',
  'während','trotz','ohne','durch','um','an','auf','aus','bis','gegen','in','zu',
  'zum','zur','ist','sind','war','waren','wird','werden','wurde','kann','können',
  'muss','müssen','soll','sollen','will','wollen','habe','haben','hat','hatte',
  'möchten','möchte','dass','wenn','weil','als','wie','was','wer','wo','warum',
  'diese','dieser','dieses','diesem','diesen','jede','jeder','jedes','alle','allen',
  'kein','keine','keiner','keinem','keinen','so','denn','damit','dann','dort','hier',
  'menschen','kunden','kundinnen','personen','leute','klienten','klientinnen',
]);

const EMOTION_WORDS = new Set([
  'stress','frust','frustration','angst','ängste','streit','druck','erschöpfung',
  'überforderung','scham','zweifel','wut','sorge','sorgen','panik','blockade','chaos',
  'ohnmacht','einsamkeit','überlastung','unsicherheit','erschöpft','hilflosigkeit',
  'schuldgefühle','selbstzweifel','krise','spannung','spannungen','konflikt','konflikte',
  'müdigkeit','ärger','trauer','verzweiflung','misstrauen','erschöpfungszustände',
  'überreizung','reizbarkeit','antriebslosigkeit','perfektionismus','kontrollzwang',
]);

function tokenizeKeepCase(text) {
  return (text || '')
    .replace(/[.,;:!?()„“"'\-–—/]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function isCapitalizedNoun(word) {
  if (word.length < 4) return false;
  const first = word.charAt(0);
  if (first !== first.toUpperCase() || first === first.toLowerCase()) return false;
  if (STOPWORDS.has(word.toLowerCase())) return false;
  if (/^\d/.test(word)) return false;
  return true;
}

/** Größte, distinkteste "Subjekt"-Substantive + ein Emotionswort, falls vorhanden. */
function extractSubjectAndEmotion(text) {
  const words = tokenizeKeepCase(text);
  const nounCandidates = words.filter(isCapitalizedNoun);
  const emotion = words.find((w) => EMOTION_WORDS.has(w.toLowerCase()));

  const seen = new Set();
  const distinctNouns = [];
  for (const w of nounCandidates) {
    const key = w.toLowerCase();
    if (!seen.has(key) && key !== (emotion || '').toLowerCase()) {
      seen.add(key);
      distinctNouns.push(w);
    }
  }

  const subject = distinctNouns[0] || null;
  const secondaryNoun = distinctNouns.find((w) => w !== subject) || null;

  return {
    subject,
    emotion: emotion ? capitalize(emotion) : null,
    secondary: secondaryNoun,
  };
}

function extractTopWords(text, n = 3, exclude = null) {
  const words = tokenizeKeepCase(text)
    .filter(isCapitalizedNoun)
    .filter((w) => !exclude || !exclude.has(w.toLowerCase()));
  const seen = new Set();
  const out = [];
  const sorted = [...words].sort((a, b) => b.length - a.length);
  for (const w of sorted) {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(w);
    }
    if (out.length >= n) break;
  }
  return out;
}

function capitalize(w) {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function truncate(text, maxLen = 90) {
  if (!text) return '';
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

function stripTrailingDot(s) {
  return (s || '').trim().replace(/[.\s]+$/, '');
}

/** Entfernt ein einleitendes Feld-Label wie "Meine Soul-Autoritäts-Signatur: " */
function stripLabelPrefix(text) {
  const m = (text || '').match(/^[^:\n]{0,60}:\s*([\s\S]*)$/);
  return (m ? m[1] : text || '').trim();
}

const META_LABEL_WORDS = new Set(['soul', 'autorität', 'autoritäts', 'autoritäten', 'signatur', 'zukunft', 'zukunfts', 'profil']);

function lowerFirst(s) {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// deterministischer Hash → stabile, aber eingabe-abhängige Auswahl aus Wortbänken
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick(arr, seedStr, salt = '') {
  const h = hashSeed(String(seedStr) + '::' + salt);
  return arr[h % arr.length];
}

// ---------------------------------------------------------------------------
// Wortbänke
// ---------------------------------------------------------------------------

const SUFFIX_DIAGNOSE = ['Kompass', 'Code', 'Spiegel', 'Barometer'];
const SUFFIX_STRATEGIE = ['Wegweiser', 'Weiche', 'Fahrplan', 'Kurswechsel'];
const SUFFIX_SIMULATOR = ['Zukunftsbild', 'Aufbruch', 'Zielbild', 'Wandel-Weg'];
const SUFFIX_TYPANALYSE = ['Typ', 'Reaktions-Typ', 'Muster-Typ', 'Profil'];
const SUFFIX_MATCHER = ['Fit-Check', 'Bereitschafts-Check', 'Passungs-Check', 'Match'];

const FALSE_ASSUMPTIONS = ['unmotiviert', 'schwierig', 'nicht willens', 'desinteressiert', 'stur'];
const WRONG_REFLEXES = ['mehr Druck', 'mehr Kontrolle', 'mehr Ermahnungen', 'noch mehr Erklärungen', 'noch mehr Disziplin'];

const RESULT_ADJECTIVES = ['stille', 'unsichtbare', 'heimliche', 'verborgene', 'eigentliche'];

// Jedes Archetyp bekommt sein eigenes festes Muster-Substantiv, damit sich
// Ergebnis-Namen zwischen den 5 Ideen niemals zufällig überschneiden können.
const PAIN_PATTERN_BY_ARCH = {
  diagnose: { art: 'Die', noun: 'Falle' },
  typanalyse: { art: 'Der', noun: 'Reflex' },
  matcher: { art: 'Die', noun: 'Spirale' },
  strategie: { art: 'Der', noun: 'Kreislauf' },
};

const FUTURE_ADJECTIVES = ['klare', 'greifbare', 'persönliche', 'naheliegende'];

// ---------------------------------------------------------------------------
// Kontext-Aufbau
// ---------------------------------------------------------------------------

function buildContext(raw) {
  const niche = (raw.niche || '').trim();
  const target = (raw.target || '').trim();
  const problem = (raw.problem || '').trim();
  const dream = (raw.dream || '').trim();
  const offer = (raw.offer || '').trim();
  const expertise = (raw.expertise || '').trim();
  const soul = (raw.soul || '').trim();
  const future = (raw.future || '').trim();

  const soulClean = soul ? stripLabelPrefix(soul) : '';
  const futureClean = future ? stripLabelPrefix(future) : '';

  const problemEx = extractSubjectAndEmotion(problem);
  const dreamEx = extractSubjectAndEmotion(dream);
  const targetEx = extractSubjectAndEmotion(target);
  const expertiseTop = extractTopWords(expertise, 2);
  const soulTop = soulClean ? extractTopWords(soulClean, 2, META_LABEL_WORDS) : [];
  const futureTop = futureClean ? extractTopWords(futureClean, 2, META_LABEL_WORDS) : [];

  const subjectWord = problemEx.subject || targetEx.subject || extractTopWords(niche, 1)[0] || 'Situation';
  const emotionWord = problemEx.emotion || null;
  const secondaryWord = emotionWord || problemEx.secondary || targetEx.subject || 'Muster';
  const dreamWord = dreamEx.subject || dreamEx.emotion || extractTopWords(dream, 1)[0] || 'Ziel';

  return {
    niche, target, problem, dream, offer, expertise, soul, future,
    soulClean, futureClean,
    subjectWord, emotionWord, secondaryWord, dreamWord,
    expertiseTop, soulTop, futureTop,
    hasSoul: soul.length > 0,
    hasFuture: future.length > 0,
    targetShort: stripTrailingDot(truncate(target, 70)),
    problemShort: stripTrailingDot(truncate(problem, 90)),
    dreamShort: stripTrailingDot(truncate(dream, 90)),
    offerShort: stripTrailingDot(truncate(offer, 70)),
    futureShort: stripTrailingDot(truncate(futureClean, 90)),
    seedBase: `${niche}|${target}|${problem}|${dream}|${offer}|${expertise}`,
  };
}

function resultName(ctx, archKey, wordOverride) {
  const adj = pick(RESULT_ADJECTIVES, ctx.seedBase, archKey + 'adj');
  const pattern = PAIN_PATTERN_BY_ARCH[archKey];
  const word = wordOverride || ctx.secondaryWord || ctx.subjectWord;
  return `${pattern.art} ${adj} ${word}-${pattern.noun}`;
}

function resultNameFuture(ctx, wordOverride) {
  const adj = pick(FUTURE_ADJECTIVES, ctx.seedBase, 'sim-adj');
  const word = wordOverride || ctx.dreamWord;
  return `Das ${adj} ${word}-Zukunftsbild`;
}

function wowMoment(ctx, salt, deeperCauseOverride) {
  const assumption = pick(FALSE_ASSUMPTIONS, ctx.seedBase, salt + 'assume');
  const reflex = pick(WRONG_REFLEXES, ctx.seedBase, salt + 'reflex');
  const deeperCause = deeperCauseOverride ||
    (ctx.expertise
      ? `genau das, was Ihre Methode aufdeckt: ${lowerFirst(stripTrailingDot(ctx.expertise))}`
      : `eine tiefer liegende Ursache, die auf den ersten Blick unsichtbar bleibt`);
  return `„Oh – das liegt also gar nicht daran, dass hier einfach jemand ${assumption} ist!“ Dahinter steckt eher ${deeperCause}, und ${reflex} verstärkt genau dieses Muster.`;
}

function nextStepFor(archKey, ctx) {
  const offer = ctx.offerShort || 'Ihr Angebot';
  switch (archKey) {
    case 'diagnose':
      return `Kurzes 4-Minuten-Video „So lösen Sie das sichtbar gewordene Muster“ → direkter Termin-Kalender für ${offer}.`;
    case 'strategie':
      return `Mini-Guide/PDF mit dem passenden nächsten Schritt → Termin-Kalender für ${offer}.`;
    case 'simulator':
      return `Einladung zu einem Live-Workshop/Webinar, in dem der Weg zum Zielbild konkret wird → Übergang zu ${offer}.`;
    case 'typanalyse':
      return `Vertiefender Check zum eigenen Typ per E-Mail → persönlicher Termin-Kalender für ${offer}.`;
    case 'matcher':
      return `Direkter Sprung auf die Angebotsseite von ${offer} mit persönlicher Terminbuchung.`;
    default:
      return `Persönlicher Termin-Kalender für ${offer}.`;
  }
}

// ---------------------------------------------------------------------------
// Die 5 Archetypen
// ---------------------------------------------------------------------------

function ideaDiagnose(ctx) {
  const suffix = pick(SUFFIX_DIAGNOSE, ctx.seedBase, 'diagnose-suffix');
  const primary = ctx.subjectWord;
  const secondary = ctx.secondaryWord && ctx.secondaryWord.toLowerCase() !== primary.toLowerCase() ? ctx.secondaryWord : null;
  const toolName = secondary ? `${primary}-${secondary}-${suffix}` : `${primary}-${suffix}`;
  const dims = [ctx.emotionWord, 'Auslöser-Momente', 'typische Reaktion', 'Erwartungsdruck', 'Energie im Alltag'].filter(Boolean);
  const n = 6;
  const rName = resultName(ctx, 'diagnose', secondary || primary);

  const categoryReason = `Bei „${ctx.problemShort}“ hilft zuerst eine ehrliche Standortbestimmung, keine fertige Lösung – genau das leistet eine Diagnose, bevor irgendein Rat greifen kann.`;
  const formatReason = `Eine Scorecard macht in wenigen Minuten aus vielen kleinen Alltagsmomenten ein klares, persönliches Bild – ohne dass sich jemand bloßgestellt fühlt.`;
  const benefit = `Ihre Wunsch-Kundin erkennt in wenigen Minuten, warum „${ctx.problemShort}“ wirklich passiert – und was sie als Erstes anders machen kann.`;
  const inputDescription = `${n} Fragen zu ${dims.slice(0, 4).join(', ')} und ${dims[4] || 'Kommunikation im Alltag'}.`;
  const result = `Hauptursache erkennen + persönliche Einordnung als „${rName}“ + ein konkreter erster Veränderungs-Schritt.`;
  const acuteProblem = `${capitalize(ctx.problemShort)}.`;
  const wow = wowMoment(ctx, 'diagnose');
  const immediateAction = `Die erkannte Ursache offen ansprechen und gemeinsam einen einzigen, ganz kleinen ersten Schritt festlegen – nicht die ganze Lösung auf einmal.`;
  const avoidAction = `Nicht mit ${pick(WRONG_REFLEXES, ctx.seedBase, 'diagnose-avoid')} reagieren, auch wenn der Impuls verständlich ist.`;
  const prognosis = `Bleibt das Muster unbeachtet, wiederholt sich „${ctx.problemShort}“ vermutlich weiter. Wird die erkannte Ursache gezielt angegangen, entsteht spürbar mehr Ruhe und Fortschritt in Richtung „${ctx.dreamShort}“.`;

  return {
    archKey: 'diagnose',
    category: 'Diagnose',
    format: 'Scorecard',
    toolName, categoryReason, formatReason, benefit, inputDescription, result,
    acuteProblem, wowMoment: wow, resultName: rName, immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('diagnose', ctx),
    buildTime: 'ca. 30–45 Min.',
  };
}

function ideaStrategie(ctx) {
  const suffix = pick(SUFFIX_STRATEGIE, ctx.seedBase, 'strategie-suffix');
  const word = ctx.dreamWord && ctx.dreamWord.toLowerCase() !== ctx.subjectWord.toLowerCase() ? ctx.dreamWord : ctx.subjectWord;
  const toolName = `${word}-${suffix}`;
  const rName = resultName(ctx, 'strategie', ctx.dreamWord);

  const categoryReason = `Sobald der Ist-Zustand klar ist, entscheidet die richtige nächste Handlung über Fortschritt oder Stillstand – eine Strategie-Idee macht genau diese Entscheidung greifbar.`;
  const formatReason = `Eine Entscheidungs-Hilfe führt Schritt für Schritt zu einer klaren Empfehlung, statt mit noch mehr Optionen zu überfordern.`;
  const benefit = `Ihre Wunsch-Kundin bekommt eine klare, auf ihre Situation zugeschnittene Empfehlung, welcher Weg jetzt der richtige ist – statt sich zwischen zu vielen Optionen zu verlieren.`;
  const inputDescription = `5 Fragen zu aktueller Vorgehensweise, Zeitdruck, bisherigen Versuchen, Unterstützung im Umfeld und gewünschtem Tempo.`;
  const result = `Klare Weg-Empfehlung + persönliche Einordnung als „${rName}“ + ein konkreter nächster Meilenstein.`;
  const acuteProblem = `Viele in dieser Situation wissen nicht mehr, was als Nächstes wirklich sinnvoll ist, und verlieren sich in Grübeln statt zu handeln.`;
  const wow = wowMoment(ctx, 'strategie', ctx.expertise ? `nicht fehlende Motivation, sondern das Fehlen eines klaren nächsten Schritts – genau hier setzt „${ctx.expertise ? lowerFirst(stripTrailingDot(ctx.expertise)) : 'Ihre Methode'}“ an` : null);
  const immediateAction = `Den einen nächsten Schritt festlegen und terminieren, statt gleichzeitig an mehreren Fronten etwas zu ändern.`;
  const avoidAction = `Nicht parallel drei verschiedene Ansätze gleichzeitig ausprobieren – das erzeugt zusätzliche Verunsicherung.`;
  const prognosis = `Ohne klare Entscheidung bleibt das Gefühl von Stillstand vermutlich bestehen. Mit einem klaren nächsten Schritt entsteht spürbar schneller Bewegung Richtung „${ctx.dreamShort}“.`;

  return {
    archKey: 'strategie',
    category: 'Strategie',
    format: 'Entscheidungs-Hilfe',
    toolName, categoryReason, formatReason, benefit, inputDescription, result,
    acuteProblem, wowMoment: wow, resultName: rName, immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('strategie', ctx),
    buildTime: 'ca. 30–45 Min.',
  };
}

function ideaSimulator(ctx) {
  const suffix = pick(SUFFIX_SIMULATOR, ctx.seedBase, 'sim-suffix');
  let word = ctx.dreamWord;
  let categoryReason;
  let toolName;
  let rName;

  if (ctx.hasFuture && ctx.futureTop[0]) {
    word = ctx.futureTop[0];
    toolName = `${word}-${suffix}`;
    categoryReason = `Ihr Zukunfts-Profil beschreibt bereits, wohin die Reise geht – ein Simulator macht dieses Zielbild schon heute erlebbar, statt es abstrakt zu lassen.`;
    rName = resultNameFuture(ctx, word);
  } else {
    toolName = `${word}-${suffix}`;
    categoryReason = `Ihre Wunsch-Kunden können sich „${ctx.dreamShort}“ oft noch nicht wirklich vorstellen – ein Simulator macht dieses Zukunftsbild schon heute spürbar.`;
    rName = resultNameFuture(ctx, word);
  }

  const formatReason = `Ein Roadmap-Canvas verbindet das Zukunftsbild mit dem heutigen Stand zu einem sichtbaren Weg – das macht Sehnsucht handhabbar statt diffus.`;
  const benefit = `Ihre Wunsch-Kundin sieht schwarz auf weiß, wie „${ctx.dreamShort}“ für sie konkret aussehen könnte – und welcher Weg dorthin realistisch ist.`;
  const inputDescription = `5 Fragen zu Wunschbild in einigen Monaten, größter Sehnsucht, bisherigen Hindernissen und vorhandenen Ressourcen.`;
  const result = `Persönliches Zukunftsbild + Einordnung als „${rName}“ + der erste machbare Schritt auf dem Weg dorthin.`;
  const acuteProblem = `Die Sehnsucht nach „${ctx.dreamShort}“ ist da – aber sie fühlt sich weit weg und unklar an, wie man dort wirklich hinkommt.`;
  const wow = ctx.hasFuture && ctx.futureShort
    ? `„Oh, das ist gar nicht so weit weg, wie ich dachte!“ Der Weg zu „${ctx.futureShort}“ lässt sich in konkrete, machbare Etappen zerlegen – man muss nur den ersten wirklich gehen.`
    : `„Oh, das ist gar nicht so weit weg, wie ich dachte!“ Der Weg zu „${ctx.dreamShort}“ lässt sich in konkrete, machbare Etappen zerlegen – man muss nur den ersten wirklich gehen.`;
  const immediateAction = `Die erste, kleinste Etappe der Roadmap diese Woche angehen – nicht das große Ziel auf einmal.`;
  const avoidAction = `Nicht das gesamte Ziel auf einmal erreichen wollen – das führt meist zu Überforderung und Rückzug.`;
  const prognosis = `Bleibt das Zukunftsbild vage, verschiebt sich der erste Schritt wahrscheinlich weiter. Wird er konkret geplant, rückt „${ctx.dreamShort}“ spürbar näher.`;

  return {
    archKey: 'simulator',
    category: 'Simulator',
    format: 'Roadmap-Canvas',
    toolName, categoryReason, formatReason, benefit, inputDescription, result,
    acuteProblem, wowMoment: wow, resultName: rName, immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('simulator', ctx),
    buildTime: 'ca. 45–60 Min.',
  };
}

function ideaTypanalyse(ctx) {
  const suffix = pick(SUFFIX_TYPANALYSE, ctx.seedBase, 'typ-suffix');
  const word = ctx.targetShort ? (extractTopWords(ctx.target, 1)[0] || ctx.subjectWord) : ctx.subjectWord;
  const toolName = `${word}-${suffix}`;
  const rName = resultName(ctx, 'typanalyse', ctx.subjectWord);

  const categoryReason = `„${ctx.problemShort}“ folgt fast immer einem wiederkehrenden Muster – ein Audit macht dieses Muster sichtbar und einordenbar, statt nur den Einzelfall zu betrachten.`;
  const formatReason = `Eine Typ-Analyse übersetzt ein komplexes Verhaltensmuster in ein einfaches, merkbares Ergebnis – das fühlt sich persönlich an und lädt zum Teilen ein.`;
  const benefit = `Ihre Wunsch-Kundin erkennt ihr eigenes wiederkehrendes Muster in stressigen Momenten – und versteht endlich, warum alte Lösungsversuche nicht dauerhaft wirken.`;
  const inputDescription = `6 Fragen zu typischer Reaktion in Stress-Momenten, Kommunikationsstil, Entscheidungsverhalten und Umgang mit Rückschlägen.`;
  const result = `Persönlicher Muster-Typ mit Namen wie „${rName}“ + Einordnung, warum genau dieser Typ entsteht + ein typgerechter erster Hebel.`;
  const acuteProblem = `Immer wieder dieselbe Reaktion, obwohl sie erkennbar nicht weiterhilft – ohne zu verstehen, woher dieses Muster eigentlich kommt.`;
  const wow = wowMoment(ctx, 'typ');
  const immediateAction = `Den eigenen Muster-Typ bewusst beim nächsten kritischen Moment beobachten, bevor reagiert statt reflektiert wird.`;
  const avoidAction = `Nicht versuchen, das Muster mit reiner Willenskraft "einfach" zu unterdrücken – das hält meist nur kurz.`;
  const prognosis = `Unbeachtet wiederholt sich das Muster vermutlich in der nächsten vergleichbaren Situation. Erkannt und gezielt unterbrochen, verändert es sich spürbar schneller als gedacht.`;

  return {
    archKey: 'typanalyse',
    category: 'Analyse/Audit',
    format: 'Typ-Analyse',
    toolName, categoryReason, formatReason, benefit, inputDescription, result,
    acuteProblem, wowMoment: wow, resultName: rName, immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('typanalyse', ctx),
    buildTime: 'ca. 45–60 Min.',
  };
}

function ideaMatcher(ctx) {
  const suffix = pick(SUFFIX_MATCHER, ctx.seedBase, 'match-suffix');
  const word = extractTopWords(ctx.offer, 1)[0] || ctx.subjectWord;
  const toolName = `${word}-${suffix}`;
  const rName = resultName(ctx, 'matcher', word);

  const categoryReason = `Die entscheidende Frage ist hier nicht „was ist falsch“, sondern „passt ${ctx.offerShort || 'dieses Angebot'} jetzt wirklich zu mir“ – ein Matcher macht genau diese Passung sichtbar.`;
  const formatReason = `Ein Reifegrad-Check zeigt ehrlich, wie nah jemand am nächsten sinnvollen Schritt bereits ist – das senkt die Hürde für eine Kauf-Entscheidung spürbar.`;
  const benefit = `Ihre Wunsch-Kundin erkennt schwarz auf weiß, wie bereit sie für „${ctx.offerShort || 'den nächsten Schritt'}“ wirklich ist – und was genau noch fehlt.`;
  const inputDescription = `5 Fragen zu aktueller Situation im Vergleich zum Ziel, Dringlichkeit, vorhandenen Ressourcen und bisherigen Lösungsversuchen.`;
  const result = `Persönlicher Reifegrad + Einordnung als „${rName}“ + eine klare Ja/Noch-nicht-Empfehlung für den nächsten Schritt.`;
  const acuteProblem = `Viele zögern lange, ob „${ctx.offerShort || 'ein nächster Schritt'}“ für sie schon der richtige ist – und verschieben die Entscheidung dadurch immer weiter.`;
  const wow = wowMoment(ctx, 'match', ctx.expertise ? `nicht fehlende Bereitschaft, sondern eine unklare Passung – genau das klärt ${ctx.expertise ? lowerFirst(stripTrailingDot(ctx.expertise)) : 'Ihre Methode'}` : null);
  const immediateAction = `Die eine offene Lücke aus dem Ergebnis konkret benennen und aktiv ansprechen, statt sie zu verdrängen.`;
  const avoidAction = `Die Entscheidung nicht erneut vertagen, nur weil noch nicht alles perfekt passt.`;
  const prognosis = `Bleibt die Passungsfrage offen, verschiebt sich die Entscheidung wahrscheinlich weiter. Wird sie geklärt, fällt der nächste Schritt spürbar leichter.`;

  return {
    archKey: 'matcher',
    category: 'Matcher',
    format: 'Reifegrad-Check',
    toolName, categoryReason, formatReason, benefit, inputDescription, result,
    acuteProblem, wowMoment: wow, resultName: rName, immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('matcher', ctx),
    buildTime: 'ca. 20–30 Min.',
  };
}

const ARCHETYPE_ORDER = [ideaDiagnose, ideaTypanalyse, ideaSimulator, ideaMatcher, ideaStrategie];

// ---------------------------------------------------------------------------
// Soul-DNA-Prägung: Signatur & Zukunfts-Profil verändern sichtbar Sprache,
// Positionierung und (bei Top- & Zukunfts-Idee) den Namen.
// ---------------------------------------------------------------------------

function applySoulDna(idea, ctx, isTop) {
  let { toolName, categoryReason, benefit, resultName: rName } = idea;
  let positioning = null;

  if (ctx.hasSoul) {
    const soulWord = ctx.soulTop[0];
    positioning = `Sprache, Auswertung und Übergang zum Angebot spiegeln Ihre Soul-Autoritäts-Signatur – Ihre Wirkung ist im Tool spürbar, nicht nur behauptet.`;
    categoryReason += ` Das passt zugleich zu Ihrer Soul-Autoritäts-Signatur: ${truncate(ctx.soulClean, 110)}`;
    benefit += ` Dabei ist die Handschrift Ihrer eigenen Haltung${soulWord ? ` – Stichwort „${soulWord}“` : ''} klar erkennbar.`;
    if (isTop && soulWord) {
      rName = `${rName} – ${soulWord}-Prägung`;
      toolName = `${toolName} (Signature Edition)`;
    }
  }

  if (ctx.hasFuture) {
    const futureWord = ctx.futureTop[0];
    positioning = (positioning ? positioning + ' ' : '') +
      `Die Ausrichtung folgt zusätzlich Ihrem Zukunfts-Profil${futureWord ? ` – besonders dem Fokus auf „${futureWord}“` : ''}, damit Wunsch-Kunden schon heute Ihre künftige Positionierung erleben.`;
  }

  return { ...idea, toolName, categoryReason, benefit, resultName: rName, positioning };
}

// ---------------------------------------------------------------------------
// Bau-Prompt
// ---------------------------------------------------------------------------

function buildPrompt(idea, ctx, index) {
  const lines = [];
  lines.push(`# Bau-Prompt: ${idea.toolName}`);
  lines.push('');
  lines.push(`Baue ein eigenständiges, interaktives Web-Tool namens "${idea.toolName}" als Lead-Magnet.`);
  lines.push('');
  lines.push('## Tool-Ziel');
  lines.push(idea.benefit);
  lines.push('');
  lines.push('## Zielgruppe');
  lines.push(ctx.target);
  lines.push('');
  lines.push('## Akutes Problem, das sichtbar gemacht wird');
  lines.push(idea.acuteProblem);
  lines.push('');
  lines.push('## Nutzen für die Nutzerin/den Nutzer');
  lines.push(idea.benefit);
  lines.push('');
  lines.push('## Nutzereingaben');
  lines.push(idea.inputDescription);
  lines.push('');
  lines.push('## Auswertungslogik');
  lines.push(`Kategorie: ${idea.category} · Format: ${idea.format}.`);
  lines.push(`Die Eingaben ergeben ein persönliches Ergebnis (nicht nur eine Zahl). Beispiel-Ergebnisname: "${idea.resultName}". Erzeuge 3 unterschiedliche, ähnlich benannte Ergebnis-Profile, zwischen denen je nach Antwortmuster unterschieden wird.`);
  lines.push(`Ergebnis-Aufbau: ${idea.result}`);
  lines.push('');
  lines.push('## WOW-Erkenntnis, die im Ergebnis vermittelt wird');
  lines.push(idea.wowMoment);
  lines.push('');
  lines.push('## Sofort-Empfehlung im Ergebnis');
  lines.push(idea.immediateAction);
  lines.push('');
  lines.push('## Was im Ergebnis explizit von "was nicht tun" abgeraten wird');
  lines.push(idea.avoidAction);
  lines.push('');
  lines.push('## Mini-Prognose im Ergebnis');
  lines.push(idea.prognosis);
  lines.push('');
  lines.push('## Nächster Conversion-Schritt nach dem Ergebnis');
  lines.push(idea.nextStep);
  lines.push('');
  lines.push('## Haupt-Angebot, auf das das Tool vorbereitet');
  lines.push(ctx.offer);
  lines.push('');
  lines.push('## Besondere Expertise / eigene Methode (soll im Ton spürbar sein)');
  lines.push(ctx.expertise);
  if (ctx.hasSoul) {
    lines.push('');
    lines.push('## Soul-Autoritäts-Signatur (muss Sprache, Haltung und Positionierung des Tools prägen, nicht nur erwähnt werden)');
    lines.push(ctx.soul);
  }
  if (ctx.hasFuture) {
    lines.push('');
    lines.push('## Zukunfts-Profil (muss Positionierung und Übergang zum Angebot prägen)');
    lines.push(ctx.future);
  }
  lines.push('');
  lines.push('## Design');
  lines.push('Kräftiges DSC-Blau #016E8E, helle Premium-Flächen (Off-White), Champagner/Gold (#C9A24B) ausschließlich für Sterne, Top-Empfehlung, Scores und Highlights. Weiße/offwhite Karten mit großzügigen Rundungen, großzügige Weißräume, hochwertige und sehr gut lesbare Typografie für eine Zielgruppe 45+. Primäre Buttons: Hintergrund #016E8E mit Champagner-/Gold-Schrift.');
  lines.push('');
  lines.push('## Mobile');
  lines.push('Perfekt responsive für Mobile und Desktop, große Touch-Ziele, klare Lesbarkeit auf kleinen Bildschirmen.');
  lines.push('');
  lines.push('## Hosting');
  lines.push('Rein statisches HTML/CSS/JS, ohne Login und ohne externe API, lauffähig über GitHub Pages.');
  lines.push('');
  lines.push('## Tests');
  lines.push('Ergänze einfache automatisierte Tests für die Auswertungslogik (z. B. mit Node), die sicherstellen, dass jede Antwortkombination zu einem sinnvollen, vollständigen Ergebnis führt.');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Öffentliche API
// ---------------------------------------------------------------------------

export function generateIdeas(rawInputs) {
  const ctx = buildContext(rawInputs);

  const ideas = ARCHETYPE_ORDER.map((fn, i) => {
    const base = fn(ctx);
    const withSoul = applySoulDna(base, ctx, i === 0);
    return {
      id: `idea-${i + 1}`,
      rank: i + 1,
      isTop: i === 0,
      ...withSoul,
    };
  });

  const topReason = `Diese Idee trifft mit „${ctx.problemShort}“ direkt den wundesten Punkt Ihrer Wunsch-Kunden und liefert in wenigen Minuten einen Aha-Moment${ctx.hasSoul ? ', der Ihre eigene Haltung spürbar macht' : ''}. Aus dem Ergebnis entsteht ein natürlicher Übergang zu „${ctx.offerShort || 'Ihrem Angebot'}“, ohne verkäuferisch zu wirken.`;

  ideas[0].topReason = topReason;

  ideas.forEach((idea) => {
    idea.buildPrompt = buildPrompt(idea, ctx, idea.rank);
  });

  return { ideas, ctx };
}

export const __internal = {
  extractSubjectAndEmotion,
  extractTopWords,
  buildContext,
  truncate,
};
