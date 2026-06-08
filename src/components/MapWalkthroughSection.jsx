import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// MAP WALKTHROUGH SECTION
//
// A full scroll-driven section that introduces the geography of the uprising.
// Sits between Hero and the first photo stop. The map fills the viewport,
// the route draws progressively as the user scrolls, landmark labels light up
// in sequence, and a caption pane reveals what happened at each landmark.
//
// Stylised SVG — laid out for legibility, with the relative spatial
// relationships of the real Soweto landmarks preserved.
// ─────────────────────────────────────────────────────────────────────────────

// progress: 0..1 along the section. Each landmark "lights up" when the route
// dot has passed its position on the path.
const LANDMARKS = [
  {
    id: 'morris-isaacson',
    x: 95,  y: 510,
    name: 'Morris Isaacson High',
    sub: 'Mofolo South',
    note: 'The march was organised here on the night of 13 June. Tsietsi Mashinini, eighteen and a Soweto Students\u2019 Representative Council leader, addressed the meeting. The decision was taken: a peaceful march, in school uniform, to Orlando Stadium. By dawn on the 16th, columns were assembling at the gates.',
    routeAt: 0.00,
  },
  {
    id: 'naledi',
    x: 60, y: 440,
    name: 'Naledi High',
    sub: 'Naledi',
    note: 'Naledi students had been the first to refuse Afrikaans as the language of instruction, weeks earlier. On the morning of 16 June, they marched out under their own banner. Within an hour they had joined the procession from Morris Isaacson — perhaps a thousand schoolchildren by then, growing with every street they walked.',
    routeAt: 0.10,
  },
  {
    id: 'phefeni',
    x: 300, y: 380,
    name: 'Phefeni Junior Secondary',
    sub: 'Orlando West',
    note: 'The convergence point. Columns from Naledi, Morris Isaacson, Sekano-Ntoane and the western schools met the columns from Belle, Thesele and the schools of Orlando East. By the time they assembled outside Phefeni, the march was several thousand strong. They were still singing. The police had not yet arrived.',
    routeAt: 0.30,
  },
  {
    id: 'vilakazi',
    x: 360, y: 345,
    name: 'Vilakazi Street',
    sub: 'Orlando West',
    note: 'The police arrived in armoured vehicles. They threw teargas, then opened fire. Hector Pieterson, twelve years old, was among the first hit. Mbuyisa Makhubu picked him up and ran; Antoinette Sithole, his sister, ran beside them. Sam Nzima\u2019s photograph of that moment travelled the world within forty-eight hours.',
    routeAt: 0.45,
  },
  {
    id: 'orlando-stadium',
    x: 525, y: 365,
    name: 'Orlando Stadium',
    sub: 'their destination',
    note: 'The children never reached the stadium. The plan had been to hold a peaceful meeting, sing the anthem, return to school. Instead the formation broke at Vilakazi, the police kept firing, and the township ignited. By nightfall thirty-three buildings were on fire across Soweto. The official death toll lied — the real one is still disputed.',
    routeAt: 0.60,
  },
  {
    id: 'mzimhlope',
    x: 440, y: 175,
    name: 'Mzimhlope Hostel',
    sub: 'days later',
    note: 'The uprising spread for weeks. Mzimhlope, a migrant-worker hostel, saw some of the worst violence. Alf Kumalo, hidden in the rear of a car because The Sunday Times\u2019 drivers refused to enter Soweto, photographed dead lying before an army vehicle. The editor told the BBC he had been "unlucky" — that he had no good pictures.',
    routeAt: 0.78,
  },
  {
    id: 'avalon',
    x: 290, y: 600,
    name: 'Avalon Cemetery',
    sub: 'where they were buried',
    note: 'Hector Pieterson lies here. His headstone names him "Zolile Hector Pieterson, August 19, 1963 — June 16, 1976. Deeply mourned by his parents, sisters, and a nation that remembers." Kumalo photographed mourners at the grave for years afterward, including a woman in a wheelchair, herself injured in the uprising, laying flowers.',
    routeAt: 1.00,
  },
];

// Route waypoints — the path the line draws, in order.
// Stops at landmarks but also bends along streets/topography for realism.
const ROUTE = [
  [95, 510],   // Morris Isaacson
  [80, 470],
  [60, 440],   // Naledi
  [120, 410],
  [200, 395],
  [300, 380],  // Phefeni
  [360, 345],  // Vilakazi
  [430, 350],
  [525, 365],  // Orlando Stadium
  [510, 290],  // (after — the violence spreads north)
  [475, 220],
  [440, 175],  // Mzimhlope
  [400, 250],
  [350, 380],  // (return south)
  [320, 480],
  [290, 600],  // Avalon
];

const ROUTE_PATH = ROUTE.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

