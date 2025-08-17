// === Audio / Visual Kick-Reactive Screensaver with Scenes & Behind-Overlay Club Strobe ===
// Requires: p5.min.js + p5.sound.min.js and a local server.
// DOM: #canvas-container, #startBtn, #sens (range)

// ---------- Overlay PNG (schwarz mit transparenten Bereichen) ----------
const OVERLAY_PNG   = 'assets/bg.png'; // <-- DEIN PNG
const OVERLAY_SCALE = 0.70; // < 1.0 => kleiner; 0.70 = 70% der "fit"-Größe

// ---------- Scene Duration Scale (for testing) ----------
const SCENE_TIME_SCALE = 0.35; // 1.0 = real time; lower for faster testing

// ---------- Base Config ----------
const SPRITE_COUNT = 6;
const BASE_SCALE = 0.15;
const MAX_SCALE_BOOST = 0.05;
const MAX_ROT_SPEED = 0.025;
const SPEED_BASE = 0.5;
const FLASH_MAX_ALPHA = 0.2;
const EDGE_FLASH_DECAY = 0.1;
const KICK_DECAY = 0.88;
const REACT_SMOOTH = 0.14;

const STROBE_MIN_INTERVAL = 800; // Vordergrund-Strobe (warmweiß)
const STROBE_COLOR = [255, 220, 200];

const CHROMA_MAX_OFFSET = 0.12;
const CHROMA_DECAY = 0.88;
const CHROMA_LAG = 0.12;

const APPEAR_MIN_ALPHA = 0.06;
const APPEAR_FADE_IN = 0.22;
const APPEAR_FADE_OUT = 0.06;
const APPEAR_KICK_THRESHOLD = 0.04;
const APPEAR_LEVEL_THRESHOLD = 0.03;

// ---------- Behind-Overlay Club Strobe (weiß, extrem kurz) ----------
const BG_STROBE_DECAY     = 0.1;
const BG_STROBE_MAX_ALPHA = 100;
const BG_STROBE_HZ_MIN    = 6;
const BG_STROBE_HZ_MAX    = 12;
let   nextBgStrobeAt      = 100;

const STROBE_LEVEL_THRESHOLD = 0.2;
const STROBE_BASS_THRESHOLD  = 0.05;

// --- Tunnel streaks (baseline defaults) ---
const STREAK_COUNT = 20;
const STREAK_SPEED_MIN = 0.004;
const STREAK_SPEED_MAX = 0.010;
const STREAK_LEN_PX_MIN = 40;
const STREAK_LEN_PX_MAX = 160;
const STREAK_BASE_WIDTH = 2.0;
const STREAK_EDGE_WIDTH_MULT = 5.0; // how wide they get near the edge

let SHOW_DEBUG_HUD = true;  // bottom text line (bpm, react, etc.)
let SHOW_TOP_UI     = false; // top HTML controls (start button, slider)

// --- Wire Grid / Scanner (new element) ---
const WIRE_STYLES = {
  WHITE_DIM:   { mode:'mono', hue:0,   sat:0,   alpha:0.16, flicker:false },
  BLUE_ONLY:   { mode:'mono', hue:205, sat:100, alpha:0.22, flicker:false },
  NEON_RAINBOW:{ mode:'rainbow',       sat:100, alpha:0.18, flicker:false },
  STROBE:      { mode:'mono', hue:0,   sat:0,   alpha:0.28, flicker:true  },
};

let HUD_FORCE_SHOW = false; // press H to force HUD even in fullscreen (debug)
function isFS() {
  try { return typeof fullscreen === 'function' ? fullscreen() : !!(document.fullscreenElement || document.webkitFullscreenElement); }
  catch { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
}

function toggleFullscreen() {
  const fs = isFS();
  if (typeof fullscreen === 'function') fullscreen(!fs);
  // onFullscreenChange() will handle UI visibility
}

function setTopUIVisible(v) {
  const bar = document.getElementById('ui');            // your top bar container
  if (bar) bar.style.display = v ? '' : 'none';

  // (optional) also hide individual controls if you ever detach them from #ui:
  ['startBtn','videoFile','imageFile','fullscreenBtn','sens'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = v ? '' : 'none';
  });
}

