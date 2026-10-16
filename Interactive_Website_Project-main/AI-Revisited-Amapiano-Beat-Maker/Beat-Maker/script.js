/* =========================================================
   Amapiano Beat Maker
   - 16-step sequencer using the Web Audio API
   - All drums are synthesised (oscillators + filtered noise)
   - Uses a "look-ahead" scheduler so timing stays tight
   ========================================================= */

const STEPS = 16;

// Log drum notes (Hz): the bouncy, pitched bass that defines amapiano
const LOG_NOTES = [
    { label: "L", freq: 55.0 },   // A1
    { label: "M", freq: 65.41 },  // C2
    { label: "H", freq: 82.41 },  // E2
];

const TRACKS = [
    { id: "keys", name: "Keys", color: "#c9a7ff" },
    { id: "log", name: "Log drum", color: "#ff7a45", melodic: true },
    { id: "kick", name: "Kick", color: "#ffd23f" },
    { id: "clap", name: "Clap", color: "#3fd2c7" },
    { id: "shaker", name: "Shaker", color: "#8ee36d" },
    { id: "hat", name: "Hi-hat", color: "#5fa8ff" },
];

// Patterns use one string per track. "x" = on, "." = off.
// Log drum uses 1/2/3 for low/mid/high notes.
const PRESETS = {
    "Amapiano groove": {
        bpm: 112, swing: 20,
        keys:   "x.....x.....x...",
        log:    "..1..2....1.3...",
        kick:   "x...x...x...x...",
        clap:   "....x.......x...",
        shaker: "xxxxxxxxxxxxxxxx",
        hat:    "..x...x...x...x.",
    },
    "Private school": {
        bpm: 108, swing: 30,
        keys:   "x.......x..x....",
        log:    "...1....2...1.3.",
        kick:   "x.......x.......",
        clap:   "....x.......x...",
        shaker: "x.xxx.xxx.xxx.xx",
        hat:    "......x.......x.",
    },
    "Late night log drum": {
        bpm: 115, swing: 15,
        keys:   "x...............",
        log:    "1..1..2.3..2..1.",
        kick:   "x...x...x...x...",
        clap:   "....x.......x..x",
        shaker: "xxxxxxxxxxxxxxxx",
        hat:    "..x...x...x...x.",
    },
    "Empty": {
        bpm: 112, swing: 20,
        keys: "", log: "", kick: "", clap: "", shaker: "", hat: "",
    },
};

// ---------- State ----------
// pattern[trackId][step] = 0 (off) or 1 (on). For the log drum: 1, 2 or 3 = note.
let pattern = {};
let audioCtx = null;
let masterGain = null;
let noiseBuffer = null;
let isPlaying = false;
let currentStep = 0;
let nextNoteTime = 0;
let schedulerTimer = null;
const drawQueue = [];

// ---------- Elements ----------
const gridEl = document.getElementById("grid");
const playBtn = document.getElementById("play");
const bpmInput = document.getElementById("bpm");
const swingInput = document.getElementById("swing");
const volumeInput = document.getElementById("volume");
const presetSelect = document.getElementById("preset");
const toastEl = document.getElementById("toast");

// =========================================================
// Pattern helpers
// =========================================================
function emptyPattern() {
    const p = {};
    TRACKS.forEach((t) => (p[t.id] = new Array(STEPS).fill(0)));
    return p;
}

function patternFromStrings(preset) {
    const p = emptyPattern();
    TRACKS.forEach((t) => {
        const str = preset[t.id] || "";
        for (let i = 0; i < STEPS; i++) {
            const ch = str[i];
            if (t.melodic) p[t.id][i] = "123".includes(ch) ? Number(ch) : 0;
            else p[t.id][i] = ch === "x" ? 1 : 0;
        }
    });
    return p;
}

// Compact text encoding so a beat fits in a shareable link
function encodePattern() {
    const body = TRACKS.map((t) => pattern[t.id].join("")).join("-");
    return `${bpmInput.value}.${swingInput.value}.${body}`;
}

