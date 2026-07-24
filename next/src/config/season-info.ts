import type { ReactNode } from "react";

export type InfoOperator = {
  name: string;
  side: "attacker" | "defender";
  gadgetName: string;
  gadgetDesc: string;
  img?: string;
  rework?: boolean;
};

export type InfoMap = {
  name: string;
  kind: "new" | "rework";
  img?: string;
};

export type SeasonInfoEntry = {
  release: string;
  summary: ReactNode;
  operators: InfoOperator[];
  maps: InfoMap[];
  highlights: string[];
  note?: ReactNode;
};

export const SEASON_INFO: Record<string, SeasonInfoEntry> = {
  Y1S0_Vanilla: {
    release: "December 1, 2015",
    summary:
      "Y1S0 Vanilla is the original release of Rainbow Six Siege, with 20 operators from five CTUs (SAS, FBI SWAT, GIGN, Spetsnaz, GSG 9) and 10 multiplayer maps, built around destructible environments and 5v5 siege gameplay.",
    operators: [],
    maps: [],
    highlights: [
      "RealBlast procedural destruction of walls, floors and ceilings",
      "Situations — 10 solo and 1 co-op tutorial missions",
      "Terrorist Hunt co-op mode against AI enemies",
      "5v5 attacker vs defender rounds with bomb, hostage and secure area",
    ],
  },
  Y1S1_BlackIce: {
    release: "February 2, 2016",
    summary:
      "Y1S1 Black Ice is the first post-launch season of Siege, set around the Canadian Arctic. It adds JTF2 operators Buck and Frost and the free Yacht map.",
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
    maps: [{ name: "Yacht", kind: "new" }],
    highlights: [
      "Establishes the free-map DLC model",
      "Spectator camera added on all platforms",
      "Introduces seasonal Black Ice weapon skins",
    ],
  },
  Y1S2_DustLine: {
    release: "May 10, 2016",
    summary:
      "Y1S2 Dust Line adds Navy SEAL operators Blackbeard and Valkyrie and the free Border map.",
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
    maps: [{ name: "Border", kind: "new", img: "border-y1s2" }],
    highlights: [
      "Loadouts can be changed between rounds",
      "Weapon charms, skins and operator headgear customization",
      "New weapons — MPX, SPAS-12, Mk17 CQB, SR-25 and D-50",
    ],
  },
  Y1S3_SkullRain: {
    release: "August 2, 2016",
    summary:
      "Y1S3 Skull Rain heads to Brazil, adding BOPE operators Capitão and Caveira plus the free Favela map.",
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
    maps: [{ name: "Favela", kind: "new", img: "favela-y1s3" }],
    highlights: [
      "Patch 4.0 adds BattlEye anti-cheat alongside FairFight",
      "Angled grip attachment for faster ADS transitions",
      "Surrender vote system for Ranked matches",
      "Tactical Realism custom game mode with minimal HUD",
    ],
    note: "Closing this season from the in-game menu can take up to 10 seconds.",
  },
  Y1S4_RedCrow: {
    release: "November 17, 2016",
    summary:
      "Y1S4 Red Crow is themed around Japan. It adds SAT operators Hibana and Echo and the free Skyscraper map, a Yakuza mansion high above Nagoya, plus caliber-based destruction physics.",
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
    maps: [{ name: "Skyscraper", kind: "new", img: "skyscraper-y1s4" }],
    highlights: [
      "Caliber-based destruction scales bullet holes by weapon caliber",
    ],
    note: "Closing this season from the in-game menu can take up to 10 seconds.",
  },
  Y2S1_VelvetShell: {
    release: "February 7, 2017",
    summary:
      "Y2S1 Velvet Shell opens Year 2 with a Spanish theme, adding GEO operators Jackal and Mira and the free Coastline map set in Ibiza.",
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
    maps: [{ name: "Coastline", kind: "new", img: "coastline-y2s1" }],
    highlights: ["New weapons — C7E, PDW9 and Vector .45 ACP"],
    note: "Closing this season from the in-game menu can take up to 10 seconds.",
  },
  Y2S2_Health: {
    release: "June 7, 2017",
    summary:
      "Y2S2 Health is a maintenance season with no new operators or maps, focused entirely on technical fixes.",
    operators: [],
    maps: [],
    highlights: [
      "One-step matchmaking with faster queue flow",
      "Hitbox redesign limited to the operator body",
      "Improved hit registration and server infrastructure",
      "Hong Kong season delayed and the Polish map cancelled",
    ],
  },
  Y2S3_BloodOrchid: {
    release: "September 5, 2017",
    summary:
      "Y2S3 Blood Orchid is set in Hong Kong and adds SDU operators Ying and Lesion, GROM defender Ela, and the Theme Park map, alongside the biggest patch to date.",
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
    maps: [{ name: "Theme Park", kind: "new", img: "theme-park-y2s3" }],
    highlights: [
      "Three operators in one season after the Poland season was merged in",
      "Sweeping texture, lighting and sky dome overhaul",
      "Extensive weapon, gadget and operator balance tweaks",
    ],
  },
  Y2S4_WhiteNoise: {
    release: "December 5, 2017",
    summary:
      "Y2S4 White Noise is set in Seoul, South Korea. It adds 707th SMB operators Dokkaebi and Vigil, Polish GROM attacker Zofia, and the free Tower map atop Mok Myeok Tower.",
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
    maps: [{ name: "Tower", kind: "new" }],
    highlights: [
      "Withstand lets Zofia self-revive from a downed state",
      "Dokkaebi hacks the phones of eliminated defenders to view cameras",
    ],
  },
  Y3S1_Chimera: {
    release: "March 6, 2018",
    summary:
      "Y3S1 Chimera adds CBRN attackers Lion and Finka and runs Outbreak, a limited-time three-player PvE co-op event set in Truth or Consequences, New Mexico.",
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
      "Outbreak runs March 6 to April 3 against infected enemies",
      "First season to add two attackers and no defender",
      "Three Outbreak-only areas — Resort, Hospital and Junkyard",
      "Outbreak Packs debut as event-exclusive cosmetic loot",
    ],
  },
  Y3S2_ParaBellum: {
    release: "June 7, 2018",
    summary:
      "Y3S2 Para Bellum deploys Italian GIS defenders Alibi and Maestro on Villa, a new map set in Tuscany.",
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
    maps: [{ name: "Villa", kind: "new", img: "villa-y3s2" }],
    highlights: [
      "Pick & Ban operator draft settings introduced",
      "Counter-defuser device replaces melee animation for defuser disable",
      "ACS12 full-auto shotgun debuts on both new operators",
      "Echo buffed with a second Yokai drone, Clubhouse map buffed",
    ],
  },
  Y3S3_GrimSky: {
    release: "September 4, 2018",
    summary:
      "Y3S3 Grim Sky adds attacker Maverick with a breaching blowtorch and shield defender Clash, and delivers the first full map rework with Hereford Base.",
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
    maps: [{ name: "Hereford Base", kind: "rework" }],
    highlights: [
      "Clash debuts as the first shield-carrying defender",
      "Sight misalignment fixes and hatch destruction rework",
      "Consulate map buff",
    ],
  },
  Y3S4_WindBastion: {
    release: "December 4, 2018",
    summary:
      "Y3S4 Wind Bastion is set in Morocco. It adds GIGR operators Nomad (attacker) and Kaid (defender) and the Fortress map, a large daytime kasbah in the south of the country.",
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
    maps: [{ name: "Fortress", kind: "new", img: "fortress-y3s4" }],
    highlights: [
      "Kaid debuts the TCSG12 slug shotgun and AUG A3 SMG",
      "Redesigned in-game shop with new navigation and fullscreen views",
      "Pilot Program esports uniforms and headgear, 30% revenue share",
    ],
  },
  Y4S1_BurntHorizon: {
    release: "March 6, 2019",
    summary:
      "Y4S1 Burnt Horizon opens Year 4 with an Australian theme, adding SASR operators Gridlock and Mozzie and the Outback map.",
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
    maps: [{ name: "Outback", kind: "new", img: "outback-y4s1" }],
    highlights: [
      "Newcomer playlist for players under level 50",
      "MMR rollback refunds rank changes from cheater matches",
      "Casual gets preset bomb sites and a 3:30 action phase",
    ],
  },
  Y4S2_PhantomSight: {
    release: "June 11, 2019",
    summary:
      "Y4S2 Phantom Sight adds stealth attacker Nøkk and defender Warden and reworks Kafe Dostoyevsky.",
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
    maps: [
      {
        name: "Kafe Dostoyevsky",
        kind: "rework",
        img: "kafe-dostoyevsky-y4s2",
      },
    ],
    highlights: [
      "Ranked standardizes Pick & Ban, Bomb mode and 3-round rotations",
      "Reverse friendly fire extended to all damage types",
      "Redesigned in-game shop with featured items and recommendations",
      "New Ranked guide showing season rewards, map pool and stats",
    ],
  },
  Y4S3_EmberRise: {
    release: "September 11, 2019",
    summary:
      "Y4S3 Ember Rise adds Latin American operators Amaru and Goyo, and a full rework of Kanal.",
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
    maps: [{ name: "Kanal", kind: "rework" }],
    highlights: [
      "Unranked playlist with the full Ranked ruleset",
      "New Champion rank above Diamond at 5000+ MMR",
      "First mini battle pass, Call Me Harry",
      "Kanal rework adds a second bridge and new sites",
    ],
  },
  Y4S4_ShiftingTides: {
    release: "December 3, 2019",
    summary:
      "Y4S4 Shifting Tides introduces Nighthaven operators Kali and Wamai alongside a reworked Theme Park map.",
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
    maps: [{ name: "Theme Park", kind: "rework", img: "theme-park-y4s4" }],
    highlights: [
      "CSRX 300 debuts as the first bolt-action sniper rifle",
      "Limb penetration added for most weapons",
      "Rappel exit now requires manual confirmation",
      "Casual playlist renamed Quick Match",
    ],
  },
  Y5S1_VoidEdge: {
    release: "March 10, 2020",
    summary:
      "Y5S1 Void Edge introduces Dutch attacker Iana and Jordanian defender Oryx, alongside a rework of the Oregon map.",
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
    maps: [{ name: "Oregon", kind: "rework", img: "oregon-y5s1" }],
    highlights: [
      "Oregon rework with new Kitchen corridor and expanded basement",
      "Attacker drone spawns become deterministic instead of random",
      "Barricade debris cleanup for consistent sightlines",
      "Around the World Battle Pass with free and premium tracks",
    ],
  },
  Y5S2_SteelWave: {
    release: "June 16, 2020",
    summary:
      "Y5S2 Steel Wave adds Nighthaven attacker Ace and Inkaba Task Force defender Melusi alongside a reworked House map.",
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
    maps: [{ name: "House", kind: "rework" }],
    highlights: [
      "House map rework with a new southern wing and revised bomb sites",
      "Proximity Alarm added as new defender secondary gadget",
      "Unified global MMR replacing region-specific ranked ratings",
    ],
  },
  Y5S3_ShadowLegacy: {
    release: "September 10, 2020",
    summary:
      "Y5S3 Shadow Legacy brings Sam Fisher from Splinter Cell to Siege as attacker Zero and reworks Chalet, alongside one of the largest core-gameplay updates in Siege history.",
    operators: [
      {
        name: "Zero",
        side: "attacker",
        gadgetName: "ARGUS Launcher",
        gadgetDesc: "launches cameras that pierce walls and fire laser shots",
      },
    ],
    maps: [{ name: "Chalet", kind: "rework", img: "chalet-y5s3" }],
    highlights: [
      "Ping 2.0 contextual pinging, usable from cams and after death",
      "Hard Breach Charge secondary gadget for attackers",
      "Map ban voting before matches",
      "Optics overhaul with new 1.5x and 2.0x scopes",
    ],
  },
  Y5S4_NeonDawn: {
    release: "December 1, 2020",
    summary:
      "Y5S4 Neon Dawn adds Thai defender Aruni and a reworked Skyscraper map, alongside broad operator balancing.",
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
        gadgetDesc:
          "shoots down incoming projectiles, now with unlimited intercepts on a 10 second cooldown",
        rework: true,
      },
    ],
    maps: [{ name: "Skyscraper", kind: "rework", img: "skyscraper-y5s4" }],
    highlights: [
      "Echo Yokai drone made permanently visible",
      "Runout detection timer cut from 2s to 1s",
      "PS5 and Xbox Series X|S versions launch alongside the season",
    ],
  },
  Y6S1_CrimsonHeist: {
    release: "March 16, 2021",
    summary:
      "Y6S1 Crimson Heist introduces Argentinian attacker Flores alongside a rework of the Border map.",
    operators: [
      {
        name: "Flores",
        side: "attacker",
        gadgetName: "RCE-Ratero Charge",
        gadgetDesc: "remote-controlled explosive drone that destroys gadgets",
      },
    ],
    maps: [{ name: "Border", kind: "rework", img: "border-y6s1" }],
    highlights: [
      "Gonne-6 explosive secondary added to select attacker loadouts",
      "Match Replay beta on PC to re-watch matches from any angle",
      "Defuser auto-assigned if unclaimed at end of planning phase",
      "Newcomer playlist reworked with a rotating seasonal map",
    ],
  },
  Y6S2_NorthStar: {
    release: "June 14, 2021",
    summary:
      "Y6S2 North Star adds Canadian defender Thunderbird and a competitive rework of Favela.",
    operators: [
      {
        name: "Thunderbird",
        side: "defender",
        gadgetName: "Kóna Station",
        gadgetDesc: "deployable station that heals or revives nearby operators",
      },
    ],
    maps: [{ name: "Favela", kind: "rework" }],
    highlights: [
      "Bulletproof Camera rework — rotation plus an EMP burst shot",
      "Smoke gas propagation rework stops gas passing through surfaces",
      "Death rework — skippable animations, bodies become transparent icons",
      "Melee now shatters Mira mirrors, Evil Eyes and bulletproof cams",
    ],
  },
  Y6S3_CrystalGuard: {
    release: "September 7, 2021",
    summary:
      "Y6S3 Crystal Guard adds Croatian Nighthaven attacker Osa and reworks Bank, Coastline and Clubhouse.",
    operators: [
      {
        name: "Osa",
        side: "attacker",
        gadgetName: "Talon-8 Clear Shield",
        gadgetDesc: "transparent bulletproof shield she carries or deploys",
      },
    ],
    maps: [
      { name: "Bank", kind: "rework", img: "bank-y6s3" },
      { name: "Coastline", kind: "rework", img: "coastline-y2s1" },
      { name: "Clubhouse", kind: "rework", img: "clubhouse-y6s3" },
    ],
    highlights: [
      "Armor stat converted to HP with 100/110/125 health pools",
      "Individual attacker spawn selection in all playlists",
      "Elite customization mixes Elite uniforms with any headgear",
      "Ranked skill distribution rework with expanded Diamond tiers",
    ],
  },
  Y6S4_HighCalibre: {
    release: "November 30, 2021",
    summary: "Y6S4 High Calibre adds Irish defender Thorn and reworks Outback.",
    operators: [
      {
        name: "Thorn",
        side: "defender",
        gadgetName: "Razorbloom Shell",
        gadgetDesc: "sticks to surfaces and bursts lethal blades near enemies",
      },
    ],
    maps: [{ name: "Outback", kind: "rework" }],
    highlights: [
      "Thorn brings the new UZK50Gi .50-cal SMG",
      "Team colors become customizable, defaulting to blue vs red",
      "Elite 2.0 customization and HUD rework with drone counter",
    ],
  },
  Y7S1_DemonVeil: {
    release: "March 15, 2022",
    summary:
      "Y7S1 Demon Veil has a Japanese theme and adds defender Azami. The new Emerald Plains map arrives mid-season.",
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
        gadgetDesc:
          "incendiary canister that ignites when shot, now detached from deployable shields",
        rework: true,
      },
    ],
    maps: [],
    highlights: [
      "Team Deathmatch arrives as a permanent playlist",
      "Attacker repick allows operator swaps during prep phase",
      "All non-magnifying sights unlocked on most weapons",
    ],
  },
  Y7S2_VectorGlare: {
    release: "June 14, 2022",
    summary:
      "Y7S2 Vector Glare introduces Belgian attacker Sens and the new Close Quarter map.",
    operators: [
      {
        name: "Sens",
        side: "attacker",
        gadgetName: "R.O.U. Projector System",
        gadgetDesc:
          "rolls and projects a light wall that blocks lines of sight",
      },
    ],
    maps: [{ name: "Close Quarter", kind: "new" }],
    highlights: [
      "Close Quarter, first map built for Team Deathmatch",
      "Shooting Range with recoil and damage lanes for weapon testing",
      "New POF-9 assault rifle debuts with Sens",
      "Privacy Mode and reputation penalties for reverse friendly fire",
    ],
  },
  Y7S3_BrutalSwarm: {
    release: "September 6, 2022",
    summary:
      "Y7S3 Brutal Swarm introduces Nighthaven attacker Grim and adds Stadium Bravo as a permanent map.",
    operators: [
      {
        name: "Grim",
        side: "attacker",
        gadgetName: "Kawan Hive Launcher",
        gadgetDesc: "launches bot swarms that reveal enemies passing through",
      },
    ],
    maps: [{ name: "Stadium Bravo", kind: "new", img: "stadium-bravo-y7s3" }],
    highlights: [
      "PC recoil system overhaul with progressive recoil",
      "Impact EMP grenade secondary gadget for 8 operators",
      "Map ban phase expanded to show 5 maps",
      "Rook armor plates now grant Withstand when downed",
    ],
  },
  Y7S4_SolarRaid: {
    release: "December 6, 2022",
    summary:
      "Y7S4 Solar Raid adds Colombian defender Solis and the Nighthaven Labs map.",
    operators: [
      {
        name: "Solis",
        side: "defender",
        gadgetName: "SPEC-IO Electro-Sensor",
        gadgetDesc: "detects and marks enemy electronic devices",
      },
    ],
    maps: [
      { name: "Nighthaven Labs", kind: "new", img: "nighthaven-labs-y7s4" },
    ],
    highlights: [
      "Console cross-play and cross-progression on all platforms",
      "Ranked 2.0 with Rank Points and new Emerald rank",
      "Battle pass reworked with branching progression paths",
      "Reputation standing display enters beta",
    ],
  },
  Y8S1_CommandingForce: {
    release: "March 7, 2023",
    summary:
      "Y8S1 Commanding Force introduces Brazilian COT attacker Brava and ships no new map.",
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
      "Operator specialties system with beginner challenges",
      "Playlists reorganized into Competitive, Quick Play and Training",
      "MouseTrap console anti-cheat added mid-season (Y8S1.2)",
    ],
  },
  Y8S2_DreadFactor: {
    release: "May 30, 2023",
    summary:
      "Y8S2 Dread Factor adds Swedish defender Fenrir and reworks Consulate.",
    operators: [
      {
        name: "Fenrir",
        side: "defender",
        gadgetName: "F-NATT Dread Mine",
        gadgetDesc: "releases fear gas that severely limits enemy vision",
      },
    ],
    maps: [{ name: "Consulate", kind: "rework", img: "consulate-y8s2" }],
    highlights: [
      "Arcade playlist made permanent, adds Free For All mode",
      "New Observation Blocker gadget blocks drone line of sight",
      "Free camera added to Match Replay",
      "Shooting Range gains moving-target Aiming Lane",
    ],
  },
  Y8S3_HeavyMettle: {
    release: "August 29, 2023",
    summary:
      "Y8S3 Heavy Mettle adds South Korean attacker Ram and ships no new map.",
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
          "floor trap that downs attackers who step on it, now placeable under barbed wire and shields",
        rework: true,
      },
    ],
    maps: [],
    highlights: [
      "Quick Match 2.0 and new Standard playlist replace Unranked",
      "Commendation system for recognizing positive player behavior",
      "Weapon Roulette permanent arcade mode",
      "Shotgun overhaul and Grim Kawan Hive buff",
    ],
  },
  Y8S4_DeepFreeze: {
    release: "December 6, 2023",
    summary:
      "Y8S4 Deep Freeze introduces Portuguese defender Tubarão and the new map Lair, home base of Deimos.",
    operators: [
      {
        name: "Tubarão",
        side: "defender",
        gadgetName: "Zoto Canister",
        gadgetDesc: "throwable canister that freezes devices and slows enemies",
      },
    ],
    maps: [{ name: "Lair", kind: "new", img: "lair-y8s4" }],
    highlights: [
      "Frag grenade rework removes cooking, shortens fuse times",
      "R6 Marketplace beta sign-ups open, launch early 2024",
      "Versus AI playlist beta and new Map Training playlist",
      "Controller remapping and deadzone customization",
    ],
  },
  Y9S1_DeadlyOmen: {
    release: "March 12, 2024",
    summary:
      "Y9S1 Deadly Omen introduces Deimos, the first villain operator in the franchise, and ships no new map. The season centers on a full shield rework.",
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
      "Attachment overhaul adds Horizontal Grip and reworked scope zooms",
      "New anti-cheat detection model and stricter Ranked entry rules",
      "Deimos wields the .44 Vendetta magnum tied to his DeathMARK",
    ],
  },
  Y9S2_NewBlood: {
    release: "June 11, 2024",
    summary:
      "Y9S2 New Blood reworks the classic Recruit into two operators, Striker and Sentry. The season adds no new map.",
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
      "Marketplace launches fully out of beta for skin trading",
      "R6 Membership subscription replaces the Year Pass",
      "Fenrir and Solis receive major nerfs",
    ],
  },
  Y9S3_TwinShells: {
    release: "September 10, 2024",
    summary:
      "Y9S3 Twin Shells adds Skopós, a defender who remotely operates two robotic shells, and ships no new map.",
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
      "Siege Cup beta, an in-game 5v5 tournament ladder on PC",
      "New PCX-33 assault rifle debuts with Skopós",
      "Drone speed boost and After Action Report 2.0",
      "DX12 becomes the default graphics API on PC",
    ],
  },
  Y9S4_CollisionPoint: {
    release: "December 3, 2024",
    summary:
      "Y9S4 Collision Point closes 2024 with no new operator or map, instead reworking Blackbeard around the H.U.L.L. Adaptable Shield.",
    operators: [
      {
        name: "Blackbeard",
        side: "attacker",
        gadgetName: "H.U.L.L. Adaptable Shield",
        gadgetDesc:
          "deployable shield he raises to block fire, replacing his rifle-mounted shields",
        rework: true,
      },
    ],
    maps: [],
    highlights: [
      "Console-to-PC crossplay with separate ranked progression",
      "New career hub with badges",
      "Shields nerfed — melee damage removed, earlier suppressive fire",
      "Siege Cup beta in-game tournaments expand to all platforms",
    ],
  },
  Y10S1_PrepPhase: {
    release: "March 4, 2025",
    summary:
      "Y10S1 Prep Phase adds New Zealand attacker Rauora. It is the final season before the Siege X overhaul.",
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
      "Full Reputation System rollout with penalties and rewards",
      "Dynamic Matchmaking 1.0 adapts to server load for better matches",
      "DX11 removed on PC, DirectX 12 becomes mandatory",
    ],
  },
  Y10S2_DayBreak: {
    release: "June 10, 2025",
    summary:
      "Y10S2 Day Break launches alongside the free Siege X overhaul. It adds no new operator, instead delivering the permanent 6v6 Dual Front mode on the new District map.",
    operators: [
      {
        name: "Clash",
        side: "defender",
        gadgetName: "CCE Shield MK2",
        gadgetDesc:
          "electrified shield that slows attackers, now anchorable in place with a remote taser",
        rework: true,
      },
    ],
    maps: [{ name: "District", kind: "new" }],
    highlights: [
      "Siege X overhaul — audio rework, advanced rappel, destructible props",
      "Modernized maps — Bank, Border, Chalet, Clubhouse and Kafe Dostoyevsky",
      "Free Access model and flexible in-match Pick & Ban",
    ],
  },
  Y10S3_HighStakes: {
    release: "September 2, 2025",
    summary:
      "Y10S3 High Stakes adds Swiss Nighthaven defender Denari and modernizes three maps.",
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
      "Dual Front adds Keres Safe Room data extraction objective",
      "Modernized maps — Consulate, Nighthaven Labs and Lair",
      "Blackbeard nerfed, defender automatic weapons lose magnified sights",
      "Reaper MK2 secondary weapon added for select operators",
    ],
  },
  Y10S4_TenfoldPursuit: {
    release: "December 2, 2025",
    summary:
      "Y10S4 Tenfold Pursuit marks the 10th anniversary of Siege. It ships no new operator, instead remastering Thatcher and reworking Fortress.",
    operators: [
      {
        name: "Thatcher",
        side: "attacker",
        gadgetName: "E.G.S. Disruptor",
        gadgetDesc:
          "disables electronics in an area, replacing his EMP grenades",
        rework: true,
      },
    ],
    maps: [{ name: "Fortress", kind: "rework" }],
    highlights: [
      "PMR90A2 marksman rifle for Thatcher, Hibana, Capitão and Nøkk",
      "Wildcards Siege anniversary event on House with login rewards",
      "Ranked matchmaking factors visible rank alongside hidden MMR",
    ],
  },
  Y11S1_SilentHunt: {
    release: "March 3, 2026",
    summary:
      "Y11S1 Silent Hunt centers on a Metal Gear Solid crossover, adding Solid Snake as an attacker.",
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
      "New TACIT .45 suppressed secondary pistol",
      "Modernized maps — Coastline, Villa and Oregon",
      "Major balancing update targeting entry fraggers and roamers",
      "Ranked map pool reduced from 16 to 13 maps",
    ],
  },
};
