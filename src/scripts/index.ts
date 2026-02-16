interface MousePosition { x: number; y: number; }

// Elements
const matrixCanvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
const mctx = matrixCanvas.getContext('2d')!;
const glowCanvas = document.getElementById('glow-canvas') as HTMLCanvasElement;
const gctx = glowCanvas.getContext('2d')!;
const toastContainer = document.getElementById('toast-container')!;

const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const fontSize = 14;
let columns = 0;
let drops: number[] = [];

// --- Theme & Toast Logic ---
const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];

const showToast = (message: string) => {
    // Clear previous toasts
    toastContainer.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'mono text-[10px] uppercase tracking-widest px-4 py-2 bg-slate-900/90 dark:bg-white/90 text-white dark:text-black border border-white/10 rounded-sm shadow-2xl animate-toast';
    toast.innerText = message;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
};

const setTheme = (theme: 'light' | 'dark' | 'system', silent = false) => {
    const html = document.documentElement;
    localStorage.setItem('theme', theme);

    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    if (!silent) showToast(`Theme Mode: ${theme}`);
};

const rotateTheme = () => {
    const current = localStorage.getItem('theme') || 'system';
    const nextIndex = (themes.indexOf(current as any) + 1) % themes.length;
    setTheme(themes[nextIndex]);
};

// Listeners
document.getElementById('btn-light')?.addEventListener('click', () => setTheme('light'));
document.getElementById('btn-dark')?.addEventListener('click', () => setTheme('dark'));
document.getElementById('btn-system')?.addEventListener('click', () => setTheme('system'));

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't') rotateTheme();
});

// --- Canvas & Animation Logic ---
const resize = () => {
    matrixCanvas.width = glowCanvas.width = window.innerWidth;
    matrixCanvas.height = glowCanvas.height = window.innerHeight;
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = new Array(columns).fill(1);
};

window.addEventListener('resize', resize);
resize();

let lastTime = 0;
const fps = 30;
const nextFrame = 1000 / fps;
let timer = 0;

const drawMatrix = () => {
    const isDark = document.documentElement.classList.contains('dark');
    mctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    mctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
    mctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        mctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    }
};

let mouse: MousePosition = { x: -1000, y: -1000 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

const drawGlow = () => {
    gctx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
    const isDark = document.documentElement.classList.contains('dark');
    const gradient = gctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 400);
    const opacity = isDark ? '0.15' : '0.1';
    gradient.addColorStop(0, `rgba(56, 189, 248, ${opacity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    gctx.fillStyle = gradient;
    gctx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
};

const animate = (timeStamp: number) => {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    drawGlow();
    if (timer > nextFrame) {
        drawMatrix();
        timer = 0;
    } else {
        timer += deltaTime;
    }
    requestAnimationFrame(animate);
};
requestAnimationFrame(animate);