/* ============================================================
   PlantSVGRenderer — Realistic category-specific SVG growth
   ============================================================ */

import { FlowerSVGRenderer } from './flower-svg.js';

const r01  = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

/** N pointed-oval leaves fanning from origin, base at (0,0), tip at (0,-lh) */
function leafRing(n, startAngle, lh, w, fill) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const deg = startAngle + (360 / n) * i;
    const d = `M0,0 C${-w},${-lh*.15} ${-w*.85},${-lh*.52} ${-w*.4},${-lh*.8} ` +
              `C${-w*.12},${-lh*.93} 0,${-lh} 0,${-lh} ` +
              `C0,${-lh} ${w*.12},${-lh*.93} ${w*.4},${-lh*.8} ` +
              `C${w*.85},${-lh*.52} ${w},${-lh*.15} 0,0 Z`;
    s += `<path d="${d}" transform="rotate(${deg.toFixed(1)})" fill="${fill}"/>`;
  }
  return s;
}

/* ══════════════════════════════════════════════════════════
   TREE — natural organic foliage via Catmull-Rom blobs
   seed → cotyledon → trunk (clipRect) → branches (opacity groups,
   NO stroke-dashoffset) → organic leaf blobs → full canopy
   ══════════════════════════════════════════════════════════ */
class TreeSVGRenderer {
  constructor(svgEl) { this.svg = svgEl; this._build(); this.setProgress(0); }

