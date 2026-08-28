/**
 * Soul-DNA KI-Tool-Ideen-Generator — Ideen-Engine
 *
 * Reine Logik, keine DOM-Zugriffe. Läuft im Browser (ES-Module) genauso wie
 * unter Node (für die Tests in /tests). Es wird bewusst KEINE externe KI-API
 * angesprochen — die gesamte "Intelligenz" steckt in dieser Datei als
 * deterministisches, hochwertiges Template- und Extraktions-System, das die
 * eigenen Formulierungen der Nutzer:innen aufgreift statt generische Floskeln
 * zu produzieren. Tool-Namen bleiben bewusst einfache, sofort verständliche
 * Wörter oder Kunden-Fragen — keine abstrakten Kunstbegriffe.
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
  // Häufige Adjektive/Pronomen, die nur am Satzanfang großgeschrieben sind
  // und sonst niemals als eigenständiges Substantiv taugen.
  'kleine','kleiner','kleines','kleinen','große','großer','großes','großen',
  'beide','beides','beiden','viele','vieles','wenige','weniges',
  'manche','manches','einige','einiges','andere','anderer','anderes','anderen',
  'ganze','ganzer','ganzes','ganzen','neue','neuer','neues','neuen',
  'alte','alter','altes','alten','gute','guter','gutes','guten',
  'schlechte','schlechter','schlechtes','schlechten',
  'erste','erster','erstes','ersten','letzte','letzter','letztes','letzten',
  'solche','solcher','solches','solchen',
]);

const EMOTION_WORDS = new Set([
  'stress','frust','frustration','angst','ängste','streit','druck','erschöpfung',
  'überforderung','scham','zweifel','wut','sorge','sorgen','panik','blockade','chaos',
  'ohnmacht','einsamkeit','überlastung','unsicherheit','erschöpft','hilflosigkeit',
  'schuldgefühle','selbstzweifel','krise','spannung','spannungen','konflikt','konflikte',
  'müdigkeit','ärger','trauer','verzweiflung','misstrauen','erschöpfungszustände',
  'überreizung','reizbarkeit','antriebslosigkeit','perfektionismus','kontrollzwang',
]);

// Generische Angebots-/Format-Wörter, die als Tool-Namen-Bestandteil zu
// unspezifisch wären (z. B. "Coaching-Potenzial-Check" statt "Eltern-Potenzial-Check").
const GENERIC_OFFER_WORDS = new Set([
  'coaching','beratung','training','programm','mentoring','workshop',
  'begleitung','coach','berater','beraterin', 'seminar', 'kurs',
]);

function tokenizeKeepCase(text) {
  return (text || '')
    .replace(/[.,;:!?()„“"'\-–—/]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

// Kurze, generische "Füllwörter", die zwar großgeschrieben sind, aber kein
// eigenes Thema tragen (z. B. "am Ende", "im Fall", "auf diese Weise") und
// daher als Tool-Namen-Bestandteil ungeeignet wären.
const FILLER_NOUNS = new Set([
  'ende', 'anfang', 'beginn', 'mal', 'seite', 'punkt', 'sache', 'ding',
  'moment', 'fall', 'weise', 'art', 'teil', 'stelle', 'stück', 'zeit',
]);

function isCapitalizedNoun(word) {
  if (word.length < 4) return false;
  const first = word.charAt(0);
  if (first !== first.toUpperCase() || first === first.toLowerCase()) return false;
  if (STOPWORDS.has(word.toLowerCase())) return false;
  if (FILLER_NOUNS.has(word.toLowerCase())) return false;
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
  // Für das zweite Wort lieber das längste (spezifischste) verbleibende
  // Substantiv nehmen statt einfach das nächste im Text — das vermeidet
  // zufällige Nebenwörter als Namensbestandteil.
  const secondaryNoun = [...distinctNouns]
    .filter((w) => w !== subject)
    .sort((a, b) => b.length - a.length)[0] || null;

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
// Wortbänke — ausschließlich einfache, alltagssprachliche Wörter.
// ---------------------------------------------------------------------------

const SUFFIX_DIAGNOSE = ['Kompass', 'Check', 'Spiegel', 'Barometer'];
const SUFFIX_STRATEGIE = ['Wegweiser', 'Fahrplan', 'Kurswechsel'];
const SUFFIX_SIMULATOR = ['Zukunftsbild', 'Zielbild', 'Aufbruch', 'Vision'];
const SUFFIX_TYPANALYSE = ['Check', 'Analyse'];
const SUFFIX_MATCHER = ['Potenzial-Check', 'Bereitschafts-Check', 'Fit-Check'];

const FALSE_ASSUMPTIONS = ['unmotiviert', 'schwierig', 'nicht willens', 'desinteressiert', 'stur'];
const WRONG_REFLEXES = ['mehr Druck', 'mehr Kontrolle', 'mehr Ermahnungen', 'noch mehr Erklärungen', 'noch mehr Disziplin'];

const RESULT_ADJECTIVES = ['stille', 'unsichtbare', 'heimliche', 'verborgene', 'eigentliche'];

// Jedes Archetyp bekommt sein eigenes festes Muster-Substantiv, damit sich
// Hauptursache-Namen zwischen den 5 Ideen niemals zufällig überschneiden können.
const PAIN_PATTERN_BY_ARCH = {
  diagnose: { art: 'Die', noun: 'Falle' },
  typanalyse: { art: 'Der', noun: 'Reflex' },
  matcher: { art: 'Die', noun: 'Spirale' },
  strategie: { art: 'Der', noun: 'Kreislauf' },
};

const FUTURE_ADJECTIVES = ['klare', 'greifbare', 'persönliche', 'naheliegende'];

// "Warum diese Idee stark ist" — je Archetyp eine feste, aber idee-spezifisch
// eingesetzte Begründung (siehe buildWhyStrong).
const ARCH_STRENGTH_LABEL = {
  diagnose: 'macht die konkrete Ursache hinter dem akuten Problem sichtbar',
  typanalyse: 'bringt ein wiederkehrendes Muster ans Licht, das bisher niemand richtig benennen konnte',
  simulator: 'macht ein fernes Zukunftsbild schon heute greifbar',
  matcher: 'schafft Klarheit genau in dem Moment, in dem eine Entscheidung ansteht',
  strategie: 'nimmt die Überforderung durch zu viele Optionen und liefert eine einzige klare Empfehlung',
};

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
  const nicheTop = extractTopWords(niche, 2, GENERIC_OFFER_WORDS);

  const subjectWord = problemEx.subject || targetEx.subject || extractTopWords(niche, 1)[0] || 'Situation';
  const emotionWord = problemEx.emotion || null;
  const secondaryWord = emotionWord || problemEx.secondary || targetEx.subject || 'Muster';
  const dreamWord = dreamEx.subject || dreamEx.emotion || extractTopWords(dream, 1)[0] || 'Ziel';
  const audienceWord = nicheTop[0] || subjectWord;

  return {
    niche, target, problem, dream, offer, expertise, soul, future,
    soulClean, futureClean,
    subjectWord, emotionWord, secondaryWord, dreamWord, audienceWord,
    expertiseTop, soulTop, futureTop, nicheTop,
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

// ---------------------------------------------------------------------------
// Hauptursache: quoted, menschlicher Name + 1 Satz konkrete Erklärung.
// ---------------------------------------------------------------------------

function mainCauseName(ctx, archKey, wordOverride) {
  const adj = pick(RESULT_ADJECTIVES, ctx.seedBase, archKey + 'adj');
  const pattern = PAIN_PATTERN_BY_ARCH[archKey];
  const word = wordOverride || ctx.secondaryWord || ctx.subjectWord;
  return `${pattern.art} ${adj} ${word}-${pattern.noun}`;
}

function mainCauseNameFuture(ctx, wordOverride) {
  const adj = pick(FUTURE_ADJECTIVES, ctx.seedBase, 'sim-adj');
  const word = wordOverride || ctx.dreamWord;
  return `Das ${adj} ${word}-Zukunftsbild`;
}

function mainCauseExplanation(ctx, archKey) {
  const methodClause = lowerFirst(stripTrailingDot(ctx.expertise));
  switch (archKey) {
    case 'diagnose':
      return `Bei „${ctx.problemShort}“ zeigt sich immer wieder dasselbe Muster: ${methodClause}.`;
    case 'typanalyse':
      return `Immer wenn es kritisch wird, greift dasselbe Muster: ${methodClause}.`;
    case 'simulator':
      return `Der Weg zu „${ctx.dreamShort}“ stockt meist an derselben Stelle: ${methodClause}.`;
    case 'matcher':
      return `Das Zögern vor „${ctx.offerShort || 'dem nächsten Schritt'}“ hat fast immer denselben Grund: ${methodClause}.`;
    case 'strategie':
      return `Der Stillstand entsteht fast immer auf dieselbe Weise: ${methodClause}.`;
    default:
      return methodClause;
  }
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

function buildWhyStrong(ctx, archKey) {
  switch (archKey) {
    case 'diagnose':
      return `Sie beantwortet die Frage, die hinter „${ctx.problemShort}“ steckt, und macht sofort Lust auf den nächsten konkreten Schritt.`;
    case 'typanalyse':
      return `Sie macht ein Muster sichtbar, das hinter „${ctx.problemShort}“ steckt und bisher niemand richtig benennen konnte.`;
    case 'simulator':
      return `Sie macht „${ctx.dreamShort}“ schon heute greifbar und zeigt sofort einen ersten machbaren Schritt dorthin.`;
    case 'matcher':
      return `Sie beantwortet die eine Frage, die vor „${ctx.offerShort || 'einer Entscheidung'}“ im Kopf steht: Passt das jetzt wirklich zu mir?`;
    case 'strategie':
      return `Sie nimmt die Überforderung durch zu viele Optionen und liefert eine einzige klare Empfehlung auf dem Weg zu „${ctx.dreamShort}“.`;
    default:
      return ARCH_STRENGTH_LABEL[archKey] || '';
  }
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
      return `Vertiefender Check zum eigenen Muster per E-Mail → persönlicher Termin-Kalender für ${offer}.`;
    case 'matcher':
      return `Direkter Sprung auf die Angebotsseite von ${offer} mit persönlicher Terminbuchung.`;
    default:
      return `Persönlicher Termin-Kalender für ${offer}.`;
  }
}

function buildSoulFit(ctx, archKey) {
  const strength = ARCH_STRENGTH_LABEL[archKey] || 'trifft genau den Kern Ihrer Zielgruppe';
  const strengthSentence = `Diese Idee ${strength}`;

  if (ctx.hasSoul || ctx.hasFuture) {
    const source = ctx.hasSoul ? ctx.soulClean : ctx.futureClean;
    return {
      label: 'Soul-DNA-Fit',
      text: `${strengthSentence} – genau das spiegelt sich in „${truncate(source, 100)}“ wider.`,
    };
  }

  return {
    label: 'Expertise-Fit',
    text: `${strengthSentence} – genau das ist der Kern Ihrer Methode: ${lowerFirst(stripTrailingDot(ctx.expertise))}.`,
  };
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
  const causeName = mainCauseName(ctx, 'diagnose', secondary || primary);

  const categoryReason = `Stark, weil das Tool nicht nur Tipps gibt, sondern die konkrete Ursache hinter „${ctx.problemShort}“ sichtbar macht.`;
  const formatReason = `Stark, weil Ihre Wunsch-Kundin in wenigen Minuten ein persönliches Ergebnis mit klarer Einordnung bekommt – ohne sich bloßgestellt zu fühlen.`;
  const benefit = `Ihre Wunsch-Kundin erkennt in wenigen Minuten, warum „${ctx.problemShort}“ wirklich passiert – und was sie als Erstes anders machen kann.`;
  const inputDescription = `${n} Fragen zu ${dims.slice(0, 4).join(', ')} und ${dims[4] || 'Kommunikation im Alltag'}.`;
  const result = `Hauptursache erkennen + persönliche Einordnung + ein konkreter erster Veränderungs-Schritt.`;
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
    acuteProblem, wowMoment: wow,
    mainCauseName: causeName, mainCauseExplanation: mainCauseExplanation(ctx, 'diagnose'),
    whyStrong: buildWhyStrong(ctx, 'diagnose'),
    immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('diagnose', ctx),
    buildTime: 'ca. 30–45 Min.',
  };
}

function ideaStrategie(ctx) {
  const suffix = pick(SUFFIX_STRATEGIE, ctx.seedBase, 'strategie-suffix');
  const compound = `${ctx.subjectWord}-Stillstand`;
  const toolName = `Warum ${compound} einfach nicht aufhört?-${suffix}`;
  const causeName = mainCauseName(ctx, 'strategie', ctx.dreamWord);

  const categoryReason = `Stark, weil nach der Ursachen-Klarheit die richtige nächste Entscheidung über Fortschritt oder Stillstand entscheidet.`;
  const formatReason = `Stark, weil eine Entscheidungs-Hilfe Schritt für Schritt zu einer klaren Empfehlung führt, statt mit noch mehr Optionen zu überfordern.`;
  const benefit = `Ihre Wunsch-Kundin bekommt eine klare, auf ihre Situation zugeschnittene Empfehlung, welcher Weg jetzt der richtige ist – statt sich zwischen zu vielen Optionen zu verlieren.`;
  const inputDescription = `5 Fragen zu aktueller Vorgehensweise, Zeitdruck, bisherigen Versuchen, Unterstützung im Umfeld und gewünschtem Tempo.`;
  const result = `Klare Weg-Empfehlung + persönliche Einordnung der Situation + ein konkreter nächster Meilenstein.`;
  const acuteProblem = `Viele in dieser Situation wissen nicht mehr, was als Nächstes wirklich sinnvoll ist, und verlieren sich in Grübeln statt zu handeln.`;
  const wow = wowMoment(ctx, 'strategie', ctx.expertise ? `nicht fehlende Motivation, sondern das Fehlen eines klaren nächsten Schritts – genau hier setzt Ihre Methode an: ${lowerFirst(stripTrailingDot(ctx.expertise))}` : null);
  const immediateAction = `Den einen nächsten Schritt festlegen und terminieren, statt gleichzeitig an mehreren Fronten etwas zu ändern.`;
  const avoidAction = `Nicht parallel drei verschiedene Ansätze gleichzeitig ausprobieren – das erzeugt zusätzliche Verunsicherung.`;
  const prognosis = `Ohne klare Entscheidung bleibt das Gefühl von Stillstand vermutlich bestehen. Mit einem klaren nächsten Schritt entsteht spürbar schneller Bewegung Richtung „${ctx.dreamShort}“.`;

  return {
    archKey: 'strategie',
    category: 'Strategie',
    format: 'Entscheidungs-Hilfe',
    toolName, categoryReason, formatReason, benefit, inputDescription, result,
    acuteProblem, wowMoment: wow,
    mainCauseName: causeName, mainCauseExplanation: mainCauseExplanation(ctx, 'strategie'),
    whyStrong: buildWhyStrong(ctx, 'strategie'),
    immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('strategie', ctx),
    buildTime: 'ca. 30–45 Min.',
  };
}

function ideaSimulator(ctx) {
  const suffix = pick(SUFFIX_SIMULATOR, ctx.seedBase, 'sim-suffix');
  let word = ctx.dreamWord;
  let categoryReason;
  let toolName;
  let causeName;

  if (ctx.hasFuture && ctx.futureTop[0]) {
    word = ctx.futureTop[0];
    toolName = `${word}-${suffix}`;
    categoryReason = `Stark, weil Ihr Zukunfts-Profil bereits beschreibt, wohin die Reise geht – ein Simulator macht dieses Zielbild schon heute erlebbar.`;
    causeName = mainCauseNameFuture(ctx, word);
  } else {
    toolName = `${word}-${suffix}`;
    categoryReason = `Stark, weil Ihre Wunsch-Kunden sich „${ctx.dreamShort}“ oft noch nicht wirklich vorstellen können – ein Simulator macht dieses Zukunftsbild schon heute spürbar.`;
    causeName = mainCauseNameFuture(ctx, word);
  }

  const formatReason = `Stark, weil ein Roadmap-Canvas das Zukunftsbild mit dem heutigen Stand zu einem sichtbaren Weg verbindet – das macht Sehnsucht handhabbar statt diffus.`;
  const benefit = `Ihre Wunsch-Kundin sieht schwarz auf weiß, wie „${ctx.dreamShort}“ für sie konkret aussehen könnte – und welcher Weg dorthin realistisch ist.`;
  const inputDescription = `5 Fragen zu Wunschbild in einigen Monaten, größter Sehnsucht, bisherigen Hindernissen und vorhandenen Ressourcen.`;
  const result = `Persönliches Zukunftsbild + Einordnung der aktuellen Ausgangslage + der erste machbare Schritt auf dem Weg dorthin.`;
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
    acuteProblem, wowMoment: wow,
    mainCauseName: causeName, mainCauseExplanation: mainCauseExplanation(ctx, 'simulator'),
    whyStrong: buildWhyStrong(ctx, 'simulator'),
    immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('simulator', ctx),
    buildTime: 'ca. 45–60 Min.',
  };
}

function ideaTypanalyse(ctx) {
  const suffix = pick(SUFFIX_TYPANALYSE, ctx.seedBase, 'typ-suffix');
  const compound = `${ctx.subjectWord}-Muster`;
  const toolName = `Warum ${compound} immer wiederkehrt?-${suffix}`;
  const causeName = mainCauseName(ctx, 'typanalyse', ctx.subjectWord);

  const categoryReason = `Stark, weil „${ctx.problemShort}“ fast immer einem wiederkehrenden Muster folgt – ein Audit macht dieses Muster sichtbar und einordenbar.`;
  const formatReason = `Stark, weil eine Typ-Analyse ein komplexes Verhaltensmuster in ein einfaches, merkbares Ergebnis übersetzt – persönlich und leicht teilbar.`;
  const benefit = `Ihre Wunsch-Kundin erkennt ihr eigenes wiederkehrendes Muster in stressigen Momenten – und versteht endlich, warum alte Lösungsversuche nicht dauerhaft wirken.`;
  const inputDescription = `6 Fragen zu typischer Reaktion in Stress-Momenten, Kommunikationsstil, Entscheidungsverhalten und Umgang mit Rückschlägen.`;
  const result = `Persönlicher Muster-Typ + Einordnung, warum genau dieses Muster entsteht + ein typgerechter erster Hebel.`;
  const acuteProblem = `Immer wieder dieselbe Reaktion, obwohl sie erkennbar nicht weiterhilft – ohne zu verstehen, woher dieses Muster eigentlich kommt.`;
  const wow = wowMoment(ctx, 'typ');
  const immediateAction = `Den eigenen Muster-Typ bewusst beim nächsten kritischen Moment beobachten, bevor reagiert statt reflektiert wird.`;
  const avoidAction = `Nicht versuchen, das Muster mit reiner Willenskraft „einfach“ zu unterdrücken – das hält meist nur kurz.`;
  const prognosis = `Unbeachtet wiederholt sich das Muster vermutlich in der nächsten vergleichbaren Situation. Erkannt und gezielt unterbrochen, verändert es sich spürbar schneller als gedacht.`;

  return {
    archKey: 'typanalyse',
    category: 'Analyse/Audit',
    format: 'Typ-Analyse',
    toolName, categoryReason, formatReason, benefit, inputDescription, result,
    acuteProblem, wowMoment: wow,
    mainCauseName: causeName, mainCauseExplanation: mainCauseExplanation(ctx, 'typanalyse'),
    whyStrong: buildWhyStrong(ctx, 'typanalyse'),
    immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('typanalyse', ctx),
    buildTime: 'ca. 45–60 Min.',
  };
}

function ideaMatcher(ctx) {
  const suffix = pick(SUFFIX_MATCHER, ctx.seedBase, 'match-suffix');
  const word = ctx.audienceWord;
  const toolName = `${word}-${suffix}`;
  const causeName = mainCauseName(ctx, 'matcher', word);

  const categoryReason = `Stark, weil die entscheidende Frage hier nicht „was ist falsch“ ist, sondern „passt ${ctx.offerShort || 'dieses Angebot'} jetzt wirklich zu mir“ – ein Matcher macht genau diese Passung sichtbar.`;
  const formatReason = `Stark, weil ein Reifegrad-Check ehrlich zeigt, wie nah jemand am nächsten sinnvollen Schritt bereits ist – das senkt die Hürde für eine Entscheidung spürbar.`;
  const benefit = `Ihre Wunsch-Kundin erkennt schwarz auf weiß, wie bereit sie für „${ctx.offerShort || 'den nächsten Schritt'}“ wirklich ist – und was genau noch fehlt.`;
  const inputDescription = `5 Fragen zu aktueller Situation im Vergleich zum Ziel, Dringlichkeit, vorhandenen Ressourcen und bisherigen Lösungsversuchen.`;
  const result = `Persönlicher Reifegrad + Einordnung der aktuellen Situation + eine klare Ja/Noch-nicht-Empfehlung für den nächsten Schritt.`;
  const acuteProblem = `Viele zögern lange, ob „${ctx.offerShort || 'ein nächster Schritt'}“ für sie schon der richtige ist – und verschieben die Entscheidung dadurch immer weiter.`;
  const wow = wowMoment(ctx, 'match', ctx.expertise ? `nicht fehlende Bereitschaft, sondern eine unklare Passung – genau das klärt Ihre Methode: ${lowerFirst(stripTrailingDot(ctx.expertise))}` : null);
  const immediateAction = `Die eine offene Lücke aus dem Ergebnis konkret benennen und aktiv ansprechen, statt sie zu verdrängen.`;
  const avoidAction = `Die Entscheidung nicht erneut vertagen, nur weil noch nicht alles perfekt passt.`;
  const prognosis = `Bleibt die Passungsfrage offen, verschiebt sich die Entscheidung wahrscheinlich weiter. Wird sie geklärt, fällt der nächste Schritt spürbar leichter.`;

  return {
    archKey: 'matcher',
    category: 'Matcher',
    format: 'Reifegrad-Check',
    toolName, categoryReason, formatReason, benefit, inputDescription, result,
    acuteProblem, wowMoment: wow,
    mainCauseName: causeName, mainCauseExplanation: mainCauseExplanation(ctx, 'matcher'),
    whyStrong: buildWhyStrong(ctx, 'matcher'),
    immediateAction, avoidAction, prognosis,
    nextStep: nextStepFor('matcher', ctx),
    buildTime: 'ca. 20–30 Min.',
  };
}

const ARCHETYPE_ORDER = [ideaDiagnose, ideaTypanalyse, ideaSimulator, ideaMatcher, ideaStrategie];

// ---------------------------------------------------------------------------
// Soul-DNA-Prägung: Signatur & Zukunfts-Profil verändern sichtbar den Namen
// der Top-Idee (Tool-Name + Hauptursache-Name).
// ---------------------------------------------------------------------------

function applySoulDna(idea, ctx, isTop) {
  let { toolName, mainCauseName: causeName } = idea;

  if (isTop && ctx.hasSoul && ctx.soulTop[0]) {
    const soulWord = ctx.soulTop[0];
    causeName = `${causeName} – ${soulWord}-Prägung`;
    toolName = `${toolName} (Ihre Handschrift)`;
  }

  return { ...idea, toolName, mainCauseName: causeName };
}

// ---------------------------------------------------------------------------
// Bau-Prompt
// ---------------------------------------------------------------------------

function buildPrompt(idea, ctx) {
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
  lines.push(`Die Eingaben ergeben ein persönliches Ergebnis (nicht nur eine Zahl). Beispiel-Hauptursache: "${idea.mainCauseName}" – ${idea.mainCauseExplanation} Erzeuge 3 unterschiedliche, ähnlich benannte Hauptursachen-Profile, zwischen denen je nach Antwortmuster unterschieden wird.`);
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
  lines.push('Kräftiges DSC-Blau #016E8E, helle Premium-Flächen (Off-White), Champagner/Gold (#C9A24B) ausschließlich für Sterne, Top-Empfehlung, Scores und Highlights. Weiße/offwhite Karten mit großzügigen Rundungen, großzügige Weißräume, hochwertige und sehr gut lesbare Typografie für eine Zielgruppe 45+. Primäre Buttons: Hintergrund #016E8E mit Champagner-/Gold-Schrift. Labels/Ordnungswörter in klarem dunklem CI-Blau, Label und Text stehen direkt hintereinander in einer Zeile.');
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
    const soulFit = buildSoulFit(ctx, base.archKey);
    return {
      id: `idea-${i + 1}`,
      rank: i + 1,
      isTop: i === 0,
      ...withSoul,
      soulFitLabel: soulFit.label,
      soulFit: soulFit.text,
    };
  });

  ideas.forEach((idea) => {
    idea.mainCause = `„${idea.mainCauseName}“ – ${idea.mainCauseExplanation}`;
    idea.buildPrompt = buildPrompt(idea, ctx);
  });

  return { ideas, ctx };
}

export const __internal = {
  extractSubjectAndEmotion,
  extractTopWords,
  buildContext,
  truncate,
};
