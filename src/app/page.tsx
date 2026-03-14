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
  type CompanyPlanet,
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
const constellationChooser = dynamic(() => import("@/components/constellationChooser"), { ssr: false });
const LevelUpToast = dynamic(() => import("@/components/LevelUpToast"), { ssr: false });
const MiniMap = dynamic(() => import("@/components/MiniMap"), { ssr: false });

// Feature flags — flip to switch milestone banner
const MILESTONE_MODE: "stars" | "companies" = "companies"; // "stars" = GitHub stars road to 1K, "companies" = total companies

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
  "Git Push --force Enjoyer",
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
    primary: (u) => `"@${u}" doesn't exist on GitHub`,
    secondary: "Check the spelling — could be a typo. GitHub usernames are case-insensitive.",
  },
  "org": {
    primary: (u) => `"@${u}" is an organization, not a person`,
    secondary: "Git Universe is for individual profiles. Try searching for one of its contributors by their personal username.",
  },
  "no-activity": {
    primary: (u) => `"@${u}" has no public activity yet`,
    secondary: "Is this you? Open your profile settings, scroll to 'Contributions & activity', and enable 'Include private contributions'. Then search again.",
    hasLink: true,
  },
  "rate-limit": {
    primary: () => "Search limit reached",
    secondary: "You can look up 10 new profiles per hour. companies already in the Universe are unlimited.",
  },
  "github-rate-limit": {
    primary: () => "GitHub's API is temporarily unavailable",
    secondary: "Too many requests to GitHub. Try again in a few minutes.",
  },
  "timeout": {
    primary: (u) => `Fetching "@${u}" took too long`,
    secondary: "GitHub's API was slow to respond. This usually resolves itself — try again in a moment.",
    hasRetry: true,
  },
  "network": {
    primary: () => "Couldn't reach the server",
    secondary: "Check your internet connection and try again.",
    hasRetry: true,
  },
  "generic": {
    primary: () => "Something went wrong",
    secondary: "An unexpected error occurred. Try again.",
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

function MiniLeaderboard({ planets, accent }: { planets: CompanyPlanet[]; accent: string }) {
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
        <a
          href={`/leaderboard?tab=${cat.tab}`}
          className="text-[9px] text-muted transition-colors hover:text-cream normal-case"
        >
          View all &rarr;
        </a>
      </div>
      <div className="border-2 border-border bg-bg-raised/80 backdrop-blur-sm">
        {sorted.map((b, i) => (
          <a
            key={b.login}
            href={`/dev/${b.login}`}
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
          </a>
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
  const [planets, setPlanets] = useState<CompanyPlanet[]>([]);
  // Keep raw dev records so we can inject new companies and regenerate layout locally
  const rawCompaniesRef = useRef<CompanyRecord[]>([]);
  const [plazas, setPlazas] = useState<SpacePlaza[]>([]);
  const [decorations, setDecorations] = useState<SpaceDecoration[]>([]);
  const [river, setRiver] = useState<SpaceRiver | null>(null);
  const [bridges, setBridges] = useState<SpaceBridge[]>([]);
  const [GalaxyZones, setGalaxyZones] = useState<GalaxyZone[]>([]);
  const [loading, setLoading] = useState(false);
  // Loading state machine — skip on return visits that still have cached data
  const [loadStage, setLoadStage] = useState<LoadingStage>("init");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "loading" | "error";
    code?: "not-found" | "org" | "no-activity" | "rate-limit" | "github-rate-limit" | "timeout" | "network" | "generic";
    username?: string;
    raw?: string;
  } | null>(null);
  const [flyMode, setFlyMode] = useState(false);
  const [flyVehicle, setFlyVehicle] = useState<string>("airplane");
  const [introMode, setIntroMode] = useState(false);
  const [introPhase, setIntroPhase] = useState(-1); // -1 = not started, 0-3 = text phases, 4 = done
  const [exploreMode, setExploreMode] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("gitUniverse_theme");
    if (saved !== null) {
      const n = parseInt(saved, 10);
      if (n >= 0 && n <= 3) setThemeIndex(n);
    }
  }, []);


  const [hud, setHud] = useState({ speed: 0, altitude: 0 });
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [constellationAnnouncement, setconstellationAnnouncement] = useState<{ name: string; color: string; population: number } | null>(null);
  const lastconstellationRef = useRef<string | null>(null);
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
  const [selectedPlanet, setselectedPlanet] = useState<CompanyPlanet | null>(null);
  const [giftClaimed, setGiftClaimed] = useState(false);
  const [claimingGift, setClaimingGift] = useState(false);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [feedPanelOpen, setFeedPanelOpen] = useState(false);
  const [kudosSending, setKudosSending] = useState(false);
  const [kudosSent, setKudosSent] = useState(false);
  const [kudosError, setKudosError] = useState<string | null>(null);
  const visitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [comparePlanet, setcomparePlanet] = useState<CompanyPlanet | null>(null);
  const [comparePair, setComparePair] = useState<[CompanyPlanet, CompanyPlanet] | null>(null);
  const [compareSelfHint, setCompareSelfHint] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftItems, setGiftItems] = useState<{ id: string; price_usd_cents: number; owned: boolean }[] | null>(null);
  const [giftBuying, setGiftBuying] = useState<string | null>(null);
  const [compareCopied, setCompareCopied] = useState(false);
  const [compareLang, setCompareLang] = useState<"en" | "pt">("en");
  const [clickedAd, setClickedAd] = useState<import("@/lib/skyAds").SkyAd | null>(null);
  const [skyAds, setSkyAds] = useState<import("@/lib/skyAds").SkyAd[]>(DEFAULT_SKY_ADS);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [discordMembers, setDiscordMembers] = useState<number | null>(null);
  const [pillModalOpen, setPillModalOpen] = useState(false);
  const [founderMessageOpen, setFounderMessageOpen] = useState(false);
  const [constellationChooserOpen, setconstellationChooserOpen] = useState(false);
  const [rabbitCinematic, setRabbitCinematic] = useState(false);
  const [rabbitCinematicPhase, setRabbitCinematicPhase] = useState(-1);
  const [rabbitProgress, setRabbitProgress] = useState(0);
  useEffect(() => {
    const saved = parseInt(localStorage.getItem("gitUniverse_rabbit_progress") ?? "0", 10) || 0;
    if (saved > 0) setRabbitProgress(saved);
  }, []);
  const [rabbitSighting, setRabbitSighting] = useState<number | null>(null);
  const [rabbitCompletion, setRabbitCompletion] = useState(false);
  const [rabbitHintFlash, setRabbitHintFlash] = useState<string | null>(null);

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

  // Fetch GitHub star count + Discord member count
  useEffect(() => {
    fetch("https://api.github.com/repos/srizzon/git-Universe")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.stargazers_count != null) setStarCount(d.stargazers_count); })
      .catch(() => { });
    fetch("https://discord.com/api/v9/invites/2bTjFAkny7?with_counts=true")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.approximate_member_count != null) setDiscordMembers(d.approximate_member_count); })
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
    const check = () => setIsMobile(window.innerWidth < 640 || "ontouchstart" in window);
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
        if (login) identifyUser({ github_login: login, email: s.user?.email ?? undefined });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, s: Session | null) => {
      setSession(s);
      if (s && event !== "TOKEN_REFRESHED") {
        const login = (s.user?.user_metadata?.user_name ?? s.user?.user_metadata?.preferred_username ?? "").toLowerCase();
        if (login) identifyUser({ github_login: login, email: s.user?.email ?? undefined });
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
          localStorage.setItem("gitUniverse_theme", String(data.Universe_theme));
        }
      })
      .catch(() => { });
  }, [sessionUserId]);

  // Cycle theme: save to localStorage + sync to DB if logged in
  const cycleTheme = useCallback(() => {
    setThemeIndex((i) => {
      const next = (i + 1) % THEMES.length;
      localStorage.setItem("gitUniverse_theme", String(next));
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
  const handleSignInWithRef = useCallback(async () => {
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
      provider: "github",
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
        const localProgress = parseInt(localStorage.getItem("gitUniverse_rabbit_progress") ?? "0", 10) || 0;

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
        localStorage.setItem("gitUniverse_rabbit_progress", String(best));
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
          localStorage.setItem("gitUniverse_rabbit_progress", String(data.progress));

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
    localStorage.setItem("gitUniverse_rabbit_progress", String(newProgress));

    if (sighting >= 5) {
      // Final sighting: need login to save achievement
      handleSignInWithRef();
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
      const raw = localStorage.getItem("gitUniverse:loadout_override");
      if (raw) {
        const { companyId, loadout, ts } = JSON.parse(raw);
        if (Date.now() - ts < 10 * 60 * 1000) {
          const idx = allcompanies.findIndex((d) => d.id === companyId);
          if (idx !== -1) {
            allcompanies[idx] = { ...allcompanies[idx], loadout };
          }
        } else {
          localStorage.removeItem("gitUniverse:loadout_override");
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
    if (!localStorage.getItem("gitUniverse_intro_seen") && !hasDeepLink) {
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
        // WebGL check
        setLoadStage("init");
        setLoadProgress(3);
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) {
          setLoadError("Your browser does not support WebGL. Try Chrome, Firefox, or Edge.");
          setLoadStage("error");
          return;
        }

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
          const res = await fetch(`/api/Universe?from=0&to=${CHUNK}`);
          if (!res.ok) throw new Error("Failed to fetch Universe data");
          const data = await res.json();
          allcompanies = data.companies ?? [];
          UniverseStats = data.stats;

          const total = UniverseStats?.total_companies ?? 0;
          if (total > CHUNK && allcompanies.length > 0) {
            const promises: Promise<{ companies: typeof data.companies } | null>[] = [];
            for (let from = CHUNK; from < total; from += CHUNK) {
              promises.push(
                fetch(`/api/Universe?from=${from}&to=${from + CHUNK}`)
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
          const raw = localStorage.getItem("gitUniverse:loadout_override");
          if (raw) {
            const { companyId, loadout, ts } = JSON.parse(raw);
            if (Date.now() - ts < 10 * 60 * 1000) {
              const idx = allcompanies.findIndex((d) => d.id === companyId);
              if (idx !== -1) {
                allcompanies[idx] = { ...allcompanies[idx], loadout };
              }
            } else {
              localStorage.removeItem("gitUniverse:loadout_override");
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
  // Phase 0: "Somewhere in the internet..."   0.8s → fade out ~3.8s
  // Phase 1: "companies became planets"    4.2s → fade out ~7.2s
  // Phase 2: "And commits became floors"      7.6s → fade out ~10.6s
  // Phase 3: "Welcome to Git Universe"            11.0s → confetti + hold until end
  const INTRO_TEXT_SCHEDULE = [800, 4200, 7600, 11000];
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
    // Confetti shortly after "Welcome to Git Universe"
    timers.push(setTimeout(() => setIntroConfetti(true), INTRO_TEXT_SCHEDULE[3] + 500));

    return () => timers.forEach(clearTimeout);
  }, [introMode]);


  const endIntro = useCallback(() => {
    setIntroMode(false);
    setIntroPhase(-1);
    setIntroConfetti(false);
    localStorage.setItem("gitUniverse_intro_seen", "true");
    // Show welcome CTA for non-logged-in users who haven't seen it
    if (!session && !localStorage.getItem("gitUniverse_welcome_seen")) {
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
          if (rawCompaniesRef.current.some((d: companyRecord) => d.github_login.toLowerCase() === userParam.toLowerCase())) return;

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
        if (rawCompaniesRef.current.some((d: companyRecord) => d.github_login.toLowerCase() === authLogin)) return;

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
      const foundA = updated.find((b: CompanyPlanet) => b.login.toLowerCase() === parts[0]);
      const foundB = updated.find((b: CompanyPlanet) => b.login.toLowerCase() === parts[1]);
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
        let code: "not-found" | "org" | "no-activity" | "rate-limit" | "github-rate-limit" | "timeout" | "generic" = "generic";
        if (devRes.status === 404) code = "not-found";
        else if (devRes.status === 504) code = "timeout";
        else if (devRes.status === 429) {
          code = devData.error?.includes("GitHub") ? "github-rate-limit" : "rate-limit";
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

      // Dev not in the Universe yet: show invite card instead of creating a planet
      if (devData.exists === false && devData.preview) {
        setInvitePreview(devData.preview);
        setUsername("");
        return;
      }

      // Merge the refreshed dev back into the live Universe so searches update stats immediately
      let updatedplanets: CompanyPlanet[] | null = null;
      const refreshedLogin = (devData.github_login ?? trimmed).toLowerCase();
      const existingDev = rawCompaniesRef.current.find(
        (d) => d.github_login?.toLowerCase() === refreshedLogin
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
          d.github_login?.toLowerCase() === refreshedLogin ? syncedDev : d
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
      updatedplanets = layout.planets;

      // Focus camera on the searched planet
      setfocusedPlanet(devData.github_login);

      // A8: Ghost preview — if user searched for themselves, show temporary effect
      if (
        authLogin &&
        trimmed === authLogin &&
        !ghostPreviewShownRef.current
      ) {
        ghostPreviewShownRef.current = true;
        setGhostPreviewLogin(devData.github_login);
        setTimeout(() => setGhostPreviewLogin(null), 4000);
      }

      // Find the planet in the current or updated Universe
      const searchPool = updatedplanets ?? planets;
      const foundplanet = searchPool.find(
        (b: CompanyPlanet) => b.login.toLowerCase() === refreshedLogin
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
          login: devData.github_login,
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

  const handleSignIn = handleSignInWithRef;

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
  const myplanet = authLogin
    ? planets.find((b) => b.login.toLowerCase() === authLogin)
    : null;
  const canClaim = !!session && !!myplanet && !myplanet.claimed;

  // Shop link: logged in + claimed → own shop, otherwise → /shop landing
  const shopHref =
    session && myplanet?.claimed
      ? `/shop/${myplanet.login}`
      : "/shop";

  // Show free gift CTA when user claimed but hasn't picked up the free item
  const hasFreeGift =
    !!session &&
    !!myplanet?.claimed &&
    !myplanet.owned_items.includes("flag");

  // Show constellation chooser once per session when user hasn't chosen yet
  const shouldShowconstellationChooser =
    !!session && !!myplanet?.claimed && !myplanet.constellation_chosen;

  useEffect(() => {
    if (shouldShowconstellationChooser && !sessionStorage.getItem("constellation_dismissed")) {
      setconstellationChooserOpen(true);
    }
  }, [shouldShowconstellationChooser]);

  // Streak auto check-in (1x per browser session)
  const { streakData } = useStreakCheckin(session, !!myplanet?.claimed);

  // Daily missions
  const { data: dailiesData, trackClientMission, claim: claimDailies, refresh: refreshDailies, toasts: dailyToasts } = useDailies(session, !!myplanet?.claimed);
  // Stable ref so closures (visit useEffect, kudos callback) always use latest
  const trackMissionRef = useRef(trackClientMission);
  trackMissionRef.current = trackClientMission;

  // Detect level-up from check-in XP result
  useEffect(() => {
    if (!streakData?.xp || !myplanet) return;
    const newLevel = streakData.xp.new_level;
    const currentLevel = myplanet.xp_level ?? 1;
    if (newLevel > currentLevel) {
      setLevelUpLevel(newLevel);
    }
  }, [streakData?.xp, myplanet]);

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
      {/* 3D Canvas */}
      <UniverseCanvas companies={companies} />

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

      {/* ─── Intro Flyover Overlay ─── */}
      {introMode && (
        <div className="pointer-events-none fixed inset-0 z-50">
          {/* Cinematic letterbox bars (transform: scaleY for composited-only GPU animation) */}
          <div
            className="absolute inset-x-0 top-0 origin-top bg-black/80 transition-transform duration-1000"
            style={{ height: "12%", transform: introPhase >= 0 ? "scaleY(1)" : "scaleY(0)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 origin-bottom bg-black/80 transition-transform duration-1000"
            style={{ height: "18%", transform: introPhase >= 0 ? "scaleY(1)" : "scaleY(0)" }}
          />

          {/* Text in the lower bar area */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center" style={{ height: "18%" }}>
            {/* Narrative texts (phases 0-2) */}
            {[
              "Somewhere in the internet...",
              "Companies became planets",
              "And metrics became orbits",
            ].map((text, i) => (
              <p
                key={i}
                className="absolute text-center font-pixel normal-case text-cream"
                style={{
                  fontSize: "clamp(0.85rem, 3vw, 1.5rem)",
                  letterSpacing: "0.05em",
                  opacity: introPhase === i ? 1 : 0,
                  transition: "opacity 0.7s ease-in-out",
                }}
              >
                {text}
              </p>
            ))}

            {/* Welcome to Git Universe (phase 3) */}
            <div
              className="absolute flex flex-col items-center gap-1"
              style={{
                opacity: introPhase === 3 ? 1 : 0,
                transform: introPhase === 3 ? "scale(1)" : "scale(0.95)",
                transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
              }}
            >
              <p
                className="text-center font-pixel uppercase text-cream"
                style={{ fontSize: "clamp(1.2rem, 5vw, 2.8rem)" }}
              >
                Welcome to{" "}
                <span style={{ color: theme.accent }}>the Universe</span>
              </p>
            </div>
          </div>

          {/* Confetti burst */}
          {introConfetti && (
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 25 }).map((_, i) => {
                const colors = [theme.accent, "#fff", theme.shadow, "#f0c060", "#e040c0", "#60c0f0"];
                const color = colors[i % colors.length];
                const left = 10 + Math.random() * 80;
                const delay = Math.random() * 0.6;
                const duration = 2.5 + Math.random() * 1.5;
                const w = 3 + Math.random() * 5;
                const h = Math.random() > 0.5 ? w : w * 0.35;
                const drift = (Math.random() - 0.5) * 80;
                const rotation = Math.random() * 720;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${left}%`,
                      top: "-8px",
                      width: `${w}px`,
                      height: `${h}px`,
                      backgroundColor: color,
                      animation: `introConfettiFall ${duration}s ${delay}s ease-in forwards`,
                      transform: `rotate(${rotation}deg) translateX(${drift}px)`,
                      opacity: 0,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Skip button - top right, outside the cinematic bars */}
          <button
            className="pointer-events-auto absolute top-4 right-4 font-pixel text-[10px] uppercase text-cream/40 transition-colors hover:text-cream sm:text-xs"
            onClick={endIntro}
          >
            Skip &gt;
          </button>
        </div>
      )}

      {/* ─── Fly Mode HUD ─── */}
      {flyMode && (
        <div className="pointer-events-none fixed inset-0 z-30">
          {/* Top bar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="inline-flex items-center gap-3 border-[3px] border-border bg-bg/70 px-5 py-2.5 backdrop-blur-sm">
              <span
                className={`h-2 w-2 shrink-0 ${flyPaused ? "" : "blink-dot"}`}
                style={{ backgroundColor: flyPaused ? "#f85149" : theme.accent }}
              />
              <span className="text-[10px] text-cream">
                {flyPaused ? "Paused" : "Fly"}
              </span>
              <span className="mx-1 text-border">|</span>
              <span className="text-[10px]" style={{ color: theme.accent }}>{flyScore.score}</span>
              <span className="text-[10px] text-muted">PX</span>
              {flyScore.combo >= 2 && (
                <span className="animate-pulse text-[10px] font-bold" style={{ color: "#ffd700" }}>
                  &times;{flyScore.combo >= 4 ? 3 : flyScore.combo >= 3 ? 2 : 1.5}
                </span>
              )}
            </div>
          </div>

          {/* Score HUD (top right) */}
          <div className="absolute top-4 right-3 text-right text-[9px] text-muted sm:right-4 sm:text-[10px]">
            <div>{flyScore.collected}/40 collected</div>
            <div className="mt-1 flex h-1 w-24 items-center border border-border/40 bg-bg/50 ml-auto">
              <div className="h-full transition-all duration-150" style={{ width: `${(flyScore.collected / 40) * 100}%`, backgroundColor: theme.accent }} />
            </div>
            <div className="mt-1.5 text-[8px]">
              <span className="text-muted">TIME </span>
              <span style={{ color: flyElapsedSec < 90 ? theme.accent : "#f85149" }}>
                {Math.floor(flyElapsedSec / 60)}:{String(flyElapsedSec % 60).padStart(2, "0")}
              </span>
            </div>
            {flyPersonalBest > 0 && (
              <div className="mt-0.5 text-[8px] text-muted">BEST: <span style={{ color: theme.accent }}>{flyPersonalBest}</span></div>
            )}
          </div>

          {/* Flight data (above lo-fi radio) */}
          <div className="absolute bottom-14 left-3 text-[9px] leading-loose text-muted sm:left-4 sm:text-[10px]">
            <div className="flex items-center gap-2">
              <span>SPD</span>
              <span style={{ color: theme.accent }} className="w-6 text-right">
                {Math.round(hud.speed)}
              </span>
              <div className="flex h-1.5 w-20 items-center border border-border/60 bg-bg/50">
                <div
                  className="h-full transition-all duration-150"
                  style={{
                    width: `${Math.round(((hud.speed - 20) / 140) * 100)}%`,
                    backgroundColor: theme.accent,
                  }}
                />
              </div>
            </div>
            <div>
              ALT{" "}
              <span style={{ color: theme.accent }}>
                {Math.round(hud.altitude)}
              </span>
            </div>
          </div>

          {/* constellation announcement */}
          {constellationAnnouncement && (
            <div key={constellationAnnouncement.name} className="absolute bottom-32 left-3 animate-constellation-in sm:left-4">
              <div className="border-l-4 bg-bg/80 px-4 py-2 backdrop-blur-sm" style={{ borderColor: constellationAnnouncement.color }}>
                <div className="text-[8px] uppercase tracking-widest text-muted">constellation</div>
                <div className="font-pixel text-sm text-cream">{constellationAnnouncement.name}</div>
                <div className="text-[8px] text-muted">{constellationAnnouncement.population.toLocaleString()} companies</div>
              </div>
            </div>
          )}

          {/* Controls hint */}
          <div className="absolute bottom-35 right-3 text-right text-[8px] leading-loose text-muted sm:right-4 sm:text-[9px]">
            {flyPaused ? (
              <>
                <div>
                  <span className="text-cream">Drag</span> orbit
                </div>
                <div>
                  <span className="text-cream">Scroll</span> zoom
                </div>
                <div>
                  <span className="text-cream">WASD</span> resume
                </div>
                <div>
                  <span style={{ color: theme.accent }}>ESC</span> exit
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-cream">Mouse</span> steer
                </div>
                <div>
                  <span className="text-cream">Shift</span> boost
                </div>
                <div>
                  <span className="text-cream">Alt</span> slow
                </div>
                <div>
                  <span className="text-cream">Scroll</span> base speed
                </div>
                <div>
                  <span style={{ color: theme.accent }}>P</span> pause
                </div>
                <div>
                  <span style={{ color: theme.accent }}>ESC</span> pause
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Feature 3: First-Flight Controls Overlay ─── */}
      {showFlyControls && flyMode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/50 backdrop-blur-[2px]">
          <div
            className="border-[3px] border-border bg-bg-raised px-8 py-6 text-center animate-[fade-in_0.3s_ease-out]"
            style={{ borderColor: theme.accent + "60" }}
          >
            <p className="mb-4 text-xs tracking-widest text-muted">FLIGHT CONTROLS</p>
            <div className="flex flex-col gap-2.5 text-[11px]">
              <div className="flex items-center justify-between gap-6">
                <span className="text-cream">Mouse</span>
                <span className="text-muted">Steer</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-cream">Scroll</span>
                <span className="text-muted">Speed</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-cream">Shift / Alt</span>
                <span className="text-muted">Boost / Slow</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span style={{ color: theme.accent }}>ESC</span>
                <span className="text-muted">Pause &amp; Exit</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowFlyControls(false);
                try { localStorage.setItem("gitUniverse_fly_controls_seen", "1"); } catch { }
                // Resume the paused flight by dispatching Space keydown
                window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true }));
              }}
              className="btn-press mt-5 px-6 py-2 text-[10px] text-bg"
              style={{ backgroundColor: theme.accent, boxShadow: `3px 3px 0 0 ${theme.shadow}` }}
            >
              Got it, let&apos;s fly!
            </button>
          </div>
        </div>
      )}

      {/* ─── Mini-map ─── */}
      <MiniMap
        planets={planets}
        playerX={playerPos.x}
        playerZ={playerPos.z}
        visible={flyMode}
        currentconstellation={lastconstellationRef.current}
      />

      {/* ─── Explore Mode: minimal UI ─── */}
      {exploreMode && !flyMode && (
        <div className="pointer-events-none fixed inset-0 z-20">
          {/* Back button */}
          <div className="pointer-events-auto absolute top-3 left-3 sm:top-4 sm:left-4">
            <button
              onClick={() => {
                if (selectedPlanet) {
                  setselectedPlanet(null);
                  setfocusedPlanet(null);
                } else {
                  setExploreMode(false);
                  setfocusedPlanet(savedFocusRef.current);
                  savedFocusRef.current = null;
                }
              }}
              className="flex items-center gap-2 border-[3px] border-border bg-bg/70 px-3 py-1.5 text-[10px] backdrop-blur-sm transition-colors"
              style={{ borderColor: undefined }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent + "80")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
            >
              <span style={{ color: theme.accent }}>ESC</span>
              <span className="text-cream">Back</span>
            </button>
          </div>

          {/* Theme switcher + Radio (bottom-left) — above ticker */}
          <div className="pointer-events-auto fixed bottom-10 left-3 z-31 flex flex-col-reverse items-start gap-2 sm:left-4 sm:flex-row sm:items-center">
            <button
              onClick={cycleTheme}
              className="btn-press flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
            >
              <span style={{ color: theme.accent }}>&#9654;</span>
              <span className="text-cream">{theme.name}</span>
              <span className="text-dim">{themeIndex + 1}/{THEMES.length}</span>
            </button>
            <div id="gc-radio-slot" />
          </div>

          {/* Feed toggle (top-right, below GitHub badges on desktop) */}
          {feedEvents.length >= 1 && (
            <div className="pointer-events-auto absolute top-3 right-3 sm:top-14 sm:right-4">
              <button
                onClick={() => setFeedPanelOpen(true)}
                className="flex items-center gap-2 border-[3px] border-border bg-bg/70 px-3 py-1.5 text-[10px] backdrop-blur-sm transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.accent + "80")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
              >
                <span style={{ color: theme.accent }}>&#9679;</span>
                <span className="text-cream">Feed</span>
              </button>
            </div>
          )}

          {/* Navigation hints (bottom-right) — hidden when planet card is open */}
          {!selectedPlanet && (
            <div className="absolute bottom-3 right-3 text-right text-[8px] leading-loose text-muted sm:bottom-4 sm:right-4 sm:text-[9px]">
              <div><span className="text-cream">Drag</span> orbit</div>
              <div><span className="text-cream">Scroll</span> zoom</div>
              <div><span className="text-cream">Right-drag</span> pan</div>
              <div><span className="text-cream">Click</span> planet</div>
              <div><span style={{ color: theme.accent }}>ESC</span> back</div>
            </div>
          )}
        </div>
      )}

      {/* Shop & Auth moved to center buttons area */}

      {/* ─── GitHub Badge (mobile: top-center, desktop: top-right) ─── */}
      {!flyMode && !introMode && !rabbitCinematic && (
        <div className={`pointer-events-auto fixed top-3 left-3 z-30 items-center gap-1.5 sm:gap-2 sm:left-auto sm:right-4 sm:top-4 ${exploreMode ? "hidden lg:flex" : "flex"}`}>
          {/* GitHub stars — only when loaded */}
          {starCount != null && (
            <a
              href="https://github.com/srizzon/git-Universe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-cream"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
              <span style={{ color: theme.accent }}>&#9733;</span>
              <span className="text-cream">{starCount.toLocaleString()}</span>
            </a>
          )}
          {/* Discord — desktop only, goes in mobile menu */}
          <a
            href="https://discord.gg/2bTjFAkny7"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#5865F2]"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" /></svg>
            <span className="hidden sm:inline text-cream">Discord</span>
            {discordMembers != null && <span className="text-cream">{discordMembers.toLocaleString()}</span>}
          </a>
          {/* Live users — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm">
            <span className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ade80]" />
            <span className="text-cream">{liveUsers.toLocaleString()}</span>
            <span className="text-muted">live</span>
          </div>
          {/* Coding now — mobile: compact pulse badge; desktop: dropdown button */}
          {codingCount > 0 && (
            <button
              onClick={() => setCodingInfoOpen(true)}
              className="flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm sm:hidden"
            >
              <span className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ade80]" />
              <span className="text-cream">{codingCount}</span>
              <span className="text-muted">coding</span>
            </button>
          )}
          {(() => {
            const energyLabel = codingCount === 0 ? "Universe sleeping" : codingCount <= 2 ? "Universe waking up" : codingCount <= 9 ? "Universe alive" : "Universe buzzing";
            const energyDotColor = codingCount === 0 ? "bg-muted/50" : codingCount <= 2 ? "bg-[#fbbf24]" : "bg-[#4ade80]";
            const energyDotAnim = codingCount === 0 ? "" : "live-dot";
            return (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setCodingPanelOpen((v) => !v)}
                  className="flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
                >
                  <span className={`${energyDotAnim} h-1.5 w-1.5 flex-shrink-0 rounded-full ${energyDotColor}`} />
                  {codingCount > 0 ? (
                    <>
                      <span className="text-cream">{codingCount}</span>
                      <span className="text-muted">coding now</span>
                    </>
                  ) : (
                    <span className="text-muted">{energyLabel}</span>
                  )}
                </button>
                {codingPanelOpen && (() => {
                  // Creator always first, then up to 4 others
                  const allcompanies = Array.from(liveByLogin.values());
                  const creator = allcompanies.find((d) => d.githubLogin.toLowerCase() === "srizzon");
                  const others = allcompanies.filter((d) => d.githubLogin.toLowerCase() !== "srizzon");
                  const displaycompanies = [
                    ...(creator ? [creator] : []),
                    ...others.slice(0, creator ? 4 : 5),
                  ];
                  const remaining = allcompanies.length - displaycompanies.length;

                  return (
                    <div className="absolute right-0 top-full mt-1 w-80 border-[3px] border-border bg-bg/95 backdrop-blur-sm">
                      <div className="border-b border-border px-5 py-3 text-xs text-muted">
                        Coding right now
                      </div>
                      <div>
                        {displaycompanies.map((dev) => {
                          const isCreator = dev.githubLogin.toLowerCase() === "srizzon";
                          return (
                            <button
                              key={dev.githubLogin}
                              onClick={() => {
                                const b = planets.find(
                                  (b) => b.login.toLowerCase() === dev.githubLogin.toLowerCase(),
                                );
                                if (b) {
                                  setselectedPlanet(null);
                                  setfocusedPlanet(b.login);
                                  setCodingPanelOpen(false);
                                }
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                            >
                              <div className="relative flex-shrink-0">
                                {dev.avatarUrl && (
                                  <img
                                    src={dev.avatarUrl}
                                    alt=""
                                    className="h-6 w-6 rounded-full"
                                    style={isCreator ? { boxShadow: "0 0 6px #fbbf24" } : undefined}
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`truncate text-[11px] ${isCreator ? "text-[#fbbf24]" : "text-cream"}`}>
                                    {dev.githubLogin}
                                  </span>
                                  {isCreator && (
                                    <span className="shrink-0 text-[8px] text-[#fbbf24]/70">CREATOR</span>
                                  )}
                                </div>
                                <div className="truncate text-[10px] normal-case text-muted">
                                  {isCreator ? "planet the Universe" : dev.language || ""}
                                </div>
                              </div>
                              <span className={`live-dot h-2 w-2 flex-shrink-0 rounded-full ${isCreator ? "bg-[#fbbf24]" : "bg-[#4ade80]"}`} />
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-border">
                        <Link
                          href="/live"
                          onClick={() => setCodingPanelOpen(false)}
                          className="block px-4 py-2.5 text-center text-[11px] text-muted transition-colors hover:text-cream"
                        >
                          {remaining > 0 ? `+${remaining} more` : "View live page"} &rarr;
                        </Link>
                      </div>

                      {/* CTA: Go Live flow */}
                      <div className="border-t border-border">
                        {!session ? (
                          <div className="px-5 py-5 text-center">
                            <p className="mb-3 text-xs normal-case text-muted">
                              Keep your Universe alive while you code
                            </p>
                            <Link
                              href="/auth"
                              onClick={() => setCodingPanelOpen(false)}
                              className="btn-press inline-block w-full py-2.5 text-center text-xs text-bg"
                              style={{ backgroundColor: "#4ade80", boxShadow: "2px 2px 0 0 #16a34a" }}
                            >
                              Sign in with GitHub
                            </Link>
                          </div>
                        ) : liveByLogin.has(authLogin) ? (
                          <div className="px-5 py-3.5 text-center text-xs normal-case text-[#4ade80]">
                            Your planet is powering the Universe
                          </div>
                        ) : vsCodeKey ? (
                          <div className="px-5 py-5">
                            <p className="mb-3 text-sm font-bold text-cream">Your API Key</p>
                            <div className="mb-3 flex items-center gap-2">
                              <code className="flex-1 truncate bg-white/5 px-3 py-2 text-[11px] normal-case text-cream">
                                {vsCodeKey}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(vsCodeKey);
                                  setVsCodeKeyCopied(true);
                                  setTimeout(() => setVsCodeKeyCopied(false), 2000);
                                }}
                                className="btn-press shrink-0 border border-border px-3 py-2 text-[11px] text-cream transition-colors hover:border-border-light"
                              >
                                {vsCodeKeyCopied ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <div className="space-y-2.5 text-xs normal-case text-muted">
                              <p><span className="text-cream">1.</span> Install <a href="https://marketplace.visualstudio.com/items?itemName=git-Universe.gitUniverse" target="_blank" rel="noopener noreferrer" className="text-[#4ade80] hover:underline">Git Universe: Pulse</a> in VS Code</p>
                              <p><span className="text-cream">2.</span> Cmd+Shift+P &rarr; &ldquo;Pulse: Connect&rdquo;</p>
                              <p><span className="text-cream">3.</span> Paste your key and start coding</p>
                            </div>
                            <p className="mt-3 text-[10px] normal-case text-muted/50">
                              Your planet lights up in ~30s
                            </p>
                            <p className="mt-1.5 text-[10px] normal-case text-muted/50">
                              Only your username and language are shared publicly. Control what&apos;s sent in VS Code Settings &gt; Git Universe &gt; Privacy.
                            </p>
                          </div>
                        ) : (
                          <div className="px-5 py-5">
                            <p className="mb-3 text-sm normal-case text-cream font-bold">
                              Keep your Universe alive
                            </p>
                            <p className="mb-3 text-[11px] normal-case text-muted">
                              When you code, your planet glows and the Universe stays lit. Every active dev powers the signal.
                            </p>
                            <div className="mb-4 space-y-2.5 text-xs normal-case text-muted">
                              <p><span className="text-cream">1.</span> Generate your key below</p>
                              <p><span className="text-cream">2.</span> Install <a href="https://marketplace.visualstudio.com/items?itemName=git-Universe.gitUniverse" target="_blank" rel="noopener noreferrer" className="text-[#4ade80] hover:underline">Git Universe: Pulse</a> in VS Code</p>
                              <p><span className="text-cream">3.</span> Paste key in VS Code, start coding</p>
                            </div>
                            <button
                              onClick={async () => {
                                setVsCodeKeyLoading(true);
                                try {
                                  const res = await fetch("/api/vscode-key", { method: "POST" });
                                  const data = await res.json();
                                  if (data.key) {
                                    setVsCodeKey(data.key);
                                    navigator.clipboard.writeText(data.key);
                                    setVsCodeKeyCopied(true);
                                    setTimeout(() => setVsCodeKeyCopied(false), 2000);
                                  }
                                } finally {
                                  setVsCodeKeyLoading(false);
                                }
                              }}
                              disabled={vsCodeKeyLoading}
                              className="btn-press w-full py-2.5 text-center text-xs text-bg"
                              style={{ backgroundColor: "#4ade80", boxShadow: "2px 2px 0 0 #16a34a" }}
                            >
                              {vsCodeKeyLoading ? "Generating..." : vsCodeKeyCopied ? "Key copied to clipboard!" : "Generate API Key"}
                            </button>
                            <p className="mt-3 text-[10px] normal-case text-muted/50">
                              Only your username and language are shared publicly. You can control this in VS Code Settings &gt; Git Universe &gt; Privacy.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── Coding Info Modal (mobile) ─── */}
      {codingInfoOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-end sm:hidden" onClick={() => setCodingInfoOpen(false)}>
          <div
            className="w-full border-t-2 border-border bg-bg px-5 py-6 animate-[slide-up_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="live-dot h-2 w-2 rounded-full bg-[#4ade80]" />
                <span className="text-sm text-cream">{codingCount} coding right now</span>
              </div>
              <button onClick={() => setCodingInfoOpen(false)} className="text-muted">
                <X size={16} />
              </button>
            </div>
            <p className="mb-5 text-xs text-muted normal-case leading-relaxed">
              Every company coding right now is keeping the Universe alive. Their planets light up in real time as they work.
            </p>
            <Link
              href="/live"
              onClick={() => setCodingInfoOpen(false)}
              className="btn-press block w-full py-3 text-center text-xs text-bg"
              style={{ backgroundColor: theme.accent, boxShadow: `2px 2px 0 0 ${theme.shadow}` }}
            >
              See who&apos;s coding live
            </Link>
          </div>
        </div>
      )}

      {/* ─── Mobile Hamburger Button ─── */}
      {!flyMode && !introMode && !rabbitCinematic && !exploreMode && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="pointer-events-auto fixed top-3 right-3 z-40 flex h-8 w-8 items-center justify-center border-2 border-border bg-bg/80 backdrop-blur-sm sm:hidden"
        >
          <Menu size={16} className="text-cream" />
        </button>
      )}

      {/* ─── Mobile Fullscreen Menu ─── */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-bg sm:hidden animate-[slide-in-right_0.25s_ease-out]" style={{ background: "var(--color-bg)" }}>

          {/* ── Profile / Auth header ── */}
          {session ? (
            <div className="px-5 pt-6 pb-5 border-b border-border" style={{ background: theme.accent + "0d" }}>
              <div className="flex items-start justify-between">
                <Link href={`/dev/${authLogin}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                  {myplanet?.avatar_url && (
                    <Image src={myplanet.avatar_url} alt="" width={48} height={48} unoptimized={true} className="h-12 w-12 rounded-full border-2" style={{ borderColor: theme.accent }} />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cream font-bold">@{authLogin}</span>
                      {streakData && streakData.streak > 0 && (
                        <span className="flex items-center gap-0.5 text-xs" style={{ color: getStreakTierColor(streakData.streak) }}>
                          🔥<span className="font-bold">{streakData.streak}</span>
                        </span>
                      )}
                    </div>
                    {myplanet && (
                      <div className="mt-0.5 text-[10px] text-muted normal-case">
                        {myplanet.constellation} constellation
                        {myplanet.claimed && <span className="ml-1.5 text-[#4ade80]">claimed</span>}
                      </div>
                    )}
                    {liveByLogin.has(authLogin) && (
                      <div className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: theme.accent }}>
                        <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                        coding now
                      </div>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center border-2 border-border text-muted"
                >
                  <X size={14} />
                </button>
              </div>
              {canClaim && (
                <button
                  onClick={() => { handleClaim(); setMobileMenuOpen(false); }}
                  disabled={claiming}
                  className="btn-press mt-4 w-full py-2.5 text-xs text-bg disabled:opacity-40"
                  style={{ backgroundColor: theme.accent, boxShadow: `2px 2px 0 0 ${theme.shadow}` }}
                >
                  {claiming ? "..." : "Claim your planet"}
                </button>
              )}
            </div>
          ) : (
            <div className="px-5 pt-6 pb-5 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted">GIT Universe</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center border-2 border-border text-muted"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mb-3 text-xs text-muted normal-case leading-relaxed">Your GitHub commits build a real 3D Universe. Sign in to claim your planet.</p>
              <button
                onClick={() => { handleSignIn(); setMobileMenuOpen(false); }}
                className="btn-press w-full py-3 text-xs text-bg"
                style={{ backgroundColor: theme.accent, boxShadow: `2px 2px 0 0 ${theme.shadow}` }}
              >
                Sign in with GitHub
              </button>
            </div>
          )}

          {/* ── Nav ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-border/40">
              <Link
                href={shopHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-5 py-4 active:bg-white/5"
              >
                <span className="text-sm text-cream">Shop</span>
                <span className="text-xs text-muted" style={{ color: theme.accent }}>&#8594;</span>
              </Link>
              <Link
                href="/live"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-5 py-4 active:bg-white/5"
              >
                <span className="flex items-center gap-2 text-sm text-cream">
                  {codingCount > 0 && <span className="live-dot h-2 w-2 rounded-full bg-[#4ade80]" />}
                  Live
                  {codingCount > 0 && (
                    <span className="text-[10px] text-muted">{codingCount} coding now</span>
                  )}
                </span>
                <span className="text-xs" style={{ color: theme.accent }}>&#8594;</span>
              </Link>
              <Link
                href="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-5 py-4 active:bg-white/5"
              >
                <span className="text-sm text-cream">&#9819; Leaderboard</span>
                <span className="text-xs" style={{ color: theme.accent }}>&#8594;</span>
              </Link>
              <Link
                href="/advertise"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-5 py-4 active:bg-white/5"
              >
                <span className="flex items-center gap-2 text-sm" style={{ color: theme.accent }}>
                  Place your Ad
                  <span className="px-1 py-px text-[8px] font-bold text-bg leading-none" style={{ backgroundColor: theme.accent }}>NEW</span>
                </span>
                <span className="text-xs" style={{ color: theme.accent }}>&#8594;</span>
              </Link>
              <a
                href="https://discord.gg/2bTjFAkny7"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-5 py-4 active:bg-white/5"
              >
                <span className="flex items-center gap-2 text-sm text-cream">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#5865F2] shrink-0"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" /></svg>
                  Discord
                  {discordMembers != null && <span className="text-[10px] text-muted">{discordMembers.toLocaleString()} members</span>}
                </span>
                <span className="text-xs" style={{ color: theme.accent }}>&#8594;</span>
              </a>
              <a
                href="https://github.com/srizzon/git-Universe"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-5 py-4 active:bg-white/5"
              >
                <span className="flex items-center gap-2 text-sm text-cream">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-cream shrink-0"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
                  GitHub
                  {starCount != null && <span className="text-[10px] text-muted">&#9733; {starCount.toLocaleString()}</span>}
                </span>
                <span className="text-xs" style={{ color: theme.accent }}>&#8594;</span>
              </a>
            </div>

            {/* ── Theme ── */}
            <div className="border-t border-border px-5 py-4">
              <p className="mb-3 text-[10px] text-muted uppercase tracking-widest">Theme</p>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t, i) => (
                  <button
                    key={t.name}
                    onClick={() => { setThemeIndex(i); try { localStorage.setItem("gitUniverse_theme", String(i)); } catch { } }}
                    className="py-2.5 text-[10px] border-2 transition-colors"
                    style={{
                      borderColor: themeIndex === i ? t.accent : "var(--color-border)",
                      color: themeIndex === i ? t.accent : "var(--color-muted)",
                      backgroundColor: themeIndex === i ? t.accent + "18" : "transparent",
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Stats footer ── */}
            <div className="border-t border-border px-5 py-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <span style={{ color: theme.accent }}>&#9733;</span>
                <span className="text-cream">{starCount?.toLocaleString() ?? "..."}</span>
                <span>stars</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                <span className="text-cream">{liveUsers.toLocaleString()}</span>
                <span>online now</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main UI Overlay ─── */}
      {!flyMode && !exploreMode && !introMode && !rabbitCinematic && (
        <div
          className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-between pt-16 pb-4 px-3 sm:py-8 sm:px-4"
          style={{
            background:
              "linear-gradient(to bottom, rgba(13,13,15,0.88) 0%, rgba(13,13,15,0.55) 30%, transparent 60%, transparent 85%, rgba(13,13,15,0.5) 100%)",
          }}
        >
          {/* Top */}
          <div className="pointer-events-auto flex w-full max-w-2xl flex-col items-center gap-2 sm:gap-5">
            <div className="text-center">
              <h1 className="text-2xl text-cream sm:text-3xl md:text-5xl">
                Git{" "}
                <span style={{ color: theme.accent }}>Universe</span>
              </h1>
              <p className="mt-2 text-[10px] leading-relaxed text-cream/80 normal-case">
                {stats.total_companies > 0
                  ? `A Universe of ${stats.total_companies.toLocaleString()} GitHub companies. Find yourself.`
                  : "A global Universe of GitHub companies. Find yourself."}
              </p>
              <p className="pointer-events-auto mt-1 text-[9px] text-cream/50 normal-case hidden sm:block">
                built by{" "}
                <a
                  href="https://x.com/samuelrizzondev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-cream"
                  style={{ color: theme.accent }}
                >
                  @samuelrizzondev
                </a>
              </p>
            </div>

            {/* Milestone progress banner — hidden on mobile to reduce clutter */}
            <div className="hidden sm:flex sm:justify-center w-full">
              {MILESTONE_MODE === "stars" ? (
                // ── GitHub Stars mode ──
                (() => {
                  if (starCount == null) return null;
                  const STAR_MILESTONES = [100, 250, 500, 1000, 2500, 5000];
                  const target = STAR_MILESTONES.find((m) => starCount < m);
                  if (!target) return null;
                  const prev = STAR_MILESTONES[STAR_MILESTONES.indexOf(target) - 1] ?? 0;
                  const progress = ((starCount - prev) / (target - prev)) * 100;
                  const remaining = target - starCount;
                  const label = target >= 1000 ? `${target / 1000}K` : target.toLocaleString();
                  return (
                    <a
                      href="https://github.com/srizzon/git-Universe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full max-w-sm group"
                    >
                      <div className="border-2 border-border bg-bg/80 px-4 py-3 backdrop-blur-sm transition-colors group-hover:border-[var(--hover-border)]" style={{ "--hover-border": theme.accent } as React.CSSProperties}>
                        <div className="mb-2 flex items-baseline justify-between">
                          <span className="text-[9px] tracking-wider" style={{ color: theme.accent }}>
                            ROAD TO {label} STARS
                          </span>
                          <span className="text-[9px] text-cream/60">
                            {remaining.toLocaleString()} to go
                          </span>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden border-2 border-border bg-bg">
                          <div
                            className="absolute inset-y-0 left-0 transition-all duration-1000"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: theme.accent,
                              boxShadow: `0 0 8px ${theme.accent}60`,
                            }}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-[10px] text-cream">
                            {starCount.toLocaleString()} <span className="text-cream/40">/ {target.toLocaleString()}</span>
                          </span>
                          <span className="text-[8px] text-cream/40 normal-case group-hover:text-cream/60 transition-colors">
                            Star us on GitHub
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })()
              ) : (
                // ── Total companies mode ──
                (() => {
                  const MILESTONES = [10000, 20000, 50000, 100000];
                  const count = stats.total_companies;
                  if (count <= 0) return null;

                  const target = MILESTONES.find((m) => count < m);
                  if (!target) return null;
                  const prev = MILESTONES[MILESTONES.indexOf(target) - 1] ?? 0;
                  const progress = ((count - prev) / (target - prev)) * 100;
                  const remaining = target - count;
                  const label = target >= 1000 ? `${target / 1000}K` : target.toLocaleString();
                  return (
                    <div className="w-full max-w-sm">
                      <div className="border-[2px] border-border bg-bg/80 px-4 py-3 backdrop-blur-sm">
                        <div className="mb-2 flex items-baseline justify-between">
                          <span className="text-[9px] tracking-wider" style={{ color: theme.accent }}>
                            ROAD TO {label}
                          </span>
                          <span className="text-[9px] text-cream/60">
                            {remaining.toLocaleString()} to go
                          </span>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden border-[2px] border-border bg-bg">
                          <div
                            className="absolute inset-y-0 left-0 transition-all duration-1000"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: theme.accent,
                              boxShadow: `0 0 8px ${theme.accent}60`,
                            }}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-[10px] text-cream">
                            {count.toLocaleString()} <span className="text-cream/40">/ {target.toLocaleString()}</span>
                          </span>
                          <span className="text-[8px] text-cream/40 normal-case">
                            Something unlocks at {label}...
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Search / Welcome CTA takeover */}
            {welcomeCtaVisible && !session ? (
              <div
                className="flex w-full max-w-md flex-col items-center gap-2 border-[3px] bg-bg-raised/90 px-5 py-4 backdrop-blur-sm animate-[slide-up_0.3s_ease-out]"
                style={{ borderColor: theme.accent }}
              >
                <p className="text-[11px] text-cream normal-case leading-relaxed">
                  Find your planet in the Universe
                </p>
                <button
                  onClick={() => {
                    setWelcomeCtaVisible(false);
                    localStorage.setItem("gitUniverse_welcome_seen", "true");
                    handleSignIn();
                  }}
                  className="btn-press w-full max-w-60 py-2.5 text-[10px] text-bg"
                  style={{
                    backgroundColor: theme.accent,
                    boxShadow: `3px 3px 0 0 ${theme.shadow}`,
                  }}
                >
                  Sign in with GitHub
                </button>
                <button
                  onClick={() => {
                    setWelcomeCtaVisible(false);
                    localStorage.setItem("gitUniverse_welcome_seen", "true");
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="text-[9px] text-dim transition-colors hover:text-muted normal-case"
                >
                  or type your username
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-md items-center gap-2"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (feedback?.type === "error") setFeedback(null);
                  }}
                  placeholder={session ? "search any GitHub username" : "type your GitHub username"}
                  className="min-w-0 flex-1 border-[3px] border-border bg-bg-raised px-3 py-2 text-base sm:text-xs text-cream outline-none transition-colors placeholder:text-dim sm:px-4 sm:py-2.5"
                  style={{ borderColor: undefined }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                />
                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="btn-press shrink-0 px-4 py-2 text-xs text-bg disabled:opacity-40 sm:px-5 sm:py-2.5"
                  style={{
                    backgroundColor: theme.accent,
                    boxShadow: `4px 4px 0 0 ${theme.shadow}`,
                  }}
                >
                  {loading ? <span className="blink-dot inline-block">_</span> : "Search"}
                </button>
              </form>
            )}

            {/* Search Feedback: loading phases + errors */}
            <SearchFeedback feedback={feedback} accentColor={theme.accent} onDismiss={() => setFeedback(null)} onRetry={searchUser} />

            {/* Loading indicator removed — LoadingScreen overlay handles this */}

            {/* ─── Friday the 13th Event Banner (inline) ─── */}
            {isFridayThe13th() && (
              <div className="flex items-center gap-2 border-2 border-red-500/40 bg-red-950/30 px-3 py-1.5 sm:px-4 sm:py-2">
                <span className="text-sm shrink-0">&#128128;</span>
                <span className="font-silkscreen text-[9px] sm:text-[10px] uppercase tracking-wider text-red-400 whitespace-nowrap">
                  Friday the 13th
                </span>
                <span className="text-[9px] text-red-400/40">|</span>
                <span className="text-[9px] sm:text-[10px] text-orange-300/80 whitespace-nowrap">
                  Unlimited battles, no cooldowns
                </span>
              </div>
            )}
          </div>

          {/* Center - Explore buttons + Shop + Auth */}
          {planets.length > 0 && (
            <div className="pointer-events-auto flex flex-col items-center gap-2 sm:gap-3">
              {/* Free Gift CTA — above primary actions */}
              {hasFreeGift && (
                <button
                  onClick={handleClaimFreeGift}
                  disabled={claimingGift}
                  className="gift-cta btn-press px-7 py-3 text-xs sm:py-3.5 sm:text-sm text-bg disabled:opacity-60"
                  style={{
                    backgroundColor: theme.accent,
                    ["--gift-glow-color" as string]: theme.accent + "66",
                    ["--gift-shadow-color" as string]: theme.shadow,
                  }}
                >
                  {claimingGift ? "Opening..." : "\uD83C\uDF81 Open Free Gift!"}
                </button>
              )}

              {/* Primary actions */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setExploreMode(true)}
                  className="btn-press px-7 py-3 text-xs sm:py-3.5 sm:text-sm text-bg"
                  style={{
                    backgroundColor: theme.accent,
                    boxShadow: `4px 4px 0 0 ${theme.shadow}`,
                  }}
                >
                  Explore Universe
                </button>
                {!isMobile && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setfocusedPlanet(null);
                        setFlyMode(true);
                        setFlyScore({ score: 0, earned: 0, combo: 0, collected: 0, maxCombo: 1 });
                        flyStartTime.current = Date.now();
                        flyPausedAt.current = 0;
                        flyTotalPauseMs.current = 0;
                        setFlyElapsedSec(0);
                        try { setFlyPersonalBest(parseInt(localStorage.getItem("gitUniverse_fly_pb") || "0", 10) || 0); } catch { setFlyPersonalBest(0); }
                        // Feature 3: show controls overlay on first flight
                        if (!localStorage.getItem("gitUniverse_fly_controls_seen")) {
                          setShowFlyControls(true);
                        }
                      }}
                      className="btn-press px-7 py-3 text-xs sm:py-3.5 sm:text-sm text-bg"
                      style={{
                        backgroundColor: theme.accent,
                        boxShadow: `4px 4px 0 0 ${theme.shadow}`,
                      }}
                    >
                      <span className="relative">
                        &#9992; Fly
                        <span
                          className="absolute -top-3 -right-8 animate-pulse rounded-sm px-1 py-px text-[7px] font-bold leading-none text-bg"
                          style={{ backgroundColor: theme.accent }}
                        >
                          NEW
                        </span>
                      </span>
                      <span className="block text-[8px] opacity-60 normal-case">Collect PX</span>
                    </button>
                    {/* Feature 2: First-Fly Tooltip */}
                    {showFlyHint && (
                      <div className="absolute bottom-full left-1/2 z-30 mb-3 -translate-x-1/2 animate-[fade-in_0.3s_ease-out]">
                        <div
                          className="relative w-64 border-2 border-border bg-bg-raised px-4 py-3 text-center backdrop-blur-sm"
                          style={{ borderColor: theme.accent + "60" }}
                        >
                          <p className="text-[10px] leading-relaxed text-cream normal-case">
                            Fly over your Universe. Collect coins. Compete on the daily leaderboard.
                          </p>
                          <button
                            onClick={() => {
                              setShowFlyHint(false);
                              clearTimeout(flyHintTimerRef.current);
                              try { localStorage.setItem("gitUniverse_fly_hint_seen", "1"); } catch { }
                            }}
                            className="mt-2 px-3 py-1 text-[9px] text-bg"
                            style={{ backgroundColor: theme.accent }}
                          >
                            Got it
                          </button>
                          {/* Downward arrow */}
                          <div
                            className="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent"
                            style={{ borderTopColor: theme.accent + "60" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Feature 1: Daily Challenge Nudge */}
              {showDailyNudge && (
                <div className="animate-[slide-up_0.3s_ease-out] flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowDailyNudge(false);
                      clearTimeout(dailyNudgeTimerRef.current);
                      setfocusedPlanet(null);
                      setFlyMode(true);
                      setFlyScore({ score: 0, earned: 0, combo: 0, collected: 0, maxCombo: 1 });
                      flyStartTime.current = Date.now();
                      flyPausedAt.current = 0;
                      flyTotalPauseMs.current = 0;
                      setFlyElapsedSec(0);
                      try { setFlyPersonalBest(parseInt(localStorage.getItem("gitUniverse_fly_pb") || "0", 10) || 0); } catch { setFlyPersonalBest(0); }
                      if (!localStorage.getItem("gitUniverse_fly_controls_seen")) {
                        setShowFlyControls(true);
                      }
                    }}
                    className="btn-press flex items-center gap-2 border-2 bg-bg/80 px-4 py-1.5 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
                    style={{ borderColor: theme.accent + "60", color: theme.accent }}
                  >
                    <span className="normal-case">Today&apos;s challenge is live</span>
                    <span>Play &#8594;</span>
                  </button>
                  <button
                    onClick={() => { setShowDailyNudge(false); clearTimeout(dailyNudgeTimerRef.current); }}
                    className="text-[10px] text-muted transition-colors hover:text-cream"
                  >
                    &#10005;
                  </button>
                </div>
              )}

              {/* Nav + Auth — desktop only (mobile uses bottom bar) */}
              <div className="hidden sm:flex items-center justify-center gap-2">
                <Link
                  href={shopHref}
                  className="btn-press border-[3px] border-border bg-bg/80 px-4 py-1.5 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
                  style={{ color: theme.accent }}
                >
                  Shop
                </Link>
                <Link
                  href="/advertise"
                  className="btn-press relative border-[3px] px-4 py-1.5 text-[10px] backdrop-blur-sm transition-colors"
                  style={{ color: theme.accent, borderColor: theme.accent + "60", backgroundColor: theme.accent + "12" }}
                >
                  Place your Ad
                  <span
                    className="absolute -top-1.5 -right-2 rounded-sm px-1 py-px text-[7px] font-bold leading-none text-bg"
                    style={{ backgroundColor: theme.accent }}
                  >
                    NEW
                  </span>
                </Link>
                <Link
                  href="/leaderboard"
                  className="btn-press border-[3px] border-border bg-bg/80 px-4 py-1.5 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
                  style={{ color: theme.accent }}
                >
                  &#9819; Leaderboard
                </Link>
              </div>
              <div className="hidden sm:flex items-center justify-center gap-2">
                {!session ? (
                  <button
                    onClick={handleSignIn}
                    className="btn-press flex items-center gap-1.5 border-[3px] border-border bg-bg/80 px-3 py-1.5 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
                  >
                    <span style={{ color: theme.accent }}>G</span>
                    <span className="text-cream">Sign in</span>
                  </button>
                ) : (
                  <>
                    {canClaim && (
                      <button
                        onClick={handleClaim}
                        disabled={claiming}
                        className="btn-press px-3 py-1.5 text-[10px] text-bg disabled:opacity-40"
                        style={{
                          backgroundColor: theme.accent,
                          boxShadow: `2px 2px 0 0 ${theme.shadow}`,
                        }}
                      >
                        {claiming ? "..." : "Claim"}
                      </button>
                    )}
                    <Link
                      href={`/dev/${authLogin}`}
                      className="flex items-center gap-1.5 border-[3px] border-border bg-bg/80 px-3 py-1.5 text-[10px] text-cream normal-case backdrop-blur-sm transition-colors hover:border-border-light"
                      style={streakData && streakData.streak > 0 && streakData.checked_in ? { animation: "streak-pulse 1.5s ease-in-out 2" } : undefined}
                    >
                      @{authLogin}
                      {streakData && streakData.streak > 0 && (
                        <span className="flex items-center gap-0.5" style={{ color: getStreakTierColor(streakData.streak) }}>
                          <span className="text-[9px] leading-none">🔥</span>
                          <span className="font-bold">{streakData.streak}</span>
                        </span>
                      )}
                    </Link>
                    {myplanet?.claimed && (
                      <XpBar
                        xpTotal={myplanet.xp_total ?? 0}
                        xpLevel={myplanet.xp_level ?? 1}
                        accent={theme.accent}
                      />
                    )}
                    <button
                      onClick={handleSignOut}
                      className="border-2 border-border bg-bg/80 px-2 py-1 text-[9px] text-muted backdrop-blur-sm transition-colors hover:text-cream hover:border-border-light"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bottom — leaderboard only (info + theme moved to fixed elements) */}
          <div className="pointer-events-auto flex w-full items-end justify-end">
            {/* Mini Leaderboard - hidden on mobile, rotates categories */}
            {planets.length > 0 && (
              <MiniLeaderboard planets={planets} accent={theme.accent} />
            )}
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Bar (game-style nav) ─── */}
      {!flyMode && !exploreMode && !introMode && !rabbitCinematic && planets.length > 0 && (
        <nav className="pointer-events-auto fixed inset-x-0 bottom-0 z-35 hidden items-center justify-around border-t-2 border-border bg-bg/95 px-1 py-2 backdrop-blur-md sm:hidden">
          <Link
            href={shopHref}
            className="btn-press border-2 border-border px-3 py-1.5 text-[10px] transition-colors active:bg-white/5"
            style={{ color: theme.accent }}
          >
            Shop
          </Link>
          <Link
            href="/advertise"
            className="btn-press relative border-2 px-3 py-1.5 text-[10px] transition-colors active:bg-white/5"
            style={{ color: theme.accent, borderColor: theme.accent + "60", backgroundColor: theme.accent + "12" }}
          >
            Ad
            <span
              className="absolute -top-1.5 -right-1.5 rounded-sm px-0.5 py-px text-[6px] font-bold leading-none text-bg"
              style={{ backgroundColor: theme.accent }}
            >
              NEW
            </span>
          </Link>
          <Link
            href="/leaderboard"
            className="btn-press border-2 border-border px-3 py-1.5 text-[10px] transition-colors active:bg-white/5"
            style={{ color: theme.accent }}
          >
            &#9819; Rank
          </Link>
          {!session ? (
            <button
              onClick={handleSignIn}
              className="btn-press border-2 border-border px-3 py-1.5 text-[10px] transition-colors active:bg-white/5"
            >
              <span style={{ color: theme.accent }}>G</span>{" "}
              <span className="text-cream">Sign in</span>
            </button>
          ) : (
            <>
              {canClaim && (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="btn-press px-3 py-1.5 text-[10px] text-bg disabled:opacity-40"
                  style={{ backgroundColor: theme.accent, boxShadow: `2px 2px 0 0 ${theme.shadow}` }}
                >
                  {claiming ? "..." : "Claim"}
                </button>
              )}
              <Link
                href={`/dev/${authLogin}`}
                className="btn-press flex items-center gap-1 border-2 border-border px-3 py-1.5 text-[10px] text-cream normal-case transition-colors active:bg-white/5"
              >
                @{authLogin.length > 8 ? authLogin.slice(0, 7) + "…" : authLogin}
                {streakData && streakData.streak > 0 && (
                  <span className="flex items-center gap-0.5" style={{ color: getStreakTierColor(streakData.streak) }}>
                    <span className="text-[8px]">🔥</span>
                    <span className="font-bold">{streakData.streak}</span>
                  </span>
                )}
              </Link>
            </>
          )}
        </nav>
      )}

      {/* ─── Purchase Toast ─── */}
      {purchasedItem && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2">
          <div
            className="border-[3px] px-5 py-2.5 text-[10px] text-bg"
            style={{
              backgroundColor: theme.accent,
              borderColor: theme.shadow,
            }}
          >
            Item purchased! Effect applied to your planet.
          </div>
        </div>
      )}

      {/* ─── Gift Toast ─── */}
      {giftedInfo && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2">
          <div
            className="flex items-center gap-2 border-[3px] px-5 py-2.5 text-[10px] text-bg"
            style={{
              backgroundColor: theme.accent,
              borderColor: theme.shadow,
            }}
          >
            <span className="text-base">🎁</span>
            <span>{ITEM_NAMES[giftedInfo.item] ?? giftedInfo.item} sent to {giftedInfo.to}!</span>
          </div>
        </div>
      )}

      {/* ─── A1: Sign-in prompt after planet exploration ─── */}
      {signInPromptVisible && !session && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-xs animate-[slide-up_0.2s_ease-out]">
          <div className="border-[3px] border-border bg-bg-raised/95 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] text-cream normal-case mb-2.5 leading-relaxed">
              Sign in to give Kudos, battle planets, and claim yours
            </p>
            <button
              onClick={() => {
                trackSignInPromptClicked();
                setSignInPromptVisible(false);
                handleSignIn();
              }}
              className="btn-press w-full py-2 text-[10px] text-bg"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `2px 2px 0 0 ${theme.shadow}`,
              }}
            >
              Sign in with GitHub
            </button>
            <button
              onClick={() => setSignInPromptVisible(false)}
              className="mt-1.5 w-full py-1 text-[8px] text-dim transition-colors hover:text-muted"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ─── A5: Ad redirect toast ─── */}
      {adToast && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 animate-[fade-in_0.15s_ease-out]">
          <div
            className="border-[3px] px-5 py-2.5 text-[10px] text-bg"
            style={{
              backgroundColor: theme.accent,
              borderColor: theme.shadow,
            }}
          >
            Opening {adToast} &rarr;
          </div>
        </div>
      )}

      {/* ─── A8: Ghost preview CTA ─── */}
      {ghostPreviewLogin && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-xs animate-[slide-up_0.2s_ease-out]">
          <div
            className="border-[3px] bg-bg-raised/95 px-4 py-3 backdrop-blur-sm"
            style={{ borderColor: theme.accent }}
          >
            <p className="text-[10px] text-cream normal-case mb-2 leading-relaxed">
              Unlock effects for your planet
            </p>
            <p className="text-[8px] text-muted normal-case mb-2.5">
              Neon Outline, Particle Aura, Spotlight, and more
            </p>
            <Link
              href={myplanet?.claimed ? `/shop/${ghostPreviewLogin}` : `/dev/${ghostPreviewLogin}`}
              onClick={() => setGhostPreviewLogin(null)}
              className="btn-press block w-full py-2 text-center text-[10px] text-bg"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `2px 2px 0 0 ${theme.shadow}`,
              }}
            >
              {myplanet?.claimed ? "Customize" : "Claim & Customize"} &rarr;
            </Link>
            <button
              onClick={() => setGhostPreviewLogin(null)}
              className="mt-1.5 w-full py-1 text-[8px] text-dim transition-colors hover:text-muted"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ─── A12: Streak reward toast ─── */}
      {streakData?.streak_reward && streakData.checked_in && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-xs animate-[slide-up_0.2s_ease-out]">
          <div
            className="border-[3px] bg-bg-raised/95 px-4 py-3 backdrop-blur-sm text-center"
            style={{ borderColor: theme.accent }}
          >
            <p className="text-lg mb-1">🎁</p>
            <p className="text-[10px] text-cream normal-case mb-1 font-bold">
              {streakData.streak_reward.milestone}-day streak reward!
            </p>
            <p className="text-[9px] normal-case mb-2" style={{ color: theme.accent }}>
              You unlocked {streakData.streak_reward.item_name}
            </p>
            <Link
              href={`/shop/${authLogin}`}
              className="btn-press block w-full py-1.5 text-center text-[9px] text-bg"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `2px 2px 0 0 ${theme.shadow}`,
              }}
            >
              Equip now &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ─── planet Profile Card ─── */}
      {/* Desktop: right edge, vertically centered. Mobile: bottom sheet, centered. */}
      {selectedPlanet && (!flyMode || flyPaused) && !comparePair && raidState.phase === "idle" && (
        <>
          {/* Nav hints — only on desktop, bottom-right */}
          <div className="pointer-events-none fixed bottom-6 right-6 z-30 hidden text-right text-[9px] leading-loose text-muted sm:block">
            <div><span className="text-cream">Drag</span> orbit</div>
            <div><span className="text-cream">Scroll</span> zoom</div>
            <div><span style={{ color: theme.accent }}>ESC</span> close</div>
          </div>

          {/* Card container — mobile: bottom sheet, desktop: fixed right side */}
          <div className="pointer-events-auto fixed z-40
            bottom-0 left-0 right-0
            sm:bottom-auto sm:left-auto sm:right-5 sm:top-1/2 sm:-translate-y-1/2"
          >
            <div className="relative border-t-[3px] border-border bg-bg-raised/95 backdrop-blur-sm
              w-full max-h-[50vh] overflow-y-auto sm:w-[320px] sm:border-[3px] sm:max-h-[85vh]
              animate-[slide-up_0.2s_ease-out] sm:animate-none"
            >
              {/* Close */}
              <button
                onClick={() => { setselectedPlanet(null); setfocusedPlanet(null); }}
                className="absolute top-2 right-3 text-[10px] text-muted transition-colors hover:text-cream z-10"
              >
                ESC
              </button>

              {/* Drag handle on mobile */}
              <div className="flex justify-center py-2 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              {/* Header with avatar + name */}
              <div className="flex items-center gap-3 px-4 pb-3 sm:pt-4">
                {selectedPlanet.avatar_url && (
                  <Image
                    src={selectedPlanet.avatar_url}
                    alt={selectedPlanet.login}
                    width={48}
                    height={48}
                    className="border-2 border-border shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {selectedPlanet.name && (
                      <p className="truncate text-sm text-cream">{selectedPlanet.name}</p>
                    )}
                    {selectedPlanet.claimed && (
                      <span
                        className="shrink-0 px-1.5 py-0.5 text-[7px] text-bg"
                        style={{ backgroundColor: theme.accent }}
                      >
                        Claimed
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-muted">@{selectedPlanet.login}</p>
                  {selectedPlanet.active_raid_tag && (
                    <p className="text-[8px] text-red-400">
                      Attacked by @{selectedPlanet.active_raid_tag.attacker_login}
                    </p>
                  )}
                </div>
              </div>

              {/* XP Level badge + progress */}
              {(() => {
                const bTier = tierFromLevel(selectedPlanet.xp_level ?? 1);
                const bRank = rankFromLevel(selectedPlanet.xp_level ?? 1);
                const bProgress = levelProgress(selectedPlanet.xp_total ?? 0);
                const bXpCurrent = (selectedPlanet.xp_total ?? 0) - xpForLevel(selectedPlanet.xp_level ?? 1);
                const bXpNeeded = xpForLevel((selectedPlanet.xp_level ?? 1) + 1) - xpForLevel(selectedPlanet.xp_level ?? 1);
                return (
                  <div className="mx-4 mb-2 flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center border-2 text-xs font-bold"
                      style={{ borderColor: bTier.color, color: bTier.color }}
                    >
                      {selectedPlanet.xp_level ?? 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold" style={{ color: bTier.color }}>
                          Lv {selectedPlanet.xp_level ?? 1} · {bRank.title}
                        </span>
                        <span
                          className="px-1 py-px text-[7px] font-bold"
                          style={{ backgroundColor: bTier.color + "22", color: bTier.color }}
                        >
                          {bTier.name.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-1 flex-1 bg-border">
                          <div
                            className="h-full"
                            style={{ width: `${Math.max(2, Math.round(bProgress * 100))}%`, backgroundColor: bTier.color }}
                          />
                        </div>
                        <span className="text-[7px] text-muted">{bXpCurrent}/{bXpNeeded}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* constellation badge */}
              {selectedPlanet.constellation && (
                <div className="px-4 pb-2">
                  <span
                    className="inline-block px-2 py-0.5 text-[8px] text-bg"
                    style={{ backgroundColor: CONSTELLATION_COLORS[selectedPlanet.constellation] ?? '#888' }}
                  >
                    {CONSTELLATION_NAMES[selectedPlanet.constellation] ?? selectedPlanet.constellation}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-px bg-border/30 mx-4 mb-3 border border-border/50">
                {[
                  { label: "Rank", value: `#${selectedPlanet.rank}` },
                  { label: "Contribs", value: selectedPlanet.contributions.toLocaleString() },
                  { label: "Repos", value: selectedPlanet.public_repos.toLocaleString() },
                  { label: "Yield", value: `${selectedPlanet.yield_percent >= 0 ? '+' : ''}${selectedPlanet.yield_percent.toFixed(1)}%` },
                  { label: "Stars", value: selectedPlanet.total_stars.toLocaleString() },
                  { label: "Kudos", value: (selectedPlanet.kudos_count ?? 0).toLocaleString() },
                  { label: "Visits", value: (selectedPlanet.visit_count ?? 0).toLocaleString() },
                ].map((s) => (
                  <div key={s.label} className="bg-bg-card p-2 text-center">
                    <p className="text-[8px] uppercase text-dim">{s.label}</p>
                    <p 
                      className="text-[10px] font-bold text-cream"
                      style={s.label === "Yield" ? { color: selectedPlanet.yield_percent >= 0 ? '#4ade80' : '#f87171' } : undefined}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Achievements with tier colors, sorted by tier */}
              {selectedPlanet.achievements && selectedPlanet.achievements.length > 0 && (
                <div className="mx-4 mb-3 flex flex-wrap gap-1">
                  {[...selectedPlanet.achievements]
                    .sort((a, b) => {
                      const tierOrder = ["diamond", "gold", "silver", "bronze"];
                      const ta = tierOrder.indexOf(ACHIEVEMENT_TIERS_MAP[a] ?? "bronze");
                      const tb = tierOrder.indexOf(ACHIEVEMENT_TIERS_MAP[b] ?? "bronze");
                      return ta - tb;
                    })
                    .slice(0, 3)
                    .map((ach) => {
                      const tier = ACHIEVEMENT_TIERS_MAP[ach];
                      const color = tier ? TIER_COLORS_MAP[tier] : undefined;
                      const emoji = tier ? TIER_EMOJI_MAP[tier] : "";
                      return (
                        <span
                          key={ach}
                          className="px-1.5 py-0.5 text-[8px] border normal-case"
                          style={{
                            borderColor: color ?? "rgba(255,255,255,0.15)",
                            color: color ?? "#a0a0b0",
                          }}
                        >
                          {emoji} {ACHIEVEMENT_NAMES_MAP[ach] ?? ach.replace(/_/g, " ")}
                        </span>
                      );
                    })}
                  {selectedPlanet.achievements.length > 3 && (
                    <Link
                      href={`/dev/${selectedPlanet.login}`}
                      className="px-1.5 py-0.5 text-[8px] transition-colors hover:text-cream"
                      style={{ color: theme.accent }}
                    >
                      +{selectedPlanet.achievements.length - 3} more &rarr;
                    </Link>
                  )}
                </div>
              )}

              {/* A7: Show equipped items on other companies' planets (mimetic desire) */}
              {selectedPlanet.login.toLowerCase() !== authLogin && (() => {
                const equipped: string[] = [];
                if (selectedPlanet.loadout?.crown) equipped.push(selectedPlanet.loadout.crown);
                if (selectedPlanet.loadout?.roof) equipped.push(selectedPlanet.loadout.roof);
                if (selectedPlanet.loadout?.aura) equipped.push(selectedPlanet.loadout.aura);
                for (const fi of ["custom_color", "billboard", "led_banner"]) {
                  if (selectedPlanet.owned_items.includes(fi)) equipped.push(fi);
                }
                if (equipped.length === 0) return null;
                const shown = equipped.slice(0, 3);
                const extra = equipped.length - 3;
                return (
                  <div
                    className="mx-4 mb-3 border-2 p-2.5"
                    style={{ borderColor: `${theme.accent}33`, backgroundColor: `${theme.accent}08` }}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {shown.map((id) => (
                        <span
                          key={id}
                          className="text-[9px] normal-case"
                          style={{ color: theme.accent }}
                        >
                          {ITEM_EMOJIS[id] ?? "🎁"} {ITEM_NAMES[id] ?? id}
                        </span>
                      ))}
                      {extra > 0 && (
                        <span className="text-[9px] text-muted">
                          +{extra} more
                        </span>
                      )}
                    </div>
                    {session && (
                      <Link
                        href={`/shop/${authLogin}`}
                        className="btn-press mt-2 block w-full py-1.5 text-center text-[9px] text-bg"
                        style={{
                          backgroundColor: theme.accent,
                          boxShadow: `2px 2px 0 0 ${theme.shadow}`,
                        }}
                      >
                        Get these for your planet
                      </Link>
                    )}
                  </div>
                );
              })()}

              {/* Kudos: give kudos (other's planet, logged in) */}
              {session && selectedPlanet.login.toLowerCase() !== authLogin && (
                <div className="relative mx-4 mb-3">
                  {/* Floating emoji animation on success */}
                  {kudosSent && (
                    <div className="pointer-events-none absolute inset-0 overflow-visible">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span
                          key={i}
                          className="kudos-float absolute text-sm"
                          style={{
                            left: `${15 + i * 14}%`,
                            animationDelay: `${i * 0.08}s`,
                          }}
                        >
                          {["👏", "⭐", "💛", "✨", "👏", "⭐"][i]}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleGiveKudos}
                    disabled={kudosSending || kudosSent || !!kudosError}
                    className={[
                      "btn-press w-full py-2 text-[10px] text-bg transition-all duration-300",
                      kudosSent ? "scale-[1.02]" : "",
                    ].join(" ")}
                    style={{
                      backgroundColor: kudosError ? "#ff4444" : kudosSent ? "#39d353" : theme.accent,
                      boxShadow: kudosError
                        ? "0 0 12px rgba(255,68,68,0.4)"
                        : kudosSent
                          ? "0 0 12px rgba(57,211,83,0.4)"
                          : `2px 2px 0 0 ${theme.shadow}`,
                    }}
                  >
                    {kudosSending ? (
                      <span className="animate-pulse">Sending...</span>
                    ) : kudosError ? (
                      <span>{kudosError}</span>
                    ) : kudosSent ? (
                      <span>+1 Kudos!</span>
                    ) : (
                      "Give Kudos"
                    )}
                  </button>
                  <button
                    onClick={handleOpenGift}
                    className="btn-press mt-1.5 w-full border-2 border-border py-1.5 text-[9px] text-cream transition-colors hover:border-border-light"
                  >
                    Send Gift
                  </button>
                  {/* Raid button */}
                  {raidState.phase === "idle" && raidState.error && (
                    <p className="mt-1.5 text-center text-[10px] text-red-400">{raidState.error}</p>
                  )}
                  <button
                    onClick={() => {
                      if (authLogin && selectedPlanet) {
                        raidActions.startPreview(selectedPlanet.login, planets, authLogin);
                      }
                    }}
                    disabled={raidState.loading}
                    className="btn-press mt-1.5 w-full border-[3px] border-red-500/60 px-4 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    {raidState.loading ? "Loading..." : "\u2694\ufe0f BATTLE \u2014 Win +50 XP"}
                  </button>
                </div>
              )}

              {/* A3: Disabled action buttons for non-logged users */}
              {!session && (
                <div className="mx-4 mb-3 space-y-1.5">
                  <button
                    onClick={() => { trackDisabledButtonClicked("kudos"); handleSignIn(); }}
                    className="btn-press w-full py-2 text-[10px] border-2 border-dashed border-border/50 text-muted/60 transition-colors hover:border-border hover:text-muted"
                  >
                    &#x1F512; Give Kudos
                  </button>
                  <button
                    onClick={() => { trackDisabledButtonClicked("gift"); handleSignIn(); }}
                    className="btn-press w-full py-1.5 text-[9px] border-2 border-dashed border-border/50 text-muted/60 transition-colors hover:border-border hover:text-muted"
                  >
                    &#x1F512; Send Gift
                  </button>
                  <button
                    onClick={() => { trackDisabledButtonClicked("raid"); handleSignIn(); }}
                    className="btn-press w-full py-2 text-[10px] border-2 border-dashed border-red-500/30 text-red-400/40 transition-colors hover:border-red-500/60 hover:text-red-400/70"
                  >
                    &#x1F512; &#x2694;&#xFE0F; BATTLE
                  </button>
                </div>
              )}

              {/* Own planet: copy invite link */}
              {selectedPlanet.login.toLowerCase() === authLogin && (
                <div className="mx-4 mb-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/?ref=${authLogin}`
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="btn-press w-full border-2 border-border py-1.5 text-center text-[9px] text-cream transition-colors hover:border-border-light"
                  >
                    {copied ? "Copied!" : "\uD83D\uDCCB Copy Invite Link"}
                  </button>
                </div>
              )}

              {/* Compare button */}
              {!flyMode && (
                <div className="mx-4 mb-3">
                  <button
                    onClick={() => {
                      setcomparePlanet(selectedPlanet);
                      setselectedPlanet(null);
                      if (!exploreMode) setExploreMode(true);
                    }}
                    className="btn-press w-full border-2 border-border py-1.5 text-center text-[9px] text-cream transition-colors hover:border-border-light"
                  >
                    Compare
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 p-4 pt-0 pb-5 sm:pb-4">
                {selectedPlanet.login.toLowerCase() === authLogin ? (
                  <>
                    <Link
                      href={`/shop/${selectedPlanet.login}?tab=loadout`}
                      className="btn-press flex-1 py-2 text-center text-[10px] text-bg"
                      style={{
                        backgroundColor: theme.accent,
                        boxShadow: `2px 2px 0 0 ${theme.shadow}`,
                      }}
                    >
                      Loadout
                    </Link>
                    <Link
                      href={`/dev/${selectedPlanet.login}`}
                      className="btn-press flex-1 border-2 border-border py-2 text-center text-[10px] text-cream transition-colors hover:border-border-light"
                    >
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/dev/${selectedPlanet.login}`}
                      className="btn-press flex-1 py-2 text-center text-[10px] text-bg"
                      style={{
                        backgroundColor: theme.accent,
                        boxShadow: `2px 2px 0 0 ${theme.shadow}`,
                      }}
                    >
                      View Profile
                    </Link>
                    <a
                      href={`https://github.com/${selectedPlanet.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-press flex-1 border-2 border-border py-2 text-center text-[10px] text-cream transition-colors hover:border-border-light"
                    >
                      GitHub
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Compare Pick Prompt ─── */}
      {comparePlanet && !comparePair && !flyMode && (
        <div className="fixed top-3 left-1/2 z-40 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm sm:top-4 sm:w-auto">
          <div className="border-[3px] border-border bg-bg-raised/95 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="blink-dot h-2 w-2 shrink-0"
                style={{ backgroundColor: theme.accent }}
              />
              <span className="text-[10px] text-cream normal-case truncate min-w-0">
                Comparing <span style={{ color: theme.accent }}>@{comparePlanet.login}</span>
              </span>
              <button
                onClick={() => {
                  setselectedPlanet(comparePlanet);
                  setfocusedPlanet(comparePlanet.login);
                  setcomparePlanet(null);
                }}
                className="ml-1 shrink-0 text-[9px] text-muted transition-colors hover:text-cream"
              >
                Cancel
              </button>
            </div>
            {/* Self-compare hint */}
            {compareSelfHint && (
              <p className="mt-1 text-[9px] normal-case" style={{ color: "#f85149" }}>
                Pick a different planet to compare
              </p>
            )}
            {/* Search field for compare pick */}
            <form
              onSubmit={(e) => { e.preventDefault(); searchUser(); }}
              className="mt-2 flex items-center gap-2"
            >
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (feedback?.type === "error") setFeedback(null);
                }}
                placeholder="search username to compare"
                className="min-w-0 flex-1 border-2 border-border bg-bg px-2.5 py-1.5 text-base sm:text-[10px] text-cream outline-none transition-colors placeholder:text-dim"
                onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="btn-press shrink-0 px-3 py-1.5 text-[10px] text-bg disabled:opacity-40"
                style={{ backgroundColor: theme.accent }}
              >
                {loading ? "_" : "Go"}
              </button>
            </form>
            {feedback && (
              <div className="mt-1.5">
                <SearchFeedback feedback={feedback} accentColor={theme.accent} onDismiss={() => setFeedback(null)} onRetry={searchUser} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Comparison Panel ─── */}
      {comparePair && (() => {
        const compareStatDefs: { label: string; key: keyof CompanyPlanet; invert?: boolean }[] = [
          { label: "Rank", key: "rank", invert: true },
          { label: "Contributions", key: "contributions" },
          { label: "Stars", key: "total_stars" },
          { label: "Repos", key: "public_repos" },
          { label: "Kudos", key: "kudos_count" },
        ];
        let totalAWins = 0;
        let totalBWins = 0;
        const cmpRows = compareStatDefs.map((s) => {
          const a = (comparePair[0][s.key] as number) ?? 0;
          const b = (comparePair[1][s.key] as number) ?? 0;
          let aW = false, bW = false;
          if (s.invert) { aW = a > 0 && (a < b || b === 0); bW = b > 0 && (b < a || a === 0); }
          else { aW = a > b; bW = b > a; }
          if (aW) totalAWins++;
          if (bW) totalBWins++;
          return { ...s, a, b, aW, bW };
        });
        const cmpTie = totalAWins === totalBWins;
        const cmpWinner = totalAWins > totalBWins ? comparePair[0].login : comparePair[1].login;
        const cmpSummary = cmpTie
          ? `Tie ${totalAWins}-${totalBWins}`
          : `@${cmpWinner} wins ${Math.max(totalAWins, totalBWins)}-${Math.min(totalAWins, totalBWins)}`;

        const closeCompare = () => { setselectedPlanet(comparePair[0]); setfocusedPlanet(comparePair[0].login); setComparePair(null); setcomparePlanet(null); };

        return (
          <>
            {/* No fullscreen backdrop — let the user orbit the camera freely */}
            <div className="pointer-events-auto fixed z-40
            bottom-0 left-0 right-0
            sm:bottom-auto sm:left-auto sm:right-5 sm:top-1/2 sm:-translate-y-1/2"
            >
              <div className="relative border-t-[3px] border-border bg-bg-raised/95 backdrop-blur-sm
              w-full sm:w-95 sm:border-[3px] sm:max-h-[85vh] sm:overflow-y-auto
              max-h-[45vh] overflow-y-auto
              animate-[slide-up_0.2s_ease-out] sm:animate-none"
              >
                {/* Drag handle on mobile - swipe down to close */}
                <div
                  className="flex justify-center py-2 sm:hidden"
                  onTouchStart={(e) => { (e.currentTarget as any)._touchY = e.touches[0].clientY; }}
                  onTouchEnd={(e) => { const start = (e.currentTarget as any)._touchY; if (start != null && e.changedTouches[0].clientY - start > 50) closeCompare(); }}
                >
                  <div className="h-1 w-10 rounded-full bg-border" />
                </div>

                {/* ── Header: Avatars + VS ── */}
                <div className="flex items-start justify-center gap-5 px-5 pt-1 pb-4 sm:pt-4">
                  <Link href={`/dev/${comparePair[0].login}`} className="flex flex-col items-center gap-1.5 group w-27.5">
                    {comparePair[0].avatar_url && (
                      <Image
                        src={comparePair[0].avatar_url}
                        alt={comparePair[0].login}
                        width={56}
                        height={56}
                        className="border-[3px] transition-colors group-hover:brightness-110"
                        style={{
                          imageRendering: "pixelated",
                          borderColor: totalAWins >= totalBWins ? theme.accent : "#3a3a40",
                        }}
                      />
                    )}
                    <p className="truncate text-[10px] text-cream normal-case max-w-27.5 transition-colors group-hover:text-white">@{comparePair[0].login}</p>
                    <p className="text-[8px] text-muted normal-case text-center">{getDevClass(comparePair[0].login)}</p>
                  </Link>

                  <span className="text-base shrink-0 pt-4" style={{ color: theme.accent }}>VS</span>

                  <Link href={`/dev/${comparePair[1].login}`} className="flex flex-col items-center gap-1.5 group w-27.5">
                    {comparePair[1].avatar_url && (
                      <Image
                        src={comparePair[1].avatar_url}
                        alt={comparePair[1].login}
                        width={56}
                        height={56}
                        className="border-[3px] transition-colors group-hover:brightness-110"
                        style={{
                          imageRendering: "pixelated",
                          borderColor: totalBWins >= totalAWins ? theme.accent : "#3a3a40",
                        }}
                      />
                    )}
                    <p className="truncate text-[10px] text-cream normal-case max-w-27.5 transition-colors group-hover:text-white">@{comparePair[1].login}</p>
                    <p className="text-[8px] text-muted normal-case text-center">{getDevClass(comparePair[1].login)}</p>
                  </Link>
                </div>

                {/* ── Scoreboard ── */}
                <div className="mx-4 border-[2px] border-border bg-bg-card">
                  {cmpRows.map((s, i) => (
                    <div
                      key={s.key}
                      className={`flex items-center py-2 px-3 ${i < cmpRows.length - 1 ? "border-b border-border/40" : ""}`}
                    >
                      <span
                        className="w-[72px] text-right text-[11px] tabular-nums"
                        style={{ color: s.aW ? theme.accent : s.bW ? "#555" : "#888" }}
                      >
                        {s.key === "rank" ? (s.a > 0 ? `#${s.a}` : "-") : s.a.toLocaleString()}
                      </span>
                      <span className="flex-1 text-center text-[8px] text-muted uppercase tracking-wider">
                        {s.label}
                      </span>
                      <span
                        className="w-[72px] text-left text-[11px] tabular-nums"
                        style={{ color: s.bW ? theme.accent : s.aW ? "#555" : "#888" }}
                      >
                        {s.key === "rank" ? (s.b > 0 ? `#${s.b}` : "-") : s.b.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ── Winner banner ── */}
                <div
                  className="mx-4 mt-3 py-2.5 text-center text-[11px] uppercase tracking-wide"
                  style={{
                    backgroundColor: `${theme.accent}15`,
                    border: `2px solid ${theme.accent}40`,
                    color: theme.accent,
                  }}
                >
                  {cmpSummary}
                </div>

                {/* ── Actions ── */}
                <div className="px-4 pt-3 pb-1 flex gap-2">
                  <a
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                      `I just compared my planet with ${comparePair[1].login}'s in Git Universe. It wasn't even close. What's yours?`
                    )}&url=${encodeURIComponent(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/compare/${comparePair[0].login}/${comparePair[1].login}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press flex-1 py-2 text-center text-[10px] text-bg"
                    style={{
                      backgroundColor: theme.accent,
                      boxShadow: `2px 2px 0 0 ${theme.shadow}`,
                    }}
                  >
                    Share on X
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/compare/${comparePair[0].login}/${comparePair[1].login}`
                      );
                      setCompareCopied(true);
                      setTimeout(() => setCompareCopied(false), 2000);
                    }}
                    className="btn-press flex-1 border-[2px] border-border py-2 text-center text-[10px] text-cream transition-colors hover:border-border-light"
                  >
                    {compareCopied ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                {/* Download with lang toggle */}
                <div className="px-4 flex items-center gap-2 pb-1">
                  <div className="flex gap-0.5 shrink-0">
                    {(["en", "pt"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setCompareLang(l)}
                        className="px-2 py-0.5 text-[9px] uppercase transition-colors"
                        style={{
                          color: compareLang === l ? theme.accent : "#666",
                          borderBottom: compareLang === l ? `2px solid ${theme.accent}` : "2px solid transparent",
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/compare-card/${comparePair[0].login}/${comparePair[1].login}?format=landscape&lang=${compareLang}`);
                      if (!res.ok) return;
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `gitUniverse-${comparePair[0].login}-vs-${comparePair[1].login}.png`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-press flex-1 border-2 border-border py-1.5 text-center text-[9px] text-cream transition-colors hover:border-border-light"
                  >
                    Card
                  </button>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/compare-card/${comparePair[0].login}/${comparePair[1].login}?format=stories&lang=${compareLang}`);
                      if (!res.ok) return;
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `gitUniverse-${comparePair[0].login}-vs-${comparePair[1].login}-stories.png`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-press flex-1 border-[2px] border-border py-1.5 text-center text-[9px] text-cream transition-colors hover:border-border-light"
                  >
                    Stories
                  </button>
                </div>

                {/* Compare Again + Close */}
                <div className="flex gap-2 px-4 pt-1 pb-5 sm:pb-4">
                  <button
                    onClick={() => {
                      const first = comparePair[0];
                      setComparePair(null);
                      setcomparePlanet(first);
                      setfocusedPlanet(first.login);
                    }}
                    className="btn-press flex-1 border-[2px] border-border py-2 text-center text-[10px] text-cream transition-colors hover:border-border-light"
                  >
                    Compare Again
                  </button>
                  <button
                    onClick={closeCompare}
                    className="btn-press flex-1 border-[2px] border-border py-2 text-center text-[10px] text-cream transition-colors hover:border-border-light"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ─── Invite Card (dev not in Universe yet) ─── */}
      {invitePreview && !flyMode && (
        <InviteCard
          company={invitePreview}
          isLoggedIn={!!session}
          onLogin={handleSignIn}
          onClose={() => setInvitePreview(null)}
          accent={theme.accent}
          shadow={theme.shadow}
        />
      )}

      {/* ─── Share Modal ─── */}
      {shareData && !flyMode && !exploreMode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={() => { setShareData(null); setselectedPlanet(null); setfocusedPlanet(null); }}
          />

          {/* Modal */}
          <div className="relative mx-3 border-[3px] border-border bg-bg-raised p-4 text-center sm:mx-0 sm:p-6">
            {/* Close */}
            <button
              onClick={() => { setShareData(null); setselectedPlanet(null); setfocusedPlanet(null); }}
              className="absolute top-2 right-3 text-[10px] text-muted transition-colors hover:text-cream"
            >
              &#10005;
            </button>

            {/* Avatar */}
            {shareData.avatar_url && (
              <Image
                src={shareData.avatar_url}
                alt={shareData.login}
                width={48}
                height={48}
                className="mx-auto mb-3 border-2 border-border"
                style={{ imageRendering: "pixelated" }}
              />
            )}

            <p className="text-xs text-cream normal-case">
              <span style={{ color: theme.accent }}>@{shareData.login}</span> joined the Universe!
            </p>

            <p className="mt-2 text-[10px] text-muted normal-case">
              Rank <span style={{ color: theme.accent }}>#{shareData.rank ?? "?"}</span>
              {" · "}
              <span style={{ color: theme.accent }}>{shareData.contributions.toLocaleString()}</span> contributions
            </p>

            {/* Buttons */}
            <div className="mt-4 flex flex-col items-center gap-2 sm:mt-5 sm:flex-row sm:justify-center sm:gap-3">
              <button
                onClick={() => {
                  if (!selectedPlanet && shareData) {
                    const b = planets.find(
                      (b) => b.login.toLowerCase() === shareData.login.toLowerCase()
                    );
                    if (b) setselectedPlanet(b);
                  }
                  setShareData(null);
                  setExploreMode(true);
                }}
                className="btn-press px-4 py-2 text-[10px] text-bg"
                style={{
                  backgroundColor: theme.accent,
                  boxShadow: `3px 3px 0 0 ${theme.shadow}`,
                }}
              >
                Explore planet
              </button>

              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `My GitHub just turned into a planet. ${shareData.contributions.toLocaleString()} contributions, Rank #${shareData.rank ?? "?"}. What does yours look like?`
                )}&url=${encodeURIComponent(
                  `${window.location.origin}/dev/${shareData.login}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackShareClicked("x")}
                className="btn-press border-[3px] border-border px-4 py-2 text-[10px] text-cream transition-colors hover:border-border-light"
              >
                Share on X
              </a>

              <button
                onClick={() => {
                  trackShareClicked("copy_link");
                  navigator.clipboard.writeText(
                    `${window.location.origin}/dev/${shareData.login}`
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn-press border-[3px] border-border px-4 py-2 text-[10px] text-cream transition-colors hover:border-border-light"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* View profile link */}
            <a
              href={`/dev/${shareData.login}`}
              className="mt-4 inline-block text-[9px] text-muted transition-colors hover:text-cream normal-case"
            >
              View full profile &rarr;
            </a>
          </div>
        </div>
      )}

      {/* ─── Sky Ad Card ─── */}
      {clickedAd && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setClickedAd(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setClickedAd(null); }}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          {/* Desktop: centered card. Mobile: bottom sheet */}
          <div className="pointer-events-none flex h-full items-end sm:items-center sm:justify-center">
            <div
              className="pointer-events-auto relative w-full border-t-[3px] border-border bg-bg-raised/95 backdrop-blur-sm
                sm:w-85 sm:mx-4 sm:border-[3px]
                animate-[slide-up_0.2s_ease-out] sm:animate-[fade-in_0.15s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setClickedAd(null)}
                className="absolute top-2 right-3 text-[10px] text-muted transition-colors hover:text-cream z-10 cursor-pointer"
              >
                ESC
              </button>

              {/* Drag handle on mobile */}
              <div className="flex justify-center py-2 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              {/* Header: brand + sponsored tag */}
              <div className="flex items-center gap-3 px-4 pb-3 sm:pt-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center border-2"
                  style={{ borderColor: clickedAd.color, color: clickedAd.color }}
                >
                  <span className="text-sm">{clickedAd.vehicle === "blimp" ? "\u25C6" : clickedAd.vehicle === "billboard" ? "\uD83D\uDCCB" : clickedAd.vehicle === "rooftop_sign" ? "\uD83D\uDD04" : clickedAd.vehicle === "led_wrap" ? "\uD83D\uDCA1" : "\u2708"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  {clickedAd.brand && (
                    <p className="truncate text-sm text-cream">{clickedAd.brand}</p>
                  )}
                  <p className="text-[9px] text-dim">Sponsored</p>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-4 mb-3 h-px bg-border" />

              {/* Description */}
              {clickedAd.description && (
                <p className="mx-4 mb-4 text-xs text-cream normal-case leading-relaxed">
                  {clickedAd.description}
                </p>
              )}

              {/* CTA */}
              {clickedAd.link && (() => {
                const ctaHref = buildAdLink(clickedAd) ?? clickedAd.link;
                const isMailto = clickedAd.link.startsWith("mailto:");
                return (
                  <div className="px-4 pb-5 sm:pb-4">
                    <a
                      href={ctaHref}
                      target={isMailto ? undefined : "_blank"}
                      rel={isMailto ? undefined : "noopener noreferrer"}
                      className="btn-press block w-full py-2.5 text-center text-[10px] text-bg"
                      style={{
                        backgroundColor: theme.accent,
                        boxShadow: `4px 4px 0 0 ${theme.shadow}`,
                      }}
                      onClick={() => {
                        track("sky_ad_click", { ad_id: clickedAd.id, vehicle: clickedAd.vehicle, brand: clickedAd.brand ?? "" });
                        trackAdEvent(clickedAd.id, "cta_click", authLogin || undefined);
                        trackSkyAdCtaClick(clickedAd.id, clickedAd.vehicle);
                      }}
                    >
                      {isMailto
                        ? "Send Email \u2192"
                        : `Visit ${new URL(clickedAd.link!).hostname.replace("www.", "")} \u2192`}
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom-left controls: Theme + Radio (portal slot) + Intro ─── */}
      {!flyMode && !introMode && !rabbitCinematic && !exploreMode && (
        <div className="pointer-events-auto fixed bottom-8 left-3 z-25 flex flex-col-reverse items-start gap-2 sm:bottom-10 sm:left-4 sm:flex-row sm:items-center">
          <button
            onClick={cycleTheme}
            className="btn-press flex items-center gap-1.5 border-[3px] border-border bg-bg/70 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
          >
            <span style={{ color: theme.accent }}>&#9654;</span>
            <span className="text-cream">{theme.name}</span>
            <span className="text-dim">{themeIndex + 1}/{THEMES.length}</span>
          </button>
          <div id="gc-radio-slot" suppressHydrationWarning />
          <button
            onClick={replayIntro}
            className="btn-press flex items-center gap-1 border-[3px] border-border bg-bg/70 px-2 py-1 text-[10px] backdrop-blur-sm transition-colors hover:border-border-light"
            title="Replay intro"
          >
            <span style={{ color: theme.accent }}>&#9654;</span>
            <span className="text-cream">Intro</span>
          </button>
        </div>
      )}


      {/* ─── Daily Missions (quest tracker, right side) ─── */}
      {session && myplanet?.claimed && !flyMode && !introMode && !exploreMode && !rabbitCinematic && (
        <DailiesWidget
          data={dailiesData}
          accent={theme.accent}
          shadow={theme.shadow}
          isMobile={isMobile}
          onClaim={claimDailies}
          onRefresh={refreshDailies}
        />
      )}

      {/* ─── Daily mission progress toasts (top-center, always visible) ─── */}
      {dailyToasts.length > 0 && (
        <div className="pointer-events-none fixed left-1/2 top-4 z-60 flex -translate-x-1/2 flex-col items-center gap-1.5">
          {dailyToasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-none border-2 border-border bg-bg-raised/95 px-4 py-2 text-[11px] backdrop-blur-sm"
              style={{ animation: "toastDrop 0.3s ease-out, toastOut 0.4s ease-in 2s forwards", borderColor: t.done ? theme.accent : undefined }}
            >
              <span style={{ color: theme.accent }}>{t.done ? "\u2713" : "\u2606"}</span>
              {" "}{t.title}{t.done ? " \u2014 Complete!" : ""}
            </div>
          ))}
          <style jsx>{`
            @keyframes toastDrop {
              from { opacity: 0; transform: translateY(-16px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes toastOut {
              from { opacity: 1; }
              to { opacity: 0; transform: translateY(-8px); }
            }
          `}</style>
        </div>
      )}

      {/* ─── Level Up Toast ─── */}
      {levelUpLevel !== null && (
        <LevelUpToast level={levelUpLevel} onDone={() => setLevelUpLevel(null)} />
      )}

      {/* ─── Activity Ticker ─── */}
      {!flyMode && !introMode && !rabbitCinematic && feedEvents.length >= 1 && (
        <ActivityTicker
          events={feedEvents}
          hasBottomBar={false}
          onEventClick={(evt) => {
            if (comparePlanet || comparePair) return;
            const login = evt.actor?.login;
            if (login) {
              setfocusedPlanet(login);
              const found = planets.find(b => b.login.toLowerCase() === login.toLowerCase());
              if (found) {
                setselectedPlanet(found);
                if (!exploreMode) setExploreMode(true);
              }
            }
          }}
          onOpenPanel={() => setFeedPanelOpen(true)}
        />
      )}

      {/* ─── Gift Modal ─── */}
      {giftModalOpen && selectedPlanet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={() => { setGiftModalOpen(false); setGiftItems(null); }}
          />
          <div className="relative z-10 w-full max-w-70 border-[3px] border-border bg-bg-raised">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-xs" style={{ color: theme.accent }}>Send Gift</h3>
                <p className="mt-0.5 text-[8px] text-muted normal-case">to @{selectedPlanet.login}</p>
              </div>
              <button
                onClick={() => { setGiftModalOpen(false); setGiftItems(null); }}
                className="text-xs text-muted hover:text-cream"
              >
                &#10005;
              </button>
            </div>

            {/* Items */}
            {giftItems === null ? (
              <p className="py-8 text-center text-[9px] text-dim normal-case animate-pulse">
                Loading...
              </p>
            ) : giftItems.length === 0 ? (
              <p className="py-8 text-center text-[9px] text-dim normal-case">
                No items available
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto scrollbar-thin">
                {giftItems.map((item) => {
                  const isBuying = giftBuying === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => !item.owned && handleGiftCheckout(item.id)}
                      disabled={!!giftBuying || item.owned}
                      className={`flex w-full items-center gap-3 border-b border-border/30 px-4 py-2.5 text-left transition-colors ${item.owned ? "opacity-35 cursor-not-allowed" : "hover:bg-bg-card/80 disabled:opacity-40"}`}
                    >
                      <span className="text-base shrink-0">{ITEM_EMOJIS[item.id] ?? "🎁"}</span>
                      <span className="flex-1 text-[10px] text-cream">
                        {ITEM_NAMES[item.id] ?? item.id}
                      </span>
                      <span className="text-[10px] shrink-0" style={{ color: item.owned ? undefined : theme.accent }}>
                        {item.owned ? "Owned" : isBuying ? "..." : `$${(item.price_usd_cents / 100).toFixed(2)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Activity Panel (slide-in) ─── */}
      <ActivityPanel
        initialEvents={feedEvents}
        open={feedPanelOpen}
        onClose={() => setFeedPanelOpen(false)}
        onNavigate={(login) => {
          if (comparePlanet || comparePair) return;
          setFeedPanelOpen(false);
          setfocusedPlanet(login);
          const found = planets.find(b => b.login.toLowerCase() === login.toLowerCase());
          if (found) {
            setselectedPlanet(found);
            if (!exploreMode) setExploreMode(true);
          }
        }}
      />

      {/* ─── Feature 4: Post-Flight Results Modal ─── */}
      {showFlyResults && !flyMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={() => { setShowFlyResults(null); clearTimeout(flyResultsTimerRef.current); }}
          />
          {/* Modal */}
          <div
            className="relative mx-3 border-[3px] border-border bg-bg-raised p-5 text-center sm:mx-0 sm:p-7 animate-[gift-bounce_0.5s_ease-out]"
            style={{ borderColor: theme.accent + "60", minWidth: 280 }}
          >
            {/* Close */}
            <button
              onClick={() => { setShowFlyResults(null); clearTimeout(flyResultsTimerRef.current); }}
              className="absolute top-2 right-3 text-[10px] text-muted transition-colors hover:text-cream"
            >
              ESC
            </button>

            <p className="text-[9px] tracking-widest text-muted mb-1">FLIGHT COMPLETE</p>

            {/* Score */}
            <div className="text-3xl sm:text-4xl font-bold" style={{ color: theme.accent }}>
              {showFlyResults.score}
            </div>
            <p className="text-[9px] text-muted mt-0.5">points</p>

            {/* New PB badge */}
            {showFlyResults.isNewPB && (
              <div
                className="mt-2 inline-block rounded-sm px-2.5 py-0.5 text-[9px] font-bold text-bg animate-pulse"
                style={{ backgroundColor: theme.accent }}
              >
                NEW PERSONAL BEST!
              </div>
            )}

            {/* Stats grid */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-sm font-bold text-cream">{showFlyResults.collected}</div>
                <div className="text-[8px] text-muted">Collected</div>
              </div>
              <div>
                <div className="text-sm font-bold text-cream">{showFlyResults.maxCombo}x</div>
                <div className="text-[8px] text-muted">Max Combo</div>
              </div>
              <div>
                <div className="text-sm font-bold text-cream">+{showFlyResults.timeBonus}</div>
                <div className="text-[8px] text-muted">Time Bonus</div>
              </div>
            </div>

            {/* Rank */}
            {showFlyResults.rank > 0 && (
              <div className="mt-3 border-t border-border/40 pt-3">
                <span className="text-[9px] text-muted">Rank </span>
                <span className="text-sm font-bold" style={{ color: theme.accent }}>
                  #{showFlyResults.rank}
                </span>
                {showFlyResults.totalPilots > 0 && (
                  <span className="text-[9px] text-muted"> of {showFlyResults.totalPilots}</span>
                )}
              </div>
            )}

            {/* CTAs */}
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <button
                onClick={() => {
                  setShowFlyResults(null); clearTimeout(flyResultsTimerRef.current);
                  setfocusedPlanet(null);
                  setFlyMode(true);
                  setFlyScore({ score: 0, earned: 0, combo: 0, collected: 0, maxCombo: 1 });
                  flyStartTime.current = Date.now();
                  flyPausedAt.current = 0;
                  flyTotalPauseMs.current = 0;
                  setFlyElapsedSec(0);
                  try { setFlyPersonalBest(parseInt(localStorage.getItem("gitUniverse_fly_pb") || "0", 10) || 0); } catch { setFlyPersonalBest(0); }
                }}
                className="btn-press px-5 py-2 text-[10px] text-bg"
                style={{ backgroundColor: theme.accent, boxShadow: `3px 3px 0 0 ${theme.shadow}` }}
              >
                Fly Again
              </button>
              <Link
                href="/leaderboard?mode=game"
                onClick={() => { setShowFlyResults(null); clearTimeout(flyResultsTimerRef.current); }}
                className="btn-press border-2 border-border px-5 py-2 text-[10px] transition-colors hover:border-border-light"
                style={{ color: theme.accent }}
              >
                See Leaderboard
              </Link>
              <button
                onClick={() => { setShowFlyResults(null); clearTimeout(flyResultsTimerRef.current); }}
                className="text-[9px] text-muted transition-colors hover:text-cream"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Free Gift Celebration Modal ─── */}
      {giftClaimed && !flyMode && !exploreMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={() => setGiftClaimed(false)}
          />

          {/* Modal */}
          <div
            className="relative mx-3 border-[3px] border-border bg-bg-raised p-5 text-center sm:mx-0 sm:p-7 animate-[gift-bounce_0.5s_ease-out]"
            style={{ borderColor: theme.accent + "60" }}
          >
            {/* Close */}
            <button
              onClick={() => setGiftClaimed(false)}
              className="absolute top-2 right-3 text-[10px] text-muted transition-colors hover:text-cream"
            >
              ESC
            </button>

            <div className="text-3xl sm:text-4xl mb-3">{"\uD83C\uDF89"}</div>

            <p className="text-sm text-cream sm:text-base">Gift Unlocked!</p>

            <div
              className="mt-4 inline-flex items-center gap-3 border-2 border-border bg-bg-card px-5 py-3"
            >
              <span className="text-2xl">{"\uD83C\uDFC1"}</span>
              <div className="text-left">
                <p className="text-xs text-cream">Flag</p>
                <p className="text-[9px] text-muted normal-case">
                  A flag on top of your planet
                </p>
              </div>
            </div>

            {/* Upsell strip */}
            <div className="mt-5 w-full max-w-70">
              <p className="mb-2 text-[9px] tracking-widest text-muted uppercase">
                Upgrade your planet
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: "\uD83C\uDF3F", name: "Garden", price: "$0.75" },
                  { emoji: "\u2728", name: "Neon", price: "$1.00" },
                  { emoji: "\uD83D\uDD25", name: "Fire", price: "$1.00" },
                ].map((item) => (
                  <Link
                    key={item.name}
                    href={shopHref}
                    onClick={() => setGiftClaimed(false)}
                    className="flex flex-col items-center gap-1 border-2 border-border bg-bg-card px-2 py-2.5 transition-colors hover:border-border-light"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[8px] text-cream leading-tight">
                      {item.name}
                    </span>
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: theme.accent }}
                    >
                      {item.price}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <button
                onClick={() => {
                  setGiftClaimed(false);
                  if (myplanet) {
                    setfocusedPlanet(myplanet.login);
                    setselectedPlanet(myplanet);
                    setExploreMode(true);
                  }
                }}
                className="btn-press px-5 py-2.5 text-[10px] text-bg"
                style={{
                  backgroundColor: theme.accent,
                  boxShadow: `3px 3px 0 0 ${theme.shadow}`,
                }}
              >
                View in Universe
              </button>
              <Link
                href={shopHref}
                onClick={() => setGiftClaimed(false)}
                className="btn-press border-[3px] border-border px-5 py-2 text-[10px] text-cream transition-colors hover:border-border-light"
              >
                Visit Shop {"→"}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mark streak achievements as seen on check-in */}

      {/* Raid Preview Modal */}
      {raidState.phase === "preview" && raidState.previewData && (
        <RaidPreviewModal
          preview={raidState.previewData}
          loading={raidState.loading}
          error={raidState.error}
          onRaid={(boostPurchaseId, vehicleId) => raidActions.executeRaid(boostPurchaseId, vehicleId)}
          onCancel={raidActions.exitRaid}
        />
      )}

      {/* Raid Overlay (cinema bars + text + share) */}
      {raidState.phase !== "idle" && raidState.phase !== "preview" && (
        <RaidOverlay
          phase={raidState.phase}
          raidData={raidState.raidData}
          onSkip={raidActions.skipToShare}
          onExit={raidActions.exitRaid}
        />
      )}

      {/* constellation chooser modal */}
      {constellationChooserOpen && myplanet && (
        <constellationChooser
          currentconstellation={myplanet.constellation ?? null}
          inferredconstellation={myplanet.constellation ?? null}
          onClose={() => { sessionStorage.setItem("constellation_dismissed", "1"); setconstellationChooserOpen(false); }}
          onChosen={(constellationId) => {
            sessionStorage.setItem("constellation_dismissed", "1");
            setconstellationChooserOpen(false);
            // Update the planet in local state
            setPlanets((prev) =>
              prev.map((b) =>
                b.login === myplanet.login
                  ? { ...b, constellation: constellationId, constellation_chosen: true }
                  : b
              )
            );
          }}
        />
      )}

      {/* Founder's Landmark modals */}
      {pillModalOpen && (
        <PillModal
          rabbitCompleted={rabbitProgress >= 5}
          onRedPill={() => {
            setPillModalOpen(false);
            setFounderMessageOpen(true);
          }}
          onBluePill={() => {
            setPillModalOpen(false);
            if (rabbitProgress >= 5) return;
            setRabbitSighting(rabbitProgress + 1);
            setRabbitCinematic(true);
          }}
          onClose={() => setPillModalOpen(false)}
        />
      )}
      {founderMessageOpen && (
        <FounderMessage
          onClose={() => setFounderMessageOpen(false)}
          session={session}
          hasClaimed={!!myplanet?.claimed}
          onSignIn={handleSignInWithRef}
        />
      )}

      {/* Rabbit Quest Cinematic Overlay */}
      {rabbitCinematic && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Letterbox bars */}
          <div
            className="absolute inset-x-0 top-0 origin-top bg-black/80 transition-transform duration-700"
            style={{ height: "12%", transform: rabbitCinematicPhase >= 0 ? "scaleY(1)" : "scaleY(0)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 origin-bottom bg-black/80 transition-transform duration-700"
            style={{ height: "18%", transform: rabbitCinematicPhase >= 0 ? "scaleY(1)" : "scaleY(0)" }}
          />

          {/* CRT scanlines */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,65,0.08) 1px, rgba(0,255,65,0.08) 2px)",
              backgroundSize: "100% 2px",
            }}
          />

          {/* Text in lower bar */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center" style={{ height: "18%" }}>
            {["Follow the white rabbit...", "It hides among the plazas..."].map((text, i) => (
              <p
                key={i}
                className="absolute text-center font-pixel normal-case px-4"
                style={{
                  fontSize: "clamp(0.85rem, 3vw, 1.5rem)",
                  letterSpacing: "0.08em",
                  color: "#00ff41",
                  textShadow: "0 0 20px rgba(0,255,65,0.5), 0 0 40px rgba(0,255,65,0.2)",
                  opacity: rabbitCinematicPhase === i ? 1 : 0,
                  transition: "opacity 0.7s ease-in-out",
                }}
              >
                {text}
              </p>
            ))}
          </div>

          {/* Skip button */}
          <button
            className="pointer-events-auto absolute top-4 right-4 z-60 font-pixel text-[10px] sm:text-[12px] tracking-wider border border-[#00ff41]/40 px-3 py-1.5 transition-colors hover:bg-[#00ff41]/10"
            style={{
              color: "#00ff41",
              textShadow: "0 0 8px rgba(0,255,65,0.3)",
            }}
            onClick={endRabbitCinematic}
          >
            SKIP
          </button>
        </div>
      )}

      {/* Rabbit hint flash ("The rabbit moves deeper...") */}
      {rabbitHintFlash && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ animation: "rabbitHintAnim 3s ease-in-out forwards" }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <p
            className="relative font-pixel text-[14px] sm:text-[16px] tracking-widest text-center px-4"
            style={{
              color: "#00ff41",
              textShadow: "0 0 15px rgba(0,255,65,0.5), 0 0 30px rgba(0,255,65,0.2)",
            }}
          >
            {rabbitHintFlash}
          </p>
          <style jsx>{`
            @keyframes rabbitHintAnim {
              0% { opacity: 0; }
              15% { opacity: 1; }
              70% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Rabbit completion cinematic */}
      {rabbitCompletion && (
        <RabbitCompletion onComplete={() => setRabbitCompletion(false)} />
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
