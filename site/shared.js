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
    const particles = [];
    const particleCount = 120;
    const stars = [];
    const starCount = 200;
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    function resize() {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function makeParticle() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: 1 + Math.random() * 2.5,
        };
    }

    function makeStar() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: 0.4 + Math.random() * 1.2,
            baseAlpha: 0.15 + Math.random() * 0.45,
            twinkleSpeed: 0.005 + Math.random() * 0.02,
            twinkleOffset: Math.random() * Math.PI * 2,
        };
    }

    function resetParticles() {
        particles.length = 0;
        for (let index = 0; index < particleCount; index += 1) {
            particles.push(makeParticle());
        }
        stars.length = 0;
        for (let index = 0; index < starCount; index += 1) {
            stars.push(makeStar());
        }
    }

    let tick = 0;

    function animate() {
        tick += 1;
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (const star of stars) {
            const alpha = star.baseAlpha + Math.sin(tick * star.twinkleSpeed + star.twinkleOffset) * 0.2;
            context.beginPath();
            context.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, alpha)})`;
            context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            context.fill();
        }

        for (const particle of particles) {
            particle.x += particle.vx + (pointer.x - window.innerWidth / 2) * 0.00002;
            particle.y += particle.vy + (pointer.y - window.innerHeight / 2) * 0.00002;

            if (particle.x < -20 || particle.x > window.innerWidth + 20) particle.vx *= -1;
            if (particle.y < -20 || particle.y > window.innerHeight + 20) particle.vy *= -1;

            context.beginPath();
            context.fillStyle = 'rgba(122, 244, 209, 0.34)';
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fill();
        }

        for (let i = 0; i < particles.length; i += 1) {
            for (let j = i + 1; j < particles.length; j += 1) {
                const first = particles[i];
                const second = particles[j];
                const dx = first.x - second.x;
                const dy = first.y - second.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 140) {
                    context.beginPath();
                    context.strokeStyle = `rgba(154, 134, 255, ${0.12 - distance / 1800})`;
                    context.lineWidth = 1;
                    context.moveTo(first.x, first.y);
                    context.lineTo(second.x, second.y);
                    context.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('pointermove', (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
    }, { passive: true });

    window.addEventListener('resize', () => {
        resize();
        resetParticles();
    });

    resize();
    resetParticles();
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