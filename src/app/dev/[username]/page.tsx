import { permanentRedirect } from "next/navigation";
import { getInstitutionalCompany } from "@/lib/company-catalog";

export default async function LegacyProfileRedirect({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const company = getInstitutionalCompany(username);
  permanentRedirect(company ? `/empresas/${company.slug}` : "/#empresas");
}
