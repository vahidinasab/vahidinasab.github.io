/* The guide's settings and its general content: the four questions, next steps, words explained,
   Near you, official advice, sources and teacher mode.

   To update a fact, change it here. Then, from this folder, run:  node _build/build-pages.mjs
   (that refreshes the job and subject pages). Keep the wording plain and in British English. */
(function (S) {
  'use strict';
  var D = S.data;

  // ---------- Settings ----------
  D.config = {
    toolUrl: 'https://vahidinasab.github.io/sustainable-skills/',
    statsUrl: 'https://sles-roadmap-counter.vahidinasab.workers.dev',   // the visit counter (Cloudflare Worker sles-roadmap-counter)
    reachDetail: false,   // true also shows uses and UK regions under Reach so far (they are always counted)
    reachShow: false,   // false hides Reach so far for now; true shows it once the total reaches reachShowFrom
    reachShowFrom: 500,   // Reach so far appears once the visit total reaches this number
    paperDoi: '',   // for example '10.1016/j.example.2027.000000' once the paper is published
    articleUrl: 'https://theconversation.com/vocational-gcses-wont-arrive-until-2029-but-clean-energy-skills-can-be-found-in-the-curriculum-now-295008',  // The Conversation article
    articleTitle: 'Vocational GCSEs won\u2019t arrive until 2029, but clean energy skills can be found in the curriculum now',   // its headline, shown on the welcome screen and in About
    feedbackUrl: '',   // a feedback form (for example a Microsoft Form); used for Send feedback when set
    contactEmail: ''   // otherwise an email address for Send feedback; with neither, it links to the staff profile
  };

  // The month the facts were last checked. It is shown on the page, in the PDFs and on the job and subject pages.
  D.checked = "October 2026";

  // QR code for toolUrl (41 by 41 modules, error correction H), one hex string per row. Level H lets the code
  // still scan with the app's logo over its centre. If the address ever changes, see _build/make-qr.mjs.
  D.qr = '1fdb5b7977f,1056c50f541,175f76c805d,174d494645d,174fa1e935d,105f043f841,1fd5555557f,001c3a36500,075277949e7,00a51d51ff7,13e9341a550,11bb5453778,017eda17a8f,161c6462191,1c734f1fe88,10b0a632759,1c51bd1faad,172210d1f73,1bce516785c,04a832d3fdb,16e2130c30d,1b30381d7df,0dca9ab25a0,0fbdf175018,04ee2230a26,032c6bb96fb,05710757160,04088e3e3d9,0efc790cb4f,1ea4ca2fcb3,146d11bc1fe,15b050354d9,14731fe89f5,001196d051b,1fceab67758,104295ab318,1758cdf25ff,175e7e80aad,1756694a5f2,1041333c51a,1fccb3cea7c';

  // ---------- The four questions ----------
  // "short" is used in the one-line summary, where the full labels would run together.
  D.interests = [
    { id: 'make', label: 'Making and fixing things', short: 'making things' },
    { id: 'tech', label: 'Gadgets, electronics and coding', short: 'technology' },
    { id: 'sci', label: 'Science and how things work', short: 'science' },
    { id: 'num', label: 'Maths, numbers and data', short: 'numbers' },
    { id: 'out', label: 'Being outdoors and active', short: 'being outdoors' },
    { id: 'planet', label: 'Nature and the climate', short: 'nature' },
    { id: 'biz', label: 'Business and money', short: 'business' },
    { id: 'people', label: 'Helping people', short: 'helping people' }
  ];

  D.styles = [
    { id: 'hands', title: 'Hands-on', desc: 'I learn best by doing and making things.' },
    { id: 'class', title: 'In the classroom', desc: 'I like lessons, reading and exams.' },
    { id: 'mix', title: 'A mix, or not sure yet', desc: 'Show me all the options.' }
  ];
  D.styleBonus = { hands: { hands: 2, both: 1, class: 0 }, class: { class: 2, both: 1, hands: 0 }, mix: { hands: 1, both: 1, class: 1 } };
  D.stylePhrase = { hands: 'learns best hands-on', class: 'learns best in the classroom', mix: 'open to all kinds of learning' };

  // The example roadmap, shown until someone answers a question.
  D.example = { y: 9, interests: ['make', 'planet'], sci: 'combined', subjects: ['geography', 'dt'], style: 'hands', s3: true };
  D.exampleWho = 'It shows the roadmap for a Year 9 pupil who enjoys making and fixing things, cares about nature and the climate, takes geography and D&T, and learns best hands-on.';

  // ---------- What to do next, by year group ----------
  D.next = {
    7: [
      'Look out for solar panels, heat pumps, home batteries and chargers near you. Each one needs people to install it, look after it and repair it.',
      'Try a STEM, coding or engineering club if your school runs one.',
      'Read two of the job profiles in your roadmap with your family.'
    ],
    8: [
      'Find out which GCSE options your school offers. Electronics and Engineering are not available everywhere.',
      'Try a STEM, coding or engineering club if your school runs one.',
      'Read two of the job profiles in your roadmap with your family.'
    ],
    9: [
      'At options evening, ask which subjects can include an energy project, such as the design project in D&T.',
      'Check which subjects your school offers. Electronics and Engineering are not available everywhere.',
      'Read two of the job profiles in your roadmap with your family.'
    ],
    10: [
      'Ask your school about work experience. The government is asking employers for <a href="https://www.gov.uk/government/news/new-vocational-gcses-unveiled-in-major-shake-up-to-hands-on-learning-for-teens" target="_blank" rel="noopener">200,000 extra placements</a> for 14 to 16-year-olds.',
      'If you take D&T, Electronics or Engineering, ask whether your project can take an energy theme.',
      'Visit open days at local colleges and sixth forms to see T Levels, V Levels and apprenticeships.'
    ],
    11: [
      'Apply for college, sixth form or an apprenticeship this year. Look at <a href="https://www.tlevels.gov.uk/students/subjects" target="_blank" rel="noopener">T Level subjects</a> and search on <a href="https://www.gov.uk/apply-apprenticeship" target="_blank" rel="noopener">Find an apprenticeship</a>.',
      'Aim for at least a grade 4 in English and maths. Most T Levels and advanced apprenticeships ask for it.',
      'At open days, ask colleges how their courses lead to the jobs on your roadmap.'
    ]
  };

  // For parents and carers (shown under What to do next, in the families view and in the PDF).
  D.parents = [
    "Ask the school's careers leader which local employers work in sustainable energy, and whether they offer work experience.",
    "Ask the school about careers guidance, and use the <a href=\"https://nationalcareers.service.gov.uk/\" target=\"_blank\" rel=\"noopener\">official careers website for England</a> (formerly the National Careers Service) or the careers service where you live.",
    "Talk through the jobs in this roadmap together. Many start with an apprenticeship, and a few usually need a degree."
  ];

  // Good to know. A link at the end of an item is its source.
  D.goodToKnow = [
    "In England you must stay in education or training until you are 18. That can be college, sixth form, an apprenticeship, or work or volunteering (20 hours or more a week) with part-time study. <a href=\"https://www.gov.uk/know-when-you-can-leave-school\" target=\"_blank\" rel=\"noopener\">School leaving age</a>",
    "If you finish Year 11 without at least a grade 4 in English or maths, you keep studying it after 16. <a href=\"https://www.gov.uk/government/publications/16-to-19-funding-maths-and-english-condition-of-funding/2025-to-2026-academic-year-16-to-19-funding-maths-and-english-condition-of-funding\" target=\"_blank\" rel=\"noopener\">Maths and English rules</a>",
    "T Levels are two-year courses that include at least 45 days working with an employer. <a href=\"https://www.gov.uk/government/publications/16-to-19-study-programmes-guide-for-providers/16-to-19-study-programmes-guidance-2026-to-2027-academic-year\" target=\"_blank\" rel=\"noopener\">16 to 19 study programmes</a>",
    "V Levels start in September 2027. Each is the size of one A level, so you can mix them with A levels. The first are in digital, education and early years, and finance and accounting. <a href=\"https://educationhub.blog.gov.uk/2026/03/new-v-levels-and-post-16-qualifications-explained/\" target=\"_blank\" rel=\"noopener\">V Levels explained</a>",
    "New vocational GCSEs, about practical skills for work, are planned in some subjects from as early as September 2029. They will replace today's technical awards. <a href=\"https://www.gov.uk/government/news/new-vocational-gcses-unveiled-in-major-shake-up-to-hands-on-learning-for-teens\" target=\"_blank\" rel=\"noopener\">Department for Education announcement</a>"
  ];

  // Plain-English meanings for the words in "Ways in", the timeline and Good to know. "m" finds the word in a job's routes.
  D.words = [
    { t: 'Apprenticeship', m: /apprenticeship/i, d: 'A real job with training. You are paid, learn at work and study part of the time, often at a college. You can start from age 16.' },
    { t: 'Foundation apprenticeship', m: /foundation apprenticeship/i, d: 'A first step into a type of work for 16 to 21-year-olds. You do not need set grades to start.' },
    { t: 'Degree apprenticeship', m: /degree apprenticeship/i, d: 'An apprenticeship that ends with a university degree. You earn a wage and do not pay course fees.' },
    { t: 'T Level', m: /\bT Levels?\b/, d: 'A two-year course after GCSEs, worth the same as three A levels. It includes at least 45 days working with an employer.' },
    { t: 'V Level', m: /\bV Levels?\b/, d: 'A new course from September 2027 about a type of work, the size of one A level. You can mix V Levels with A levels.' },
    { t: 'A level', m: /\bA levels?\b/, d: 'A two-year course in one subject after GCSEs, at a sixth form or college. Many university courses ask for A levels.' },
    { t: 'Levels 2 to 7', m: /\blevel [2-7]\b/i, d: 'Level 2 is the same standard as GCSEs at grades 4 to 9. Level 3 is the same as A levels and T Levels. Levels 4 and 5 are between A levels and a degree. Level 6 is a bachelor\'s degree, and level 7 a master\'s degree.' },
    { t: 'HND', m: /\bHND\b/, d: 'Higher National Diploma: a work-focused course, usually two years, at a college or university.' },
    { t: 'Foundation degree', m: /foundation degree/i, d: 'A work-focused course, usually two years. You can often add a third year to turn it into a full degree.' },
    { t: 'Degree', m: /(^|\| )Degree:/, d: 'A university course, usually three years if you study full time.' },
    { t: 'College', m: /(^|\| )College:/, d: 'A further education college. It runs courses for 16 to 19-year-olds and adults, including T Levels and apprenticeship training.' },
    { t: 'Accreditation scheme', m: /accreditation scheme/i, d: 'An approved body that checks energy assessors are trained, and lets them issue energy certificates for homes.' },
    { t: 'MCS-certified', m: /\bMCS\b/, d: 'Checked by MCS, the Microgeneration Certification Scheme, which sets standards for small renewable energy products and the people who fit them.' }
  ];

  // ---------- Near you, and official advice ----------
  // Near you: official finders and local groups, checked November 2026. Your area is saved on the device only.
  D.near = {
    gm: [
      { kind: 'Careers and apprenticeships', name: 'GMACS', url: 'https://www.gmacs.co.uk/', what: 'Greater Manchester\u2019s free careers and apprenticeships website for young people. Search local apprenticeships, get careers advice and chat to an adviser.' },
      { kind: 'Colleges and courses', name: 'Find a T Level near you', url: 'https://www.tlevels.gov.uk/students/find', what: 'Enter your postcode to see which local schools and colleges teach T Levels, such as Building Services Engineering for Construction.' },
      { kind: 'Community energy', name: 'Greater Manchester Community Renewables', url: 'https://www.gmcr.org.uk/', what: 'A volunteer-run group that puts community-owned solar panels on schools and community buildings.' },
      { kind: 'Community energy', name: 'Carbon Co-op', url: 'https://carbon.coop/', what: 'A Manchester co-operative that helps people make their homes warmer and use less energy.' }
    ],
    eng: [
      { kind: 'Colleges and courses', name: 'Find a T Level near you', url: 'https://www.tlevels.gov.uk/students/find', what: 'Enter your postcode to see which local schools and colleges teach T Levels, such as Building Services Engineering for Construction.' },
      { kind: 'Apprenticeships', name: 'Find an apprenticeship', url: 'https://www.gov.uk/apply-apprenticeship', what: 'Search apprenticeships near you, from age 16.' },
      { kind: 'Colleges and courses', name: 'Find a course', url: 'https://nationalcareers.service.gov.uk/find-a-course', what: 'Search college and training courses in your area.' },
      { kind: 'Community energy', name: 'Community Energy England', url: 'https://communityenergyengland.org/our-members', what: 'Find community energy groups across England.' }
    ],
    sco: [
      { kind: 'Careers', name: 'My World of Work', url: 'https://www.myworldofwork.co.uk/', what: 'Careers information and advice from Skills Development Scotland.' },
      { kind: 'Apprenticeships', name: 'Apprenticeships in Scotland', url: 'https://www.apprenticeships.scot/', what: 'Find apprenticeship vacancies across Scotland.' },
      { kind: 'Community energy', name: 'Local Energy Scotland projects map', url: 'https://localenergy.scot/local-energy-projects-map', what: 'See community and locally owned energy projects near you.' }
    ],
    wal: [
      { kind: 'Careers and apprenticeships', name: 'Careers Wales', url: 'https://careerswales.gov.wales/', what: 'Independent careers advice for all ages, and a search for apprenticeships in Wales.' }
    ],
    ni: [
      { kind: 'Careers and apprenticeships', name: 'Careers Service', url: 'https://www.nidirect.gov.uk/campaigns/careers', what: 'Careers advice for all ages, including information on apprenticeships in Northern Ireland.' }
    ]
  };
  D.nearNames = { gm: 'Greater Manchester', eng: 'England', sco: 'Scotland', wal: 'Wales', ni: 'Northern Ireland' };

  // Free official careers services, shown on the page and in the PDF.
  D.adviceIntro = "Your school or college careers adviser is the best place to start. These free official services can help too. The GCSE topics here come from England's courses. Wales and Northern Ireland have their own GCSEs, and Scotland has National qualifications.";
  D.advice = [
    { where: 'England', name: 'Get careers information and advice', what: 'The official careers website, formerly the National Careers Service. Under 18? Your school or college careers adviser gives guidance.', url: 'https://nationalcareers.service.gov.uk/' },
    { where: 'Scotland', name: 'My World of Work', what: 'Careers information and advice from Skills Development Scotland.', url: 'https://www.myworldofwork.co.uk/' },
    { where: 'Wales', name: 'Careers Wales', what: 'Independent, impartial careers advice and guidance for all ages.', url: 'https://careerswales.gov.wales/' },
    { where: 'Northern Ireland', name: 'Careers Service', what: 'Information, advice and guidance for all ages, including pupils at school.', url: 'https://www.nidirect.gov.uk/campaigns/careers' },
    { where: 'England', kind: 'route', name: 'Find an apprenticeship', what: 'Search and apply for apprenticeships from age 16.', url: 'https://www.gov.uk/apply-apprenticeship' },
    { where: 'England', kind: 'route', name: 'T Levels', what: 'Two-year courses for 16 to 19-year-olds with at least 45 days on placement.', url: 'https://www.tlevels.gov.uk/' }
  ];

  // ---------- About this guide, and sources ----------
  // {checked} is replaced by D.checked above.
  D.about = [
    "Developed by Professor Vahid Vahidinasab, Chair in Sustainability and Academic Research Lead at the Centre for Sustainable Innovation (CSI), University of Salford. Information checked in {checked} against Department for Education subject content, GOV.UK and the official careers website for England (formerly the National Careers Service).",
    "<strong>This guide is advisory only and is not personal careers advice.</strong> Schools offer different subjects and exam boards, so check your choices with your school and a careers adviser. Pay figures are the typical yearly pay on each job's official profile, from starter to experienced."
  ];
  D.sources = [
    ['New vocational GCSEs (Department for Education, September 2026)', 'https://www.gov.uk/government/news/new-vocational-gcses-unveiled-in-major-shake-up-to-hands-on-learning-for-teens'],
    ['New V levels and post-16 qualifications explained (March 2026)', 'https://educationhub.blog.gov.uk/2026/03/new-v-levels-and-post-16-qualifications-explained/'],
    ['T Level subjects', 'https://www.tlevels.gov.uk/students/subjects'],
    ['T Level in Building Services Engineering for Construction', 'https://www.tlevels.gov.uk/students/subjects/building-services-engineering'],
    ['Clean energy jobs boom (October 2025)', 'https://www.gov.uk/government/news/clean-energy-jobs-boom-to-bring-thousands-of-new-jobs'],
    ['Regulations: electric vehicle smart charge points', 'https://www.gov.uk/guidance/regulations-electric-vehicle-smart-charge-points'],
    ['Electric Vehicles (Smart Charge Points) Regulations 2021, Part 2', 'https://legislation.gov.uk/uksi/2021/1467/part/2/made'],
    ['School leaving age', 'https://www.gov.uk/know-when-you-can-leave-school'],
    ['Boiler Upgrade Scheme: what you can get (GOV.UK)', 'https://www.gov.uk/apply-boiler-upgrade-scheme/what-you-can-get'],
    ['Smart meters in Great Britain, June 2026 (DESNZ)', 'https://www.gov.uk/government/statistics/smart-meters-in-great-britain-quarterly-update-june-2026/smart-meters-in-great-britain-quarterly-update-june-2026-statistical-bulletin'],
    ['The National Careers Service website is changing (October 2026)', 'https://nationalcareers.service.gov.uk/service-is-changing'],
    ['Ofqual conditions for GCSE design and technology', 'https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/504213/gcse-subject-level-conditions-and-requirements-for-design-and-technology.pdf']
  ];

  // ---------- Teacher mode: the 20-minute activity (the same words as teachers.html) ----------
  D.teacher = {
    lead: "A free, 20-minute activity that helps pupils in Years 7 to 11 see how the GCSE topics they study now lead to jobs in clean, local energy.",
    outcome: "By the end, pupils can: name at least two jobs in clean, local energy; link one topic from a GCSE subject they study to one of those jobs; and describe one way into that job.",
    steps: [
      { mins: 5, title: "Starter", text: "Show slides 1 to 3. On the board, open The home in the roadmap and tap two or three parts of the picture, such as the heat pump and the solar panels. Ask: which school subjects turn up here? Who installs it?" },
      { mins: 10, title: "Build a roadmap", text: "Show slide 5. Pupils scan the QR code, answer the four questions and read their four jobs. They fill in the worksheet: one job, one GCSE topic it uses, one way in, and one question for a careers adviser." },
      { mins: 5, title: "Share", text: "Use slide 6. In pairs: which job surprised you? Which of your subjects linked to the most jobs? Finish with slide 7: pupils download their PDF or email it home." }
    ],
    before: [
      "Open the roadmap on a school device to check it loads on your network. If it does not, ask your IT team to allow vahidinasab.github.io.",
      "Pupils need a phone, tablet, Chromebook or computer, one each or one between two. No login, app or email address is needed.",
      "Print a worksheet for each pupil, and open the slides on the board.",
      "If your Wi-Fi is unreliable, open the roadmap once on each device before the lesson. After that first visit it opens without a connection."
    ],
    adapt: [
      "Years 7 and 8: spend longer on the home picture and on \"A day might include\" in each job card.",
      "Year 9: link it to options. Ask which subjects can include an energy project, such as the D&T design project.",
      "Years 10 and 11: focus on \"Ways in\", the timeline and application deadlines. Pupils can open \"What do these words mean?\" for T Levels, apprenticeships and levels.",
      "Subject lessons: science, maths, geography, D&T and computing teachers can open \"GCSE topics to look out for\", or use Search, to show where their topic is used in real jobs."
    ]
  };
})(window.SLES = window.SLES || { data: {} });
