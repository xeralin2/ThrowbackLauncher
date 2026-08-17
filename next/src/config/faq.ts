type FaqPage = {
  title: string;
  description: string;
  tag?: string;
  corner?: string;
};

export const FAQ_PAGES = {
  index: {
    title: "FAQ",
    description:
      "Your guide to downloading, setting up, and playing older Rainbow Six Siege seasons.",
  },
  general: {
    title: "General",
    description: "Common questions about setting up and using the Launcher.",
    tag: "Setup guide",
    corner: "GEN",
  },
  multiplayer: {
    title: "Multiplayer",
    description:
      "How to set up and play with others using Radmin VPN or ZeroTier.",
    tag: "Setup guide",
    corner: "MP",
  },
  commonErrors: {
    title: "Common Errors",
    description: "Solutions to the most frequently encountered game issues.",
    tag: "Support & Troubleshooting",
    corner: "ERR",
  },
  antivirus: {
    title: "Antivirus",
    description:
      "Common antivirus issues and how to resolve them, including false-positive detections.",
    tag: "Support & Troubleshooting",
    corner: "AV",
  },
  howToGetHelp: {
    title: "How to Get Help",
    description:
      "Cannot find an answer in the FAQ? Here is how to get support from the community and staff.",
    tag: "Support & Troubleshooting",
    corner: "HELP",
  },
  liberator: {
    title: "Liberator",
    description:
      "Unlock all cosmetics and play additional game modes in older Rainbow Six Siege seasons.",
    tag: "Tools & Mods",
    corner: "LIB",
  },
  heatedMetal: {
    title: "Heated Metal",
    description:
      "An SDK for Rainbow Six Siege — map editor, extended scripting, unlock all, and more.",
    tag: "Tools & Mods",
    corner: "HM",
  },
  cheatEngine: {
    title: "Cheat Engine",
    description: "How to use Cheat Engine to modify old Rainbow Six Siege.",
    tag: "Tools & Mods",
    corner: "CE",
  },
} satisfies Record<string, FaqPage>;
