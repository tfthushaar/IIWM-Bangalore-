/* Career Fit Profiler — question bank, scoring weights, archetype
   and dimension content. Pure data, no logic. See js/quiz.js for the
   engine that consumes this.

   Archetypes are the same 9 careers listed on careers.html — kept in
   sync deliberately, so a quiz match always points to a real page on
   the site rather than an invented title. */
var QUIZ_ARCHETYPES = {
  planner: {
    name: 'Luxury Wedding Planner',
    persona: 'Luxury Experience Creator',
    description: "You naturally enjoy creating memorable experiences and have the emotional intelligence, organisation, and creativity required to thrive in the wedding industry. You thrive on taking charge — coordinating people, timelines, and vision into one seamless celebration.",
    skills: ['Advanced client consultation', 'Vendor contract negotiation', 'Budget architecture for luxury weddings'],
    path: "The Wedding Business School's Luxury Wedding Planning & Management track"
  },
  designer: {
    name: 'Wedding Designer',
    persona: 'Visionary Creator',
    description: "You see weddings as immersive design stories — colour, texture, and atmosphere are your language. You'd rather sketch a concept than follow a template.",
    skills: ['Concept boarding & styling', 'Colour theory for events', 'Set & décor production'],
    path: "The Wedding Business School's Wedding Design & Styling specialization"
  },
  florist: {
    name: 'Floral Designer',
    persona: "Nature's Artist",
    description: "Flowers are your medium. You have an instinct for colour, texture and composition, and you find focus in detailed, hands-on creative work.",
    skills: ['Floral composition & structure', 'Seasonal sourcing', 'Large-scale installation design'],
    path: "The Wedding Business School's Floral & Décor Artistry module"
  },
  destination: {
    name: 'Destination Wedding Specialist',
    persona: 'Global Celebration Curator',
    description: "You light up at the idea of producing celebrations in new places — juggling logistics across cities, cultures and time zones excites rather than exhausts you.",
    skills: ['Cross-border vendor logistics', 'Travel & hospitality coordination', 'Multi-day event production'],
    path: "The Wedding Business School's Destination Wedding Operations track"
  },
  production: {
    name: 'Production Manager',
    persona: 'Calm Commander',
    description: "When everything is happening at once, you're at your best. You think on your feet, manage crises quietly, and keep an event running exactly on time.",
    skills: ['Run-of-show & timeline mastery', 'On-site crisis management', 'Team & crew coordination'],
    path: "The Wedding Business School's Event Production & Operations track"
  },
  guest: {
    name: 'Guest Experience Manager',
    persona: 'Natural Host',
    description: "You read a room instinctively and care deeply about how people feel. Hospitality isn't a task for you — it's an instinct.",
    skills: ['Guest journey design', 'Hospitality service standards', 'On-ground guest management'],
    path: "The Wedding Business School's Hospitality & Guest Experience specialization"
  },
  vendor: {
    name: 'Vendor Relationship Manager',
    persona: 'Master Connector',
    description: "You build trust fast and negotiate fair. Vendors and partners remember you — and that network becomes your biggest asset.",
    skills: ['Vendor sourcing & vetting', 'Contract negotiation', 'Long-term partnership management'],
    path: "The Wedding Business School's Vendor & Partnership Management module"
  },
  entertainment: {
    name: 'Entertainment Curator',
    persona: 'Energy Setter',
    description: "You understand pacing, mood and performance. You know exactly when a room needs the music to swell — or quiet down.",
    skills: ['Entertainment programming', 'Talent sourcing & booking', 'Live show coordination'],
    path: "The Wedding Business School's Entertainment & Experience Design module"
  },
  logistics: {
    name: 'Logistics Manager',
    persona: 'Master Planner',
    description: "Spreadsheets, timelines, checklists — you find calm in structure, and you're the reason nothing falls through the cracks.",
    skills: ['Timeline & critical-path planning', 'Resource & inventory management', 'Process systems for events'],
    path: "The Wedding Business School's Wedding Logistics & Planning Systems track"
  }
};

/* The 12 dimensions the assessment scores behind the scenes. `strength`
   is the phrase shown in "Your Superpowers" when this dimension scores
   high; `growth` is shown in "Areas to Develop" when it scores low. */
