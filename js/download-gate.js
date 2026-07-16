/* Gates every PDF download behind a minimal Name + Contact Number form.
   Any <a data-gate-resource="..."> on the page is intercepted: clicking it
   opens the modal instead of downloading immediately. Submitting logs a
   lead (source: 'Brochure Download') to Firestore, then triggers the real
   file download. If Firestore is unreachable the download still proceeds
   (falls back to localStorage), same fire-and-forget pattern used by the
   quiz and contact form. */
import { db } from "./firebase-init.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

(function () {
  var LEADS_STORAGE_KEY = 'iiwm_brochure_leads';
  var links = document.querySelectorAll('a[data-gate-resource]');
  if (!links.length) return;

  var overlay, form, errorEl, submitBtn;
  var pendingHref = '', pendingResource = '', pendingFilename = '';

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      pendingHref = link.getAttribute('href');
      pendingResource = link.getAttribute('data-gate-resource');
      pendingFilename = link.getAttribute('download') || '';
      openModal();
    });
  });

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'admin-login-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="admin-login-modal" role="dialog" aria-modal="true" aria-label="Get your download">' +
      '<button type="button" class="admin-login-close" aria-label="Close">&times;</button>' +
      '<p class="eyebrow">The Wedding Business School</p>' +
      '<h3>Get Your Download</h3>' +
      '<form id="downloadGateForm" novalidate>' +
      '<div class="admin-login-field"><label for="dgName">Full Name</label>' +
      '<input type="text" id="dgName" autocomplete="name" required></div>' +
      '<div class="admin-login-field"><label for="dgPhone">Contact Number</label>' +
      '<input type="tel" id="dgPhone" autocomplete="tel" required></div>' +
      '<p class="admin-login-error" id="dgError"></p>' +
      '<button type="submit" class="admin-login-submit" id="dgSubmit">Download Now</button>' +
      '</form></div>';
    document.body.appendChild(overlay);

    form = overlay.querySelector('#downloadGateForm');
    errorEl = overlay.querySelector('#dgError');
    submitBtn = overlay.querySelector('#dgSubmit');

    overlay.querySelector('.admin-login-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) closeModal();
    });
    form.addEventListener('submit', handleSubmit);
  }

  function openModal() {
    if (!overlay) buildModal();
    overlay.hidden = false;
    errorEl.textContent = '';
    form.reset();
    overlay.querySelector('#dgName').focus();
  }

  function closeModal() {
    if (overlay) overlay.hidden = true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    var name = form.querySelector('#dgName').value.trim();
    var phone = form.querySelector('#dgPhone').value.trim();
    var digits = phone.replace(/[^\d]/g, '');

    if (!name || name.length < 2) { errorEl.textContent = 'Please enter your full name.'; return; }
    if (digits.length < 8) { errorEl.textContent = 'Please enter a valid contact number.'; return; }

    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait…';

    /* email must be present (as a string) for the Firestore rules' lead
       shape check — the gate form intentionally only asks name + phone. */
    var record = { name: name, phone: phone, email: '', source: 'Brochure Download', resource: pendingResource };

    addDoc(collection(db, 'leads'), Object.assign({}, record, { submittedAt: serverTimestamp() }))
      .catch(function () { saveLocally(Object.assign({}, record, { submittedAt: new Date().toISOString() })); })
      .then(function () {
        triggerDownload();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Download Now';
        closeModal();
      });
  }

  function saveLocally(record) {
    try {
      var existing = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
      existing.push(record);
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) { /* storage unavailable — ignore */ }
  }

  function triggerDownload() {
    var a = document.createElement('a');
    a.href = pendingHref;
    a.setAttribute('download', pendingFilename || '');
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
})();
