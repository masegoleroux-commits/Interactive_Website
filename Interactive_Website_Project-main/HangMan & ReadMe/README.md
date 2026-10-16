# South African Soccer Hangman Game :alien:

<p align="center">
  <img src="Web capture_18-8-2023_19745_.jpeg" alt="Hangman game preview" width="800">
</p>

Welcome to Hangman with a Mzansi twist! Test your knowledge of South African football teams, players and slang with this classic word-guessing game.

## Table of Contents
- [Game Overview](#game-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [How to Play](#how-to-play)
- [Installation](#installation)
- [Updates (2026)](#updates-2026)
- [Contributing](#contributing)
- [License](#license)

## Game Overview
A hidden South African football word is picked at random and you get a hint. Each correct letter reveals part of the word; each wrong letter adds another piece to the hangman drawing. Six wrong guesses and the game is over.

## Features
- Word bank of 21 South African football teams, players, nicknames and terms, each with a hint.
- Hangman drawing that updates with every wrong guess.
- Win and loss counter that is remembered between visits.
- Play with the on-screen keyboard **or** by typing on your real keyboard (press Enter to play again).
- Responsive layout for phones and desktops.

## Technologies Used
- **HTML5** for the game layout.
- **CSS3** for styling and the responsive layout.
- **JavaScript** for game logic, keyboard input and saving the score with `localStorage`.

## How to Play
1. Open `HangMan/index.html` in your browser. A word is picked straight away.
2. Read the hint.
3. Click a letter, or type it on your keyboard.
4. Correct letters appear in the word; wrong letters add to the hangman.
5. Guess the full word before you reach 6 wrong guesses.
6. Click **Play Again** (or press Enter) for a new word.

## Installation
```bash
git clone https://github.com/MasegoLeRoux/Interactive_Website_Project.git
cd "Interactive_Website_Project/HangMan & ReadMe/HangMan"
```
Then open `index.html` in your preferred browser.

To add your own words, edit `HangMan/word-l.js`. Use letters only, no spaces.

## Updates (2026)
Fixes and improvements in the 2026 update:
- **Fixed:** the on-screen keyboard started at character code 94, so it showed three stray symbol keys (^, _ and the backtick). It now shows a–z only.
- **Fixed:** the word `CapeTownCity` had capital letters, so it could never be guessed with the lower-case keyboard. All words are now lower-cased automatically.
- **Fixed:** a typo in the closing `</html>` tag, a modal image pointing to a Giphy web page instead of an image, an unused GSAP script, and an absolute font path that broke on GitHub Pages.
- **Fixed:** a couple of inaccurate hints (for example Benni McCarthy's).
- **Added:** physical keyboard support, a win/loss score, six new words, accessibility labels and visible focus outlines.
- **Updated:** this README now matches the game (there is no "Start Game" button; the game starts on load).

> The `dist/` folder holds older auto-compiled copies made by a VS Code extension. The game uses the files in the main `HangMan/` folder.

## Contributing
Contributions are welcome! If you find a bug or have word ideas, feel free to open an issue or a pull request.

## License
This project is licensed under the [MIT License](../LICENSE).

---

Put your South African soccer knowledge to the test! If you have questions or feedback, please get in touch.
