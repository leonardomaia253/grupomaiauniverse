"use client";

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { Menu, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase";
import {
  generateUniverseLayout,
  CONSTELLATION_NAMES,
  CONSTELLATION_COLORS,
  type UniversePlanet,
  type SpacePlaza,
  type SpaceDecoration,
  type SpaceRiver,
  type SpaceBridge,
  type GalaxyZone,
  type CompanyRecord,
} from "@/lib/github";
import Image from "next/image";
import Link from "next/link";
import ActivityTicker, { type FeedEvent } from "@/components/ActivityTicker";
import { ITEM_NAMES, ITEM_EMOJIS } from "@/lib/zones";
import { useStreakCheckin } from "@/lib/useStreakCheckin";
import { useLiveUsers } from "@/lib/useLiveUsers";
import { useCodingPresence } from "@/lib/useCodingPresence";
import { useRaidSequence } from "@/lib/useRaidSequence";
import { isFridayThe13th } from "@/lib/raid";
import { useDailies } from "@/lib/useDailies";
import InviteCard, { type InvitePreview } from "@/components/InviteCard";
import XpBar from "@/components/XpBar";
import { rankFromLevel, tierFromLevel, levelProgress, xpForLevel } from "@/lib/xp";
import LoadingScreen, { type LoadingStage } from "@/components/LoadingScreen";
import { getUniverseCache, setUniverseCache, clearUniverseCache } from "@/lib/UniverseCache";
import { DEFAULT_SKY_ADS, buildAdLink, trackAdEvent, trackAdEvents, isPlanetAd } from "@/lib/skyAds";
import { track } from "@vercel/analytics";
import {
  identifyUser,
  trackSignInClicked,
  trackPlanetClaimed,
  trackFreeItemClaimed,
  trackPlanetClicked,
  trackKudosSent,
  trackSearchUsed,
  trackSkyAdImpression,
  trackSkyAdClick,
  trackSkyAdCtaClick,
  trackReferralLinkLanded,
  trackShareClicked,
  trackSignInPromptShown,
  trackSignInPromptClicked,
  trackDisabledButtonClicked,
} from "@/lib/himetrica";

import { isAdmin } from "@/lib/admin";

const UniverseCanvas = dynamic(() => import("@/components/UniverseCanvas"), {
  ssr: false,
});

const ActivityPanel = dynamic(() => import("@/components/ActivityPanel"), { ssr: false });
const DailiesWidget = dynamic(() => import("@/components/DailiesWidget"), { ssr: false });
const RaidPreviewModal = dynamic(() => import("@/components/RaidPreviewModal"), { ssr: false });
const RaidOverlay = dynamic(() => import("@/components/RaidOverlay"), { ssr: false });
const PillModal = dynamic(() => import("@/components/PillModal"), { ssr: false });
const FounderMessage = dynamic(() => import("@/components/FounderMessage"), { ssr: false });
const RabbitCompletion = dynamic(() => import("@/components/RabbitCompletion"), { ssr: false });
const ConstellationChooser = dynamic(() => import("@/components/constellation-chooser"), { ssr: false });
const LevelUpToast = dynamic(() => import("@/components/LevelUpToast"), { ssr: false });
const MiniMap = dynamic(() => import("@/components/MiniMap"), { ssr: false });

// Feature flags — flip to switch milestone banner
const MILESTONE_MODE: "stars" | "companies" = "companies"; // "stars" = Estrela Maias road to 1K, "companies" = total companies

const THEMES = [
  { name: "Midnight", accent: "#6090e0", shadow: "#203870" },
  { name: "Sunset", accent: "#c8e64a", shadow: "#5a7a00" },
  { name: "Neon", accent: "#e040c0", shadow: "#600860" },
  { name: "Emerald", accent: "#f0c060", shadow: "#806020" },
];

// Achievement display data for profile card (client-side, mirrors DB)
const TIER_COLORS_MAP: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd700", diamond: "#b9f2ff",
};
const TIER_EMOJI_MAP: Record<string, string> = {
  bronze: "\uD83D\uDFE4", silver: "\u26AA", gold: "\uD83D\uDFE1", diamond: "\uD83D\uDC8E",
};
const ACHIEVEMENT_TIERS_MAP: Record<string, string> = {
  god_mode: "diamond", legend: "diamond", famous: "diamond", mayor: "diamond",
  machine: "gold", popular: "gold", factory: "gold", influencer: "gold", philanthropist: "gold", icon: "gold", legendary: "gold",
  grinder: "silver", architect: "silver", patron: "silver", beloved: "silver", admired: "silver",
  first_push: "bronze", committed: "bronze", builder: "bronze", rising_star: "bronze",
  recruiter: "bronze", generous: "bronze", gifted: "bronze", appreciated: "bronze",
  on_fire: "bronze", generous_streak: "bronze",
  dedicated: "silver",
  obsessed: "gold",
  no_life: "diamond",
  white_rabbit: "diamond",
  daily_rookie: "bronze", daily_regular: "silver", daily_master: "gold", daily_legend: "diamond",
};
const ACHIEVEMENT_NAMES_MAP: Record<string, string> = {
  god_mode: "God Mode", legend: "Legend", famous: "Famous", mayor: "Mayor",
  machine: "Machine", popular: "Popular", factory: "Factory", influencer: "Influencer",
  grinder: "Grinder", architect: "Architect", builder: "Builder", rising_star: "Rising Star",
  recruiter: "Recruiter", committed: "Committed", first_push: "First Push",
  philanthropist: "Philanthropist", patron: "Patron", generous: "Generous",
  icon: "Icon", beloved: "Beloved", gifted: "Gifted",
  legendary: "Legendary", admired: "Admired", appreciated: "Appreciated",
  on_fire: "On Fire", dedicated: "Dedicated", obsessed: "Obsessed",
  no_life: "No Life", generous_streak: "Generous Streak",
  white_rabbit: "White Rabbit",
  daily_rookie: "Daily Rookie", daily_regular: "Daily Regular", daily_master: "Daily Master", daily_legend: "Daily Legend",
};

// Dev "class" — funny RPG-style title, deterministic per username
const DEV_CLASSES = [
  "Vibe Coder",
  "Stack Overflow Tourist",
  "Console.log Debugger",
  "Ctrl+C Ctrl+V Engineer",
  "Senior Googler",
  "Maia Power User",
  "Dark Mode Purist",
  "Rubber Duck Whisperer",
  "Merge Conflict Magnet",
  "README Skipper",
  "npm install Addict",
  "Localhost Champion",
  "Monday Deployer",
  "Production Debugger",
  "Legacy Code Archaeologist",
  "Off-By-One Specialist",
  "Commit Message Poet",
  "Tab Supremacist",
  "Docker Compose Therapist",
  "10x Dev (Self-Proclaimed)",
  "AI Prompt Jockey",
  "Semicolon Forgetter",
  "CSS Trial-and-Error Main",
  "Works On My Machine Dev",
  "TODO: Fix Later Dev",
  "Infinite Loop Survivor",
  "PR Approved (Didn't Read)",
  "LGTM Speed Runner",
  "404 Brain Not Found",
  "Sudo Make Me A Sandwich",
];
function getDevClass(login: string) {
  let h = 0;
  for (let i = 0; i < login.length; i++) h = ((h << 5) - h + login.charCodeAt(i)) | 0;
  return DEV_CLASSES[((h % DEV_CLASSES.length) + DEV_CLASSES.length) % DEV_CLASSES.length];
}

interface UniverseStats {
  total_companies: number;
  total_contributions: number;
}

// Milestones that trigger 24h celebration effects
const CELEBRATION_MILESTONES = [10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];

// ─── Loading phases for search feedback ─────────────────────
const LOADING_PHASES = [
  { delay: 0, text: "Scanning the quadrant..." },
  { delay: 2000, text: "Mapping planetary metrics..." },
  { delay: 5000, text: "Establishing stable orbit..." },
  { delay: 9000, text: "Almost there..." },
  { delay: 13000, text: "Massive planet detected. Calibrating..." },
];

// Errors that won't change if you retry the same username
const PERMANENT_ERROR_CODES = new Set(["not-found", "org", "no-activity"]);

