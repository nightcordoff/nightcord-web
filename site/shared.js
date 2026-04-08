const canvas = document.getElementById('fx-canvas');
const page = document.body.dataset.page;

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
        g1.addColorStop(0, `rgba(8, 25, 55, 0.18)`);
        g1.addColorStop(0.4, `rgba(8, 25, 55, 0.09)`);
        g1.addColorStop(1, `rgba(0, 0, 0, 0)`);
        context.fillStyle = g1;
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Secondary nebula (slow drift)
        const nx2 = window.innerWidth * 0.8 + Math.sin(tick * 0.004) * 120;
        const ny2 = window.innerHeight * 0.3 + Math.cos(tick * 0.003) * 80;
        const g2 = context.createRadialGradient(nx2, ny2, 0, nx2, ny2, window.innerWidth * 0.4);
        g2.addColorStop(0, `rgba(8, 25, 55, 0.12)`);
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

highlightActiveNav();
bootCanvas();

const API_CONFIG = {
    baseUrl: 'https://nightcord-web-private.onrender.com' 
};

window.getApiUrl = function(path) {
    const base = API_CONFIG.baseUrl.replace(/\/$/, '');
    return base ? `${base}${path}` : path;
};

fetch(getApiUrl('/api/overview')).then(r => r.json()).then(d => {
    const el = document.getElementById('header-version');
    if (el && d.version) el.textContent = d.version;
}).catch(() => {});

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

function bootDynamicHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let isHidden = false;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            if (!isHidden) {
                header.classList.add('is-hidden');
                isHidden = true;
            }
        } else if (currentScrollY < lastScrollY) {
            if (isHidden) {
                header.classList.remove('is-hidden');
                isHidden = false;
            }
        }
        lastScrollY = currentScrollY;
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
        const atTop = window.scrollY < 100;
        const isNearTop = e.clientY < 80;
        const isFarFromTop = e.clientY > 220;
        const isHoveringHeader = header.matches(':hover');

        if (isNearTop || isHoveringHeader) {
            header.classList.remove('is-hidden');
            isHidden = false;
        } else if (!atTop && isFarFromTop && !isHidden) {
            header.classList.add('is-hidden');
            isHidden = true;
        }
    }, { passive: true });
}

bootDynamicHeader();

setInterval(() => {
    fetch(getApiUrl('/api/health')).catch(() => {});
}, 14 * 60 * 1000);