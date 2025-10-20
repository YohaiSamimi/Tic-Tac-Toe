import WebSocket from "ws";
import readline from "readline";

const SERVER_URL = process.argv[2] || "ws://localhost:3001";
const playerId = process.argv[3] || "X";
const gameId = process.argv[4] || "game1";

const ws = new WebSocket(SERVER_URL);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let board: string[][] = [["","",""],["","",""],["","",""]];
let nextTurn = "X";

// Join the game
ws.on("open", () => {
  ws.send(JSON.stringify({ type: "join", playerId, gameId }));
});

// Handle messages from the server
ws.on("message", (data: string) => {
  const msg = JSON.parse(data);

  switch (msg.type) {
    case "update":
      board = msg.board;
      nextTurn = msg.nextTurn;
      printBoard();
      if (nextTurn === playerId) askMove();
      break;

    case "error":
      console.log(`------- ${msg.message}`);
      askMove(); // retry move
      break;

    case "win":
      board = msg.board;
      printBoard();
      console.log(`Player ${msg.winner} wins!`);
      process.exit(0);
      break;

    case "draw":
      board = msg.board;
      printBoard();
      console.log("Draw!");
      process.exit(0);
      break;
  }
});

// Print board to console
function printBoard() {
  console.clear();
  console.log("Tic-Tac-Toe:");
  board.forEach(row => console.log(row.map(c => c || "_").join(" | ")));
  console.log(`Next turn: ${nextTurn}`);
}

// Ask player for move
function askMove() {
  rl.question("Enter move (row,col): ", (answer: string) => {
    const [row, col] = answer.split(",").map(Number);

    // Validate input
    if (
      isNaN(row) || isNaN(col) ||
      row < 0 || row > 2 ||
      col < 0 || col > 2
    ) {
      console.log("------- Invalid input. Use row,col (0-2).");
      return askMove();
    }

    // Check if cell already occupied locally
    if (board[row][col] !== "") {
      console.log("------- Cell already occupied. Try again.");
      return askMove();
    }

    ws.send(JSON.stringify({ type: "move", row, col }));
  });
}

// Handle Ctrl+C
process.on("SIGINT", () => {
  console.log("\nExiting...");
  process.exit(0);
});
