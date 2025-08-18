// ---------- Sprite ----------
class Sprite {
  constructor(img) {
    this.img = img;
    this.history = [];
    this.reset(true);
    this.active = true;
  }
  reset() {
    const cx = windowWidth / 2;
    const cy = windowHeight / 2;
    const ang = random(TWO_PI);

    // Tunnel direction from center
    this.dirX = cos(ang);
    this.dirY = sin(ang);

    // Distance from center to the canvas edge along this direction
    const dx = this.dirX, dy = this.dirY;
    let tx = Infinity, ty = Infinity;
    if (dx > 0)      tx = (width  - cx) / dx;
    else if (dx < 0) tx = (0      - cx) / dx;
    if (dy > 0)      ty = (height - cy) / dy;
    else if (dy < 0) ty = (0      - cy) / dy;
    this.edgeDist = min(tx, ty); // pixels to hit the boundary

    // Progress 0..1 from center to (just past) the edge
    this.prog   = 0;
    this.speed  = random(0.003, 0.008);                 // slower progression
    this.distMax = this.edgeDist * random(1.12, 1.55);  // go slightly past the edge

    this.baseScale = BASE_SCALE * (0.8 + random(0.6));

    this.rot = random(TWO_PI);
    this.rotDir = random([-1, 1]);
    this.tintHue = random(360);

    this.alpha = APPEAR_MIN_ALPHA;
    this._visibleSince = 0;
    this.history.length = 0;

    // start at center
    this.x = cx; 
    this.y = cy;
  }
  setImage(img) { this.img = img; }

  update(audioReact, kick, chroma = 0) {
    // Speed scales a bit with audio/kick
    const speedMul = 1 + audioReact * 0.6 + kick * 1.6;
    this.prog += this.speed * speedMul;

    // Reset when off the end
    if (this.prog >= 1.05) { this.reset(); return; }

    // Smooth outward motion (accelerating)
    const t = constrain(this.prog, 0, 1);
    const easeIn = t * t; // t**3 for stronger
    const cx = windowWidth / 2, cy = windowHeight / 2;
    const travel = easeIn * this.distMax;
    this.x = cx + this.dirX * travel;
    this.y = cy + this.dirY * travel;

    // Scale: starts at 0, grows with t, and boosts near edges
    const scaleFromProg = pow(t, 1.2);
    const edgeProx  = constrain(travel / (this.edgeDist * 0.99), 0, 1);
    const edgeBoost = 1 + Math.pow(edgeProx, LIVE.EDGE_BOOST_POW ?? 1.4) * (LIVE.EDGE_BOOST_MULT ?? 1.0);

    const s = this.baseScale * scaleFromProg * edgeBoost
      * (1.0 + audioReact * MAX_SCALE_BOOST + kick * 0.35)
      * (LIVE.SPRITE_SCALE ?? 1.0);

    const drawW = this.img.width * s;
    const drawH = this.img.height * s;

    // Rotation & color drift
    const rotSpeed = MAX_ROT_SPEED * (0.2 + audioReact * 0.9 + kick * 0.6);
    this.rot += this.rotDir * rotSpeed;

    this.tintHue += 0.2 + audioReact * 1.0;
    if (this.tintHue >= 360) this.tintHue -= 360;

    // Appear logic
    const wantVisible = (t > 0.02) || (kick > APPEAR_KICK_THRESHOLD) || (audioReact > APPEAR_LEVEL_THRESHOLD);
    if (wantVisible) { this.alpha = lerp(this.alpha, 1.0, APPEAR_FADE_IN); this._visibleSince = millis(); }
    else { this.alpha = lerp(this.alpha, APPEAR_MIN_ALPHA, APPEAR_FADE_OUT); }
    const globalAlpha = constrain(this.alpha, 0, 1);

    // Trail
    this.history.push({x:this.x, y:this.y, r:this.rot, w:drawW, h:drawH, hue:this.tintHue, a:globalAlpha});
    if (this.history.length > 6) this.history.shift();

    // Draw trail
    push(); imageMode(CENTER); noStroke(); blendMode(ADD);
    let fade = 0.65;
    for (let i=0; i<this.history.length-1; i++) {
      const h = this.history[i];
      push(); translate(h.x, h.y); rotate(h.r);
      colorMode(HSB, 360, 100, 100, 1);
      tint(h.hue, 12, 100, 0.18 * fade * h.a);
      image(this.img, 0, 0, h.w*0.9, h.h*0.9);
      pop();
      fade *= 0.78;
    }
    pop();

    // Main draw + chroma split
    push();
    translate(this.x, this.y);
    rotate(this.rot);
    imageMode(CENTER);

    if (chroma > 0.01) {
      const split = chroma * CHROMA_MAX_OFFSET * drawW;
      const layerA = constrain(0.65 + audioReact * 0.18 + kick * 0.18, 0.35, 1.0) * 255 * globalAlpha;

      push(); blendMode(ADD);
      tint(255, 0, 0, layerA * 0.9); image(this.img, -split, -split * 0.45, drawW, drawH);
      tint(0, 255, 0, layerA);       image(this.img, 0, 0, drawW, drawH);
      tint(0, 0, 255, layerA * 0.9); image(this.img,  split,  split * 0.45, drawW, drawH);
      pop();

      push(); blendMode(BLEND); colorMode(HSB, 360, 100, 100, 1);
      const tintA = constrain(0.45 + audioReact * 0.18 + kick * 0.12, 0.2, 0.9) * globalAlpha;
      tint(this.tintHue, 12, 100, tintA);
      image(this.img, 0, 0, drawW, drawH);
      pop();
    } else {
      colorMode(HSB, 360, 100, 100, 1);
      const tintA = constrain(0.8 + audioReact * 0.2 + kick * 0.2, 0.5, 1.0) * globalAlpha;
      tint(this.tintHue, 12, 100, tintA);
      image(this.img, 0, 0, drawW, drawH);
    }
    pop();
  }
}
