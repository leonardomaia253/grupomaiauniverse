"use client";

import dynamic from "next/dynamic";

const UniversePOC = dynamic(() => import("@/components/UniversePOC"), { ssr: false });

export default function POCPage() {
  return <UniversePOC />;
}
