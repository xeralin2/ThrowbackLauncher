import type { ReactNode } from "react";

export type InfoOperator = {
  name: string;
  side: "attacker" | "defender";
  gadgetName: string;
  gadgetDesc: string;
  img?: string;
};

export type InfoMap = {
  name: string;
  img?: string;
};

export type SeasonInfoEntry = {
  release: string;
  operators: InfoOperator[];
  maps: InfoMap[];
  highlights: string[];
  art?: string;
  note?: ReactNode;
};

const SLOW_CLOSE_NOTE =
  "Closing this season from the in-game menu can take up to 10 seconds.";

export const SEASON_INFO: Record<string, SeasonInfoEntry> = {
  Y1S0_Vanilla: {
    release: "December 1, 2015",
    art: "Y1S0_Vanilla",
    operators: [],
    maps: [],
    highlights: [
      "5v5 attacker vs defender siege with bomb, hostage and secure area modes",
      "20 operators from five CTUs — SAS, FBI SWAT, GIGN, Spetsnaz, GSG 9 — and 10 maps",
      "**RealBlast** procedural destruction of walls, floors and ceilings",
      "**Situations** tutorial missions and **Terrorist Hunt** co-op against AI",
    ],
  },
  Y1S1_BlackIce: {
    release: "February 2, 2016",
    operators: [
      {
        name: "Buck",
        side: "attacker",
        gadgetName: "Skeleton Key",
        gadgetDesc: "adds an under-barrel 12 gauge shotgun for breaching",
      },
      {
        name: "Frost",
        side: "defender",
        gadgetName: "Welcome Mat",
        gadgetDesc: "floor trap that downs attackers who step on it",
      },
    ],
    maps: [{ name: "Yacht" }],
    highlights: [
      "First post-launch season — establishes the free-map DLC model",
      "Spectator camera on all platforms",
      "Seasonal Black Ice weapon skins",
    ],
  },
  Y1S2_DustLine: {
    release: "May 10, 2016",
    operators: [
      {
        name: "Blackbeard",
        side: "attacker",
        gadgetName: "TARS Rifle Shield",
        gadgetDesc: "transparent ballistic shield mounted on his rifle",
        img: "blackbeard-og",
      },
      {
        name: "Valkyrie",
        side: "defender",
        gadgetName: "Black Eye",
        gadgetDesc: "throwable sticky camera that gives defenders a live feed",
      },
    ],
    maps: [{ name: "Border", img: "border-y1s2" }],
    highlights: [
      "Between-round loadout changes",
      "Weapon charms, skins and operator headgear customization",
      "New weapons — MPX, SPAS-12, Mk17 CQB, SR-25 and D-50",
    ],
  },
  Y1S3_SkullRain: {
    release: "August 2, 2016",
    operators: [
      {
        name: "Capitão",
        side: "attacker",
        gadgetName: "Tactical Crossbow",
        gadgetDesc: "fires silent asphyxiating bolts and micro smoke grenades",
      },
      {
        name: "Caveira",
        side: "defender",
        gadgetName: "Silent Step",
        gadgetDesc: "makes her movement nearly silent while active",
      },
    ],
    maps: [{ name: "Favela", img: "favela-y1s3" }],
    highlights: [
      "Angled grip attachment for faster ADS transitions",
      "Surrender vote system for Ranked matches",
      "**Tactical Realism** custom game mode with minimal HUD",
      "**BattlEye** anti-cheat in patch `4.0`, alongside FairFight",
    ],
    note: SLOW_CLOSE_NOTE,
  },
  Y1S4_RedCrow: {
    release: "November 17, 2016",
    operators: [
      {
        name: "Hibana",
        side: "attacker",
        gadgetName: "X-KAIROS",
        gadgetDesc: "launches explosive pellets that breach reinforced walls",
        img: "hibana-og",
      },
      {
        name: "Echo",
        side: "defender",
        gadgetName: "Yokai",
        gadgetDesc:
          "ceiling-clinging drone that fires disorienting ultrasonic bursts",
      },
    ],
    maps: [{ name: "Skyscraper", img: "skyscraper-y1s4" }],
    highlights: [
      "Caliber-based destruction — bullet hole size scaled by weapon caliber",
      "Skyscraper — a Yakuza mansion high above Nagoya",
    ],
    note: SLOW_CLOSE_NOTE,
  },
  Y2S1_VelvetShell: {
    release: "February 7, 2017",
    operators: [
      {
        name: "Jackal",
        side: "attacker",
        gadgetName: "Eyenox Model III",
        gadgetDesc: "scans enemy footprints to track and ping their location",
      },
      {
        name: "Mira",
        side: "defender",
        gadgetName: "Black Mirror",
        gadgetDesc:
          "bulletproof, ejectable one-way mirror for reinforced or soft walls",
      },
    ],
    maps: [{ name: "Coastline", img: "coastline-y2s1" }],
    highlights: ["New weapons — C7E, PDW9 and Vector .45 ACP"],
    note: SLOW_CLOSE_NOTE,
  },
  Y2S2_Health: {
    release: "June 7, 2017",
    operators: [],
    maps: [],
    highlights: [
      "Maintenance season with no new operators or maps — technical fixes only",
      "One-step matchmaking with faster queue flow",
      "Hitboxes limited to the operator body, improved hit registration and servers",
      "Hong Kong season delayed and the Polish map cancelled",
    ],
  },
  Y2S3_BloodOrchid: {
    release: "September 5, 2017",
    operators: [
      {
        name: "Ying",
        side: "attacker",
        gadgetName: "Candela",
        gadgetDesc: "releases a cluster of flash charges to blind enemies",
      },
      {
        name: "Lesion",
        side: "defender",
        gadgetName: "Gu Mine",
        gadgetDesc: "injects a toxin that damages and slows enemies",
      },
      {
        name: "Ela",
        side: "defender",
        gadgetName: "Grzmot Mine",
        gadgetDesc: "proximity concussion mine that dazes and impairs hearing",
      },
    ],
    maps: [{ name: "Theme Park", img: "theme-park-y2s3" }],
    highlights: [
      "Biggest patch to date — sweeping texture, lighting and sky dome overhaul",
      "Extensive weapon, gadget and operator balance tweaks",
      "Three operators in one season after the Poland season merge",
    ],
  },
  Y2S4_WhiteNoise: {
    release: "December 5, 2017",
    operators: [
      {
        name: "Dokkaebi",
        side: "attacker",
        gadgetName: "Logic Bomb",
        gadgetDesc: "hacks defender phones to ring and reveal their positions",
        img: "dokkaebi-og",
      },
      {
        name: "Vigil",
        side: "defender",
        gadgetName: "ERC-7",
        gadgetDesc: "wipes his image from any cameras in view",
      },
      {
        name: "Zofia",
        side: "attacker",
        gadgetName: "KS79 Lifeline",
        gadgetDesc: "fires concussion and impact grenades from a launcher",
      },
    ],
    maps: [{ name: "Tower" }],
    highlights: [
      "**Withstand** self-revive from a downed state for Zofia",
      "Camera access for Dokkaebi through eliminated defenders' phones",
    ],
  },
  Y3S1_Chimera: {
    release: "March 6, 2018",
    operators: [
      {
        name: "Lion",
        side: "attacker",
        gadgetName: "EE-ONE-D",
        gadgetDesc: "aerial drone scans and pings moving enemies through walls",
      },
      {
        name: "Finka",
        side: "attacker",
        gadgetName: "Adrenal Surge",
        gadgetDesc: "boosts team health and revives downed allies",
      },
    ],
    maps: [],
    highlights: [
      "**Outbreak** — limited-time three-player PvE co-op against infected enemies",
      "First season with two attackers and no defender",
    ],
  },
  Y3S2_ParaBellum: {
    release: "June 7, 2018",
    operators: [
      {
        name: "Alibi",
        side: "defender",
        gadgetName: "Prisma",
        gadgetDesc:
          "deploys holograms that ping enemies who shoot or touch them",
      },
      {
        name: "Maestro",
        side: "defender",
        gadgetName: "Evil Eye",
        gadgetDesc: "deploys bulletproof remote cameras that fire laser bursts",
      },
    ],
    maps: [{ name: "Villa", img: "villa-y3s2" }],
    highlights: [
      "**Pick & Ban** operator draft settings",
      "Counter-defuser device replacing the melee defuser-disable animation",
      "ACS12 full-auto shotgun on both new operators",
      "Second Yokai drone for Echo plus Clubhouse map buffs",
    ],
  },
  Y3S3_GrimSky: {
    release: "September 4, 2018",
    operators: [
      {
        name: "Maverick",
        side: "attacker",
        gadgetName: "Breaching Torch",
        gadgetDesc:
          "silently burns small holes through reinforced walls and hatches",
      },
      {
        name: "Clash",
        side: "defender",
        gadgetName: "CCE Shield",
        gadgetDesc: "extendable shield that tasers enemies to slow them down",
        img: "clash-og",
      },
    ],
    maps: [{ name: "Hereford Base" }],
    highlights: [
      "Clash — the first shield-carrying defender",
      "First full map rework with Hereford Base",
      "Sight misalignment fixes and hatch destruction rework",
    ],
  },
  Y3S4_WindBastion: {
    release: "December 4, 2018",
    operators: [
      {
        name: "Nomad",
        side: "attacker",
        gadgetName: "Airjab Launcher",
        gadgetDesc:
          "launches repulsion grenades that knock back nearby enemies",
      },
      {
        name: "Kaid",
        side: "defender",
        gadgetName: "Rtila Electroclaw",
        gadgetDesc: "electrifies reinforced walls, hatches and barbed wire",
      },
    ],
    maps: [{ name: "Fortress", img: "fortress-y3s4" }],
    highlights: ["TCSG12 slug shotgun and AUG A3 SMG for Kaid"],
  },
  Y4S1_BurntHorizon: {
    release: "March 6, 2019",
    operators: [
      {
        name: "Gridlock",
        side: "attacker",
        gadgetName: "Trax Stingers",
        gadgetDesc:
          "deploys spreading spike traps that slow and damage enemies",
      },
      {
        name: "Mozzie",
        side: "defender",
        gadgetName: "Pest Launcher",
        gadgetDesc: "launches Pests that hack and steal attacker drones",
      },
    ],
    maps: [{ name: "Outback", img: "outback-y4s1" }],
    highlights: [
      "**Newcomer** playlist for players under level 50",
      "MMR rollback refunding rank changes from cheater matches",
      "Preset bomb sites and a 3:30 action phase in Casual",
    ],
  },
  Y4S2_PhantomSight: {
    release: "June 11, 2019",
    operators: [
      {
        name: "Nøkk",
        side: "attacker",
        gadgetName: "HEL Presence Reduction",
        gadgetDesc:
          "hides her from observation tools and muffles her footsteps",
      },
      {
        name: "Warden",
        side: "defender",
        gadgetName: "Glance Smart Glasses",
        gadgetDesc: "grants vision through smoke and protection from flashes",
      },
    ],
    maps: [{ name: "Kafe Dostoyevsky", img: "kafe-dostoyevsky-y4s2" }],
    highlights: [
      "**Pick & Ban**, Bomb mode and 3-round rotations standardized in Ranked",
      "Reverse friendly fire extended to all damage types",
    ],
  },
  Y4S3_EmberRise: {
    release: "September 11, 2019",
    operators: [
      {
        name: "Amaru",
        side: "attacker",
        gadgetName: "Garra Hook",
        gadgetDesc:
          "grapples to ledges, windows and open hatches for fast entry",
      },
      {
        name: "Goyo",
        side: "defender",
        gadgetName: "Volcán Shield",
        gadgetDesc: "deployable shield with an incendiary charge on the back",
      },
    ],
    maps: [{ name: "Kanal" }],
    highlights: [
      "**Unranked** playlist with the full Ranked ruleset",
      "**Champion** rank above Diamond at 5000+ MMR",
    ],
  },
  Y4S4_ShiftingTides: {
    release: "December 3, 2019",
    operators: [
      {
        name: "Kali",
        side: "attacker",
        gadgetName: "LV Explosive Lance",
        gadgetDesc:
          "fires a lance that destroys gadgets on both sides of walls",
      },
      {
        name: "Wamai",
        side: "defender",
        gadgetName: "Mag-NET System",
        gadgetDesc: "attracts enemy projectiles and detonates them near itself",
      },
    ],
    maps: [{ name: "Theme Park", img: "theme-park-y4s4" }],
    highlights: [
      "CSRX 300 — the first bolt-action sniper rifle",
      "Limb penetration added for most weapons",
      "Manual confirmation required for rappel exits",
    ],
  },
  Y5S1_VoidEdge: {
    release: "March 10, 2020",
    operators: [
      {
        name: "Iana",
        side: "attacker",
        gadgetName: "Gemini Replicator",
        gadgetDesc: "projects a remote-controlled holographic clone of Iana",
      },
      {
        name: "Oryx",
        side: "defender",
        gadgetName: "Remah Dash",
        gadgetDesc: "dashes to knock down enemies and smash through soft walls",
      },
    ],
    maps: [{ name: "Oregon", img: "oregon-y5s1" }],
    highlights: [
      "Attacker drone spawns made deterministic instead of random",
      "Barricade debris cleanup for consistent sightlines",
      "Oregon rework with new Kitchen corridor and expanded basement",
    ],
  },
  Y5S2_SteelWave: {
    release: "June 16, 2020",
    operators: [
      {
        name: "Ace",
        side: "attacker",
        gadgetName: "S.E.L.M.A. Aqua Breacher",
        gadgetDesc: "uses hydraulic pressure to breach reinforced surfaces",
      },
      {
        name: "Melusi",
        side: "defender",
        gadgetName: "Banshee Sonic Defense",
        gadgetDesc:
          "emits noise and slows attackers in range and line of sight",
      },
    ],
    maps: [{ name: "House" }],
    highlights: [
      "**Proximity Alarm** secondary gadget for defenders",
      "Unified global MMR replacing region-specific ranked ratings",
      "House rework with a new southern wing and revised bomb sites",
    ],
  },
  Y5S3_ShadowLegacy: {
    release: "September 10, 2020",
    operators: [
      {
        name: "Zero",
        side: "attacker",
        gadgetName: "ARGUS Launcher",
        gadgetDesc: "launches cameras that pierce walls and fire laser shots",
      },
    ],
    maps: [{ name: "Chalet", img: "chalet-y5s3" }],
    highlights: [
      "**Ping 2.0** contextual pinging, usable from cams and after death",
      "**Hard Breach Charge** secondary gadget for attackers",
      "Map ban voting before matches",
      "Optics overhaul with new 1.5x and 2.0x scopes",
    ],
  },
  Y5S4_NeonDawn: {
    release: "December 1, 2020",
    operators: [
      {
        name: "Aruni",
        side: "defender",
        gadgetName: "Surya Gate",
        gadgetDesc:
          "deploys a laser gate that damages attackers passing through",
      },
      {
        name: "Jäger",
        side: "defender",
        gadgetName: "Active Defense System",
        gadgetDesc: "unlimited projectile intercepts on a 10 second cooldown",
      },
    ],
    maps: [{ name: "Skyscraper", img: "skyscraper-y5s4" }],
    highlights: [
      "Echo's Yokai drone made permanently visible",
      "Runout detection timer cut from 2s to 1s",
      "PS5 and Xbox Series X|S versions launched alongside the season",
    ],
  },
  Y6S1_CrimsonHeist: {
    release: "March 16, 2021",
    operators: [
      {
        name: "Flores",
        side: "attacker",
        gadgetName: "RCE-Ratero Charge",
        gadgetDesc: "remote-controlled explosive drone that destroys gadgets",
      },
    ],
    maps: [{ name: "Border", img: "border-y6s1" }],
    highlights: [
      "Gonne-6 explosive secondary added to select attacker loadouts",
      "**Match Replay** on PC to re-watch matches from any angle",
      "Defuser auto-assigned if unclaimed at end of planning phase",
      "**Newcomer** playlist reworked with a rotating seasonal map",
    ],
  },
  Y6S2_NorthStar: {
    release: "June 14, 2021",
    operators: [
      {
        name: "Thunderbird",
        side: "defender",
        gadgetName: "Kóna Station",
        gadgetDesc: "deployable station that heals or revives nearby operators",
      },
    ],
    maps: [{ name: "Favela" }],
    highlights: [
      "Bulletproof Camera rework — rotation plus an EMP burst shot",
      "Smoke gas propagation rework stops gas passing through surfaces",
      "Death rework — skippable animations, bodies become transparent icons",
      "Melee now shatters Mira mirrors, Evil Eyes and bulletproof cams",
    ],
  },
  Y6S3_CrystalGuard: {
    release: "September 7, 2021",
    operators: [
      {
        name: "Osa",
        side: "attacker",
        gadgetName: "Talon-8 Clear Shield",
        gadgetDesc: "transparent bulletproof shield she carries or deploys",
      },
    ],
    maps: [
      { name: "Bank", img: "bank-y6s3" },
      { name: "Coastline", img: "coastline-y2s1" },
      { name: "Clubhouse", img: "clubhouse-y6s3" },
    ],
    highlights: [
      "Armor stat converted to HP with 100/110/125 health pools",
      "Individual attacker spawn selection in all playlists",
      "Ranked skill distribution rework with expanded Diamond tiers",
    ],
  },
  Y6S4_HighCalibre: {
    release: "November 30, 2021",
    operators: [
      {
        name: "Thorn",
        side: "defender",
        gadgetName: "Razorbloom Shell",
        gadgetDesc: "sticks to surfaces and bursts lethal blades near enemies",
      },
    ],
    maps: [{ name: "Outback" }],
    highlights: [
      "UZK50Gi .50-cal SMG for Thorn",
      "HUD rework with drone counter",
      "Customizable team colors, defaulting to blue vs red",
    ],
  },
  Y7S1_DemonVeil: {
    release: "March 15, 2022",
    operators: [
      {
        name: "Azami",
        side: "defender",
        gadgetName: "Kiba Barrier",
        gadgetDesc: "thrown kunai expands into a bulletproof barrier",
      },
      {
        name: "Goyo",
        side: "defender",
        gadgetName: "Volcán Canister",
        gadgetDesc: "incendiary canister that ignites when shot",
      },
    ],
    maps: [],
    highlights: [
      "Attacker repick — operator swaps during the prep phase",
      "**Team Deathmatch** added as a permanent playlist",
      "All non-magnifying sights unlocked on most weapons",
      "Emerald Plains map added mid-season",
    ],
  },
  Y7S2_VectorGlare: {
    release: "June 14, 2022",
    operators: [
      {
        name: "Sens",
        side: "attacker",
        gadgetName: "R.O.U. Projector System",
        gadgetDesc:
          "rolls and projects a light wall that blocks lines of sight",
      },
    ],
    maps: [{ name: "Close Quarter" }],
    highlights: [
      "**Shooting Range** with recoil and damage lanes for weapon testing",
      "Close Quarter — first map built for Team Deathmatch",
      "**Privacy Mode** and reputation penalties for reverse friendly fire",
      "POF-9 assault rifle for Sens",
    ],
  },
  Y7S3_BrutalSwarm: {
    release: "September 6, 2022",
    operators: [
      {
        name: "Grim",
        side: "attacker",
        gadgetName: "Kawan Hive Launcher",
        gadgetDesc: "launches bot swarms that reveal enemies passing through",
      },
    ],
    maps: [{ name: "Stadium Bravo", img: "stadium-bravo-y7s3" }],
    highlights: [
      "Recoil system overhaul on PC with progressive recoil",
      "Impact EMP grenade secondary gadget for 8 operators",
      "Rook armor plates grant **Withstand** when downed",
    ],
  },
  Y7S4_SolarRaid: {
    release: "December 6, 2022",
    operators: [
      {
        name: "Solis",
        side: "defender",
        gadgetName: "SPEC-IO Electro-Sensor",
        gadgetDesc: "detects and marks enemy electronic devices",
      },
    ],
    maps: [{ name: "Nighthaven Labs", img: "nighthaven-labs-y7s4" }],
    highlights: [
      "**Ranked 2.0** with Rank Points and new Emerald rank",
      "Crossplay between consoles and cross-progression on all platforms",
    ],
  },
  Y8S1_CommandingForce: {
    release: "March 7, 2023",
    operators: [
      {
        name: "Brava",
        side: "attacker",
        gadgetName: "Kludge Drone",
        gadgetDesc:
          "takes over enemy devices or destroys them if uncontrollable",
      },
    ],
    maps: [],
    highlights: [
      "Reload rework with round-in-chamber for closed-bolt weapons",
      "Playlists reorganized into Competitive, Quick Play and Training",
      "**MouseTrap** anti-cheat on consoles",
      "Operator specialties system with beginner challenges",
    ],
  },
  Y8S2_DreadFactor: {
    release: "May 30, 2023",
    operators: [
      {
        name: "Fenrir",
        side: "defender",
        gadgetName: "F-NATT Dread Mine",
        gadgetDesc: "releases fear gas that severely limits enemy vision",
      },
    ],
    maps: [{ name: "Consulate", img: "consulate-y8s2" }],
    highlights: [
      "**Observation Blocker** secondary gadget blocks drone line of sight",
      "**Arcade** playlist made permanent with new Free For All mode",
      "Free camera added to **Match Replay**",
    ],
  },
  Y8S3_HeavyMettle: {
    release: "August 29, 2023",
    operators: [
      {
        name: "Ram",
        side: "attacker",
        gadgetName: "BU-GI Auto-Breacher",
        gadgetDesc: "mini-tank that destroys breakable surfaces in its path",
      },
      {
        name: "Frost",
        side: "defender",
        gadgetName: "Welcome Mat",
        gadgetDesc:
          "floor trap that downs attackers, placeable under barbed wire",
      },
    ],
    maps: [],
    highlights: [
      "**Quick Match 2.0** and new Standard playlist replace Unranked",
      "Shotgun overhaul and Grim Kawan Hive buff",
      "**Weapon Roulette** permanent arcade mode",
      "Commendation system for positive player behavior",
    ],
  },
  Y8S4_DeepFreeze: {
    release: "December 6, 2023",
    operators: [
      {
        name: "Tubarão",
        side: "defender",
        gadgetName: "Zoto Canister",
        gadgetDesc: "throwable canister that freezes devices and slows enemies",
      },
    ],
    maps: [{ name: "Lair", img: "lair-y8s4" }],
    highlights: [
      "Frag grenade rework — cooking removed, shorter fuse times",
      "**Versus AI** playlist and new Map Training playlist",
      "Controller remapping and deadzone customization",
    ],
  },
  Y9S1_DeadlyOmen: {
    release: "March 12, 2024",
    operators: [
      {
        name: "Deimos",
        side: "attacker",
        gadgetName: "DeathMARK Tracker",
        gadgetDesc: "probe seeks a marked enemy and reveals their location",
      },
    ],
    maps: [],
    highlights: [
      "Full shield rework — sprinting, free look, guard break, no hip fire",
      "Attachment overhaul with Horizontal Grip and reworked scope zooms",
      ".44 Vendetta magnum for Deimos, the franchise's first villain operator",
    ],
  },
  Y9S2_NewBlood: {
    release: "June 11, 2024",
    operators: [
      {
        name: "Striker",
        side: "attacker",
        gadgetName: "Gadget Kit",
        gadgetDesc: "lets Striker carry two attacker secondary gadgets",
      },
      {
        name: "Sentry",
        side: "defender",
        gadgetName: "Gadget Kit",
        gadgetDesc: "equips two different defender secondary gadgets",
      },
    ],
    maps: [],
    highlights: [
      "Classic Recruit reworked into Striker and Sentry",
      "Major nerfs for Fenrir and Solis",
    ],
  },
  Y9S3_TwinShells: {
    release: "September 10, 2024",
    operators: [
      {
        name: "Skopós",
        side: "defender",
        gadgetName: "V10 Pantheon Shells",
        gadgetDesc: "swaps control between two robotic shells at will",
      },
    ],
    maps: [],
    highlights: [
      "**Siege Cup** — in-game 5v5 tournament ladder on PC",
      "PCX-33 assault rifle for Skopós",
      "Drone speed boost and After Action Report 2.0",
      "DX12 as the default graphics API on PC",
    ],
  },
  Y9S4_CollisionPoint: {
    release: "December 3, 2024",
    operators: [
      {
        name: "Blackbeard",
        side: "attacker",
        gadgetName: "H.U.L.L. Adaptable Shield",
        gadgetDesc: "deployable shield he raises to block incoming fire",
      },
    ],
    maps: [],
    highlights: [
      "Shields nerfed — melee damage removed, earlier suppressive fire",
      "**Siege Cup** in-game tournaments expanded to all platforms",
      "Crossplay between console and PC with separate ranked progression",
    ],
  },
  Y10S1_PrepPhase: {
    release: "March 4, 2025",
    operators: [
      {
        name: "Rauora",
        side: "attacker",
        gadgetName: "D.O.M. Panel Launcher",
        gadgetDesc: "launches bulletproof panels onto doorways from a distance",
      },
    ],
    maps: [],
    highlights: [
      "Full **Reputation System** rollout with penalties and rewards",
      "**Dynamic Matchmaking** 1.0 adapting to server load",
      "DX11 removed on PC — DX12 mandatory",
    ],
  },
  Y10S2_DayBreak: {
    release: "June 10, 2025",
    operators: [
      {
        name: "Clash",
        side: "defender",
        gadgetName: "CCE Shield MK2",
        gadgetDesc:
          "electrified shield that slows attackers, anchorable in place",
      },
    ],
    maps: [{ name: "District" }],
    highlights: [
      "**Siege X** overhaul — audio rework, advanced rappel, destructible props",
      "Permanent 6v6 **Dual Front** mode",
      "**Modernized maps** — Bank, Border, Chalet, Clubhouse and Kafe Dostoyevsky",
      "Free Access model and new **Pick & Ban** phase",
    ],
  },
  Y10S3_HighStakes: {
    release: "September 2, 2025",
    operators: [
      {
        name: "Denari",
        side: "defender",
        gadgetName: "T.R.I.P. Connector",
        gadgetDesc: "creates laser tripwires that slow and injure enemies",
        img: "denari-og",
      },
    ],
    maps: [],
    highlights: [
      "Keres Safe Room data extraction objective for **Dual Front**",
      "Blackbeard nerf, magnified sights removed from defender automatic weapons",
      "Reaper MK2 secondary weapon for select operators",
      "**Modernized maps** — Consulate, Nighthaven Labs and Lair",
    ],
  },
  Y10S4_TenfoldPursuit: {
    release: "December 2, 2025",
    operators: [
      {
        name: "Thatcher",
        side: "attacker",
        gadgetName: "E.G.S. Disruptor",
        gadgetDesc: "disables all electronics in a targeted area",
      },
    ],
    maps: [{ name: "Fortress" }],
    highlights: [
      "Ranked matchmaking factoring visible rank alongside hidden MMR",
      "PMR90A2 marksman rifle for Thatcher, Hibana, Capitão and Nøkk",
      "**Wildcards Siege** 10th anniversary event on House",
    ],
  },
  Y11S1_SilentHunt: {
    release: "March 3, 2026",
    operators: [
      {
        name: "Solid Snake",
        side: "attacker",
        gadgetName: "Soliton Radar MKIII",
        gadgetDesc: "handheld radar that marks nearby hostiles on a minimap",
      },
    ],
    maps: [],
    highlights: [
      "Major balancing update targeting entry fraggers and roamers",
      "Ranked map pool reduced from 16 to 13 maps",
      "TACIT .45 suppressed secondary pistol",
      "**Modernized maps** — Coastline, Villa and Oregon",
    ],
  },
};
