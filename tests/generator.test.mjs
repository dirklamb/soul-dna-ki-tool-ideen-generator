import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateIdeas } from '../js/generator.js';

const CASES = [
  {
    name: 'Premium-Business-Coaching',
    input: {
      niche: 'Premium-Business-Coaching für Coaches, Berater, Heiler und Experten 45+',
      target: 'Erfahrene Coaches und Berater 45+, deren Angebote gut sind, aber sich schlecht verkaufen.',
      problem: 'Wunschkunden zögern lange und kaufen am Ende doch nicht, obwohl das Erstgespräch gut lief.',
      dream: 'Premiumkunden erkennen den Wert sofort und entscheiden sich schnell und sicher.',
      offer: 'Premium-Positionierungs-Mentoring, 10 Wochen, 5.900 €.',
      expertise: 'Ich erkenne die eigentliche Positionierungslücke und schärfe das Angebot so, dass es sich von selbst verkauft.',
    },
  },
  {
    name: 'Eltern-/Kinder-Coaching',
    input: {
      niche: 'Eltern-/Kinder-Coaching',
      target: 'Eltern von Kindern der 3.–6. Klasse, bei denen Lernen häufig in Frust oder Streit endet.',
      problem: 'Hausaufgaben führen ständig zu Stress, Tränen und Diskussionen.',
      dream: 'Das Kind lernt selbstständiger, mit mehr Selbstvertrauen und deutlich weniger Streit.',
      offer: '8-Wochen-Eltern-/Kinder-Coaching für 1.500 €.',
      expertise: 'Ich erkenne die eigentliche Lernblockade und helfe Eltern und Kind, Motivation, Selbstvertrauen und selbstständiges Lernen nachhaltig zu stärken.',
    },
  },
  {
    name: 'Führungskräfte-Coaching',
    input: {
      niche: 'Führungskräfte-Coaching',
      target: 'Führungskräfte im Mittelstand, deren Mitarbeiter in wichtigen Gesprächen abblocken und Widerstand zeigen.',
      problem: 'Mitarbeiter blocken in wichtigen Gesprächen ab, reagieren defensiv und verändern ihr Verhalten danach nicht.',
      dream: 'Mitarbeiter übernehmen mehr Eigenverantwortung und bringen sich offen ins Gespräch ein.',
      offer: '3-Monats-Führungs-Coaching für 3.500 €.',
      expertise: 'Ich erkenne die eigentliche Vertrauensblockade zwischen Führungskraft und Mitarbeiter und löse sie gezielt auf.',
    },
  },
  {
    name: 'Beziehungs-Coaching',
    input: {
      niche: 'Beziehungs-Coaching',
      target: 'Paare, die seit Jahren immer wieder in denselben Streit geraten.',
      problem: 'Kleine Meinungsverschiedenheiten eskalieren regelmäßig zu großem Streit.',
      dream: 'Beide fühlen sich wieder gehört und finden schnell zueinander zurück.',
      offer: 'Paar-Intensiv-Coaching, 6 Wochen, 2.200 €.',
      expertise: 'Ich erkenne das unsichtbare Beziehungsmuster hinter dem Streit und löse den Kreislauf gezielt auf.',
    },
  },
];

const SOUL = 'Meine Soul-Autoritäts-Signatur: Ich bin die Klarheits-Bringerin, die mit ruhiger Tiefe unsichtbare Blockaden sichtbar macht.';
const FUTURE = 'Mein Zukunfts-Profil: In 2 Jahren positioniere ich mich als führende Expertin für nachhaltige Souveränität mit einer eigenen Marke.';

// Begriffe, die laut Anti-KI-Sprachcheck in Tool-Namen und sichtbaren Sätzen
// nichts zu suchen haben.
const BANNED_JARGON = [
  'potenzialmatrix', 'wert-wunsch', 'transformationshebel', 'resonanzraum',
  'wirkungsarchitektur', 'matrix', 'navigator', 'synergie', 'paradigma',
];

function assertNoJargon(text, label) {
  const lower = text.toLowerCase();
  for (const word of BANNED_JARGON) {
    assert.ok(!lower.includes(word), `${label} enthält KI-Jargon "${word}": ${text}`);
  }
}