function onFullscreenChange() {
  // Hide top UI in fullscreen unless you purposely opted-in with SHOW_TOP_UI
  const wantVisible = (!isFS() || SHOW_TOP_UI);
  setTopUIVisible(wantVisible);
}
['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
  .forEach(evt => document.addEventListener(evt, onFullscreenChange));

// ---------- Live-Params (szeneabhängig) ----------
let LIVE = {
  STROBE_PROBABILITY: 0.08,
  CHROMA_SENS: 4.0,
  FEEDBACK_STRENGTH: 0.06,
  KALEI_SEGMENTS: 0,
  GLITCH_CHANCE: 0.06,
  SPRITE_SCALE: 0.75, // globaler Default

  // Per-scene feel knobs
  REACTIVITY_MUL: 0.85,
  CAM_SHAKE_MUL: 1.0,
  CAM_ZOOM_MUL: 1.0,

  EDGE_BOOST_MULT: 1.0,
  EDGE_BOOST_POW: 1.4,

  STREAK_ENABLED: true,
  STREAK_COUNT: STREAK_COUNT,
  STREAK_SPEED_MIN: STREAK_SPEED_MIN,
  STREAK_SPEED_MAX: STREAK_SPEED_MAX,
  STREAK_BASE_WIDTH: STREAK_BASE_WIDTH,
  STREAK_EDGE_WIDTH_MULT: STREAK_EDGE_WIDTH_MULT,

  WIRE_ENABLED: true,
  WIRE_STYLE: 'WHITE_DIM',     // WHITE_DIM | BLUE_ONLY | NEON_RAINBOW | STROBE
  WIRE_SPOKES: 16,
  WIRE_CIRCLES: 18,
  WIRE_ROT_SPEED: 0.25,        // radians/sec, + cw, - ccw
  WIRE_SCROLL_SPEED: 0.30,     // rings/sec, + outward, - inward
  WIRE_DASHED: false,          // dashed rings for texture
  WIRE_THICKNESS: 1.5,

  // New: streak theme (color, flicker, direction)
  STREAK_THEME: {
    palette: 'rainbow',         // 'white' | 'blue' | 'mono' | 'rainbow'
    hueBase: 0,                 // used for 'mono'
    hueRange: 0,                // +/- jitter
    hueDrift: 0.6,              // per-frame hue drift
    sat: 90,                    // 0..100
    bri: 100,                   // 0..100
    alphaBase: 0.22,            // base alpha
    alphaEdgeBoost: 0.35,       // extra alpha near edge
    blend: 'ADD',               // 'ADD' | 'BLEND'
    flicker: {                  // optional flicker
      enabled: false,
      prob: 0.0,                // chance per frame to flicker (if not linked)
      minMul: 0.15,
      maxMul: 1.0,
      linkStrobe: false         // tie brightness to strobePulse
    },
    direction: 'out',           // 'out' | 'in' | 'both'
    reverseProb: 0.4            // used if direction === 'both'
  }
};

// ---------- Long-form Scenes (now with themed streaks) ----------
const SCENES = [
  {
    name: 'Neon Tunnel Marathon',
    durationSeconds: 180,
    images: ['assets/paul.png', 'assets/paola.png', 'assets/justi.png'],
    params: {
      REACTIVITY_MUL: 0.75,
      SPRITE_SCALE: 0.72,
      EDGE_BOOST_MULT: 1.8,
      EDGE_BOOST_POW:  1.1,

      STREAK_ENABLED: true,
      STREAK_COUNT: 96,
      STREAK_SPEED_MIN: 0.006,
      STREAK_SPEED_MAX: 0.012,
      STREAK_BASE_WIDTH: 2.0,
      STREAK_EDGE_WIDTH_MULT: 7.0,

      WIRE_ENABLED: true,
      WIRE_STYLE: 'WHITE_DIM',
      WIRE_SPOKES: 18,
      WIRE_CIRCLES: 22,
      WIRE_ROT_SPEED: 0.10,
      WIRE_SCROLL_SPEED: 0.10,  // outward
      WIRE_DASHED: false,
      WIRE_THICKNESS: 1.3,

      STREAK_THEME: {
        palette: 'rainbow',
        hueDrift: 1.2,
        sat: 95,
        bri: 100,
        alphaBase: 0.20,
        alphaEdgeBoost: 0.40,
        blend: 'ADD',
        flicker: { enabled: false, prob: 0.0, minMul: 0.2, maxMul: 1.0, linkStrobe: false },
        direction: 'both',
        reverseProb: 0.25
      },

      STROBE_PROBABILITY: 0.05,
      CHROMA_SENS: 2.4,
      FEEDBACK_STRENGTH: 0.02,
      KALEI_SEGMENTS: 0,
      GLITCH_CHANCE: 0.03,
      CAM_SHAKE_MUL: 0.8,
      CAM_ZOOM_MUL: 0.9,
    },
    automate: {
      STROBE_PROBABILITY: [0.03, 0.12],
      CHROMA_SENS:        [1.8, 3.2],
      FEEDBACK_STRENGTH:  [0.00, 0.06],
    },
    lengthBeats: 16,
    fallbackSeconds: 20
  },
  {
    name: 'Kalei Cathedral (Blue Drift)',
    durationSeconds: 240,
    images: ['assets/paola.png', 'assets/justi.png', 'assets/paul.png'],
    params: {
      REACTIVITY_MUL: 0.80,
      SPRITE_SCALE: 0.65,
      EDGE_BOOST_MULT: 0.8,
      EDGE_BOOST_POW:  1.6,

      STREAK_ENABLED: true,
      STREAK_COUNT: 36,
      STREAK_SPEED_MIN: 0.004,
      STREAK_SPEED_MAX: 0.008,
      STREAK_EDGE_WIDTH_MULT: 3.0,

        WIRE_ENABLED: true,
      WIRE_STYLE: 'BLUE_ONLY',
      WIRE_SPOKES: 14,
      WIRE_CIRCLES: 20,
      WIRE_ROT_SPEED: -0.22,    // reverse rotation
      WIRE_SCROLL_SPEED: -0.18, // inward
      WIRE_DASHED: true,
      WIRE_THICKNESS: 1.6,

      STREAK_THEME: {
        palette: 'blue',    // only shades of blue
        hueBase: 205,
        hueRange: 20,
        hueDrift: 0.25,
        sat: 80,
        bri: 100,
        alphaBase: 0.14,        // dim
        alphaEdgeBoost: 0.25,
        blend: 'ADD',
        flicker: { enabled: true, prob: 0.02, minMul: 0.35, maxMul: 1.0, linkStrobe: false },
        direction: 'out'
      },

      KALEI_SEGMENTS: 10,
      FEEDBACK_STRENGTH: 0.10,
      CHROMA_SENS: 1.4,
      STROBE_PROBABILITY: 0.02,
      GLITCH_CHANCE: 0.02,
      CAM_SHAKE_MUL: 0.5,
      CAM_ZOOM_MUL: 0.7,
    },
    automate: {
      FEEDBACK_STRENGTH: [0.06, 0.14],
      CHROMA_SENS:       [1.0,  2.2],
    },
    lengthBeats: 16,
    fallbackSeconds: 20
  },
  {
    name: 'Glitch Storm (Strobe Lines)',
    durationSeconds: 150,
    images: ['assets/justi.png', 'assets/paul.png'],
    params: {
      REACTIVITY_MUL: 0.9,
      SPRITE_SCALE: 0.78,
      EDGE_BOOST_MULT: 1.2,
      EDGE_BOOST_POW:  1.2,

      STREAK_ENABLED: true,
      STREAK_COUNT: 64,
      STREAK_SPEED_MIN: 0.007,
      STREAK_SPEED_MAX: 0.013,
      STREAK_EDGE_WIDTH_MULT: 6.0,

        WIRE_ENABLED: true,
  WIRE_STYLE: 'STROBE',
  WIRE_SPOKES: 9,
  WIRE_CIRCLES: 12,
  WIRE_ROT_SPEED: 0.0,      // static, lets the strobe do the work
  WIRE_SCROLL_SPEED: 0.28,
  WIRE_DASHED: false,
  WIRE_THICKNESS: 2.4,

      STREAK_THEME: {
        palette: 'white',  // dim white that flares with strobe
        hueDrift: 0.0,
        sat: 0,
        bri: 100,
        alphaBase: 0.10,
        alphaEdgeBoost: 0.50,
        blend: 'ADD',
        flicker: { enabled: true, prob: 0.0, minMul: 0.2, maxMul: 1.0, linkStrobe: true }, // <- strobe-linked flicker
        direction: 'out'
      },

      STROBE_PROBABILITY: 0.20,
      CHROMA_SENS: 3.6,
      FEEDBACK_STRENGTH: 0.00,
      KALEI_SEGMENTS: 0,
      GLITCH_CHANCE: 0.18,
      CAM_SHAKE_MUL: 1.4,
      CAM_ZOOM_MUL: 1.2,
    },
    automate: {
      GLITCH_CHANCE:       [0.06, 0.25],
      STROBE_PROBABILITY:  [0.08, 0.45],
      CHROMA_SENS:         [2.8, 4.2],
    },
    lengthBeats: 8,
    fallbackSeconds: 16
  },
  {
    name: 'Warm Drift (Inward Flow)',
    durationSeconds: 210,
    images: ['assets/paul.png', 'assets/paola.png'],
    params: {
      REACTIVITY_MUL: 0.70,
      SPRITE_SCALE: 0.62,
      EDGE_BOOST_MULT: 0.9,
      EDGE_BOOST_POW:  1.8,

      STREAK_ENABLED: true,
      STREAK_COUNT: 28,
      STREAK_SPEED_MIN: 0.004,
      STREAK_SPEED_MAX: 0.009,
      STREAK_EDGE_WIDTH_MULT: 4.0,
        WIRE_ENABLED: true,
  WIRE_STYLE: 'NEON_RAINBOW',
  WIRE_SPOKES: 22,
  WIRE_CIRCLES: 24,
  WIRE_ROT_SPEED: 0.35,
  WIRE_SCROLL_SPEED: 0.32,
  WIRE_DASHED: false,
  WIRE_THICKNESS: 1.4,

      STREAK_THEME: {
        palette: 'mono',   // warm amber mono
        hueBase: 34,
        hueRange: 8,
        hueDrift: 0.2,
        sat: 85,
        bri: 100,
        alphaBase: 0.16,
        alphaEdgeBoost: 0.30,
        blend: 'ADD',
        flicker: { enabled: true, prob: 0.04, minMul: 0.4, maxMul: 1.0, linkStrobe: false },
        direction: 'in'    // <- fly inward from edges to center
      },

      STROBE_PROBABILITY: 0.03,
      CHROMA_SENS: 1.8,
      FEEDBACK_STRENGTH: 0.08,
      KALEI_SEGMENTS: 6,
      GLITCH_CHANCE: 0.01,
      CAM_SHAKE_MUL: 0.4,
      CAM_ZOOM_MUL: 0.8,
    },
    automate: {
      SPRITE_SCALE:       [0.56, 0.80],
      FEEDBACK_STRENGTH:  [0.04, 0.12],
      CHROMA_SENS:        [1.4, 2.6],
    },
    lengthBeats: 24,
    fallbackSeconds: 20
  }
];

// ---------- State ----------
let sceneIdx = 0;
let beatsInScene = 0;
let bpmGuess = 130;
let lastBeatMs = 0;
let lastActivityMs = 0;
let sceneToastAlpha = 0;
let sceneStartMs = 0;

let lastStrobeAt = 0;
let strobePulse = 0;

let chromaPulse = 0;
let chromaSmooth = 0;

let started = false;
let mic = null;
let fft, amp;

let sprites = [];
let imagesByPath = new Map();
let prevReact = 0;
let kickPulse = 0;
let flashPulse = 0;

let edgeFlash = 0;

let bassEMA = 0;
let bassEMADecay = 0.85;
let bassThresh = 0.01;

let camShake = 0;
let camZoom = 0;

let particles = [];
let glitchFrames = 0;
let kaleiMix = 0;

let bgBurstActive = false;
let bgBurstRemaining = 0;
let bgBurstHz = 10;
let bgBurstCooldownUntil = 0;

let wireRotPhase = 0;
let wireScrollPhase = 0;

let streaks = [];

// Overlay PNG
let overlayImg = null;

// Behind-Overlay Strobe State
let bgFlashPulse = 0;

// ---------- Preload ----------
function preload() {
  const allPaths = new Set();
  for (const sc of SCENES) sc.images.forEach(p => allPaths.add(p));
  allPaths.forEach(path => {
    const img = loadImage(path, () => {}, (e) => console.warn('Image failed:', path, e));
    imagesByPath.set(path, img);
  });
  try {
    overlayImg = loadImage(OVERLAY_PNG, () => {}, (e) => console.warn('Overlay PNG failed:', OVERLAY_PNG, e));
  } catch (e) {
    console.warn('Overlay PNG load error:', e);
  }
}

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

// ---------- Setup ----------
function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container');
  noStroke();
  imageMode(CORNER);
  bindGlobalKeys();
  onFullscreenChange();

  const initialImgs = getSceneImages(sceneIdx);
  for (let i = 0; i < SPRITE_COUNT; i++) {
    const img = initialImgs[i % max(1, initialImgs.length)] || createGraphics(32,32);
    sprites.push(new Sprite(img));
  }

  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.addEventListener('click', startAudio);

  applySceneParams(sceneIdx);
  rebuildStreaks();

  showSceneToast();
  lastActivityMs = millis();
  sceneStartMs = millis();
}

