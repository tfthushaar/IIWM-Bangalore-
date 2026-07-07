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

  /* TODO(IIWM): add the WhatsApp number (country code + number, no symbols,
     e.g. '911234567890') to enable the "Book a Counselling Session" CTA. */
  var WHATSAPP_NUMBER = '';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SECTION_SCALE_LABELS = {
    'Interests': ['Not for me', 'Love it'],
    'Skills': ['Still developing', 'Excellent'],
    'Stress Tolerance': ['I struggle', 'I thrive']
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
  var TOTAL = QUESTIONS.length;
  var MAX_POSSIBLE = computeMaxPossible();

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

  function computeMaxPossible() {
    var max = {};
    Object.keys(ARCHETYPES).forEach(function (a) { max[a] = 0; });

    QUESTIONS.forEach(function (q) {
      if (q.type === 'slider') {
        Object.keys(q.archetypeWeights).forEach(function (a) {
          max[a] += q.archetypeWeights[a];
        });
      } else if (q.type === 'single') {
        var perArchetype = {};
        q.options.forEach(function (opt) {
          Object.keys(opt.archetypeWeights || {}).forEach(function (a) {
            perArchetype[a] = Math.max(perArchetype[a] || 0, opt.archetypeWeights[a]);
          });
        });
        Object.keys(perArchetype).forEach(function (a) { max[a] += perArchetype[a]; });
      } else if (q.type === 'multi') {
        var byArchetype = {};
        q.options.forEach(function (opt) {
          Object.keys(opt.archetypeWeights || {}).forEach(function (a) {
            (byArchetype[a] = byArchetype[a] || []).push(opt.archetypeWeights[a]);
          });
        });
        Object.keys(byArchetype).forEach(function (a) {
          var arr = byArchetype[a].sort(function (x, y) { return y - x; });
          var top = arr.slice(0, q.pick).reduce(function (s, v) { return s + v; }, 0);
          max[a] += top;
        });
      }
    });
    return max;
  }

  function computeScores() {
    var scores = {};
    var contributions = {};
    Object.keys(ARCHETYPES).forEach(function (a) { scores[a] = 0; contributions[a] = []; });

    QUESTIONS.forEach(function (q) {
      var ans = state.answers[q.id];
      if (q.type === 'slider') {
        var value = (ans == null) ? 3 : ans;
        Object.keys(q.archetypeWeights).forEach(function (a) {
          var amt = q.archetypeWeights[a] * (value / 5);
          scores[a] += amt;
          if (amt > 0) contributions[a].push({ label: q.label, amount: amt });
        });
      } else if (q.type === 'single') {
        if (ans != null) {
          var opt = q.options[ans];
          Object.keys(opt.archetypeWeights || {}).forEach(function (a) {
            var w = opt.archetypeWeights[a];
            scores[a] += w;
            contributions[a].push({ label: opt.why || opt.label, amount: w });
          });
        }
      } else if (q.type === 'multi') {
        (ans || []).forEach(function (i) {
          var o = q.options[i];
          Object.keys(o.archetypeWeights || {}).forEach(function (a) {
            var w = o.archetypeWeights[a];
            scores[a] += w;
            contributions[a].push({ label: o.why || o.label, amount: w });
          });
        });
      }
    });

    var percentages = {};
    Object.keys(ARCHETYPES).forEach(function (a) {
      percentages[a] = MAX_POSSIBLE[a] > 0
        ? Math.max(0, Math.min(100, Math.round((scores[a] / MAX_POSSIBLE[a]) * 100)))
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

    return { scores: scores, percentages: percentages, ranked: ranked, contributions: contributions };
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
      source: 'Career Profiler Quiz',
      submittedAt: new Date().toISOString(),
      archetypeCode: top.code,
      archetypeName: ARCHETYPES[top.code].name,
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
        phone: leadForm.elements.phone.value
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

  function whyText(code, results) {
    var contribs = results.contributions[code].slice(0, 3).map(function (c) { return c.label; });
    if (!contribs.length) return 'This match is based on your overall pattern of answers across the assessment.';
    if (contribs.length === 1) return 'This match is driven mainly by your strength in ' + contribs[0] + '.';
    var last = contribs.pop();
    return 'This match is driven by your standout strengths in ' + contribs.join(', ') + ' and ' + last + '.';
  }

  function renderResults() {
    var results = state.results;
    var top3 = results.ranked.slice(0, 3);
    var topArchetype = ARCHETYPES[top3[0].code];
    var rankClasses = ['rank-gold', 'rank-champagne', 'rank-peach'];
    var rankNumerals = ['01', '02', '03'];
    var rankLabels = ['Your Best Match', 'Also Consider', 'Creative Compatibility'];

    var cardsHtml = top3.map(function (r, i) {
      var arch = ARCHETYPES[r.code];
      return '<article class="result-card ' + rankClasses[i] + '">' +
        '<div class="result-card-head">' +
        '<span class="result-rank">' + rankNumerals[i] + '</span>' +
        '<div class="result-card-title">' +
        '<p class="result-card-kicker">' + escapeHtml(rankLabels[i]) + '</p>' +
        '<h3>' + escapeHtml(arch.name) + '</h3>' +
        '<p>' + escapeHtml(whyText(r.code, results)) + '</p>' +
        '</div>' +
        '<span class="result-pct" data-target="' + r.pct + '">0%</span>' +
        '</div>' +
        '<div class="result-meter"><div class="result-meter-fill" data-target="' + r.pct + '" style="width:0%"></div></div>' +
        '</article>';
    }).join('');

    var skillsHtml = topArchetype.skills.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('');

    var whatsappHref = buildWhatsAppLink(state.lead, topArchetype.name);

    screenResults.innerHTML =
      '<div class="results-inner">' +
      '<p class="quiz-eyebrow results-eyebrow">Your Result</p>' +
      '<h1 class="results-headline">' + escapeHtml(topArchetype.headline) + '</h1>' +
      '<p class="results-desc">' + escapeHtml(topArchetype.description) + '</p>' +

      '<p class="results-section-label">Your Top 3 Career Matches</p>' +
      '<div class="result-cards">' + cardsHtml + '</div>' +

      '<div class="results-panel">' +
      '<p class="results-panel-label">Skills to Develop</p>' +
      '<ul class="results-skills">' + skillsHtml + '</ul>' +
      '</div>' +

      '<div class="results-panel results-panel--path">' +
      '<p class="results-panel-label">Recommended IIWM Path</p>' +
      '<p class="results-path">' + escapeHtml(topArchetype.path) + '</p>' +
      '</div>' +

      '<div class="results-cta-row">' +
      '<a class="quiz-btn-primary" href="' + whatsappHref + '" target="_blank" rel="noopener">Book a Counselling Session</a>' +
      '<button type="button" class="quiz-btn-secondary" id="downloadReportBtn">Download Full Report (PDF)</button>' +
      '</div>' +
      '<div class="results-footer-row">' +
      '<button type="button" class="results-retake" id="retakeBtn">Retake the Assessment</button>' +
      '<a class="results-retake" href="index.html">Back to Home</a>' +
      '</div>' +
      '</div>';

    document.getElementById('downloadReportBtn').addEventListener('click', function () {
      downloadResultsPdf(topArchetype, top3, state.lead, results);
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

  function downloadResultsPdf(topArchetype, top3, lead, results) {
    var jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDFCtor) return;

    var doc = new jsPDFCtor({ unit: 'pt', format: 'a4' });
    var margin = 48;
    var pageWidth = doc.internal.pageSize.getWidth();
    var contentWidth = pageWidth - margin * 2;
    var y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(169, 128, 63);
    doc.text('IIWM BANGALORE', margin, y);
    y += 22;

    doc.setFontSize(20);
    doc.setTextColor(43, 33, 24);
    doc.text('Wedding Career Profile', margin, y);
    y += 26;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    doc.text('Prepared for ' + (lead && lead.name ? lead.name : 'You'), margin, y);
    y += 30;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(43, 33, 24);
    var headlineLines = doc.splitTextToSize(topArchetype.headline, contentWidth);
    doc.text(headlineLines, margin, y);
    y += headlineLines.length * 18 + 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(90, 75, 60);
    var descLines = doc.splitTextToSize(topArchetype.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 15 + 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(43, 33, 24);
    doc.text('Your Top 3 Career Matches', margin, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    top3.forEach(function (r, i) {
      var arch = ARCHETYPES[r.code];
      doc.text((i + 1) + '. ' + arch.name + ' — ' + r.pct + '%', margin, y);
      y += 16;
    });
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Skills to Develop', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    topArchetype.skills.forEach(function (s) {
      var lines = doc.splitTextToSize('• ' + s, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 15;
    });
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Recommended IIWM Path', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    var pathLines = doc.splitTextToSize(topArchetype.path, contentWidth);
    doc.text(pathLines, margin, y);

    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text('Generated by the IIWM Bangalore Wedding Career Profiler', margin, 800);

    var filenameSafe = (lead && lead.name ? lead.name.replace(/[^a-z0-9]+/gi, '-') : 'guest');
    doc.save('IIWM-Career-Profile-' + filenameSafe + '.pdf');

    if (window.IIWMFirebaseLogPdf) {
      window.IIWMFirebaseLogPdf({
        name: (lead && lead.name) || '',
        phone: (lead && lead.phone) || '',
        archetypeName: topArchetype.name,
        matchPercentages: results.percentages
      }).catch(function () { /* logging is best-effort — download already happened */ });
    }
  }

  function animateResultsIn() {
    var pctEls = screenResults.querySelectorAll('.result-pct');
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
      setTimeout(function () { animateCount(el, target); }, delay);
    });
  }

  function animateCount(el, target) {
    var start = null;
    var duration = 900;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + '%';
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function buildWhatsAppLink(lead, archetypeName) {
    var msg = 'Hi IIWM, I just completed the Wedding Career Profiler and matched as a ' + archetypeName +
      '. My name is ' + (lead && lead.name ? lead.name : '') + '. I would like to book a counselling session.';
    var base = 'https://wa.me/' + WHATSAPP_NUMBER;
    return base + '?text=' + encodeURIComponent(msg);
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
