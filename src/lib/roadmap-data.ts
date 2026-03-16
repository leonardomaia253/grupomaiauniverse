export type ItemStatus = "done" | "planet" | "planned";

export interface RoadmapItem {
  id: string;
  name: string;
  description?: string;
  status: ItemStatus;
  mystery?: boolean; // hides vote button, shows "???" vibe
}

export interface RoadmapPhase {
  id: string;
  title: string;
  quarter: string;
  status: ItemStatus;
  items: RoadmapItem[];
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "foundation",
    title: "FOUNDATION",
    quarter: "Q1 2026",
    status: "done",
    items: [
      {
        id: "3d-Universe-canvas",
        name: "3D Universe Canvas",
        description: "Interactive Three.js Universe built from real dados do Grupo Maia",
        status: "done",
      },
      {
        id: "github-oauth",
        name: "Company Profiles & Discovery",
        description: "Public profiles for all companies in the Universe",
        status: "done",
      },
      {
        id: "leaderboard",
        name: "Leaderboard & Compare",
        description: "Rankings by contributions, stars, repos + head-to-head comparison",
        status: "done",
      },
      {
        id: "cosmetic-shop",
        name: "Cosmetic Shop",
        description: "Customize your planet with crowns, auras, faces & more",
        status: "done",
      },
      {
        id: "ad-platform",
        name: "Ad Platform",
        description: "Self-service billboard ads inside the Universe",
        status: "done",
      },
      {
        id: "raid-system",
        name: "Battle System",
        description: "Visit and battle other companies' planets",
        status: "done",
      },
      {
        id: "Universe-flyover",
        name: "Universe Intro Flyover",
        description: "Cinematic camera flyover on first visit",
        status: "done",
      },
      {
        id: "constellations",
        name: "constellations",
        description: "10 specialized neighborhoods: Frontend, Backend, DevOps, and more",
        status: "done",
      },
      {
        id: "achievements",
        name: "Achievements",
        description: "Bronze to Diamond badges unlocked by milestones. Reward rare items and XP",
        status: "done",
      },
      {
        id: "notifications",
        name: "Notifications & Emails",
        description: "Achievement alerts, battle results, weekly digests, streak reminders",
        status: "done",
      },
      {
        id: "live-presence",
        name: "Live Presence",
        description: "See how many companies are online in the Universe right now",
        status: "done",
      },
      {
        id: "streak-checkin",
        name: "Streak & Check-in",
        description: "Daily check-in to keep your streak alive and earn XP",
        status: "done",
      },
    ],
  },
  {
    id: "the-game",
    title: "THE GAME",
    quarter: "Q2 2026",
    status: "planet",
    items: [
      {
        id: "xp-leveling",
        name: "XP & Leveling",
        description: "Earn XP from coding and exploring. Rank up from Localhost to Founder",
        status: "done",
      },
      {
        id: "dailies",
        name: "Standup / Dailies",
        description: "Quick daily missions: visit planets, give kudos, win battles, fly",
        status: "done",
      },
      {
        id: "street-mode",
        name: "Street Mode",
        description: "Walk around the Universe in third person with WASD controls",
        status: "planet",
      },
      {
        id: "onboarding",
        name: "Onboarding Tutorial",
        description: "Guided first 90 seconds: fly, explore, visit, learn the loop",
        status: "planet",
      },
      {
        id: "pixels-currency",
        name: "Pixels (PX) Currency",
        description: "Virtual currency earned through gameplay, spent on cosmetics & vehicles",
        status: "planned",
      },
      {
        id: "git-log",
        name: "Git Log / Passport",
        description: "Collect stamps by visiting planets. Complete constellations for badges",
        status: "planned",
      },
    ],
  },
  {
    id: "the-mystery",
    title: "THE MYSTERY",
    quarter: "Q3 2026",
    status: "planned",
    items: [
      {
        id: "vehicles",
        name: "Vehicles",
        description: "Unlock faster ways to travel as you level up",
        status: "planned",
      },
      {
        id: "mystery-1",
        name: "???",
        description: "Something lurks beneath the Universe...",
        status: "planned",
        mystery: true,
      },
      {
        id: "mystery-2",
        name: "???",
        description: "Secrets are everywhere. Can you find them?",
        status: "planned",
        mystery: true,
      },
      {
        id: "mystery-3",
        name: "???",
        description: "The creator hides things for those who look",
        status: "planned",
        mystery: true,
      },
    ],
  },
  {
    id: "the-status",
    title: "THE STATUS",
    quarter: "Q4 2026",
    status: "planned",
    items: [
      {
        id: "offshore",
        name: "The Offshore",
        description: "Exclusive zone for the top 3% of active players",
        status: "planned",
      },
      {
        id: "the-process",
        name: "The Process & The Queue",
        description: "Prove yourself worthy. Then wait your turn",
        status: "planned",
      },
      {
        id: "pro-plan",
        name: "Pro Plan",
        description: "Monthly subscription with premium perks",
        status: "planned",
      },
      {
        id: "season-branch",
        name: "Season Branch",
        description: "Seasonal battle pass with exclusive quests and rewards",
        status: "planned",
      },
    ],
  },
  {
    id: "the-Universe-lives",
    title: "THE Universe LIVES",
    quarter: "2027",
    status: "planned",
    items: [
      {
        id: "multiplayer",
        name: "Multiplayer Lite",
        description: "See other players as ghosts roaming the Universe",
        status: "planned",
      },
      {
        id: "driveby-firewall",
        name: "Drive-by Battles & Firewall",
        description: "Drive to a planet to battle it. Auto-shield after 3 battles/day",
        status: "planned",
      },
      {
        id: "living-Universe",
        name: "Living Universe",
        description: "NPCs, real-time commit pulses, visual decay for inactive planets",
        status: "planned",
      },
      {
        id: "live-ops",
        name: "Live Ops & Events",
        description: "Seasonal events, tournaments, and surprises from the creator",
        status: "planned",
      },
    ],
  },
];

// All valid item IDs (for server-side vote validation)
export const VALID_ITEM_IDS = new Set(
  ROADMAP_PHASES.flatMap((phase) => phase.items.map((item) => item.id))
);

// Items that can be voted on (not done, not mystery)
export const VOTABLE_ITEM_IDS = new Set(
  ROADMAP_PHASES.flatMap((phase) =>
    phase.items
      .filter((item) => item.status !== "done" && !item.mystery)
      .map((item) => item.id)
  )
);
