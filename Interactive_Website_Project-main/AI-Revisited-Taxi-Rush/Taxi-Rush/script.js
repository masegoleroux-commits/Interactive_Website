/* =========================================================
   Taxi Rush – a canvas game
   - Game loop with requestAnimationFrame and delta time
   - Simple object pooling / spawning and box collisions
   - All graphics are drawn with canvas shapes (no images)
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const LANES = 3;
const ROAD_X = 50;
const ROAD_W = W - ROAD_X * 2;
const LANE_W = ROAD_W / LANES;
const laneCenter = (lane) => ROAD_X + LANE_W * lane + LANE_W / 2;

const PLAYER_Y = H - 140;
const FARE = 15; // rand per passenger (on the road a fare goes up over time 😉)

// ---------- Elements ----------
const hudScore = document.getElementById("hud-score");
const hudDistance = document.getElementById("hud-distance");
const hudLives = document.getElementById("hud-lives");
const startScreen = document.getElementById("start-screen");
const overScreen = document.getElementById("over-screen");
const pauseScreen = document.getElementById("pause-screen");
const bestEl = document.getElementById("best");

// ---------- Game state ----------
let state = "menu"; // menu | playing | paused | over
let player, obstacles, particles, popups;
let speed, distance, score, lives, spawnTimer, roadOffset, invincible, shake, lastTime;
let best = loadBest();

function resetGame() {
    player = { lane: 1, x: laneCenter(1), y: PLAYER_Y, w: 46, h: 86, tilt: 0 };
    obstacles = [];
    particles = [];
    popups = [];
    speed = 260;       // pixels per second
    distance = 0;
    score = 0;
    lives = 3;
    spawnTimer = 0.6;
    roadOffset = 0;
    invincible = 0;
    shake = 0;
    updateHud();
}

// =========================================================
// Spawning
// =========================================================
const TYPES = {
    pothole:   { w: 50, h: 34, bad: true,  weight: 4 },
    cone:      { w: 26, h: 34, bad: true,  weight: 2 },
    car:       { w: 46, h: 78, bad: true,  weight: 3, moves: true },
    passenger: { w: 30, h: 40, bad: false, weight: 3 },
    bonus:     { w: 30, h: 30, bad: false, weight: 0.4 }, // extra life
};

function pickType() {
    const entries = Object.entries(TYPES).filter(([k]) => k !== "bonus" || lives < 3);
    const total = entries.reduce((s, [, t]) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const [key, t] of entries) {
        if ((r -= t.weight) <= 0) return key;
    }
    return "pothole";
}

function spawnRow() {
    // Never block all three lanes: leave at least one lane free of hazards
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    const count = Math.random() < Math.min(0.15 + distance / 20000, 0.55) ? 2 : 1;
    for (let i = 0; i < count; i++) {
        const type = pickType();
        const t = TYPES[type];
        obstacles.push({
            type,
            lane: lanes[i],
            x: laneCenter(lanes[i]),
            y: -t.h,
            w: t.w,
            h: t.h,
            bad: t.bad,
            // other cars drive a bit slower than you, so you catch up to them
            ownSpeed: t.moves ? 80 + Math.random() * 60 : 0,
            color: ["#e53935", "#1e88e5", "#43a047", "#8e24aa", "#fb8c00"][Math.floor(Math.random() * 5)],
            hit: false,
        });
    }
}

// =========================================================
// Update
// =========================================================
function update(dt) {
    speed = Math.min(620, speed + dt * 6);           // slowly gets faster
    distance += speed * dt;
    roadOffset = (roadOffset + speed * dt) % 80;

    // smooth lane change
    const targetX = laneCenter(player.lane);
    const dx = targetX - player.x;
    player.x += dx * Math.min(1, dt * 14);
    player.tilt = dx * 0.004;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnRow();
        spawnTimer = Math.max(0.42, 1.1 - distance / 25000) * (0.8 + Math.random() * 0.4);
    }

    for (const o of obstacles) {
        o.y += (speed - o.ownSpeed) * dt;
        if (!o.hit && collides(player, o)) handleHit(o);
    }
    obstacles = obstacles.filter((o) => o.y < H + 100 && !(o.hit && !o.bad));

    particles.forEach((p) => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt;
    });
    particles = particles.filter((p) => p.life > 0);

    popups.forEach((p) => { p.y -= 60 * dt; p.life -= dt; });
    popups = popups.filter((p) => p.life > 0);

    if (invincible > 0) invincible -= dt;
    if (shake > 0) shake -= dt;

    updateHud();
}

function collides(a, b) {
    // slightly smaller hit boxes feel fairer
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 8 &&
           Math.abs(a.y - b.y) < (a.h + b.h) / 2 - 10;
}

function handleHit(o) {
    o.hit = true;
    if (o.type === "passenger") {
        score += FARE;
        popups.push({ x: o.x, y: o.y, text: `+R${FARE}`, color: "#ffd23f", life: 0.9 });
        burst(o.x, o.y, "#ffd23f", 10);
        return;
    }
    if (o.type === "bonus") {
        lives = Math.min(3, lives + 1);
        popups.push({ x: o.x, y: o.y, text: "+❤", color: "#ff5c8a", life: 0.9 });
        burst(o.x, o.y, "#ff5c8a", 10);
        return;
    }
    if (invincible > 0) return;
    lives--;
    invincible = 1.5;
    shake = 0.35;
    burst(player.x, player.y - 30, "#999", 18);
    if (navigator.vibrate) navigator.vibrate(120);
    if (lives <= 0) gameOver();
}

function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
        particles.push({
            x, y, color,
            vx: (Math.random() - 0.5) * 300,
            vy: -Math.random() * 300,
            life: 0.5 + Math.random() * 0.4,
        });
    }
}

// =========================================================
// Drawing
// =========================================================
function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);

    drawScenery();
    drawRoad();
    obstacles.forEach(drawObstacle);
    drawTaxi(player.x, player.y, player.tilt, invincible > 0 && Math.floor(invincible * 10) % 2 === 0);

    particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    });
    ctx.globalAlpha = 1;

    popups.forEach((p) => {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.font = "bold 22px Bungee, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawScenery() {
    // dusty verges on both sides
    ctx.fillStyle = "#c9a26b";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#b48a55";
    for (let y = -80 + (roadOffset * 1.0) % 80; y < H; y += 80) {
        ctx.fillRect(10, y, 18, 8);
        ctx.fillRect(W - 30, y + 40, 14, 6);
    }
    // little shrubs
    ctx.fillStyle = "#6b8e23";
    for (let y = -160 + (roadOffset * 2) % 160; y < H; y += 160) {
        circle(22, y + 20, 10);
        circle(W - 20, y + 100, 12);
    }
}

function drawRoad() {
    ctx.fillStyle = "#3b3b3f";
    ctx.fillRect(ROAD_X, 0, ROAD_W, H);
    // yellow edge lines
    ctx.fillStyle = "#f2c94c";
    ctx.fillRect(ROAD_X + 4, 0, 4, H);
    ctx.fillRect(ROAD_X + ROAD_W - 8, 0, 4, H);
    // dashed lane lines
    ctx.fillStyle = "#e8e8e8";
    for (let lane = 1; lane < LANES; lane++) {
        const x = ROAD_X + LANE_W * lane - 2;
        for (let y = -80 + roadOffset; y < H; y += 80) ctx.fillRect(x, y, 4, 40);
    }
}

function drawTaxi(x, y, tilt, blink) {
    if (blink) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    const w = player.w, h = player.h;
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    roundRect(-w / 2 + 4, -h / 2 + 6, w, h, 8);
    // body: classic white minibus with a stripe
    ctx.fillStyle = "#f5f5f5";
    roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fillStyle = "#e53935";
    ctx.fillRect(-w / 2, -6, w, 8);
    ctx.fillStyle = "#1e88e5";
    ctx.fillRect(-w / 2, 2, w, 4);
    // windscreen + side windows
    ctx.fillStyle = "#263238";
    roundRect(-w / 2 + 5, -h / 2 + 8, w - 10, 14, 3);
    for (let i = 0; i < 3; i++) ctx.fillRect(-w / 2 + 3, -h / 2 + 28 + i * 16, 4, 10);
    for (let i = 0; i < 3; i++) ctx.fillRect(w / 2 - 7, -h / 2 + 28 + i * 16, 4, 10);
    // roof rack
    ctx.fillStyle = "#9e9e9e";
    ctx.fillRect(-w / 2 + 8, 12, w - 16, 3);
    ctx.fillRect(-w / 2 + 8, 22, w - 16, 3);
    // lights
    ctx.fillStyle = "#fff59d";
    ctx.fillRect(-w / 2 + 4, -h / 2, 8, 4);
    ctx.fillRect(w / 2 - 12, -h / 2, 8, 4);
    ctx.fillStyle = "#ef5350";
    ctx.fillRect(-w / 2 + 4, h / 2 - 4, 8, 4);
    ctx.fillRect(w / 2 - 12, h / 2 - 4, 8, 4);
    ctx.restore();
}

function drawObstacle(o) {
    const { x, y, w, h } = o;
    switch (o.type) {
        case "pothole":
            ctx.fillStyle = "#1f1f22";
            ellipse(x, y, w / 2, h / 2);
            ctx.fillStyle = "#2b2b30";
            ellipse(x - 4, y - 3, w / 3, h / 3.2);
            ctx.strokeStyle = "#555";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - w / 2 - 4, y); ctx.lineTo(x - w / 2 + 6, y + 4);
            ctx.moveTo(x + w / 2 + 3, y - 3); ctx.lineTo(x + w / 2 - 6, y + 2);
            ctx.stroke();
            break;
        case "cone":
            ctx.fillStyle = "#ff6d00";
            ctx.beginPath();
            ctx.moveTo(x, y - h / 2);
            ctx.lineTo(x + w / 2, y + h / 2 - 4);
            ctx.lineTo(x - w / 2, y + h / 2 - 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.fillRect(x - w / 4, y - 2, w / 2, 5);
            ctx.fillStyle = "#333";
            ctx.fillRect(x - w / 2 - 3, y + h / 2 - 5, w + 6, 5);
            break;
        case "car":
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            roundRect(x - w / 2 + 4, y - h / 2 + 6, w, h, 10);
            ctx.fillStyle = o.color;
            roundRect(x - w / 2, y - h / 2, w, h, 10);
            ctx.fillStyle = "#263238";
            roundRect(x - w / 2 + 6, y + h / 2 - 26, w - 12, 12, 3); // rear window (we see its back)
            roundRect(x - w / 2 + 6, y - h / 2 + 12, w - 12, 10, 3);
            ctx.fillStyle = "#ef5350";
            ctx.fillRect(x - w / 2 + 4, y + h / 2 - 5, 8, 4);
            ctx.fillRect(x + w / 2 - 12, y + h / 2 - 5, 8, 4);
            break;
        case "passenger": {
            // person waving for a taxi, with a little bounce
            const bob = Math.sin(performance.now() / 120) * 2;
            ctx.fillStyle = "#5c3a21";
            circle(x, y - h / 2 + 8 + bob, 8);
            ctx.fillStyle = "#ffd23f";
            roundRect(x - 9, y - h / 2 + 16 + bob, 18, 20, 4);
            ctx.strokeStyle = "#5c3a21";
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x + 8, y - h / 2 + 20 + bob);
            ctx.lineTo(x + 16, y - h / 2 + 4 + bob);
            ctx.stroke();
            break;
        }
        case "bonus":
            ctx.fillStyle = "#ff5c8a";
            ctx.font = "26px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("❤", x, y);
            ctx.textBaseline = "alphabetic";
            break;
    }
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
    ctx.fill();
}

function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function ellipse(x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

// =========================================================
// Loop, HUD and screens
// =========================================================
function loop(time) {
    if (state !== "playing") return;
    // delta time keeps the speed the same on 60Hz and 120Hz screens
    const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
    lastTime = time;
    update(dt);
    draw();
    if (state === "playing") requestAnimationFrame(loop);
}

function updateHud() {
    hudScore.textContent = `R${score}`;
    hudDistance.textContent = `${(distance / 4000).toFixed(1)} km`;
    hudLives.textContent = "❤".repeat(Math.max(0, lives)) + "♡".repeat(3 - Math.max(0, lives));
}

function startGame() {
    resetGame();
    startScreen.hidden = true;
    overScreen.hidden = true;
    pauseScreen.hidden = true;
    state = "playing";
    lastTime = performance.now();
    requestAnimationFrame(loop);
    canvas.focus();
}

function gameOver() {
    state = "over";
    draw();
    const isBest = score > best;
    if (isBest) { best = score; saveBest(best); }
    document.getElementById("final-score").textContent = `R${score}`;
    document.getElementById("final-detail").textContent =
        `${score / FARE} passengers · ${(distance / 4000).toFixed(1)} km`;
    document.getElementById("new-best").hidden = !isBest;
    bestEl.textContent = `R${best}`;
    overScreen.hidden = false;
    document.getElementById("restart").focus();
}

function togglePause() {
    if (state === "playing") {
        state = "paused";
        pauseScreen.hidden = false;
        document.getElementById("resume").focus();
    } else if (state === "paused") {
        state = "playing";
        pauseScreen.hidden = true;
        lastTime = performance.now();
        requestAnimationFrame(loop);
    }
}

function loadBest() {
    try { return Number(localStorage.getItem("taxi-rush-best")) || 0; } catch { return 0; }
}

function saveBest(v) {
    try { localStorage.setItem("taxi-rush-best", v); } catch { /* ignore */ }
}

