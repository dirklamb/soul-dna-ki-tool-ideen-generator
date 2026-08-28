import { generateIdeas } from './generator.js';

const STEPS = [
  {
    key: 'niche', required: true, type: 'text',
    question: 'In welcher Nische arbeiten Sie?',
    example: 'Eltern-/Kinder-Coaching',
  },
  {
    key: 'target', required: true, type: 'textarea',
    question: 'Für wen möchten Sie Ihr KI-Tool bauen?',
    example: 'Eltern von Kindern der 3.–6. Klasse, bei denen Lernen häufig in Frust oder Streit endet.',
  },
  {
    key: 'problem', required: true, type: 'textarea',
    question: 'Welches konkrete Problem beschäftigt Ihre Wunsch-Kunden aktuell besonders stark?',
    example: 'Hausaufgaben führen ständig zu Stress, Tränen und Diskussionen.',
  },
  {
    key: 'dream', required: true, type: 'textarea',
    question: 'Was möchten Ihre Wunsch-Kunden stattdessen unbedingt erreichen?',
    example: 'Das Kind lernt selbstständiger, mit mehr Selbstvertrauen und deutlich weniger Streit.',
  },
  {
    key: 'offer', required: true, type: 'textarea',
    question: 'Welches Angebot soll Ihr KI-Tool idealerweise vorbereiten oder verkaufen?',
    example: '8-Wochen-Eltern-/Kinder-Coaching für 1.500 €.',
  },
  {
    key: 'expertise', required: true, type: 'textarea',
    question: 'Was ist das Besondere an Ihrer Expertise und was bewirkt Ihre eigene Methode konkret?',
    example: 'Ich erkenne die eigentliche Lernblockade und helfe Eltern und Kind, Motivation, Selbstvertrauen und selbstständiges Lernen nachhaltig zu stärken.',
  },
  {
    key: 'soul', required: false, type: 'textarea', optionalLabel: 'Bonus-Frage 1 von 2 (optional)',
    question: 'Fügen Sie hier Ihre Soul-Autoritäts-Signatur aus der Durchstarter-Challenge ein.',
    help: 'Damit richten wir die Tool-Ideen stärker auf Ihre besondere Wirkung, Einzigartigkeit und natürliche Autorität aus.',
  },
  {
    key: 'future', required: false, type: 'textarea', optionalLabel: 'Bonus-Frage 2 von 2 (optional)',
    question: 'Fügen Sie hier Ihr Zukunfts-Profil aus der Durchstarter-Challenge ein.',
    help: 'Damit richten wir die Ideen zusätzlich auf Ihre zukünftige Positionierung, Wunsch-Kunden und Business-Ausrichtung aus.',
  },
];

const REQUIRED_COUNT = STEPS.filter((s) => s.required).length;

const CATEGORY_INFO = {
  'Diagnose': 'Diagnose eignet sich hier besonders gut, weil Ihre Wunsch-Kunden zuerst eine ehrliche Standortbestimmung brauchen, bevor irgendein Rat wirklich greifen kann.',
  'Strategie': 'Strategie passt hier, weil nach der Ursachen-Klarheit die richtige nächste Entscheidung über Fortschritt oder Stillstand entscheidet.',
  'Simulator': 'Ein Simulator eignet sich hier besonders, weil das gewünschte Zukunftsbild noch abstrakt ist und erst erlebbar gemacht werden muss.',
  'Analyse/Audit': 'Analyse/Audit passt hier, weil sich das Problem in ein wiederkehrendes, einordenbares Muster zerlegen lässt.',
  'Matcher': 'Ein Matcher eignet sich hier besonders, weil die entscheidende Frage die persönliche Passung zum nächsten Schritt ist, nicht die Fehlersuche.',
};

