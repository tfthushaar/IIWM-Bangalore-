/* Hidden admin entry point: 5 rapid clicks on the header wordmark opens a
   login modal. A normal single click still navigates home as usual —
   only reaching 5 clicks within the time window intercepts it. */
import { auth } from "./firebase-init.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { ADMIN_EMAIL_DOMAIN } from "./firebase-config.js";

(function () {
  var CLICKS_NEEDED = 5;
  var WINDOW_MS = 400;
  var clickCount = 0;
  var lastClickAt = 0;
  var navigateTimer = null;

  var wordmark = document.querySelector('.wordmark');
  if (!wordmark) return;

  /* Every click is held back briefly: if a 5th click lands inside the
     window, it opens the admin modal instead of navigating. Otherwise the
     held click(s) resolve to the normal "go home" navigation once the
     window elapses, so the link still behaves normally for everyone who
     isn't triple-mashing the logo. */
  wordmark.addEventListener('click', function (e) {
    e.preventDefault();
    var now = Date.now();
    clickCount = (now - lastClickAt > WINDOW_MS) ? 1 : clickCount + 1;
    lastClickAt = now;

    if (clickCount >= CLICKS_NEEDED) {
      clearTimeout(navigateTimer);
      clickCount = 0;
      openModal();
      return;
    }

    clearTimeout(navigateTimer);
    navigateTimer = setTimeout(function () {
      clickCount = 0;
      window.location.href = wordmark.href;
    }, WINDOW_MS);
  });

  var overlay, form, errorEl, submitBtn;

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'admin-login-overlay';
    overlay.id = 'adminLoginOverlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="admin-login-modal" role="dialog" aria-modal="true" aria-label="Admin login">' +
      '<button type="button" class="admin-login-close" aria-label="Close">&times;</button>' +
      '<p class="eyebrow">The Wedding Business School Admin</p>' +
      '<h3>Admin Login</h3>' +
      '<form id="adminLoginForm" novalidate>' +
      '<div class="admin-login-field"><label for="adminUsername">Username</label>' +
      '<input type="text" id="adminUsername" autocomplete="username" required></div>' +
      '<div class="admin-login-field"><label for="adminPassword">Password</label>' +
      '<input type="password" id="adminPassword" autocomplete="current-password" required></div>' +
      '<p class="admin-login-error" id="adminLoginError"></p>' +
      '<button type="submit" class="admin-login-submit" id="adminLoginSubmit">Log In</button>' +
      '</form>' +
      '</div>';
    document.body.appendChild(overlay);

    form = overlay.querySelector('#adminLoginForm');
    errorEl = overlay.querySelector('#adminLoginError');
    submitBtn = overlay.querySelector('#adminLoginSubmit');

    overlay.querySelector('.admin-login-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
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
    overlay.querySelector('#adminUsername').focus();
  }

  function closeModal() {
    if (overlay) overlay.hidden = true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    var username = form.querySelector('#adminUsername').value.trim().toLowerCase();
    var password = form.querySelector('#adminPassword').value;
    if (!username || !password) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';
    errorEl.textContent = '';

    var email = username.indexOf('@') !== -1 ? username : username + '@' + ADMIN_EMAIL_DOMAIN;

    signInWithEmailAndPassword(auth, email, password)
      .then(function () {
        window.location.href = 'admin.html';
      })
      .catch(function () {
        errorEl.textContent = 'Incorrect username or password.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      });
  }
})();
