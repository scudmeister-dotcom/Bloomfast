/* ============================================================
   FlowerSVGRenderer — Pure SVG botanical growth animation
   Driven by a progress value (0–1) from the fasting timer.
   ============================================================ */

export class FlowerSVGRenderer {
  constructor(svgEl) {
    this.svg = svgEl;
    this._build();
    this.setProgress(0);
  }

  _build() {
    this.svg.setAttribute('viewBox', '0 0 300 420');

    this.svg.innerHTML = `
      <defs>
        <!-- Petal gradient: light center to deep edge -->
        <radialGradient id="fsvPetalGrad" cx="50%" cy="75%" r="55%">
          <stop offset="0%"   stop-color="#ffe0ec"/>
          <stop offset="55%"  stop-color="#f48fb1"/>
          <stop offset="100%" stop-color="#c2185b"/>
        </radialGradient>

        <!-- Inner petal layer (slightly different hue) -->
        <radialGradient id="fsvPetalGrad2" cx="50%" cy="75%" r="55%">
          <stop offset="0%"   stop-color="#fce4ec"/>
          <stop offset="55%"  stop-color="#f06292"/>
          <stop offset="100%" stop-color="#ad1457"/>
        </radialGradient>

        <!-- Center golden gradient -->
        <radialGradient id="fsvCenterGrad" cx="40%" cy="40%" r="55%">
          <stop offset="0%"   stop-color="#fff9c4"/>
          <stop offset="60%"  stop-color="#fdd835"/>
          <stop offset="100%" stop-color="#f57f17"/>
        </radialGradient>

        <!-- Ground gradient -->
        <radialGradient id="fsvGroundGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stop-color="#3d6b28"/>
          <stop offset="100%" stop-color="#1a3d0a"/>
        </radialGradient>

        <!-- Leaf gradient -->
        <linearGradient id="fsvLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#56ab2f"/>
          <stop offset="100%" stop-color="#2d6e18"/>
        </linearGradient>

        <!-- Soft glow filter for full bloom -->
        <filter id="fsvGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Subtle petal glow -->
        <filter id="fsvPetalGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- ── Ground ── -->
      <ellipse cx="150" cy="382" rx="100" ry="22" fill="url(#fsvGroundGrad)" opacity="0.85"/>
      <ellipse cx="150" cy="377" rx="76"  ry="13" fill="#2d7a1e" opacity="0.45"/>
      <!-- small soil texture dots -->
      <circle cx="118" cy="378" r="3" fill="#1a4d0a" opacity="0.4"/>
      <circle cx="175" cy="380" r="2" fill="#1a4d0a" opacity="0.35"/>
      <circle cx="140" cy="382" r="2" fill="#1a4d0a" opacity="0.3"/>

      <!-- ── Seed ── -->
      <g id="fsv-seed">
        <ellipse cx="150" cy="368" rx="9" ry="6" fill="#4e342e" opacity="0.9"/>
        <ellipse cx="148" cy="366" rx="3" ry="2" fill="#795548" opacity="0.5"/>
      </g>

      <!-- ── Stem (drawn via stroke-dashoffset) ── -->
      <path id="fsv-stem"
        d="M150,370 C146,338 154,298 149,255 C144,212 154,166 150,108"
        stroke="#3a8a1f" stroke-width="5.5" stroke-linecap="round"
        fill="none"/>

      <!-- ── Lower leaves ── -->
      <g id="fsv-leaves-low" opacity="0">
        <!-- Left -->
        <path d="M149,268 C126,251 109,238 113,213 C121,221 138,250 149,263 Z"
              fill="url(#fsvLeafGrad)"/>
        <!-- leaf vein -->
        <path d="M149,263 C136,248 122,230 114,216"
              stroke="#2d6e18" stroke-width="1" fill="none" opacity="0.5"/>
        <!-- Right -->
        <path d="M151,268 C174,251 191,238 187,213 C179,221 162,250 151,263 Z"
              fill="url(#fsvLeafGrad)"/>
        <path d="M151,263 C164,248 178,230 186,216"
              stroke="#2d6e18" stroke-width="1" fill="none" opacity="0.5"/>
      </g>

      <!-- ── Upper leaves ── -->
      <g id="fsv-leaves-up" opacity="0">
        <!-- Left -->
        <path d="M149,200 C126,183 109,170 113,145 C121,153 138,182 149,195 Z"
              fill="url(#fsvLeafGrad)" opacity="0.9"/>
        <path d="M149,195 C136,180 122,162 114,148"
              stroke="#2d6e18" stroke-width="1" fill="none" opacity="0.5"/>
        <!-- Right -->
        <path d="M151,200 C174,183 191,170 187,145 C179,153 162,182 151,195 Z"
              fill="url(#fsvLeafGrad)" opacity="0.9"/>
        <path d="M151,195 C164,180 178,162 186,148"
              stroke="#2d6e18" stroke-width="1" fill="none" opacity="0.5"/>
      </g>

      <!-- ── Flower head (all parts centered at 150,108) ── -->
      <g id="fsv-flower" transform="translate(150,108)">

        <!-- Sepals (green pointed shapes under petals) -->
        <g id="fsv-sepals" transform="scale(0)">
          <ellipse cx="0" cy="-16" rx="5" ry="16" fill="#3a8a1f" transform="rotate(0)"/>
          <ellipse cx="0" cy="-16" rx="5" ry="16" fill="#3a8a1f" transform="rotate(60)"/>
          <ellipse cx="0" cy="-16" rx="5" ry="16" fill="#3a8a1f" transform="rotate(120)"/>
          <ellipse cx="0" cy="-16" rx="5" ry="16" fill="#3a8a1f" transform="rotate(180)"/>
          <ellipse cx="0" cy="-16" rx="5" ry="16" fill="#3a8a1f" transform="rotate(240)"/>
          <ellipse cx="0" cy="-16" rx="5" ry="16" fill="#3a8a1f" transform="rotate(300)"/>
        </g>

        <!-- Outer petals (6 petals, rotated 30° offset so inner/outer layer interleave) -->
        <g id="fsv-petals-outer" transform="scale(0)">
          <ellipse cx="0" cy="-34" rx="13" ry="25" fill="url(#fsvPetalGrad)"  transform="rotate(30)"/>
          <ellipse cx="0" cy="-34" rx="13" ry="25" fill="url(#fsvPetalGrad)"  transform="rotate(90)"/>
          <ellipse cx="0" cy="-34" rx="13" ry="25" fill="url(#fsvPetalGrad)"  transform="rotate(150)"/>
          <ellipse cx="0" cy="-34" rx="13" ry="25" fill="url(#fsvPetalGrad)"  transform="rotate(210)"/>
          <ellipse cx="0" cy="-34" rx="13" ry="25" fill="url(#fsvPetalGrad)"  transform="rotate(270)"/>
          <ellipse cx="0" cy="-34" rx="13" ry="25" fill="url(#fsvPetalGrad)"  transform="rotate(330)"/>
        </g>

        <!-- Inner petals (slightly smaller, different offset) -->
        <g id="fsv-petals-inner" transform="scale(0)">
          <ellipse cx="0" cy="-26" rx="10" ry="20" fill="url(#fsvPetalGrad2)" transform="rotate(0)"/>
          <ellipse cx="0" cy="-26" rx="10" ry="20" fill="url(#fsvPetalGrad2)" transform="rotate(60)"/>
          <ellipse cx="0" cy="-26" rx="10" ry="20" fill="url(#fsvPetalGrad2)" transform="rotate(120)"/>
          <ellipse cx="0" cy="-26" rx="10" ry="20" fill="url(#fsvPetalGrad2)" transform="rotate(180)"/>
          <ellipse cx="0" cy="-26" rx="10" ry="20" fill="url(#fsvPetalGrad2)" transform="rotate(240)"/>
          <ellipse cx="0" cy="-26" rx="10" ry="20" fill="url(#fsvPetalGrad2)" transform="rotate(300)"/>
        </g>

        <!-- Center disc -->
        <g id="fsv-center" transform="scale(0)">
          <circle cx="0" cy="0" r="16" fill="url(#fsvCenterGrad)" filter="url(#fsvGlow)"/>
          <circle cx="0" cy="0" r="9"  fill="#fff59d" opacity="0.65"/>
          <!-- Pollen dots arranged in a ring -->
          <circle cx="0"    cy="-11" r="2.2" fill="#e65100" opacity="0.85"/>
          <circle cx="9.5"  cy="-5.5" r="2.2" fill="#e65100" opacity="0.85"/>
          <circle cx="9.5"  cy="5.5"  r="2.2" fill="#e65100" opacity="0.85"/>
          <circle cx="0"    cy="11"  r="2.2" fill="#e65100" opacity="0.85"/>
          <circle cx="-9.5" cy="5.5"  r="2.2" fill="#e65100" opacity="0.85"/>
          <circle cx="-9.5" cy="-5.5" r="2.2" fill="#e65100" opacity="0.85"/>
        </g>

      </g>
    `;

    // ── Cache element references ──
    this.seed        = this.svg.querySelector('#fsv-seed');
    this.stem        = this.svg.querySelector('#fsv-stem');
    this.leavesLow   = this.svg.querySelector('#fsv-leaves-low');
    this.leavesUp    = this.svg.querySelector('#fsv-leaves-up');
    this.sepals      = this.svg.querySelector('#fsv-sepals');
    this.petalsOuter = this.svg.querySelector('#fsv-petals-outer');
    this.petalsInner = this.svg.querySelector('#fsv-petals-inner');
    this.center      = this.svg.querySelector('#fsv-center');

    // ── Stem stroke-dash setup ──
    this.stemLength = this.stem.getTotalLength();
    this.stem.style.strokeDasharray  = this.stemLength;
    this.stem.style.strokeDashoffset = this.stemLength;
  }