async function startAudio() {
  if (started) return;
  try { await userStartAudio(); } catch(e){ console.warn('userStartAudio failed:', e); }

  if (typeof mediaSource !== 'undefined' && mediaSource && mediaSource.elt) {
    try {
      fft = new p5.FFT(0.9, 1024);
      amp = new p5.Amplitude(0.9);
      fft.setInput(mediaSource);
      amp.setInput(mediaSource);
      started = true;
      const startBtn = document.getElementById('startBtn');
      if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'Video input'; }
      return;
    } catch (e) { console.warn('Setting video as audio input failed:', e); }
  }

  mic = new p5.AudioIn();
  try {
    await new Promise((resolve, reject) => mic.start(resolve, reject));
    fft = new p5.FFT(0.9, 1024);
    amp = new p5.Amplitude(0.9);
    fft.setInput(mic);
    amp.setInput(mic);
    started = true;
    const startBtn = document.getElementById('startBtn');
    if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'Audio running'; }
  } catch (err) {
    console.error('Mic start error', err);
    alert('Fehler beim Mikro-Start. Berechtigungen prüfen.');
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for (const s of sprites) s.reset(); // recompute paths
  rebuildStreaks();
}

// ---------- Draw ----------
function draw() {
  background(0, 32);

  const now = millis();
  updateSceneAutomation(now);

  let react = prevReact;
  if (isFS()) noCursor(); else cursor(ARROW);

  // Overlay PNG (kleiner, zentriert)
  drawOverlayPNG();

  // --- Audio Levels ---
  const sensEl = document.getElementById('sens');
  const sens = sensEl ? parseFloat(sensEl.value || '1') : 1;

  let level = 0, bass = 0, treble = 0;
  if (started) {
    level = amp.getLevel();
    bass = normBass(fft.getEnergy(20, 150));
    treble = constrain(fft.getEnergy(4000, 12000) / 255, 0, 1);
  }

  bassEMA = lerp(bass, bassEMA, bassEMADecay);
  const bassDelta = max(0, bass - (bassEMA + bassThresh));

  // === BEHIND-OVERLAY CLUB STROBE (react-bursts, behind overlay) ===
  {
    const intensity = constrain(react, 0, 1);
    const quiet     = intensity < 0.06;

    if (!bgBurstActive && now >= bgBurstCooldownUntil && !quiet) {
      const startProb = 0.015 + intensity * (0.22 + LIVE.STROBE_PROBABILITY * 0.8);
      if (random() < startProb) {
        bgBurstActive     = true;
        bgBurstRemaining  = (random() < 0.40 ? 1 : floor(random(3, 7)));
        bgBurstHz         = lerp(BG_STROBE_HZ_MIN, BG_STROBE_HZ_MAX, intensity);
        nextBgStrobeAt    = now;
      }
    }

    if (bgBurstActive && now >= nextBgStrobeAt) {
      bgFlashPulse     = 1.0;
      bgBurstRemaining--;
      nextBgStrobeAt   = now + (1000 / bgBurstHz) * random(0.85, 1.15);
      if (bgBurstRemaining <= 0) {
        bgBurstActive        = false;
        bgBurstCooldownUntil = now + 250 + (1 - intensity) * random(400, 1400);
      }
    }

    if (bgFlashPulse > 0.01) {
      push(); blendMode(ADD);
      fill(255, BG_STROBE_MAX_ALPHA * bgFlashPulse);
      rect(0, 0, width, height);
      pop();
      bgFlashPulse *= BG_STROBE_DECAY;
    }
  }

  const kickHit = bassDelta > 0.02;

  if (kickHit) {
    if (lastBeatMs > 0) {
      const dt = now - lastBeatMs;
      const instBpm = 60000 / max(dt, 1);
      if (instBpm > 60 && instBpm < 200) bpmGuess = lerp(bpmGuess, instBpm, 0.15);
    }
    lastBeatMs = now;
    beatsInScene++;
    lastActivityMs = now;
  }
  if (level > 0.01) lastActivityMs = millis();

  // Triggers
  if (kickHit) {
    kickPulse = max(kickPulse, constrain(bassDelta * 4.0, 0, 1));
    flashPulse = max(flashPulse, constrain(bassDelta * 3.0, 0, 1));

    spawnParticles(bassDelta);

    camShake = min(camShake + 12 * kickPulse * (LIVE.CAM_SHAKE_MUL ?? 1.0), 18);
    camZoom  = min(camZoom  + 0.015 * (0.6 + kickPulse) * (LIVE.CAM_ZOOM_MUL ?? 1.0), 0.08);

    if (LIVE.KALEI_SEGMENTS > 0 && random() < 0.08) kaleiMix = 1;
  }

  kickPulse *= KICK_DECAY;
  flashPulse *= 0.90;

  const trebDriven = Math.pow(treble, 1.8) * LIVE.CHROMA_SENS;
  chromaPulse = max(chromaPulse, trebDriven);
  if (kickHit) chromaPulse *= 0.25;
  chromaPulse *= CHROMA_DECAY;
  chromaSmooth = constrain(lerp(chromaSmooth, chromaPulse, CHROMA_LAG), 0, 1);

  // === FRONT STROBE (react-gated) ===
  if (now - lastStrobeAt > STROBE_MIN_INTERVAL) {
    const intensity = constrain(react, 0, 1);
    const strong     = (intensity > 0.18) || (kickPulse > 0.12);
    if (strong) {
      const prob = 0.02 + intensity * (0.35 + LIVE.STROBE_PROBABILITY * 0.9);
      if (random() < prob) {
        strobePulse  = max(strobePulse, 1.0);
        lastStrobeAt = now;
      }
    }
  }

  strobePulse *= 0.82;

  react = Math.pow(min(level * 6, 1), 0.7) * 0.8 + Math.pow(bass, 1.4) * 1.3;
  react = (react + kickPulse * 0.6) * sens * (LIVE.REACTIVITY_MUL ?? 1.0);
  react = lerp(prevReact, react, REACT_SMOOTH);
  prevReact = react;

  // --- Szenenwechsel: time-based or beat-based or fallback by inactivity ---
  const sc = SCENES[sceneIdx];
  const lenBeats   = sc.lengthBeats || 16;
  const fallbackMs = (sc.fallbackSeconds ?? 12) * 1000;
  const durMs      = getSceneDurationMs(sc);
  const timeIsUp   = durMs > 0 && (now - sceneStartMs >= durMs);

  if (timeIsUp || beatsInScene >= lenBeats || millis() - lastActivityMs > fallbackMs) nextScene();

  // Camera decay
  camShake *= 0.86; camZoom *= 0.90;

  // --- Camera transform START ---
  push();
  translate(random(-camShake, camShake), random(-camShake, camShake));
  scale(1 + camZoom);

  // NEW: wire grid (background)
  drawWireGrid(react, kickPulse, strobePulse);

  // Streaks (themed)
  if (LIVE.STREAK_ENABLED) {
    for (const st of streaks) { st.update(react, kickPulse); st.draw(); }
  }

  // Sprites
  for (const s of sprites) s.update(react, kickPulse, chromaSmooth);

  // Edge flash
  if (edgeFlash > 0.001) {
    push(); blendMode(ADD); fill(255, 255 * edgeFlash * 0.05); rect(0, 0, width, height); pop();
    edgeFlash *= EDGE_FLASH_DECAY;
  }

  // Level flash
  if (flashPulse > 0.01) {
    push(); blendMode(ADD); fill(255, 255 * (FLASH_MAX_ALPHA * flashPulse)); rect(0, 0, width, height); pop();
  }

  // Vordergrund-Strobe
  if (strobePulse > 0.01) {
    push(); blendMode(ADD);
    const alpha = constrain(strobePulse, 0, 1) * 200;
    fill(STROBE_COLOR[0], STROBE_COLOR[1], STROBE_COLOR[2], alpha);
    rect(0, 0, width, height);
    pop();
  }

  updateParticles();
  drawParticles();

  pop();
  // --- Camera transform END ---

  // Feedback Echo (szeneabhängig)
  if (LIVE.FEEDBACK_STRENGTH > 0.001) {
    push(); blendMode(ADD);
    const t = 255 * (LIVE.FEEDBACK_STRENGTH * (0.6 + react));
    tint(255, t);
    translate(width/2, height/2);
    rotate(0.003 + react * 0.01);
    scale(0.985 - react * 0.01);
    image(get(), -width/2, -height/2);
    pop();
  }

  if (treble > 0.6 && random() < LIVE.GLITCH_CHANCE) glitchFrames = 2;
  if (glitchFrames > 0) {
    push(); blendMode(BLEND);
    const slices = 8;
    for (let i=0; i<slices; i++) {
      const y = (height / slices) * i;
      const h = height / slices;
      const xOffset = random(-20, 20) * (1 + kickPulse*2);
      copy(0, y, width, h, xOffset, y, width, h);
    }
    pop();
    glitchFrames--;
  }

  kaleiMix *= 0.94;
  if (LIVE.KALEI_SEGMENTS > 0 && kaleiMix > 0.02) {
    const src = get();
    push();
    translate(width/2, height/2);
    imageMode(CENTER);
    blendMode(ADD);
    tint(255, 140 * kaleiMix);
    for (let i=0; i<LIVE.KALEI_SEGMENTS; i++) {
      push();
      rotate((TWO_PI / LIVE.KALEI_SEGMENTS) * i);
      if (i % 2 === 0) scale(-1, 1);
      image(src, 0, 0, width, height);
      pop();
    }
    pop();
  }

if (SHOW_DEBUG_HUD && (!isFS() || HUD_FORCE_SHOW)) {
  drawHUD(level, bass, react, kickPulse);
}
  drawSceneToast();
}