var QUIZ_DIMENSIONS = [
  { key: 'creativity', label: 'Creativity', strength: 'Creative thinking', growth: 'Creative experimentation' },
  { key: 'organization', label: 'Organization', strength: 'Excellent organization', growth: 'Time & task management' },
  { key: 'leadership', label: 'Leadership', strength: 'Leadership potential', growth: 'Team delegation' },
  { key: 'eq', label: 'Emotional Intelligence', strength: 'Strong communication', growth: 'Emotional resilience' },
  { key: 'client', label: 'Client Orientation', strength: 'Excellent client handling', growth: 'Vendor negotiations' },
  { key: 'problemSolving', label: 'Problem Solving', strength: 'Calm under pressure', growth: 'Crisis planning' },
  { key: 'business', label: 'Business Acumen', strength: 'Sharp business sense', growth: 'Budget management' },
  { key: 'entrepreneurship', label: 'Entrepreneurship', strength: 'Entrepreneurial drive', growth: 'Building your own brand' },
  { key: 'hospitality', label: 'Hospitality Orientation', strength: 'Natural hospitality instinct', growth: 'Guest experience design' },
  { key: 'luxury', label: 'Luxury Mindset', strength: 'An eye for luxury detail', growth: 'Luxury service standards' },
  { key: 'adaptability', label: 'Adaptability', strength: 'Adaptability under change', growth: 'Handling last-minute change' },
  { key: 'industryFit', label: 'Wedding Industry Fit', strength: 'Genuine passion for weddings', growth: 'Industry-specific knowledge' }
];

