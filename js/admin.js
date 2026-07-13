import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection, getDocs, query, orderBy, limit, doc, deleteDoc,
  addDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ================= Auth guard ================= */
var gateEl = document.getElementById('adminGate');
var appEl = document.getElementById('adminApp');

onAuthStateChanged(auth, function (user) {
  if (user) {
    gateEl.hidden = true;
    appEl.hidden = false;
    initDashboard();
  } else {
    window.location.href = 'index.html';
  }
});

document.getElementById('adminLogout').addEventListener('click', function () {
  signOut(auth).then(function () { window.location.href = 'index.html'; });
});

var dashboardStarted = false;
function initDashboard() {
  if (dashboardStarted) return;
  dashboardStarted = true;
  initTabs();
  initLeadsToolbar();
  initLeads();
  initPdfDownloads();
  initVisits();
  initBlogs();
}

/* ================= Tabs ================= */
function initTabs() {
  var tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('is-active'); });
      document.getElementById('panel' + capitalize(tab.dataset.tab)).classList.add('is-active');
    });
  });
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function formatDate(ts) {
  if (!ts) return '—';
  var d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ================= Leads ================= */
var leadsById = {};
var applicationsCache = [];
var counsellingCache = [];
var quizLeadsCache = [];
var contactLeadsCache = [];
var brochureLeadsCache = [];
var pdfDownloadsCache = [];
var leadSearchTerm = '';

/* Search box + refresh + CSV export buttons above the lead tables. */
function initLeadsToolbar() {
  var searchEl = document.getElementById('leadSearch');
  searchEl.addEventListener('input', function () {
    leadSearchTerm = searchEl.value.trim().toLowerCase();
    renderAllLeadTables();
    renderPdfDownloadsTable();
  });
  document.getElementById('refreshLeadsBtn').addEventListener('click', function () {
    document.getElementById('applicationsTableWrap').innerHTML = '<p class="admin-empty">Refreshing…</p>';
    document.getElementById('counsellingTableWrap').innerHTML = '<p class="admin-empty">Refreshing…</p>';
    document.getElementById('quizLeadsTableWrap').innerHTML = '<p class="admin-empty">Refreshing…</p>';
    document.getElementById('contactLeadsTableWrap').innerHTML = '<p class="admin-empty">Refreshing…</p>';
    document.getElementById('brochureLeadsTableWrap').innerHTML = '<p class="admin-empty">Refreshing…</p>';
    document.getElementById('pdfDownloadsTableWrap').innerHTML = '<p class="admin-empty">Refreshing…</p>';
    initLeads();
    initPdfDownloads();
  });
  document.querySelectorAll('[data-export]').forEach(function (btn) {
    btn.addEventListener('click', function () { exportCsv(btn.dataset.export); });
  });
}

function matchesSearch(lead) {
  if (!leadSearchTerm) return true;
  return ['name', 'phone', 'email', 'resource', 'message', 'archetypeName'].some(function (field) {
    return String(lead[field] || '').toLowerCase().indexOf(leadSearchTerm) !== -1;
  });
}

function renderAllLeadTables() {
  renderApplicationsTable();
  renderCounsellingTable();
  renderQuizLeadsTable();
  renderContactLeadsTable();
  renderBrochureLeadsTable();
}

function initLeads() {
  getDocs(query(collection(db, 'leads'), orderBy('submittedAt', 'desc')))
    .then(function (snap) {
      leadsById = {};
      applicationsCache = [];
      counsellingCache = [];
      quizLeadsCache = [];
      contactLeadsCache = [];
      brochureLeadsCache = [];
      snap.forEach(function (d) {
        var lead = Object.assign({ id: d.id }, d.data());
        leadsById[d.id] = lead;
        if (lead.source === 'Apply Now') applicationsCache.push(lead);
        else if (lead.source === 'Counselling Session') counsellingCache.push(lead);
        else if (lead.source === 'Contact Form') contactLeadsCache.push(lead);
        else if (lead.source === 'Brochure Download') brochureLeadsCache.push(lead);
        else quizLeadsCache.push(lead);
      });
      document.getElementById('applicationsCount').textContent = applicationsCache.length + ' total';
      document.getElementById('counsellingCount').textContent = counsellingCache.length + ' total';
      document.getElementById('quizLeadsCount').textContent = quizLeadsCache.length + ' total';
      document.getElementById('contactLeadsCount').textContent = contactLeadsCache.length + ' total';
      document.getElementById('brochureLeadsCount').textContent = brochureLeadsCache.length + ' total';
      document.getElementById('statApplications').textContent = applicationsCache.length;
      document.getElementById('statCounselling').textContent = counsellingCache.length;
      document.getElementById('statQuiz').textContent = quizLeadsCache.length;
      document.getElementById('statContact').textContent = contactLeadsCache.length;
      document.getElementById('statBrochure').textContent = brochureLeadsCache.length;
      renderAllLeadTables();
    })
    .catch(function (err) {
      var msg = '<p class="admin-empty">Couldn\'t load leads (' + escapeHtml(err.message) + ').</p>';
      document.getElementById('applicationsTableWrap').innerHTML = msg;
      document.getElementById('counsellingTableWrap').innerHTML = msg;
      document.getElementById('quizLeadsTableWrap').innerHTML = msg;
      document.getElementById('contactLeadsTableWrap').innerHTML = msg;
      document.getElementById('brochureLeadsTableWrap').innerHTML = msg;
    });
}

function emptyOrNoMatch(cache, emptyMsg) {
  return cache.length
    ? '<p class="admin-empty">No matches for "' + escapeHtml(leadSearchTerm) + '".</p>'
    : '<p class="admin-empty">' + emptyMsg + '</p>';
}

function renderApplicationsTable() {
  var wrap = document.getElementById('applicationsTableWrap');
  var visible = applicationsCache.filter(matchesSearch);
  if (!visible.length) {
    wrap.innerHTML = emptyOrNoMatch(applicationsCache, 'No applications yet.');
    return;
  }
  var rows = visible.map(function (lead) {
    return '<tr class="is-clickable" data-id="' + lead.id + '">' +
      '<td class="admin-table-name">' + escapeHtml(lead.name) + '</td>' +
      '<td>' + escapeHtml(lead.phone) + '</td>' +
      '<td>' + escapeHtml(truncate(lead.message, 60)) + '</td>' +
      '<td class="admin-table-muted">' + formatDate(lead.submittedAt) + '</td>' +
      '</tr>';
  }).join('');
  wrap.innerHTML =
    '<table class="admin-table"><thead><tr>' +
    '<th>Name</th><th>Phone</th><th>Message</th><th>Submitted</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
  bindLeadRowClicks(wrap);
}

function renderCounsellingTable() {
  var wrap = document.getElementById('counsellingTableWrap');
  var visible = counsellingCache.filter(matchesSearch);
  if (!visible.length) {
    wrap.innerHTML = emptyOrNoMatch(counsellingCache, 'No counselling session requests yet.');
    return;
  }
  var rows = visible.map(function (lead) {
    return '<tr class="is-clickable" data-id="' + lead.id + '">' +
      '<td class="admin-table-name">' + escapeHtml(lead.name) + '</td>' +
      '<td>' + escapeHtml(lead.phone) + '</td>' +
      '<td>' + (lead.archetypeName ? escapeHtml(lead.archetypeName) : '<span class="admin-table-muted">—</span>') + '</td>' +
      '<td>' + escapeHtml(truncate(lead.message, 60)) + '</td>' +
      '<td class="admin-table-muted">' + formatDate(lead.submittedAt) + '</td>' +
      '</tr>';
  }).join('');
  wrap.innerHTML =
    '<table class="admin-table"><thead><tr>' +
    '<th>Name</th><th>Phone</th><th>Top Match</th><th>Message</th><th>Submitted</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
  bindLeadRowClicks(wrap);
}

function renderQuizLeadsTable() {
  var wrap = document.getElementById('quizLeadsTableWrap');
  var visible = quizLeadsCache.filter(matchesSearch);
  if (!visible.length) {
    wrap.innerHTML = emptyOrNoMatch(quizLeadsCache, 'No quiz submissions yet.');
    return;
  }
  var rows = visible.map(function (lead) {
    return '<tr class="is-clickable" data-id="' + lead.id + '">' +
      '<td class="admin-table-name">' + escapeHtml(lead.name) + '</td>' +
      '<td>' + escapeHtml(lead.phone) + '</td>' +
      '<td>' + (lead.archetypeName ? escapeHtml(lead.archetypeName) : '<span class="admin-table-muted">—</span>') + '</td>' +
      '<td class="admin-table-muted">' + formatDate(lead.submittedAt) + '</td>' +
      '</tr>';
  }).join('');
  wrap.innerHTML =
    '<table class="admin-table"><thead><tr>' +
    '<th>Name</th><th>Phone</th><th>Top Match</th><th>Submitted</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
  bindLeadRowClicks(wrap);
}

function renderBrochureLeadsTable() {
  var wrap = document.getElementById('brochureLeadsTableWrap');
  var visible = brochureLeadsCache.filter(matchesSearch);
  if (!visible.length) {
    wrap.innerHTML = emptyOrNoMatch(brochureLeadsCache, 'No brochure downloads yet.');
    return;
  }
  var rows = visible.map(function (lead) {
    return '<tr class="is-clickable" data-id="' + lead.id + '">' +
      '<td class="admin-table-name">' + escapeHtml(lead.name) + '</td>' +
      '<td>' + escapeHtml(lead.phone) + '</td>' +
      '<td>' + escapeHtml(lead.resource || '') + '</td>' +
      '<td class="admin-table-muted">' + formatDate(lead.submittedAt) + '</td>' +
      '</tr>';
  }).join('');
  wrap.innerHTML =
    '<table class="admin-table"><thead><tr>' +
    '<th>Name</th><th>Phone</th><th>Resource</th><th>Submitted</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
  bindLeadRowClicks(wrap);
}

function renderContactLeadsTable() {
  var wrap = document.getElementById('contactLeadsTableWrap');
  var visible = contactLeadsCache.filter(matchesSearch);
  if (!visible.length) {
    wrap.innerHTML = emptyOrNoMatch(contactLeadsCache, 'No Contact Us enquiries yet.');
    return;
  }
  var rows = visible.map(function (lead) {
    return '<tr class="is-clickable" data-id="' + lead.id + '">' +
      '<td class="admin-table-name">' + escapeHtml(lead.name) + '</td>' +
      '<td>' + escapeHtml(lead.email) + '</td>' +
      '<td>' + escapeHtml(lead.phone) + '</td>' +
      '<td>' + escapeHtml(truncate(lead.message, 60)) + '</td>' +
      '<td class="admin-table-muted">' + formatDate(lead.submittedAt) + '</td>' +
      '</tr>';
  }).join('');
  wrap.innerHTML =
    '<table class="admin-table"><thead><tr>' +
    '<th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Submitted</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
  bindLeadRowClicks(wrap);
}

function bindLeadRowClicks(wrap) {
  wrap.querySelectorAll('tr[data-id]').forEach(function (row) {
    row.addEventListener('click', function () {
      openLeadDetail(leadsById[row.dataset.id]);
    });
  });
}

function truncate(str, len) {
  str = str || '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function openLeadDetail(lead) {
  var overlay = document.getElementById('leadDetailOverlay');
  var modal = document.getElementById('leadDetailModal');

  var pctEntries = Object.keys(lead.matchPercentages || {})
    .map(function (code) { return { code: code, pct: lead.matchPercentages[code] }; })
    .sort(function (a, b) { return b.pct - a.pct; })
    .slice(0, 6);

  var matchesHtml = pctEntries.map(function (m) {
    return '<div class="admin-match-row"><span>' + escapeHtml(m.code) + '</span><span>' + m.pct + '%</span></div>' +
      '<div class="admin-match-bar"><div class="admin-match-bar-fill" style="width:' + m.pct + '%"></div></div>';
  }).join('');

  var messageHtml = lead.message
    ? '<div class="admin-modal-section"><h4>Message</h4><p>' + escapeHtml(lead.message) + '</p></div>'
    : '';
  var resourceHtml = lead.resource
    ? '<div class="admin-modal-section"><h4>Resource</h4><p>' + escapeHtml(lead.resource) + '</p></div>'
    : '';
  var matchesSectionHtml = pctEntries.length
    ? '<div class="admin-modal-section"><h4>Top Career Matches</h4>' + matchesHtml + '</div>'
    : '';

  var metaParts = [lead.email, lead.phone, lead.source].filter(Boolean).map(escapeHtml);
  metaParts.push(formatDate(lead.submittedAt));

  modal.innerHTML =
    '<button type="button" class="admin-modal-close" id="leadDetailClose" aria-label="Close">&times;</button>' +
    '<h3>' + escapeHtml(lead.name) + '</h3>' +
    '<p class="admin-modal-meta">' + metaParts.join(' · ') + '</p>' +
    resourceHtml + messageHtml + matchesSectionHtml +
    (resourceHtml || messageHtml || matchesSectionHtml ? '' : '<p class="admin-table-muted">No additional details.</p>');

  overlay.hidden = false;
  document.getElementById('leadDetailClose').addEventListener('click', function () { overlay.hidden = true; });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.hidden = true; });
}