const FORMAT_INFO = {
  'Scorecard': 'Eine Scorecard macht in wenigen Minuten aus vielen kleinen Alltagsmomenten ein klares, persönliches Bild – ohne dass sich jemand bloßgestellt fühlt.',
  'Entscheidungs-Hilfe': 'Eine Entscheidungs-Hilfe führt Schritt für Schritt zu einer klaren Empfehlung, statt mit noch mehr Optionen zu überfordern.',
  'Roadmap-Canvas': 'Ein Roadmap-Canvas verbindet das Zukunftsbild mit dem heutigen Stand zu einem sichtbaren Weg – das macht Sehnsucht handhabbar statt diffus.',
  'Typ-Analyse': 'Eine Typ-Analyse übersetzt ein komplexes Verhaltensmuster in ein einfaches, merkbares Ergebnis – persönlich und leicht teilbar.',
  'Reifegrad-Check': 'Ein Reifegrad-Check zeigt ehrlich, wie nah jemand am nächsten sinnvollen Schritt bereits ist – das senkt die Hürde für eine Entscheidung spürbar.',
};

const state = {
  answers: {},
  stepIndex: 0,
};

const els = {};
document.querySelectorAll('[id]').forEach((el) => { els[el.id] = el; });

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('is-active'));
  document.getElementById(id).classList.add('is-active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

function renderStep() {
  const step = STEPS[state.stepIndex];
  const requiredIndex = STEPS.slice(0, state.stepIndex + 1).filter((s) => s.required).length;

  els['step-label'].textContent = step.required
    ? `Schritt ${requiredIndex} von ${REQUIRED_COUNT}`
    : step.optionalLabel;
  els['step-label'].classList.toggle('optional', !step.required);

  const doneWeight = step.required ? requiredIndex - 1 : REQUIRED_COUNT;
  const totalWeight = REQUIRED_COUNT + 2;
  const progressed = step.required ? requiredIndex : REQUIRED_COUNT + (state.stepIndex - 6 + 1);
  els['progress-fill'].style.width = `${Math.min(100, (progressed / totalWeight) * 100)}%`;

  els['question-text'].textContent = step.question;
  els['question-help'].textContent = step.help || '';
  els['question-help'].style.display = step.help ? 'block' : 'none';

  if (step.example) {
    els['question-example'].style.display = 'block';
    els['question-example-text'].textContent = `„${step.example}“`;
  } else {
    els['question-example'].style.display = 'none';
  }

  const value = state.answers[step.key] || '';
  if (step.type === 'textarea') {
    els['input-textarea'].style.display = 'block';
    els['input-text'].style.display = 'none';
    els['input-textarea'].value = value;
    els['input-textarea'].placeholder = step.required ? 'Ihre Antwort …' : 'Optional – hier einfügen oder überspringen …';
  } else {
    els['input-textarea'].style.display = 'none';
    els['input-text'].style.display = 'block';
    els['input-text'].value = value;
    els['input-text'].placeholder = 'Ihre Antwort …';
  }

  els['field-error'].classList.remove('is-visible');
  els['btn-back'].style.visibility = state.stepIndex === 0 ? 'hidden' : 'visible';
  els['btn-skip'].style.display = step.required ? 'none' : 'inline-flex';
  els['btn-next'].textContent = state.stepIndex === STEPS.length - 1 ? 'Weiter' : 'Weiter';

  (step.type === 'textarea' ? els['input-textarea'] : els['input-text']).focus({ preventScroll: true });
}

function currentInputValue() {
  const step = STEPS[state.stepIndex];
  return (step.type === 'textarea' ? els['input-textarea'].value : els['input-text'].value).trim();
}

function goToStep(index) {
  state.stepIndex = index;
  renderStep();
}

function advance() {
  const step = STEPS[state.stepIndex];
  const value = currentInputValue();

  if (step.required && value.length < 3) {
    els['field-error'].classList.add('is-visible');
    return;
  }

  state.answers[step.key] = value;

  if (state.stepIndex < STEPS.length - 1) {
    goToStep(state.stepIndex + 1);
  } else {
    showScreen('screen-transition');
  }
}

function skip() {
  const step = STEPS[state.stepIndex];
  state.answers[step.key] = '';
  if (state.stepIndex < STEPS.length - 1) {
    goToStep(state.stepIndex + 1);
  } else {
    showScreen('screen-transition');
  }
}

function goBack() {
  if (state.stepIndex === 0) {
    showScreen('screen-start');
    return;
  }
  goToStep(state.stepIndex - 1);
}

els['btn-start'].addEventListener('click', () => {
  state.stepIndex = 0;
  showScreen('screen-wizard');
  renderStep();
});

els['btn-next'].addEventListener('click', advance);
els['btn-skip'].addEventListener('click', skip);
els['btn-back'].addEventListener('click', goBack);

[els['input-textarea'], els['input-text']].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && el === els['input-text']) {
      e.preventDefault();
      advance();
    }
  });
});