for (const c of CASES) {
  test(`${c.name} — Basisvariante liefert 5 valide, diverse, verständliche Ideen`, () => {
    const { ideas } = generateIdeas(c.input);
    assert.equal(ideas.length, 5);

    const categories = new Set(ideas.map((i) => i.category));
    const formats = new Set(ideas.map((i) => i.format));
    assert.ok(categories.size >= 3, `Kategorien zu wenig divers: ${[...categories]}`);
    assert.ok(formats.size >= 4, `Formate zu wenig divers: ${[...formats]}`);

    const names = new Set(ideas.map((i) => i.toolName));
    assert.equal(names.size, 5, 'Tool-Namen müssen sich unterscheiden');

    const causeNames = new Set(ideas.map((i) => i.mainCauseName));
    assert.equal(causeNames.size, 5, `Hauptursache-Namen müssen sich unterscheiden: ${[...ideas.map((i) => i.mainCauseName)]}`);

    assert.equal(ideas[0].isTop, true);
    assert.equal(ideas[1].isTop, false);

    for (const idea of ideas) {
      for (const field of [
        'toolName', 'category', 'format', 'categoryReason', 'formatReason', 'benefit',
        'inputDescription', 'result', 'acuteProblem', 'wowMoment', 'whyStrong',
        'mainCauseName', 'mainCauseExplanation', 'mainCause',
        'immediateAction', 'avoidAction', 'prognosis', 'nextStep', 'buildTime', 'buildPrompt',
        'soulFit', 'soulFitLabel',
      ]) {
        assert.ok(idea[field] && idea[field].length > 0, `Feld ${field} fehlt bei ${idea.toolName}`);
      }
      assert.doesNotMatch(idea.result, /^(erste Einschätzung|mehr Klarheit|persönliches Ergebnis)\.?$/i);
      assert.equal(idea.soulFitLabel, 'Expertise-Fit', 'Ohne Soul-DNA-Angaben muss der Fallback "Expertise-Fit" heißen');

      // Tool-Name muss kurz und verständlich sein (max. ~8 "Wörter", auch bei Fragen-Namen).
      const wordCount = idea.toolName.split(/\s+/).length;
      assert.ok(wordCount <= 9, `Tool-Name zu lang/unverständlich: "${idea.toolName}"`);
      assertNoJargon(idea.toolName, `Tool-Name (${idea.archKey})`);
      assertNoJargon(idea.mainCauseName, `Hauptursache-Name (${idea.archKey})`);

      // Regression: Zitate dürfen nie mitten im Wort abgeschnitten sein.
      for (const field of ['benefit', 'acuteProblem', 'categoryReason', 'whyStrong', 'mainCause']) {
        assert.ok(!idea[field].includes('…'), `${field} wurde mitten im Wort abgeschnitten: ${idea[field]}`);
      }
    }

    const hasFutureLeaningIdea = ideas.some((i) => i.archKey === 'simulator');
    assert.ok(hasFutureLeaningIdea, 'Mindestens eine Idee muss auf Sehnsucht/Zukunft einzahlen');
  });

  test(`${c.name} — Soul-DNA-Variante verändert Top-Idee und Soul-DNA-Fit sichtbar`, () => {
    const base = generateIdeas(c.input);
    const withSoul = generateIdeas({ ...c.input, soul: SOUL, future: FUTURE });

    // Top-Idee: Tool-Name und Hauptursache-Name müssen sich sichtbar ändern.
    assert.notEqual(base.ideas[0].toolName, withSoul.ideas[0].toolName, 'Top-Tool-Name sollte sich durch Soul-DNA ändern');
    assert.notEqual(base.ideas[0].mainCauseName, withSoul.ideas[0].mainCauseName, 'Hauptursache der Top-Idee sollte sich durch Soul-DNA ändern');
    assert.match(withSoul.ideas[0].toolName, /Handschrift/);

    // Für alle 5 Ideen muss der Soul-DNA-Fit-Block auf "Soul-DNA-Fit" umschalten und konkret bleiben.
    for (let i = 0; i < 5; i++) {
      assert.equal(withSoul.ideas[i].soulFitLabel, 'Soul-DNA-Fit');
      assert.notEqual(base.ideas[i].soulFit, withSoul.ideas[i].soulFit);
      assert.ok(withSoul.ideas[i].buildPrompt.includes('Soul-Autoritäts-Signatur'));
      assert.ok(withSoul.ideas[i].buildPrompt.includes('Zukunfts-Profil'));
      // Zukunfts-Profil muss auch den "Nächster Schritt" sichtbar prägen, nicht
      // nur unter Details erwähnt werden (Punkt 26: Soul-DNA nicht nur erwähnen).
      assert.notEqual(base.ideas[i].nextStep, withSoul.ideas[i].nextStep, `Nächster Schritt von Idee ${i + 1} sollte sich durch das Zukunfts-Profil ändern`);
    }
  });
}