// ---------- Helpers ----------
function drawHUD(level, bass, react, kick) {
  push(); resetMatrix(); noStroke(); fill(255, 190); textSize(12);
  const sc = SCENES[sceneIdx];
  text(
    `started:${started}  scene:${sc.name}  bpm:${bpmGuess.toFixed(1)}  lvl:${level.toFixed(3)}  bass:${bass.toFixed(3)}  react:${react.toFixed(3)}  kick:${kick.toFixed(3)}`,
    12, height - 14
  );
  pop();
}
function normBass(v) { const x = constrain(v / 255, 0, 1); return pow(x, 1.1); }

// Overlay PNG zentral, "fit"-Skalierung * OVERLAY_SCALE
function drawOverlayPNG() {
  if (!overlayImg) return;
  const cw = width, ch = height;
  const iw = overlayImg.width, ih = overlayImg.height;
  const fitScale = Math.min(cw / iw, ch / ih) * OVERLAY_SCALE; // kleiner als volle Fit-Größe
  const w = iw * fitScale, h = ih * fitScale;
  const x = (cw - w) / 2;
  const y = (ch - h) / 2;

  push();
  imageMode(CORNER);
  tint(255, 255); // Schwarz deckend, Transparent frei
  image(overlayImg, x, y, w, h);
  pop();
}