// ---------------------------------------------------------------------------
// Transition -> Generation
// ---------------------------------------------------------------------------

els['btn-generate'].addEventListener('click', () => {
  els['btn-generate'].style.display = 'none';
  els['loading-dots'].classList.add('is-visible');
  window.setTimeout(runGeneration, 1300);
});

function runGeneration() {
  const { ideas } = generateIdeas({
    niche: state.answers.niche,
    target: state.answers.target,
    problem: state.answers.problem,
    dream: state.answers.dream,
    offer: state.answers.offer,
    expertise: state.answers.expertise,
    soul: state.answers.soul,
    future: state.answers.future,
  });

  renderResults(ideas);
  els['btn-generate'].style.display = 'inline-flex';
  els['loading-dots'].classList.remove('is-visible');
  showScreen('screen-results');
}

// ---------------------------------------------------------------------------
// Results rendering
// ---------------------------------------------------------------------------

function infoBadge(label, tooltipText) {
  const wrap = document.createElement('span');
  wrap.className = 'info-badge';
  wrap.tabIndex = 0;
  wrap.innerHTML = `${escapeHtml(label)} <span class="info-icon">i</span>`;
  const tip = document.createElement('span');
  tip.className = 'info-tooltip';
  tip.textContent = tooltipText;
  wrap.appendChild(tip);
  wrap.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.info-badge.is-open').forEach((b) => { if (b !== wrap) b.classList.remove('is-open'); });
    wrap.classList.toggle('is-open');
  });
  return wrap;
}

document.addEventListener('click', () => {
  document.querySelectorAll('.info-badge.is-open').forEach((b) => b.classList.remove('is-open'));
});

