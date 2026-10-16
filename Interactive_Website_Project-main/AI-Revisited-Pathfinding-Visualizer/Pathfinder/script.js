/* =========================================================
   Pathfinding Visualizer – board, drawing and animation
   ========================================================= */
const POTHOLE_COST = 5;

const boardEl = document.getElementById("board");
const algorithmSelect = document.getElementById("algorithm");
const speedSelect = document.getElementById("speed");
const runBtn = document.getElementById("run");
const explainEl = document.getElementById("explain");
const buttonsToLock = document.querySelectorAll(".controls button, .controls select, .tool, #compare");

let rows, cols, cells = [];
let walls, weights;
let start, end;
let tool = "wall";
let isDrawing = false;
let dragging = null; // "start" | "end" | null
let animating = false;
let hasResult = false;

// ---------- Board setup ----------
function sizeBoard() {
    const width = Math.min(window.innerWidth - 32, 1100);
    const cell = window.innerWidth < 600 ? 18 : 24;
    cols = Math.max(15, Math.floor(width / cell)) | 1; // odd numbers make nicer mazes
    rows = Math.max(11, Math.floor((window.innerHeight * 0.55) / cell)) | 1;
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

function resetBoard() {
    sizeBoard();
    walls = new Uint8Array(rows * cols);
    weights = new Uint8Array(rows * cols).fill(1);
    const midRow = Math.floor(rows / 2);
    start = midRow * cols + Math.floor(cols / 5);
    end = midRow * cols + Math.floor((cols * 4) / 5);

    boardEl.innerHTML = "";
    cells = [];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < rows * cols; i++) {
        const div = document.createElement("div");
        div.className = "cell";
        div.dataset.i = i;
        frag.appendChild(div);
        cells.push(div);
    }
    boardEl.appendChild(frag);
    paintAll();
    clearStats();
}

function paintCell(i) {
    const el = cells[i];
    el.classList.toggle("wall", !!walls[i]);
    el.classList.toggle("pothole", !walls[i] && weights[i] > 1);
    el.classList.toggle("start", i === start);
    el.classList.toggle("end", i === end);
}

function paintAll() {
    for (let i = 0; i < cells.length; i++) paintCell(i);
}

function clearPath() {
    cells.forEach((c) => c.classList.remove("visited", "path"));
    hasResult = false;
    clearStats();
}

function clearStats() {
    ["visited", "length", "cost", "time"].forEach((k) => (document.getElementById(`stat-${k}`).textContent = "–"));
}

// ---------- Drawing with mouse / touch (pointer events) ----------
function cellFromEvent(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    return el && el.classList.contains("cell") ? Number(el.dataset.i) : null;
}

function applyTool(i) {
    if (i === null || i === start || i === end) return;
    if (tool === "wall") { walls[i] = 1; weights[i] = 1; }
    if (tool === "pothole") { walls[i] = 0; weights[i] = POTHOLE_COST; }
    if (tool === "erase") { walls[i] = 0; weights[i] = 1; }
    paintCell(i);
}

boardEl.addEventListener("pointerdown", (e) => {
    if (animating) return;
    const i = cellFromEvent(e);
    if (i === null) return;
    e.preventDefault();
    boardEl.setPointerCapture(e.pointerId);
    if (hasResult) clearPath();
    if (i === start) dragging = "start";
    else if (i === end) dragging = "end";
    else {
        isDrawing = true;
        applyTool(i);
    }
});

boardEl.addEventListener("pointermove", (e) => {
    if (!isDrawing && !dragging) return;
    const i = cellFromEvent(e);
    if (i === null) return;
    if (dragging) {
        if (walls[i] || i === start || i === end) return;
        const old = dragging === "start" ? start : end;
        if (dragging === "start") start = i; else end = i;
        paintCell(old);
        paintCell(i);
    } else {
        applyTool(i);
    }
});

window.addEventListener("pointerup", () => {
    isDrawing = false;
    dragging = null;
});

document.querySelectorAll(".tool").forEach((btn) =>
    btn.addEventListener("click", () => {
        tool = btn.dataset.tool;
        document.querySelectorAll(".tool").forEach((b) => b.classList.toggle("active", b === btn));
    })
);