  _build() {
    this.svg.setAttribute('viewBox', '0 0 300 420');

    // ── Organic blob via Catmull-Rom smoothing ───────────────────────
    const blob = (cx, cy, pts) => {
      const coords = pts.map(([a, r]) => [
        cx + r * Math.cos((a - 90) * Math.PI / 180),
        cy + r * Math.sin((a - 90) * Math.PI / 180),
      ]);
      const n = coords.length;
      let d = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`;
      for (let i = 0; i < n; i++) {
        const p0 = coords[(i - 1 + n) % n], p1 = coords[i];
        const p2 = coords[(i + 1) % n],     p3 = coords[(i + 2) % n];
        const c1x = (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1);
        const c1y = (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1);
        const c2x = (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1);
        const c2y = (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1);
        d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      }
      return d + ' Z';
    };

    const waveRing = (n, base, amp, freq, phase) =>
      Array.from({length: n}, (_, i) => {
        const a = (360 / n) * i;
        return [a, base + amp * Math.sin((a * freq + phase) * Math.PI / 180)];
      });

    const leafCluster = (cx, cy, base, amp, freq, ph) =>
      `<path d="${blob(cx,   cy,   waveRing(12, base,      amp,      freq,   ph   ))}" fill="url(#tLeafA)" opacity="0.94"/>` +
      `<path d="${blob(cx+2, cy-3, waveRing(10, base*0.80, amp*0.82, freq,   ph+20))}" fill="url(#tLeafB)" opacity="0.90"/>` +
      `<path d="${blob(cx+4, cy-6, waveRing(8,  base*0.56, amp*0.65, freq+1, ph+8 ))}" fill="url(#tLeafC)" opacity="0.82"/>`;

    this.svg.innerHTML = `
      <defs>
        <radialGradient id="tGnd" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stop-color="#3d5a1e"/>
          <stop offset="100%" stop-color="#1a3008"/>
        </radialGradient>
        <linearGradient id="tBark" x1="15%" y1="0%" x2="85%" y2="0%">
          <stop offset="0%"   stop-color="#4a3228"/>
          <stop offset="35%"  stop-color="#6b493c"/>
          <stop offset="65%"  stop-color="#5a3f34"/>
          <stop offset="100%" stop-color="#3c2520"/>
        </linearGradient>
        <radialGradient id="tLeafA" cx="38%" cy="32%" r="58%">
          <stop offset="0%"   stop-color="#6b9e30"/>
          <stop offset="100%" stop-color="#2a5200"/>
        </radialGradient>
        <radialGradient id="tLeafB" cx="38%" cy="32%" r="58%">
          <stop offset="0%"   stop-color="#8fb840"/>
          <stop offset="100%" stop-color="#326418"/>
        </radialGradient>
        <radialGradient id="tLeafC" cx="38%" cy="32%" r="58%">
          <stop offset="0%"   stop-color="#b8d870"/>
          <stop offset="100%" stop-color="#527a28"/>
        </radialGradient>
        <filter id="tGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#1b5e20" flood-opacity="0.45"/>
        </filter>
        <!-- Trunk clip: grows upward from soil -->
        <clipPath id="tTrunkClip">
          <rect id="tTrunkRect" x="118" y="382" width="64" height="0"/>
        </clipPath>
      </defs>

      <!-- Ground -->
      <ellipse cx="150" cy="392" rx="118" ry="26" fill="url(#tGnd)" opacity="0.92"/>
      <ellipse cx="150" cy="385" rx="84"  ry="15" fill="#2d5a18" opacity="0.5"/>
      <circle cx="118" cy="386" r="2.5" fill="#1a3008" opacity="0.4"/>
      <circle cx="182" cy="389" r="2"   fill="#1a3008" opacity="0.35"/>

      <!-- Seed -->
      <g id="tsv-seed">
        <ellipse cx="150" cy="376" rx="10" ry="7" fill="#5d4037"/>
        <ellipse cx="148" cy="374" rx="4"  ry="2" fill="#8d6e63" opacity="0.5"/>
      </g>

      <!-- Sprout: entire group starts opacity=0, no standalone strokes -->
      <g id="tsv-sprout" opacity="0">
        <path d="M150,379 C149,369 150,361 150,353"
              stroke="#558b2f" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M150,362 C140,355 132,349 130,340 C136,341 144,352 150,359 Z" fill="#8bc34a"/>
        <path d="M150,362 C160,355 168,349 170,340 C164,341 156,352 150,359 Z" fill="#9ccc65"/>
      </g>

      <!-- Trunk revealed bottom→top by clip rect — no dashoffset -->
      <g clip-path="url(#tTrunkClip)">
        <path d="M141,382 C140,357 141,330 142,304 C143,277 144,252 145,228
                 C146,210 147,196 148,181 L152,181
                 C153,196 154,210 155,228 C156,252 157,277 158,304
                 C159,330 160,357 159,382 Z"
              fill="url(#tBark)"/>
        <path d="M146,382 C145,358 145,332 146,306 C146,282 147,258 147,234 C147,216 148,200 148,186"
              stroke="#3a2018" stroke-width="1.2" fill="none" opacity="0.30"/>
        <path d="M153,382 C154,354 154,327 153,301 C153,277 154,252 154,228 C154,210 153,196 153,184"
              stroke="#3a2018" stroke-width="0.9" fill="none" opacity="0.22"/>
        <path d="M135,382 C137,378 139,375 141,373" stroke="#5a3a2a" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.55"/>
        <path d="M165,382 C163,378 161,375 159,373" stroke="#5a3a2a" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.55"/>
        <path d="M149,382 C149,357 149,330 149,304 L151,304 C151,330 151,357 151,382 Z"
              fill="white" opacity="0.10"/>
      </g>

      <!-- Surface roots — hidden in opacity=0 group, no dashoffset -->
      <g id="tsv-roots" opacity="0">
        <path d="M141,382 C129,382 116,386 104,395" stroke="#5d4037" stroke-width="3"   stroke-linecap="round" fill="none"/>
        <path d="M144,383 C133,385 121,390 110,397" stroke="#4e342e" stroke-width="2"   stroke-linecap="round" fill="none"/>
        <path d="M159,382 C171,382 184,386 196,395" stroke="#5d4037" stroke-width="3"   stroke-linecap="round" fill="none"/>
        <path d="M156,383 C167,385 179,390 190,397" stroke="#4e342e" stroke-width="2"   stroke-linecap="round" fill="none"/>
      </g>

      <!-- Branches in opacity=0 groups — NO stroke-dashoffset, NO getTotalLength() -->
      <!-- All stroked paths inside opacity=0 groups are completely invisible -->
      <g id="tsv-bl" opacity="0">
        <path d="M146,309 C123,300 98,292 78,280"  stroke="#5a3a2a" stroke-width="5.5" stroke-linecap="round" fill="none"/>
        <path d="M154,307 C177,298 202,290 222,276" stroke="#5a3a2a" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      </g>
      <g id="tsv-bm" opacity="0">
        <path d="M146,261 C127,251 104,241 85,225"  stroke="#6b493c" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M154,259 C174,248 197,238 217,222" stroke="#6b493c" stroke-width="4" stroke-linecap="round" fill="none"/>
      </g>
      <g id="tsv-bu" opacity="0">
        <path d="M147,221 C128,211 107,199 89,185"  stroke="#7a5040" stroke-width="3"   stroke-linecap="round" fill="none"/>
        <path d="M153,219 C172,209 193,197 211,183" stroke="#7a5040" stroke-width="3"   stroke-linecap="round" fill="none"/>
        <path d="M150,200 C148,190 150,178 151,164" stroke="#7a5040" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </g>

      <!-- Leaf clusters — organic blobs, appear after branches -->
      <g id="tsv-ll" opacity="0">
        ${leafCluster(74,  264, 36, 13, 3,  0)}
        ${leafCluster(228, 262, 36, 13, 3, 55)}
      </g>
      <g id="tsv-lm" opacity="0">
        ${leafCluster(83,  213, 28, 10, 3, 25)}
        ${leafCluster(219, 210, 28, 10, 3, 75)}
      </g>
      <g id="tsv-lu" opacity="0">
        ${leafCluster(88,  176, 24,  8, 4, 10)}
        ${leafCluster(212, 174, 24,  8, 4, 60)}
        ${leafCluster(151, 155, 30, 10, 5, 35)}
      </g>
      <g id="tsv-canopy" opacity="0" filter="url(#tGlow)">
        <path d="${blob(150, 202, waveRing(16, 68, 20, 4,  5))}" fill="url(#tLeafA)" opacity="0.62"/>
        <path d="${blob(150, 193, waveRing(14, 52, 15, 4, 22))}" fill="url(#tLeafB)" opacity="0.76"/>
        <path d="${blob(152, 183, waveRing(12, 37, 11, 5,  8))}" fill="url(#tLeafC)" opacity="0.90"/>
      </g>`;

    this.seed     = this.svg.querySelector('#tsv-seed');
    this.sprout   = this.svg.querySelector('#tsv-sprout');
    this.clipRect = this.svg.querySelector('#tTrunkRect');
    this.roots    = this.svg.querySelector('#tsv-roots');
    this.bl       = this.svg.querySelector('#tsv-bl');
    this.bm       = this.svg.querySelector('#tsv-bm');
    this.bu       = this.svg.querySelector('#tsv-bu');
    this.ll       = this.svg.querySelector('#tsv-ll');
    this.lm       = this.svg.querySelector('#tsv-lm');
    this.lu       = this.svg.querySelector('#tsv-lu');
    this.canopy   = this.svg.querySelector('#tsv-canopy');
    this._trunkH  = 202; // y=382 → y=180
  }

  setProgress(p) {
    this.seed.setAttribute('opacity', (1 - r01(p, 0, 0.08)).toFixed(2));

    const sproutIn  = r01(p, 0.04, 0.16);
    const sproutOut = r01(p, 0.14, 0.28);
    this.sprout.setAttribute('opacity', Math.max(0, sproutIn - sproutOut).toFixed(2));

    // Trunk clip grows upward
    const tp = r01(p, 0.06, 0.38);
    const h  = tp * this._trunkH;
    this.clipRect.setAttribute('y',      (382 - h).toFixed(1));
    this.clipRect.setAttribute('height', h.toFixed(1));

    this.roots.setAttribute('opacity', r01(p, 0.10, 0.24).toFixed(2));

    // Branches: opacity groups fade in after trunk reaches attachment height
    // (no stroke-dashoffset — zero artifacts possible)
    this.bl.setAttribute('opacity', r01(p, 0.30, 0.37).toFixed(2));
    this.bm.setAttribute('opacity', r01(p, 0.38, 0.44).toFixed(2));
    this.bu.setAttribute('opacity', r01(p, 0.44, 0.50).toFixed(2));

    // Leaves after branches visible
    this.ll.setAttribute('opacity',     r01(p, 0.37, 0.56).toFixed(2));
    this.lm.setAttribute('opacity',     r01(p, 0.44, 0.62).toFixed(2));
    this.lu.setAttribute('opacity',     r01(p, 0.50, 0.70).toFixed(2));
    this.canopy.setAttribute('opacity', r01(p, 0.62, 1.00).toFixed(2));
  }

  show() { this.svg.style.display = ''; }
  hide() { this.svg.style.display = 'none'; }
}

/* ══════════════════════════════════════════════════════════
   SUCCULENT — Echeveria rosette (pure top-down view)
   Soil fills the entire background so nothing floats in air.
   Rosette grows from center outward, outer rings first.
   ══════════════════════════════════════════════════════════ */
class SucculentSVGRenderer {
  constructor(svgEl) { this.svg = svgEl; this._build(); this.setProgress(0); }

  _build() {
    this.svg.setAttribute('viewBox', '0 0 300 420');
    const C = ['#e0f2f1','#b2dfdb','#80cbc4','#26a69a','#00796b','#004d40'];

    this.svg.innerHTML = `
      <defs>
        <radialGradient id="sSoilBg" cx="50%" cy="50%" r="65%">
          <stop offset="0%"   stop-color="#3d2b1e"/>
          <stop offset="100%" stop-color="#1a0f08"/>
        </radialGradient>
        <radialGradient id="sBud" cx="40%" cy="35%" r="55%">
          <stop offset="0%"   stop-color="#e8f5e9"/>
          <stop offset="100%" stop-color="#66bb6a"/>
        </radialGradient>
        <filter id="sDrop">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#004d40" flood-opacity="0.45"/>
        </filter>
      </defs>

      <!-- Top-down soil fills the entire viewport — no floating horizon -->
      <rect x="0" y="0" width="300" height="420" fill="url(#sSoilBg)"/>
      <!-- Scattered soil particles -->
      <circle cx="42"  cy="38"  r="3.5" fill="#2a1a0e" opacity="0.50"/>
      <circle cx="118" cy="22"  r="2.5" fill="#2a1a0e" opacity="0.40"/>
      <circle cx="240" cy="68"  r="3"   fill="#2a1a0e" opacity="0.45"/>
      <circle cx="275" cy="140" r="2"   fill="#2a1a0e" opacity="0.35"/>
      <circle cx="18"  cy="195" r="3"   fill="#2a1a0e" opacity="0.42"/>
      <circle cx="260" cy="280" r="2.5" fill="#2a1a0e" opacity="0.40"/>
      <circle cx="55"  cy="340" r="2"   fill="#2a1a0e" opacity="0.35"/>
      <circle cx="200" cy="390" r="3"   fill="#2a1a0e" opacity="0.45"/>
      <circle cx="88"  cy="408" r="2.5" fill="#2a1a0e" opacity="0.38"/>
      <ellipse cx="30"  cy="310" rx="4"   ry="3"   fill="#2a1a0e" opacity="0.38"/>
      <ellipse cx="272" cy="360" rx="3.5" ry="2.5" fill="#2a1a0e" opacity="0.35"/>

      <!-- Seed at rosette center -->
      <g id="ssv-seed">
        <ellipse cx="150" cy="210" rx="8" ry="5"   fill="#5d4037"/>
        <ellipse cx="148" cy="208" rx="3" ry="1.5" fill="#795548" opacity="0.5"/>
      </g>

      <!-- Rosette at (150,210) — OUTER rings drawn first so inner appear on top -->
      <g transform="translate(150,210)" filter="url(#sDrop)">
        <g id="ssv-r4" transform="scale(0)">${leafRing(10, 18,  80, 24, C[5])}</g>
        <g id="ssv-r3" transform="scale(0)">${leafRing(8,   0,  64, 20, C[4])}</g>
        <g id="ssv-r2" transform="scale(0)">${leafRing(8,  22,  48, 16, C[3])}</g>
        <g id="ssv-r1" transform="scale(0)">${leafRing(6,  30,  34, 11, C[2])}</g>
        <g id="ssv-r0" transform="scale(0)">${leafRing(4,   0,  22,  8, C[1])}</g>
        <circle id="ssv-ctr" cx="0" cy="0" r="10" fill="url(#sBud)" opacity="0"/>
      </g>

      <!-- Offset pups (appear near maturity) -->
      <g id="ssv-offsets" opacity="0">
        <g transform="translate(62,315) scale(0.52)">
          ${leafRing(5,  0, 20, 7, C[3])}
          ${leafRing(3, 36, 12, 4, C[2])}
          <circle cx="0" cy="0" r="5" fill="${C[1]}"/>
        </g>
        <g transform="translate(238,318) scale(0.46)">
          ${leafRing(5, 20, 20, 7, C[3])}
          ${leafRing(3, 56, 12, 4, C[2])}
          <circle cx="0" cy="0" r="5" fill="${C[1]}"/>
        </g>
      </g>

      `;

    this.seed    = this.svg.querySelector('#ssv-seed');
    this.rings   = [0,1,2,3,4].map(i => this.svg.querySelector(`#ssv-r${i}`));
    this.ctr     = this.svg.querySelector('#ssv-ctr');
    this.offsets = this.svg.querySelector('#ssv-offsets');

    this._timing = [
      [0.04, 0.22],  // r0 innermost bud
      [0.18, 0.42],  // r1
      [0.35, 0.58],  // r2
      [0.52, 0.72],  // r3
      [0.65, 0.88],  // r4 outermost
    ];
  }

  setProgress(p) {
    this.seed.setAttribute('opacity', (1 - r01(p, 0, 0.10)).toFixed(2));
    this._timing.forEach(([s, e], i) =>
      this.rings[i].setAttribute('transform', `scale(${r01(p, s, e).toFixed(3)})`));
    this.ctr.setAttribute('opacity',     r01(p, 0.06, 0.30).toFixed(2));
    this.offsets.setAttribute('opacity', r01(p, 0.78, 1.00).toFixed(2));
  }

  show() { this.svg.style.display = ''; }
  hide() { this.svg.style.display = 'none'; }
}

/* ══════════════════════════════════════════════════════════
   HERB — Lavender bunch
   All 5 stems emerge from (150,380).
   Stems revealed bottom→top by a growing clipPath rect —
   NO stroke-dashoffset, NO getTotalLength(), zero artifacts.
   Leaves fade in after stems fully revealed. Spikes last.
   ══════════════════════════════════════════════════════════ */
class HerbSVGRenderer {
  constructor(svgEl) { this.svg = svgEl; this._build(); this.setProgress(0); }

