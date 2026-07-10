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

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { observer.observe(el); });
  }

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
     Content summarised from assets/PDFS/IIWM_Wedding_Careers_Compilation_Final.pdf
     — one page per role in that deck. */
  var ROLE_DATA = {
    'wedding-planner': {
      title: 'Luxury Wedding Planner',
      tagline: 'Your Vision. My Expertise. A Perfect Celebration.',
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
    'destination-wedding-planner': {
      title: 'Luxury Destination Wedding Planner',
      tagline: 'Turning Dreams Into Unforgettable Celebrations, Anywhere in the World.',
      summary: 'A Destination Wedding Planner is your guide, organiser, problem-solver and creative partner—all rolled into one—for a wedding held anywhere in the world.',
      items: [
        ['Location Expertise', 'Recommends the perfect destination based on your vision, budget and guest experience.'],
        ['Planning & Coordination', 'Manages every detail, from timelines to logistics, for a seamless experience.'],
        ['Vendor Management', 'Shortlists and coordinates trusted local vendors and ensures the highest quality.'],
        ['Travel & Guest Experience', 'Handles travel, stay, transportation and guest comfort with personal attention.'],
        ['Design & Conceptualisation', 'Brings your dream to life with creative concepts inspired by the destination.'],
        ['Budget Management', 'Optimises costs without compromising on style, value or experience.'],
        ['Legal & Document Assistance', 'Guides you through legalities, permits and documentation with ease.'],
        ['On-Site Execution', 'Oversees everything on the ground to ensure your big day is flawless.'],
        ['Risk Management', 'Anticipates challenges and has backup plans so you can celebrate worry-free.']
      ],
      quote: 'A Destination Wedding Planner is your guide, your organiser, your problem-solver and your creative partner—all rolled into one.',
      closing: 'We plan. You celebrate. Memories last forever.'
    },
    'wedding-designer': {
      title: 'Signature Wedding Designer',
      tagline: "We Don't Just Decorate, We Design Experiences.",
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
    'wedding-decor-stylist': {
      title: 'Luxury Decor Stylist',
      tagline: "We Don't Just Decorate Spaces, We Create Atmospheres.",
      summary: 'A wedding decor stylist transforms a vision into an immersive experience through creativity, detail, colour, texture and emotion. We design the look. You feel the magic.',
      items: [
        ['Conceptualise', 'Understands your story, inspiration and preferences to set a unique design concept.'],
        ['Theme & Style Development', 'Crafts a cohesive visual language across mood boards and colour palettes.'],
        ['Décor Design & Planning', 'Plans every element—florals, drapes, furniture, lighting, props and more.'],
        ['Sourcing & Curation', 'Sources the finest materials, premium décor pieces and floral elements.'],
        ['Ambience Creation', 'Uses lighting, textures and layering to create the perfect mood and depth.'],
        ['Space Transformation', 'Turns any space into a breathtaking setting that wows guests.'],
        ['Execution Excellence', 'Manages on-ground execution with flawless attention to detail and timely delivery.'],
        ['Emotional Impact', 'Every detail is designed to leave a lasting impression on you and your guests.']
      ],
      quote: 'We style moments that become memories forever.',
      closing: "We don't just decorate spaces, we create atmospheres guests remember."
    },
    'hospitality-guest-experience-manager': {
      title: 'Elite Guest Experience Manager',
      tagline: 'Beyond Welcome. Towards Memories.',
      summary: 'A Hospitality & Guest Experience Manager ensures every guest feels valued, comfortable and cared for—so they can relax, celebrate and cherish every moment of your special day.',
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
    'wedding-production-manager': {
      title: 'Premier Production Manager',
      tagline: 'Behind the Scenes. Beyond Expectations.',
      summary: 'A Wedding Production Manager turns plans into reality with precision, coordination and calm leadership—ensuring every detail comes together seamlessly.',
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
    'destination-wedding-specialist': {
      title: 'Global Destination Wedding Specialist',
      tagline: 'Curating Love Stories Across Borders.',
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
    'vendor-relationship-manager': {
      title: 'Vendor Relations Director',
      tagline: 'Strong Partnerships. Seamless Celebrations.',
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
    'floral-designer': {
      title: 'Luxury Floral Designer',
      tagline: 'We design more than flowers, we design emotions.',
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
    'wedding-onsite-coordinator': {
      title: 'Onsite Wedding Director',
      tagline: 'On The Day. Every Detail. Perfectly Executed.',
      summary: 'A Wedding Onsite Coordinator is the calm behind the celebration—managing every moving part so you can be fully present and enjoy your big day, stress-free.',
      items: [
        ['Pre-Event Preparation', 'Reviews timelines, floor plans and vendor details so everything is ready to go.'],
        ['Vendor Management', 'Coordinates with all vendors, confirms arrivals and aligns everyone with the flow.'],
        ['Timeline Management', 'Keeps the event running on schedule, adapting smoothly to any changes.'],
        ['Communication Hub', 'Is the central point of contact for clients, vendors, guests and the team.'],
        ['On-Site Supervision', 'Oversees every aspect on the ground, from setup to wrap-up.'],
        ['Guest Experience', 'Ensures guests feel welcomed, comfortable and cared for throughout.'],
        ['Emergency Ready', 'Stays prepared for anything with contingency plans and a calm approach.'],
        ['Problem Solving', "Handles last-minute hiccups quickly so you don't have to worry about a thing."]
      ],
      quote: 'I handle the details, so you can hold the memories.',
      closing: "You enjoy the moment, I'll take care of the rest."
    },
    'wedding-consultant': {
      title: 'Luxury Wedding Consultant',
      tagline: 'Your Vision. Our Expertise. A Celebration Beyond Imagination.',
      summary: 'A Wedding Consultant is your trusted guide from the first idea to the final farewell—turning your dreams into a beautifully planned and flawlessly executed celebration.',
      items: [
        ['Understand & Consult', 'Listens and understands your vision, preferences and priorities.'],
        ['Plan & Strategize', 'Designs a clear, customized plan from concepts to timelines to budgets.'],
        ['Vendor Curation & Recommendations', 'Connects you with the right vendors and negotiates the best value.'],
        ['Design & Concept Development', 'Creates creative concepts and mood boards that bring your wedding to life.'],
        ['Budget Management', 'Helps plan smart and maximize every penny for the best experience.'],
        ['Detail Planning & Coordination', 'Manages every detail, big or small, so it all comes together perfectly.'],
        ['Problem Solving Expertise', 'Anticipates challenges and handles them for a smooth, stress-free experience.'],
        ['Personalized Guidance Every Step', 'Guides every decision with honest advice and industry expertise.']
      ],
      quote: 'I listen to your story, understand your vision and craft a celebration that is uniquely yours.',
      closing: 'Behind every magical wedding is a consultant who cares, plans and makes it happen.'
    },
    'wedding-entertainment-curator': {
      title: 'Signature Entertainment Curator',
      tagline: 'Right Entertainment, Right Moments. Unforgettable Celebrations.',
      summary: 'A Wedding Entertainment Curator designs and orchestrates experiences that captivate, engage and create magical moments your guests will talk about forever.',
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

    var itemsHtml = data.items.map(function (item) {
      return '<li><strong>' + escapeHtml(item[0]) + '</strong><span>' + escapeHtml(item[1]) + '</span></li>';
    }).join('');

    roleModalBody.innerHTML =
      '<div class="role-modal-header">' +
        '<p class="role-modal-eyebrow">The Role of a</p>' +
        '<h3 class="role-modal-title" id="roleModalTitle">' + escapeHtml(data.title) + '</h3>' +
        '<p class="role-modal-tagline">' + escapeHtml(data.tagline) + '</p>' +
      '</div>' +
      '<p class="role-modal-summary">' + escapeHtml(data.summary) + '</p>' +
      '<p class="role-modal-what">What I Do</p>' +
      '<ul class="role-modal-list">' + itemsHtml + '</ul>' +
      '<blockquote class="role-modal-quote">“' + escapeHtml(data.quote) + '”</blockquote>' +
      '<p class="role-modal-closing">' + escapeHtml(data.closing) + '</p>';

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