function spawnParticles(bassDelta) {
  const n = 12 + floor(constrain(bassDelta * 40, 0, 60));
  for (let i=0; i<n; i++) {
    const s = random(sprites);
    particles.push({
      x: s?.x ?? width/2,
      y: s?.y ?? height/2,
      vx: random(-3,3), vy: random(-4,2),
      size: random(2,8),
      life: 180 + random(60)
    });
  }
}
function updateParticles() {
  for (const p of particles) {
    p.vx *= 0.98; p.vy *= 0.98; p.life -= 2;
    p.x += p.vx;  p.y += p.vy;
  }
  particles = particles.filter(p => p.life > 0);
}
function drawParticles() {
  push(); blendMode(ADD); noStroke();
  for (const p of particles) { fill(255, 215, 190, p.life); circle(p.x, p.y, 2 + p.size * (p.life/255)); }
  pop();
}

function getSceneImages(idx) {
  const sc = SCENES[idx % SCENES.length];
  const out = [];
  for (const p of sc.images) {
    const img = imagesByPath.get(p);
    if (img) out.push(img);
  }
  // Fallback-Varianten bei nur 1 Bild
  if (out.length === 1) {
    const base = out[0];
    const g1 = createGraphics(base.width, base.height); g1.push(); g1.translate(base.width,0); g1.scale(-1,1); g1.image(base,0,0); g1.pop();
    const g2 = createGraphics(base.width, base.height); g2.tint(255, 200); g2.image(base,0,0);
    out.push(g1, g2);
  }
  return out.length ? out : [createGraphics(32,32)];
}