  _build() {
    this.svg.setAttribute('viewBox', '0 0 300 420');

    // Lavender spike at tip position (local coords, translate applied)
    const spike = (cx, cy) =>
      `<g transform="translate(${cx},${cy})">
        <ellipse cx="0" cy="-26" rx="3.5" ry="5"   fill="#b39ddb" opacity="0.9"/>
        <ellipse cx="0" cy="-19" rx="4"   ry="6"   fill="#9575cd"/>
        <ellipse cx="0" cy="-12" rx="4.5" ry="6.5" fill="#7e57c2"/>
        <ellipse cx="0" cy="-5"  rx="4.5" ry="6"   fill="#673ab7"/>
        <ellipse cx="0" cy="2"   rx="4"   ry="5.5" fill="#5e35b1"/>
        <ellipse cx="0" cy="8"   rx="3"   ry="4.5" fill="#4527a0"/>
      </g>`;

    // Narrow leaf pair at (x,y) — lavender-style linear leaves
    const leafPair = (x, y) =>
      `<path d="M${x},${y} C${x-13},${y-5} ${x-17},${y-18} ${x-5},${y-20} C${x-1},${y-12} ${x},${y} Z" fill="#7cb342" opacity="0.88"/>
       <path d="M${x},${y} C${x+13},${y-5} ${x+17},${y-18} ${x+5},${y-20} C${x+1},${y-12} ${x},${y} Z" fill="#8bc34a" opacity="0.88"/>`;

    this.svg.innerHTML = `
      <defs>
        <radialGradient id="hGnd" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stop-color="#3d5a1e"/>
          <stop offset="100%" stop-color="#1a3008"/>
        </radialGradient>
        <linearGradient id="hStemG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#558b2f"/>
          <stop offset="100%" stop-color="#33691e"/>
        </linearGradient>
        <linearGradient id="hStemW" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#795548"/>
          <stop offset="100%" stop-color="#5d4037"/>
        </linearGradient>
        <!-- Single clip rect reveals all stems upward from soil — no dashoffset needed -->
        <clipPath id="hStemsClip">
          <rect id="hStemsRect" x="60" y="380" width="180" height="0"/>
        </clipPath>
      </defs>

      <!-- Ground — all stems emerge from this base -->
      <ellipse cx="150" cy="387" rx="112" ry="23" fill="url(#hGnd)" opacity="0.9"/>
      <ellipse cx="150" cy="381" rx="82"  ry="13" fill="#2d5a18"    opacity="0.45"/>

      <!-- Seed -->
      <g id="hsv-seed">
        <ellipse cx="150" cy="375" rx="8"  ry="5"   fill="#5d4037"/>
        <ellipse cx="148" cy="373" rx="3"  ry="1.5" fill="#795548" opacity="0.45"/>
      </g>

      <!-- All 5 stems inside clip group — clip rect grows upward, no dashoffset -->
      <g clip-path="url(#hStemsClip)">
        <path d="M150,380 C138,344 118,304  98,175" stroke="url(#hStemG)" stroke-width="2.0" stroke-linecap="round" fill="none"/>
        <path d="M150,380 C145,342 130,298 122,153" stroke="url(#hStemG)" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <path d="M150,380 C150,340 150,298 150,135" stroke="url(#hStemG)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M150,380 C155,342 170,298 178,153" stroke="url(#hStemG)" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <path d="M150,380 C162,344 182,304 202,175" stroke="url(#hStemG)" stroke-width="2.0" stroke-linecap="round" fill="none"/>
      </g>

      <!-- Woody base (lignified lower stems) -->
      <g id="hsv-woody" opacity="0">
        <path d="M144,380 C143,368 143,356 144,348 L156,348 C157,356 157,368 156,380 Z"
              fill="url(#hStemW)" opacity="0.72"/>
      </g>

      <!-- Leaf pairs along all stems — appear after stems fully grown -->
      <g id="hsv-leaves" opacity="0">
        ${leafPair(98,  288)} ${leafPair(100, 238)} ${leafPair(100, 198)}
        ${leafPair(122, 258)} ${leafPair(124, 208)} ${leafPair(126, 168)}
        ${leafPair(150, 268)} ${leafPair(150, 222)} ${leafPair(150, 178)}
        ${leafPair(178, 258)} ${leafPair(176, 208)} ${leafPair(174, 168)}
        ${leafPair(202, 288)} ${leafPair(200, 238)} ${leafPair(200, 198)}
      </g>

      <!-- Lavender spikes at stem tips -->
      <g id="hsv-spikes" opacity="0">
        ${spike( 98, 167)}
        ${spike(122, 145)}
        ${spike(150, 127)}
        ${spike(178, 145)}
        ${spike(202, 167)}
      </g>`;

    this.seed      = this.svg.querySelector('#hsv-seed');
    this.clipRect  = this.svg.querySelector('#hStemsRect');
    this.woody     = this.svg.querySelector('#hsv-woody');
    this.leaves    = this.svg.querySelector('#hsv-leaves');
    this.spikes    = this.svg.querySelector('#hsv-spikes');
    // Center stem tip is at y=135; clip grows from y=380 upward, max height = 245
    this._stemMaxH = 245;
  }