function decodePattern(code) {
    const [bpm, swing, body] = code.split(".");
    const rows = (body || "").split("-");
    if (rows.length !== TRACKS.length) return false;
    const p = emptyPattern();
    TRACKS.forEach((t, r) => {
        for (let i = 0; i < STEPS; i++) {
            const v = Number(rows[r][i]) || 0;
            p[t.id][i] = t.melodic ? Math.min(v, 3) : Math.min(v, 1);
        }
    });
    pattern = p;
    setSlider(bpmInput, bpm);
    setSlider(swingInput, swing);
    return true;
}

function setSlider(input, value) {
    const n = Number(value);
    if (Number.isFinite(n)) input.value = Math.min(input.max, Math.max(input.min, n));
    input.dispatchEvent(new Event("input"));
}

function save() {
    try { localStorage.setItem("amapiano-beat", encodePattern()); } catch { /* ignore */ }
}

// =========================================================
// Grid UI
// =========================================================
function buildGrid() {
    gridEl.innerHTML = "";
    TRACKS.forEach((track) => {
        const row = document.createElement("div");
        row.className = "row";
        row.style.setProperty("--track", track.color);
        row.setAttribute("role", "row");

        const label = document.createElement("button");
        label.type = "button";
        label.className = "track-name";
        label.textContent = track.name;
        label.title = `Preview ${track.name}`;
        label.addEventListener("click", () => {
            ensureAudio();
            playSound(track.id, audioCtx.currentTime, 2);
        });
        row.appendChild(label);

        for (let i = 0; i < STEPS; i++) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "step";
            if (i % 4 === 0) cell.classList.add("beat");
            cell.dataset.track = track.id;
            cell.dataset.step = i;
            cell.setAttribute("role", "gridcell");
            cell.addEventListener("click", () => toggleStep(track, i, cell));
            row.appendChild(cell);
        }
        gridEl.appendChild(row);
    });
    renderGrid();
}

function toggleStep(track, i, cell) {
    const value = pattern[track.id][i];
    pattern[track.id][i] = track.melodic ? (value + 1) % 4 : value ? 0 : 1;
    renderCell(cell);
    save();

    // Little preview so you hear what you just placed
    if (pattern[track.id][i]) {
        ensureAudio();
        playSound(track.id, audioCtx.currentTime, pattern[track.id][i]);
    }
}

function renderGrid() {
    gridEl.querySelectorAll(".step").forEach(renderCell);
}

function renderCell(cell) {
    const value = pattern[cell.dataset.track][cell.dataset.step];
    const track = TRACKS.find((t) => t.id === cell.dataset.track);
    cell.classList.toggle("on", value > 0);
    cell.textContent = track.melodic && value ? LOG_NOTES[value - 1].label : "";
    const state = !value ? "off" : track.melodic ? `note ${LOG_NOTES[value - 1].label}` : "on";
    cell.setAttribute("aria-label", `${track.name}, step ${Number(cell.dataset.step) + 1}, ${state}`);
}

function highlightStep(step) {
    gridEl.querySelectorAll(".step.playing").forEach((c) => c.classList.remove("playing"));
    if (step === null) return;
    gridEl.querySelectorAll(`.step[data-step="${step}"]`).forEach((c) => c.classList.add("playing"));
}

