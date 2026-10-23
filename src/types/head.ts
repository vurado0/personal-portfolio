export type HeadData = {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  path?: string;
};

/** Language versions of a page for search engines (hreflang → path). */
export type HeadLanguages = { locale: string; ogLocale: string; alternates?: { hreflang: string; path: string }[] };
