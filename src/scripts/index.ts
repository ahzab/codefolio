interface MousePosition { x: number; y: number; }

const matrixCanvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
const mctx = matrixCanvas.getContext('2d')!;
const glowCanvas = document.getElementById('glow-canvas') as HTMLCanvasElement;
const gctx = glowCanvas.getContext('2d')!;
const toastContainer = document.getElementById('toast-container')!;
const palette = document.getElementById('command-palette')!;
const paletteInput = document.getElementById('palette-input') as HTMLInputElement;
const paletteResults = document.getElementById('palette-results')!;
const paletteToggle = document.getElementById('palette-toggle')!;

const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const fontSize = 14;
let columns = 0;
let drops: number[] = [];

// --- Command Palette Data ---
const commands = [
    { name: 'INITIALIZE CONTACT', action: () => window.location.href = 'mailto:abdel@codefolio.dev', icon: '✉️' },
    { name: 'SWITCH THEME', action: () => rotateTheme(), icon: '🌓' },
    { name: 'TOGGLE SOURCE CODE', action: () => {
            document.querySelectorAll('.grid-card').forEach(c => c.classList.toggle('is-flipped'));
            showToast('Source Code Toggled');
        }, icon: '💻' },
    { name: 'GITHUB REPOSITORY', action: () => window.open('#', '_blank'), icon: '📂' },
];

// --- Core Functions ---
const showToast = (message: string) => {
    toastContainer.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'mono text-[10px] uppercase tracking-widest px-4 py-2 bg-slate-900/90 dark:bg-white/90 text-white dark:text-black border border-white/10 rounded-sm shadow-2xl animate-toast';
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
};

const setTheme = (theme: 'light' | 'dark' | 'system') => {
    const html = document.documentElement;
    localStorage.setItem('theme', theme);
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    showToast(`Mode: ${theme}`);
};

const rotateTheme = () => {
    const current = localStorage.getItem('theme') || 'system';
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const next = themes[(themes.indexOf(current as any) + 1) % themes.length];
    setTheme(next);
};

const togglePalette = (show: boolean) => {
    palette.classList.toggle('hidden', !show);
    document.body.style.overflow = show ? 'hidden' : ''; // UX Polish
    if (show) {
        paletteInput.value = '';
        paletteInput.focus();
        renderPalette('');
    }
};

const renderPalette = (query: string) => {
    const filtered = commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
    paletteResults.innerHTML = filtered.map((c, i) => `
        <div class="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mono text-[10px] text-slate-600 dark:text-slate-300 border-l-2 border-transparent hover:border-sky-500" onclick="window.paletteExec(${i})">
            <span class="text-base">${c.icon}</span> ${c.name}
        </div>
    `).join('');
    (window as any).currentFiltered = filtered;
};

(window as any).paletteExec = (idx: number) => {
    (window as any).currentFiltered[idx].action();
    togglePalette(false);
};

// --- System Metrics ---
const updateStats = () => {
    const timeOptions: any = { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    document.getElementById('local-time')!.innerText = new Intl.DateTimeFormat('en-GB', timeOptions).format(new Date());

    const start = Date.now();
    fetch('/favicon.ico', { mode: 'no-cors' }).then(() => {
        const delta = Date.now() - start;
        const el = document.getElementById('latency')!;
        el.innerText = `${delta}ms`;
        el.className = delta < 100 ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold';
    }).catch(() => {});
};

// --- Animation ---
const resize = () => {
    matrixCanvas.width = glowCanvas.width = window.innerWidth;
    matrixCanvas.height = glowCanvas.height = window.innerHeight;
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = new Array(columns).fill(1);
};

const draw = () => {
    const isDark = document.documentElement.classList.contains('dark');
    mctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    mctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
    mctx.font = `${fontSize}px monospace`;
    drops.forEach((y, i) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        mctx.fillText(text, i * fontSize, y * fontSize);
        if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
};

let mouse: MousePosition = { x: -1000, y: -1000 };
window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

const drawGlow = () => {
    gctx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
    const g = gctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 400);
    g.addColorStop(0, document.documentElement.classList.contains('dark') ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.08)');
    g.addColorStop(1, 'transparent');
    gctx.fillStyle = g;
    gctx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
};

// --- Init & Handlers ---
window.addEventListener('resize', resize);
resize();
setInterval(draw, 33);
setInterval(updateStats, 1000);
updateStats();

const tick = () => { drawGlow(); requestAnimationFrame(tick); };
tick();

document.getElementById('btn-light')?.addEventListener('click', () => setTheme('light'));
document.getElementById('btn-dark')?.addEventListener('click', () => setTheme('dark'));
document.getElementById('btn-system')?.addEventListener('click', () => setTheme('system'));
paletteToggle.addEventListener('click', () => togglePalette(true));
paletteInput.addEventListener('input', (e) => renderPalette((e.target as HTMLInputElement).value));

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't' && palette.classList.contains('hidden')) rotateTheme();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePalette(palette.classList.contains('hidden'));
    }
    if (e.key === 'Escape') togglePalette(false);
});