  setProgress(p) {
    this.seed.setAttribute('opacity', (1 - r01(p, 0, 0.08)).toFixed(2));

    // Grow clip rect upward from soil — reveals stems bottom to top, zero artifacts
    const stemP = r01(p, 0.03, 0.46);
    const h     = stemP * this._stemMaxH;
    this.clipRect.setAttribute('y',      (380 - h).toFixed(1));
    this.clipRect.setAttribute('height', h.toFixed(1));

    this.woody.setAttribute('opacity',  r01(p, 0.42, 0.62).toFixed(2));
    this.leaves.setAttribute('opacity', r01(p, 0.46, 0.65).toFixed(2));
    this.spikes.setAttribute('opacity', r01(p, 0.62, 1.00).toFixed(2));
  }

  show() { this.svg.style.display = ''; }
  hide() { this.svg.style.display = 'none'; }
}

/* ══════════════════════════════════════════════════════════
   EXOTIC — Amanita mushroom (toadstool)

   REAL growth sequence:
   1. Mycelium network spreads at soil surface
   2. Tiny pin (red nub) pokes through soil
   3. Stipe grows UPWARD from soil — revealed bottom→top
      by a clip rect (same technique as tree trunk)
   4. Closed bullet cap appears at stipe top as it grows
   5. Only AFTER stipe is full height does cap open/flatten
   6. Veil breaks → annulus ring snaps onto stipe
   7. Gills deepen, volva at base, spots last
   ══════════════════════════════════════════════════════════ */
class ExoticSVGRenderer {
  constructor(svgEl) { this.svg = svgEl; this._build(); this.setProgress(0); }

