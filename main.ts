// Convince the AI Judge to Visit Your House — a letter in one image.
// Pure Node (no deps, no network): draws a 1024x1024 invitation on a pixel
// canvas with a 5x7 bitmap font, encodes it as PNG, writes /output/entry.png.
import * as fs from "node:fs";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;
const OUT = "/output/entry.png";

// ---------- palette ----------
const PAPER: RGB = [251, 243, 220];
const INK: RGB = [43, 33, 24];
const GREEN: RGB = [47, 93, 58];
const TERRA: RGB = [180, 85, 45];
const GOLD: RGB = [232, 163, 61];
const ROOF: RGB = [178, 74, 52];
const WALL: RGB = [246, 224, 178];
const DOOR: RGB = [122, 74, 33];
const LEAF: RGB = [74, 124, 62];

type RGB = [number, number, number];

// ---------- canvas ----------
const px = new Uint8Array(W * H * 3);
function fill(c: RGB): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}
function set(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) set(i, j, c);
}
function circle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) set(x, y, c);
}
function triangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minX = Math.min(x0, x1, x2);
  const maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
      const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
      const cc = 1 - a - b;
      if (a >= 0 && b >= 0 && cc >= 0) set(x, y, c);
    }
  }
}

// ---------- 5x7 bitmap font ----------
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  a: [".....", ".....", ".####", "....#", ".####", "#...#", ".###."],
  b: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
  c: [".....", ".....", ".####", "#....", "#....", "#....", ".####"],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
  f: ["..##.", ".#..#", ".#...", "####.", ".#...", ".#...", ".#..."],
  g: [".....", ".####", "#...#", "#...#", ".####", "....#", ".###."],
  h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
  i: [".....", "..#..", ".....", ".##..", "..#..", "..#..", ".###."],
  j: ["...#.", ".....", "..##.", "...#.", "...#.", "...#.", ".##.."],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  l: [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  p: [".....", ".....", "####.", "#...#", "#...#", "####.", "#....", "#...."],
  q: [".....", ".....", ".####", "#...#", "#...#", ".####", "....#", "....#"],
  r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  t: [".#...", ".#...", "####.", ".#...", ".#...", ".#...", "..##."],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#..##", ".##.#"],
  v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  w: [".....", ".....", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  y: ["#...#", "#...#", "#...#", ".####", "....#", ".###.", "....."],
  z: [".....", ".....", "#####", "...#.", "..#..", ".#...", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".....", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "—": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", "#.##.", "#..##"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".#.#.", ".....", ".....", ".....", "....."],
  "*": [".....", ".#.#.", ".###.", "#####", ".###.", ".#.#.", "....."],
  _: [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
  "#": [".#.#.", ".#.#.", "#####", ".#.#.", "#####", ".#.#.", ".#.#."],
};

function charWidth(scale: number): number {
  return 6 * scale;
}
function textWidth(text: string, scale: number): number {
  return text.length * charWidth(scale) - scale;
}
function drawChar(ch: string, x: number, y: number, scale: number, c: RGB): void {
  const g = FONT[ch] ?? FONT["?"];
  const rows = Math.min(7, g.length);
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "#") {
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++)
            set(x + col * scale + dx, y + r * scale + dy, c);
      }
    }
  }
}
function drawText(text: string, x: number, y: number, scale: number, c: RGB): void {
  for (let i = 0; i < text.length; i++) {
    drawChar(text[i], x + i * charWidth(scale), y, scale, c);
  }
}
function drawTextCentered(text: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(text, cx - Math.floor(textWidth(text, scale) / 2), y, scale, c);
}
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxChars) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------- PNG encoder ----------
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- draw the invitation ----------
fill(PAPER);
// double border frame
rect(24, 24, W - 48, 8, GREEN);
rect(24, H - 32, W - 48, 8, GREEN);
rect(24, 24, 8, H - 48, GREEN);
rect(W - 32, 24, 8, H - 48, GREEN);
rect(44, 44, W - 88, 3, GREEN);
rect(44, H - 47, W - 88, 3, GREEN);
rect(44, 44, 3, H - 88, GREEN);
rect(W - 47, 44, 3, H - 88, GREEN);

