/* Generates the PWA icons. No dependencies — writes raw PNG bytes.
   Run: node make-icons.cjs                                          */
'use strict';
const fs = require('fs');
const zlib = require('zlib');

function crc32(buf){
  let c, crc = 0xFFFFFFFF;
  for (let n = 0; n < buf.length; n++){
    c = (crc ^ buf[n]) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba){
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++){
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const BG = [0x12, 0x10, 0x0E, 255];
const AMBER = [0xD8, 0xA2, 0x4A, 255];
const RING = [0xD8, 0xA2, 0x4A, 90];

function build(size, maskable){
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  // maskable icons must survive a circular crop: keep art inside 80%
  const dotR = size * (maskable ? 0.13 : 0.20);
  const ringR = size * (maskable ? 0.24 : 0.37);
  const dotX = maskable ? cx : cx;
  const dotY = maskable ? cy : cy;

  for (let y = 0; y < size; y++){
    for (let x = 0; x < size; x++){
      const i = (y * size + x) * 4;
      const dDot = Math.hypot(x - dotX, y - dotY);
      const dRing = Math.abs(Math.hypot(x - cx, y - cy) - ringR);

      let col = BG;
      if (dDot <= dotR) col = AMBER;
      else if (dRing <= Math.max(1, size / 128)) col = RING;

      // antialias the edges a little
      if (dDot <= dotR + 1 || dRing <= Math.max(1, size / 128) + 1){
        const a = dDot <= dotR ? 1 - Math.max(0, dDot - dotR) : 0;
        const b = dRing <= Math.max(1, size/128) ? 1 : 0;
        const edge = Math.max(a, b);
        if (edge > 0 && edge < 1) col = [
          Math.round(BG[0] + (col[0]-BG[0]) * edge),
          Math.round(BG[1] + (col[1]-BG[1]) * edge),
          Math.round(BG[2] + (col[2]-BG[2]) * edge),
          255];
      }
      buf[i] = col[0]; buf[i+1] = col[1]; buf[i+2] = col[2]; buf[i+3] = col[3];
    }
  }
  return png(size, size, buf);
}

fs.writeFileSync('icon-192.png',         build(192, false));
fs.writeFileSync('icon-512.png',         build(512, false));
fs.writeFileSync('icon-512-maskable.png', build(512, true));
console.log('icons written');