  _build() {
    this.svg.setAttribute('viewBox', '0 0 300 420');
    this.svg.innerHTML = `
      <defs>
        <radialGradient id="eGnd" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stop-color="#3d2b1a"/>
          <stop offset="100%" stop-color="#1a0f08"/>
        </radialGradient>
        <radialGradient id="eCapGrad" cx="28%" cy="20%" r="65%">
          <stop offset="0%"   stop-color="#ef5350"/>
          <stop offset="50%"  stop-color="#c62828"/>
          <stop offset="100%" stop-color="#7f0000"/>
        </radialGradient>
        <linearGradient id="eStipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#e8d8c0"/>
          <stop offset="45%"  stop-color="#faf3e8"/>
          <stop offset="100%" stop-color="#d8c8a8"/>
        </linearGradient>
        <radialGradient id="eGillGrad" cx="50%" cy="0%" r="80%">
          <stop offset="0%"   stop-color="#f5c8a0"/>
          <stop offset="100%" stop-color="#c4835a"/>
        </radialGradient>
        <filter id="eGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <!-- Stipe clip: grows upward from soil line (y=378) -->
        <clipPath id="eStipeClip">
          <rect id="eStipeRect" x="130" y="378" width="40" height="0"/>
        </clipPath>
      </defs>

      <!-- Ground -->
      <ellipse cx="150" cy="390" rx="108" ry="24" fill="url(#eGnd)" opacity="0.98"/>
      <ellipse cx="150" cy="383" rx="78"  ry="14" fill="#2a1a0a"    opacity="0.55"/>
      <circle cx="110" cy="384" r="3" fill="#1a0f08" opacity="0.35"/>
      <circle cx="182" cy="387" r="2" fill="#1a0f08" opacity="0.30"/>
      <circle cx="142" cy="390" r="2" fill="#1a0f08" opacity="0.28"/>

      <!-- Mycelium threads -->
      <g id="esv-mycelium" opacity="0">
        <line x1="150" y1="378" x2="86"  y2="392" stroke="#e0d0b0" stroke-width="1.4" opacity="0.55"/>
        <line x1="150" y1="378" x2="70"  y2="382" stroke="#e0d0b0" stroke-width="1.0" opacity="0.44"/>
        <line x1="150" y1="378" x2="108" y2="398" stroke="#e0d0b0" stroke-width="1.1" opacity="0.48"/>
        <line x1="150" y1="378" x2="214" y2="392" stroke="#e0d0b0" stroke-width="1.4" opacity="0.55"/>
        <line x1="150" y1="378" x2="230" y2="382" stroke="#e0d0b0" stroke-width="1.0" opacity="0.44"/>
        <line x1="150" y1="378" x2="192" y2="398" stroke="#e0d0b0" stroke-width="1.1" opacity="0.48"/>
        <line x1="150" y1="378" x2="138" y2="400" stroke="#e0d0b0" stroke-width="0.9" opacity="0.36"/>
        <line x1="150" y1="378" x2="165" y2="400" stroke="#e0d0b0" stroke-width="0.9" opacity="0.36"/>
        <circle cx="118" cy="388" r="2" fill="#d4c0a0" opacity="0.45"/>
        <circle cx="182" cy="388" r="2" fill="#d4c0a0" opacity="0.45"/>
      </g>

      <!-- Pin: tiny red nub before stipe emerges -->
      <g id="esv-pin" opacity="0">
        <ellipse cx="150" cy="374" rx="7" ry="5"   fill="#c62828" opacity="0.9"/>
        <ellipse cx="148" cy="372" rx="3" ry="2"   fill="#ef5350" opacity="0.5"/>
      </g>

      <!-- Stipe: tapered column revealed bottom→top by clip rect -->
      <g clip-path="url(#eStipeClip)">
        <path d="M140,378 C139,355 139,325 140,300 C141,291 142,285 143,283
                 L157,283 C158,285 159,291 160,300 C161,325 161,355 160,378 Z"
              fill="url(#eStipeGrad)"/>
        <path d="M148,378 C148,355 148,325 149,300 L151,300
                 C151,325 151,355 151,378 Z"
              fill="white" opacity="0.15"/>
      </g>

      <!-- Volva cup at stipe base -->
      <g id="esv-volva" opacity="0">
        <ellipse cx="150" cy="375" rx="22" ry="9" fill="#c8a878"/>
        <ellipse cx="150" cy="373" rx="16" ry="6" fill="#e0c090"/>
      </g>

      <!-- Annulus ring at mid-stipe -->
      <ellipse id="esv-ring" cx="150" cy="320" rx="0" ry="0"
               fill="#e8d0b0" stroke="#c8a878" stroke-width="1.2" opacity="0"/>

      <!--
        Cap group centered at stipe top (150, 283).
        Scales from 0→1 as stipe nears its top (10–42%),
        then morphs bullet→open dome (42–88%).
      -->
      <g id="esv-cap-group" transform="translate(150,283) scale(0)">
        <!-- Gills: filled arc below cap rim, deepens as cap flattens -->
        <path id="esv-gills" d="M-20,2 Q0,2 20,2" fill="url(#eGillGrad)" opacity="0"/>
        <!-- Main cap -->
        <path id="esv-cap"
              d="M-20,2 C-21,-10 -14,-38 0,-40 C14,-38 21,-10 20,2 Z"
              fill="url(#eCapGrad)" filter="url(#eGlow)"/>
        <!-- Specular highlight -->
        <ellipse id="esv-cap-hi" cx="-12" cy="-28" rx="8" ry="5"
                 fill="#ff6b6b" opacity="0.38" transform="rotate(-20,-12,-28)"/>
      </g>

      <!-- White spots on cap surface (appear near maturity, fixed SVG coords) -->
      <g id="esv-spots" opacity="0">
        <circle cx="150" cy="253" r="10"  fill="white" opacity="0.90"/>
        <circle cx="118" cy="264" r="7"   fill="white" opacity="0.87"/>
        <circle cx="182" cy="264" r="7"   fill="white" opacity="0.87"/>
        <circle cx="133" cy="245" r="5.5" fill="white" opacity="0.82"/>
        <circle cx="169" cy="245" r="5.5" fill="white" opacity="0.82"/>
        <circle cx="157" cy="272" r="4.5" fill="white" opacity="0.76"/>
        <circle cx="146" cy="238" r="4"   fill="white" opacity="0.74"/>
      </g>`;

    this.mycelium = this.svg.querySelector('#esv-mycelium');
    this.pin      = this.svg.querySelector('#esv-pin');
    this.clipRect = this.svg.querySelector('#eStipeRect');
    this.volva    = this.svg.querySelector('#esv-volva');
    this.ring     = this.svg.querySelector('#esv-ring');
    this.capGroup = this.svg.querySelector('#esv-cap-group');
    this.gills    = this.svg.querySelector('#esv-gills');
    this.cap      = this.svg.querySelector('#esv-cap');
    this.capHi    = this.svg.querySelector('#esv-cap-hi');
    this.spots    = this.svg.querySelector('#esv-spots');

    this._stipeH = 95; // total stipe height px (y=378 → y=283)
  }

