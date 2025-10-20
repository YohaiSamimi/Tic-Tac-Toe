import WebSocket, { WebSocketServer } from "ws";
import { createClient } from "redis";

interface Game {
  board: string[][];
  nextTurn: string;
  players: Record<string, WebSocket>;
}

interface MoveMessage {
  type: "move";
  gameId: string;
  playerId: string;
  row: number;
  col: number;
}

interface JoinMessage {
  type: "join";
  gameId: string;
  playerId: string;
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const wss = new WebSocketServer({ port: PORT });

const pub = createClient();
const sub = createClient();

async function startServer() {
  await pub.connect();
  await sub.connect();
  await sub.subscribe("tic-tac-toe", (msg: string) => handleRedisMessage(JSON.parse(msg)));

  const games: Record<string, Game> = {};

  wss.on("connection", (ws: WebSocket) => {
    let playerId: string;
    let gameId: string;

    ws.on("message", (msg: WebSocket.RawData) => {
      const data = JSON.parse(msg.toString()) as JoinMessage | MoveMessage;

      if (data.type === "join") {
        playerId = data.playerId;
        gameId = data.gameId;

        if (!games[gameId]) {
          games[gameId] = {
            board: [["","",""],["","",""],["","",""]],
            nextTurn: "X",
            players: {}
          };
        }
        games[gameId].players[playerId] = ws;

        ws.send(JSON.stringify({ type: "update", board: games[gameId].board, nextTurn: games[gameId].nextTurn }));
      }

      if (data.type === "move") {
        handleMove(gameId, playerId, data.row, data.col);
      }
    });

    ws.on("close", () => {
      if (playerId && gameId && games[gameId]) {
        delete games[gameId].players[playerId];
      }
    });
  });

  async function handleRedisMessage(data: MoveMessage) {
    await handleMove(data.gameId, data.playerId, data.row, data.col, true);
  }

  async function handleMove(
    gameId: string,
    playerId: string,
    row: number,
    col: number,
    fromRedis = false
  ) {
    const game = games[gameId];
    if (!game) return;

    // Check turn
    if (game.nextTurn !== playerId) {
      game.players[playerId]?.send(JSON.stringify({ type: "error", message: "Not your turn!" }));
      return;
    }

    // Check if cell is empty
    if (game.board[row][col] !== "") {
      game.players[playerId]?.send(JSON.stringify({ type: "error", message: "Cell already occupied!" }));
      return;
    }

    // Make move
    game.board[row][col] = playerId;
    game.nextTurn = playerId === "X" ? "O" : "X";

    // Broadcast update
    Object.values(game.players).forEach(ws =>
      ws.send(JSON.stringify({ type: "update", board: game.board, nextTurn: game.nextTurn }))
    );

    // Publish move to Redis
    if (!fromRedis) {
      await pub.publish("tic-tac-toe", JSON.stringify({ type: "move", gameId, playerId, row, col }));
    }

    // Check winner/draw
    const winner = checkWinner(game.board);
    if (winner) {
      Object.values(game.players).forEach(ws =>
        ws.send(JSON.stringify({ type: "win", winner, board: game.board }))
      );
    } else if (isDraw(game.board)) {
      Object.values(game.players).forEach(ws =>
        ws.send(JSON.stringify({ type: "draw", board: game.board }))
      );
    }
  }

  function checkWinner(board: string[][]): string | null {
    const lines = [
      [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
      [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
      [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]
    ];
    for (let line of lines) {
      const [a,b,c] = line;
      if (board[a[0]][a[1]] && board[a[0]][a[1]]===board[b[0]][b[1]] && board[a[0]][a[1]]===board[c[0]][c[1]]) 
        return board[a[0]][a[1]];
    }
    return null;
  }

  function isDraw(board: string[][]): boolean {
    return board.flat().every(cell => cell !== "");
  }

  console.log(`Server running on port ${PORT}`);
}

startServer().catch(err => console.error(err));