// Apply scene params (including theme) and rebuild streaks if needed
function applySceneParams(idx) {
  const { params } = SCENES[idx % SCENES.length];

  // Explicit common keys
  LIVE.STROBE_PROBABILITY = params.STROBE_PROBABILITY ?? LIVE.STROBE_PROBABILITY;
  LIVE.CHROMA_SENS        = params.CHROMA_SENS        ?? LIVE.CHROMA_SENS;
  LIVE.FEEDBACK_STRENGTH  = params.FEEDBACK_STRENGTH  ?? LIVE.FEEDBACK_STRENGTH;
  LIVE.KALEI_SEGMENTS     = params.KALEI_SEGMENTS     ?? LIVE.KALEI_SEGMENTS;
  LIVE.GLITCH_CHANCE      = params.GLITCH_CHANCE      ?? LIVE.GLITCH_CHANCE;
  LIVE.SPRITE_SCALE       = params.SPRITE_SCALE       ?? LIVE.SPRITE_SCALE;

  LIVE.WIRE_ENABLED      = (params.WIRE_ENABLED      ?? LIVE.WIRE_ENABLED);
  LIVE.WIRE_STYLE        = (params.WIRE_STYLE        ?? LIVE.WIRE_STYLE);
  LIVE.WIRE_SPOKES       = (params.WIRE_SPOKES       ?? LIVE.WIRE_SPOKES);
  LIVE.WIRE_CIRCLES      = (params.WIRE_CIRCLES      ?? LIVE.WIRE_CIRCLES);
  LIVE.WIRE_ROT_SPEED    = (params.WIRE_ROT_SPEED    ?? LIVE.WIRE_ROT_SPEED);
  LIVE.WIRE_SCROLL_SPEED = (params.WIRE_SCROLL_SPEED ?? LIVE.WIRE_SCROLL_SPEED);
  LIVE.WIRE_DASHED       = (params.WIRE_DASHED       ?? LIVE.WIRE_DASHED);
  LIVE.WIRE_THICKNESS    = (params.WIRE_THICKNESS    ?? LIVE.WIRE_THICKNESS);

  // Copy any additional per-scene LIVE keys
  for (const [k, v] of Object.entries(params)) {
    if (k === 'STREAK_THEME') continue;
    if (k in LIVE) LIVE[k] = v;
  }

  // Deep-assign theme (shallow is fine for our flat object)
  LIVE.STREAK_THEME = params.STREAK_THEME ? JSON.parse(JSON.stringify(params.STREAK_THEME)) : LIVE.STREAK_THEME;

  rebuildStreaks();
}

