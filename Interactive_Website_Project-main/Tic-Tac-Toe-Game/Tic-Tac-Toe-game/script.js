let gameActive = true;
let currentPlayer = "X";
let gameState = ["", "", "", "", "", "", "", "", ""];
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];
const statusDisplay = document.getElementById("status");
const cells = document.querySelectorAll(".cell");
const scores = { X: 0, O: 0, draw: 0 };

const winningMessage = function () {
    return "Player " + currentPlayer + " wins!"; // was "X's Wins!"
};
const drawMessage = function () {
    return "Draw!";
};
const currentPlayerTurn = function () {
    return "It's " + currentPlayer + "'s turn";
};

cells.forEach(function (cell) {
    cell.addEventListener("click", CellClick);
});
document.querySelector(".restart").addEventListener("click", RestartGame);

function CellClick(clickedCellEvent) {
    const clickedCell = clickedCellEvent.currentTarget;
    const clickedCellIndex = parseInt(clickedCell.getAttribute("data-cell-index"), 10);
    if (gameState[clickedCellIndex] !== "" || !gameActive) {
        return;
    }
    CellPlayed(clickedCell, clickedCellIndex);
    ResultValidation();
}

function CellPlayed(clickedCell, clickedCellIndex) {
    gameState[clickedCellIndex] = currentPlayer;
    clickedCell.textContent = currentPlayer;
    clickedCell.classList.add(currentPlayer === "X" ? "x" : "o");
    clickedCell.setAttribute("aria-label", `Cell ${clickedCellIndex + 1}: ${currentPlayer}`);
}

statusDisplay.textContent = currentPlayerTurn();

function PlayerChange() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent = currentPlayerTurn();
}

function ResultValidation() {
    let winningLine = null;
    for (const winCondition of winningConditions) {
        const [a, b, c] = winCondition.map((i) => gameState[i]);
        if (a === "" || b === "" || c === "") {
            continue;
        }
        if (a === b && b === c) {
            winningLine = winCondition;
            break;
        }
    }

    if (winningLine) {
        // Highlight the three winning cells
        winningLine.forEach((i) => cells[i].classList.add("win"));
        statusDisplay.textContent = winningMessage();
        scores[currentPlayer]++;
        updateScoreboard();
        endGame();
        return;
    }

    const roundDraw = !gameState.includes("");
    if (roundDraw) {
        statusDisplay.textContent = drawMessage();
        scores.draw++;
        updateScoreboard();
        endGame();
        return;
    }
    PlayerChange();
}

function endGame() {
    gameActive = false;
    cells.forEach((cell) => (cell.disabled = true));
}

function updateScoreboard() {
    document.getElementById("score-x").textContent = scores.X;
    document.getElementById("score-o").textContent = scores.O;
    document.getElementById("score-draw").textContent = scores.draw;
}

function RestartGame() {
    gameActive = true;
    currentPlayer = "X";
    gameState = ["", "", "", "", "", "", "", "", ""];
    statusDisplay.textContent = currentPlayerTurn();
    cells.forEach(function (cell, i) {
        cell.textContent = "";
        cell.disabled = false;
        cell.classList.remove("x", "o", "win");
        cell.setAttribute("aria-label", `Cell ${i + 1}`);
    });
}
