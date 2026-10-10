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

/** Europass-style CV (content/cv.json). Empty personal fields are not shown. */
export type CvPersonal = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  linkedin: string;
  github: string;
  nationality: string;
  dateOfBirth: string;
  drivingLicence: string;
  photo: string;
};

export type CvEntry = { title: string; org: string; location?: string; start: string; end?: string; text?: string; link?: string };

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Cefr = (typeof CEFR_LEVELS)[number];
export type CvLanguage = { name: string; listening: Cefr; reading: Cefr; spokenInteraction: Cefr; spokenProduction: Cefr; writing: Cefr; certificate?: string };

export type CvListItem = { name: string; detail?: string; level?: string };

type SectionBase = { id: string; title: string; visible: boolean };
export type CvSection =
  | (SectionBase & { type: 'timeline'; items: CvEntry[] })
  | (SectionBase & { type: 'languages'; motherTongues: string[]; items: CvLanguage[] })
  | (SectionBase & { type: 'list'; items: CvListItem[] })
  | (SectionBase & { type: 'text'; text: string });
export type CvSectionType = CvSection['type'];

export type Cv = {
  personal: CvPersonal;
  summary: string;
  sections: CvSection[];
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

export type Profile = {
  name: string;
  handle: string;
  role: string;
  tagline: string;
  description: string;
  location: string;
  email: string;
  /** Portrait on the home page (file in public/ or URL) */
  photo?: string;
  currentFocus: string[];
  socials: { id: string; label: string; url: string }[];
};

/** Editable heading, intro and meta labels of a page (content/pages.json). */
export type PageText = { label?: string; title: string; intro?: string; meta?: { label: string; value: string }[] };

export type NavEntry = { id: string; label: string; enabled: boolean };

export type ContentBundle = {
  profile: Profile;
  navigation: NavEntry[];
  pages: Record<string, PageText>;
  skillGroups: SkillGroup[];
  skills: Skill[];
  knowhow: KnowhowDoc[];
  projects: ProjectDoc[];
  articles: ArticleDoc[];
  hobbies: Hobby[];
  cv: Cv;
  certificates: Certificate[];
};
