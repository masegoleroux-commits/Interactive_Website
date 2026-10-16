/* =========================================================
   Pixel Art Studio
   The drawing is stored as an array of colours (one per pixel).
   The <canvas> is just a view of that array, which makes
   undo/redo, saving and exporting simple.
   ========================================================= */

const PALETTE = [
    "#000000", "#ffffff", "#007a4d", "#ffb612", "#de3831", "#002395", // SA flag colours
    "#5c3a21", "#c68642", "#f1c27d", "#ffdbac",                       // skin & earth tones
    "#ff7a45", "#ffd23f", "#8ee36d", "#3fd2c7", "#5fa8ff", "#c9a7ff",
    "#ff5c8a", "#7a7a7a", "#bdbdbd", "#2b2b2b",
];
const MAX_HISTORY = 100;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const octx = overlay.getContext("2d");
const preview = document.getElementById("preview");
const pctx = preview.getContext("2d");
const colorInput = document.getElementById("color");
const colorHex = document.getElementById("color-hex");
const sizeSelect = document.getElementById("size");
const mirrorInput = document.getElementById("mirror");
const gridInput = document.getElementById("show-grid");
const coordsEl = document.getElementById("coords");
const toastEl = document.getElementById("toast");

let size = 32;
let pixels = [];           // null = transparent, otherwise "#rrggbb"
let tool = "pencil";
let color = colorInput.value;
let recent = [];
let undoStack = [];
let redoStack = [];
let drawing = false;
let shapeStart = null;
let lastCell = null;

// =========================================================
// Rendering
// =========================================================
function cellSize() {
    return canvas.width / size;
}

function render() {
    const s = cellSize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // checkerboard shows which pixels are transparent
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const c = pixels[y * size + x];
            ctx.fillStyle = c || ((x + y) % 2 ? "#2a2a36" : "#23232e");
            ctx.fillRect(x * s, y * s, s, s);
        }
    }

    if (gridInput.checked) {
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < size; i++) {
            ctx.moveTo(i * s + 0.5, 0); ctx.lineTo(i * s + 0.5, canvas.height);
            ctx.moveTo(0, i * s + 0.5); ctx.lineTo(canvas.width, i * s + 0.5);
        }
        ctx.stroke();
    }

    if (mirrorInput.checked) {
        ctx.strokeStyle = "rgba(255, 182, 18, 0.6)";
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    renderPreview();
}

function renderPreview() {
    preview.width = size * 2;
    preview.height = size * 2;
    pctx.clearRect(0, 0, preview.width, preview.height);
    pixels.forEach((c, i) => {
        if (!c) return;
        pctx.fillStyle = c;
        pctx.fillRect((i % size) * 2, Math.floor(i / size) * 2, 2, 2);
    });
}

// Ghost preview for line / rectangle while dragging
function renderOverlay(cellsToShow = []) {
    const s = cellSize();
    octx.clearRect(0, 0, overlay.width, overlay.height);
    octx.fillStyle = tool === "eraser" ? "rgba(255,255,255,0.3)" : color;
    octx.globalAlpha = 0.75;
    cellsToShow.forEach(([x, y]) => octx.fillRect(x * s, y * s, s, s));
    octx.globalAlpha = 1;
}

// =========================================================
// History (undo / redo)
// =========================================================
function snapshot() {
    undoStack.push(pixels.slice());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
}

function undo() {
    if (!undoStack.length) return;
    redoStack.push(pixels.slice());
    pixels = undoStack.pop();
    render(); save(); updateHistoryButtons();
}

function redo() {
    if (!redoStack.length) return;
    undoStack.push(pixels.slice());
    pixels = redoStack.pop();
    render(); save(); updateHistoryButtons();
}

function updateHistoryButtons() {
    document.getElementById("undo").disabled = !undoStack.length;
    document.getElementById("redo").disabled = !redoStack.length;
}

// =========================================================
// Drawing helpers
// =========================================================
function setPixel(x, y, value) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    pixels[y * size + x] = value;
    if (mirrorInput.checked) pixels[y * size + (size - 1 - x)] = value;
}

// Bresenham's line algorithm: every pixel between two points
function lineCells(x0, y0, x1, y1) {
    const out = [];
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
        out.push([x0, y0]);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return out;
}

