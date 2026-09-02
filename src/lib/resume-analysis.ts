export type ResumeFileMeta = {
  name: string;
  size: number;
  type: string;
  analyzedAt: string;
};

export type ScoreContributor = {
  label: string;
  score: number;
  note: string;
  tone: 'good' | 'watch' | 'low';
};

export type ResumeResult = {
  version: 1;
  score: number;
  file: ResumeFileMeta;
  summary: string;
  contributors: ScoreContributor[];
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: { title: string; body: string }[];
};

const skillAliases: Record<string, string[]> = {
  C: [' c ', ' c++', ' c#'],
  'C++': ['c++'],
  Java: ['java'],
  Python: ['python'],
  JavaScript: ['javascript', 'ecmascript'],
  TypeScript: ['typescript'],
  React: ['react', 'react.js', 'reactjs'],
  'Node.js': ['node.js', 'nodejs'],
  HTML: ['html'],
  CSS: ['css'],
  Express: ['express.js', 'express'],
  'REST APIs': ['rest api', 'restful'],
  SQL: ['sql', 'postgres', 'mysql'],
  PostgreSQL: ['postgresql', 'postgres'],
  MongoDB: ['mongodb'],
  DBMS: ['dbms'],
  DSA: ['dsa', 'data structures', 'algorithms'],
  'Operating Systems': ['operating systems', 'os concepts'],
  'Computer Networks': ['computer networks', 'networking'],
  OOP: ['oop', 'object oriented'],
  'Machine Learning': ['machine learning', 'ml'],
  'Deep Learning': ['deep learning'],
  PyTorch: ['pytorch'],
  TensorFlow: ['tensorflow'],
  'Scikit-learn': ['scikit-learn', 'sklearn'],
  'Computer Vision': ['computer vision'],
  NLP: ['natural language processing', 'nlp'],
  Git: ['git'],
  GitHub: ['github'],
  Docker: ['docker'],
  Linux: ['linux'],
  AWS: ['aws', 'amazon web services'],
  Azure: ['azure'],
};

const compact = (value: string) => value.replace(/\s+/g, ' ').trim();

const decodePdfString = (value: string) =>
  value
    .replace(/\\([\\()])/g, '$1')
    .replace(/\\n|\\r|\\t/g, ' ');

export async function extractPdfText(file: File): Promise<string> {
  const source = new TextDecoder('latin1').decode(await file.arrayBuffer());
  const literalStrings = [...source.matchAll(/\((?:\\.|[^\\)])*\)/g)]
    .map((match) => decodePdfString(match[0].slice(1, -1)))
    .filter((value) => /[A-Za-z]{2,}/.test(value));
  const hexStrings = [...source.matchAll(/<([0-9A-Fa-f]{8,})>/g)]
    .map((match) => match[1])
    .filter((value) => value.length % 2 === 0)
    .map((value) => value.match(/.{2}/g)?.map((pair) => String.fromCharCode(parseInt(pair, 16))).join('') ?? '')
    .filter((value) => /[A-Za-z]{2,}/.test(value));
  const extracted = compact([...literalStrings, ...hexStrings].join(' '));
  if (extracted.length < 40) {
    throw new Error('No selectable text was found. Export a text-based PDF and try again.');
  }
  return extracted;
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function analyzeResume(text: string, file: ResumeFileMeta): ResumeResult {
  const normalized = ` ${text.toLowerCase()} `;
  const has = (terms: string[]) => terms.some((term) => normalized.includes(term));
  const skills = Object.entries(skillAliases).filter(([, aliases]) => has(aliases)).map(([skill]) => skill);
  const sectionCount = ['education', 'experience', 'projects', 'skills', 'certifications', 'achievements']
    .filter((section) => normalized.includes(` ${section} `)).length;
  const hasProjects = has([' projects ', ' built ', ' developed ', ' deployed ']);
  const hasImpact = has(['increased', 'reduced', 'improved', 'saved', 'launched', ' shipped ', '%', ' users ', ' ms ']);
  const hasLinks = has(['github', 'linkedin', 'portfolio', 'http']);
  const contributors: ScoreContributor[] = [
    { label: 'Skills coverage', score: Math.min(100, 34 + skills.length * 4), tone: skills.length >= 8 ? 'good' : skills.length >= 4 ? 'watch' : 'low', note: `${skills.length} common CS skills detected.` },
    { label: 'Project proof', score: hasProjects ? (hasLinks ? 92 : 72) : 38, tone: hasProjects && hasLinks ? 'good' : hasProjects ? 'watch' : 'low', note: hasProjects ? (hasLinks ? 'Projects and public proof are present.' : 'Projects found; add links to make them verifiable.') : 'No clear project evidence found.' },
    { label: 'Story completeness', score: Math.min(100, 24 + sectionCount * 12), tone: sectionCount >= 5 ? 'good' : sectionCount >= 3 ? 'watch' : 'low', note: `${sectionCount} useful resume sections detected.` },
    { label: 'Measurable impact', score: hasImpact ? 84 : 42, tone: hasImpact ? 'good' : 'low', note: hasImpact ? 'Outcome language and measurable signals are present.' : 'Bullets need more outcomes, scale, or before/after evidence.' },
  ];
  const score = Math.round(contributors.reduce((sum, item) => sum + item.score, 0) / contributors.length);
  const strengths = [
    skills.length >= 4 ? `Strong technical coverage with ${skills.length} relevant skills detected.` : 'A technical foundation is visible in the resume.',
    hasProjects ? 'Hands-on project work gives your story concrete evidence.' : 'Your experience can become stronger with one focused project story.',
    hasImpact ? 'Some bullets already connect your work to outcomes.' : 'The document has a clear base to sharpen with measurable evidence.',
  ];
  const weaknesses = [
    !hasImpact && 'No measurable project outcomes detected.',
    !hasProjects && 'Projects section appears limited or difficult to locate.',
    skills.length < 4 && 'Few common technical skills detected.',
    !hasLinks && 'No GitHub, portfolio, or LinkedIn proof link detected.',
    sectionCount < 5 && 'Add or clarify sections so a fast reviewer can scan the story.',
  ].filter((item): item is string => Boolean(item));
  const recommendations = [
    { title: 'Rewrite 3 bullets with evidence', body: 'Name the change, the technical move, and the result: “Improved X by doing Y, resulting in Z.”' },
    { title: 'Make one project impossible to miss', body: hasProjects ? 'Give your strongest project a one-line purpose, your contribution, and a direct proof link.' : 'Add one concise project with a purpose, stack, contribution, and outcome.' },
    { title: 'Bring the relevant stack forward', body: `Prioritize the skills that match your target roles${skills.length ? `: ${skills.slice(0, 5).join(', ')}` : ''}. Skip the inventory list.` },
  ];
  return {
    version: 1,
    score,
    file,
    summary: score >= 75 ? 'You have a credible base. Sharper proof points can make this feel much more like you.' : 'The raw material is here. Focus the next pass on proof, outcomes, and a cleaner technical signal.',
    contributors,
    skills,
    strengths,
    weaknesses,
    recommendations,
  };
}