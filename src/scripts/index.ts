interface MousePosition {
    x: number;
    y: number;
}

// Matrix Setup
const matrixCanvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
const mctx = matrixCanvas.getContext('2d')!;

// Glow Setup
const glowCanvas = document.getElementById('glow-canvas') as HTMLCanvasElement;
const gctx = glowCanvas.getContext('2d')!;

const resize = (): void => {
    matrixCanvas.width = glowCanvas.width = window.innerWidth;
    matrixCanvas.height = glowCanvas.height = window.innerHeight;
    // Recalculate columns on resize
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = new Array(columns).fill(1);
};

window.addEventListener('resize', resize);

const chars: string = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const fontSize: number = 14;
let columns: number = 0;
let drops: number[] = [];

// Initialize
resize();

let lastTime = 0;
const fps = 30; // Matrix looks better at slightly lower FPS for trails
const nextFrame = 1000 / fps;
let timer = 0;

const drawMatrix = (): void => {
    // This creates the "fading trail" effect.
    // If you use a solid color, the rain won't have tails.
    mctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    mctx.fillStyle = '#1e293b'; // Dim slate color
    mctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        mctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
};

let mouse: MousePosition = { x: -1000, y: -1000 };
window.addEventListener('mousemove', (e: MouseEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

const drawGlow = (): void => {
    // We clear the glow canvas COMPLETELY so the "circle" doesn't smear
    gctx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);

    const gradient = gctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 400);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.15)'); // Increased opacity for "Innovation"
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    gctx.fillStyle = gradient;
    gctx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
};

const animate = (timeStamp: number): void => {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    // 1. Smooth 60fps Glow
    drawGlow();

    // 2. Controlled Matrix speed (prevents "start/stop" flickering)
    if (timer > nextFrame) {
        drawMatrix();
        timer = 0;
    } else {
        timer += deltaTime;
    }

    requestAnimationFrame(animate);
};

requestAnimationFrame(animate);