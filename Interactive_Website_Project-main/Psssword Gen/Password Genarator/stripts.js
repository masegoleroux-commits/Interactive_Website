const pwEl = document.getElementById("pw");
const copyEl = document.getElementById("copy");
const lenEl = document.getElementById("len");
const upperEl = document.getElementById("upper");
const lowerEl = document.getElementById("lower");
const numberEl = document.getElementById("number");
const symbolEl = document.getElementById("symbol");
const generateEl = document.getElementById("generate");
const feedbackEl = document.getElementById("feedback");
const strengthFill = document.getElementById("strength-fill");
const strengthText = document.getElementById("strength-text");

const MIN_LEN = 4;
const MAX_LEN = 64;

const upperLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowerLetters = "abcdefghijklmnopqrstuvwxyz";
const numbers = "0123456789";
const symbols = "!@#$%^&*()_+=-?";

// crypto.getRandomValues is a cryptographically secure random source.
// Math.random() (used before) is predictable and should not be used for passwords.
function secureRandomInt(max) {
    const array = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max; // avoid modulo bias
    do {
        crypto.getRandomValues(array);
    } while (array[0] >= limit);
    return array[0] % max;
}

function randomFrom(chars) {
    return chars[secureRandomInt(chars.length)];
}

function getLowercase() {
    return randomFrom(lowerLetters);
}

function getUppercase() {
    return randomFrom(upperLetters);
}

function getNumber() {
    return randomFrom(numbers);
}

function getSymbol() {
    return randomFrom(symbols);
}

// Fisher–Yates shuffle, so the guaranteed characters are not always at the start
function shuffle(chars) {
    for (let i = chars.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars;
}

function getSelectedSets() {
    const sets = [];
    if (upperEl.checked) sets.push(getUppercase);
    if (lowerEl.checked) sets.push(getLowercase);
    if (numberEl.checked) sets.push(getNumber);
    if (symbolEl.checked) sets.push(getSymbol);
    return sets;
}

function getLength() {
    let len = parseInt(lenEl.value, 10);
    if (Number.isNaN(len)) len = 15;
    len = Math.min(MAX_LEN, Math.max(MIN_LEN, len));
    lenEl.value = len; // show the corrected value to the user
    return len;
}

function generatePassword() {
    const sets = getSelectedSets();

    if (sets.length === 0) {
        showFeedback("Please tick at least one option.", true);
        return;
    }

    const len = getLength();

    // One guaranteed character from every selected set...
    const password = sets.map((getChar) => getChar());

    // ...then fill the rest randomly from all selected sets
    while (password.length < len) {
        const getChar = sets[secureRandomInt(sets.length)];
        password.push(getChar());
    }

    pwEl.innerText = shuffle(password).join("");
    showFeedback("");
    updateStrength(len, sets.length);
}

function updateStrength(len, setCount) {
    const poolSize =
        (upperEl.checked ? upperLetters.length : 0) +
        (lowerEl.checked ? lowerLetters.length : 0) +
        (numberEl.checked ? numbers.length : 0) +
        (symbolEl.checked ? symbols.length : 0);

    // Entropy in bits = length × log2(pool size)
    const bits = Math.round(len * Math.log2(poolSize));

    let label = "Weak";
    let level = 1;
    if (bits >= 60) { label = "Fair"; level = 2; }
    if (bits >= 80) { label = "Strong"; level = 3; }
    if (bits >= 100) { label = "Very strong"; level = 4; }

    strengthFill.style.width = `${level * 25}%`;
    strengthFill.dataset.level = level;
    strengthText.innerText = `Strength: ${label} (~${bits} bits)`;
}

function showFeedback(message, isError = false) {
    feedbackEl.innerText = message;
    feedbackEl.classList.toggle("error", isError);
}

generateEl.addEventListener("click", generatePassword);

copyEl.addEventListener("click", async () => {
    const password = pwEl.innerText;

    if (!password) {
        return;
    }

    try {
        // Modern Clipboard API
        await navigator.clipboard.writeText(password);
    } catch {
        // Fallback for older browsers / pages opened from file://
        const textarea = document.createElement("textarea");
        textarea.value = password;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
    }

    copyEl.innerText = "Copied!";
    showFeedback("Password copied to clipboard ✔");
    setTimeout(() => (copyEl.innerText = "Copy"), 1500);
});

// Generate a fresh password on page load instead of showing the same sample one
generatePassword();
