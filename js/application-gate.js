/* Shared "Apply Now" / "Book a Counselling Session" modal. Any element
   with data-open-application="<source label>" opens it (used for the
   site-wide Apply Now links); quiz.js calls
   window.IIWMOpenApplicationForm(source, prefill) directly instead,
   since it needs to pass along the name/phone already captured earlier
   in the quiz flow.

   Submits to the same Firestore `leads` collection every other lead
   source uses, tagged with its own `source` value so it shows up as
   its own table in the admin Leads tab. Falls back to localStorage if
   Firebase is unreachable, same pattern as the quiz/contact/brochure
   forms. */
import { db } from "./firebase-init.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

var LEADS_STORAGE_KEY = 'iiwm_application_leads';

var COPY = {
  'Apply Now': {
    title: 'Apply Now',
    intro: '1. Send your resume to <a href="mailto:apply@theweddingbusiness.school">apply@theweddingbusiness.school</a> and our team will get back to you.',
    submitLabel: 'Submit Application',
    successTitle: 'Thank you!',
    successBody: 'Thank you for your application. Our team will get back to you ASAP!'
  },
  'Counselling Session': {
    title: 'Book a Counselling Session',
    submitLabel: 'Request Session',
    successTitle: 'Thank you!',
    successBody: 'Thank you for your request. Our team will get back to you ASAP!'
  }
};

var overlay, modal;

document.addEventListener('click', function (e) {
  var trigger = e.target.closest('[data-open-application]');
  if (!trigger) return;
  e.preventDefault();
  openApplicationForm(trigger.getAttribute('data-open-application'));
});

function openApplicationForm(source, prefill) {
  var copy = COPY[source] || COPY['Apply Now'];
  if (!overlay) buildOverlay();

  var name = (prefill && prefill.name) || '';
  var phone = (prefill && prefill.phone) || '';
  var extra = (prefill && prefill.extra) || {};

  var introHtml = copy.intro
    ? '<p style="font-size:16.5px;font-weight:700;line-height:1.5;color:var(--ink);margin:4px 0 20px">' + copy.intro + '</p>'
    : '';

  modal.innerHTML =
    '<button type="button" class="admin-login-close" aria-label="Close">&times;</button>' +
    '<p class="eyebrow">The Wedding Business School</p>' +
    '<h3>' + escapeHtml(copy.title) + '</h3>' +
    '<form id="applicationForm" novalidate>' +
    '<div class="admin-login-field"><label for="appName">Full Name</label>' +
    '<input type="text" id="appName" autocomplete="name" value="' + escapeHtml(name) + '" required></div>' +
    '<div class="admin-login-field"><label for="appPhone">Contact Number</label>' +
    '<input type="tel" id="appPhone" autocomplete="tel" value="' + escapeHtml(phone) + '" required></div>' +
    introHtml +
    '<div class="admin-login-field"><label for="appMessage">Anything you\'d like to share? (optional)</label>' +
    '<textarea id="appMessage" rows="4"></textarea></div>' +
    '<p class="admin-login-error" id="appError"></p>' +
    '<button type="submit" class="admin-login-submit" id="appSubmitBtn">' + escapeHtml(copy.submitLabel) + '</button>' +
    '</form>';

  overlay.hidden = false;
  modal.querySelector('.admin-login-close').addEventListener('click', closeForm);
  modal.querySelector('#applicationForm').addEventListener('submit', function (e) {
    e.preventDefault();
    handleSubmit(source, copy, extra);
  });
  modal.querySelector('#appName').focus();
}

function buildOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'admin-login-overlay';
  overlay.hidden = true;
  overlay.innerHTML = '<div class="admin-login-modal" role="dialog" aria-modal="true" aria-label="Application form"></div>';
  document.body.appendChild(overlay);
  modal = overlay.querySelector('.admin-login-modal');
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeForm(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeForm();
  });
}

function closeForm() { overlay.hidden = true; }

function handleSubmit(source, copy, extra) {
  var name = modal.querySelector('#appName').value.trim();
  var phone = modal.querySelector('#appPhone').value.trim();
  var message = modal.querySelector('#appMessage').value.trim();
  var errorEl = modal.querySelector('#appError');
  var submitBtn = modal.querySelector('#appSubmitBtn');

  var digits = phone.replace(/[^\d]/g, '');
  if (!name || name.length < 2) { errorEl.textContent = 'Please enter your full name.'; return; }
  if (digits.length < 8) { errorEl.textContent = 'Please enter a valid contact number.'; return; }

  errorEl.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Please wait…';

  var record = Object.assign({ name: name, phone: phone, message: message, source: source }, extra || {});

  addDoc(collection(db, 'leads'), Object.assign({}, record, { submittedAt: serverTimestamp() }))
    .then(showSuccess)
    .catch(function () {
      saveLocally(Object.assign({}, record, { submittedAt: new Date().toISOString() }));
      showSuccess();
    });

  function showSuccess() {
    modal.innerHTML =
      '<button type="button" class="admin-login-close" aria-label="Close">&times;</button>' +
      '<div class="form-success-msg"><strong>' + escapeHtml(copy.successTitle) + '</strong>' + escapeHtml(copy.successBody) + '</div>';
    modal.querySelector('.admin-login-close').addEventListener('click', closeForm);
  }
}

function saveLocally(record) {
  try {
    var existing = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
    existing.push(record);
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) { /* storage unavailable — ignore */ }
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

window.IIWMOpenApplicationForm = openApplicationForm;
