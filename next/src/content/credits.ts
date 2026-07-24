export type CreditRole =
  "admin" | "moderator" | "developer" | "seniorhelper" | "helper";

type CreditSection = "faqContributors" | "staff";

export type CreditUser = {
  name: string;
  role: CreditRole;
  tags: string[];
  github: string | null;
  dono: string | null;
  avatar: string;
  sections: CreditSection[];
};

export const sectionOrder: { id: CreditSection; label: string }[] = [
  { id: "faqContributors", label: "FAQ Contributors" },
  { id: "staff", label: "Staff" },
];

export const users: CreditUser[] = [
  {
    name: "Astrea",
    role: "admin",
    tags: ["Artemis"],
    github: "https://github.com/Astrea0014",
    dono: null,
    avatar: "/media/pfp/astrea.webp",
    sections: ["staff"],
  },
  {
    name: "Puppetino",
    role: "admin",
    tags: ["FAQ", "Legacy FAQ", "Discord Bot"],
    github: "https://github.com/Puppetino",
    dono: "https://buymeacoffee.com/Puppetino",
    avatar: "/media/pfp/puppetino.webp",
    sections: ["faqContributors"],
  },
  {
    name: "Midly",
    role: "admin",
    tags: [],
    github: "https://github.com/midly202",
    dono: null,
    avatar: "/media/pfp/midly.webp",
    sections: ["staff"],
  },
  {
    name: "Muhnkie",
    role: "moderator",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/muhnkie.webp",
    sections: ["staff"],
  },
  {
    name: "Sweetteatv",
    role: "moderator",
    tags: [],
    github: "https://github.com/OgSpit",
    dono: null,
    avatar: "/media/pfp/sweetteatv.webp",
    sections: ["staff"],
  },
  {
    name: "Auralicy",
    role: "moderator",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/auralicy.webp",
    sections: ["staff"],
  },
  {
    name: "Xera",
    role: "developer",
    tags: ["FAQ", "Launcher", "Liberator", "ThrowbackLoader"],
    github: "https://github.com/xeralin",
    dono: null,
    avatar: "/media/pfp/xeralin.webp",
    sections: ["staff", "faqContributors"],
  },
  {
    name: "AKrisz2",
    role: "developer",
    tags: ["R6S Downloader"],
    github: "https://github.com/AKrisz2",
    dono: null,
    avatar: "/media/pfp/akrisz2.webp",
    sections: ["staff"],
  },
  {
    name: "Benjaminstrike",
    role: "developer",
    tags: ["Discord AI"],
    github: "https://github.com/benjaminstrike",
    dono: null,
    avatar: "/media/pfp/benjaminstrike.webp",
    sections: ["staff"],
  },
  {
    name: "Lordelias",
    role: "developer",
    tags: [],
    github: "https://github.com/LordEliasTM",
    dono: null,
    avatar: "/media/pfp/lordelias.webp",
    sections: ["staff"],
  },
  {
    name: "0xLusion",
    role: "developer",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/0xlusion.webp",
    sections: ["staff"],
  },
  {
    name: "Seopung",
    role: "developer",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/seopung.webp",
    sections: ["staff"],
  },
  {
    name: "JVAV",
    role: "developer",
    tags: ["Legacy FAQ", "R6S Downloader"],
    github: "https://github.com/JOJOVAV",
    dono: "https://buymeacoffee.com/jvav",
    avatar: "/media/pfp/jvav.webp",
    sections: ["staff"],
  },
  {
    name: "Techtical",
    role: "seniorhelper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/techtical.webp",
    sections: ["staff"],
  },
  {
    name: "ConfusingFool93",
    role: "helper",
    tags: [],
    github: "https://github.com/AvacadoWizard120",
    dono: null,
    avatar: "/media/pfp/confusingfool93.webp",
    sections: ["staff"],
  },
  {
    name: "dredis",
    role: "helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/dredis.webp",
    sections: ["staff"],
  },
  {
    name: "Wntr",
    role: "helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/wntr.webp",
    sections: ["staff"],
  },
  {
    name: "Celestarr",
    role: "helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/celestarr.webp",
    sections: ["staff"],
  },
  {
    name: "xanax",
    role: "helper",
    tags: [],
    github: null,
    dono: null,
    avatar: "/media/pfp/xanax.webp",
    sections: ["staff"],
  },
];
