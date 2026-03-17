import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { CompareRedirect } from "./compare-redirect";

type Props = {
  params: Promise<{ userA: string; userB: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userA, userB } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ data: devA }, { data: devB }] = await Promise.all([
    supabase
      .from("companies")
      .select("username, contributions, contributions_total, total_stars, rank")
      .eq("username", userA.toLowerCase())
      .single(),
    supabase
      .from("companies")
      .select("username, contributions, contributions_total, total_stars, rank")
      .eq("username", userB.toLowerCase())
      .single(),
  ]);

  const title = `@${userA} vs @${userB} - Maia Universe`;

  if (!devA || !devB) {
    return {
      title,
      description: `Compare ${userA} and ${userB} in Maia Universe`,
      openGraph: {
        images: [
          {
            url: `https://maia.universe.sh/api/og?userA=${userA}&userB=${userB}`,
            alt: "Comparação de Perfis - Maia Universe",
          },
        ],
      },
    };
  }

  const contribsA = (devA.contributions_total && devA.contributions_total > 0) ? devA.contributions_total : devA.contributions;
  const contribsB = (devB.contributions_total && devB.contributions_total > 0) ? devB.contributions_total : devB.contributions;
  const description = `@${devA.username} (#${devA.rank ?? "?"}, ${contribsA.toLocaleString()} contribuições, ${devA.total_stars.toLocaleString()} estrelas) vs @${devB.username} (#${devB.rank ?? "?"}, ${contribsB.toLocaleString()} contribuições, ${devB.total_stars.toLocaleString()} estrelas)`;

  return {
    title,
    description,
    openGraph: {
      images: [
        {
          url: `https://maia.universe.sh/api/og?userA=${userA}&userB=${userB}`,
          alt: "Comparação de Perfis - Maia Universe",
        },
      ],
    },
  };
}

export default async function ComparePage({ params }: Props) {
  const { userA, userB } = await params;
  return <CompareRedirect userA={userA} userB={userB} />;
}
