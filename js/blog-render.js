/* Renders published posts from Firestore into the blog grid. If there
   are none yet (or Firebase isn't reachable), the static placeholder
   cards already in the page are left exactly as they are. */
import { db } from "./firebase-init.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

getDocs(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')))
  .then(function (snap) {
    var posts = [];
    snap.forEach(function (d) {
      var data = d.data();
      if (data.published) posts.push(Object.assign({ id: d.id }, data));
    });
    if (!posts.length) return;
    renderGrid(posts);
  })
  .catch(function () { /* keep the static placeholder cards */ });

function renderGrid(posts) {
  var grid = document.getElementById('blogGrid');
  grid.innerHTML = posts.map(function (post, i) {
    return '<article class="blog-card">' +
      '<div class="blog-card-body">' +
      '<p class="blog-card-date">' + escapeHtml(post.dateLabel || '') + '</p>' +
      '<h3>' + escapeHtml(post.title) + '</h3>' +
      '<p>' + escapeHtml(post.excerpt || '') + '</p>' +
      '<a class="blog-card-link" href="#" data-post="' + i + '">Read More &rarr;</a>' +
      '</div></article>';
  }).join('');

  grid.querySelectorAll('[data-post]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openPost(posts[parseInt(link.dataset.post, 10)], posts);
    });
  });
}

/* Every post links out to the program, admissions, career assessment,
   mentor and founder pages, plus up to 3 other posts as related
   reading - fixed links, not per-post content, so this applies to
   every post automatically (past, present and any added later via the
   admin panel) with no manual editing per post. */
function openPost(post, allPosts) {
  var overlay = document.getElementById('postDetailOverlay');
  var modal = document.getElementById('postDetailModal');

  var related = (allPosts || []).filter(function (p) { return p !== post; }).slice(0, 3);
  var relatedHtml = related.length
    ? '<div class="blog-post-related">' +
      '<p class="blog-post-links-label">Related Reading</p>' +
      related.map(function (p) {
        return '<a href="#" class="blog-post-related-link" data-related="' + escapeHtml(p.id) + '">' + escapeHtml(p.title) + '</a>';
      }).join('') +
      '</div>'
    : '';

  modal.innerHTML =
    '<button type="button" class="blog-post-close" id="postDetailClose" aria-label="Close">&times;</button>' +
    '<p class="blog-post-modal-date">' + escapeHtml(post.dateLabel || '') + '</p>' +
    '<h2>' + escapeHtml(post.title) + '</h2>' +
    '<div class="blog-post-modal-body">' + escapeHtml(post.content) + '</div>' +
    '<div class="blog-post-links">' +
    '<p class="blog-post-links-label">Continue Exploring</p>' +
    '<a href="program.html">Explore the Program</a>' +
    '<a href="admissions.html">Admissions &amp; Fees</a>' +
    '<a href="careerprofiler.html">Take the Career Assessment</a>' +
    '<a href="srividya.html">Meet Our Mentors</a>' +
    '<a href="founder.html">Meet the Founder</a>' +
    '</div>' +
    relatedHtml;

  overlay.hidden = false;
  document.getElementById('postDetailClose').addEventListener('click', function () { overlay.hidden = true; });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.hidden = true; });
  modal.querySelectorAll('[data-related]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = allPosts.filter(function (p) { return p.id === link.dataset.related; })[0];
      if (target) openPost(target, allPosts);
    });
  });
}
