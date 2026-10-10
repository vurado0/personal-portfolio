// Shared content types: produced by scripts/lib/content.ts at build time,
// consumed by the app through the `virtual:content` module.

export type SkillGroup = { id: string; label: string };

export type Skill = {
  id: string;
  name: string;
  group: string;
  /** 1 (just started) – 5 (expert) */
  level: number;
  context: string;
};

export type Heading = { id: string; text: string; depth: number };

export type DocBase = {
  slug: string;
  /** Site path, e.g. /knowhow/linux/ssh-keys */
  url: string;
  title: string;
  summary: string;
  tags: string[];
  skills: string[];
  html: string;
  headings: Heading[];
  /** Plain text for full-text search */
  text: string;
  readingMinutes: number;
};

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type KnowhowDoc = DocBase & {
  category: string;
  updated: string;
  difficulty: Difficulty;
};

export type ProjectStatus = 'idea' | 'in progress' | 'done';

export type ProjectDoc = DocBase & {
  stack: string[];
  role: string;
  status: ProjectStatus;
  period: string;
  links: { github?: string; demo?: string; [key: string]: string | undefined };
  cover?: string;
  featured: boolean;
};

export type ArticleDoc = DocBase & {
  date: string;
  cover?: string;
  draft: boolean;
};

export type Hobby = {
  id: string;
  title: string;
  text: string;
  image?: string;
  links?: { label: string; url: string }[];
};

export type TimelineEntry = {
  type: 'education' | 'work' | 'certificate';
  title: string;
  org: string;
  start: string;
  end?: string;
  text?: string;
};

export type Cv = {
  summary: string;
  timeline: TimelineEntry[];
  languages: { name: string; level: string }[];
  pdf?: string;
};

export type CertificateStatus = 'planned' | 'in progress' | 'done';

export type Certificate = {
  id: string;
  title: string;
  issuer: string;
  status: CertificateStatus;
  date?: string;
  url?: string;
  skills: string[];
};

export type ContentBundle = {
  skillGroups: SkillGroup[];
  skills: Skill[];
  knowhow: KnowhowDoc[];
  projects: ProjectDoc[];
  articles: ArticleDoc[];
  hobbies: Hobby[];
  cv: Cv;
  certificates: Certificate[];
};