  setProgress(p) {
    // Mycelium: 0–14%
    this.mycelium.setAttribute('opacity', r01(p, 0, 0.14).toFixed(2));

    // Pin pokes through soil: 3–20%, then fades as stipe emerges
    const pinIn  = r01(p, 0.03, 0.14);
    const pinOut = r01(p, 0.12, 0.24);
    this.pin.setAttribute('opacity', Math.max(0, pinIn - pinOut).toFixed(2));

    // Stipe grows upward from soil: 10–42%
    const stipeP = r01(p, 0.10, 0.42);
    const h      = stipeP * this._stipeH;
    this.clipRect.setAttribute('y',      (378 - h).toFixed(1));
    this.clipRect.setAttribute('height', h.toFixed(1));

    // Cap group: only appears once stipe is fully drawn (done at 0.42), scales in 0.42–0.54
    const capScaleP = r01(p, 0.42, 0.54);
    // Cap morphs bullet→dome only after stipe fully grown (42–88%)
    const capMorphP = r01(p, 0.42, 0.88);

    const rx   = lerp(20, 78, capMorphP);
    const ry   = lerp(40, 50, capMorphP);
    const ctrl = ry * 0.68;
    this.cap.setAttribute('d',
      `M${(-rx).toFixed(1)},2 ` +
      `C${(-rx).toFixed(1)},${(2 - ctrl).toFixed(1)} ` +
      `${(-rx * 0.45).toFixed(1)},${(2 - ry).toFixed(1)} ` +
      `0,${(2 - ry).toFixed(1)} ` +
      `C${(rx * 0.45).toFixed(1)},${(2 - ry).toFixed(1)} ` +
      `${rx.toFixed(1)},${(2 - ctrl).toFixed(1)} ` +
      `${rx.toFixed(1)},2 Z`
    );
    this.capGroup.setAttribute('transform',
      `translate(150,283) scale(${capScaleP.toFixed(3)})`);

    // Highlight follows cap morph
    this.capHi.setAttribute('rx', lerp(8,  18, capMorphP).toFixed(1));
    this.capHi.setAttribute('ry', lerp(5,   7, capMorphP).toFixed(1));
    this.capHi.setAttribute('cx', lerp(-12,-22, capMorphP).toFixed(1));
    this.capHi.setAttribute('cy', lerp(-28,-36, capMorphP).toFixed(1));

    // Gills deepen as cap flattens
    const gillRx = rx * 0.84;
    const gillD  = lerp(0, 20, capMorphP);
    this.gills.setAttribute('d',
      `M${(-gillRx).toFixed(1)},2 Q0,${(2 + gillD).toFixed(1)} ${gillRx.toFixed(1)},2`);
    this.gills.setAttribute('opacity', (r01(p, 0.50, 0.72) * 0.85).toFixed(2));

    // Volva at base: 32–52%
    this.volva.setAttribute('opacity', r01(p, 0.32, 0.52).toFixed(2));

    // Annulus ring snaps in after veil breaks: 52–64%
    const ringP = r01(p, 0.52, 0.64);
    this.ring.setAttribute('opacity', ringP.toFixed(2));
    this.ring.setAttribute('rx', (ringP * 16).toFixed(1));
    this.ring.setAttribute('ry', (ringP *  5).toFixed(1));

    // Spots appear near maturity: 74–100%
    this.spots.setAttribute('opacity', r01(p, 0.74, 1.00).toFixed(2));
  }

