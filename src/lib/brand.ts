export const BRAND = {
  name: "Grupo Maia",
  shortName: "Universe",
  groupName: "Grupo Maia",
  domain: "universe.grupomaia.me",
  baseUrl: "https://universe.grupomaia.me",
  contactEmail: "contato@grupomaia.me",
  fromEmail: "noreply@universe.grupomaia.me",
  repository: "https://github.com/leonardomaia253/lmf-universe",
  starRepositoryApi:
    "https://api.github.com/repos/leonardomaia253/lmf-universe",
  xCreator: "@grupomaia",
  xCreatorUrl: "mailto:contato@grupomaia.me",
  appDescription:
    "Visualize as 29 empresas do Grupo Maia, seus setores e as conexões que formam o ecossistema da holding.",
  ogAlt:
    "Grupo Maia Universe: 29 empresas conectadas por governança, capital e operação.",
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