const ERROR_MESSAGES: Record<string, { primary: (u: string) => string; secondary: string; hasRetry?: boolean; hasLink?: boolean }> = {
  "not-found": {
    primary: (u) => `A empresa "@${u}" não existe`,
    secondary: "Verifique a ortografia. A busca não diferencia maiúsculas e minúsculas.",
  },
  "org": {
    primary: (u) => `"@${u}" é uma organização, não uma empresa`,
    secondary: "Maia Universe é focado em perfis empresariais.",
  },
  "no-activity": {
    primary: (u) => `A empresa "@${u}" não possui atividade pública ainda`,
    secondary: "Verifique se a atividade está pública no GitHub e tente novamente.",
    hasLink: true,
  },
  "rate-limit": {
    primary: () => "Limite de busca atingido",
    secondary: "Você pode buscar 10 empresas novas por hora. O limite não se aplica a empresas já no Universo.",
  },
  "api-rate-limit": {
    primary: () => "A API externa está temporariamente indisponível",
    secondary: "Muitas requisições. Tente novamente em alguns minutos.",
  },
  "timeout": {
    primary: (u) => `O carregamento da empresa "@${u}" demorou muito`,
    secondary: "A API externa demorou a responder. Tente novamente em alguns instantes.",
    hasRetry: true,
  },
  "network": {
    primary: () => "Não foi possível conectar ao servidor",
    secondary: "Verifique sua conexão com a internet e tente novamente.",
    hasRetry: true,
  },
  "generic": {
    primary: () => "Algo deu errado",
    secondary: "Ocorreu um erro inesperado. Tente novamente.",
    hasRetry: true,
  },
};