/* ================= PDF Downloads ================= */
function initPdfDownloads() {
  var wrap = document.getElementById('pdfDownloadsTableWrap');
  getDocs(query(collection(db, 'pdfDownloads'), orderBy('downloadedAt', 'desc'), limit(200)))
    .then(function (snap) {
      pdfDownloadsCache = [];
      snap.forEach(function (d) { pdfDownloadsCache.push(d.data()); });
      document.getElementById('pdfDownloadsCount').textContent = pdfDownloadsCache.length + ' total';
      document.getElementById('statPdf').textContent = pdfDownloadsCache.length;
      renderPdfDownloadsTable();
    })
    .catch(function (err) {
      wrap.innerHTML = '<p class="admin-empty">Couldn\'t load PDF downloads (' + escapeHtml(err.message) + ').</p>';
    });
}

function renderPdfDownloadsTable() {
  var wrap = document.getElementById('pdfDownloadsTableWrap');
  var visible = pdfDownloadsCache.filter(matchesSearch);
  if (!visible.length) {
    wrap.innerHTML = emptyOrNoMatch(pdfDownloadsCache, 'No PDF reports downloaded yet.');
    return;
  }
  var rows = visible.map(function (d) {
    return '<tr>' +
      '<td class="admin-table-name">' + escapeHtml(d.name) + '</td>' +
      '<td>' + escapeHtml(d.phone) + '</td>' +
      '<td>' + (d.archetypeName ? escapeHtml(d.archetypeName) : '<span class="admin-table-muted">—</span>') + '</td>' +
      '<td class="admin-table-muted">' + formatDate(d.downloadedAt) + '</td>' +
      '</tr>';
  }).join('');
  wrap.innerHTML =
    '<table class="admin-table"><thead><tr>' +
    '<th>Name</th><th>Phone</th><th>Top Match</th><th>Downloaded</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

/* ================= Visits =================
   analytics.js logs an anonymous pageview per page load — there is no
   visitor-identification form on the site anymore, so this tab shows
   traffic stats (per-page counts + a recent-pageviews feed) rather than
   filtering for an `identified` flag nothing sets. */
function initVisits() {
  var wrap = document.getElementById('visitsContent');
  getDocs(query(collection(db, 'visits'), orderBy('viewedAt', 'desc'), limit(500)))
    .then(function (snap) {
      var visits = [];
      snap.forEach(function (d) { visits.push(d.data()); });
      document.getElementById('visitsCount').textContent =
        visits.length + (visits.length === 500 ? '+' : '') + ' pageviews' + (visits.length === 500 ? ' (showing latest 500)' : '');
      renderVisits(visits);
    })
    .catch(function (err) {
      wrap.innerHTML = '<p class="admin-empty">Couldn\'t load visits (' + escapeHtml(err.message) + ').</p>';
    });
}

function referrerLabel(ref) {
  if (!ref) return 'Direct';
  try {
    var host = new URL(ref).hostname;
    return host === location.hostname ? 'Internal' : host;
  } catch (e) { return ref; }
}

function renderVisits(visits) {
  var wrap = document.getElementById('visitsContent');
  if (!visits.length) {
    wrap.innerHTML = '<p class="admin-empty">No pageviews logged yet.</p>';
    return;
  }

  var counts = {};
  visits.forEach(function (v) {
    var page = v.page || '(unknown)';
    counts[page] = (counts[page] || 0) + 1;
  });
  var pages = Object.keys(counts)
    .map(function (p) { return { page: p, count: counts[p] }; })
    .sort(function (a, b) { return b.count - a.count; });
  var maxCount = pages[0].count;

  var pageRows = pages.map(function (p) {
    var pct = Math.round((p.count / maxCount) * 100);
    return '<div class="admin-match-row"><span>' + escapeHtml(p.page) + '</span><span>' + p.count + '</span></div>' +
      '<div class="admin-match-bar"><div class="admin-match-bar-fill" style="width:' + pct + '%"></div></div>';
  }).join('');

  var recentRows = visits.slice(0, 30).map(function (v) {
    return '<tr>' +
      '<td class="admin-table-name">' + escapeHtml(v.page || '(unknown)') + '</td>' +
      '<td>' + escapeHtml(referrerLabel(v.referrer)) + '</td>' +
      '<td class="admin-table-muted">' + formatDate(v.viewedAt) + '</td>' +
      '</tr>';
  }).join('');

  wrap.innerHTML =
    '<div class="admin-visits-grid">' +
    '<div class="admin-visits-card"><h3>Views by Page</h3>' + pageRows + '</div>' +
    '<div class="admin-visits-card admin-visits-card--table"><h3>Recent Pageviews</h3>' +
    '<div class="admin-table-wrap admin-table-wrap--flat">' +
    '<table class="admin-table"><thead><tr><th>Page</th><th>Referrer</th><th>When</th></tr></thead>' +
    '<tbody>' + recentRows + '</tbody></table>' +
    '</div></div></div>';
}

/* ================= CSV export ================= */
var EXPORT_CONFIGS = {
  applications: {
    filename: 'iiwm-applications.csv',
    columns: ['name', 'phone', 'message', 'submittedAt'],
    rows: function () { return applicationsCache; }
  },
  counselling: {
    filename: 'iiwm-counselling-requests.csv',
    columns: ['name', 'phone', 'archetypeName', 'message', 'submittedAt'],
    rows: function () { return counsellingCache; }
  },
  quiz: {
    filename: 'iiwm-quiz-leads.csv',
    columns: ['name', 'phone', 'archetypeName', 'submittedAt'],
    rows: function () { return quizLeadsCache; }
  },
  contact: {
    filename: 'iiwm-contact-leads.csv',
    columns: ['name', 'email', 'phone', 'message', 'submittedAt'],
    rows: function () { return contactLeadsCache; }
  },
  brochure: {
    filename: 'iiwm-brochure-leads.csv',
    columns: ['name', 'phone', 'resource', 'submittedAt'],
    rows: function () { return brochureLeadsCache; }
  },
  pdf: {
    filename: 'iiwm-pdf-downloads.csv',
    columns: ['name', 'phone', 'archetypeName', 'downloadedAt'],
    rows: function () { return pdfDownloadsCache; }
  }
};

function csvCell(value) {
  if (value == null) return '';
  if (value.toDate) value = value.toDate().toISOString();
  value = String(value);
  return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}

function exportCsv(key) {
  var config = EXPORT_CONFIGS[key];
  if (!config) return;
  var rows = config.rows();
  if (!rows.length) return;
  var lines = [config.columns.join(',')];
  rows.forEach(function (row) {
    lines.push(config.columns.map(function (col) { return csvCell(row[col]); }).join(','));
  });
  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = config.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/* ================= Blogs ================= */
var blogsCache = [];

function initBlogs() {
  loadBlogs();
  document.getElementById('newBlogBtn').addEventListener('click', function () { openBlogEditor(null); });
}

function loadBlogs() {
  getDocs(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')))
    .then(function (snap) {
      blogsCache = [];
      snap.forEach(function (d) { blogsCache.push(Object.assign({ id: d.id }, d.data())); });
      renderBlogsList();
    })
    .catch(function (err) {
      document.getElementById('blogsListWrap').innerHTML =
        '<p class="admin-empty">Couldn\'t load posts (' + escapeHtml(err.message) + ').</p>';
    });
}

function renderBlogsList() {
  var wrap = document.getElementById('blogsListWrap');
  wrap.hidden = false;
  document.getElementById('blogEditorWrap').hidden = true;

  if (!blogsCache.length) {
    wrap.innerHTML = '<p class="admin-empty">No blog posts yet — click "New Post" to write the first one.</p>';
    return;
  }
  wrap.innerHTML = blogsCache.map(function (post, i) {
    return '<div class="admin-blog-card">' +
      '<div class="admin-blog-card-body">' +
      '<h4>' + escapeHtml(post.title) + (post.published ? '' : ' <span class="admin-pill">Draft</span>') + '</h4>' +
      '<p>' + escapeHtml(post.dateLabel || '') + ' — ' + escapeHtml(post.excerpt || '') + '</p>' +
      '</div>' +
      '<div class="admin-blog-card-actions">' +
      '<button type="button" class="btn-admin-ghost" data-edit="' + i + '">Edit</button>' +
      '<button type="button" class="btn-admin-danger" data-delete="' + i + '">Delete</button>' +
      '</div></div>';
  }).join('');

  wrap.querySelectorAll('[data-edit]').forEach(function (btn) {
    btn.addEventListener('click', function () { openBlogEditor(blogsCache[parseInt(btn.dataset.edit, 10)]); });
  });
  wrap.querySelectorAll('[data-delete]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var post = blogsCache[parseInt(btn.dataset.delete, 10)];
      if (!window.confirm('Delete "' + post.title + '"? This can\'t be undone.')) return;
      deleteDoc(doc(db, 'blogs', post.id)).then(loadBlogs);
    });
  });
}

