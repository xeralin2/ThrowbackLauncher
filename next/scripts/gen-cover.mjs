import { readdir, mkdir, stat } from "node:fs/promises";
import { join, parse } from "node:path";
import sharp from "sharp";
import WIDTHS from "../src/config/cover-widths.json" with { type: "json" };

const SRC = "assets/cover";
const OUT = "public/cover";
const FULL = WIDTHS[WIDTHS.length - 1];
const QUALITY = 82;

const outDir = (width) => (width === FULL ? OUT : join(OUT, String(width)));

await Promise.all(
  WIDTHS.map((width) => mkdir(outDir(width), { recursive: true })),
);

const files = (await readdir(SRC)).filter((f) =>
  /\.(jpe?g|png|webp)$/i.test(f),
);

let written = 0;
await Promise.all(
  files.flatMap((file) =>
    WIDTHS.map(async (width) => {
      const src = join(SRC, file);
      const out = join(outDir(width), `${parse(file).name}.webp`);
      try {
        const [s, o] = await Promise.all([stat(src), stat(out)]);
        if (o.mtimeMs >= s.mtimeMs) return;
      } catch {}
      const image = sharp(src);
      const meta = await image.metadata();
      if (meta.width && meta.width > width) image.resize({ width });
      await image.webp({ quality: QUALITY }).toFile(out);
      written += 1;
    }),
  ),
);

console.log(
  `cover: ${written} generated, ${files.length * WIDTHS.length - written} cached`,
);