function SearchFeedback({
  feedback,
  accentColor,
  onDismiss,
  onRetry,
}: {
  feedback: { type: "loading" | "error"; code?: string; username?: string; raw?: string } | null;
  accentColor: string;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Phased loading messages
  useEffect(() => {
    if (feedback?.type !== "loading") {
      const timerId = setTimeout(() => setPhaseIndex(0), 0);
      return () => clearTimeout(timerId);
    }
    const timers = LOADING_PHASES.map((phase, i) =>
      setTimeout(() => setPhaseIndex(i), phase.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [feedback?.type]);

  // Auto-dismiss errors after 8s (except persistent ones)
  useEffect(() => {
    if (feedback?.type !== "error") return;
    const code = feedback.code ?? "generic";
    if (code === "no-activity" || code === "network" || code === "generic" || code === "timeout") return;
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [feedback, onDismiss]);

  if (!feedback) return null;

  // Loading state
  if (feedback.type === "loading") {
    return (
      <div className="flex items-center gap-2 py-1 animate-[fade-in_0.15s_ease-out]">
        <span className="blink-dot h-2 w-2 shrink-0" style={{ backgroundColor: accentColor }} />
        <span className="text-[11px] text-muted normal-case">{LOADING_PHASES[phaseIndex].text}</span>
      </div>
    );
  }

  // Error state
  const code = feedback.code ?? "generic";
  const msg = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.generic;
  const u = feedback.username ?? "";

  return (
    <div
      className="relative w-full max-w-md border-[3px] bg-bg-raised/90 px-4 py-3 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]"
      style={{ borderColor: code === "rate-limit" ? accentColor + "66" : "rgba(248, 81, 73, 0.4)" }}
    >
      <button onClick={onDismiss} className="absolute top-2 right-2 text-[10px] text-muted transition-colors hover:text-cream">&#10005;</button>
      <p className="text-[11px] text-cream normal-case pr-4">{msg.primary(u)}</p>
      <p className="mt-1 text-[10px] text-muted normal-case">{msg.secondary}</p>
      {msg.hasLink && (
        <a
          href="https://github.com/settings/profile"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[10px] normal-case transition-colors hover:text-cream"
          style={{ color: accentColor }}
        >
          Open Profile Settings &rarr;
        </a>
      )}
      {msg.hasRetry && (
        <button
          onClick={onRetry}
          className="btn-press mt-2 border-2 border-border px-3 py-1 text-[10px] text-cream transition-colors hover:border-border-light"
        >
          Retry
        </button>
      )}
    </div>
  );
}

const LEADERBOARD_CATEGORIES = [
  { label: "Contributors", key: "contributions" as const, tab: "contributors" },
  { label: "Stars", key: "total_stars" as const, tab: "stars" },
  { label: "Repos", key: "public_repos" as const, tab: "architects" },
] as const;

function MiniLeaderboard({ planets, accent }: { planets: UniversePlanet[]; accent: string }) {
  const [catIndex, setCatIndex] = useState(0);

  // Auto-rotate every 10s
  useEffect(() => {
    const timer = setInterval(() => {
      setCatIndex((i) => (i + 1) % LEADERBOARD_CATEGORIES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const cat = LEADERBOARD_CATEGORIES[catIndex];
  const sorted = planets
    .slice()
    .sort((a, b) => (b[cat.key] as number) - (a[cat.key] as number))
    .slice(0, 5);

  return (
    <div className="hidden w-50 sm:block">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setCatIndex((i) => (i + 1) % LEADERBOARD_CATEGORIES.length)}
          className="text-[10px] text-muted transition-colors hover:text-cream normal-case"
          style={{ color: accent }}
        >
          {cat.label}
        </button>
        <Link
          href={`/leaderboard?tab=${cat.tab}`}
          className="text-[9px] text-muted transition-colors hover:text-cream normal-case"
        >
          View all &rarr;
        </Link>
      </div>
      <div className="border-2 border-border bg-bg-raised/80 backdrop-blur-sm">
        {sorted.map((b, i) => (
          <div
            key={b.login}
            className="flex items-center justify-between px-3 py-1.5 transition-colors hover:bg-bg-card"
          >
            <span className="flex items-center gap-2 overflow-hidden">
              <span
                className="text-[10px]"
                style={{
                  color:
                    i === 0 ? "#ffd700"
                      : i === 1 ? "#c0c0c0"
                        : i === 2 ? "#cd7f32"
                          : accent,
                }}
              >
                #{i + 1}
              </span>
              <span className="truncate text-[10px] text-cream normal-case">
                {b.login}
              </span>
            </span>
            <span className="ml-2 shrink-0 text-[10px] text-muted">
              {(b[cat.key] as number).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Streak Pill (HUD element, inline next to @username) ────
function getStreakTierColor(streak: number) {
  if (streak >= 30) return "#aa44ff";
  if (streak >= 14) return "#ff2222";
  if (streak >= 7) return "#ff8833";
  return "#4488ff";
}


function HomeContent() {
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user");
  const giftedParam = searchParams.get("gifted");

  const [username, setUsername] = useState("");
  const failedUsernamesRef = useRef<Map<string, string>>(new Map()); // username -> error code
  const [planets, setPlanets] = useState<UniversePlanet[]>([]);
  // Keep raw dev records so we can inject new companies and regenerate layout locally
  const rawCompaniesRef = useRef<CompanyRecord[]>([]);
  const [plazas, setPlazas] = useState<SpacePlaza[]>([]);
  const [decorations, setDecorations] = useState<SpaceDecoration[]>([]);
  const [river, setRiver] = useState<SpaceRiver | null>(null);
  const [bridges, setBridges] = useState<SpaceBridge[]>([]);
  const [galaxyZones, setGalaxyZones] = useState<GalaxyZone[]>([]);
  const [loading, setLoading] = useState(false);
  // Loading state machine — skip on return visits that still have cached data
  const [loadStage, setLoadStage] = useState<LoadingStage>("init");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "loading" | "error";
    code?: "not-found" | "org" | "no-activity" | "rate-limit" | "api-rate-limit" | "timeout" | "network" | "generic";
    username?: string;
    raw?: string;
  } | null>(null);
  const [flyMode, setFlyMode] = useState(false);
  const [flyVehicle, setFlyVehicle] = useState<string>("spaceship");
  const [introMode, setIntroMode] = useState(false);
  const [introPhase, setIntroPhase] = useState(-1); // -1 = not started, 0-3 = text phases, 4 = done
  const [exploreMode, setExploreMode] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("Universe_theme");
    if (saved !== null) {
      const n = parseInt(saved, 10);
      if (n >= 0 && n <= 3) setThemeIndex(n);
    }
  }, []);


  const [hud, setHud] = useState({ speed: 0, altitude: 0 });
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [constellationAnnouncement, setConstellationAnnouncement] = useState<{ name: string; color: string; population: number } | null>(null);
  const lastConstellationRef = useRef<string | null>(null);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const announceCooldownRef = useRef(0);
  const [flyPaused, setFlyPaused] = useState(false);
  const [flyPauseSignal, setFlyPauseSignal] = useState(0);
  const [flyScore, setFlyScore] = useState({ score: 0, earned: 0, combo: 0, collected: 0, maxCombo: 1 });
  const [flyPersonalBest, setFlyPersonalBest] = useState(0);
  const flyStartTime = useRef(0);
  const flyPausedAt = useRef(0);
  const flyTotalPauseMs = useRef(0);
  const [flyElapsedSec, setFlyElapsedSec] = useState(0);
  const [stats, setStats] = useState<UniverseStats>({ total_companies: 0, total_contributions: 0 });
  const [milestoneCelebrations, setMilestoneCelebrations] = useState<{ milestone: number; reached_at: string }[]>([]);
  const [focusedPlanet, setfocusedPlanet] = useState<string | null>(null);
  const [shareData, setShareData] = useState<{
    login: string;
    contributions: number;
    rank: number | null;
    avatar_url: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);
  const [vsCodeKey, setVsCodeKey] = useState<string | null>(null);
  const [vsCodeKeyLoading, setVsCodeKeyLoading] = useState(false);
  const [vsCodeKeyCopied, setVsCodeKeyCopied] = useState(false);
  const [codingPanelOpen, setCodingPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [codingInfoOpen, setCodingInfoOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [purchasedItem, setPurchasedItem] = useState<string | null>(null);
  const [selectedPlanet, setselectedPlanet] = useState<UniversePlanet | null>(null);
  const [giftClaimed, setGiftClaimed] = useState(false);
  const [claimingGift, setClaimingGift] = useState(false);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [feedPanelOpen, setFeedPanelOpen] = useState(false);
  const [kudosSending, setKudosSending] = useState(false);
  const [kudosSent, setKudosSent] = useState(false);
  const [kudosError, setKudosError] = useState<string | null>(null);
  const visitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [comparePlanet, setcomparePlanet] = useState<UniversePlanet | null>(null);
  const [comparePair, setComparePair] = useState<[UniversePlanet, UniversePlanet] | null>(null);
  const [compareSelfHint, setCompareSelfHint] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftItems, setGiftItems] = useState<{ id: string; price_usd_cents: number; owned: boolean }[] | null>(null);
  const [giftBuying, setGiftBuying] = useState<string | null>(null);
  const [compareCopied, setCompareCopied] = useState(false);
  const [compareLang, setCompareLang] = useState<"en" | "pt">("en");
  const [clickedAd, setClickedAd] = useState<import("@/lib/skyAds").SkyAd | null>(null);
  const [skyAds, setSkyAds] = useState<import("@/lib/skyAds").SkyAd[]>(DEFAULT_SKY_ADS);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [pillModalOpen, setPillModalOpen] = useState(false);
  const [founderMessageOpen, setFounderMessageOpen] = useState(false);
  const [constellationChooserOpen, setConstellationChooserOpen] = useState(false);
  const [rabbitCinematic, setRabbitCinematic] = useState(false);
  const [rabbitCinematicPhase, setRabbitCinematicPhase] = useState(-1);
  const [rabbitProgress, setRabbitProgress] = useState(0);
  useEffect(() => {
    const saved = parseInt(localStorage.getItem("Universe_rabbit_progress") ?? "0", 10) || 0;
    if (saved > 0) setRabbitProgress(saved);
  }, []);
  const [rabbitSighting, setRabbitSighting] = useState<number | null>(null);
  const [rabbitCompletion, setRabbitCompletion] = useState(false);
  const [rabbitHintFlash, setRabbitHintFlash] = useState<string | null>(null);
  const [searchBarOpen, setSearchBarOpen] = useState(false);

  // Growth optimization (A1: sign-in prompt, A5: ad direct open)
  const planetClickCountRef = useRef(0);
  const signInPromptShownRef = useRef(false);
  const [signInPromptVisible, setSignInPromptVisible] = useState(false);
  const [adToast, setAdToast] = useState<string | null>(null);

  // Welcome CTA (shown after intro for non-logged-in users)
  const [welcomeCtaVisible, setWelcomeCtaVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // XP level-up toast
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  // Fly onboarding
  const [showDailyNudge, setShowDailyNudge] = useState(false);
  const [showFlyHint, setShowFlyHint] = useState(false);
  const [showFlyControls, setShowFlyControls] = useState(false);
  const [showFlyResults, setShowFlyResults] = useState<{
    score: number; collected: number; maxCombo: number; timeBonus: number;
    isNewPB: boolean; rank: number; totalPilots: number;
  } | null>(null);
  const dailyNudgeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flyHintTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flyResultsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // A8: Ghost preview for own planet
  const ghostPreviewShownRef = useRef(false);
  const [ghostPreviewLogin, setGhostPreviewLogin] = useState<string | null>(null);

  // Raid system
  const [raidState, raidActions] = useRaidSequence();
  const prevRaidPhaseRef = useRef<string>("idle");
  const lastSuccessfulRaidRef = useRef<{ defenderLogin: string; attackerLogin: string; tagStyle: string } | null>(null);

  // Fetch Estrela Maia count
  useEffect(() => {
    fetch("https://api.github.com/repos/leonardomaia253/grupomaiauniverse")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.stargazers_count != null) setStarCount(d.stargazers_count); })
      .catch(() => { });
  }, []);

  // Track successful raid data before state resets
  useEffect(() => {
    if (raidState.raidData?.success && raidState.defenderPlanet) {
      lastSuccessfulRaidRef.current = {
        defenderLogin: raidState.defenderPlanet.login,
        attackerLogin: raidState.raidData.attacker.login,
        tagStyle: raidState.raidData.tag_style,
      };
    }
  }, [raidState.raidData, raidState.defenderPlanet]);

  // Update planet with raid tag when raid exits
  useEffect(() => {
    const prev = prevRaidPhaseRef.current;
    prevRaidPhaseRef.current = raidState.phase;

    if (raidState.phase === "idle" && prev !== "idle" && prev !== "preview" && lastSuccessfulRaidRef.current) {
      const { defenderLogin, attackerLogin, tagStyle } = lastSuccessfulRaidRef.current;
      lastSuccessfulRaidRef.current = null;
      setPlanets((prev) =>
        prev.map((b) =>
          b.login === defenderLogin
            ? {
              ...b,
              active_raid_tag: {
                attacker_login: attackerLogin,
                tag_style: tagStyle,
                expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
              },
            }
            : b
        )
      );
    }
  }, [raidState.phase]);

  // Fetch ads from DB (fallback to DEFAULT_SKY_ADS on error)
  useEffect(() => {
    fetch("/api/sky-ads")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (Array.isArray(data) && data.length > 0) setSkyAds(data); })
      .catch(() => { });
  }, []);

  // Derived — second focused planet for dual-focus camera
  const focusedPlanetB = comparePair ? comparePair[1].login : null;

  const [isMobile, setIsMobile] = useState(false);

  const theme = THEMES[themeIndex];
  const didInit = useRef(false);
  const savedFocusRef = useRef<string | null>(null);

  // Broadcast mode/theme to global LofiRadio (lives in layout)
  useEffect(() => {
    const detail = {
      flyMode,
      raidMode: raidState.phase !== "idle" && raidState.phase !== "preview",
      accent: theme.accent,
      shadow: theme.shadow,
    };
    // Store for late-mounting components (e.g. portal)
    (window as unknown as Record<string, unknown>).__gcRadioMode = detail;
    window.dispatchEvent(new CustomEvent("gc:radio-mode", { detail }));
  }, [flyMode, raidState.phase, theme.accent, theme.shadow]);

  // Detect mobile/touch device
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auth state listener
  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getSession().then(({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s);
      if (s) {
        const login = (s.user?.user_metadata?.user_name ?? s.user?.user_metadata?.preferred_username ?? "").toLowerCase();
        if (login) identifyUser({ username: login, email: s.user?.email ?? undefined });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, s: Session | null) => {
      setSession(s);
      if (s && event !== "TOKEN_REFRESHED") {
        const login = (s.user?.user_metadata?.user_name ?? s.user?.user_metadata?.preferred_username ?? "").toLowerCase();
        if (login) identifyUser({ username: login, email: s.user?.email ?? undefined });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const authLogin = (
    session?.user?.user_metadata?.user_name ??
    session?.user?.user_metadata?.preferred_username ??
    ""
  ).toLowerCase();

  // Fetch existing VS Code API key
  useEffect(() => {
    if (!session) return;
    fetch("/api/vscode-key")
      .then(r => r.json())
      .then(d => { if (d.key) setVsCodeKey(d.key); })
      .catch(() => { });
  }, [session]);

  // Fly timer — ticks every second while flying and not paused
  useEffect(() => {
    if (!flyMode || flyPaused) return;
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = now - flyStartTime.current - flyTotalPauseMs.current;
      setFlyElapsedSec(Math.floor(elapsed / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [flyMode, flyPaused]);

  // Dismiss fly onboarding overlays when entering fly mode
  useEffect(() => {
    if (flyMode) {
      setShowDailyNudge(false); setShowFlyHint(false); setShowFlyResults(null);
      clearTimeout(dailyNudgeTimerRef.current); clearTimeout(flyHintTimerRef.current); clearTimeout(flyResultsTimerRef.current);
    }
  }, [flyMode]);

  // Fetch fly vehicle from raid loadout (on login)
  const sessionUserId = session?.user?.id;
  useEffect(() => {
    if (!sessionUserId) return;
    fetch("/api/raid/loadout")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.vehicle) setFlyVehicle(data.vehicle); })
      .catch(() => { });
  }, [sessionUserId]);

  // Load theme from DB when logged in (overrides localStorage)
  const themeLoadedFromDb = useRef(false);
  useEffect(() => {
    if (!sessionUserId || themeLoadedFromDb.current) return;
    themeLoadedFromDb.current = true;
    fetch("/api/preferences/theme")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && typeof data.Universe_theme === "number" && data.Universe_theme >= 0 && data.Universe_theme <= 3) {
          setThemeIndex(data.Universe_theme);
          localStorage.setItem("Universe_theme", String(data.Universe_theme));
        }
      })
      .catch(() => { });
  }, [sessionUserId]);

  // Cycle theme: save to localStorage + sync to DB if logged in
  const cycleTheme = useCallback(() => {
    setThemeIndex((i) => {
      const next = (i + 1) % THEMES.length;
      localStorage.setItem("Universe_theme", String(next));
      if (sessionUserId) {
        fetch("/api/preferences/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Universe_theme: next }),
        }).catch(() => { });
      }
      return next;
    });
  }, [sessionUserId]);

  // Save ?ref= to localStorage (7-day expiry)
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      trackReferralLinkLanded(ref);
      try {
        localStorage.setItem("gc_ref", JSON.stringify({ login: ref, expires: Date.now() + 7 * 86400000 }));
      } catch { /* ignore */ }
    }
  }, [searchParams]);

  // Forward ref from localStorage to auth callback URL
  const handleSignInWithRef = useCallback(async (providerInput?: string) => {
    trackSignInClicked("Universe");
    const supabase = createBrowserSupabase();
    let redirectTo = `${window.location.origin}/auth/callback`;
    try {
      const raw = localStorage.getItem("gc_ref");
      if (raw) {
        const { login, expires } = JSON.parse(raw);
        if (Date.now() < expires && login) {
          redirectTo += `?ref=${encodeURIComponent(login)}`;
        }
      }
    } catch { /* ignore */ }
    await supabase.auth.signInWithOAuth({
      provider: (providerInput || "github") as any,
      options: { redirectTo },
    });
  }, []);

  // Fetch activity feed on mount + poll every 60s
  useEffect(() => {
    let cancelled = false;
    const fetchFeed = async () => {
      try {
        const res = await fetch("/api/feed?limit=50&today=1");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setFeedEvents(data.events ?? []);
      } catch { /* ignore */ }
    };
    fetchFeed();
    const interval = setInterval(fetchFeed, 120000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Visit tracking: fire visit POST after 3s of profile card open
  useEffect(() => {
    if (selectedPlanet && session && selectedPlanet.login.toLowerCase() !== authLogin) {
      visitTimerRef.current = setTimeout(async () => {
        try {
          const planet = planets.find(b => b.login === selectedPlanet.login);
          if (!planet) return;
          await fetch("/api/interactions/visit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planet_login: selectedPlanet.login }),
          });
          trackMissionRef.current("visit_planet");
          trackMissionRef.current("visit_3_planets");
        } catch { /* ignore */ }
      }, 3000);
    }
    return () => {
      if (visitTimerRef.current) clearTimeout(visitTimerRef.current);
    };
  }, [selectedPlanet, session, authLogin, planets]);

  // Kudos handler
  const handleGiveKudos = useCallback(async () => {
    if (!selectedPlanet || kudosSending || kudosSent || !session) return;
    if (selectedPlanet.login.toLowerCase() === authLogin) return;
    setKudosSending(true);
    setKudosError(null);
    try {
      const res = await fetch("/api/interactions/kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_login: selectedPlanet.login }),
      });
      if (res.ok) {
        trackKudosSent(selectedPlanet.login);
        trackMissionRef.current("give_kudos");
        trackMissionRef.current("give_kudos_3");
        setKudosSent(true);
        // Increment kudos_count locally
        const newCount = (selectedPlanet.kudos_count ?? 0) + 1;
        setselectedPlanet({ ...selectedPlanet, kudos_count: newCount });
        setPlanets((prev) =>
          prev.map((b) =>
            b.login === selectedPlanet.login ? { ...b, kudos_count: newCount } : b
          )
        );
        setTimeout(() => setKudosSent(false), 3000);
      } else {
        const body = await res.json().catch(() => null);
        const msg = body?.error || "Could not send kudos";
        setKudosError(msg);
        setTimeout(() => setKudosError(null), 3000);
      }
    } catch { /* ignore */ }
    finally { setKudosSending(false); }
  }, [selectedPlanet, kudosSending, kudosSent, session, authLogin]);

  // Gift: open modal with available items
  const handleOpenGift = useCallback(async () => {
    if (!selectedPlanet || !session) return;
    setGiftModalOpen(true);
    setGiftItems(null);
    try {
      const res = await fetch("/api/items");
      if (!res.ok) return;
      const { items } = await res.json();
      const receiverOwned = new Set(selectedPlanet.owned_items ?? []);
      const NON_GIFTABLE = new Set(["flag", "custom_color"]);
      const available = (items as { id: string; price_usd_cents: number; category: string }[])
        .filter((i) => i.price_usd_cents > 0 && !NON_GIFTABLE.has(i.id))
        .map((i) => ({ ...i, owned: receiverOwned.has(i.id) }));
      setGiftItems(available);
    } catch { /* ignore */ }
  }, [selectedPlanet, session]);

  // Gift: checkout for receiver
  const handleGiftCheckout = useCallback(async (itemId: string) => {
    if (!selectedPlanet || giftBuying) return;
    setGiftBuying(itemId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          provider: "stripe",
          gifted_to_login: selectedPlanet.login,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } catch { /* ignore */ }
    finally { setGiftBuying(null); }
  }, [selectedPlanet, giftBuying]);


  const lastDistRef = useRef(999);

  const endRabbitCinematic = useCallback(() => {
    setRabbitCinematic(false);
    setRabbitCinematicPhase(-1);
  }, []);

  // ESC: layered dismissal
  // During fly mode: only close overlays (profile card) — AirplaneFlight handles pause/exit
  // Outside fly mode: compare → share modal → profile card → focus → explore mode
  useEffect(() => {
    if (flyMode && !selectedPlanet && !pillModalOpen && !founderMessageOpen) return;
    if (!flyMode && !exploreMode && !focusedPlanet && !shareData && !selectedPlanet && !giftClaimed && !giftModalOpen && !comparePair && !comparePlanet && !founderMessageOpen && !pillModalOpen && !rabbitCinematic && !invitePreview && raidState.phase === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        // Founder modals take highest priority
        if (founderMessageOpen) { setFounderMessageOpen(false); return; }
        if (pillModalOpen) { setPillModalOpen(false); return; }
        // Rabbit cinematic
        if (rabbitCinematic) { endRabbitCinematic(); return; }
        // Raid takes priority
        if (raidState.phase !== "idle") {
          if (raidState.phase === "preview") {
            raidActions.exitRaid();
          } else if (raidState.phase === "flight" || raidState.phase === "attack") {
            raidActions.skipToShare();
          } else if (raidState.phase === "share") {
            raidActions.exitRaid();
          } else {
            raidActions.exitRaid();
          }
          return;
        }
        if (flyMode && selectedPlanet) {
          setselectedPlanet(null);
          setfocusedPlanet(null);
        } else if (!flyMode) {
          // Compare states take priority after fly mode
          if (comparePair) {
            // Return to planet A's profile card
            setselectedPlanet(comparePair[0]);
            setfocusedPlanet(comparePair[0].login);
            setComparePair(null);
            setcomparePlanet(null);
          } else if (comparePlanet) {
            // Cancel pick, restore profile card of first planet
            setselectedPlanet(comparePlanet);
            setfocusedPlanet(comparePlanet.login);
            setcomparePlanet(null);
          } else if (giftModalOpen) { setGiftModalOpen(false); setGiftItems(null); }
          else if (giftClaimed) setGiftClaimed(false);
          else if (invitePreview) { setInvitePreview(null); }
          else if (shareData) { setShareData(null); setselectedPlanet(null); setfocusedPlanet(null); }
          else if (selectedPlanet) { setselectedPlanet(null); setfocusedPlanet(null); }
          else if (focusedPlanet) setfocusedPlanet(null);
          else if (exploreMode) { setExploreMode(false); setfocusedPlanet(savedFocusRef.current); savedFocusRef.current = null; }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flyMode, exploreMode, focusedPlanet, shareData, selectedPlanet, giftClaimed, giftModalOpen, comparePair, comparePlanet, founderMessageOpen, pillModalOpen, rabbitCinematic, endRabbitCinematic, raidState.phase, raidActions, invitePreview]);

  // Rabbit cinematic text phase timing (8s total flyover)
  useEffect(() => {
    if (!rabbitCinematic) {
      setRabbitCinematicPhase(-1);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Phase 0: "Follow the white rabbit..." at 0.5s
    timers.push(setTimeout(() => setRabbitCinematicPhase(0), 500));
    // Phase 1: "It hides among the plazas..." at 4.0s
    timers.push(setTimeout(() => setRabbitCinematicPhase(1), 4000));
    return () => timers.forEach(clearTimeout);
  }, [rabbitCinematic]);

  // Fetch rabbit progress on login — sync local progress to server
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch("/api/rabbit?check=true");
        if (!res.ok) return;
        const data = await res.json();
        const serverProgress = data?.progress ?? 0;
        const localProgress = parseInt(localStorage.getItem("Universe_rabbit_progress") ?? "0", 10) || 0;

        // Sync local progress to server if ahead (silently fails if no claimed planet)
        if (localProgress > serverProgress) {
          for (let s = serverProgress + 1; s <= localProgress; s++) {
            const sr = await fetch("/api/rabbit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sighting: s }),
            });
            if (!sr.ok) break; // stop sync if server rejects (e.g. no claimed planet)
          }
        }

        const best = Math.max(serverProgress, localProgress);
        setRabbitProgress(best);
        localStorage.setItem("Universe_rabbit_progress", String(best));
        if (best > 0 && best < 5) {
          setRabbitSighting(best + 1);
        }
        if (best >= 5 && serverProgress < 5 && localProgress >= 5) {
          setRabbitCompletion(true);
        }
      } catch { }
    })();
  }, [session]);

  // Auto-dismiss rabbit hint flash
  useEffect(() => {
    if (!rabbitHintFlash) return;
    const t = setTimeout(() => setRabbitHintFlash(null), 3000);
    return () => clearTimeout(t);
  }, [rabbitHintFlash]);

  // Handle rabbit caught
  const onRabbitCaught = useCallback(async () => {
    if (!rabbitSighting) return;
    const sighting = rabbitSighting;
    setRabbitSighting(null);

    // Try to save to API (works when logged in + has claimed planet)
    const login = (session?.user?.user_metadata?.user_name ?? "").toLowerCase();
    const claimed = login && planets.some((b) => b.login.toLowerCase() === login && b.claimed);
    if (session && claimed) {
      try {
        const res = await fetch("/api/rabbit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sighting }),
        });
        const data = await res.json();
        if (res.ok) {
          setRabbitProgress(data.progress);
          localStorage.setItem("Universe_rabbit_progress", String(data.progress));

          if (data.completed) {
            setRabbitCompletion(true);
            return;
          }
          setRabbitHintFlash("The rabbit moves deeper...");
          setTimeout(() => setRabbitSighting(data.progress + 1), 2000);
          return;
        }
      } catch {
        // Fall through to local tracking
      }
    }

    // Local tracking (not logged in or API failed)
    const newProgress = sighting;
    setRabbitProgress(newProgress);
    localStorage.setItem("Universe_rabbit_progress", String(newProgress));

    if (sighting >= 5) {
      // Final sighting: rabbit is free
      setRabbitHintFlash("The rabbit is free, and so is the Universe.");
      setRabbitCompletion(true);
      return;
    }

    // Sightings 1-4: advance locally
    setRabbitHintFlash("The rabbit moves deeper...");
    setTimeout(() => setRabbitSighting(newProgress + 1), 2000);
  }, [rabbitSighting, session, planets, handleSignInWithRef]);

  const reloadUniverse = useCallback(async (bustCache = false) => {
    if (bustCache) clearUniverseCache();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allcompanies: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let UniverseStats: any = null;

    // Skip snapshot when busting cache — go straight to DB for fresh data
    if (!bustCache) {
      try {
        const v = Math.floor(Date.now() / 300_000);
        const snapshotUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Universe-data/snapshot.json?v=${v}`;
        const snapshotRes = await fetch(snapshotUrl);
        if (snapshotRes.ok) {
          const buf = await snapshotRes.arrayBuffer();
          const ds = new DecompressionStream("gzip");
          const stream = new Blob([buf]).stream().pipeThrough(ds);
          const snapshot = await new Response(stream).json();
          allcompanies = snapshot.companies;
          UniverseStats = snapshot.stats;
        }
      } catch { /* fall through to chunked */ }
    }

    // Fetch from API (primary when busting cache, fallback otherwise)
    if (allcompanies.length === 0) {
      const cbParam = bustCache ? `&_t=${Date.now()}` : "";
      const CHUNK = 1000;
      const res = await fetch(`/api/Universe?from=0&to=${CHUNK}${cbParam}`);
      if (!res.ok) return null;
      const data = await res.json();
      allcompanies = data.companies ?? [];
      UniverseStats = data.stats;

      const total = UniverseStats?.total_companies ?? 0;
      if (total > CHUNK && allcompanies.length > 0) {
        const promises: Promise<{ companies: typeof data.companies } | null>[] = [];
        for (let from = CHUNK; from < total; from += CHUNK) {
          promises.push(
            fetch(`/api/Universe?from=${from}&to=${from + CHUNK}${cbParam}`)
              .then(r => r.ok ? r.json() : null)
          );
        }
        const results = await Promise.all(promises);
        for (const chunk of results) {
          if (chunk?.companies?.length) {
            allcompanies = [...allcompanies, ...chunk.companies];
          }
        }
      }
    }

    if (allcompanies.length === 0) return null;

    // Apply loadout override from localStorage (saved in shop, TTL 10 min)
    try {
      const raw = localStorage.getItem("Universe:loadout_override");
      if (raw) {
        const { companyId, loadout, ts } = JSON.parse(raw);
        if (Date.now() - ts < 10 * 60 * 1000) {
          const idx = allcompanies.findIndex((d) => d.id === companyId);
          if (idx !== -1) {
            allcompanies[idx] = { ...allcompanies[idx], loadout };
          }
        } else {
          localStorage.removeItem("Universe:loadout_override");
        }
      }
    } catch { }

    rawCompaniesRef.current = allcompanies;
    setStats(UniverseStats);
    const layout = generateUniverseLayout(allcompanies);
    setPlanets(layout.planets);
    setPlazas(layout.plazas);
    setDecorations(layout.decorations);
    setRiver(layout.river);
    setBridges(layout.bridges);
    setGalaxyZones(layout.GalaxyZones);
    setUniverseCache({ ...layout, stats: UniverseStats, rawcompanies: rawCompaniesRef.current });
    return layout.planets;
  }, []);

  // Handle loading fade complete: transition to "done" and trigger intro
  const handleLoadFadeComplete = useCallback(() => {
    setLoadStage("done");
    const hasDeepLink = searchParams.get("user") || searchParams.get("compare");
    if (!localStorage.getItem("Universe_intro_seen") && !hasDeepLink) {
      setIntroMode(true);
    }
  }, [searchParams]);

  // Retry handler for loading errors
  const handleLoadRetry = useCallback(() => {
    setLoadStage("init");
    setLoadProgress(0);
    setLoadError(null);
    didInit.current = false;
  }, []);

  // Load Universe from Supabase on mount
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // Return visit: restore from cache or fetch silently
    const cached = getUniverseCache();
    if (cached) {
      rawCompaniesRef.current = cached.rawcompanies ?? [];
      setPlanets(cached.planets);
      setPlazas(cached.plazas);
      setDecorations(cached.decorations);
      setRiver(cached.river);
      setBridges(cached.bridges);
      setGalaxyZones(cached.GalaxyZones);
      setStats(cached.stats);
      setLoadStage("done");
      return;
    }

    const loadStartTime = performance.now();

    async function loadUniverse() {
      try {
        setLoadStage("init");
        setLoadProgress(3);
        await new Promise((r) => setTimeout(r, 0));

        // Fetch Universe data
        setLoadStage("fetching");
        setLoadProgress(10);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let allcompanies: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let UniverseStats: any = null;

        // Try pre-computed snapshot first (single file from Supabase CDN)
        try {
          const v = Math.floor(Date.now() / 300_000); // changes every 5 min, aligned with cron
          const snapshotUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Universe-data/snapshot.json?v=${v}`;
          const snapshotRes = await fetch(snapshotUrl);
          if (snapshotRes.ok) {
            const buf = await snapshotRes.arrayBuffer();
            const ds = new DecompressionStream("gzip");
            const stream = new Blob([buf]).stream().pipeThrough(ds);
            const snapshot = await new Response(stream).json();
            allcompanies = snapshot.companies;
            UniverseStats = snapshot.stats;
          }
        } catch { /* fall through to chunked */ }

        // Fallback to chunked API
        if (allcompanies.length === 0) {
          const CHUNK = 1000;
          const res = await fetch(`/api/city?from=0&to=${CHUNK}`);
          if (!res.ok) throw new Error("Failed to fetch Universe data");
          const data = await res.json();
          allcompanies = data.companies ?? [];
          UniverseStats = data.stats;

          const total = UniverseStats?.total_companies ?? 0;
          if (total > CHUNK && allcompanies.length > 0) {
            const promises: Promise<{ companies: typeof data.companies } | null>[] = [];
            for (let from = CHUNK; from < total; from += CHUNK) {
              promises.push(
                fetch(`/api/city?from=${from}&to=${from + CHUNK}`)
                  .then((r) => (r.ok ? r.json() : null))
              );
            }
            const results = await Promise.all(promises);
            for (const chunk of results) {
              if (chunk?.companies?.length) {
                allcompanies = [...allcompanies, ...chunk.companies];
              }
            }
          }
        }

        setLoadProgress(30);

        if (!allcompanies || allcompanies.length === 0) {
          setLoadProgress(100);
          setLoadStage("ready");
          return;
        }

        // Apply loadout override from localStorage (saved in shop, TTL 10 min)
        try {
          const raw = localStorage.getItem("Universe:loadout_override");
          if (raw) {
            const { companyId, loadout, ts } = JSON.parse(raw);
            if (Date.now() - ts < 10 * 60 * 1000) {
              const idx = allcompanies.findIndex((d) => d.id === companyId);
              if (idx !== -1) {
                allcompanies[idx] = { ...allcompanies[idx], loadout };
              }
            } else {
              localStorage.removeItem("Universe:loadout_override");
            }
          }
        } catch { }

        // Generate layout
        setLoadStage("generating");
        setLoadProgress(45);
        await new Promise((r) => setTimeout(r, 0)); // yield to browser

        rawCompaniesRef.current = allcompanies;
        setStats(UniverseStats);
        const finalLayout = generateUniverseLayout(allcompanies);
        setPlanets(finalLayout.planets);
        setPlazas(finalLayout.plazas);
        setDecorations(finalLayout.decorations);
        setRiver(finalLayout.river);
        setBridges(finalLayout.bridges);
        setGalaxyZones(finalLayout.GalaxyZones);

        setLoadProgress(55);

        // Rendering: wait for Canvas to process data (2 rAF + fallback)
        setLoadStage("rendering");
        setLoadProgress(65);

        await new Promise<void>((resolve) => {
          let resolved = false;
          const done = () => {
            if (resolved) return;
            resolved = true;
            resolve();
          };
          requestAnimationFrame(() => {
            requestAnimationFrame(() => done());
          });
          setTimeout(done, 500);
        });

        setLoadProgress(80);

        // Save to cache for return visits
        setUniverseCache({ ...finalLayout, stats: UniverseStats, rawcompanies: rawCompaniesRef.current });
        setLoadProgress(95);

        // Enforce minimum 800ms display time to avoid flash
        const elapsed = performance.now() - loadStartTime;
        if (elapsed < 800) {
          await new Promise((r) => setTimeout(r, 800 - elapsed));
        }

        setLoadProgress(100);
        setLoadStage("ready");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Something went wrong");
        setLoadStage("error");
      }
    }

    loadUniverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStage]);

  // Universe reload on tab return removed — navigating back from shop already
  // re-mounts the component and loads fresh data via the mount effect above.

  // ─── Intro text phase timing (14s total) ─────────────────────
  const INTRO_TEXT_SCHEDULE = [0, 2000, 4500, 7000, 10000]; // Phase 0 (Welcome), 1 (The Universe), 2 (Collect PX), 3 (Welcome to Maia), 4 (Done)
  const INTRO_TEXTS = [
    "Bem-vindo ao",
    "O Universo das empresas",
    "Navegue, Colete PX, Evolua",
    "Bem-vindo ao Maia Universe",
    ""
  ];
  const [introConfetti, setIntroConfetti] = useState(false);

  useEffect(() => {
    if (!introMode) {
      setIntroPhase(-1);
      setIntroConfetti(false);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < INTRO_TEXT_SCHEDULE.length; i++) {
      timers.push(setTimeout(() => setIntroPhase(i), INTRO_TEXT_SCHEDULE[i]));
    }
    // Confetti shortly after "Welcome to Maia Universe"
    timers.push(setTimeout(() => setIntroConfetti(true), INTRO_TEXT_SCHEDULE[3] + 500));

    return () => timers.forEach(clearTimeout);
  }, [introMode]);


  const endIntro = useCallback(() => {
    setIntroMode(false);
    setIntroPhase(-1);
    setIntroConfetti(false);
    localStorage.setItem("universe_intro_seen", "true");
    // Show welcome CTA for non-logged-in users who haven't seen it
    if (!session && !localStorage.getItem("universe_welcome_seen")) {
      setWelcomeCtaVisible(true);
      setTimeout(() => setWelcomeCtaVisible(false), 12000);
    }
  }, [session]);

  const replayIntro = useCallback(() => {
    setIntroMode(true);
    setIntroPhase(-1);
    setIntroConfetti(false);
  }, []);

  // Focus on planet from ?user= query param (skip if gift redirect, handled separately)
  const didFocusUserParam = useRef(false);
  const fetchingUserParam = useRef(false);
  useEffect(() => {
    if (!userParam || giftedParam || planets.length === 0) return;

    const found = planets.find(
      (b) => b.login.toLowerCase() === userParam.toLowerCase()
    );

    // Dev not in Universe yet — fetch to create, then inject into layout
    if (!found) {
      if (fetchingUserParam.current) return;
      fetchingUserParam.current = true;
      (async () => {
        try {
          const res = await fetch(`/api/dev/${encodeURIComponent(userParam)}`);
          if (!res.ok) return;
          const devData = await res.json();

          // Dev doesn't exist in DB yet (auth callback may have failed) — skip injection
          if (devData.exists === false) return;

          // Dedup: another effect may have already injected this dev
          if (rawCompaniesRef.current.some((d: CompanyRecord) => d.username.toLowerCase() === userParam.toLowerCase())) return;

          const newDev = {
            ...devData,
            owned_items: [],
            achievements: [],
            loadout: null,
            custom_color: null,
            billboard_images: [],
            active_raid_tag: null,
            kudos_count: devData.kudos_count ?? 0,
            visit_count: devData.visit_count ?? 0,
            app_streak: devData.app_streak ?? 0,
            raid_xp: devData.raid_xp ?? 0,
            rabbit_completed: false,
            xp_total: devData.xp_total ?? 0,
            xp_level: devData.xp_level ?? 1,
          };
          rawCompaniesRef.current = [...rawCompaniesRef.current, newDev];
          const layout = generateUniverseLayout(rawCompaniesRef.current);
          setPlanets(layout.planets);
          setPlazas(layout.plazas);
          setDecorations(layout.decorations);
          setRiver(layout.river);
          setBridges(layout.bridges);
          setGalaxyZones(layout.GalaxyZones);
          setUniverseCache({ ...layout, stats: stats ?? { total_companies: 0, total_contributions: 0 }, rawcompanies: rawCompaniesRef.current });
        } finally {
          fetchingUserParam.current = false;
        }
      })();
      return;
    }

    if (!didFocusUserParam.current) {
      // First focus: enter explore mode
      didFocusUserParam.current = true;
      setfocusedPlanet(userParam);
      setselectedPlanet(found);
      setExploreMode(true);
    } else {
      // planets array was replaced (full layout loaded) — keep selectedPlanet in sync
      setselectedPlanet(prev =>
        prev && prev.login.toLowerCase() === userParam.toLowerCase() ? found : prev
      );
    }
  }, [userParam, giftedParam, planets, stats]);

  // ── Ensure logged-in user's planet always appears ──────────
  // Covers: page reload, new tab, cache expiry, auth callback failure
  const ensuringAuthplanet = useRef<string | null>(null);
  useEffect(() => {
    if (!authLogin || planets.length === 0) return;

    // planet already in Universe
    if (planets.some(b => b.login.toLowerCase() === authLogin)) return;

    // ?user= handler is already handling this
    if (userParam && userParam.toLowerCase() === authLogin) return;

    // Already fetching for this login
    if (ensuringAuthplanet.current === authLogin) return;
    ensuringAuthplanet.current = authLogin;

    (async () => {
      try {
        const res = await fetch(`/api/dev/${encodeURIComponent(authLogin)}`);
        if (!res.ok) return;
        const devData = await res.json();
        if (devData.exists === false) return;

        // Dedup: another effect or search may have already injected this dev
        if (rawCompaniesRef.current.some((d: CompanyRecord) => d.username.toLowerCase() === authLogin)) return;

        const newDev = {
          ...devData,
          owned_items: [],
          achievements: [],
          loadout: null,
          custom_color: null,
          billboard_images: [],
          active_raid_tag: null,
          kudos_count: devData.kudos_count ?? 0,
          visit_count: devData.visit_count ?? 0,
          app_streak: devData.app_streak ?? 0,
          raid_xp: devData.raid_xp ?? 0,
          rabbit_completed: false,
          xp_total: devData.xp_total ?? 0,
          xp_level: devData.xp_level ?? 1,
        };
        rawCompaniesRef.current = [...rawCompaniesRef.current, newDev];
        const layout = generateUniverseLayout(rawCompaniesRef.current);
        setPlanets(layout.planets);
        setPlazas(layout.plazas);
        setDecorations(layout.decorations);
        setRiver(layout.river);
        setBridges(layout.bridges);
        setGalaxyZones(layout.GalaxyZones);
        setUniverseCache({ ...layout, stats: stats ?? { total_companies: 0, total_contributions: 0 }, rawcompanies: rawCompaniesRef.current });
      } catch {
        // Allow retry on next dep change (e.g. transient network error)
        ensuringAuthplanet.current = null;
      }
    })();
  }, [authLogin, planets, userParam, stats]);

  // Handle ?compare=userA,userB deep link
  const compareParam = searchParams.get("compare");
  const didHandleCompareParam = useRef(false);
  useEffect(() => {
    if (!compareParam || planets.length === 0 || didHandleCompareParam.current) return;
    const parts = compareParam.split(",").map(s => s.trim().toLowerCase());
    if (parts.length !== 2 || parts[0] === parts[1]) return;

    const bA = planets.find(b => b.login.toLowerCase() === parts[0]);
    const bB = planets.find(b => b.login.toLowerCase() === parts[1]);

    if (bA && bB) {
      didHandleCompareParam.current = true;
      setComparePair([bA, bB]);
      setfocusedPlanet(bA.login);
      setExploreMode(true);
      return;
    }

    // One or both companies not loaded yet — fetch them, reload Universe, then compare
    didHandleCompareParam.current = true;
    (async () => {
      const missing = [!bA ? parts[0] : null, !bB ? parts[1] : null].filter(Boolean);
      await Promise.all(
        missing.map(login => fetch(`/api/dev/${encodeURIComponent(login!)}`))
      );
      const updated = await reloadUniverse(true);
      if (!updated) return;
      const foundA = updated.find((b: UniversePlanet) => b.login.toLowerCase() === parts[0]);
      const foundB = updated.find((b: UniversePlanet) => b.login.toLowerCase() === parts[1]);
      if (foundA && foundB) {
        setComparePair([foundA, foundB]);
        setfocusedPlanet(foundA.login);
        setExploreMode(true);
      }
    })();
  }, [compareParam, planets, reloadUniverse]);

  // Detect post-purchase redirect (?purchased=item_id)
  const purchasedParam = searchParams.get("purchased");
  useEffect(() => {
    if (purchasedParam) {
      setPurchasedItem(purchasedParam);
      // Reload Universe to reflect new purchase
      reloadUniverse();
      // Clear purchased param from URL after a delay
      const timer = setTimeout(() => setPurchasedItem(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [purchasedParam, reloadUniverse]);

  // Detect post-gift redirect (?gifted=item_id&user=login)
  const [giftedInfo, setGiftedInfo] = useState<{ item: string; to: string } | null>(null);
  const didHandleGiftParam = useRef(false);
  useEffect(() => {
    if (giftedParam && userParam && planets.length > 0 && !didHandleGiftParam.current) {
      didHandleGiftParam.current = true;
      setGiftedInfo({ item: giftedParam, to: userParam });
      reloadUniverse();
      // Focus on receiver's planet
      setfocusedPlanet(userParam);
      const found = planets.find(
        (b) => b.login.toLowerCase() === userParam.toLowerCase()
      );
      if (found) {
        setselectedPlanet(found);
        setExploreMode(true);
      }
      const timer = setTimeout(() => setGiftedInfo(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [giftedParam, userParam, planets, reloadUniverse]);

  const searchUser = useCallback(async () => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) return;

    trackSearchUsed(trimmed);

    // Check if this username already failed with a permanent error
    const cachedError = failedUsernamesRef.current.get(trimmed);
    if (cachedError) {
      setFeedback({ type: "error", code: cachedError as NonNullable<typeof feedback>["code"], username: trimmed });
      return;
    }

    // Snapshot compare state before async work — ESC may clear it mid-flight
    const wasComparing = comparePlanet;

    setLoading(true);
    setFeedback({ type: "loading" });
    setfocusedPlanet(null);
    setselectedPlanet(null);
    setShareData(null);

    try {
      // Self-compare guard
      if (wasComparing && trimmed === wasComparing.login.toLowerCase()) {
        setCompareSelfHint(true);
        setTimeout(() => setCompareSelfHint(false), 2000);
        setFeedback(null);
        return;
      }

      // Check if dev already exists in the Universe before the fetch
      const existedBefore = planets.some(
        (b) => b.login.toLowerCase() === trimmed
      );

      // Add/refresh the company
      const devRes = await fetch(`/api/dev/${encodeURIComponent(trimmed)}`);
      const devData = await devRes.json();

      if (!devRes.ok) {
        let code: "not-found" | "org" | "no-activity" | "rate-limit" | "api-rate-limit" | "timeout" | "generic" = "generic";
        if (devRes.status === 404) code = "not-found";
        else if (devRes.status === 504) code = "timeout";
        else if (devRes.status === 429) {
          code = (devData.error?.includes("GitHub") || devData.error?.includes("API")) ? "api-rate-limit" : "rate-limit";
        } else if (devRes.status === 400) {
          if (devData.error?.includes("Organization")) code = "org";
          else if (devData.error?.includes("no public activity")) code = "no-activity";
        }
        // Cache permanent errors so we don't re-fetch
        if (PERMANENT_ERROR_CODES.has(code)) {
          failedUsernamesRef.current.set(trimmed, code);
        }
        setFeedback({ type: "error", code, username: trimmed, raw: devData.error });
        return;
      }

      setFeedback(null);

      // Dev not in the Universe yet: show invite card ONLY for admins
      if (devData.exists === false && devData.preview) {
        if (devData.is_admin) {
          setInvitePreview(devData.preview);
          setUsername("");
        } else {
          setFeedback({
            type: "error",
            code: "not-found",
            username: trimmed,
            raw: "This planet hasn't been added to the Universe yet. Contact an administrator to add it.",
          });
        }
        return;
      }

      // Merge the refreshed dev back into the live Universe so searches update stats immediately
      let updatedPlanets: UniversePlanet[] | null = null;
      const refreshedLogin = (devData.username ?? trimmed).toLowerCase();
      const existingDev = rawCompaniesRef.current.find(
        (d) => d.username?.toLowerCase() === refreshedLogin
      );
      const eAny = existingDev as any;
      const syncedDev = {
        ...(existingDev ?? {}),
        ...devData,
        owned_items: existingDev?.owned_items ?? [],
        achievements: existingDev?.achievements ?? [],
        loadout: existingDev?.loadout ?? null,
        custom_color: existingDev?.custom_color ?? null,
        billboard_images: existingDev?.billboard_images ?? [],
        active_raid_tag: existingDev?.active_raid_tag ?? null,
        kudos_count: devData.kudos_count ?? existingDev?.kudos_count ?? 0,
        visit_count: devData.visit_count ?? existingDev?.visit_count ?? 0,
        app_streak: devData.app_streak ?? existingDev?.app_streak ?? 0,
        raid_xp: devData.raid_xp ?? existingDev?.raid_xp ?? 0,
        rabbit_completed: devData.rabbit_completed ?? existingDev?.rabbit_completed ?? false,
        xp_total: devData.xp_total ?? existingDev?.xp_total ?? 0,
        xp_level: devData.xp_level ?? existingDev?.xp_level ?? 1,
      };
      rawCompaniesRef.current = existedBefore
        ? rawCompaniesRef.current.map((d) =>
          d.username?.toLowerCase() === refreshedLogin ? syncedDev : d
        )
        : [...rawCompaniesRef.current, syncedDev];

      const layout = generateUniverseLayout(rawCompaniesRef.current);
      setPlanets(layout.planets);
      setPlazas(layout.plazas);
      setDecorations(layout.decorations);
      setRiver(layout.river);
      setBridges(layout.bridges);
      setGalaxyZones(layout.GalaxyZones);
      setUniverseCache({ ...layout, stats: stats ?? { total_companies: 0, total_contributions: 0 }, rawcompanies: rawCompaniesRef.current });
      updatedPlanets = layout.planets;

      // Focus camera on the searched planet
      setfocusedPlanet(devData.username);

      // A8: Ghost preview — if user searched for themselves, show temporary effect
      if (
        authLogin &&
        trimmed === authLogin &&
        !ghostPreviewShownRef.current
      ) {
        ghostPreviewShownRef.current = true;
        setGhostPreviewLogin(devData.username);
        setTimeout(() => setGhostPreviewLogin(null), 4000);
      }

      // Find the planet in the current or updated Universe
      const searchPool = updatedPlanets ?? planets;
      const foundplanet = searchPool.find(
        (b: UniversePlanet) => b.login.toLowerCase() === refreshedLogin
      );

      // Compare pick mode: use snapshot so ESC mid-search doesn't cause stale state
      if (wasComparing && !comparePair && foundplanet) {
        // Only complete if compare mode is still active (not cancelled by ESC)
        if (comparePlanet) {
          setComparePair([wasComparing, foundplanet]);
          setfocusedPlanet(wasComparing.login);
        } else {
          // Compare was cancelled during search — fall through to normal
          if (foundplanet) {
            setselectedPlanet(foundplanet);
            setExploreMode(true);
          }
        }
      } else if (!existedBefore) {
        // New company: show the share modal
        setShareData({
          login: devData.username,
          contributions: devData.contributions,
          rank: devData.rank,
          avatar_url: devData.avatar_url,
        });
        if (foundplanet) setselectedPlanet(foundplanet);
        setCopied(false);
      } else if (foundplanet) {
        // Existing company: enter explore mode and show profile card
        setselectedPlanet(foundplanet);
        setExploreMode(true);
      }
      setUsername("");
    } catch {
      setFeedback({ type: "error", code: "network", username: trimmed });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, planets, authLogin, comparePlanet, comparePair, stats]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchUser();
  };

  const handleSignIn = () => handleSignInWithRef();

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setSession(null);
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/claim", { method: "POST" });
      if (res.ok) {
        trackPlanetClaimed(authLogin);
        await reloadUniverse();
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimFreeGift = async () => {
    if (claimingGift) return;
    setClaimingGift(true);
    try {
      const res = await fetch("/api/claim-free-item", { method: "POST" });
      if (res.ok) {
        trackFreeItemClaimed();
        await reloadUniverse();
        setGiftClaimed(true);
      }
    } finally {
      setClaimingGift(false);
    }
  };

  // Determine if the logged-in user can claim their planet
  const myPlanet = authLogin
    ? planets.find((b) => b.login.toLowerCase() === authLogin)
    : null;
  const canClaim = !!session && !!myPlanet && !myPlanet.claimed;

  // Shop link: logged in + claimed → own shop, otherwise → /shop landing
  const shopHref =
    session && myPlanet?.claimed
      ? `/shop/${myPlanet.login}`
      : "/shop";

  // Show free gift CTA when user claimed but hasn't picked up the free item
  const hasFreeGift =
    !!session &&
    !!myPlanet?.claimed &&
    !myPlanet.owned_items.includes("flag");

  // Show constellation chooser once per session when user hasn't chosen yet
  const shouldShowConstellationChooser =
    !!session && !!myPlanet?.claimed && !myPlanet.constellation_chosen;

  useEffect(() => {
    if (shouldShowConstellationChooser && !sessionStorage.getItem("constellation_dismissed")) {
      setConstellationChooserOpen(true);
    }
  }, [shouldShowConstellationChooser]);

  // Streak auto check-in (1x per browser session)
  const { streakData } = useStreakCheckin(session, !!myPlanet?.claimed);

  // Daily missions
  const { data: dailiesData, trackClientMission, claim: claimDailies, refresh: refreshDailies, toasts: dailyToasts } = useDailies(session, !!myPlanet?.claimed);
  // Stable ref so closures (visit useEffect, kudos callback) always use latest
  const trackMissionRef = useRef(trackClientMission);
  trackMissionRef.current = trackClientMission;

  // Detect level-up from check-in XP result
  useEffect(() => {
    if (!streakData?.xp || !myPlanet) return;
    const newLevel = streakData.xp.new_level;
    const currentLevel = myPlanet.xp_level ?? 1;
    if (newLevel > currentLevel) {
      setLevelUpLevel(newLevel);
    }
  }, [streakData?.xp, myPlanet]);

  // Live users presence
  const { count: liveUsers } = useLiveUsers();
  const { liveCount: codingCount, liveByLogin } = useCodingPresence();

  // Universe energy: companies coding -> Universe lights up. 0 companies = nearly dark, 5+ = full brightness
  const UniverseEnergy = useMemo(() => {
    if (codingCount === 0) return 0.05;
    if (codingCount === 1) return 0.35;
    if (codingCount === 2) return 0.55;
    if (codingCount <= 5) return 0.55 + (codingCount - 2) * 0.15; // 3->0.7, 5->1.0
    if (codingCount <= 15) return 1.0 + (Math.min(codingCount, 15) - 5) * 0.02; // 10->1.1, 15->1.2
    return Math.min(1.4, 1.2 + (codingCount - 15) * 0.02); // 25+->1.4 cap
  }, [codingCount]);

  // ─── Milestone celebration system ──────────────────────────
  const forceCelebrate = searchParams.has("celebrate");

  const celebrationActive = useMemo(() => {
    if (forceCelebrate) return true;
    if (stats.total_companies < CELEBRATION_MILESTONES[0]) return false;
    const current = [...CELEBRATION_MILESTONES].reverse().find((m) => stats.total_companies >= m);
    if (!current) return false;
    const record = milestoneCelebrations.find((c) => c.milestone === current);
    if (!record) return true;
    const elapsed = Date.now() - new Date(record.reached_at).getTime();
    return elapsed < 24 * 60 * 60 * 1000;
  }, [stats.total_companies, milestoneCelebrations, forceCelebrate]);

  // Fetch milestone celebrations on mount
  useEffect(() => {
    fetch("/api/milestone-celebration")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setMilestoneCelebrations(data); })
      .catch(() => { });
  }, []);

  // Record milestone when crossed
  useEffect(() => {
    if (stats.total_companies < CELEBRATION_MILESTONES[0]) return;
    const current = [...CELEBRATION_MILESTONES].reverse().find((m) => stats.total_companies >= m);
    if (!current) return;
    const alreadyRecorded = milestoneCelebrations.some((c) => c.milestone === current);
    if (alreadyRecorded) return;
    fetch("/api/milestone-celebration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total_companies: stats.total_companies }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.celebrated) {
          setMilestoneCelebrations((prev) => [
            { milestone: data.milestone, reached_at: data.reached_at ?? new Date().toISOString() },
            ...prev,
          ]);
        }
      })
      .catch(() => { });
  }, [stats.total_companies, milestoneCelebrations]);

  // Feature 1: Daily Challenge Nudge — show after load if user has history but hasn't played today
  useEffect(() => {
    if (loadStage !== "done" || isMobile || !session || flyMode || introMode) return;
    dailyNudgeTimerRef.current = setTimeout(() => {
      try {
        const raw = localStorage.getItem("gitUniverse_fly_history");
        if (!raw) return; // no history — first-fly hint handles this
        const hist = JSON.parse(raw);
        if (!hist.seeds || Object.keys(hist.seeds).length === 0) return;
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
        const currentSeed = `${now.getFullYear()}-${dayOfYear}`;
        if (hist.seeds[currentSeed]) return; // already played today
        setShowDailyNudge(true);
        // Auto-dismiss after 15s
        const autoDismiss = setTimeout(() => setShowDailyNudge(false), 15000);
        dailyNudgeTimerRef.current = autoDismiss;
      } catch { }
    }, 2000);
    return () => clearTimeout(dailyNudgeTimerRef.current);
  }, [loadStage, isMobile, session, flyMode, introMode]);

  // Feature 2: First-Fly Tooltip — show if user has never flown
  useEffect(() => {
    if (loadStage !== "done" || isMobile || flyMode || introMode) return;
    try {
      if (localStorage.getItem("gitUniverse_fly_history") || localStorage.getItem("gitUniverse_fly_hint_seen")) return;
    } catch { return; }
    flyHintTimerRef.current = setTimeout(() => {
      setShowFlyHint(true);
      // Auto-dismiss after 10s
      const autoDismiss = setTimeout(() => {
        setShowFlyHint(false);
        try { localStorage.setItem("gitUniverse_fly_hint_seen", "1"); } catch { }
      }, 10000);
      flyHintTimerRef.current = autoDismiss;
    }, 5000);
    return () => clearTimeout(flyHintTimerRef.current);
  }, [loadStage, isMobile, flyMode, introMode]);

  // Feature 3: First-Flight Controls Overlay — user-dismissed only (no auto-dismiss)

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg font-pixel uppercase text-warm">
      <UniverseCanvas companies={rawCompaniesRef.current} />

      {/* Loading screen overlay */}
      {loadStage !== "done" && (
        <LoadingScreen
          stage={loadStage}
          progress={loadProgress}
          error={loadError}
          accentColor={theme.accent}
          onRetry={handleLoadRetry}
          onFadeComplete={handleLoadFadeComplete}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

