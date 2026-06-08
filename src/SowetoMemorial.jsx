import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

import AmbientAudio from './components/AmbientAudio.jsx';
import MapWalkthroughSection from './components/MapWalkthroughSection.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGES — drop the 11 Alf Kumalo photographs into ./images and they'll resolve.
// ─────────────────────────────────────────────────────────────────────────────
import img01 from './images/01_march.jpg';        // March to Orlando Stadium
import img02 from './images/02_bus.jpg';          // Destroy Bantu Education
import img03 from './images/03_scatter.jpg';      // Mzimhlope teargas
import img04 from './images/04_runner.jpg';       // Lone figure in teargas
import img05 from './images/05_khwezi.jpg';       // Khwezi Station ablaze
import img06 from './images/06_moroka.jpg';       // Moroka burning truck
import img07 from './images/07_mzimhlope.jpg';    // Bodies before army vehicle
import img08 from './images/08_buses.jpg';        // Youth on buses
import img09 from './images/09_grave.jpg';        // Wheelchair at Pieterson grave
import img10 from './images/10_exile.jpg';        // Mashinini & Seathlholo, Botswana
import img11 from './images/11_kumalo.jpg';       // Kumalo himself, with Muhammad Ali
import img12 from './images/12_cape_times.jpg';    // Cape Times front page, 18 June 1976

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEY — each stop is a stage along the actual route of the uprising,
// anchored by one of Kumalo's photographs.
// ─────────────────────────────────────────────────────────────────────────────
const JOURNEY = [
  {
    id: 'morris-isaacson',
    place: 'Morris Isaacson High',
    coord: 'Mofolo South',
    image: img01,
    title: 'The march begins',
    body: 'On the morning of 16 June 1976, students poured out of Morris Isaacson, Naledi, Phefeni and a dozen other schools. They walked in their thousands toward Orlando Stadium, raising placards against the imposition of Afrikaans as the language of instruction. They were children. The youngest were ten.',
    caption: 'Students on the march to Orlando Stadium, June 1976.',
    tone: 'rise',
  },
  {
    id: 'phefeni',
    place: 'Phefeni Junior Secondary',
    coord: 'Orlando West',
    image: img02,
    title: 'Destroy Bantu Education',
    body: 'The placards were hand-cut from cardboard. The slogans were written in marker, in chalk, in pen. Bantu Education was the law that designed Black schools to produce labourers — Hendrik Verwoerd had said so himself. The children of Soweto refused to inherit it.',
    caption: 'Children of Soweto with a placard reading "Destroy Bantu Education".',
    tone: 'rise',
  },
  {
    id: 'vilakazi',
    place: 'Vilakazi Street',
    coord: 'Orlando West',
    image: img03,
    title: 'The first volleys',
    body: 'The police arrived. They threw teargas first. Then they fired into the crowd. Adult activists ran with the children — labourers, mothers, neighbours, everyone who had heard the shots. Soweto was not a place that ran from its own.',
    caption: 'Residents scatter as teargas permeates the air near Mzimhlope Hostel.',
    tone: 'break',
  },
  {
    id: 'teargas',
    place: 'between the houses',
    coord: 'Orlando West',
    image: img04,
    title: 'Through the smoke',
    body: 'Alf Kumalo carried his cameras through it. As a Black photographer, he could not be everywhere the white press could; he could also be in places they could not. He hid film canisters in his socks. He kept walking.',
    caption: 'A Soweto resident runs from the toxic smell of teargas, 1976.',
    tone: 'breath',
  },
  {
    id: 'khwezi',
    place: 'Khwezi Station',
    coord: 'Soweto',
    image: img05,
    title: 'The township answers',
    body: 'By afternoon the smoke could be seen from Johannesburg. Beerhalls burned. Government buildings burned. The dead were being counted, and the count was wrong — the official toll was a fraction of the real one. Across Soweto, sixteen burned through into seventeen, and the fires were still alight.',
    caption: 'Children look on as Khwezi Station, Soweto, goes up in smoke.',
    tone: 'fire',
    layout: 'portrait',
  },
  {
    id: 'moroka',
    place: 'Moroka Police Station',
    coord: 'Soweto',
    image: img06,
    title: 'Night, and the trucks burning',
    body: 'A delivery truck blackened next to the police station. A single soldier in camouflage watching it burn. Kumalo composed the frame the way he composed all of them — with patience, even in chaos. He believed the photograph had to outlive the night.',
    caption: 'A burning truck next to Moroka Police Station conveys the mood of the era.',
    tone: 'fire',
  },
  {
    id: 'cape-times',
    place: 'The morning after',
    coord: 'Cape Town, 18 June 1976',
    image: img12,
    title: 'And the world reads',
    body: 'Two days on, the Cape Times went to press. Twenty-one buildings destroyed by fire. Latest official toll: twenty-nine dead, two hundred and twenty-four injured. The real numbers would not be known for years. The minister of police told Parliament that the death toll had risen. The stock market, the paper noted on its lower fold, was taking the riots calmly. The page is not a Kumalo photograph. It is what his photographs had, by then, made impossible to ignore.',
    caption: 'The Cape Times, Friday 18 June 1976 — "Soweto violence spreads".',
    credit: 'Independent Newspapers Archive',
    tone: 'press',
    layout: 'press',
  },
  {
    id: 'mzimhlope',
    place: 'Mzimhlope',
    coord: 'days later',
    image: img07,
    title: 'What followed',
    body: 'Kumalo took this photograph from the rear window of a car. The Sunday Times\u2019 own drivers had refused to enter Soweto — \u201Cit was too dangerous,\u201D he said. The orders to the police were to "shoot and kill anyone, even photographers." The image was never published in his lifetime by the Times. An editor told the BBC he had been "unlucky" — that he had no good pictures. He had this one.',
    caption: 'Dead lie before an army vehicle near Mzimhlope, days after June 16. Photographed by Alf Kumalo from the rear window of a car.',
    tone: 'still',
  },
  {
    id: 'buses',
    place: 'the road to the funerals',
    coord: 'Soweto, late 1976',
    image: img08,
    title: 'They climbed on the roofs',
    body: 'After June, the youth filled every bus to every funeral. They sat on the roofs. They hung from the doors. The state had killed their schoolmates and the answer was not silence — the answer was visibility, mass, presence, song. The struggle had a new generation now and it had decided.',
    caption: 'Students hanging from buses on the way to funerals and demonstrations, late 1970s.',
    tone: 'rise',
  },
  {
    id: 'avalon',
    place: 'Avalon Cemetery',
    coord: 'Soweto',
    image: img09,
    title: 'Zolile Hector Pieterson',
    body: 'August 19, 1963 — June 16, 1976. Twelve years old. Kumalo returned to the grave often. He photographed this woman — herself wounded in the uprising, herself in a wheelchair — laying flowers. The headstone reads: deeply mourned by his parents, sisters, and a nation that remembers.',
    caption: 'A woman injured during the Soweto uprising pays respect at the grave of Hector Pieterson.',
    tone: 'still',
  },
  {
    id: 'botswana',
    place: 'Botswana',
    coord: 'in exile',
    image: img10,
    title: 'Wanted, dead or alive',
    body: 'Tsietsi Mashinini and Khotso Seathlholo led the Soweto Students\u2019 Representative Council. The state put up posters for them — dead or alive. They crossed the border. Kumalo found them in Botswana and made this photograph: two boys, fists raised, laughing. They were nineteen and eighteen. Neither would live a long life.',
    caption: 'Tsietsi Mashinini and Khotso Seathlholo, student leaders, share a light-hearted moment in exile in Botswana.',
    tone: 'rise',
    layout: 'portrait',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EMBER CANVAS — global, sits behind everything. Ash drifts; intensity scales
// with scroll. Reads as memorial, not weather.
// ─────────────────────────────────────────────────────────────────────────────
function EmberCanvas() {
  const ref = useRef(null);
  const intensity = useRef(0.4);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      intensity.current = 0.35 + Math.sin(p * Math.PI) * 0.65;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let raf;
    const particles = [];
    const TARGET = 110;

    // ─── Particle types ──────────────────────────────────────────────────
    // ash      — dark grey, irregular, tumbles slowly, drifts laterally a lot
    // ashLight — slightly paler ash, larger, slower (the chunkier flakes)
    // ember    — small, glowing orange, falls a bit faster, flickers, rare
    //
    // Distribution: ~70% ash, ~22% ashLight, ~8% ember
    const pickType = () => {
      const r = Math.random();
      if (r < 0.70) return 'ash';
      if (r < 0.92) return 'ashLight';
      return 'ember';
    };

    const spawn = (initial = false) => {
      const type = pickType();
      const base = {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -20,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        sway: Math.random() * Math.PI * 2,
        type,
      };
      if (type === 'ember') {
        return {
          ...base,
          vx: (Math.random() - 0.5) * 0.25,
          vy: 0.4 + Math.random() * 0.5,
          swaySpeed: 0.008 + Math.random() * 0.02,
          swayAmount: 0.4 + Math.random() * 0.3,
          size: 1.2 + Math.random() * 1.8,
          opacity: 0.65 + Math.random() * 0.35,
          flickerPhase: Math.random() * Math.PI * 2,
          flickerSpeed: 0.08 + Math.random() * 0.12,
          life: 0,
          maxLife: 200 + Math.random() * 250,  // embers burn out
        };
      }
      // Ash variants
      const isLight = type === 'ashLight';
      return {
        ...base,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (isLight ? 0.12 : 0.18) + Math.random() * (isLight ? 0.35 : 0.5),
        swaySpeed: 0.006 + Math.random() * 0.018,
        swayAmount: 0.55 + Math.random() * 0.55,  // ash tumbles more — more lateral drift
        size: isLight ? 1.4 + Math.random() * 2.0 : 0.7 + Math.random() * 1.4,
        // Irregular shape: 0 = round-ish, 1 = elongated/jagged
        aspect: 0.5 + Math.random() * 1.4,
        opacity: isLight ? 0.18 + Math.random() * 0.32 : 0.12 + Math.random() * 0.28,
      };
    };

    for (let i = 0; i < TARGET; i++) particles.push(spawn(true));

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    // ─── Draw helpers ────────────────────────────────────────────────────
    const drawAsh = (p) => {
      // Irregular polygon — looks like a tumbling flake. Drawn with 5 vertices
      // at varying radii, rotated by particle's rotation.
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.beginPath();
      const verts = 5;
      const r = p.size;
      // Use deterministic per-particle variation (cached via aspect) for the
      // jagged outline so the shape is stable across frames.
      for (let i = 0; i < verts; i++) {
        const angle = (i / verts) * Math.PI * 2;
        // Push vertices out at slightly different radii — gives a chunky look
        const rr = r * (0.6 + ((Math.sin(angle * 3 + p.aspect * 7) + 1) / 2) * 0.9);
        const x = Math.cos(angle) * rr * p.aspect;
        const y = Math.sin(angle) * rr / p.aspect;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      // Ash colour: warm dark grey, with a hint of brown
      const isLight = p.type === 'ashLight';
      const baseR = isLight ? 130 : 95;
      const baseG = isLight ? 122 : 88;
      const baseB = isLight ? 110 : 78;
      ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${p.opacity})`;
      ctx.fill();
      // Subtle darker edge for definition
      ctx.strokeStyle = `rgba(40, 35, 30, ${p.opacity * 0.5})`;
      ctx.lineWidth = 0.4;
      ctx.stroke();
      ctx.restore();
    };

    const drawEmber = (p) => {
      // Flicker — combine the running phase with life-decay
      const flicker = 0.7 + 0.3 * Math.sin(p.flickerPhase);
      const lifeT = p.life / p.maxLife;
      // Lifespan envelope: fade-in (first 8%), full burn, fade-out (last 25%)
      let lifeEnv;
      if (lifeT < 0.08) lifeEnv = lifeT / 0.08;
      else if (lifeT > 0.75) lifeEnv = (1 - lifeT) / 0.25;
      else lifeEnv = 1;
      const alpha = p.opacity * flicker * lifeEnv;

      // Outer glow — large soft radial gradient
      const glowR = p.size * 6;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      grad.addColorStop(0, `rgba(255, 180, 100, ${alpha * 0.55})`);
      grad.addColorStop(0.3, `rgba(240, 130, 60, ${alpha * 0.28})`);
      grad.addColorStop(1, 'rgba(220, 80, 30, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 230, 180, ${Math.min(1, alpha * 1.3)})`;
      ctx.fill();

      // Hot centre
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 240, ${Math.min(1, alpha * 1.6)})`;
      ctx.fill();
    };

    // ─── Main loop ───────────────────────────────────────────────────────
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const desired = Math.floor(TARGET * intensity.current);
      if (particles.length < desired && Math.random() < 0.4) particles.push(spawn());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.sway += p.swaySpeed;
        p.rotation += p.rotSpeed;
        p.x += p.vx + Math.sin(p.sway) * p.swayAmount;
        p.y += p.vy;

        if (p.type === 'ember') {
          p.life++;
          p.flickerPhase += p.flickerSpeed;
        }

        // Recycle when off-screen or ember burnt out
        const offScreen = p.y > h + 10 || p.x < -20 || p.x > w + 20;
        const burntOut = p.type === 'ember' && p.life >= p.maxLife;
        if (offScreen || burntOut) {
          if (particles.length > desired) {
            particles.splice(i, 1);
            continue;
          }
          Object.assign(p, spawn());
          continue;
        }

        if (p.type === 'ember') drawEmber(p);
        else drawAsh(p);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[5]"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILM GRAIN — subtle, period-appropriate
// ─────────────────────────────────────────────────────────────────────────────
const grainSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
       <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
       <rect width='100%' height='100%' filter='url(#n)' opacity='0.7'/>
     </svg>`
  );

function FilmGrain() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[6] opacity-[0.10] mix-blend-overlay"
      style={{ backgroundImage: `url("${grainSvg}")`, backgroundSize: '240px 240px' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL PROGRESS BAR — thin red line at the top, the only red on the page
// outside the date marker
// ─────────────────────────────────────────────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#a11616] z-[50]"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE INDICATOR — fixed on the right, scroll-position-tracked.
// Measures the offsetTop of each <section data-stop="..."> and picks whichever
// is closest to the viewport's vertical centre. Rock-solid; no IO timing games.
// ─────────────────────────────────────────────────────────────────────────────
function RouteIndicator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const els = JOURNEY.map((s) => document.querySelector(`[data-stop="${s.id}"]`));
      const centre = window.scrollY + window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      els.forEach((el, i) => {
        if (!el) return;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        const mid = (top + bottom) / 2;
        const dist = Math.abs(centre - mid);
        const inside = centre >= top && centre <= bottom;
        const score = inside ? dist - 100000 : dist;
        if (score < bestDist) {
          bestDist = score;
          best = i;
        }
      });
      setActiveIndex(best);

      // Hide the indicator while the map walkthrough section is in view —
      // the map is itself a route visualisation and would clash with the
      // indicator labels on the right edge.
      const mapEl = document.querySelector('[data-stop="map-walkthrough"]');
      if (mapEl) {
        const mTop = mapEl.offsetTop;
        const mBot = mTop + mapEl.offsetHeight;
        // Hide once the section's first stick begins, show once it's clearly past
        const inMap = window.scrollY + window.innerHeight * 0.4 >= mTop &&
                      window.scrollY + window.innerHeight * 0.4 < mBot;
        setHidden(inMap);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 250);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className={`fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-end gap-3 transition-opacity duration-500 ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {JOURNEY.map((stop, i) => (
        <div key={stop.id} className="flex items-center gap-3 group">
          <span
            className={`text-[10px] tracking-[0.18em] uppercase transition-all duration-500 ${
              i === activeIndex
                ? 'text-stone-200 opacity-100 translate-x-0'
                : 'text-stone-500 opacity-0 group-hover:opacity-70 translate-x-2'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {stop.place}
          </span>
          <span
            className={`block rounded-full transition-all duration-500 ${
              i === activeIndex
                ? 'w-3 h-3 bg-[#a11616]'
                : i < activeIndex
                ? 'w-2 h-2 bg-stone-400'
                : 'w-2 h-2 bg-stone-700'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO — full viewport, date emerges, title resolves out of the haze
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden">
      {/* Backdrop wash */}
      <motion.div
        style={{ scale }}
        className="absolute inset-0 z-0"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 35%, rgba(60,40,30,0.55) 0%, rgba(0,0,0,0.95) 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${img01})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(1) contrast(1.1) brightness(0.5)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-stone-950" />
      </motion.div>

      <motion.div style={{ y, opacity }} className="relative z-10 px-6 md:px-16 pb-20 md:pb-32 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="flex items-center gap-4 mb-8"
        >
          <span className="block h-px w-12 bg-[#a11616]" />
          <span className="text-[#a11616] text-sm tracking-[0.35em] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            16 June 1976
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="text-stone-100 leading-[0.92]"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(3rem, 9vw, 8rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}
        >
          <span className="block italic font-light text-stone-400">Soweto,</span>
          <span className="block">through the eye of Alf Kumalo</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 1.1 }}
          className="memorial-body mt-10 max-w-2xl text-lg md:text-xl leading-relaxed"
        >
          A walk along the route the students took on the morning of the uprising —
          told through the photographs of a man who refused to look away.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 1.8 }}
          className="memorial-eyebrow mt-16 flex items-center gap-3 text-stone-300/90 text-xs tracking-[0.2em] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>Scroll to walk with them</span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="block w-px h-8 bg-stone-500/60"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// useIsMobile — single source of truth for layout/motion decisions.
// On mobile (<768px) we:
//   • collapse 200vh sticky stops into a single scroll-length flow
//   • skip the per-stop autonomous breath rAF (battery, jank)
//   • stack image + text instead of overlaying them
// ─────────────────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setM(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEY STOP — pinned image with multi-layer motion. Two layouts:
//   • landscape: full-bleed sticky image, text floats over
//   • portrait : centred composition, image as a tall column with text alongside
//
// Motion layers (compose for an alive, breathing feel):
//   1. Scroll-driven Ken-Burns (scale + translate)
//   2. Continuous "breathing" scale (autonomous, ~8s cycle)
//   3. Parallax decoupling — image and text move at different rates
//   4. Entry filter shift — image emerges from haze (blur+brightness rolloff)
//   5. Vignette pulses subtly with the breath
// ─────────────────────────────────────────────────────────────────────────────
function JourneyStop({ stop, index }) {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const isStill = stop.tone === 'still';
  const isPortrait = stop.layout === 'portrait';
  const isPress = stop.layout === 'press';

  // Scroll-linked: Ken-Burns drift on image
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    isStill ? [1.04, 1.10] : isPortrait ? [1.06, 1.12] : [1.09, 1.20]
  );
  const imgY = useTransform(scrollYProgress, [0, 1], ['4%', '-14%']);
  // Slight horizontal drift — adds a sense of camera-glide
  const imgX = useTransform(
    scrollYProgress,
    [0, 1],
    isStill ? ['0%', '0%'] : index % 2 === 0 ? ['-2%', '2%'] : ['2%', '-2%']
  );

  // Entry — image clarifies from haze as it enters.
  // Skip blur on mobile — GPU expensive and the dramatic effect doesn't read
  // as well on small screens; lighter contrast shift instead.
  const imgBlur = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    isMobile ? [0, 0, 0, 0] : [10, 0, 0, 6]
  );
  const imgFilter = useTransform(
    imgBlur,
    (b) => `grayscale(1) contrast(1.06) brightness(0.85)${b ? ` blur(${b}px)` : ''}`
  );

  // Text parallax — different rate than image, creates depth.
  // Reduced on mobile (no overlay, less depth needed)
  const textY = useTransform(scrollYProgress, [0, 1], isMobile ? ['0%', '0%'] : ['12%', '-8%']);
  const textOpacity = useTransform(
    scrollYProgress,
    [0.15, 0.32, 0.78, 0.95],
    isMobile ? [1, 1, 1, 1] : [0, 1, 1, 0.3]
  );

  // Autonomous "breathing" — DESKTOP ONLY. 12 simultaneous rAF loops on mobile
  // hurts battery + scroll smoothness, and the effect is barely perceptible on
  // a small screen anyway.
  const breath = useMotionValue(0);
  useEffect(() => {
    if (isMobile) return;
    let raf;
    const t0 = performance.now();
    const loop = (t) => {
      const elapsed = (t - t0) / 1000;
      // ~7.5s breath cycle, 0..1
      breath.set((Math.sin((elapsed / 7.5) * Math.PI * 2) + 1) / 2);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [breath, isMobile]);

  // Compose breath into a tiny extra scale on top of the Ken-Burns
  const breathScale = useTransform(breath, [0, 1], [1, isStill ? 1.008 : 1.018]);
  const vignetteOpacity = useTransform(breath, [0, 1], [0.85, 1]);

  const accent = isStill ? 'text-stone-500' : 'text-[#a11616]';

  // ─── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  // Full-bleed image with text overlaid, just like desktop — but only ONE
  // viewport-height of sticky pin (vs desktop's 200vh) so each stop passes in
  // roughly one scroll-length on a phone. Ken-Burns still applies. Text scrim
  // guarantees legibility regardless of underlying image.
  if (isMobile) {
    // Press (Cape Times) gets its own object-contain treatment so the
    // newspaper page reads fully on a phone.
    if (isPress) {
      return (
        <section
          ref={ref}
          data-stop={stop.id}
          className="relative"
          style={{ minHeight: '180vh' }}
        >
          <div
            className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-end"
            style={{
              background:
                'radial-gradient(ellipse at 50% 40%, #1a1612 0%, #0a0908 70%, #050403 100%)',
            }}
          >
            {/* Newspaper page — centred in upper portion of viewport */}
            <div className="flex-1 flex items-center justify-center px-6 pt-16 pb-2 min-h-0">
              <motion.img
                src={stop.image}
                alt={stop.caption}
                className="max-h-full max-w-full object-contain"
                style={{
                  filter: 'sepia(0.18) contrast(1.05) brightness(0.96) saturate(0.85)',
                  boxShadow: '0 20px 50px -15px rgba(0,0,0,0.8)',
                  scale,
                  y: imgY,
                }}
                loading="lazy"
              />
            </div>

            {/* Bottom scrim + text */}
            <div aria-hidden className="text-scrim" />
            <motion.div
              style={{ opacity: textOpacity }}
              className="relative px-5 pb-10 pt-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`block h-px w-7 bg-current ${accent}`} />
                <span
                  className={`memorial-eyebrow text-[10px] tracking-[0.28em] uppercase ${accent}`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {String(index + 1).padStart(2, '0')} — {stop.coord}
                </span>
              </div>
              <h2
                className="memorial-heading mb-4 leading-[1.05]"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.65rem, 6.5vw, 2.25rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.012em',
                }}
              >
                <span
                  className="block mb-1.5 text-stone-300/95 memorial-eyebrow"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontSize: '0.32em',
                  }}
                >
                  {stop.place}
                </span>
                {stop.title}
              </h2>
              <p className="memorial-body text-[0.95rem] leading-[1.6]">
                {stop.body}
              </p>
            </motion.div>
          </div>
        </section>
      );
    }

    // Standard mobile: full-bleed image, text overlaid at bottom
    return (
      <section
        ref={ref}
        data-stop={stop.id}
        className="relative"
        style={{ minHeight: '180vh' }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Image, full-bleed */}
          <motion.div
            style={{
              scale,
              y: imgY,
            }}
            className="absolute inset-0"
          >
            <motion.img
              src={stop.image}
              alt={stop.caption}
              className="w-full h-full object-cover"
              style={{ filter: imgFilter }}
              loading="lazy"
            />
          </motion.div>

          {/* Vignette */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.92) 100%)',
            }}
          />

          {/* Bottom text scrim — guarantees text contrast */}
          <div aria-hidden className="text-scrim" />

          {/* Text overlay — bottom of viewport */}
          <motion.div
            style={{ opacity: textOpacity }}
            className="absolute inset-x-0 bottom-0 px-5 pb-10 pt-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`block h-px w-7 bg-current ${accent}`} />
              <span
                className={`memorial-eyebrow text-[10px] tracking-[0.28em] uppercase ${accent}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {String(index + 1).padStart(2, '0')} — {stop.coord}
              </span>
            </div>
            <h2
              className="memorial-heading mb-4 leading-[1.05]"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.65rem, 6.5vw, 2.25rem)',
                fontWeight: 400,
                letterSpacing: '-0.012em',
              }}
            >
              <span
                className="block mb-1.5 text-stone-300/95 memorial-eyebrow"
                style={{
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontSize: '0.32em',
                }}
              >
                {stop.place}
              </span>
              {stop.title}
            </h2>
            <p className="memorial-body text-[0.95rem] leading-[1.6]">
              {stop.body}
            </p>
            <p
              className="memorial-caption mt-4 text-[12px] italic"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {stop.caption} —{' '}
              <span
                className="not-italic"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
              >
                photo: Alf Kumalo
              </span>
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  // ─── PRESS LAYOUT ──────────────────────────────────────────────────────────
  // Used for the Cape Times interlude. Treats the image as an archival object,
  // not a photograph: framed, slightly tilted, sitting on a textured backdrop.
  if (isPress) {
    const tilt = useTransform(scrollYProgress, [0, 1], [-2.5, 2]);
    return (
      <section
        ref={ref}
        data-stop={stop.id}
        className="relative min-h-[200vh] flex"
      >
        <div
          className="sticky top-0 h-screen w-full overflow-hidden flex items-center"
          style={{
            background:
              'radial-gradient(ellipse at 50% 60%, #1a1612 0%, #0a0908 65%, #050403 100%)',
          }}
        >
          {/* Subtle paper-texture wash */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='p'><feTurbulence baseFrequency='0.04' numOctaves='3'/><feColorMatrix values='0 0 0 0 1   0 0 0 0 0.95   0 0 0 0 0.85   0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23p)'/></svg>\")",
            }}
          />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-12 gap-8 md:gap-16 items-center">
            {/* Newspaper page — tilted, framed */}
            <motion.div
              className="md:col-span-6 md:order-2 relative"
              style={{ y: imgY, scale: breathScale, rotate: tilt }}
            >
              <div
                className="relative mx-auto"
                style={{ maxWidth: 'min(460px, 78vw)', aspectRatio: '645 / 850' }}
              >
                {/* Drop shadow sheet behind */}
                <div
                  className="absolute -inset-3 bg-black/60 blur-xl rounded-sm"
                  aria-hidden
                />
                <div
                  className="absolute -inset-1 bg-black/40 blur-md"
                  aria-hidden
                />
                <motion.img
                  src={stop.image}
                  alt={stop.caption}
                  className="relative w-full h-full object-cover z-10"
                  style={{
                    filter: 'sepia(0.18) contrast(1.05) brightness(0.96) saturate(0.85)',
                    boxShadow: '0 30px 60px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(80,70,55,0.25)',
                  }}
                  loading="lazy"
                />
                {/* Crease/wear vignette directly on the page */}
                <div
                  aria-hidden
                  className="absolute inset-0 z-20 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, transparent 55%, rgba(20,15,10,0.35) 100%)',
                  }}
                />
              </div>
              <div
                className="mt-4 text-center memorial-caption text-[11px] tracking-[0.18em] uppercase"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {stop.credit || 'archive'}
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              className="md:col-span-6 md:order-1"
              style={{ y: textY, opacity: textOpacity }}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className={`block h-px w-8 bg-current ${accent}`} />
                <span
                  className={`memorial-eyebrow text-[11px] tracking-[0.32em] uppercase ${accent}`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {String(index + 1).padStart(2, '0')} — {stop.coord}
                </span>
              </div>
              <h2
                className="memorial-heading mb-6 leading-[1]"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2rem, 4.8vw, 4rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.015em',
                }}
              >
                <span
                  className="block mb-2 text-stone-300/95 memorial-eyebrow"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontSize: '0.28em',
                  }}
                >
                  {stop.place}
                </span>
                {stop.title}
              </h2>
              <p className="memorial-body text-[1.06rem] md:text-[1.18rem] leading-[1.68] max-w-xl">
                {stop.body}
              </p>
              <p
                className="memorial-caption mt-8 text-[13px] md:text-sm italic max-w-xl"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {stop.caption}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // ─── PORTRAIT LAYOUT ───────────────────────────────────────────────────────
  if (isPortrait) {
    const side = index % 2 === 0 ? 'left' : 'right';
    return (
      <section
        ref={ref}
        data-stop={stop.id}
        className="relative min-h-[200vh] flex"
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
          {/* Backdrop: blurred copy of the image fills the void around the portrait */}
          <motion.div
            aria-hidden
            style={{ scale: breathScale }}
            className="absolute inset-0"
          >
            <img
              src={stop.image}
              alt=""
              className="w-full h-full object-cover"
              style={{
                filter: 'grayscale(1) brightness(0.35) blur(40px) contrast(1.2)',
                transform: 'scale(1.15)',
              }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/55" />
          </motion.div>

          {/* Vignette */}
          <motion.div
            aria-hidden
            style={{ opacity: vignetteOpacity }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.92) 100%)',
              }}
            />
          </motion.div>

          {/* Two-column composition */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-12 gap-8 md:gap-16 items-center">
            {/* Portrait image — sized so it never crops the subject */}
            <motion.div
              className={`${
                side === 'left' ? 'md:col-span-5 md:order-1' : 'md:col-span-5 md:order-2'
              } relative`}
              style={{ y: imgY, scale: useTransform([scale, breathScale], ([s, b]) => s * b) }}
            >
              <div className="relative mx-auto" style={{ maxWidth: 'min(420px, 80vw)', aspectRatio: '3 / 4' }}>
                <motion.img
                  src={stop.image}
                  alt={stop.caption}
                  className="w-full h-full object-cover relative z-10"
                  style={{ filter: imgFilter }}
                  loading="lazy"
                />
                {/* Frame ring + soft offset shadow for tactility */}
                <div className="absolute inset-0 ring-1 ring-stone-300/15 z-20 pointer-events-none" />
                <div
                  className="absolute -inset-2 -z-0 opacity-60 blur-2xl"
                  style={{
                    background: 'radial-gradient(circle, rgba(220,130,90,0.25), transparent 70%)',
                  }}
                />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              className={`${
                side === 'left' ? 'md:col-span-7 md:order-2' : 'md:col-span-7 md:order-1'
              }`}
              style={{ y: textY, opacity: textOpacity }}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className={`block h-px w-8 bg-current ${accent}`} />
                <span
                  className={`memorial-eyebrow text-[11px] tracking-[0.32em] uppercase ${accent}`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {String(index + 1).padStart(2, '0')} — {stop.coord}
                </span>
              </div>
              <h2
                className="memorial-heading mb-6 leading-[1]"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2rem, 4.8vw, 4rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.015em',
                }}
              >
                <span
                  className="block mb-2 text-stone-300/95 memorial-eyebrow"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontSize: '0.28em',
                  }}
                >
                  {stop.place}
                </span>
                {stop.title}
              </h2>
              <p className="memorial-body text-[1.06rem] md:text-[1.18rem] leading-[1.68] max-w-xl">
                {stop.body}
              </p>
              <p
                className="memorial-caption mt-8 text-[13px] md:text-sm italic max-w-xl"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {stop.caption} —{' '}
                <span
                  className="not-italic"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                >
                  photo: Alf Kumalo
                </span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // ─── LANDSCAPE LAYOUT (default) ────────────────────────────────────────────
  return (
    <section
      ref={ref}
      data-stop={stop.id}
      className="relative min-h-[200vh] flex"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Image, with multi-layer motion */}
        <motion.div
          style={{
            scale: useTransform([scale, breathScale], ([s, b]) => s * b),
            y: imgY,
            x: imgX,
          }}
          className="absolute inset-0"
        >
          <motion.img
            src={stop.image}
            alt={stop.caption}
            className="w-full h-full object-cover"
            style={{ filter: imgFilter }}
            loading="lazy"
          />
        </motion.div>

        {/* Cinematic vignette, breathing */}
        <motion.div
          aria-hidden
          style={{ opacity: vignetteOpacity }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.92) 100%)',
            }}
          />
        </motion.div>

        {/* Localised text scrim — guarantees contrast under the text block */}
        <div aria-hidden className="text-scrim" />

        {/* Text overlay — bottom-left composition, parallax-decoupled */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-0 flex items-end"
        >
          <div className="px-6 md:px-16 pb-20 md:pb-28 max-w-4xl">
            <div className="flex items-center gap-3 mb-5">
              <span className={`block h-px w-8 bg-current ${accent}`} />
              <span
                className={`memorial-eyebrow text-[11px] tracking-[0.32em] uppercase ${accent}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {String(index + 1).padStart(2, '0')} — {stop.coord}
              </span>
            </div>
            <h2
              className="memorial-heading mb-6 leading-[1]"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.25rem, 5.5vw, 4.75rem)',
                fontWeight: 400,
                letterSpacing: '-0.015em',
              }}
            >
              <span
                className="block mb-2 text-stone-300/95 memorial-eyebrow"
                style={{
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontSize: '0.28em',
                }}
              >
                {stop.place}
              </span>
              {stop.title}
            </h2>
            <p className="memorial-body text-[1.06rem] md:text-[1.18rem] leading-[1.68] max-w-2xl">
              {stop.body}
            </p>
            <p
              className="memorial-caption mt-8 text-[13px] md:text-sm italic max-w-2xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {stop.caption} —{' '}
              <span
                className="not-italic"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
              >
                photo: Alf Kumalo
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIBUTE — the photographer himself
// ─────────────────────────────────────────────────────────────────────────────
function Tribute() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);

  return (
    <section ref={ref} className="relative bg-stone-950 py-24 md:py-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-12 gap-12 md:gap-20 items-start">
        {/* Portrait */}
        <motion.div
          style={{ y }}
          className="md:col-span-5 relative"
        >
          <div className="relative aspect-[2/3] overflow-hidden bg-stone-900">
            <motion.img
              style={{ scale: imgScale }}
              src={img11}
              alt="Alf Kumalo with Muhammad Ali"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 ring-1 ring-stone-700/40" />
          </div>
          <div
            className="mt-4 text-xs text-stone-500 tracking-[0.18em] uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Alf Kumalo (centre) with Muhammad Ali
          </div>
        </motion.div>

        {/* Tribute text */}
        <div className="md:col-span-7 md:pt-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="block h-px w-12 bg-[#a11616]" />
            <span className="text-[#a11616] text-xs tracking-[0.32em] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
              A photographer's life
            </span>
          </div>
          <h2
            className="text-stone-100 mb-10 leading-[0.98]"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            <span className="block italic text-stone-400 font-light">For</span>
            Alf Kumalo
            <span className="block text-stone-500 text-[0.4em] mt-4 italic font-light">1930 — 2012</span>
          </h2>
          <div className="space-y-6 text-[1.06rem] md:text-[1.18rem] leading-[1.75] max-w-2xl" style={{ color: '#ece6dc', fontFeatureSettings: '"kern" 1, "liga" 1, "onum" 1' }}>
            <p>
              Kumalo became famous for his coverage of the resistance to apartheid that swept South Africa,
              and especially Soweto, where he lived for most of his life.
            </p>
            <p>
              He described how he would sometimes take a single shot on a roll of film before hiding the
              canister in his socks — or elsewhere on his body — to protect it from the police. He risked
              his life to ensure that the story would be told. Sometimes the censors won; the pictures sat
              in drawers for decades. Sometimes they reached the world. Either way, he kept the negatives.
            </p>
            <p>
              He photographed Mandela, Ali, Tutu, Sisulu. He photographed boys with cardboard placards.
              He photographed his own neighbours fleeing the only place they had to go. There is a way of
              seeing that does not flinch and does not perform — that is patient, dignified, and unblinking.
              That is what Kumalo had.
            </p>
            <p className="italic" style={{ fontFamily: 'var(--font-serif)', color: '#c9c2b6' }}>
              These eleven photographs are not all that he made of 1976. They are a beginning.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOSING — quiet, archival
// ─────────────────────────────────────────────────────────────────────────────
function Closing() {
  return (
    <footer className="relative bg-black py-32 px-6 md:px-16 overflow-hidden">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-10">
          <span className="block h-px w-20 bg-[#a11616]" />
        </div>
        <p
          className="leading-[1.5] mb-12"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#ece6dc',
          }}
        >
          "I went to the office the following day and listened to one of the editors telling
          BBC guys that I was unlucky and I didn't get any good pictures."
        </p>
        <div
          className="text-stone-400 text-xs tracking-[0.3em] uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          — Alf Kumalo
        </div>
        <div className="mt-24 text-stone-500 text-[11px] tracking-[0.25em] uppercase space-y-2" style={{ fontFamily: 'var(--font-mono)' }}>
          <div>Photographs: Alf Kumalo</div>
          <div>50 years on — 16 June 2026</div>
          <div>In memory of the children of Soweto</div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function SowetoMemorial() {
  // Inject Google Fonts + design-token CSS variables once
  useEffect(() => {
    const id = 'soweto-memorial-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=JetBrains+Mono:wght@300;400&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = 'soweto-memorial-vars';
    style.textContent = `
      :root {
        --font-serif: 'Cormorant Garamond', 'Garamond', 'Times New Roman', serif;
        --font-mono: 'JetBrains Mono', 'Menlo', monospace;
      }
      html { scroll-behavior: smooth; }
      body { background: #0a0908; overflow-x: hidden; }

      /* ─── Legibility system ─────────────────────────────────────────── */

      /* Soft text scrim — placed behind the text block in each stop.
         A small, localised gradient that guarantees contrast no matter what
         the underlying image looks like. Lighter at the edges, darker behind
         the words. */
      .text-scrim {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(
            to top,
            rgba(10, 9, 8, 0.92) 0%,
            rgba(10, 9, 8, 0.78) 28%,
            rgba(10, 9, 8, 0.45) 55%,
            rgba(10, 9, 8, 0.10) 80%,
            transparent 100%
          );
      }
      /* Variant for two-column / portrait layouts — narrower, on one side */
      .text-scrim-side {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      /* Headline — slight outer glow for crisp reading over busy imagery */
      .memorial-heading {
        color: #f5f1ea;
        text-shadow:
          0 1px 2px rgba(0,0,0,0.65),
          0 2px 14px rgba(0,0,0,0.55);
        font-feature-settings: "kern" 1, "liga" 1;
      }

      /* Body copy — bumped warmth + weight + shadow for legibility */
      .memorial-body {
        color: #ece6dc;
        text-shadow: 0 1px 2px rgba(0,0,0,0.7);
        font-feature-settings: "kern" 1, "liga" 1, "onum" 1;
        font-weight: 400;
      }

      /* Caption — lifted from grey-out-of-darkness to legible warm grey */
      .memorial-caption {
        color: rgba(214, 207, 196, 0.92);
        text-shadow: 0 1px 2px rgba(0,0,0,0.75);
        font-feature-settings: "kern" 1;
      }

      /* Index/coord eyebrow — small but readable */
      .memorial-eyebrow {
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="relative bg-stone-950 text-stone-100 antialiased selection:bg-[#a11616]/40 selection:text-stone-50">
      <ScrollProgress />
      <EmberCanvas />
      <FilmGrain />
      <RouteIndicator />
      <AmbientAudio />

      <Hero />

      {JOURNEY.map((stop, i) => (
        <JourneyStop key={stop.id} stop={stop} index={i} />
      ))}

      <MapWalkthroughSection />

      <Tribute />
      <Closing />
    </div>
  );
}