function nextScene(toIndex = null) {
  sceneIdx = toIndex !== null ? (toIndex % SCENES.length + SCENES.length) % SCENES.length
                              : (sceneIdx + 1) % SCENES.length;
  beatsInScene = 0;
  applySceneParams(sceneIdx);
  sceneStartMs = millis();

  const imgs = getSceneImages(sceneIdx);
  for (let i=0; i<sprites.length; i++) {
    sprites[i].setImage(imgs[i % imgs.length]);
    sprites[i].alpha = max(sprites[i].alpha, 0.6);
  }
  strobePulse = 1;
  kaleiMix = LIVE.KALEI_SEGMENTS > 0 ? 1 : 0.5;
  showSceneToast();
  lastActivityMs = millis();
}

// ---------- Scene Overlay ----------
function showSceneToast() { sceneToastAlpha = 1; }
function drawSceneToast() {
  if (sceneToastAlpha <= 0.01) return;
  sceneToastAlpha *= 0.95;
  const sc = SCENES[sceneIdx];
  push(); resetMatrix(); textAlign(CENTER, CENTER);
  const y = height * 0.18;
  fill(0, 200 * sceneToastAlpha); noStroke();
  rect(width*0.25, y-28, width*0.5, 56, 12);
  fill(255, 255 * sceneToastAlpha);
  textSize(28);
  text(sc.name, width/2, y);
  pop();
}

// ---------- Keyboard Controls ----------
function keyPressed() {
  if (keyCode === RIGHT_ARROW) nextScene(sceneIdx + 1);
  else if (keyCode === LEFT_ARROW) nextScene(sceneIdx - 1);
  else if (key === '1') nextScene(0);
  else if (key === '2') nextScene(1);
  else if (key === '3') nextScene(2);
  else if (key === '4') nextScene(3);
  else if (key === 'h' || key === 'H') HUD_FORCE_SHOW = !HUD_FORCE_SHOW;
}

// ---------- New: Scene timing helpers & automation ----------
function getSceneDurationMs(sc) {
  if (sc.durationSeconds) return sc.durationSeconds * SCENE_TIME_SCALE * 1000;
  return 0;
}

