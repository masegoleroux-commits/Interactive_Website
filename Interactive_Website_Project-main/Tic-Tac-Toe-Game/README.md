# Tic-Tac-Toe Game

Welcome to Tic-Tac-Toe! A classic version of the game where two players take turns marking cells on a 3x3 grid, trying to get three in a row horizontally, vertically or diagonally.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Gameplay Instructions](#gameplay-instructions)
- [Customization](#customization)
- [Preview](#preview)
- [Updates (2026)](#updates-2026)
- [Acknowledgments](#acknowledgments)
- [License](#license)

## Features

- **Player vs. Player:** play head-to-head against a friend on the same device.
- **Responsive Design:** the board resizes to fit phones, tablets and desktops.
- **Winning Condition:** the game detects three in a row, announces the winner and highlights the winning line.
- **Tie Detection:** a full board with no winner is a draw.
- **Scoreboard:** keeps count of X wins, O wins and draws.
- **Restart:** start a new round with the "Restart" button.
- **Keyboard friendly:** every cell is a button, so you can play with Tab and Enter.

## Technologies Used

- **HTML:** the game board and user interface.
- **CSS:** styling, CSS Grid and `clamp()`/`min()` for a responsive board.
- **JavaScript:** game logic, win detection and the scoreboard.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MasegoLeRoux/Interactive_Website_Project.git
   ```
2. **Open the game:** go to `Tic-Tac-Toe-Game/Tic-Tac-Toe-game/` and open `index.html` in your browser.

## Gameplay Instructions

1. Player X starts by clicking an empty cell.
2. Player O then picks a different empty cell.
3. Players keep taking turns.
4. The first player with three marks in a row (horizontally, vertically or diagonally) wins.
5. If all cells are filled and nobody has won, it's a draw.
6. Click **Restart** to play again. The scoreboard keeps counting.

## Customization

- **Visual style:** edit `Tic-Tac-Toe-game/style.css`.
- **Game rules:** change the winning combinations in `Tic-Tac-Toe-game/script.js`.

## Preview

![Gameplay Screenshot](Web%20capture_22-8-2023_213432_127.0.0.1.jpeg)

## Updates (2026)
Fixes and improvements in the 2026 update:
- **Fixed:** the background image used an absolute path (`/elnaz-...jpg`) that pointed to the wrong folder, so it didn't load.
- **Fixed:** `overflow: hidden` on the page and fixed 150px cells meant the board was cut off on phones, even though the README promised a responsive design.
- **Fixed:** the win message read "X's Wins!"; it now says "Player X wins!".
- **Fixed:** this README said the button was called "Reset" and was missing the clone command.
- **Added:** winning-line highlight, a scoreboard, different colours for X and O, and cells as real buttons for keyboard and screen-reader users.

## Acknowledgments

- Background photo by Elnaz Asadi on [Unsplash](https://unsplash.com/photos/r-tbG_N80Vo).

## License

This project is licensed under the [MIT License](../LICENSE).
