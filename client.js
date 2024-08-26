const socket = new WebSocket('ws://localhost:5500');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'gameState') {
    renderBoard(data.state.board);
    updateTurnDisplay(data.state.currentTurn);
  } else if (data.type === 'error') {
    alert(data.message);
  }
};

function renderBoard(board) {
  const boardElement = document.getElementById('board');
  boardElement.innerHTML = '';
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (board[row][col]) {
        cell.textContent = board[row][col];
        cell.classList.add(board[row][col].startsWith('A') ? 'player-a' : 'player-b');
      }
      boardElement.appendChild(cell);
    }
  }
}

function updateTurnDisplay(currentTurn) {
  document.getElementById('turnDisplay').textContent = `Current turn: Player ${currentTurn}`;
}

function makeMove() {
  const moveInput = document.getElementById('moveInput').value;
  socket.send(JSON.stringify({ type: 'move', move: moveInput }));
}