// Stylised street suggestion lines
const ROADS = [
  'M 0,100 Q 200,110 400,100 T 700,115',
  'M 0,200 Q 200,210 400,195 T 700,210',
  'M 0,300 Q 200,290 400,310 T 700,300',
  'M 0,400 Q 200,410 400,395 T 700,410',
  'M 0,500 Q 200,495 400,510 T 700,500',
  'M 0,600 Q 200,605 400,595 T 700,610',
  'M 100,0 Q 110,200 95,400 T 100,700',
  'M 250,0 Q 260,200 245,400 T 250,700',
  'M 400,0 Q 410,200 395,400 T 400,700',
  'M 550,0 Q 560,200 545,400 T 550,700',
];

export default function MapWalkthroughSection() {
  const ref = useRef(null);
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(2000);
  const [dot, setDot] = useState({ x: ROUTE[0][0], y: ROUTE[0][1] });
  const [progress, setProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  // Smooth the progress so the line drawing isn't jittery
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 32 });

  // Drawing happens between 8% and 78% of section scroll so all landmarks
  // (including Avalon at routeAt=1.0) reveal well before the section ends.
  // The final ~22% of section scroll is a "rest" where Avalon's caption can
  // be read in full before the next section pins.
  const drawProgress = useTransform(smoothProgress, [0.08, 0.78], [0, 1]);
  const strokeDashoffset = useTransform(drawProgress, (d) => pathLength * (1 - d));

  // Text panel: fade in early, stay solid all the way through.
  // No fade-out — the previous behaviour killed legibility on the final
  // landmark just when the reader most wanted to read it.
  const textPanelOpacity = useTransform(smoothProgress, [0.02, 0.12], [0, 1]);

  useEffect(() => {
    if (!pathRef.current) return;
    setPathLength(pathRef.current.getTotalLength());
    const unsub = drawProgress.on('change', (d) => {
      const clamped = Math.max(0, Math.min(1, d));
      setProgress(clamped);
      const len = pathRef.current.getTotalLength();
      const pt = pathRef.current.getPointAtLength(clamped * len);
      setDot({ x: pt.x, y: pt.y });
    });
    return unsub;
  }, [drawProgress]);

  // Which landmarks have been "reached" by the route
  const reachedLandmarks = LANDMARKS.filter((lm) => progress >= lm.routeAt - 0.02);
  const currentLandmark = reachedLandmarks.length > 0
    ? reachedLandmarks[reachedLandmarks.length - 1]
    : null;

  return (
    <section
      ref={ref}
      data-stop="map-walkthrough"
      className="relative"
      style={{ height: '320vh' }}  // section is 320vh — gives 2.2 viewports of scroll for the drawing
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden flex flex-col md:flex-row"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, #16110c 0%, #0a0908 70%, #050403 100%)',
        }}
      >
        {/* Paper-grain texture wash */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='p'><feTurbulence baseFrequency='0.04' numOctaves='3'/><feColorMatrix values='0 0 0 0 1   0 0 0 0 0.95   0 0 0 0 0.85   0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23p)'/></svg>\")",
          }}
        />

        {/* Header strip */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 md:px-10 pt-6 md:pt-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="block h-px w-10 bg-[#a11616]" />
            <span
              className="memorial-eyebrow text-[10px] md:text-[11px] tracking-[0.32em] uppercase text-[#a11616]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              the ground · retraced
            </span>
          </div>
          <span
            className="memorial-eyebrow text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-stone-300/80"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            soweto · 16 vi 1976
          </span>
        </div>

        {/* Map fills the area */}
        <div className="relative flex-1 flex items-center justify-center order-2 md:order-1">
          <svg
            viewBox="0 0 700 700"
            className="w-full h-full max-w-[700px] max-h-[85vh]"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="map-warm" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#3a2820" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0a0908" stopOpacity="0" />
              </radialGradient>
              <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <filter id="route-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>
            </defs>

            {/* Warm wash */}
            <rect width="700" height="700" fill="url(#map-warm)" />

            {/* Streets */}
            <g stroke="rgba(180, 160, 130, 0.10)" strokeWidth="1.1" fill="none">
              {ROADS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>

            {/* Stadium icon */}
            <g transform="translate(525, 365)">
              <ellipse cx="0" cy="0" rx="22" ry="14" fill="none" stroke="rgba(200, 180, 150, 0.32)" strokeWidth="1.2" />
              <ellipse cx="0" cy="0" rx="13" ry="8" fill="none" stroke="rgba(200, 180, 150, 0.32)" strokeWidth="1" />
            </g>

            {/* Compass */}
            <g transform="translate(640, 640)" opacity="0.45">
              <line x1="0" y1="-15" x2="0" y2="15" stroke="rgba(200,180,150,0.5)" strokeWidth="0.8" />
              <line x1="-15" y1="0" x2="15" y2="0" stroke="rgba(200,180,150,0.5)" strokeWidth="0.8" />
              <text x="0" y="-19" textAnchor="middle" fontSize="9" fill="rgba(200,180,150,0.65)" style={{ fontFamily: 'var(--font-mono)' }}>N</text>
            </g>

            {/* Undrawn route — dashed faint */}
            <path
              d={ROUTE_PATH}
              fill="none"
              stroke="rgba(200, 180, 150, 0.15)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Drawn route — animated */}
            <motion.path
              ref={pathRef}
              d={ROUTE_PATH}
              fill="none"
              stroke="#a11616"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: pathLength,
                strokeDashoffset,
                filter: 'drop-shadow(0 0 5px rgba(161, 22, 22, 0.55))',
              }}
            />

            {/* Landmarks */}
            {LANDMARKS.map((lm) => {
              const reached = progress >= lm.routeAt - 0.02;
              const isCurrent = currentLandmark && currentLandmark.id === lm.id;
              return (
                <g key={lm.id}>
                  {/* Pulse ring on current */}
                  {isCurrent && (
                    <circle
                      cx={lm.x}
                      cy={lm.y}
                      r="14"
                      fill="none"
                      stroke="rgba(161, 22, 22, 0.4)"
                      strokeWidth="1"
                    >
                      <animate attributeName="r" from="6" to="22" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Marker dot */}
                  <circle
                    cx={lm.x}
                    cy={lm.y}
                    r={reached ? 5 : 3}
                    fill={reached ? '#e6dcc8' : 'rgba(180, 160, 130, 0.35)'}
                    style={{ transition: 'r 0.6s ease, fill 0.6s ease' }}
                  />
                  {reached && (
                    <circle cx={lm.x} cy={lm.y} r="2" fill="#a11616" />
                  )}
                  {/* Label */}
                  <text
                    x={lm.x + 10}
                    y={lm.y + 4}
                    fontSize="12"
                    fill={reached ? 'rgba(245, 238, 225, 0.95)' : 'rgba(180, 160, 130, 0.45)'}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                      transition: 'fill 0.6s ease',
                      filter: reached ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' : 'none',
                    }}
                  >
                    {lm.name}
                  </text>
                  {lm.sub && (
                    <text
                      x={lm.x + 10}
                      y={lm.y + 18}
                      fontSize="9"
                      fill={reached ? 'rgba(200, 180, 150, 0.7)' : 'rgba(180, 160, 130, 0.3)'}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.06em',
                        transition: 'fill 0.6s ease',
                      }}
                    >
                      {lm.sub.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Leading dot */}
            <g>
              <circle cx={dot.x} cy={dot.y} r="11" fill="rgba(161, 22, 22, 0.4)" filter="url(#dot-glow)" />
              <circle cx={dot.x} cy={dot.y} r="5" fill="#d12525" />
              <circle cx={dot.x} cy={dot.y} r="2" fill="#fff5e8" />
            </g>
          </svg>
        </div>

        {/* Caption panel — fades in once at the start, then stays solid */}
        <motion.div
          style={{ opacity: textPanelOpacity }}
          className="relative md:w-[36%] md:max-w-lg flex flex-col justify-center px-6 md:px-10 pb-10 md:py-16 order-1 md:order-2"
        >
          <div className="w-full max-w-lg">
            <h2
              className="memorial-heading mb-5 leading-[1.02]"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)',
                fontWeight: 400,
                letterSpacing: '-0.012em',
              }}
            >
              <span
                className="block mb-3 memorial-eyebrow text-stone-300/95"
                style={{
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontSize: '0.34em',
                }}
              >
                Where it happened
              </span>
              <span className="italic font-light text-stone-300">a walk</span> from the schools
              <span className="italic font-light text-stone-300"> to</span> Orlando Stadium
            </h2>
            <p className="memorial-body text-[0.92rem] md:text-[0.98rem] leading-[1.6] mb-6 text-stone-300/95">
              Roughly three kilometres on foot. Several thousand schoolchildren, in uniform, peacefully. They never reached the stadium. As you scroll, the route draws — and each place along it tells what happened there.
            </p>

            {/* Current landmark caption — animated transition */}
            <div className="min-h-[240px] md:min-h-[260px]">
              {currentLandmark && (
                <motion.div
                  key={currentLandmark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="border-l-2 border-[#a11616] pl-5"
                >
                  <div
                    className="memorial-eyebrow text-[10px] tracking-[0.28em] uppercase text-[#a11616] mb-3 leading-[1.4]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {currentLandmark.name}
                    {currentLandmark.sub && (
                      <span className="block mt-0.5 text-stone-300/70 normal-case tracking-[0.1em]">
                        {currentLandmark.sub}
                      </span>
                    )}
                  </div>
                  <p
                    className="memorial-body text-[0.95rem] md:text-[1rem] leading-[1.65]"
                    style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#ece6dc' }}
                  >
                    {currentLandmark.note}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Scroll progress indicator */}
            <div
              className="mt-10 flex items-center gap-3 memorial-eyebrow text-[10px] tracking-[0.22em] uppercase text-stone-400/80"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span>scroll to walk</span>
              <span className="flex-1 h-px bg-stone-400/15 relative overflow-hidden">
                <span
                  className="absolute inset-y-0 left-0 bg-[#a11616]"
                  style={{ width: `${progress * 100}%`, transition: 'width 0.3s ease' }}
                />
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
