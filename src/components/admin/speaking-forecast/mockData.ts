import { Season, ForecastTopic } from './types';

export const initialSeasons: Season[] = [
  {
    id: 'season-2026-q3',
    name: 'Q3 / 2026',
    year: 2026,
    quarter: 3,
    isCurrent: true,
  },
  {
    id: 'season-2026-q2',
    name: 'Q2 / 2026',
    year: 2026,
    quarter: 2,
    isCurrent: false,
  },
  {
    id: 'season-2026-q1',
    name: 'Q1 / 2026',
    year: 2026,
    quarter: 1,
    isCurrent: false,
  },
];

export const initialTopics: ForecastTopic[] = [
  {
    id: 'topic-1',
    seasonId: 'season-2026-q3',
    topicName: 'Robots & Automation',
    category: 'Technology',
    part: 'Part 1',
    type: 'Retained',
    status: 'Published',
    updatedAt: '18 Aug 2026',
    questions: [
      'Are you interested in robots?',
      'Do you like the idea of robots helping you with household chores?',
      'Will robots replace human jobs in the future?',
      'Have you ever seen a robot in real life or in movies?',
    ],
    sampleAnswers: {
      band65:
        '<p>To be honest, I find robotic technology truly fascinating. Nowadays, automated appliances like robotic vacuum cleaners have made domestic tasks much more manageable. In the long run, although automation might displace certain repetitive manual roles, it will also generate high-value technological positions.</p>',
      band75:
        '<p>I have always been deeply intrigued by the rapid progression of robotics and artificial intelligence. Autonomous gadgets have streamlined our daily routines, relieving us from monotonous domestic labor. While there are legitimate concerns regarding technological unemployment, I believe robotics will act as a catalyst for new industries rather than a purely disruptive force.</p>',
    },
    keyVocabulary: [
      {
        id: 'v1',
        word: 'Streamline',
        meaning: 'To make an organization or system more efficient and effective',
        example: 'Automated machines help streamline repetitive manufacturing workflows.',
      },
      {
        id: 'v2',
        word: 'Technological unemployment',
        meaning: 'Loss of jobs caused by technological change and automation',
        example: 'Policymakers need to address the rising risk of technological unemployment.',
      },
      {
        id: 'v3',
        word: 'Monotonous labor',
        meaning: 'Boring, repetitive tasks that do not change',
        example: 'Robots can liberate humans from performing tedious and monotonous labor.',
      },
    ],
    ideas:
      '• Robots in everyday life: smart home appliances, robotic vacuums, delivery bots.\n• Benefits: saves time, increases precision, handles hazardous tasks.\n• Drawbacks: high initial investment, over-reliance, fear of job disruption.',
    seoTitle: 'IELTS Speaking Forecast Q3/2026 - Topic: Robots & Automation',
    metaDescription:
      'Trọn bộ câu hỏi và bài mẫu IELTS Speaking Part 1 chủ đề Robots & Automation cho Quý 3/2026 kèm từ vựng Band 7.5 ★.',
    slug: 'q3-2026-part1-robots-automation',
  },
  {
    id: 'topic-2',
    seasonId: 'season-2026-q3',
    topicName: 'Describe a memorable journey by public transport',
    category: 'Places & Travel',
    part: 'Part 2',
    type: 'New',
    status: 'Published',
    updatedAt: '17 Aug 2026',
    cueCardPrompt:
      'Describe a memorable journey you made by public transport (train, bus, metro).',
    cueCardBulletPoints: [
      'Where you went and what public transport you used',
      'Who you traveled with',
      'What happened during the journey',
      'And explain why this journey was so memorable to you',
    ],
    sampleAnswers: {
      band65:
        '<p>I would like to talk about a scenic train journey I took last summer across the central coast of Vietnam. I went with two of my closest university friends. We boarded the train early in the morning, and the ride took approximately six hours. The panoramic view of the coastline passing through the Hai Van pass was breathtaking. What made it memorable was the camaraderie and the picturesque landscapes.</p>',
      band75:
        '<p>I would like to recount an unforgettable expedition via the coastal railway line between Da Nang and Hue. Traveling alongside two lifelong companions, the six-hour journey provided an uninterrupted panorama of lush mountain ranges juxtaposed against the azure coastline. What etched this experience in my memory was the nostalgic atmosphere of vintage carriage travel paired with insightful conversations with local passengers.</p>',
    },
    keyVocabulary: [
      {
        id: 'v4',
        word: 'Breathtaking panorama',
        meaning: 'An impressive, unbroken view of an entire surrounding area',
        example: 'The mountain pass offers a breathtaking panorama of the ocean below.',
      },
      {
        id: 'v5',
        word: 'Etched in memory',
        meaning: 'Something remembered vividly for a long time',
        example: 'The sheer beauty of the scenery remains deeply etched in my memory.',
      },
      {
        id: 'v6',
        word: 'Juxtaposed against',
        meaning: 'Placed close together with contrasting effect',
        example: 'The emerald hills were sharply juxtaposed against the crystal blue water.',
      },
    ],
    ideas:
      '• Opening: Introduce the trip (Da Nang to Hue via Reunification Express train).\n• Body: Describe the scenic highlights (Hai Van pass, coastline, train atmosphere).\n• Climax: Sunset over Lang Co bay while enjoying local snacks.\n• Reflection: Contrast between slow train travel vs rush of airplanes.',
    seoTitle: 'IELTS Speaking Part 2 Forecast Q3/2026: Memorable Public Transport Journey',
    metaDescription:
      'Bài mẫu IELTS Speaking Part 2 Cue Card: Describe a memorable journey by public transport với Sample Band 8.0 & Vocabulary.',
    slug: 'q3-2026-part2-memorable-journey-public-transport',
  },
  {
    id: 'topic-3',
    seasonId: 'season-2026-q3',
    topicName: 'Public Transportation & Urban Mobility',
    category: 'Society & Urban Life',
    part: 'Part 3',
    type: 'New',
    status: 'Published',
    updatedAt: '17 Aug 2026',
    questions: [
      'Why do some people prefer private cars over public transport despite heavy traffic?',
      'How can governments encourage citizens to commute via public transport?',
      'Do you think public transport should be completely free in major cities?',
    ],
    sampleAnswers: {
      band65:
        '<p>Many commuters opt for private vehicles primarily due to autonomy and personal comfort. Private cars allow door-to-door transit without the need to adhere to rigid schedules. To incentivize public transit usage, municipal authorities must invest heavily in expanding subway networks and maintaining strict punctuality.</p>',
      band75:
        '<p>The predilection for private mobility often boils down to perceived convenience, personal privacy, and the seamless nature of point-to-point travel. Nevertheless, to mitigate urban congestion, governments ought to subsidize fares, bolster transit frequencies, and establish dedicated bus rapid transit lanes to make public commuting undeniably superior in speed and reliability.</p>',
    },
    keyVocabulary: [
      {
        id: 'v7',
        word: 'Predilection',
        meaning: 'A preference or special liking for something',
        example: 'There is a strong predilection for personal automobiles in developing metropolitan areas.',
      },
      {
        id: 'v8',
        word: 'Mitigate congestion',
        meaning: 'To reduce or lessen traffic jams and overcrowding',
        example: 'Expanding rail infrastructure is pivotal to mitigating severe road congestion.',
      },
    ],
    ideas:
      '• Private vs Public: convenience, status symbol vs eco-friendly, cost-effective.\n• Government measures: fare subsidies, congestion charges for cars, clean modern buses.\n• Free public transport: high tax burden vs huge environmental and social mobility benefits.',
    seoTitle: 'IELTS Speaking Part 3 Forecast Q3/2026: Public Transportation',
    metaDescription:
      'Tổng hợp câu hỏi Part 3 chủ đề Urban Mobility & Public Transport trong Forecast Speaking Q3/2026.',
    slug: 'q3-2026-part3-public-transportation-urban-mobility',
  },
  {
    id: 'topic-4',
    seasonId: 'season-2026-q3',
    topicName: 'Books & Reading Habits',
    category: 'Education & Hobbies',
    part: 'Part 1',
    type: 'New',
    status: 'Draft',
    updatedAt: '18 Aug 2026',
    questions: [
      'Do you prefer reading physical books or e-books?',
      'What was your favorite book when you were a child?',
      'Do you think children nowadays read enough books?',
    ],
    sampleAnswers: {
      band65:
        '<p>I lean towards physical books because I appreciate the tactile sensation of turning paper pages. However, e-books are undeniably convenient when traveling.</p>',
      band75:
        '<p>While I recognize the sheer convenience and portability of digital e-readers, I still retain a nostalgic affinity for physical paperbacks. The tactile experience and the absence of screen glare make traditional reading far more immersive for me.</p>',
    },
    keyVocabulary: [
      {
        id: 'v9',
        word: 'Tactile sensation',
        meaning: 'Relating to the sense of touch',
        example: 'Many avid bibliophiles cherish the tactile sensation of holding a physical book.',
      },
    ],
    ideas:
      '• Physical vs E-books: sensory experience vs portability & storage.\n• Children reading: competition from short-form videos and video games.',
    seoTitle: 'IELTS Speaking Forecast Q3/2026 - Topic: Books & Reading',
    metaDescription:
      'Forecast IELTS Speaking Part 1 chủ đề Books & Reading Habits - Bản nháp câu hỏi và từ vựng.',
    slug: 'q3-2026-part1-books-reading-habits',
  },
  {
    id: 'topic-5',
    seasonId: 'season-2026-q3',
    topicName: 'Describe an intelligent person you know',
    category: 'People',
    part: 'Part 2',
    type: 'Retained',
    status: 'Published',
    updatedAt: '16 Aug 2026',
    cueCardPrompt: 'Describe an intelligent person you know personally or admire.',
    cueCardBulletPoints: [
      'Who this person is and how you know them',
      'What they do',
      'Why you think they are intelligent',
      'And explain what you have learned from them',
    ],
    sampleAnswers: {
      band65:
        '<p>I would like to describe my high school physics teacher, Mr. Minh. He possessed an extraordinary ability to elucidate complex scientific theories into relatable, intuitive examples.</p>',
      band75:
        '<p>I would like to shed light on a person of remarkable intellect, my former mentor Dr. Minh. Beyond his vast academic repertoire in theoretical physics, what truly distinguished his intelligence was his uncanny knack for synthesizing multifaceted problems and articulating them with crystal clarity.</p>',
    },
    keyVocabulary: [
      {
        id: 'v10',
        word: 'Elucidate',
        meaning: 'To make something clear; explain',
        example: 'He had a rare gift to elucidate abstract theories with ease.',
      },
      {
        id: 'v11',
        word: 'Uncanny knack',
        meaning: 'An extraordinary or exceptional natural ability',
        example: 'She possessed an uncanny knack for problem-solving under pressure.',
      },
    ],
    ideas:
      '• Who: Mentor / Teacher / Colleague.\n• Intelligence traits: quick analytical thinking, high EQ, deep knowledge domain.\n• Key takeaway: critical thinking and humble demeanor.',
    seoTitle: 'IELTS Speaking Part 2 Forecast Q3/2026: Intelligent Person',
    metaDescription:
      'Sample Answer Band 8.0 & Vocabulary cho đề Describe an intelligent person you know.',
    slug: 'q3-2026-part2-intelligent-person',
  },
  {
    id: 'topic-6',
    seasonId: 'season-2026-q3',
    topicName: 'Artificial Intelligence & Human Cognition',
    category: 'Technology & Science',
    part: 'Part 3',
    type: 'Retained',
    status: 'Published',
    updatedAt: '15 Aug 2026',
    questions: [
      'Will artificial intelligence outsmart humans in all cognitive domains?',
      'What skills should future generations cultivate to stay relevant in the AI era?',
    ],
    sampleAnswers: {
      band65:
        '<p>AI has already surpassed human capability in data processing and computation. However, emotional intelligence, authentic creativity, and ethical judgment remain distinctly human traits.</p>',
      band75:
        '<p>While generative AI models exhibit superhuman prowess in computational tasks and pattern recognition, they fundamentally lack genuine consciousness, empathetic nuance, and moral reasoning. Consequently, human educators and leaders should prioritize critical thinking and emotional intelligence over rote learning.</p>',
    },
    keyVocabulary: [
      {
        id: 'v12',
        word: 'Superhuman prowess',
        meaning: 'Exceptional skill or ability far exceeding human capacity',
        example: 'Neural networks demonstrate superhuman prowess in processing vast datasets.',
      },
    ],
    ideas:
      '• AI limits: absence of genuine empathy, moral judgment, lived human experiences.\n• Essential future skills: metacognition, cross-disciplinary problem solving, resilience.',
    seoTitle: 'IELTS Speaking Part 3 Forecast Q3/2026: AI & Human Cognition',
    metaDescription:
      'Câu hỏi thảo luận và bài mẫu Part 3 chủ đề AI & Human Cognition.',
    slug: 'q3-2026-part3-artificial-intelligence-cognition',
  },
  {
    id: 'topic-7',
    seasonId: 'season-2026-q3',
    topicName: 'Environmental Protection & Waste Reduction',
    category: 'Environment',
    part: 'Part 1',
    type: 'Retained',
    status: 'Draft',
    updatedAt: '14 Aug 2026',
    questions: [
      'Do you do anything to protect the environment in your daily life?',
      'Do people in your country recycle waste regularly?',
      'Have you ever participated in an environmental clean-up campaign?',
    ],
    sampleAnswers: {
      band65:
        '<p>I make a conscious effort to minimize single-use plastics and always carry a reusable canvas bag when shopping.</p>',
      band75:
        '<p>I conscientiously adopt eco-friendly habits in my daily routine, such as eliminating disposable plastics, minimizing household food waste, and commuting via public bicycles whenever feasible.</p>',
    },
    keyVocabulary: [
      {
        id: 'v13',
        word: 'Conscientiously adopt',
        meaning: 'To follow or implement practices in a thorough and responsible manner',
        example: 'Citizens must conscientiously adopt green lifestyle practices.',
      },
    ],
    ideas:
      '• Daily habits: refillable bottles, sorting garbage, energy conservation.\n• Community recycling: need for better sorting facilities and civic awareness.',
    seoTitle: 'IELTS Speaking Forecast Q3/2026 - Topic: Environment',
    metaDescription:
      'Dự đoán đề thi IELTS Speaking Part 1 chủ đề Môi trường và Giảm thiểu rác thải.',
    slug: 'q3-2026-part1-environmental-protection',
  },
  {
    id: 'topic-8',
    seasonId: 'season-2026-q2',
    topicName: 'Noise Pollution in Urban Areas',
    category: 'Environment',
    part: 'Part 1',
    type: 'Retained',
    status: 'Published',
    updatedAt: '10 May 2026',
    questions: [
      'Do you mind living in a noisy neighborhood?',
      'What kinds of sounds annoy you the most?',
    ],
    sampleAnswers: {
      band65:
        '<p>I am quite sensitive to noise, especially honking and construction sounds early in the morning.</p>',
      band75:
        '<p>I find auditory clutter intensely aggravating. Continuous traffic honking and nearby industrial construction significantly impede cognitive concentration and sleep quality.</p>',
    },
    keyVocabulary: [
      {
        id: 'v14',
        word: 'Auditory clutter',
        meaning: 'Excessive and disruptive noises in the environment',
        example: 'Metropolitan living often exposes residents to pervasive auditory clutter.',
      },
    ],
    ideas: '• Urban noise sources: traffic, construction, street vendors.\n• Health impact: insomnia, elevated stress levels.',
    seoTitle: 'IELTS Speaking Forecast Q2/2026 - Topic: Noise Pollution',
    metaDescription: 'IELTS Speaking Part 1 Topic Noise Pollution Q2/2026.',
    slug: 'q2-2026-part1-noise-pollution',
  },
];
