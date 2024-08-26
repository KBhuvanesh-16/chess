const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5500 });

let gameState = initializeGameState();

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'gameState', state: gameState }));

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === 'move') {
      const result = processMove(parsedMessage.data);

      if (result.valid) {
        gameState.currentTurn = gameState.currentTurn === 'A' ? 'B' : 'A';
        broadcastGameState();
      } else {
        ws.send(JSON.stringify({ type: 'invalidMove', reason: result.reason }));
      }
    }
  });
});

function initializeGameState() {
  return {
    board: [
      ['A-P1', 'A-H1', 'A-H2', 'A-H1', 'A-P1'],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      ['B-P1', 'B-H1', 'B-H2', 'B-H1', 'B-P1']
    ],
    currentTurn: 'A'
  };
}

function processMove(moveData) {
  const { character, move } = moveData;
  const [player, pieceType] = character.split('-');

  if (player !== gameState.currentTurn) {
    return { valid: false, reason: "Not your turn" };
  }

  const piecePosition = findPiece(character);
  if (!piecePosition) {
    return { valid: false, reason: "Piece not found" };
  }

  const newPosition = calculateNewPosition(piecePosition, pieceType, move);
  if (!newPosition) {
    return { valid: false, reason: "Invalid move" };
  }

  if (!isValidMove(piecePosition, newPosition, pieceType)) {
    return { valid: false, reason: "Invalid move" };
  }

  // Execute the move
  gameState.board[newPosition.row][newPosition.col] = gameState.board[piecePosition.row][piecePosition.col];
  gameState.board[piecePosition.row][piecePosition.col] = null;

  return { valid: true };
}

function findPiece(character) {
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (gameState.board[row][col] === character) {
        return { row, col };
      }
    }
  }
  return null;
}

function calculateNewPosition(position, pieceType, move) {
  const { row, col } = position;
  switch (pieceType) {
    case 'P1':
      switch (move) {
        case 'L': return { row, col: col - 1 };
        case 'R': return { row, col: col + 1 };
        case 'F': return gameState.currentTurn === 'A' ? { row: row + 1, col } : { row: row - 1, col };
        case 'B': return gameState.currentTurn === 'A' ? { row: row - 1, col } : { row: row + 1, col };
      }
      break;
    case 'H1':
      switch (move) {
        case 'L': return { row, col: col - 2 };
        case 'R': return { row, col: col + 2 };
        case 'F': return gameState.currentTurn === 'A' ? { row: row + 2, col } : { row: row - 2, col };
        case 'B': return gameState.currentTurn === 'A' ? { row: row - 2, col } : { row: row + 2, col };
      }
      break;
    case 'H2':
      switch (move) {
        case 'FL': return gameState.currentTurn === 'A' ? { row: row + 2, col: col - 2 } : { row: row - 2, col: col - 2 };
        case 'FR': return gameState.currentTurn === 'A' ? { row: row + 2, col: col + 2 } : { row: row - 2, col: col + 2 };
        case 'BL': return gameState.currentTurn === 'A' ? { row: row - 2, col: col - 2 } : { row: row + 2, col: col - 2 };
        case 'BR': return gameState.currentTurn === 'A' ? { row: row - 2, col: col + 2 } : { row: row + 2, col: col + 2 };
      }
      break;
  }
  return null;
}

function isValidMove(from, to, pieceType) {
  if (to.row < 0 || to.row > 4 || to.col < 0 || to.col > 4) {
    return false;
  }

  const targetPiece = gameState.board[to.row][to.col];
  if (targetPiece && targetPiece[0] === gameState.currentTurn) {
    return false;
  }

  if (pieceType === 'H1' || pieceType === 'H2') {
    // Check path for Hero1 and Hero2
    const rowStep = (to.row - from.row) / 2;
    const colStep = (to.col - from.col) / 2;
    const midRow = from.row + rowStep;
    const midCol = from.col + colStep;
    if (gameState.board[midRow][midCol] && gameState.board[midRow][midCol][0] === gameState.currentTurn) {
      return false;
    }
  }

  return true;
}

function broadcastGameState() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'gameState', state: gameState }));
    }
  });
}