  /**
   * Update the flower to match a given progress (0–1).
   * Called every second by the timer tick.
   */
  setProgress(p) {
    // Clamp helper: maps value v from range [a,b] → [0,1]
    const r = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));

    // ── Seed: visible at start, fades as stem emerges ──
    this.seed.setAttribute('opacity', (1 - r(p, 0, 0.1)).toFixed(2));

    // ── Stem draws upward: 0% → 45% ──
    const stemP = r(p, 0, 0.45);
    this.stem.style.strokeDashoffset = (this.stemLength * (1 - stemP)).toFixed(2);

    // ── Lower leaves unfurl: 25% → 52% ──
    this.leavesLow.setAttribute('opacity', r(p, 0.25, 0.52).toFixed(2));

    // ── Upper leaves unfurl: 42% → 66% ──
    this.leavesUp.setAttribute('opacity', r(p, 0.42, 0.66).toFixed(2));

    // ── Sepals form: 56% → 72% ──
    const sepalS = r(p, 0.56, 0.72).toFixed(3);
    this.sepals.setAttribute('transform', `scale(${sepalS})`);

    // ── Outer petals open: 68% → 100% ──
    const outerS = r(p, 0.68, 1.0).toFixed(3);
    this.petalsOuter.setAttribute('transform', `scale(${outerS})`);

    // ── Inner petals open slightly later: 72% → 100% ──
    const innerS = r(p, 0.72, 1.0).toFixed(3);
    this.petalsInner.setAttribute('transform', `scale(${innerS})`);

    // ── Center disc: 78% → 100% ──
    const centerS = r(p, 0.78, 1.0).toFixed(3);
    this.center.setAttribute('transform', `scale(${centerS})`);
  }

  show() {
    this.svg.style.display = '';
  }

  hide() {
    this.svg.style.display = 'none';
  }
}
