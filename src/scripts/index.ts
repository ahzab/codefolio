interface MousePosition { x: number; y: number; }

const matrixCanvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
const mctx = matrixCanvas.getContext('2d')!;
const glowCanvas = document.getElementById('glow-canvas') as HTMLCanvasElement;
const gctx = glowCanvas.getContext('2d')!;
const toastContainer = document.getElementById('toast-container')!;
const palette = document.getElementById('command-palette')!;
const paletteInput = document.getElementById('palette-input') as HTMLInputElement;
const paletteResults = document.getElementById('palette-results')!;
const terminalLogs = document.getElementById('terminal-logs')!;

const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const fontSize = 14;
let columns = 0;
let drops: number[] = [];

// --- Commands ---
const commands = [
    { name: 'INITIALIZE CONTACT', action: () => window.location.href = 'mailto:abdel@codefolio.dev', icon: '✉️' },
    { name: 'SWITCH THEME', action: () => rotateTheme(), icon: '🌓' },
    { name: 'TOGGLE SOURCE CODE', action: () => {
            document.querySelectorAll('.grid-card').forEach(c => c.classList.toggle('is-flipped'));
            showToast('Source Code Toggled');
        }, icon: '💻' },
    { name: 'GITHUB REPOSITORY', action: () => window.open('#', '_blank'), icon: '📂' },
];

const showToast = (msg: string) => {
    toastContainer.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'mono text-[10px] uppercase tracking-widest px-4 py-2 bg-slate-900/90 dark:bg-white/90 text-white dark:text-black rounded-sm animate-toast';
    t.innerText = msg;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 2500);
};

const rotateTheme = () => {
    const current = localStorage.getItem('theme') || 'system';
    const themes: any[] = ['light', 'dark', 'system'];
    const next = themes[(themes.indexOf(current) + 1) % themes.length];

    const isDark = next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);

    localStorage.setItem('theme', next);
    showToast(`Mode: ${next}`);
};

const togglePalette = (show: boolean) => {
    palette.classList.toggle('hidden', !show);
    document.body.style.overflow = show ? 'hidden' : '';
    if (show) {
        paletteInput.value = '';
        paletteInput.focus();
        renderPalette('');
    }
};

const renderPalette = (q: string) => {
    const filtered = commands.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
    paletteResults.innerHTML = filtered.map((c, i) => `
        <div class="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mono text-[10px] text-slate-600 dark:text-slate-300" onclick="window.paletteExec(${i})">
            <span>${c.icon}</span> ${c.name}
        </div>
    `).join('');
    (window as any).currentFiltered = filtered;
};

(window as any).paletteExec = (i: number) => {
    (window as any).currentFiltered[i].action();
    togglePalette(false);
};

const LOGS = ["SYNCING REPO...", "DOCKER BUILD...", "UNIT TESTS: PASS", "PUSHING TO ECR", "INVALIDATING CDN", "HEALTH: 100%"];
const startTerminal = () => {
    let i = 0;
    setInterval(() => {
        const l = document.createElement('div');
        l.className = 'mono text-[9px] flex gap-2 animate-reveal';
        l.innerHTML = `<span class="text-purple-500  dark:text-sky-500">[SYS]</span> <span class="text-white dark:text-slate-500">${LOGS[i]}</span>`;
        terminalLogs.appendChild(l);
        if (terminalLogs.childNodes.length > 5) terminalLogs.removeChild(terminalLogs.firstChild!);
        i = (i + 1) % LOGS.length;
    }, 3000);
};

const resize = () => {
    matrixCanvas.width = glowCanvas.width = window.innerWidth;
    matrixCanvas.height = glowCanvas.height = window.innerHeight;
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = new Array(columns).fill(1);
};

const drawMatrix = () => {
    const isDark = document.documentElement.classList.contains('dark');
    mctx.fillStyle = isDark ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    mctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
    mctx.font = `${fontSize}px monospace`;
    drops.forEach((y, i) => {
        mctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, y * fontSize);
        if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
};

let mouse: MousePosition = { x: -1000, y: -1000 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

const drawGlow = () => {
    gctx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
    const g = gctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 400);
    const isDark = document.documentElement.classList.contains('dark');
    g.addColorStop(0, isDark ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.08)');
    g.addColorStop(1, 'transparent');
    gctx.fillStyle = g;
    gctx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
    requestAnimationFrame(drawGlow);
};

const updateStats = () => {
    const timeOpts: any = { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const timeEl = document.getElementById('local-time');
    if (timeEl) timeEl.innerText = new Intl.DateTimeFormat('en-GB', timeOpts).format(new Date());

    const start = Date.now();
    fetch('/favicon.ico', { mode: 'no-cors' }).then(() => {
        const latEl = document.getElementById('latency');
        if (latEl) latEl.innerText = `${Date.now() - start}ms`;
    }).catch(() => {});
};

window.addEventListener('resize', resize);
resize();
setInterval(drawMatrix, 33);
setInterval(updateStats, 3000);
//startTerminal();
drawGlow();

document.getElementById('palette-toggle')?.addEventListener('click', () => togglePalette(true));
document.getElementById('btn-light')?.addEventListener('click', () => rotateTheme());
document.getElementById('btn-dark')?.addEventListener('click', () => rotateTheme());
document.getElementById('btn-system')?.addEventListener('click', () => rotateTheme());

paletteInput.addEventListener('input', (e) => {
    renderPalette((e.target as HTMLInputElement).value);
});

window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePalette(palette.classList.contains('hidden'));
    }
    if (e.key === 'Escape') togglePalette(false);
});