const canvas = document.getElementById('fx-canvas');
const page = document.body.dataset.page;

function bootCustomCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) {
        return;
    }

    const ring = document.createElement('div');
    const dot = document.createElement('div');
    ring.className = 'cursor-ring';
    dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    document.body.classList.add('has-custom-cursor');

    const pointer = {
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        ringX: window.innerWidth / 2,
        ringY: window.innerHeight / 2,
        dotX: window.innerWidth / 2,
        dotY: window.innerHeight / 2,
    };

    const interactiveSelector = 'a, button, input, select, textarea, label, [role="button"]';

    function setHoverState(target) {
        document.body.classList.toggle('cursor-hover', Boolean(target?.closest(interactiveSelector)));
    }

    function render() {
        pointer.ringX += (pointer.targetX - pointer.ringX) * 0.18;
        pointer.ringY += (pointer.targetY - pointer.ringY) * 0.18;
        pointer.dotX += (pointer.targetX - pointer.dotX) * 0.34;
        pointer.dotY += (pointer.targetY - pointer.dotY) * 0.34;

        ring.style.transform = `translate3d(${pointer.ringX}px, ${pointer.ringY}px, 0) translate(-50%, -50%)`;
        dot.style.transform = `translate3d(${pointer.dotX}px, ${pointer.dotY}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(render);
    }

    window.addEventListener('pointermove', (event) => {
        pointer.targetX = event.clientX;
        pointer.targetY = event.clientY;
        document.body.classList.add('cursor-visible');
        setHoverState(event.target);
    }, { passive: true });

    window.addEventListener('pointerdown', () => {
        document.body.classList.add('cursor-pressed');
    }, { passive: true });

    window.addEventListener('pointerup', () => {
        document.body.classList.remove('cursor-pressed');
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
        document.body.classList.remove('cursor-visible', 'cursor-hover', 'cursor-pressed');
    });

    document.addEventListener('mouseover', (event) => {
        setHoverState(event.target);
    });

    render();
}

function highlightActiveNav() {
    document.querySelectorAll('.main-nav a').forEach((link) => {
        if (link.dataset.nav === page) {
            link.classList.add('is-active');
        }
    });
}

function bootCanvas() {
    if (!canvas) {
        return;
    }

    const context = canvas.getContext('2d');
    const stars = [];
    const starCount = 280;
    const shootingStars = [];
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const nebula = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    function resize() {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function makeStar() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: 0.3 + Math.random() * 1.4,
            baseAlpha: 0.1 + Math.random() * 0.55,
            twinkleSpeed: 0.004 + Math.random() * 0.018,
            twinkleOffset: Math.random() * Math.PI * 2,
            color: Math.random() > 0.88
                ? `rgba(180, 200, 255, `
                : Math.random() > 0.75
                    ? `rgba(255, 220, 180, `
                    : `rgba(255, 255, 255, `,
        };
    }

    function makeShootingStar() {
        const startX = Math.random() * window.innerWidth * 1.2;
        const startY = Math.random() * window.innerHeight * 0.5;
        const angle = Math.PI / 6 + Math.random() * Math.PI / 8;
        const speed = 6 + Math.random() * 10;
        return {
            x: startX, y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            length: 80 + Math.random() * 140,
            alpha: 1,
            life: 0,
            maxLife: 40 + Math.random() * 30,
        };
    }

    function resetStars() {
        stars.length = 0;
        for (let i = 0; i < starCount; i++) stars.push(makeStar());
    }

    let tick = 0;
    let nextShooting = 180 + Math.random() * 240;

    function animate() {
        tick++;
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Soft nebula glow that follows mouse
        nebula.x += (pointer.x - nebula.x) * 0.025;
        nebula.y += (pointer.y - nebula.y) * 0.025;

        const g1 = context.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, window.innerWidth * 0.55);
        g1.addColorStop(0, `rgba(80, 60, 160, 0.07)`);
        g1.addColorStop(0.4, `rgba(40, 30, 100, 0.04)`);
        g1.addColorStop(1, `rgba(0, 0, 0, 0)`);
        context.fillStyle = g1;
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Secondary nebula (slow drift)
        const nx2 = window.innerWidth * 0.8 + Math.sin(tick * 0.004) * 120;
        const ny2 = window.innerHeight * 0.3 + Math.cos(tick * 0.003) * 80;
        const g2 = context.createRadialGradient(nx2, ny2, 0, nx2, ny2, window.innerWidth * 0.4);
        g2.addColorStop(0, `rgba(20, 80, 120, 0.06)`);
        g2.addColorStop(1, `rgba(0, 0, 0, 0)`);
        context.fillStyle = g2;
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Stars
        for (const star of stars) {
            const alpha = star.baseAlpha + Math.sin(tick * star.twinkleSpeed + star.twinkleOffset) * 0.22;
            context.beginPath();
            context.fillStyle = `${star.color}${Math.max(0.04, alpha)})`;
            context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            context.fill();
        }

        // Shooting stars
        if (--nextShooting <= 0) {
            shootingStars.push(makeShootingStar());
            nextShooting = 200 + Math.random() * 300;
        }
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life++;
            s.alpha = Math.max(0, 1 - s.life / s.maxLife);

            const tailX = s.x - s.vx * (s.length / Math.hypot(s.vx, s.vy));
            const tailY = s.y - s.vy * (s.length / Math.hypot(s.vx, s.vy));
            const grad = context.createLinearGradient(tailX, tailY, s.x, s.y);
            grad.addColorStop(0, `rgba(255,255,255,0)`);
            grad.addColorStop(1, `rgba(255,255,255,${s.alpha * 0.85})`);
            context.beginPath();
            context.strokeStyle = grad;
            context.lineWidth = 1.2;
            context.moveTo(tailX, tailY);
            context.lineTo(s.x, s.y);
            context.stroke();

            if (s.life >= s.maxLife) shootingStars.splice(i, 1);
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('pointermove', (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
    }, { passive: true });

    window.addEventListener('resize', () => {
        resize();
        resetStars();
    });

    resize();
    resetStars();
    animate();
}

function bootSparkles() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const sc = document.createElement('canvas');
    sc.className = 'sparkle-canvas';
    document.body.appendChild(sc);
    const ctx = sc.getContext('2d');

    // Trail: circular buffer of {x, y, t}
    const trail = [];
    const TRAIL_DURATION = 520; // ms before a point fully fades

    function resize() {
        sc.width  = window.innerWidth  * devicePixelRatio;
        sc.height = window.innerHeight * devicePixelRatio;
        sc.style.width  = window.innerWidth  + 'px';
        sc.style.height = window.innerHeight + 'px';
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function frame(ts) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Remove expired points
        while (trail.length && ts - trail[0].t > TRAIL_DURATION) trail.shift();

        if (trail.length < 2) { requestAnimationFrame(frame); return; }

        // Draw each segment with alpha based on age
        for (let i = 1; i < trail.length; i++) {
            const p0  = trail[i - 1];
            const p1  = trail[i];
            // progress 0 (oldest) → 1 (newest)
            const prog0 = 1 - (ts - p0.t) / TRAIL_DURATION;
            const prog1 = 1 - (ts - p1.t) / TRAIL_DURATION;
            const alpha = Math.max(0, (prog0 + prog1) / 2);
            const width = 2.2 * alpha;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineWidth   = width;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
            ctx.shadowColor = `rgba(200, 220, 255, ${alpha * 0.5})`;
            ctx.shadowBlur  = 6 * alpha;
            ctx.stroke();
        }

        // Soft glow at tip (newest point)
        const tip = trail[trail.length - 1];
        if (tip) {
            const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 18);
            g.addColorStop(0,   'rgba(255, 255, 255, 0.18)');
            g.addColorStop(1,   'rgba(255, 255, 255, 0)');
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 18, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.shadowBlur = 0;
            ctx.fill();
        }

        requestAnimationFrame(frame);
    }

    window.addEventListener('pointermove', (e) => {
        trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        // cap buffer size
        if (trail.length > 300) trail.shift();
    }, { passive: true });

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
}

highlightActiveNav();
bootCanvas();
bootCustomCursor();
bootSparkles();

// ── Scroll reveal ──────────────────────────────────────────────────────────
function bootScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('[data-reveal], [data-stagger]').forEach((el) => {
        observer.observe(el);
    });

    window.scrollRevealObserver = observer;
}

bootScrollReveal();