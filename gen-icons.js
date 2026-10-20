const {createCanvas} = require('canvas');
const fs = require('fs');

function makeIcon(size, outPath) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  // Background
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, size, size);
  // Gold circle
  const r = size * 0.42;
  const cx = size / 2, cy = size / 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0806'; ctx.fill();
  // Two eyebrows
  const bw = size * 0.28, bh = size * 0.08, gap = size * 0.06;
  const by = cy - size * 0.04;
  ctx.fillStyle = '#FFD700';
  // left
  ctx.save(); ctx.translate(cx - gap/2 - bw, by);
  ctx.beginPath(); ctx.roundRect(0, 0, bw, bh, bh/2); ctx.fill(); ctx.restore();
  // right
  ctx.save(); ctx.translate(cx + gap/2, by);
  ctx.beginPath(); ctx.roundRect(0, 0, bw, bh, bh/2); ctx.fill(); ctx.restore();
  fs.writeFileSync(outPath, c.toBuffer('image/png'));
  console.log('Created', outPath);
}

try {
  makeIcon(192, '/Users/chiaracorbo/le-sopracciglia-game/icon-192.png');
  makeIcon(512, '/Users/chiaracorbo/le-sopracciglia-game/icon-512.png');
} catch(e) {
  console.error('canvas module not available:', e.message);
}