function rectCells(x0, y0, x1, y1) {
    const out = [];
    const [minX, maxX] = [Math.min(x0, x1), Math.max(x0, x1)];
    const [minY, maxY] = [Math.min(y0, y1), Math.max(y0, y1)];
    for (let x = minX; x <= maxX; x++) { out.push([x, minY]); out.push([x, maxY]); }
    for (let y = minY; y <= maxY; y++) { out.push([minX, y]); out.push([maxX, y]); }
    return out;
}

// Flood fill using a stack (no recursion, so big areas don't crash the browser)
function floodFill(x, y, newColor) {
    const target = pixels[y * size + x];
    if (target === newColor) return;
    const stack = [[x, y]];
    while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= size || cy >= size) continue;
        if (pixels[cy * size + cx] !== target) continue;
        pixels[cy * size + cx] = newColor;
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
}

function paintValue() {
    return tool === "eraser" ? null : color;
}

// =========================================================
// Pointer input (works with mouse, pen and touch)
// =========================================================
function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * size);
    return [Math.min(size - 1, Math.max(0, x)), Math.min(size - 1, Math.max(0, y))];
}

overlay.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    overlay.setPointerCapture(e.pointerId);
    const [x, y] = cellFromEvent(e);

    if (tool === "picker") {
        const picked = pixels[y * size + x];
        if (picked) setColor(picked);
        return;
    }

    snapshot();
    if (tool === "fill") {
        floodFill(x, y, color);
        if (mirrorInput.checked) floodFill(size - 1 - x, y, color);
        useColor();
        render(); save();
        return;
    }

    drawing = true;
    if (tool === "line" || tool === "rect") {
        shapeStart = [x, y];
        renderOverlay([[x, y]]);
    } else {
        setPixel(x, y, paintValue());
        lastCell = [x, y];
        render();
    }
});

overlay.addEventListener("pointermove", (e) => {
    const [x, y] = cellFromEvent(e);
    coordsEl.textContent = `x: ${x} y: ${y}`;
    if (!drawing) return;

    if (shapeStart) {
        const fn = tool === "line" ? lineCells : rectCells;
        renderOverlay(fn(shapeStart[0], shapeStart[1], x, y));
        return;
    }
    // draw a line from the last point so fast strokes don't leave gaps
    lineCells(lastCell[0], lastCell[1], x, y).forEach(([lx, ly]) => setPixel(lx, ly, paintValue()));
    lastCell = [x, y];
    render();
});

overlay.addEventListener("pointerup", (e) => {
    if (!drawing) return;
    drawing = false;
    if (shapeStart) {
        const [x, y] = cellFromEvent(e);
        const fn = tool === "line" ? lineCells : rectCells;
        fn(shapeStart[0], shapeStart[1], x, y).forEach(([px, py]) => setPixel(px, py, paintValue()));
        shapeStart = null;
        renderOverlay();
        render();
    }
    if (tool !== "eraser") useColor();
    save();
});

overlay.addEventListener("pointerleave", () => (coordsEl.textContent = "x: – y: –"));

// =========================================================
// Colours
// =========================================================
function setColor(value) {
    color = value.toLowerCase();
    colorInput.value = color;
    colorHex.textContent = color.toUpperCase();
    document.querySelectorAll(".swatch").forEach((s) => s.classList.toggle("active", s.dataset.color === color));
    if (tool === "eraser" || tool === "picker") selectTool("pencil");
}

function useColor() {
    recent = [color, ...recent.filter((c) => c !== color)].slice(0, 8);
    renderSwatches(document.getElementById("recent"), recent);
}

function renderSwatches(container, colors) {
    container.innerHTML = "";
    colors.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "swatch";
        b.dataset.color = c;
        b.style.background = c;
        b.title = c.toUpperCase();
        b.setAttribute("aria-label", `Colour ${c}`);
        b.classList.toggle("active", c === color);
        b.addEventListener("click", () => setColor(c));
        container.appendChild(b);
    });
}

// =========================================================
// Tools, size, export, saving
// =========================================================
function selectTool(name) {
    tool = name;
    document.querySelectorAll(".tool").forEach((b) => b.classList.toggle("active", b.dataset.tool === name));
    overlay.style.cursor = name === "picker" ? "copy" : name === "fill" ? "cell" : "crosshair";
}

