const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minsEl = document.getElementById("mins");
const secondsEl = document.getElementById("seconds");
const yearEl = document.getElementById("target-year");
const messageEl = document.getElementById("message");

// Always count down to the NEXT 1 January, so the timer never goes stale
// (the old version was hard-coded to "1 Jan 2024" and showed negative numbers after that).
function getNextNewYear() {
    const now = new Date();
    return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
}

let newYearsDate = getNextNewYear();
yearEl.textContent = newYearsDate.getFullYear();

// How long the "Happy New Year" message stays up before the next countdown starts
const CELEBRATION_MS = 24 * 60 * 60 * 1000;
let celebratingUntil = 0;

function countdown() {
    const now = Date.now();

    if (now < celebratingUntil) return;

    const totalSeconds = Math.max(0, (newYearsDate - now) / 1000);

    if (totalSeconds === 0 && celebratingUntil === 0) {
        // We've reached midnight: celebrate, then roll over to the next year
        celebratingUntil = now + CELEBRATION_MS;
        messageEl.hidden = false;
        render(0, 0, 0, 0);
        return;
    }

    if (celebratingUntil !== 0) {
        celebratingUntil = 0;
        messageEl.hidden = true;
        newYearsDate = getNextNewYear();
        yearEl.textContent = newYearsDate.getFullYear();
    }

    const days = Math.floor(totalSeconds / 3600 / 24);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const mins = Math.floor(totalSeconds / 60) % 60;
    const seconds = Math.floor(totalSeconds) % 60;

    render(days, hours, mins, seconds);
}

function render(days, hours, mins, seconds) {
    // textContent is safer and faster than innerHTML for plain text
    daysEl.textContent = days;
    hoursEl.textContent = formatTime(hours);
    minsEl.textContent = formatTime(mins);
    secondsEl.textContent = formatTime(seconds);
}

function formatTime(time) {
    return String(time).padStart(2, "0");
}

// initial call
countdown();

setInterval(countdown, 1000);