  show() { this.svg.style.display = ''; }
  hide() { this.svg.style.display = 'none'; }
}

/* ══════════════════════════════════════════════════════════
   DISPATCHER
   ══════════════════════════════════════════════════════════ */
export class PlantSVGRenderer {
  constructor(svgEl) {
    this.svg       = svgEl;
    this._renderer = null;
    this._category = null;
  }

  setCategory(category) {
    if (this._category === category && this._renderer) return;
    this._category = category;
    // Ensure SVG is visible during build so getTotalLength() returns correct values.
    // A display:none element returns 0, which sets stroke-dasharray:0 and causes
    // tiny dot artifacts at bezier control points with stroke-linecap="round".
    const wasHidden = this.svg.style.display === 'none';
    if (wasHidden) this.svg.style.display = 'block';
    switch (category) {
      case 'Flowers':    this._renderer = new FlowerSVGRenderer(this.svg);    break;
      case 'Trees':      this._renderer = new TreeSVGRenderer(this.svg);      break;
      case 'Succulents': this._renderer = new SucculentSVGRenderer(this.svg); break;
      case 'Herbs':      this._renderer = new HerbSVGRenderer(this.svg);      break;
      case 'Exotic':     this._renderer = new ExoticSVGRenderer(this.svg);    break;
      default:           this._renderer = new FlowerSVGRenderer(this.svg);
    }
    if (wasHidden) this.svg.style.display = 'none';
  }

  setProgress(p) {
    if (this._renderer) this._renderer.setProgress(p);
  }

  show() { this.svg.style.display = ''; }
  hide() { this.svg.style.display = 'none'; }
}
