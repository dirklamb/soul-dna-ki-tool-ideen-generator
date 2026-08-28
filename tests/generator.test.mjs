import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateIdeas } from '../js/generator.js';

const CASES = [
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
      target: 'Führungskräfte im Mittelstand, deren Teams zunehmend nur noch Dienst nach Vorschrift machen.',
      problem: 'Mitarbeiter machen nur noch Dienst nach Vorschrift und bringen sich kaum noch ein.',
      dream: 'Das Team übernimmt wieder Verantwortung und bringt eigene Ideen ein.',
      offer: '3-Monats-Führungs-Coaching für 3.500 €.',
      expertise: 'Ich erkenne die eigentliche Vertrauensblockade zwischen Führungskraft und Team und löse sie gezielt auf.',
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
  {
    name: 'Souveränitäts-Coaching für Unternehmerinnen 50+',
    input: {
      niche: 'Souveränitäts-Coaching für Unternehmerinnen 50+',
      target: 'Unternehmerinnen 50+, die nach wichtigen Entscheidungen gedanklich nicht abschalten können.',
      problem: 'Nach Entscheidungen kreisen die Gedanken stundenlang weiter und rauben Energie.',
      dream: 'Souverän entscheiden und danach wirklich abschalten können.',
      offer: 'Souveränitäts-Mentoring, 12 Wochen, 4.900 €.',
      expertise: 'Ich erkenne das eigentliche Kontrollmuster hinter der Gedankenschleife und löse es gezielt auf.',
    },
  },
];

const SOUL = 'Meine Soul-Autoritäts-Signatur: Ich bin die Klarheits-Bringerin, die mit ruhiger Tiefe unsichtbare Blockaden sichtbar macht.';
const FUTURE = 'Mein Zukunfts-Profil: In 2 Jahren positioniere ich mich als führende Expertin für nachhaltige Souveränität mit einer eigenen Marke.';

for (const c of CASES) {
  test(`${c.name} — Basisvariante liefert 5 valide, diverse Ideen`, () => {
    const { ideas } = generateIdeas(c.input);
    assert.equal(ideas.length, 5);

    const categories = new Set(ideas.map((i) => i.category));
    const formats = new Set(ideas.map((i) => i.format));
    assert.ok(categories.size >= 3, `Kategorien zu wenig divers: ${[...categories]}`);
    assert.ok(formats.size >= 4, `Formate zu wenig divers: ${[...formats]}`);

    const names = new Set(ideas.map((i) => i.toolName));
    assert.equal(names.size, 5, 'Tool-Namen müssen sich unterscheiden');

    const resultNames = new Set(ideas.map((i) => i.resultName));
    assert.equal(resultNames.size, 5, `Ergebnis-Namen müssen sich unterscheiden: ${[...ideas.map((i) => i.resultName)]}`);

    assert.equal(ideas[0].isTop, true);
    assert.ok(ideas[0].topReason && ideas[0].topReason.length > 20);
    assert.equal(ideas[0].stars, undefined); // rendering adds stars, not generator

    for (const idea of ideas) {
      for (const field of ['toolName', 'category', 'format', 'categoryReason', 'formatReason', 'benefit', 'inputDescription', 'result', 'acuteProblem', 'wowMoment', 'resultName', 'immediateAction', 'avoidAction', 'prognosis', 'nextStep', 'buildTime', 'buildPrompt']) {
        assert.ok(idea[field] && idea[field].length > 0, `Feld ${field} fehlt bei ${idea.toolName}`);
      }
      assert.doesNotMatch(idea.result, /^(erste Einschätzung|mehr Klarheit|persönliches Ergebnis)\.?$/i);
    }

    const hasFutureLeaningIdea = ideas.some((i) => i.archKey === 'simulator');
    assert.ok(hasFutureLeaningIdea, 'Mindestens eine Idee muss auf Sehnsucht/Zukunft einzahlen');
  });

  test(`${c.name} — Soul-DNA-Variante verändert die Ideen sichtbar`, () => {
    const base = generateIdeas(c.input);
    const withSoul = generateIdeas({ ...c.input, soul: SOUL, future: FUTURE });

    let changedCount = 0;
    for (let i = 0; i < 5; i++) {
      const a = base.ideas[i];
      const b = withSoul.ideas[i];
      if (a.toolName !== b.toolName || a.resultName !== b.resultName || a.categoryReason !== b.categoryReason || a.benefit !== b.benefit) {
        changedCount++;
      }
      assert.ok(b.buildPrompt.includes('Soul-Autoritäts-Signatur'));
      assert.ok(b.buildPrompt.includes('Zukunfts-Profil'));
    }
    assert.ok(changedCount >= 3, `Zu wenige Ideen verändern sich durch Soul-DNA (${changedCount}/5)`);
    assert.ok(withSoul.ideas[0].toolName.includes('Signature Edition'), 'Top-Idee sollte Signatur-Prägung im Namen tragen');
  });
}
