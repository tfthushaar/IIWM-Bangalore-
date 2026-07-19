(function () {
  'use strict';

  /* ================= Configuration ================= */
  /* TODO(IIWM): once the admin leads dashboard exists, set LEADS_ENDPOINT to
     its API URL. Until then, every submission is saved to this browser's
     localStorage under LEADS_STORAGE_KEY so nothing is lost — open the
     console and run `copy(localStorage.getItem('iiwm_quiz_leads'))` on this
     device to retrieve them. */
  var LEADS_ENDPOINT = null;
  var LEADS_STORAGE_KEY = 'iiwm_quiz_leads';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SECTION_SCALE_LABELS = {
    'Personality': ['Disagree', 'Agree'],
    'Interest Mapping': ['Not for me', 'Love it'],
    'Entrepreneurial Mindset': ['Disagree', 'Agree'],
    'Soft Skills': ['Still developing', 'Excellent']
  };

  /* ================= State ================= */
  var state = {
    index: 0,
    answers: {},
    lead: null,
    results: null
  };

  var QUESTIONS = QUIZ_QUESTIONS;
  var ARCHETYPES = QUIZ_ARCHETYPES;
  var DIMENSIONS = QUIZ_DIMENSIONS;
  var STATUS_OPTIONS = QUIZ_STATUS_OPTIONS;
  var TOTAL = QUESTIONS.length;
  var MAX_POSSIBLE = computeMaxPossible(ARCHETYPES, function (q) { return q.archetypeWeights; }, function (o) { return o.archetypeWeights; });
  var MAX_POSSIBLE_DIM = computeMaxPossible(keyByDimension(), function (q) { return q.dimensionWeights; }, function (o) { return o.dimensionWeights; });

  /* ================= DOM refs ================= */
  var topbar = document.getElementById('quizTopbar');
  var bottombar = document.getElementById('quizBottombar');
  var progressFill = document.getElementById('progressFill');
  var progressLabel = document.getElementById('progressLabel');
  var backBtn = document.getElementById('backBtn');
  var nextBtn = document.getElementById('nextBtn');
  var exitBtn = document.getElementById('quizExit');

  var screenLanding = document.getElementById('screenLanding');
  var screenQuestion = document.getElementById('screenQuestion');
  var screenLead = document.getElementById('screenLead');
  var screenResults = document.getElementById('screenResults');
  var questionInner = document.getElementById('questionInner');

  var startBtn = document.getElementById('startBtn');
  var leadForm = document.getElementById('leadForm');
  var leadBackBtn = document.getElementById('leadBackBtn');

  /* ================= Scoring engine ================= */

  function keyByDimension() {
    var obj = {};
    DIMENSIONS.forEach(function (d) { obj[d.key] = true; });
    return obj;
  }

  /* Generic across both scoring tracks (archetype match + the 12
     behind-the-scenes dimensions) - `getQuestionWeights`/`getOptionWeights`
     pick which weight map (archetypeWeights or dimensionWeights) to read. */
  function computeMaxPossible(keysObj, getQuestionWeights, getOptionWeights) {
    var max = {};
    Object.keys(keysObj).forEach(function (k) { max[k] = 0; });

    QUESTIONS.forEach(function (q) {
      if (q.type === 'slider') {
        var qw = getQuestionWeights(q) || {};
        Object.keys(qw).forEach(function (k) { max[k] += qw[k]; });
      } else if (q.type === 'single') {
        var perKey = {};
        q.options.forEach(function (opt) {
          var ow = getOptionWeights(opt) || {};
          Object.keys(ow).forEach(function (k) {
            perKey[k] = Math.max(perKey[k] || 0, ow[k]);
          });
        });
        Object.keys(perKey).forEach(function (k) { max[k] += perKey[k]; });
      }
    });
    return max;
  }

  function computeScores() {
    var scores = {};
    var contributions = {};
    var dimScores = {};
    Object.keys(ARCHETYPES).forEach(function (a) { scores[a] = 0; contributions[a] = []; });
    DIMENSIONS.forEach(function (d) { dimScores[d.key] = 0; });

    QUESTIONS.forEach(function (q) {
      var ans = state.answers[q.id];
      if (q.type === 'slider') {
        var value = (ans == null) ? 3 : ans;
        Object.keys(q.archetypeWeights || {}).forEach(function (a) {
          var amt = q.archetypeWeights[a] * (value / 5);
          scores[a] += amt;
          if (amt > 0) contributions[a].push({ label: q.text, amount: amt });
        });
        Object.keys(q.dimensionWeights || {}).forEach(function (k) {
          dimScores[k] += q.dimensionWeights[k] * (value / 5);
        });
      } else if (q.type === 'single') {
        if (ans != null) {
          var opt = q.options[ans];
          Object.keys(opt.archetypeWeights || {}).forEach(function (a) {
            var w = opt.archetypeWeights[a];
            scores[a] += w;
            contributions[a].push({ label: opt.label, amount: w });
          });
          Object.keys(opt.dimensionWeights || {}).forEach(function (k) {
            dimScores[k] += opt.dimensionWeights[k];
          });
        }
      }
    });

    var percentages = {};
    Object.keys(ARCHETYPES).forEach(function (a) {
      percentages[a] = MAX_POSSIBLE[a] > 0
        ? Math.max(0, Math.min(100, Math.round((scores[a] / MAX_POSSIBLE[a]) * 100)))
        : 0;
    });

    var dimPercentages = {};
    DIMENSIONS.forEach(function (d) {
      dimPercentages[d.key] = MAX_POSSIBLE_DIM[d.key] > 0
        ? Math.max(0, Math.min(100, Math.round((dimScores[d.key] / MAX_POSSIBLE_DIM[d.key]) * 100)))
        : 0;
    });

    var ranked = Object.keys(ARCHETYPES)
      .map(function (a) { return { code: a, pct: percentages[a] }; })
      .sort(function (x, y) { return y.pct - x.pct; });

    Object.keys(contributions).forEach(function (a) {
      var seen = {};
      contributions[a] = contributions[a]
        .sort(function (x, y) { return y.amount - x.amount; })
        .filter(function (c) {
          if (seen[c.label]) return false;
          seen[c.label] = true;
          return true;
        });
    });

    var top3 = rescaleTop3(ranked.slice(0, 3));

    var dimRanked = DIMENSIONS
      .map(function (d) { return { key: d.key, label: d.label, pct: dimPercentages[d.key], strength: d.strength, growth: d.growth }; })
      .sort(function (x, y) { return y.pct - x.pct; });
    var superpowers = dimRanked.slice(0, 5).map(function (d) { return d.strength; });
    var growthAreas = dimRanked.slice().reverse().slice(0, 4).map(function (d) { return d.growth; });
    var entrepreneurPct = dimPercentages.entrepreneurship || 0;
    var overallFitScore = Math.round(0.5 * top3[0].pct + 0.5 * average(Object.keys(dimPercentages).map(function (k) { return dimPercentages[k]; })));

    return {
      scores: scores, percentages: percentages, ranked: ranked, contributions: contributions,
      dimPercentages: dimPercentages, top3: top3, superpowers: superpowers, growthAreas: growthAreas,
      entrepreneurPct: entrepreneurPct, overallFitScore: overallFitScore
    };
  }

  function average(nums) {
    if (!nums.length) return 0;
    return nums.reduce(function (s, n) { return s + n; }, 0) / nums.length;
  }

  /* Top 3 archetype matches are rescaled into an 80-97% display band,
     preserving their relative order - the raw match strength beneath a
     "top pick" should always read as a confident recommendation rather
     than a middling absolute score. */
  function rescaleTop3(top3) {
    var best = top3[0].pct;
    var worst = top3[top3.length - 1].pct;
    var spread = best - worst;
    return top3.map(function (r) {
      var displayPct = spread > 0
        ? Math.round(80 + ((r.pct - worst) / spread) * 17)
        : 95 - (top3.indexOf(r) * 4);
      return { code: r.code, pct: displayPct };
    });
  }

  function starString(pct, max) {
    max = max || 5;
    var filled = Math.max(1, Math.min(max, Math.round((pct / 100) * max)));
    return '&#9733;'.repeat(filled) + '&#9734;'.repeat(max - filled);
  }

  function fitLabel(pct) {
    if (pct >= 85) return 'Excellent Fit';
    if (pct >= 70) return 'Strong Fit';
    if (pct >= 55) return 'Good Fit';
    if (pct >= 40) return 'Developing Fit';
    return 'Early Stage';
  }

  /* ================= Rendering: question screens ================= */

  function renderQuestion() {
    var q = QUESTIONS[state.index];
    var html = '<p class="quiz-eyebrow">' + escapeHtml(q.section) + '</p>' +
      '<h2 class="quiz-question-text">' + escapeHtml(q.text) + '</h2>';

    var CHECK_ICON = '<span class="quiz-option-check"><svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (q.type === 'single') {
      html += '<div class="quiz-options" role="radiogroup">';
      q.options.forEach(function (opt, i) {
        var selected = state.answers[q.id] === i;
        html += '<button type="button" class="quiz-option' + (selected ? ' is-selected' : '') +
          '" role="radio" aria-checked="' + selected + '" data-index="' + i + '">' +
          '<span class="quiz-option-badge">' + (LETTERS[i] || (i + 1)) + '</span>' +
          '<span class="quiz-option-label">' + escapeHtml(opt.label) + '</span>' +
          CHECK_ICON + '</button>';
      });
      html += '</div>';
    } else if (q.type === 'multi') {
      var chosen = state.answers[q.id] || [];
      html += '<p class="quiz-hint">Choose ' + q.pick + '' + (chosen.length ? ' &middot; ' + chosen.length + ' of ' + q.pick + ' selected' : '') + '</p>';
      html += '<div class="quiz-options quiz-options--multi">';
      q.options.forEach(function (opt, i) {
        var selected = chosen.indexOf(i) !== -1;
        var atCap = chosen.length >= q.pick && !selected;
        html += '<button type="button" class="quiz-option' + (selected ? ' is-selected' : '') + (atCap ? ' is-disabled' : '') +
          '" aria-pressed="' + selected + '" data-index="' + i + '">' +
          '<span class="quiz-option-badge">' + (LETTERS[i] || (i + 1)) + '</span>' +
          '<span class="quiz-option-label">' + escapeHtml(opt.label) + '</span>' +
          CHECK_ICON + '</button>';
      });
      html += '</div>';
    } else if (q.type === 'slider') {
      var value = state.answers[q.id] != null ? state.answers[q.id] : 3;
      var scale = SECTION_SCALE_LABELS[q.section] || ['Low', 'High'];
      var fillPct = ((value - 1) / 4) * 100;
      html += '<div class="quiz-slider-wrap">' +
        '<div class="quiz-slider-value" id="sliderValue">' + value + '</div>' +
        '<input type="range" min="1" max="5" step="1" value="' + value + '" class="quiz-slider" id="sliderInput" style="--fill:' + fillPct + '%" aria-label="' + escapeHtml(q.text) + '">' +
        '<div class="quiz-slider-ticks" id="sliderTicks">' +
        [1, 2, 3, 4, 5].map(function (n) { return '<span class="' + (n <= value ? 'is-active' : '') + '"></span>'; }).join('') +
        '</div>' +
        '<div class="quiz-slider-scale"><span>' + escapeHtml(scale[0]) + '</span><span>' + escapeHtml(scale[1]) + '</span></div>' +
        '</div>';
      if (state.answers[q.id] == null) state.answers[q.id] = value;
    }

    questionInner.innerHTML = html;
    questionInner.classList.remove('quiz-anim-in');
    void questionInner.offsetWidth; /* restart animation */
    questionInner.classList.add('quiz-anim-in');

    bindQuestionEvents(q);
    updateProgress();
    updateNextEnabled();
    updateBackVisibility();
  }

  function bindQuestionEvents(q) {
    if (q.type === 'single') {
      var buttons = questionInner.querySelectorAll('.quiz-option');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.answers[q.id] = parseInt(btn.getAttribute('data-index'), 10);
          buttons.forEach(function (b) {
            var selected = b === btn;
            b.classList.toggle('is-selected', selected);
            b.setAttribute('aria-checked', String(selected));
          });
          updateNextEnabled();
        });
      });
    } else if (q.type === 'multi') {
      var mbuttons = questionInner.querySelectorAll('.quiz-option');
      var hintEl = questionInner.querySelector('.quiz-hint');
      mbuttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.classList.contains('is-disabled')) return;
          var idx = parseInt(btn.getAttribute('data-index'), 10);
          var chosen = state.answers[q.id] || [];
          var pos = chosen.indexOf(idx);
          if (pos === -1) {
            if (chosen.length >= q.pick) return;
            chosen = chosen.concat([idx]);
          } else {
            chosen = chosen.slice(0, pos).concat(chosen.slice(pos + 1));
          }
          state.answers[q.id] = chosen;

          mbuttons.forEach(function (b) {
            var bIdx = parseInt(b.getAttribute('data-index'), 10);
            var selected = chosen.indexOf(bIdx) !== -1;
            var atCap = chosen.length >= q.pick && !selected;
            b.classList.toggle('is-selected', selected);
            b.classList.toggle('is-disabled', atCap);
            b.setAttribute('aria-pressed', String(selected));
          });
          if (hintEl) {
            hintEl.innerHTML = 'Choose ' + q.pick + (chosen.length ? ' &middot; ' + chosen.length + ' of ' + q.pick + ' selected' : '');
          }
          updateNextEnabled();
        });
      });
    } else if (q.type === 'slider') {
      var input = document.getElementById('sliderInput');
      var valueEl = document.getElementById('sliderValue');
      var ticksEl = document.getElementById('sliderTicks');
      input.addEventListener('input', function () {
        var val = parseInt(input.value, 10);
        state.answers[q.id] = val;
        valueEl.textContent = input.value;
        input.style.setProperty('--fill', ((val - 1) / 4) * 100 + '%');
        if (ticksEl) {
          Array.prototype.forEach.call(ticksEl.children, function (tick, i) {
            tick.classList.toggle('is-active', i + 1 <= val);
          });
        }
      });
    }
  }

  function isAnswered() {
    var q = QUESTIONS[state.index];
    var ans = state.answers[q.id];
    if (q.type === 'single') return ans != null;
    if (q.type === 'multi') return (ans || []).length === q.pick;
    if (q.type === 'slider') return true;
    return false;
  }

  function updateNextEnabled() {
    nextBtn.disabled = !isAnswered();
  }

  function updateBackVisibility() {
    backBtn.style.visibility = 'visible';
  }

  function updateProgress() {
    var pct = Math.round((state.index / TOTAL) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = 'Question ' + (state.index + 1) + ' of ' + TOTAL;
  }

  /* ================= Screen navigation ================= */

  function showScreen(name) {
    [screenLanding, screenQuestion, screenLead, screenResults].forEach(function (s) { s.hidden = true; });
    topbar.hidden = true;
    bottombar.hidden = true;

    if (name === 'landing') {
      screenLanding.hidden = false;
    } else if (name === 'lead') {
      screenLead.hidden = false;
    } else if (name === 'question') {
      screenQuestion.hidden = false;
      topbar.hidden = false;
      bottombar.hidden = false;
      nextBtn.textContent = (state.index === TOTAL - 1) ? 'See My Results' : 'Next';
    } else if (name === 'results') {
      screenResults.hidden = false;
    }
    window.scrollTo(0, 0);
  }

  function goNext() {
    if (!isAnswered()) return;
    if (state.index < TOTAL - 1) {
      state.index += 1;
      renderQuestion();
      showScreen('question');
    } else {
      state.results = computeScores();
      submitLead(state.lead, state.results);
      renderResults();
      showScreen('results');
    }
  }

  function goBack() {
    var onLeadScreen = !screenLead.hidden;
    if (onLeadScreen) {
      showScreen('landing');
      return;
    }
    if (state.index === 0) {
      showScreen('lead');
      return;
    }
    state.index -= 1;
    renderQuestion();
    showScreen('question');
  }

  /* ================= Lead capture ================= */

  function validateLead(data) {
    var errors = {};
    if (!data.name || data.name.trim().length < 2) errors.name = 'Please enter your full name.';
    var digits = (data.phone || '').replace(/[^\d]/g, '');
    if (digits.length < 8) errors.phone = 'Please enter a valid phone number.';
    return errors;
  }

  function saveLeadLocally(record) {
    try {
      var existing = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
      existing.push(record);
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) { /* storage unavailable — ignore, submission still proceeds */ }
  }

  function submitLead(lead, results) {
    var top = results.ranked[0];
    var record = {
      name: lead.name,
      phone: lead.phone,
      /* email must be present (as a string) for the Firestore rules' lead
         shape check — the quiz form intentionally only asks name + phone. */
      email: '',
      status: lead.status || '',
      education: lead.education || '',
      city: lead.city || '',
      source: 'Career Profiler Quiz',
      submittedAt: new Date().toISOString(),
      archetypeCode: top.code,
      archetypeName: ARCHETYPES[top.code].name,
      overallFitScore: results.overallFitScore,
      matchPercentages: results.percentages,
      answers: state.answers
    };
    if (window.IIWMFirebaseSubmit) {
      window.IIWMFirebaseSubmit(record).catch(function () { saveLeadLocally(record); });
    } else if (LEADS_ENDPOINT) {
      fetch(LEADS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      }).catch(function () { saveLeadLocally(record); });
    } else {
      saveLeadLocally(record);
    }
    return record;
  }

  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: leadForm.elements.name.value,
        phone: leadForm.elements.phone.value,
        status: leadForm.elements.status ? leadForm.elements.status.value : '',
        education: leadForm.elements.education ? leadForm.elements.education.value.trim() : '',
        city: leadForm.elements.city ? leadForm.elements.city.value.trim() : ''
      };
      var errors = validateLead(data);
      ['name', 'phone'].forEach(function (field) {
        var el = leadForm.elements[field];
        var errEl = document.getElementById(field + 'Error');
        if (errors[field]) {
          el.setAttribute('aria-invalid', 'true');
          if (errEl) errEl.textContent = errors[field];
        } else {
          el.removeAttribute('aria-invalid');
          if (errEl) errEl.textContent = '';
        }
      });
      if (Object.keys(errors).length) return;

      state.lead = data;
      state.index = 0;
      renderQuestion();
      showScreen('question');
    });
  }

  /* ================= Results ================= */

  var LEARNING_STYLE = ['Live events', 'Practical projects', 'Simulations', 'Industry internships'];
  var WHY_IIWM_FITS = [
    'Practical event execution',
    'Luxury wedding exposure',
    'Business and entrepreneurship modules',
    'Internship opportunities',
    'Portfolio development'
  ];

  function entrepreneurBlurb(pct) {
    if (pct >= 85) return 'You have exceptional potential to build and lead your own wedding business.';
    if (pct >= 70) return 'You have strong potential to build your own wedding business after gaining industry experience.';
    if (pct >= 55) return 'You show promising entrepreneurial instincts worth developing further.';
    return "Entrepreneurship isn't your primary driver, and that's perfectly fine — many rewarding careers in this industry thrive within established teams.";
  }

  function renderResults() {
    var results = state.results;
    var top3 = results.top3;
    var topArchetype = ARCHETYPES[top3[0].code];
    var rankClasses = ['rank-gold', 'rank-champagne', 'rank-peach'];
    var rankNumerals = ['1', '2', '3'];

    var cardsHtml = top3.map(function (r, i) {
      var arch = ARCHETYPES[r.code];
      return '<article class="result-card ' + rankClasses[i] + '">' +
        '<div class="result-card-head">' +
        '<span class="result-rank">' + rankNumerals[i] + '</span>' +
        '<div class="result-card-title">' +
        '<h3>' + escapeHtml(arch.name) + '</h3>' +
        '</div>' +
        '<span class="result-pct" data-target="' + r.pct + '">0%</span>' +
        '</div>' +
        '<div class="result-meter"><div class="result-meter-fill" data-target="' + r.pct + '" style="width:0%"></div></div>' +
        '</article>';
    }).join('');

    var superpowersHtml = results.superpowers.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('');
    var growthHtml = results.growthAreas.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('');
    var learningHtml = LEARNING_STYLE.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('');
    var whyFitsHtml = WHY_IIWM_FITS.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('');

    screenResults.innerHTML =
      '<div class="results-inner">' +
      '<p class="quiz-eyebrow results-eyebrow">Your Wedding Industry Career Match</p>' +

      '<div class="results-fitscore">' +
      '<p class="results-fitscore-label">Overall Fit Score</p>' +
      '<p class="results-fitscore-num"><span class="result-num" data-target="' + results.overallFitScore + '">0</span><span class="results-fitscore-max">/100</span></p>' +
      '<p class="results-fitscore-stars">' + starString(results.overallFitScore) + ' <span>' + fitLabel(results.overallFitScore) + '</span></p>' +
      '</div>' +

      '<p class="results-section-label">Your Personality</p>' +
      '<div class="results-panel">' +
      '<h2 class="results-persona-name">' + escapeHtml(topArchetype.persona) + '</h2>' +
      '<p class="results-desc results-desc--left">' + escapeHtml(topArchetype.description) + '</p>' +
      '</div>' +

      '<p class="results-section-label">Your Top Career Matches</p>' +
      '<div class="result-cards">' + cardsHtml + '</div>' +

      '<p class="results-section-label">Your Superpowers</p>' +
      '<div class="results-panel"><ul class="results-skills results-skills--check">' + superpowersHtml + '</ul></div>' +

      '<p class="results-section-label">Areas to Develop</p>' +
      '<div class="results-panel"><ul class="results-skills">' + growthHtml + '</ul></div>' +

      '<p class="results-section-label">Entrepreneur Potential</p>' +
      '<div class="results-panel">' +
      '<p class="results-fitscore-stars">' + starString(results.entrepreneurPct) + '</p>' +
      '<p>' + escapeHtml(entrepreneurBlurb(results.entrepreneurPct)) + '</p>' +
      '</div>' +

      '<p class="results-section-label">Your Learning Style</p>' +
      '<div class="results-panel">' +
      '<p>You learn best through:</p>' +
      '<ul class="results-skills">' + learningHtml + '</ul>' +
      '</div>' +

      '<div class="results-panel results-panel--path">' +
      '<p class="results-panel-label">Recommended Program</p>' +
      '<p>Why it fits:</p>' +
      '<ul class="results-skills">' + whyFitsHtml + '</ul>' +
      '</div>' +

      '<div class="results-cta-row">' +
      '<button type="button" class="quiz-btn-primary" id="bookCounsellingBtn">Book a Counselling Session</button>' +
      '</div>' +
      '<div class="results-footer-row">' +
      '<button type="button" class="results-retake" id="retakeBtn">Retake the Assessment</button>' +
      '<a class="results-retake" href="index.html">Back to Home</a>' +
      '</div>' +
      '</div>';

    document.getElementById('bookCounsellingBtn').addEventListener('click', function () {
      if (window.IIWMOpenApplicationForm) {
        window.IIWMOpenApplicationForm('Counselling Session', {
          name: state.lead && state.lead.name,
          phone: state.lead && state.lead.phone,
          extra: { archetypeName: topArchetype.name }
        });
      }
    });
    document.getElementById('retakeBtn').addEventListener('click', function () {
      state.index = 0;
      state.answers = {};
      state.lead = null;
      state.results = null;
      showScreen('landing');
    });

    animateResultsIn();
  }

  function animateResultsIn() {
    var pctEls = screenResults.querySelectorAll('.result-pct');
    var numEls = screenResults.querySelectorAll('.result-num');
    var fillEls = screenResults.querySelectorAll('.result-meter-fill');

    fillEls.forEach(function (el, i) {
      var target = parseFloat(el.getAttribute('data-target'));
      var delay = reduceMotion ? 0 : i * 180;
      setTimeout(function () { el.style.width = target + '%'; }, delay);
    });

    pctEls.forEach(function (el, i) {
      var target = parseFloat(el.getAttribute('data-target'));
      if (reduceMotion) { el.textContent = target + '%'; return; }
      var delay = i * 180;
      setTimeout(function () { animateCount(el, target, '%'); }, delay);
    });

    numEls.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      if (reduceMotion) { el.textContent = target; return; }
      animateCount(el, target, '');
    });
  }

  function animateCount(el, target, suffix) {
    var start = null;
    var duration = 900;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }


  /* ================= Utilities ================= */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ================= Wire up static controls ================= */

  if (startBtn) {
    startBtn.addEventListener('click', function () {
      showScreen('lead');
    });
  }
  if (nextBtn) nextBtn.addEventListener('click', goNext);
  if (backBtn) backBtn.addEventListener('click', goBack);
  if (leadBackBtn) leadBackBtn.addEventListener('click', goBack);
  if (exitBtn) {
    exitBtn.addEventListener('click', function () {
      window.location.href = 'index.html';
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (!screenQuestion.hidden) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' && document.activeElement.type === 'range') return;
      goNext();
    }
  });

  showScreen('landing');
})();
