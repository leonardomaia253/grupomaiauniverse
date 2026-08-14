export const BRAND = {
  name: "Mapa Vivo",
  shortName: "Mapa Vivo",
  groupName: "Portfolio Patrimonial",
  domain: "universe.grupomaia.me",
  baseUrl: "https://universe.grupomaia.me",
  contactEmail: "contato@grupomaia.com.br",
  fromEmail: "noreply@universe.grupomaia.me",
  repository: "https://github.com/leonardomaia253/lmf-universe",
  starRepositoryApi:
    "https://api.github.com/repos/leonardomaia253/lmf-universe",
  xCreator: "@mapavivo",
  xCreatorUrl: "mailto:contato@grupomaia.com.br",
  appDescription:
    "Um guia visual e animado para conhecer as empresas do grupo: o que fazem, suas historias, informacoes publicas e caminhos para clientes, fas e investidores.",
  ogAlt:
    "Mapa Vivo das Empresas: um jeito simples e animado de conhecer empresas, historias, informacoes publicas e oportunidades.",
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
