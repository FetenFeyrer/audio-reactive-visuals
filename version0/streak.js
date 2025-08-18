// ---------- Streak ----------
class Streak {
  constructor() { this.reset(); }

  reset() {
    // Direction vector
    const ang = random(TWO_PI);
    this.dx = cos(ang); this.dy = sin(ang);

    // Pull theme now (in case scene changed)
    const theme = LIVE.STREAK_THEME || {};
    const dirMode = theme.direction || 'out';
    if (dirMode === 'in') this.inward = true;
    else if (dirMode === 'both') this.inward = (random() < (theme.reverseProb ?? 0.5));
    else this.inward = false;

    // Path geometry
    this.edgeDist = edgeDistanceFromCenter(this.dx, this.dy);
    this.distMax  = this.edgeDist * random(1.05, 1.3);

    // Progress and kinematics
    this.prog  = 0;
    this.speed = random(LIVE.STREAK_SPEED_MIN ?? STREAK_SPEED_MIN,
                        LIVE.STREAK_SPEED_MAX ?? STREAK_SPEED_MAX); // normalized base speed
    this.len   = random(STREAK_LEN_PX_MIN, STREAK_LEN_PX_MAX);

    // Visuals
    this.baseW = (LIVE.STREAK_BASE_WIDTH ?? STREAK_BASE_WIDTH) * random(0.8, 1.5);
    this.alpha = 0.25;

    // Color init based on theme
    this.hue = this._pickHue(theme);
  }

  _pickHue(theme) {
    const pal = (theme.palette || 'rainbow').toLowerCase();
    if (pal === 'white') return 0; // hue irrelevant (sat 0)
    if (pal === 'blue')  return (theme.hueBase ?? 205) + random(-(theme.hueRange ?? 20), (theme.hueRange ?? 20));
    if (pal === 'mono')  return (theme.hueBase ?? 0) + random(-(theme.hueRange ?? 0), (theme.hueRange ?? 0));
    // rainbow
    return random(360);
  }

  _themeFlickerMul() {
    const flick = (LIVE.STREAK_THEME && LIVE.STREAK_THEME.flicker) ? LIVE.STREAK_THEME.flicker : null;
    if (!flick || !flick.enabled) return 1.0;

    if (flick.linkStrobe) {
      // Tie directly to current strobe energy
      return constrain(0.15 + 0.85 * constrain(strobePulse, 0, 1), flick.minMul ?? 0.15, flick.maxMul ?? 1.0);
    }
    // Random chance to flicker this frame
    if (random() < (flick.prob ?? 0.02)) {
      return random(flick.minMul ?? 0.2, flick.maxMul ?? 1.0);
    }
    return 1.0;
  }

  update(audioReact, kick) {
    const t = constrain(this.prog, 0, 1);
    const accel = 1 + t * 1.4; // speeds up as it flies out
    this.prog += this.speed * accel * (0.85 + audioReact * 0.5 + kick * 0.8);

    if (this.prog >= 1.05) { this.reset(); return; }

    // Accelerating travel like sprites (ease-in)
    const cx = windowWidth / 2, cy = windowHeight / 2;
    const travel = (t * t) * this.distMax;

    if (!this.inward) {
      // Center -> Edge (outward)
      const prev = max(travel - this.len, 0);
      this.x  = cx + this.dx * travel;
      this.y  = cy + this.dy * travel;
      this.px = cx + this.dx * prev;
      this.py = cy + this.dy * prev;
    } else {
      // Edge -> Center (inward)
      const distFromCenter = this.distMax - travel; // start at edge, move to center
      const prev = min(this.distMax, distFromCenter + this.len);
      this.x  = cx + this.dx * distFromCenter;
      this.y  = cy + this.dy * distFromCenter;
      this.px = cx + this.dx * prev;
      this.py = cy + this.dy * prev;
    }

    // Width & alpha shaping near the edge
    const edgeProx = constrain(travel / (this.edgeDist * 0.99), 0, 1);

    this.w = this.baseW
           * (1 + pow(edgeProx, 1.2) * (LIVE.STREAK_EDGE_WIDTH_MULT ?? STREAK_EDGE_WIDTH_MULT))
           * (1 + audioReact * 0.2 + kick * 0.3);

    const theme = LIVE.STREAK_THEME || {};
    const aBase = theme.alphaBase ?? 0.18;
    const aEdge = theme.alphaEdgeBoost ?? 0.35;
    let a = aBase + edgeProx * aEdge;
    a *= this._themeFlickerMul(); // flicker

    this.alpha = constrain(a, 0, 1);

    // Hue drift per theme
    const pal = (theme.palette || 'rainbow').toLowerCase();
    const drift = theme.hueDrift ?? 0.6;
    if (pal === 'white') {
      // stay grayscale (sat 0)
    } else if (pal === 'blue' || pal === 'mono') {
      const base = (pal === 'blue') ? (theme.hueBase ?? 205) : (theme.hueBase ?? 0);
      const range = theme.hueRange ?? (pal === 'blue' ? 20 : 0);
      // drift softly but keep clamped around base
      this.hue += (random(-drift, drift));
      this.hue = constrain(this.hue, base - range, base + range);
    } else {
      // rainbow: keep spinning
      this.hue += drift + audioReact * 2.0;
      if (this.hue >= 360) this.hue -= 360;
    }
  }

  draw() {
    const theme = LIVE.STREAK_THEME || {};
    const nx = -this.dy, ny = this.dx; // perpendicular
    const hwHead = this.w * 0.5;
    const hwTail = this.w * 0.25;

    const x1 = this.x  + nx * hwHead, y1 = this.y  + ny * hwHead;
    const x2 = this.x  - nx * hwHead, y2 = this.y  - ny * hwHead;
    const x3 = this.px - nx * hwTail, y3 = this.py - ny * hwTail;
    const x4 = this.px + nx * hwTail, y4 = this.py + ny * hwTail;


    
    push();
    blendMode((theme.blend || 'ADD') === 'BLEND' ? BLEND : ADD);
    noStroke();
    colorMode(HSB, 360, 100, 100, 1);

    const sat = theme.sat ?? 90;
    const bri = theme.bri ?? 100;
    const pal = (theme.palette || 'rainbow').toLowerCase();
    let drawHue = this.hue;
    let drawSat = sat;

    if (pal === 'white') drawSat = 0;          // grayscale
    // 'blue' and 'mono' already constrained in update()

    fill(drawHue, drawSat, bri, this.alpha);
    quad(x1, y1, x2, y2, x3, y3, x4, y4);
    pop();
  }
}