function newCanvas(newSize, keepHistory = false) {
    size = newSize;
    pixels = new Array(size * size).fill(null);
    if (!keepHistory) { undoStack = []; redoStack = []; updateHistoryButtons(); }
    render();
}

function download() {
    const scale = Number(document.getElementById("scale").value);
    const out = document.createElement("canvas");
    out.width = out.height = size * scale;
    const o = out.getContext("2d");
    pixels.forEach((c, i) => {
        if (!c) return;
        o.fillStyle = c;
        o.fillRect((i % size) * scale, Math.floor(i / size) * scale, scale, scale);
    });
    const link = document.createElement("a");
    link.download = `pixel-art-${size}x${size}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
    showToast("PNG downloaded 🎉");
}

function save() {
    try {
        localStorage.setItem("pixel-studio", JSON.stringify({ size, pixels, recent }));
    } catch { /* ignore */ }
}

function load() {
    try {
        const data = JSON.parse(localStorage.getItem("pixel-studio"));
        if (data && data.pixels && data.pixels.length === data.size * data.size) return data;
    } catch { /* ignore */ }
    return null;
}

function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toastEl.classList.remove("show"), 2000);
}

// A small starter sprite so the canvas isn't empty on first visit
function drawStarterSprite() {
    const art = [
        "......GGGG......",
        ".....GYYYYG.....",
        "....GYYYYYYG....",
        "....GYKYYKYG....",
        "....GYYYYYYG....",
        "....GYRRRRYG....",
        ".....GYYYYG.....",
        "......GGGG......",
        ".....BBBBBB.....",
        "....BBWBBWBB....",
        "....BBBBBBBB....",
        ".....BB..BB.....",
    ];
    const map = { G: "#007a4d", Y: "#ffb612", K: "#000000", R: "#de3831", B: "#002395", W: "#ffffff" };
    const ox = Math.floor((size - 16) / 2), oy = Math.floor((size - art.length) / 2);
    art.forEach((row, y) => [...row].forEach((ch, x) => {
        if (map[ch]) pixels[(y + oy) * size + (x + ox)] = map[ch];
    }));
}

// ---------- Events ----------
document.querySelectorAll(".tool").forEach((b) => b.addEventListener("click", () => selectTool(b.dataset.tool)));
colorInput.addEventListener("input", () => setColor(colorInput.value));
gridInput.addEventListener("change", render);
mirrorInput.addEventListener("change", render);
document.getElementById("undo").addEventListener("click", undo);
document.getElementById("redo").addEventListener("click", redo);
document.getElementById("download").addEventListener("click", download);

document.getElementById("clear").addEventListener("click", () => {
    snapshot();
    pixels.fill(null);
    render(); save();
    showToast("Canvas cleared. Undo brings it back.");
});

sizeSelect.addEventListener("change", () => {
    const hasArt = pixels.some(Boolean);
    if (hasArt && !confirmSizeChange()) {
        sizeSelect.value = size;
        return;
    }
    newCanvas(Number(sizeSelect.value));
    save();
});

// two-click confirmation instead of a blocking confirm() pop-up
function confirmSizeChange() {
    if (sizeSelect.dataset.armed === sizeSelect.value) {
        delete sizeSelect.dataset.armed;
        return true;
    }
    sizeSelect.dataset.armed = sizeSelect.value;
    showToast("Changing size clears the canvas. Pick it again to confirm.");
    return false;
}

document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === "y") { e.preventDefault(); redo(); return; }
    const shortcuts = { b: "pencil", e: "eraser", g: "fill", i: "picker", l: "line", r: "rect" };
    if (shortcuts[k]) selectTool(shortcuts[k]);
    if (k === "m") { mirrorInput.checked = !mirrorInput.checked; render(); }
});

// ---------- Start ----------
renderSwatches(document.getElementById("palette"), PALETTE);
const saved = load();
if (saved) {
    sizeSelect.value = saved.size;
    size = saved.size;
    pixels = saved.pixels;
    recent = saved.recent || [];
    render();
} else {
    newCanvas(32);
    drawStarterSprite();
    render();
}
renderSwatches(document.getElementById("recent"), recent);
setColor(colorInput.value);
updateHistoryButtons();
