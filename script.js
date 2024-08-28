const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const holdBox = document.getElementById('hold-box').querySelector('.mini-board');
const nextBox = document.getElementById('next-box').querySelector('.mini-board');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

let score = 0;
let level = 1;
let gameInterval;
let currentTetromino;
let nextTetromino;
let heldTetromino;
let canHold = true;
let gameBoard2D;
let isPaused = false;

// 将变量名从 isSpaceKeyDown 改为 isEKeyDown
let isEKeyDown = false;

const TETROMINOS = {
    'I': [
        [1, 1, 1, 1]
    ],
    'J': [
        [1, 0, 0],
        [1, 1, 1]
    ],
    'L': [
        [0, 0, 1],
        [1, 1, 1]
    ],
    'O': [
        [1, 1],
        [1, 1]
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0]
    ],
    'T': [
        [0, 1, 0],
        [1, 1, 1]
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1]
    ]
};

function initBoard() {
    gameBoard.innerHTML = '';
    gameBoard2D = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            gameBoard.appendChild(cell);
        }
    }
}

function drawTetromino(tetromino, board) {
    const cells = board.getElementsByClassName('cell');
    tetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const cellIndex = (tetromino.y + y) * (board === gameBoard ? COLS : 4) + (tetromino.x + x);
                cells[cellIndex].classList.add('tetromino', tetromino.type);
            }
        });
    });
}

function eraseTetromino(tetromino, board) {
    const cells = board.getElementsByClassName('cell');
    tetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const cellIndex = (tetromino.y + y) * (board === gameBoard ? COLS : 4) + (tetromino.x + x);
                cells[cellIndex].classList.remove('tetromino', tetromino.type);
            }
        });
    });
}

function createTetromino() {
    const types = Object.keys(TETROMINOS);
    const type = types[Math.floor(Math.random() * types.length)];
    const shape = TETROMINOS[type];
    return {
        type: type,
        shape: shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

function moveTetromino(dx, dy) {
    if (isPaused) return;
    eraseTetromino(currentTetromino, gameBoard);
    currentTetromino.x += dx;
    currentTetromino.y += dy;
    if (collision()) {
        currentTetromino.x -= dx;
        currentTetromino.y -= dy;
        if (dy > 0) {
            lockTetromino();
            clearLines();
            currentTetromino = nextTetromino;
            nextTetromino = createTetromino();
            updateNextBox();
            canHold = true;
            if (collision()) {
                gameOver();
            }
        }
    }
    drawTetromino(currentTetromino, gameBoard);
}

function rotateTetromino() {
    if (isPaused) return;
    eraseTetromino(currentTetromino, gameBoard);
    const originalShape = currentTetromino.shape;
    currentTetromino.shape = currentTetromino.shape[0].map((_, i) =>
        currentTetromino.shape.map(row => row[i]).reverse()
    );
    if (collision()) {
        currentTetromino.shape = originalShape;
    }
    drawTetromino(currentTetromino, gameBoard);
}

function collision() {
    return currentTetromino.shape.some((row, y) =>
        row.some((value, x) =>
            value &&
            (currentTetromino.y + y >= ROWS ||
             currentTetromino.x + x < 0 ||
             currentTetromino.x + x >= COLS ||
             gameBoard2D[currentTetromino.y + y][currentTetromino.x + x])
        )
    );
}

function lockTetromino() {
    currentTetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                gameBoard2D[currentTetromino.y + y][currentTetromino.x + x] = currentTetromino.type;
            }
        });
    });
    redrawBoard();
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (gameBoard2D[y].every(cell => cell)) {
            gameBoard2D.splice(y, 1);
            gameBoard2D.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        updateScore(linesCleared);
        redrawBoard();
    }
}

// 确保 redrawBoard 函数正确重绘所有方块
function redrawBoard() {
    const cells = gameBoard.getElementsByClassName('cell');
    gameBoard2D.forEach((row, y) => {
        row.forEach((value, x) => {
            const cellIndex = y * COLS + x;
            cells[cellIndex].className = 'cell';
            if (value) {
                cells[cellIndex].classList.add('tetromino', value);
            }
        });
    });
    drawTetromino(currentTetromino, gameBoard);  // 添加这行来确保当前方块也被绘制
}

function updateScore(linesCleared) {
    const points = [40, 100, 300, 1200];
    score += points[linesCleared - 1] * level;
    scoreElement.textContent = score;
    level = Math.floor(score / 1000) + 1;
    levelElement.textContent = level;
}

function gameOver() {
    clearInterval(gameInterval);
    alert('游戏结束！你的得分是: ' + score);
}