function updateSceneAutomation(now) {
  const sc = SCENES[sceneIdx];
  const dur = getSceneDurationMs(sc);
  if (!dur || !sc.automate) return;

  const t = constrain((now - sceneStartMs) / dur, 0, 1);
  for (const [k, range] of Object.entries(sc.automate)) {
    const [a, b] = range;
    let v = lerp(a, b, t);
    if (k === 'KALEI_SEGMENTS' || k === 'STREAK_COUNT') v = round(v);
    LIVE[k] = v;
  }
}

function rebuildStreaks() {
  streaks = [];
  if (!LIVE.STREAK_ENABLED) return;
  const count = LIVE.STREAK_COUNT ?? STREAK_COUNT;
  for (let i = 0; i < count; i++) streaks.push(new Streak());
}

// ---------- Geometry helper ----------
function edgeDistanceFromCenter(dx, dy) {
  const cx = windowWidth / 2, cy = windowHeight / 2;
  const tx = dx > 0 ? (width  - cx) / dx : (dx < 0 ? (0 - cx) / dx : Infinity);
  const ty = dy > 0 ? (height - cy) / dy : (dy < 0 ? (0 - cy) / dy : Infinity);
  return min(tx, ty);
}
function drawWireGrid(react, kick, strobePulse) {
  if (!LIVE.WIRE_ENABLED) return;

  const style = WIRE_STYLES[LIVE.WIRE_STYLE] || WIRE_STYLES.WHITE_DIM;
  const dt = deltaTime ? (deltaTime/1000) : 0.016;

  // Phase updates — speed up subtly with audio/kick
  wireRotPhase   += LIVE.WIRE_ROT_SPEED    * dt * (0.8 + react * 0.8 + kick * 0.4);
  wireScrollPhase+= LIVE.WIRE_SCROLL_SPEED * dt * (0.7 + react * 0.9 + kick * 0.5);

  const cx = width/2, cy = height/2;
  const maxR = Math.hypot(cx, cy) * 1.05;

  // Alpha/flicker
  let alphaMul = style.alpha;
  if (style.flicker) alphaMul *= Math.min(1, strobePulse * 1.6); // gate by strobe
  alphaMul *= (0.8 + react * 0.6); // breathe with music

  push();
  translate(cx, cy);
  rotate(wireRotPhase);
  noFill();
  strokeCap(ROUND);
  colorMode(HSB, 360, 100, 100, 1);

  // spokes
  const sw = LIVE.WIRE_THICKNESS * (1 + react * 0.8 + kick * 0.6);
  strokeWeight(sw);

  for (let i=0; i<LIVE.WIRE_SPOKES; i++) {
    const a = (i / LIVE.WIRE_SPOKES) * TWO_PI;
    let h = style.mode === 'rainbow' ? ( (a*180/Math.PI + frameCount*0.6) % 360 ) : (style.hue || 0);
    let s = style.mode === 'rainbow' ? style.sat : style.sat;
    stroke(h, s, 100, alphaMul);
    line(0, 0, Math.cos(a) * maxR, Math.sin(a) * maxR);
  }

  // rings (scrolling)
  const rings = LIVE.WIRE_CIRCLES;
  const dashSegs = 56; // for dashed arcs
  for (let j=0; j<rings; j++) {
    // 0..1 position, then scroll
    let u = (j / rings + wireScrollPhase) % 1;
    if (u < 0) u += 1;
    const r = u * maxR;
    if (r < 6) continue;

    // depth cue: thinner near center
    const k = Math.pow(u, 0.85);
    const w = Math.max(1, LIVE.WIRE_THICKNESS * (0.7 + k * 1.2));
    strokeWeight(w);

    if (style.mode === 'rainbow') {
      const hue = ( (u*360 + frameCount*0.6) % 360 );
      stroke(hue, style.sat, 100, alphaMul * (0.7 + 0.3*k));
    } else {
      stroke(style.hue || 0, style.sat, 100, alphaMul * (0.7 + 0.3*k));
    }

    if (LIVE.WIRE_DASHED) {
      const step = TWO_PI / dashSegs;
      for (let a=0; a<TWO_PI; a+=step*2) { // draw every other segment
        arc(0, 0, r*2, r*2, a, a+step);
      }
    } else {
      ellipse(0, 0, r*2, r*2);
    }
  }
  pop();
}

function doubleClicked() { toggleFullscreen(); }

function bindGlobalKeys() {
  window.addEventListener('keydown', (e) => {
    // ignore when typing in inputs
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); }
    else if (e.key === 'h' || e.key === 'H') { HUD_FORCE_SHOW = !HUD_FORCE_SHOW; }
    else if (e.key === 'd' || e.key === 'D') { SHOW_DEBUG_HUD = !SHOW_DEBUG_HUD; }
    else if (e.key === 'u' || e.key === 'U') { 
      SHOW_TOP_UI = !SHOW_TOP_UI; 
      onFullscreenChange(); // apply immediately
    }
  }, { passive:false });
}
