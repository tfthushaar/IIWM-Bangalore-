(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobile menu ---- */
  var menuToggle = document.getElementById('menuToggle');
  var menuClose = document.getElementById('menuClose');
  var mobileMenu = document.getElementById('mobileMenu');

  function openMenu() {
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var firstLink = mobileMenu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menuToggle.focus();
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('is-open');
      if (isOpen) closeMenu(); else openMenu();
    });
    menuClose.addEventListener('click', closeMenu);
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && mobileMenu.classList.contains('is-open')) closeMenu();
    });
  }

  /* ---- Nav dropdown (e.g. Inner Circle) ----
     Click-to-toggle, since the trigger no longer links anywhere itself —
     :hover/:focus-within in CSS still open it too, this just adds an
     explicit click/tap toggle on top for pointer and touch users. */
  document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
    var trigger = dropdown.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      document.querySelectorAll('.nav-dropdown.is-open').forEach(function (other) {
        if (other !== dropdown) {
          other.classList.remove('is-open');
          var otherTrigger = other.querySelector('.nav-dropdown-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.nav-dropdown.is-open').forEach(function (dropdown) {
      dropdown.classList.remove('is-open');
      var trigger = dropdown.querySelector('.nav-dropdown-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-dropdown.is-open').forEach(function (dropdown) {
        dropdown.classList.remove('is-open');
        var trigger = dropdown.querySelector('.nav-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* ---- Section reveal ----
     Previously gated behind an IntersectionObserver that faded each
     section in as it scrolled into view. On some mobile browsers that
     left freshly-navigated pages showing a blank gap below the banner
     until a scroll/keypress happened to fire the observer callback. All
     content now shows immediately on load instead. */
  var revealEls = document.querySelectorAll('[data-reveal]');
  revealEls.forEach(function (el) { el.classList.add('is-visible'); });

  /* ---- Footer year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Header scroll state ---- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var ticking = false;
    function updateHeader() {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    }
    updateHeader();
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---- Desktop floating apply bar: hidden while the homepage hero is
     in view, since the hero has its own inline Explore Program/Download
     Brochure/Watch Video row that the fixed bar would otherwise sit on
     top of. CSS only applies the resulting class at desktop widths, so
     mobile — where the bar is meant to stay visible throughout — is
     unaffected. Pages without a #hero section simply never get the
     class removed, so the bar shows as normal everywhere else. */
  var hero = document.getElementById('hero');
  if (hero && 'IntersectionObserver' in window) {
    document.body.classList.add('hero-in-view');
    var heroObserver = new IntersectionObserver(function (entries) {
      document.body.classList.toggle('hero-in-view', entries[0].isIntersecting);
    }, { threshold: 0, rootMargin: '-72px 0px 0px 0px' });
    heroObserver.observe(hero);
  }

  /* ---- Career roles: show 3, expand to see the rest ---- */
  var careerExtra = document.getElementById('careerExtra');
  var careerExpandToggle = document.getElementById('careerExpandToggle');
  if (careerExtra && careerExpandToggle) {
    careerExpandToggle.addEventListener('click', function () {
      var expanded = careerExpandToggle.getAttribute('aria-expanded') === 'true';
      careerExtra.hidden = expanded;
      careerExpandToggle.setAttribute('aria-expanded', String(!expanded));
      careerExpandToggle.querySelector('.career-expand-label').textContent =
        expanded ? 'Show More' : 'Show Less';
    });
  }

  /* ---- Career role popup (homepage "Career Path" section) ----
     Content summarised from assets/PDFS/The_Wedding_Business_School_Careers_Compilation.pdf
     — one page per role in that deck. */
  var ROLE_DATA = {
    'wedding-planner': {
      title: 'Luxury Wedding Planner',
      tagline: 'The mastermind who plans, organizes & brings every celebration to life seamlessly.',
      summary: 'A Wedding Planner is your partner, guide and problem solver—turning your dreams into a beautifully planned, stress-free celebration you and your guests will cherish forever.',
      items: [
        ['Understand & Consult', 'Listens to your story, vision, preferences and priorities to create a celebration that truly reflects you.'],
        ['Plan & Strategize', 'Designs a personalized plan with the right mix of creativity, logistics, timeline and budget.'],
        ['Vendor Selection & Coordination', 'Connects you with trusted vendors and manages all communication and coordination.'],
        ['Budget Management', 'Helps plan smart, prioritize what matters and protect value without compromising quality.'],
        ['Timeline & Schedule Management', 'Creates and manages a detailed timeline so everything happens at the right time, every time.'],
        ['Design & Décor Planning', 'Conceptualizes the look and feel, curating every element into one cohesive experience.'],
        ['On-Site Execution', 'Oversees every detail on the big day, coordinates the team and handles last-minute situations.'],
        ['Peace of Mind', 'Takes care of the planning, people and problems—so you can relax and create memories that last.']
      ],
      quote: 'I handle the details, so you can be present in the moments that matter most.',
      closing: 'Behind every magical wedding is a planner who cares.'
    },
    'wedding-designer': {
      title: 'Wedding Designer',
      tagline: 'The creative visionary who designs breathtaking weddings that leave a lasting impression.',
      summary: 'A wedding designer is the creative architect behind every unforgettable celebration—transforming ideas into immersive, beautifully curated experiences that reflect your story, style and soul.',
      items: [
        ['Concept Creation', 'Imagines, conceptualises and brings your vision to life with originality and creativity.'],
        ['Theme & Style Development', 'Crafts a cohesive design language that reflects your personality and celebration style.'],
        ['Design Planning', 'Mood boards, colour stories, layouts and materials—planned to perfection.'],
        ['Décor & Floral Design', 'Curates stunning décor elements and floral artistry that elevate every space.'],
        ['Spatial Design', 'Designs the perfect flow, seating, stage and mandap for the guest experience.'],
        ['Vendor Collaboration', 'Works with trusted artisans and vendors to ensure flawless execution.'],
        ['Execution Management', 'Oversees on-ground execution to bring every detail to life seamlessly.'],
        ['Emotional Design', 'Designs moments that evoke emotions and create lifelong memories.']
      ],
      quote: 'We design the dream. You live the moment. We make it magical.',
      closing: 'Beyond decor. Beyond beautiful. We design dreams.'
    },
    'floral-designer': {
      title: 'Floral Designer',
      tagline: 'The artist who brings emotions to life through flowers & delicate details.',
      summary: "A Floral Designer transforms nature's beauty into breathtaking designs that set the mood, elevate the space and leave lasting impressions.",
      items: [
        ['Concept & Design', 'Understands your story, theme and vision to create bespoke floral concepts.'],
        ['Colour & Flower Selection', 'Thoughtfully selects blooms, textures and greens to harmonize with your theme.'],
        ['Floral Styling & Installation', 'Styles everything from bouquets to grand installations with precision and flair.'],
        ['Sourcing & Quality Control', 'Sources the freshest blooms and ensures top quality for lasting beauty.'],
        ['Spatial Transformation', 'Uses flowers to transform spaces, creating depth, movement and atmosphere.'],
        ['Details That Delight', 'Focuses on every little detail, from centerpieces to aisle blooms.'],
        ['Setup & On-Day Management', 'Ensures timely execution and on-site management for a stress-free celebration.']
      ],
      quote: "We don't just place flowers, we craft experiences that bloom in every heart and memory.",
      closing: 'Flowers fade, but the feeling they create lasts forever.'
    },
    'destination-wedding-specialist': {
      title: 'Destination Wedding Specialist',
      tagline: 'The expert who creates magical celebrations in extraordinary locations around the world.',
      summary: 'A Destination Wedding Specialist turns dreams of a wedding in paradise into reality with expertise, precision and passion—wherever in the world the couple wants to celebrate.',
      items: [
        ['Destination Research & Selection', 'Helps couples choose the perfect location for their vision, preferences and budget.'],
        ['Travel & Logistics Management', 'Manages flights, transfers, accommodation and visas for a smooth journey.'],
        ['Vendor Curation & Management', 'Builds and manages a reliable team of trusted local partners.'],
        ['Design & Experience Curation', 'Blends the essence of the location with your story for a unique wedding.'],
        ['Planning Across Time Zones', 'Coordinates every detail efficiently, bridging distances and time zones.'],
        ['Guest Experience Management', 'Plans memorable experiences that make every guest feel welcomed.'],
        ['Risk Management & Problem Solving', 'Anticipates challenges with contingency plans for a stress-free celebration.'],
        ['Local Culture & Legal Compliance', 'Ensures legal formalities and cultural nuances are respected throughout.']
      ],
      quote: "We don't just plan weddings in beautiful places, we create experiences that you and your guests will treasure forever.",
      closing: 'Wherever your heart dreams, we make it happen.'
    },
    'production-manager': {
      title: 'Production Manager',
      tagline: 'The go-to pro who ensures flawless execution, coordination & smooth operations behind the scenes.',
      summary: 'A Production Manager turns plans into reality with precision, coordination and calm leadership—ensuring every detail comes together seamlessly.',
      items: [
        ['Planning & Strategy', 'Collaborates with the planning team to understand vision, scope and technical requirements.'],
        ['Scheduling & Timeline Management', 'Creates detailed production timelines and run-of-shows.'],
        ['Vendor & Crew Coordination', 'Manages vendors, artists, technicians and crew so everyone is aligned.'],
        ['Technical Production Oversight', 'Ensures flawless execution of lighting, sound, stage, visuals and effects.'],
        ['Logistics & Operations', 'Oversees transportation, equipment, backstage operations and on-ground execution.'],
        ['On-Site Execution', 'Manages the entire event on the ground, solving problems in real time.'],
        ['Risk Management', 'Anticipates challenges and prepares contingency plans for speed and efficiency.'],
        ['Quality Control', 'Ensures every element meets the highest standards of quality and safety.'],
        ['Communication Hub', 'Acts as the central point of communication between all teams.']
      ],
      quote: "We don't just manage the event, we manage the moments that matter.",
      closing: 'Behind every flawless wedding, there is a production manager making it look effortless.'
    },
    'guest-experience-manager': {
      title: 'Guest Experience Manager',
      tagline: 'The experience curator who ensures every guest feels welcomed, valued & cared for.',
      summary: 'A Guest Experience Manager ensures every guest feels valued, comfortable and cared for—so they can relax, celebrate and cherish every moment of your special day.',
      items: [
        ['Warm Welcome & Check-In', 'Creates a warm first impression and ensures smooth arrivals and check-ins.'],
        ['Accommodation Management', 'Coordinates stays, room allocations and special requests.'],
        ['Transportation Coordination', 'Arranges airport transfers, shuttles and local transport.'],
        ['Culinary Experience', 'Works with the catering team to ensure delightful food and beverage experiences.'],
        ['Special Guest Attention', 'Handles VIPs, elderly guests, children and guests with special needs with care.'],
        ['Itinerary & Event Flow Management', 'Keeps guests informed so they never miss a special moment.'],
        ['Guest Communication & Support', 'Is the single point of contact for all guest queries and needs.'],
        ['Problem Solving on the Go', 'Handles last-minute changes and unexpected situations calmly and efficiently.']
      ],
      quote: 'We take care of the details, so your guests can enjoy every beautiful moment.',
      closing: "We don't just manage guests, we create experiences they will always remember."
    },
    'entertainment-curator': {
      title: 'Entertainment Curator',
      tagline: 'The talent scout who creates unforgettable moments through music, performance & magic.',
      summary: 'An Entertainment Curator designs and orchestrates experiences that captivate, engage and create magical moments your guests will talk about forever.',
      items: [
        ['Concept & Experience Design', 'Conceptualizes unique entertainment ideas that reflect your story and vision.'],
        ['Artist & Act Curation', 'Sources and curates the right mix of artists and performers for your vibe.'],
        ['Planning & Scheduling', 'Builds a seamless entertainment flow integrated with the overall event timeline.'],
        ['Vendor & Technical Coordination', 'Collaborates with sound, light, stage and production teams for flawless execution.'],
        ['Audience Engagement & Flow', 'Crafts moments that engage every guest and keep the energy alive.'],
        ['Special Effects & Wow Moments', 'Designs show-stopping moments—from grand entries to fireworks to surprise acts.'],
        ['On-Day Execution & Management', 'Oversees every entertainment element on the day for smooth, stress-free execution.'],
        ['Memories That Last a Lifetime', 'Ensures the entertainment becomes the highlight of your wedding memories.']
      ],
      quote: "I don't just book entertainment, I curate emotions, energy and experiences that elevate your celebration.",
      closing: 'Because the right entertainment turns your wedding into an experience of a lifetime.'
    },
    'logistics-manager': {
      title: 'Logistics Manager',
      tagline: 'The strategist who manages timelines, transport & everything that keeps the day on track.'
    },
    'vendor-relationship-manager': {
      title: 'Vendor Relationship Manager',
      tagline: 'The connector who builds strong vendor partnerships & ensures everyone works in harmony.',
      summary: 'A Vendor Relationship Manager builds and nurtures strong relationships with vendors, ensuring alignment, trust and excellence to deliver unforgettable celebrations.',
      items: [
        ['Vendor Selection & Onboarding', 'Identifies, evaluates and onboards reliable vendors who align with our standards.'],
        ['Relationship Building & Communication', 'Builds long-term relationships based on trust, respect and clear communication.'],
        ['Negotiation & Contract Management', 'Negotiates fair terms and manages contracts with transparency.'],
        ['Coordination & Collaboration', 'Acts as the central point of contact for smooth coordination across vendors.'],
        ['Quality Assurance & Performance', 'Monitors vendor performance and drives continuous improvement.'],
        ['Problem Solving & Support', 'Proactively addresses challenges and provides vendor support whenever needed.'],
        ['Compliance & Professionalism', 'Ensures all vendors follow legal, ethical and company guidelines.'],
        ['Continuous Growth & Partnership', 'Fosters growth and builds partnerships that elevate every experience.']
      ],
      quote: 'Great celebrations are built on great partnerships. I connect the right people, align the details and bring the vision to life.',
      closing: 'Strong vendors. Stronger partnerships. Extraordinary celebrations.'
    },
    'destination-wedding-planner': {
      title: 'Destination Wedding Planner',
      tagline: 'Turning Dreams Into Unforgettable Celebrations, Anywhere in the World.',
      summary: 'A Destination Wedding Planner is your guide, your organiser, your problem-solver and your creative partner—all rolled into one, bringing your celebration to life wherever in the world you choose to say "I do."',
      items: [
        ['Location Expertise', 'Recommends the perfect destination based on your vision, budget & guest experience.'],
        ['Planning & Coordination', 'Manages every detail, from timelines to logistics, ensuring a seamless experience.'],
        ['Vendor Management', 'Shortlists & coordinates with trusted local vendors & ensures the highest quality.'],
        ['Travel & Guest Experience', 'Handles travel, stay, transportation & guest comfort with personal attention.'],
        ['Design & Conceptualisation', 'Brings your dream to life with creative concepts inspired by the destination.'],
        ['Budget Management', 'Optimises costs without compromising on style, value & experience.'],
        ['Legal & Document Assistance', 'Guides you through legalities, permits & documentation with ease.'],
        ['On-Site Execution', 'Oversees everything on the ground to ensure your big day is flawless.']
      ],
      quote: 'A Destination Wedding Planner is your guide, your organiser, your problem-solver and your creative partner—all rolled into one.',
      closing: 'We plan. You celebrate. Memories last forever.'
    },
    'wedding-on-site-coordinator': {
      title: 'Wedding On-Site Coordinator',
      tagline: 'On the Day. In the Details. Always by Your Side.',
      summary: "A Wedding On-Site Coordinator is your calm in the chaos—managing every detail on the day so you can be fully present and enjoy every beautiful moment.",
      items: [
        ['Timeline Management', "Oversee the entire day's timeline and ensure every event happens on time."],
        ['Vendor & Team Coordination', 'Coordinate with all vendors and manage the team for smooth execution.'],
        ['Setup Supervision & Management', 'Ensure all setups are perfect, on-brand and ready well before the event begins.'],
        ['Guest Assistance & Hospitality', 'Assist guests with directions, information and special requests with a smile.'],
        ['Communication Hub', 'Act as the central point of communication for all teams, vendors and the family.'],
        ['Problem Solving on the Go', 'Handle unexpected situations quickly and efficiently with calm and confidence.'],
        ['Quality Checks Throughout', 'Conduct regular checks to ensure quality, cleanliness and consistency all day.'],
        ['Ceremony & Reception Support', 'Manage every transition seamlessly from ceremony to celebration.'],
        ['Family Support & Comfort', 'Be the go-to person for the family—supporting, guiding and reassuring.'],
        ['End to End Execution', 'From the first setup to the last send-off, I stay until everything is perfect.']
      ],
      quote: 'I handle the details so you can live the moments.',
      closing: "You celebrate. I'll take care of the rest."
    },
    'wedding-consultant': {
      title: 'Wedding Consultant',
      tagline: 'Your Vision. Our Expertise. A Celebration Beyond Imagination.',
      summary: 'A Wedding Consultant is your trusted guide from the first idea to the final farewell—turning your dreams into a beautifully planned and flawlessly executed celebration.',
      items: [
        ['Understand & Consult', 'I listen, understand your vision, preferences and priorities to create a plan that truly reflects you.'],
        ['Plan & Strategize', 'From concepts to timelines, budgets to logistics—I design a clear and customized plan for your big day.'],
        ['Vendor Curation & Recommendations', 'I connect you with the right vendors and negotiate the best value without compromising on quality.'],
        ['Design & Concept Development', 'I create creative concepts, mood boards and design direction that bring your dream wedding to life.'],
        ['Budget Management', 'I help you plan smart, allocate wisely and maximize every penny for the best experience.'],
        ['Detail Planning & Coordination', 'I manage every detail, big or small, and coordinate seamlessly so everything comes together perfectly.'],
        ['Problem Solving Expertise', 'I anticipate challenges and handle them efficiently, ensuring a smooth and stress-free experience.'],
        ['Personalized Guidance Every Step', 'I guide you through every decision with honest advice and industry expertise.'],
        ['Focus on You', 'While I handle the details, you can focus on what truly matters—celebrating love and making memories.'],
        ['A Seamless & Memorable Experience', 'My goal is to create a celebration that is stress-free, seamless and truly unforgettable.']
      ],
      quote: 'I listen to your story, understand your vision and craft a celebration that is uniquely yours.',
      closing: 'Behind every magical wedding is a consultant who cares, plans and makes it happen.'
    },
    'wedding-decor-stylist': {
      title: 'Wedding Decor Stylist',
      tagline: "We Don't Just Decorate Spaces, We Create Atmospheres.",
      summary: 'A Wedding Decor Stylist transforms a vision into an immersive experience through creativity, detail, colour, texture and emotion. We design the look. You feel the magic.',
      items: [
        ['Conceptualise', 'We understand your story, inspiration and preferences to create a unique design concept that sets the tone.'],
        ['Theme & Style Development', 'From mood boards to colour palettes, we craft a cohesive visual language that reflects your personality and celebration.'],
        ['Decor Design & Planning', 'We plan every element—florals, drapes, furniture, lighting, props and more—with precision and purpose.'],
        ['Sourcing & Curation', 'We source the finest materials, premium décor pieces and floral elements to bring our designs to life.'],
        ['Execution Excellence', 'Our team manages on-ground execution with flawless attention to detail and timely delivery.'],
        ['Ambience Creation', 'We use lighting, textures and layering to create the perfect mood, depth and ambience for every moment.'],
        ['Space Transformation', 'We turn any space into a breathtaking setting that wows your guests and enhances every experience.'],
        ['Emotional Impact', 'Every detail is designed to evoke emotions and leave a lasting impression on you and your guests.']
      ],
      quote: 'We style moments that become memories forever.',
      closing: 'Beyond decor. Beyond beautiful. We design dreams.'
    }
  };

  var roleOverlay = document.getElementById('roleModalOverlay');
  var roleModal = document.getElementById('roleModal');
  var roleModalBody = document.getElementById('roleModalBody');
  var roleModalClose = document.getElementById('roleModalClose');
  var roleModalBack = document.getElementById('roleModalBack');
  var roleTriggers = document.querySelectorAll('[data-role]');

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function openRoleModal(role) {
    var data = ROLE_DATA[role];
    if (!data || !roleOverlay) return;

    var itemsHtml = data.items ? data.items.map(function (item) {
      return '<li><strong>' + escapeHtml(item[0]) + '</strong><span>' + escapeHtml(item[1]) + '</span></li>';
    }).join('') : '';

    roleModalBody.innerHTML =
      '<div class="role-modal-header">' +
        '<p class="role-modal-eyebrow">The Role of a</p>' +
        '<h3 class="role-modal-title" id="roleModalTitle">' + escapeHtml(data.title) + '</h3>' +
        '<p class="role-modal-tagline">' + escapeHtml(data.tagline) + '</p>' +
      '</div>' +
      (data.summary ? '<p class="role-modal-summary">' + escapeHtml(data.summary) + '</p>' : '') +
      (itemsHtml ? '<p class="role-modal-what">What I Do</p><ul class="role-modal-list">' + itemsHtml + '</ul>' : '') +
      (data.quote ? '<blockquote class="role-modal-quote">“' + escapeHtml(data.quote) + '”</blockquote>' : '') +
      (data.closing ? '<p class="role-modal-closing">' + escapeHtml(data.closing) + '</p>' : '');

    roleOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    roleModal.scrollTop = 0;
    roleModalClose.focus();
  }

  function closeRoleModal() {
    if (!roleOverlay) return;
    roleOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  if (roleOverlay && roleTriggers.length) {
    roleTriggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        openRoleModal(btn.dataset.role);
      });
    });
    roleModalClose.addEventListener('click', closeRoleModal);
    if (roleModalBack) roleModalBack.addEventListener('click', closeRoleModal);
    roleOverlay.addEventListener('click', function (e) {
      if (e.target === roleOverlay) closeRoleModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !roleOverlay.hidden) closeRoleModal();
    });
  }

  /* ---- "Watch Video" placeholder buttons ----
     No video is wired up yet (hero, the self-assessment banner, and each
     role popup all have one) — clicking shows a small inline note next
     to the button instead of navigating anywhere broken/misleading. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-video-soon]');
    if (!btn) return;
    e.preventDefault();
    var note = btn.nextElementSibling;
    if (note && note.classList.contains('video-soon-note')) {
      note.hidden = !note.hidden;
    }
  });
})();