test('Regression: satzanfangsbedingte Adjektive und Präpositional-Objekte landen nicht in Tool-Namen', () => {
  const { ideas } = generateIdeas({
    niche: 'Premium-Business-Coaching für Coaches, Berater, Heiler und Experten 45+',
    target: 'Erfahrene Coaches und Berater 45+, deren Angebote gut sind, aber sich schlecht verkaufen.',
    problem: 'Wunschkunden zögern lange und kaufen am Ende doch nicht, obwohl das Erstgespräch gut lief.',
    dream: 'Premiumkunden erkennen den Wert sofort und entscheiden sich schnell und sicher.',
    offer: 'Premium-Positionierungs-Mentoring, 10 Wochen, 5.900 €.',
    expertise: 'Ich erkenne die eigentliche Positionierungslücke und schärfe das Angebot so, dass es sich von selbst verkauft.',
  });
  const allText = ideas.map((i) => `${i.toolName} ${i.mainCauseName}`).join(' | ');
  assert.doesNotMatch(allText, /\bErfahrene\b/, `"Erfahrene" (Adjektiv) darf nicht als Tool-Namen-Wort auftauchen: ${allText}`);

  const { ideas: ideas2 } = generateIdeas({
    niche: 'Führungskräfte-Coaching',
    target: 'Führungskräfte im Mittelstand, deren Mitarbeiter in wichtigen Gesprächen abblocken und Widerstand zeigen.',
    problem: 'Mitarbeiter blocken in wichtigen Gesprächen ab, reagieren defensiv und verändern ihr Verhalten danach nicht.',
    dream: 'Mitarbeiter übernehmen mehr Eigenverantwortung und bringen sich offen ins Gespräch ein.',
    offer: '3-Monats-Führungs-Coaching für 3.500 €.',
    expertise: 'Ich erkenne die eigentliche Vertrauensblockade zwischen Führungskraft und Mitarbeiter und löse sie gezielt auf.',
  });
  const allText2 = ideas2.map((i) => `${i.toolName} ${i.mainCauseName}`).join(' | ');
  assert.doesNotMatch(allText2, /\bGesprächen\b/, `"Gesprächen" (gebeugt, nach Präposition) darf nicht als Tool-Namen-Wort auftauchen: ${allText2}`);
  // Hyphen-Komposita wie "Führungskräfte-Coaching" bleiben unangetastet.
  assert.match(allText2, /Führungskräfte/, 'Der Nischenbegriff "Führungskräfte" sollte weiterhin extrahierbar sein');
});

test('Regression: "Beide"/"Kleine" (satzanfangsbedingte Pronomen/Adjektive) landen nicht in Tool-Namen', () => {
  const { ideas } = generateIdeas({
    niche: 'Beziehungs-Coaching',
    target: 'Paare, die seit Jahren immer wieder in denselben Streit geraten.',
    problem: 'Kleine Meinungsverschiedenheiten eskalieren regelmäßig zu großem Streit.',
    dream: 'Beide fühlen sich wieder gehört und finden schnell zueinander zurück.',
    offer: 'Paar-Intensiv-Coaching, 6 Wochen, 2.200 €.',
    expertise: 'Ich erkenne das unsichtbare Beziehungsmuster hinter dem Streit und löse den Kreislauf gezielt auf.',
  });
  const allText = ideas.map((i) => `${i.toolName} ${i.mainCauseName}`).join(' | ');
  assert.doesNotMatch(allText, /\bKleine\b/, allText);
  assert.doesNotMatch(allText, /\bBeide\b/, allText);
});