// ---------- Maze generator (randomised depth-first "recursive backtracker") ----------
function generateMaze() {
    clearPath();
    walls.fill(1);
    weights.fill(1);
    const inBounds = (r, c) => r > 0 && c > 0 && r < rows - 1 && c < cols - 1;
    const stack = [[1, 1]];
    walls[cols + 1] = 0;
    while (stack.length) {
        const [r, c] = stack[stack.length - 1];
        const options = [[-2, 0], [2, 0], [0, -2], [0, 2]]
            .map(([dr, dc]) => [r + dr, c + dc, r + dr / 2, c + dc / 2])
            .filter(([nr, nc]) => inBounds(nr, nc) && walls[nr * cols + nc]);
        if (!options.length) { stack.pop(); continue; }
        const [nr, nc, wr, wc] = options[Math.floor(Math.random() * options.length)];
        walls[wr * cols + wc] = 0;
        walls[nr * cols + nc] = 0;
        stack.push([nr, nc]);
    }
    // knock out some extra walls so there is more than one route,
    // and sprinkle potholes so Dijkstra / A* have something to think about
    for (let i = 0; i < walls.length; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        if (!inBounds(r, c)) continue;
        if (walls[i] && Math.random() < 0.08) walls[i] = 0;
        else if (!walls[i] && Math.random() < 0.06) weights[i] = POTHOLE_COST;
    }
    // keep start/end on open cells near their corners
    start = cols + 1;
    end = (rows - 2) * cols + (cols - 2);
    walls[start] = walls[end] = 0;
    weights[start] = weights[end] = 1;
    paintAll();
}

// ---------- Running + animation ----------
function gridSnapshot() {
    return { rows, cols, walls, weights, start, end };
}

function setLocked(locked) {
    animating = locked;
    buttonsToLock.forEach((b) => (b.disabled = locked));
    runBtn.disabled = false;
    runBtn.textContent = locked ? "■ Stop" : "▶ Find path";
}

let stopRequested = false;

async function run() {
    if (animating) { stopRequested = true; return; }
    clearPath();
    const algo = ALGORITHMS[algorithmSelect.value];
    const t0 = performance.now();
    const result = algo.run(gridSnapshot());
    const ms = performance.now() - t0;

    setLocked(true);
    stopRequested = false;
    const perFrame = Number(speedSelect.value);

    // animate explored cells
    for (let i = 0; i < result.visitedOrder.length; i += perFrame) {
        if (stopRequested) break;
        for (const cell of result.visitedOrder.slice(i, i + perFrame)) {
            if (cell !== start && cell !== end) cells[cell].classList.add("visited");
        }
        await nextFrame();
    }
    if (stopRequested) result.visitedOrder.forEach((c) => c !== start && c !== end && cells[c].classList.add("visited"));

    // animate the final path
    for (const cell of result.path) {
        if (cell !== start && cell !== end) cells[cell].classList.add("path");
        if (!stopRequested && perFrame < 1000) await wait(18);
    }

    document.getElementById("stat-visited").textContent = result.visitedOrder.length;
    document.getElementById("stat-length").textContent = result.path.length ? result.path.length - 1 : "No path";
    document.getElementById("stat-cost").textContent = result.path.length ? result.cost : "–";
    document.getElementById("stat-time").textContent = `${ms.toFixed(2)} ms`;
    hasResult = true;
    setLocked(false);
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Compare all algorithms on the current board ----------
function compareAll() {
    const grid = gridSnapshot();
    const results = Object.entries(ALGORITHMS).map(([key, a]) => ({ key, name: a.name, ...a.run(grid) }));
    const found = results.filter((r) => r.path.length);
    const best = found.length ? Math.min(...found.map((r) => r.cost)) : null;

    const tbody = document.querySelector("#compare-table tbody");
    tbody.innerHTML = "";
    results.forEach((r) => {
        const tr = document.createElement("tr");
        const shortest = !r.path.length ? "No path" : r.cost === best ? "✅ Yes" : "❌ No";
        [r.name, r.visitedOrder.length, r.path.length ? r.cost : "–", shortest].forEach((v) => {
            const td = document.createElement("td");
            td.textContent = v;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    document.getElementById("compare-table").hidden = false;
}

// ---------- Events ----------
function updateExplain() {
    explainEl.textContent = ALGORITHMS[algorithmSelect.value].about;
}

runBtn.addEventListener("click", run);
document.getElementById("maze").addEventListener("click", generateMaze);
document.getElementById("clear-path").addEventListener("click", clearPath);
document.getElementById("reset").addEventListener("click", resetBoard);
document.getElementById("compare").addEventListener("click", compareAll);
algorithmSelect.addEventListener("change", updateExplain);

let resizeTimer;
let lastWidth = window.innerWidth;
window.addEventListener("resize", () => {
    // only rebuild when the width really changes (mobile browsers fire resize on scroll)
    if (animating || Math.abs(window.innerWidth - lastWidth) < 60) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resetBoard, 250);
});

resetBoard();
updateExplain();
