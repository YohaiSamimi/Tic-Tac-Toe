# Tic-Tac-Toe Multiplayer CLI

A **multiplayer Tic-Tac-Toe game** using **Node.js**, **WebSockets**, and **Redis**. Players can join a game from multiple command-line interfaces (CLI) and play in real-time. Redis is used to sync moves across multiple server instances.

---

## Features

* Multiplayer support (two players: X and O)
* Real-time updates via **WebSocket**
* Game state persistence and synchronization via **Redis**
* CLI interface for both server and client
* Detects invalid moves, turns, wins, and draws

---

## Requirements

* Node.js >= 18
* npm
* Redis (local or via Docker)

---

## Installation

1. **Clone the repository**

```bash
git clone <repo-url>
cd tic-tac-toe
```

2. **Install dependencies for server**

```bash
cd server
npm install
```

3. **Install dependencies for client**

```bash
cd ../client
npm install
```

4. **Start Redis** (if using Docker):

```bash
docker run -p 6379:6379 redis
```

---

## Server

1. **Build the server**

```bash
cd server
npm run build
```

2. **Run the server**

```bash
npm start
```

* By default, server runs on port `3001`.
* To use a different port:

```bash
npm start -- --port=3002
```

* You should see:

```
Server running on port 3001
```

---

## Client (CLI)

1. **Build the client**

```bash
cd client
npm run build
```

2. **Run the client**

```bash
node dist/client.js <server-url> <playerId> <gameId>
```

* Example:

```bash
node dist/client.js ws://localhost:3001 X game1
```

* Arguments:

  * `<server-url>`: WebSocket server URL (default: `ws://localhost:3001`)
  * `<playerId>`: Player identifier (`X` or `O`)
  * `<gameId>`: Game session identifier

3. **Playing the game**

* Enter your move as `row,col` (e.g., `0,2`) when prompted.
* The CLI will print the updated board after every move.
* Errors for invalid moves are displayed immediately.

---

## Board Display

```
Tic-Tac-Toe:
_ | _ | _
_ | _ | _
_ | _ | _
Next turn: X
```

* `_` represents an empty cell.
* `Next turn` shows whose turn it is.

---

## Game Rules

* Players take turns placing their marker (`X` or `O`) on a 3x3 grid.
* The first to align 3 markers vertically, horizontally, or diagonally wins.
* If all cells are filled without a winner, the game is a draw.
* Invalid moves or playing out-of-turn are rejected.

---

## Redis Usage

* Redis is used for **synchronizing moves** across multiple server instances.
* `tic-tac-toe` channel is used for publishing and subscribing move messages.

---

## Troubleshooting

* **Port already in use:** Change the server port or close the conflicting process.
* **Redis connection refused:** Make sure Redis is running locally or update the client URL.
* **Type errors in client/server:** Ensure dependencies are installed and the code is built using `npm run build`.

---

## Future Improvements

* Persistent game storage
* Multiple concurrent games
* Web interface for better UX
* Spectator mode