// =========================================================
// Audio engine
// =========================================================
function ensureAudio() {
    if (audioCtx) {
        if (audioCtx.state === "suspended") audioCtx.resume();
        return;
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // gentle compressor glues the mix together
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 4;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = volumeInput.value / 100;
    masterGain.connect(compressor).connect(audioCtx.destination);

    // one second of white noise, reused by clap / shaker / hi-hat
    noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

function envelope(gainNode, time, peak, decay) {
    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.exponentialRampToValueAtTime(peak, time + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decay);
}

function noise(time, duration) {
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    src.start(time);
    src.stop(time + duration);
    return src;
}

const SOUNDS = {
    kick(time) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
        envelope(gain, time, 1, 0.35);
        osc.connect(gain).connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.4);
    },

    // The log drum: a pitched, "woody" bass with a quick pitch drop and soft distortion
    log(time, note = 1) {
        const freq = LOG_NOTES[note - 1].freq;
        const osc = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const shaper = audioCtx.createWaveShaper();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc2.type = "triangle";
        osc.frequency.setValueAtTime(freq * 2.2, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.06);
        osc2.frequency.setValueAtTime(freq * 2, time);
        osc2.frequency.exponentialRampToValueAtTime(freq * 2, time + 0.06);

        shaper.curve = makeDistortion(8);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1800, time);
        filter.frequency.exponentialRampToValueAtTime(300, time + 0.4);

        envelope(gain, time, 0.9, 0.55);

        const mix = audioCtx.createGain();
        mix.gain.value = 0.7;
        osc.connect(mix);
        osc2.connect(mix);
        mix.connect(shaper).connect(filter).connect(gain).connect(masterGain);
        [osc, osc2].forEach((o) => { o.start(time); o.stop(time + 0.6); });
    },

    clap(time) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1500;
        filter.Q.value = 0.8;
        const gain = audioCtx.createGain();
        // three quick bursts = the "smeared" sound of hands clapping
        gain.gain.setValueAtTime(0.0001, time);
        [0, 0.012, 0.024].forEach((offset) => {
            gain.gain.setValueAtTime(0.8, time + offset);
            gain.gain.exponentialRampToValueAtTime(0.1, time + offset + 0.01);
        });
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        noise(time, 0.25).connect(filter).connect(gain).connect(masterGain);
    },

    shaker(time, _note, accent) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 6000;
        const gain = audioCtx.createGain();
        envelope(gain, time, accent ? 0.28 : 0.14, 0.06);
        noise(time, 0.08).connect(filter).connect(gain).connect(masterGain);
    },

    hat(time) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 8000;
        const gain = audioCtx.createGain();
        envelope(gain, time, 0.3, 0.12);
        noise(time, 0.14).connect(filter).connect(gain).connect(masterGain);
    },

    // Soft jazzy chord stab (Am9) – the "piano" in amapiano
    keys(time) {
        const chord = [220, 261.63, 329.63, 392.0, 493.88];
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2200;
        const gain = audioCtx.createGain();
        envelope(gain, time, 0.18, 1.1);
        filter.connect(gain).connect(masterGain);
        chord.forEach((f) => {
            const osc = audioCtx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = f;
            osc.detune.value = (Math.random() - 0.5) * 8; // slight detune = warmer
            osc.connect(filter);
            osc.start(time);
            osc.stop(time + 1.2);
        });
    },
};

function makeDistortion(amount) {
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
    }
    return curve;
}

function playSound(trackId, time, value, accent = false) {
    SOUNDS[trackId](time, value, accent);
}

// =========================================================
// Scheduler (look-ahead): schedules notes slightly ahead of time
// so playback stays in time even if the page is busy.
// =========================================================
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1; // seconds

function secondsPerStep() {
    return 60 / Number(bpmInput.value) / 4; // 16th notes
}

function scheduleStep(step, time) {
    // Swing: push every second 16th note a little later
    const swing = (Number(swingInput.value) / 100) * secondsPerStep() * 0.5;
    const t = step % 2 === 1 ? time + swing : time;

    TRACKS.forEach((track) => {
        const value = pattern[track.id][step];
        if (value) playSound(track.id, t, value, step % 4 === 2);
    });
    drawQueue.push({ step, time: t });
}

function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD) {
        scheduleStep(currentStep, nextNoteTime);
        nextNoteTime += secondsPerStep();
        currentStep = (currentStep + 1) % STEPS;
    }
}

function drawLoop() {
    if (!isPlaying) return;
    const now = audioCtx.currentTime;
    let last = null;
    while (drawQueue.length && drawQueue[0].time <= now) last = drawQueue.shift().step;
    if (last !== null) highlightStep(last);
    requestAnimationFrame(drawLoop);
}