// =========================================================
// Input: keyboard, tap and swipe
// =========================================================
function move(dir) {
    if (state !== "playing") return;
    player.lane = Math.max(0, Math.min(LANES - 1, player.lane + dir));
}

document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a") { e.preventDefault(); move(-1); }
    if (k === "arrowright" || k === "d") { e.preventDefault(); move(1); }
    if (k === "p" || k === "escape") togglePause();
    if ((k === "enter" || k === " ") && (state === "menu" || state === "over")) { e.preventDefault(); startGame(); }
});

let touchStartX = null;
canvas.addEventListener("pointerdown", (e) => {
    touchStartX = e.clientX;
});
canvas.addEventListener("pointerup", (e) => {
    if (touchStartX === null) return;
    const dx = e.clientX - touchStartX;
    if (Math.abs(dx) > 30) move(dx > 0 ? 1 : -1);          // swipe
    else {                                                  // tap left / right half
        const rect = canvas.getBoundingClientRect();
        move(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
    }
    touchStartX = null;
});

// pause automatically if you switch tabs
document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") togglePause();
});

document.getElementById("start").addEventListener("click", startGame);
document.getElementById("restart").addEventListener("click", startGame);
document.getElementById("resume").addEventListener("click", togglePause);
document.getElementById("pause").addEventListener("click", togglePause);

// draw a still frame behind the start menu
resetGame();
draw();
bestEl.textContent = `R${best}`;