function openBlogEditor(post) {
  document.getElementById('blogsListWrap').hidden = true;
  var editorWrap = document.getElementById('blogEditorWrap');
  editorWrap.hidden = false;

  editorWrap.innerHTML =
    '<div class="admin-editor">' +
    '<div class="admin-field"><label for="postTitle">Title</label><input type="text" id="postTitle" value="' + escapeHtml(post ? post.title : '') + '"></div>' +
    '<div class="admin-field-row">' +
    '<div class="admin-field"><label for="postDateLabel">Date label (shown on the card)</label><input type="text" id="postDateLabel" placeholder="e.g. July 2026" value="' + escapeHtml(post ? post.dateLabel : '') + '"></div>' +
    '<div class="admin-field"><label for="postExcerpt">Excerpt</label><input type="text" id="postExcerpt" value="' + escapeHtml(post ? post.excerpt : '') + '"></div>' +
    '</div>' +
    '<div class="admin-field"><label for="postContent">Content</label><textarea id="postContent">' + escapeHtml(post ? post.content : '') + '</textarea></div>' +
    '<div class="admin-checkbox-field"><input type="checkbox" id="postPublished"' + (post && post.published ? ' checked' : '') + '><label for="postPublished">Published (visible on the public Blog page)</label></div>' +
    '<div class="admin-editor-actions">' +
    '<button type="button" class="btn-admin-primary" id="saveBlogBtn">Save Post</button>' +
    '<button type="button" class="btn-admin-ghost" id="cancelBlogBtn">Cancel</button>' +
    '<span class="admin-save-msg" id="blogSaveMsg"></span>' +
    '</div></div>';

  document.getElementById('cancelBlogBtn').addEventListener('click', renderBlogsList);
  document.getElementById('saveBlogBtn').addEventListener('click', function () { saveBlogPost(post); });
}

function slugify(title) {
  return String(title).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function saveBlogPost(existingPost) {
  var title = document.getElementById('postTitle').value.trim();
  var dateLabel = document.getElementById('postDateLabel').value.trim();
  var excerpt = document.getElementById('postExcerpt').value.trim();
  var content = document.getElementById('postContent').value.trim();
  var published = document.getElementById('postPublished').checked;
  var msgEl = document.getElementById('blogSaveMsg');

  if (!title || !content) {
    msgEl.textContent = 'Title and content are required.';
    return;
  }

  var data = {
    title: title,
    slug: slugify(title),
    dateLabel: dateLabel,
    excerpt: excerpt,
    content: content,
    published: published,
    updatedAt: serverTimestamp()
  };

  msgEl.textContent = 'Saving…';
  var savePromise = existingPost
    ? updateDoc(doc(db, 'blogs', existingPost.id), data)
    : addDoc(collection(db, 'blogs'), Object.assign({ createdAt: serverTimestamp() }, data));

  savePromise.then(function () {
    loadBlogs();
  }).catch(function (err) {
    msgEl.textContent = 'Could not save: ' + err.message;
  });
}