/* Question types:
   - "slider": 1–5 rating. archetypeWeights/dimensionWeights are the
     weight AT value 5 (contribution scales linearly with the rating).
   - "single": pick exactly one option. Each option carries its own
     archetypeWeights/dimensionWeights.
*/
var QUIZ_QUESTIONS = [

  // ==================== Section 1 — Personality ====================
  { id: 'p1', section: 'Personality', type: 'slider', text: 'I enjoy planning events.',
    archetypeWeights: { logistics: 4, planner: 3, production: 2 }, dimensionWeights: { organization: 4, industryFit: 3 } },
  { id: 'p2', section: 'Personality', type: 'slider', text: 'I stay calm under pressure.',
    archetypeWeights: { production: 4, vendor: 2 }, dimensionWeights: { problemSolving: 4, adaptability: 3 } },
  { id: 'p3', section: 'Personality', type: 'slider', text: 'I love creating beautiful experiences.',
    archetypeWeights: { designer: 4, florist: 3 }, dimensionWeights: { creativity: 4, luxury: 3 } },
  { id: 'p6', section: 'Personality', type: 'slider', text: 'I pay attention to small details.',
    archetypeWeights: { logistics: 4, florist: 2 }, dimensionWeights: { organization: 4, industryFit: 2 } },
  { id: 'p7', section: 'Personality', type: 'slider', text: 'I enjoy solving unexpected problems.',
    archetypeWeights: { production: 4, logistics: 3 }, dimensionWeights: { problemSolving: 4, adaptability: 3 } },
  { id: 'p8', section: 'Personality', type: 'slider', text: 'I like leading teams.',
    archetypeWeights: { planner: 4, production: 3 }, dimensionWeights: { leadership: 4, business: 2 } },

  // ==================== Section 2 — Work Style ====================
  { id: 'w1', section: 'Work Style', type: 'single', text: 'Which excites you most?',
    options: [
      { label: 'Designing', archetypeWeights: { designer: 4, florist: 3 }, dimensionWeights: { creativity: 4, luxury: 2 } },
      { label: 'Planning', archetypeWeights: { logistics: 4, planner: 3 }, dimensionWeights: { organization: 4 } },
      { label: 'Managing', archetypeWeights: { production: 4, planner: 2 }, dimensionWeights: { leadership: 4 } },
      { label: 'Marketing', archetypeWeights: { entertainment: 3, vendor: 2 }, dimensionWeights: { business: 3, entrepreneurship: 2 } },
      { label: 'Business', archetypeWeights: { vendor: 3, production: 2 }, dimensionWeights: { business: 4, entrepreneurship: 3 } },
      { label: 'Hospitality', archetypeWeights: { guest: 4 }, dimensionWeights: { hospitality: 4, eq: 2 } }
    ] },
  { id: 'w2', section: 'Work Style', type: 'single', text: 'When faced with a problem you…',
    options: [
      { label: 'Analyse first', archetypeWeights: { logistics: 3, vendor: 2 }, dimensionWeights: { problemSolving: 3, business: 2 } },
      { label: 'Ask others', archetypeWeights: { guest: 2, vendor: 2 }, dimensionWeights: { eq: 3, client: 2 } },
      { label: 'Take action immediately', archetypeWeights: { production: 4, planner: 2 }, dimensionWeights: { adaptability: 4, leadership: 2 } },
      { label: 'Find a creative solution', archetypeWeights: { designer: 3, florist: 2 }, dimensionWeights: { creativity: 4, problemSolving: 2 } }
    ] },
  { id: 'w3', section: 'Work Style', type: 'single', text: 'Which describes you?',
    options: [
      { label: 'Highly organized', archetypeWeights: { logistics: 4 }, dimensionWeights: { organization: 4 } },
      { label: 'Highly creative', archetypeWeights: { designer: 4, florist: 3 }, dimensionWeights: { creativity: 4 } },
      { label: 'Great communicator', archetypeWeights: { guest: 3, vendor: 2 }, dimensionWeights: { eq: 4 } },
      { label: 'Good negotiator', archetypeWeights: { vendor: 4 }, dimensionWeights: { business: 3, client: 3 } },
      { label: 'Team leader', archetypeWeights: { planner: 3, production: 3 }, dimensionWeights: { leadership: 4 } }
    ] },

  // ==================== Section 3 — Interest Mapping ====================
  { id: 'i_wedding', section: 'Interest Mapping', type: 'slider', text: 'Wedding Planning',
    archetypeWeights: { planner: 4 }, dimensionWeights: { industryFit: 4, organization: 2 } },
  { id: 'i_luxury', section: 'Interest Mapping', type: 'slider', text: 'Luxury Weddings',
    archetypeWeights: { planner: 3, destination: 2 }, dimensionWeights: { luxury: 4, industryFit: 2 } },
  { id: 'i_destination', section: 'Interest Mapping', type: 'slider', text: 'Destination Weddings',
    archetypeWeights: { destination: 4 }, dimensionWeights: { adaptability: 3, luxury: 2 } },
  { id: 'i_decor', section: 'Interest Mapping', type: 'slider', text: 'Decor',
    archetypeWeights: { florist: 4, designer: 3 }, dimensionWeights: { creativity: 4, luxury: 2 } },
  { id: 'i_hospitality', section: 'Interest Mapping', type: 'slider', text: 'Hospitality',
    archetypeWeights: { guest: 4 }, dimensionWeights: { hospitality: 4, eq: 2 } },
  { id: 'i_business', section: 'Interest Mapping', type: 'slider', text: 'Business',
    archetypeWeights: { vendor: 3, production: 2 }, dimensionWeights: { business: 4 } },
  { id: 'i_travel', section: 'Interest Mapping', type: 'slider', text: 'Travel',
    archetypeWeights: { destination: 4 }, dimensionWeights: { adaptability: 3, luxury: 2 } },

  // ==================== Section 4 — Situational Judgement ====================
  { id: 's1', section: 'Situational Judgement', type: 'single', text: 'A decorator is running 45 minutes late. You…',
    options: [
      { label: 'Calm the client', archetypeWeights: { guest: 3, planner: 2 }, dimensionWeights: { eq: 3, client: 3 } },
      { label: 'Find backup', archetypeWeights: { production: 3, logistics: 2 }, dimensionWeights: { problemSolving: 3, adaptability: 2 } },
      { label: 'Call the decorator repeatedly', archetypeWeights: {}, dimensionWeights: { problemSolving: 1 } },
      { label: 'Handle all simultaneously', archetypeWeights: { production: 4 }, dimensionWeights: { leadership: 4, adaptability: 4 } }
    ] },
  { id: 's2', section: 'Situational Judgement', type: 'single', text: 'Bride changes décor 2 hours before the wedding.',
    options: [
      { label: 'Say it’s impossible', archetypeWeights: {}, dimensionWeights: {} },
      { label: 'Find alternatives', archetypeWeights: { designer: 3, florist: 2 }, dimensionWeights: { creativity: 3, problemSolving: 3 } },
      { label: 'Escalate', archetypeWeights: {}, dimensionWeights: { client: 1 } },
      { label: 'Calm the bride and create options', archetypeWeights: { planner: 4, guest: 2 }, dimensionWeights: { eq: 4, creativity: 3, problemSolving: 3 } }
    ] },
  { id: 's3', section: 'Situational Judgement', type: 'single', text: 'A vendor asks for extra payment during the event.',
    options: [
      { label: 'Pay immediately', archetypeWeights: {}, dimensionWeights: {} },
      { label: 'Negotiate', archetypeWeights: { vendor: 4 }, dimensionWeights: { business: 3, client: 3 } },
      { label: 'Check the contract', archetypeWeights: { logistics: 3, vendor: 2 }, dimensionWeights: { organization: 3, business: 2 } },
      { label: 'Inform the client first', archetypeWeights: { planner: 3, guest: 2 }, dimensionWeights: { client: 3, eq: 2 } }
    ] },
  { id: 's4', section: 'Situational Judgement', type: 'single', text: 'A celebrity guest arrives unexpectedly.',
    options: [
      { label: 'Panic', archetypeWeights: {}, dimensionWeights: {} },
      { label: 'Handle the VIP', archetypeWeights: { guest: 4 }, dimensionWeights: { hospitality: 4, luxury: 3 } },
      { label: 'Ask others', archetypeWeights: {}, dimensionWeights: { eq: 1 } },
      { label: 'Create new seating', archetypeWeights: { logistics: 3 }, dimensionWeights: { organization: 3, adaptability: 3 } }
    ] },
  { id: 's5', section: 'Situational Judgement', type: 'single', text: 'Rain starts during an outdoor wedding.',
    options: [
      { label: 'Wait', archetypeWeights: {}, dimensionWeights: {} },
      { label: 'Shift indoors', archetypeWeights: { production: 3 }, dimensionWeights: { adaptability: 3, problemSolving: 3 } },
      { label: 'Consult the client', archetypeWeights: { planner: 2, guest: 2 }, dimensionWeights: { client: 3, eq: 2 } },
      { label: 'Execute the backup plan', archetypeWeights: { logistics: 4, production: 3 }, dimensionWeights: { organization: 4, adaptability: 4 } }
    ] },

  // ==================== Section 5 — Motivation ====================
  { id: 'motivation', section: 'Motivation', type: 'single', text: 'What motivates you most?',
    options: [
      { label: 'Money', archetypeWeights: { vendor: 2, production: 2 }, dimensionWeights: { business: 3 } },
      { label: 'Recognition', archetypeWeights: { designer: 2, entertainment: 2 }, dimensionWeights: { creativity: 2, luxury: 2 } },
      { label: 'Creativity', archetypeWeights: { designer: 3, florist: 3 }, dimensionWeights: { creativity: 4 } },
      { label: 'Luxury Lifestyle', archetypeWeights: { planner: 3, destination: 2 }, dimensionWeights: { luxury: 4 } },
      { label: 'Travel', archetypeWeights: { destination: 4 }, dimensionWeights: { adaptability: 2, luxury: 2 } },
      { label: 'Meeting People', archetypeWeights: { guest: 3, vendor: 2 }, dimensionWeights: { eq: 3, client: 2 } },
      { label: 'Building a Business', archetypeWeights: { vendor: 3, planner: 2 }, dimensionWeights: { entrepreneurship: 4, business: 2 } },
      { label: 'Creating Memories', archetypeWeights: { planner: 2, guest: 2 }, dimensionWeights: { industryFit: 3, hospitality: 2 } },
      { label: 'Leadership', archetypeWeights: { planner: 3, production: 3 }, dimensionWeights: { leadership: 4 } }
    ] },

  // ==================== Section 6 — Career Goals ====================
  { id: 'career_goal', section: 'Career Goals', type: 'single', text: 'Where do you see yourself in 5 years?',
    options: [
      { label: 'Working in luxury weddings', archetypeWeights: { planner: 4 }, dimensionWeights: { luxury: 3, industryFit: 3 } },
      { label: 'Destination weddings', archetypeWeights: { destination: 4 }, dimensionWeights: { adaptability: 3, luxury: 2 } },
      { label: 'Starting my own company', archetypeWeights: { vendor: 3, planner: 2 }, dimensionWeights: { entrepreneurship: 4 } },
      { label: 'Hotel industry', archetypeWeights: { guest: 4 }, dimensionWeights: { hospitality: 4 } },
      { label: 'International weddings', archetypeWeights: { destination: 4 }, dimensionWeights: { adaptability: 3, luxury: 2 } },
      { label: 'Wedding designer', archetypeWeights: { designer: 4 }, dimensionWeights: { creativity: 4 } },
      { label: 'Wedding planner', archetypeWeights: { planner: 4 }, dimensionWeights: { organization: 3, industryFit: 3 } },
      { label: 'Venue manager', archetypeWeights: { logistics: 3 }, dimensionWeights: { organization: 4 } },
      { label: 'Wedding marketer', archetypeWeights: { entertainment: 3 }, dimensionWeights: { business: 3, entrepreneurship: 2 } },
      { label: 'Luxury brand', archetypeWeights: { planner: 2, destination: 2 }, dimensionWeights: { luxury: 4 } }
    ] },

  // ==================== Section 7 — Entrepreneurial Mindset ====================
  { id: 'e1', section: 'Entrepreneurial Mindset', type: 'slider', text: 'I enjoy taking risks.',
    archetypeWeights: { vendor: 2, planner: 2 }, dimensionWeights: { entrepreneurship: 4, adaptability: 2 } },
  { id: 'e3', section: 'Entrepreneurial Mindset', type: 'slider', text: 'I enjoy networking.',
    archetypeWeights: { vendor: 4, guest: 2 }, dimensionWeights: { entrepreneurship: 3, client: 3 } },
  { id: 'e4', section: 'Entrepreneurial Mindset', type: 'slider', text: 'I enjoy building businesses.',
    archetypeWeights: { vendor: 3, planner: 2 }, dimensionWeights: { entrepreneurship: 4, business: 3 } },

  // ==================== Section 8 — Soft Skills ====================
  { id: 'sk_communication', section: 'Soft Skills', type: 'slider', text: 'Communication',
    archetypeWeights: { guest: 3, vendor: 2 }, dimensionWeights: { eq: 4 } },
  { id: 'sk_leadership', section: 'Soft Skills', type: 'slider', text: 'Leadership',
    archetypeWeights: { planner: 3, production: 3 }, dimensionWeights: { leadership: 4 } },
  { id: 'sk_creativity', section: 'Soft Skills', type: 'slider', text: 'Creativity',
    archetypeWeights: { designer: 4, florist: 3 }, dimensionWeights: { creativity: 4 } },
  { id: 'sk_decisionmaking', section: 'Soft Skills', type: 'slider', text: 'Decision Making',
    archetypeWeights: { production: 3, logistics: 2 }, dimensionWeights: { problemSolving: 4 } },

  // ==================== Section 9 — Lifestyle Fit ====================
  { id: 'l_travel', section: 'Lifestyle Fit', type: 'single', text: 'Would you enjoy travel?',
    options: [
      { label: 'Yes', archetypeWeights: { destination: 4 }, dimensionWeights: { adaptability: 3, luxury: 2 } },
      { label: 'Somewhat', archetypeWeights: { destination: 2 }, dimensionWeights: { adaptability: 1 } },
      { label: 'No', archetypeWeights: {}, dimensionWeights: {} }
    ] },
  { id: 'l_fastpaced', section: 'Lifestyle Fit', type: 'single', text: 'Would you enjoy fast-paced work?',
    options: [
      { label: 'Yes', archetypeWeights: { production: 4 }, dimensionWeights: { adaptability: 3, problemSolving: 2 } },
      { label: 'Somewhat', archetypeWeights: { production: 2 }, dimensionWeights: { adaptability: 1 } },
      { label: 'No', archetypeWeights: {}, dimensionWeights: {} }
    ] },
  { id: 'l_multiproject', section: 'Lifestyle Fit', type: 'single', text: 'Would you enjoy managing multiple projects?',
    options: [
      { label: 'Yes', archetypeWeights: { logistics: 3, planner: 3 }, dimensionWeights: { organization: 3, leadership: 2 } },
      { label: 'Somewhat', archetypeWeights: { logistics: 1 }, dimensionWeights: { organization: 1 } },
      { label: 'No', archetypeWeights: {}, dimensionWeights: {} }
    ] },
  { id: 'l_newpeople', section: 'Lifestyle Fit', type: 'single', text: 'Would you enjoy meeting new people daily?',
    options: [
      { label: 'Yes', archetypeWeights: { guest: 3, vendor: 3 }, dimensionWeights: { eq: 3, client: 3 } },
      { label: 'Somewhat', archetypeWeights: { guest: 1 }, dimensionWeights: { eq: 1 } },
      { label: 'No', archetypeWeights: {}, dimensionWeights: {} }
    ] }
];

/* Section 10 (Current Status, Current Education, Current City) is not
   scored — it's collected as profile context alongside name/phone on
   the lead-capture screen, see quiz.html #screenLead. */
var QUIZ_STATUS_OPTIONS = ['Student', 'Graduate', 'Working Professional', 'Entrepreneur', 'Career Switcher', 'Homemaker'];