function gameLoop() {
    if (!isPaused) {
        moveTetromino(0, 1);
    }
}

function startGame() {
    initBoard();
    initMiniBoard(holdBox);
    initMiniBoard(nextBox);
    score = 0;
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    currentTetromino = createTetromino();
    nextTetromino = createTetromino();
    updateNextBox();
    drawTetromino(currentTetromino, gameBoard);
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(gameLoop, 1000 - (level - 1) * 100);
    isPaused = false;
    pauseButton.textContent = '暂停';
}

function initMiniBoard(board) {
    board.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        board.appendChild(cell);
    }
}

function updateNextBox() {
    clearMiniBoard(nextBox);
    const miniNextTetromino = { ...nextTetromino, x: 0, y: 0 };
    drawTetromino(miniNextTetromino, nextBox);
}

function updateHoldBox() {
    clearMiniBoard(holdBox);
    if (heldTetromino) {
        const miniHeldTetromino = { ...heldTetromino, x: 0, y: 0 };
        drawTetromino(miniHeldTetromino, holdBox);
    }
}

function clearMiniBoard(board) {
    const cells = board.getElementsByClassName('cell');
    Array.from(cells).forEach(cell => {
        cell.className = 'cell';
    });
}

// 修改 holdTetromino 函数
function holdTetromino() {
    if (isPaused || !canHold) return;
    
    eraseTetromino(currentTetromino, gameBoard);
    
    if (!heldTetromino) {
        // 第一次保留方块
        heldTetromino = { type: currentTetromino.type, shape: currentTetromino.shape };
        currentTetromino = nextTetromino;
        nextTetromino = createTetromino();
        updateNextBox();
    } else {
        // 交换当前方块和保留的方块
        const tempType = currentTetromino.type;
        const tempShape = currentTetromino.shape;
        currentTetromino.type = heldTetromino.type;
        currentTetromino.shape = heldTetromino.shape;
        heldTetromino.type = tempType;
        heldTetromino.shape = tempShape;
    }
    
    // 重置当前方块的位置
    currentTetromino.x = Math.floor(COLS / 2) - Math.floor(currentTetromino.shape[0].length / 2);
    currentTetromino.y = 0;
    
    updateHoldBox();
    redrawBoard();  // 添加这行来重绘整个游戏板
    
    // 检查新的currentTetromino是否发生碰撞
    if (collision()) {
        gameOver();
    } else {
        drawTetromino(currentTetromino, gameBoard);
    }
    
    canHold = false;
}

function updateHoldBox() {
    clearMiniBoard(holdBox);
    if (heldTetromino) {
        const miniHeldTetromino = {
            type: heldTetromino.type,
            shape: heldTetromino.shape,
            x: 0,
            y: 0
        };
        drawTetromino(miniHeldTetromino, holdBox);
    }
}

// Update the collision function to handle negative y values
function collision() {
    return currentTetromino.shape.some((row, y) =>
        row.some((value, x) =>
            value &&
            (currentTetromino.y + y >= ROWS ||
             currentTetromino.x + x < 0 ||
             currentTetromino.x + x >= COLS ||
             (currentTetromino.y + y >= 0 && gameBoard2D[currentTetromino.y + y][currentTetromino.x + x]))
        )
    );
}

function quickDrop() {
    if (isPaused) return;
    while (!collision()) {
        eraseTetromino(currentTetromino, gameBoard);
        currentTetromino.y++;
    }
    currentTetromino.y--;
    drawTetromino(currentTetromino, gameBoard);
    lockTetromino();
    clearLines();
    currentTetromino = nextTetromino;
    nextTetromino = createTetromino();
    updateNextBox();
    canHold = true;
    if (collision()) {
        gameOver();
    } else {
        drawTetromino(currentTetromino, gameBoard);
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '继续' : '暂停';
}



// 修改键盘事件监听器
document.addEventListener('keydown', event => {
    if (event.key === 'e' && !isEKeyDown) {
        isEKeyDown = true;
        holdTetromino();
    } else {
        switch (event.key) {
            case 'ArrowLeft':
                moveTetromino(-1, 0);
                break;
            case 'ArrowRight':
                moveTetromino(1, 0);
                break;
            case 'ArrowDown':
                moveTetromino(0, 1);
                break;
            case 'ArrowUp':
                rotateTetromino();
                break;
            case 'q':
            case 'Q':
                quickDrop();
                break;
        }
    }
});

// 修改键盘事件监听器来处理按键释放
document.addEventListener('keyup', event => {
    if (event.key === 'e') {
        isEKeyDown = false;
    }
});

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);