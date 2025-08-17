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