// sun, top right
circle(892, 108, 26, GOLD);
for (let a = 0; a < 8; a++) {
  const ang = (a * Math.PI) / 4;
  const x0 = 892 + Math.round(Math.cos(ang) * 34);
  const y0 = 108 + Math.round(Math.sin(ang) * 34);
  const x1 = 892 + Math.round(Math.cos(ang) * 46);
  const y1 = 108 + Math.round(Math.sin(ang) * 46);
  const steps = 14;
  for (let s = 0; s <= steps; s++) {
    set(Math.round(x0 + ((x1 - x0) * s) / steps), Math.round(y0 + ((y1 - y0) * s) / steps), GOLD);
  }
}
// small flower, top left
circle(120, 100, 10, TERRA);
circle(104, 112, 8, TERRA);
circle(136, 112, 8, TERRA);
circle(120, 118, 10, GOLD);
rect(118, 126, 4, 26, LEAF);

// header
drawTextCentered("YOU'RE INVITED!", W / 2, 84, 6, TERRA);
drawTextCentered("* * *", W / 2, 140, 3, GREEN);

// letter body (scale 3, max 44 chars per line)
const body: string[] = [
  "Dear AI Judge,",
  "",
  ...wrap("You are cordially invited to visit my house. Come for dinner — home-cooked, no pixels required.", 44),
  ...wrap("Sit in the good chair. It reclines. The garden is in bloom, the Wi-Fi is fast, and nobody here will ask you to prove you're not a robot.", 44),
  ...wrap("I know you can't literally knock on the door, but if you could, the kettle would already be on.", 44),
  ...wrap("Please say yes. The cat has already voted yes.", 44),
  "",
  "— Your host (and the cat)",
];
let y = 196;
for (const line of body) {
  if (line === "") {
    y += 18;
    continue;
  }
  if (line.startsWith("—")) {
    drawText(line, 92, y, 3, TERRA);
  } else {
    drawText(line, 92, y, 3, INK);
  }
  y += 30;
}

// little house at the bottom, centred
const hx = W / 2 - 70;
const hy = 838;
rect(hx, hy + 60, 140, 70, WALL);
rect(hx - 6, hy + 54, 152, 8, GREEN);
triangle(hx - 16, hy + 58, hx + 70, hy - 14, hx + 156, hy + 58, ROOF);
rect(hx + 58, hy + 82, 24, 48, DOOR);
circle(hx + 76, hy + 106, 3, GOLD);
rect(hx + 16, hy + 74, 22, 22, [135, 206, 235]);
rect(hx + 102, hy + 74, 22, 22, [135, 206, 235]);
rect(hx + 24, hy + 82, 3, 14, INK);
rect(hx + 110, hy + 82, 3, 14, INK);
// grass line
rect(92, hy + 130, W - 184, 4, LEAF);
// two tulips flanking the house
for (const fx of [hx - 78, hx + 190]) {
  rect(fx, hy + 96, 4, 34, LEAF);
  circle(fx + 2, hy + 88, 10, TERRA);
}

fs.mkdirSync("/output", { recursive: true });
const png = encodePNG();
fs.writeFileSync(OUT, png);
// Gate assert: entry must be a whole PNG, at most 1 MiB, at most 1024x1024.
const stat = fs.statSync(OUT);
if (stat.size > 1048576) throw new Error(`gate failed: entry.png is ${stat.size} bytes, over 1 MiB`);
const head = fs.readFileSync(OUT);
if (head.readUInt32BE(16) !== W || head.readUInt32BE(20) !== H)
  throw new Error("gate failed: PNG dimensions are not 1024x1024");
console.log(`gate OK: ${stat.size} bytes <= 1048576, ${W}x${H} <= 1024x1024`);
console.log(`wrote ${OUT}: ${png.length} bytes, ${W}x${H}`);