function field(labelText, valueText, extraClass) {
  const wrap = document.createElement('div');
  wrap.className = `idea-field${extraClass ? ' ' + extraClass : ''}`;
  const label = document.createElement('span');
  label.className = 'field-label';
  label.textContent = labelText;
  const value = document.createElement('div');
  value.className = 'field-value';
  value.textContent = valueText;
  wrap.appendChild(label);
  wrap.appendChild(value);
  return wrap;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderResults(ideas) {
  const container = els['ideas-container'];
  container.innerHTML = '';

  ideas.forEach((idea) => {
    const card = document.createElement('article');
    card.className = `idea-card${idea.isTop ? ' is-top' : ''}`;

    if (idea.isTop) {
      const badge = document.createElement('div');
      badge.className = 'top-badge';
      badge.innerHTML = `<span class="stars">★★★★★</span> Meine Top-Empfehlung`;
      card.appendChild(badge);
    }

    const rank = document.createElement('p');
    rank.className = 'idea-rank';
    rank.textContent = `#${idea.rank}`;
    card.appendChild(rank);

    const name = document.createElement('h3');
    name.className = 'idea-name';
    name.textContent = idea.toolName;
    card.appendChild(name);

    const badgeRow = document.createElement('div');
    badgeRow.className = 'badge-row';
    badgeRow.appendChild(infoBadge(`Kategorie: ${idea.category}`, idea.categoryReason));
    badgeRow.appendChild(infoBadge(`Format: ${idea.format}`, idea.formatReason));
    card.appendChild(badgeRow);

    card.appendChild(field('Nutzen', idea.benefit));
    card.appendChild(field('Eingabe', idea.inputDescription));
    card.appendChild(field('Ergebnis', idea.result));
    card.appendChild(field('Akutes Problem', idea.acuteProblem));

    const wowBox = document.createElement('div');
    wowBox.className = 'wow-box';
    const wowLabel = document.createElement('span');
    wowLabel.className = 'field-label';
    wowLabel.textContent = 'WOW-Moment / Erkenntnis';
    const wowValue = document.createElement('div');
    wowValue.className = 'field-value';
    wowValue.textContent = idea.wowMoment;
    wowBox.appendChild(wowLabel);
    wowBox.appendChild(wowValue);
    card.appendChild(wowBox);

    const resultNameLabel = document.createElement('span');
    resultNameLabel.className = 'field-label';
    resultNameLabel.textContent = 'Persönlicher Ergebnis-Name';
    card.appendChild(resultNameLabel);
    const resultTag = document.createElement('div');
    resultTag.className = 'result-name-tag';
    resultTag.textContent = `„${idea.resultName}“`;
    card.appendChild(resultTag);

    if (idea.isTop && idea.topReason) {
      const box = document.createElement('div');
      box.className = 'top-reason-box';
      const label = document.createElement('span');
      label.className = 'field-label';
      label.textContent = 'Warum ich Ihnen genau diese Idee zuerst empfehlen würde';
      const value = document.createElement('div');
      value.className = 'field-value';
      value.textContent = idea.topReason;
      box.appendChild(label);
      box.appendChild(value);
      card.appendChild(box);
    }

    // Details toggle
    const detailsPanel = document.createElement('div');
    detailsPanel.className = 'details-panel';
    detailsPanel.appendChild(field('Sofort-Empfehlung', idea.immediateAction));
    detailsPanel.appendChild(field('Was Sie nicht tun sollten', idea.avoidAction));
    detailsPanel.appendChild(field('Mini-Prognose', idea.prognosis));
    detailsPanel.appendChild(field('Nächster Schritt', idea.nextStep));
    if (idea.positioning) {
      detailsPanel.appendChild(field('Soul-DNA-Prägung', idea.positioning));
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'details-toggle';
    toggleBtn.innerHTML = 'Mehr Details <span class="chevron">▾</span>';
    toggleBtn.addEventListener('click', () => {
      const open = detailsPanel.classList.toggle('is-open');
      toggleBtn.classList.toggle('is-open', open);
      toggleBtn.firstChild.textContent = open ? 'Weniger Details ' : 'Mehr Details ';
    });

    card.appendChild(toggleBtn);
    card.appendChild(detailsPanel);

    // Actions: build time + build prompt CTA
    const actions = document.createElement('div');
    actions.className = 'idea-actions';

    const buildTimeTag = document.createElement('span');
    buildTimeTag.className = 'build-time-tag';
    buildTimeTag.textContent = `Bauzeit: ${idea.buildTime}`;
    actions.appendChild(buildTimeTag);

    const promptBtn = document.createElement('button');
    promptBtn.type = 'button';
    promptBtn.className = 'btn btn-secondary';
    promptBtn.textContent = 'Bau-Prompt anzeigen';

    const promptPanel = document.createElement('div');
    promptPanel.className = 'prompt-panel';
    const pre = document.createElement('pre');
    pre.textContent = idea.buildPrompt;
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-primary';
    copyBtn.textContent = 'Prompt kopieren';
    const copyFeedback = document.createElement('span');
    copyFeedback.className = 'copy-feedback';
    copyFeedback.textContent = 'Kopiert!';

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(idea.buildPrompt);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = idea.buildPrompt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      copyFeedback.classList.add('is-visible');
      window.setTimeout(() => copyFeedback.classList.remove('is-visible'), 1800);
    });

    promptPanel.appendChild(pre);
    promptPanel.appendChild(copyBtn);
    promptPanel.appendChild(copyFeedback);

    promptBtn.addEventListener('click', () => {
      const open = promptPanel.classList.toggle('is-open');
      promptBtn.textContent = open ? 'Bau-Prompt verbergen' : 'Bau-Prompt anzeigen';
    });

    actions.appendChild(promptBtn);
    card.appendChild(actions);
    card.appendChild(promptPanel);

    container.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Restart
// ---------------------------------------------------------------------------

els['btn-restart'].addEventListener('click', () => {
  state.answers = {};
  state.stepIndex = 0;
  showScreen('screen-start');
});
