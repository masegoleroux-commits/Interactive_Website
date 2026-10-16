const wordDisplay = document.querySelector(".word-display");
const guessesText = document.querySelector(".guesses-text b");
const keyboardDiv = document.querySelector(".keyboard");
const hangmanImage = document.querySelector(".hangman-box img");
const gameModal = document.querySelector(".game-modal");
const playAgainBtn = gameModal.querySelector("button");
const winsEl = document.querySelector(".score .wins");
const lossesEl = document.querySelector(".score .losses");

// Initializing game variables
let currentWord, correctLetters, wrongGuessCount, lastWord;
let gameFinished = false;
const maxGuesses = 6;

// Score is remembered between visits (wrapped in try/catch because some
// browsers block localStorage in private mode)
const score = loadScore();

function loadScore() {
    try {
        return JSON.parse(localStorage.getItem("hangman-score")) || { wins: 0, losses: 0 };
    } catch {
        return { wins: 0, losses: 0 };
    }
}

function saveScore() {
    try {
        localStorage.setItem("hangman-score", JSON.stringify(score));
    } catch {
        /* ignore – the score just won't persist */
    }
}

function renderScore() {
    winsEl.innerText = score.wins;
    lossesEl.innerText = score.losses;
}

const resetGame = () => {
    // Resetting game variables and UI elements
    correctLetters = [];
    wrongGuessCount = 0;
    gameFinished = false;
    hangmanImage.src = "images/hangman-0.svg";
    guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;
    wordDisplay.innerHTML = currentWord.split("").map(() => `<li class="letter"></li>`).join("");
    keyboardDiv.querySelectorAll("button").forEach(btn => btn.disabled = false);
    gameModal.classList.remove("show");
};

const getRandomWord = () => {
    // Selecting a random word and hint from hangmanQuizData,
    // avoiding the same word twice in a row
    let entry;
    do {
        entry = hangmanQuizData[Math.floor(Math.random() * hangmanQuizData.length)];
    } while (hangmanQuizData.length > 1 && entry.word === lastWord);

    // Words are lower-cased so they always match the on-screen keyboard
    currentWord = entry.word.toLowerCase();
    lastWord = entry.word;
    document.querySelector(".hint-text b").innerText = entry.hint;
    resetGame();
};

const gameOver = (isVictory) => {
    // After game complete.. showing modal with relevant details
    gameFinished = true;
    isVictory ? score.wins++ : score.losses++;
    saveScore();
    renderScore();

    const modalText = isVictory ? "You found the word:" : "The correct word was:";
    gameModal.querySelector("img").src = `images/${isVictory ? "beyonce-hair-flip" : "loser-online"}.gif`;
    gameModal.querySelector("h4").innerText = isVictory ? "Congrats!" : "Game Over!";
    gameModal.querySelector("p").innerHTML = `${modalText} <b>${currentWord}</b>`;
    gameModal.classList.add("show");
    playAgainBtn.focus();
};

const initGame = (button, clickedLetter) => {
    if (gameFinished || button.disabled) return;

    // Checking if clickedLetter exists in the currentWord
    if (currentWord.includes(clickedLetter)) {
        // Showing all correct letters on the word display
        [...currentWord].forEach((letter, index) => {
            if (letter === clickedLetter) {
                correctLetters.push(letter);
                wordDisplay.querySelectorAll("li")[index].innerText = letter;
                wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
            }
        });
    } else {
        // If clicked letter doesn't exist then update the wrongGuessCount and hangman image
        wrongGuessCount++;
        hangmanImage.src = `images/hangman-${wrongGuessCount}.svg`;
    }
    button.disabled = true; // Disabling the clicked button so user can't click again
    guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;

    // Calling gameOver function if any of these conditions are met
    if (wrongGuessCount === maxGuesses) return gameOver(false);
    if (correctLetters.length === currentWord.length) return gameOver(true);
};

// Creating keyboard buttons a–z and adding event listeners
// (the old loop started at 94, which added the ^ _ ` characters to the keyboard)
for (let i = 97; i <= 122; i++) {
    const letter = String.fromCharCode(i);
    const button = document.createElement("button");
    button.innerText = letter;
    button.dataset.letter = letter;
    button.setAttribute("aria-label", `Guess ${letter}`);
    keyboardDiv.appendChild(button);
    button.addEventListener("click", () => initGame(button, letter));
}

// Physical keyboard support
document.addEventListener("keydown", (e) => {
    if (gameModal.classList.contains("show")) {
        if (e.key === "Enter") getRandomWord();
        return;
    }
    const key = e.key.toLowerCase();
    if (/^[a-z]$/.test(key)) {
        const button = keyboardDiv.querySelector(`button[data-letter="${key}"]`);
        if (button) initGame(button, key);
    }
});

renderScore();
getRandomWord();
playAgainBtn.addEventListener("click", getRandomWord);
