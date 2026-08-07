export const BRAND = {
  name: "Grupo LMF Universe",
  shortName: "Grupo LMF",
  groupName: "Grupo LMF",
  domain: "universe.grupomaia.me",
  baseUrl: "https://universe.grupomaia.me",
  contactEmail: "contato@grupomaia.com.br",
  fromEmail: "noreply@universe.grupomaia.me",
  repository: "https://github.com/leonardomaia253/lmf-universe",
  starRepositoryApi:
    "https://api.github.com/repos/leonardomaia253/lmf-universe",
  xCreator: "@leonardomaia253",
  xCreatorUrl: "https://x.com/leonardomaia253",
  appDescription:
    "Explore empresas como planetas em um Universo pixel art 3D. Voe pelo Universo e descubra novas companhias.",
  ogAlt:
    "Grupo LMF Universe: Suas empresas como planetas 3D em um universo interativo.",
} as const;

export function getSiteUrl(env = process.env): string {
  return (
    env.NEXT_PUBLIC_BASE_URL ||
    env.NEXT_PUBLIC_SITE_URL ||
    env.NEXT_PUBLIC_APP_URL ||
    (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : BRAND.baseUrl)
  ).replace(/\/+$/, "");
}

export function getAppUrl(env = process.env): string {
  return (env.NEXT_PUBLIC_APP_URL || getSiteUrl(env)).replace(/\/+$/, "");
}

export function getFromAddress(): string {
  return `${BRAND.name} <${BRAND.fromEmail}>`;
}

export function getContactMailto(subject?: string): string {
  const suffix = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${BRAND.contactEmail}${suffix}`;
}