function start() {
    ensureAudio();
    isPlaying = true;
    currentStep = 0;
    nextNoteTime = audioCtx.currentTime + 0.05;
    drawQueue.length = 0;
    schedulerTimer = setInterval(scheduler, LOOKAHEAD_MS);
    requestAnimationFrame(drawLoop);
    playBtn.textContent = "■ Stop";
    playBtn.setAttribute("aria-pressed", "true");
    document.body.classList.add("is-playing");
}

function stop() {
    isPlaying = false;
    clearInterval(schedulerTimer);
    highlightStep(null);
    playBtn.textContent = "▶ Play";
    playBtn.setAttribute("aria-pressed", "false");
    document.body.classList.remove("is-playing");
}

// =========================================================
// Controls
// =========================================================
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function loadPreset(name) {
    const preset = PRESETS[name];
    pattern = patternFromStrings(preset);
    setSlider(bpmInput, preset.bpm);
    setSlider(swingInput, preset.swing);
    renderGrid();
    save();
}

function randomise() {
    const chance = { keys: 0.12, log: 0.3, kick: 0, clap: 0, shaker: 0.75, hat: 0.2 };
    pattern = emptyPattern();
    for (let i = 0; i < STEPS; i++) {
        pattern.kick[i] = i % 4 === 0 ? 1 : 0;          // four-on-the-floor stays
        pattern.clap[i] = i === 4 || i === 12 ? 1 : 0;  // claps on 2 and 4
        pattern.keys[i] = i === 0 || Math.random() < chance.keys ? 1 : 0;
        pattern.shaker[i] = Math.random() < chance.shaker ? 1 : 0;
        pattern.hat[i] = i % 4 === 2 && Math.random() < 0.8 ? 1 : 0;
        pattern.log[i] = Math.random() < chance.log ? 1 + Math.floor(Math.random() * 3) : 0;
    }
    presetSelect.value = "";
    renderGrid();
    save();
    showToast("New groove generated 🎲");
}

Object.keys(PRESETS).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    presetSelect.appendChild(opt);
});
const customOpt = document.createElement("option");
customOpt.value = "";
customOpt.textContent = "Custom";
customOpt.hidden = true;
presetSelect.appendChild(customOpt);

playBtn.addEventListener("click", () => (isPlaying ? stop() : start()));

bpmInput.addEventListener("input", () => {
    document.getElementById("bpm-value").textContent = bpmInput.value;
    document.documentElement.style.setProperty("--pulse", `${60 / bpmInput.value}s`);
    save();
});
swingInput.addEventListener("input", () => {
    document.getElementById("swing-value").textContent = swingInput.value;
    save();
});
volumeInput.addEventListener("input", () => {
    if (masterGain) masterGain.gain.value = volumeInput.value / 100;
});

presetSelect.addEventListener("change", () => {
    if (presetSelect.value) loadPreset(presetSelect.value);
});

document.getElementById("randomise").addEventListener("click", randomise);

document.getElementById("clear").addEventListener("click", () => {
    loadPreset("Empty");
    presetSelect.value = "Empty";
});

document.getElementById("share").addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}#beat=${encodePattern()}`;
    history.replaceState(null, "", url);
    try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied! Send it to a friend 🔗");
    } catch {
        showToast("Link added to the address bar. Copy it from there.");
    }
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !["INPUT", "SELECT"].includes(e.target.tagName)) {
        e.preventDefault();
        isPlaying ? stop() : start();
    }
});

// =========================================================
// Start-up: shared link → saved beat → default preset
// =========================================================
pattern = emptyPattern();
buildGrid();

const hashMatch = location.hash.match(/beat=([\w.-]+)/);
let saved = null;
try { saved = localStorage.getItem("amapiano-beat"); } catch { /* ignore */ }

if (hashMatch && decodePattern(hashMatch[1])) {
    presetSelect.value = "";
    renderGrid();
    showToast("Loaded a shared beat 🎧");
} else if (saved && decodePattern(saved)) {
    presetSelect.value = "";
    renderGrid();
} else {
    presetSelect.value = "Amapiano groove";
    loadPreset("Amapiano groove");
}
