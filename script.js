const fryBtn = document.getElementById('fry-btn');
const waitingView = document.getElementById('waiting-view');
const gameView = document.getElementById('game-view');

const startGameBtn = document.getElementById('start-game-btn');
const exitGameBtn = document.getElementById('exit-game-btn');
const gameBoard = document.getElementById('game-board');
const fallingLayer = document.getElementById('falling-layer');
const catcher = document.getElementById('catcher');

const targetSlots = [
    document.getElementById('target-slot-0'),
    document.getElementById('target-slot-1'),
    document.getElementById('target-slot-2')
];

const scoreDisplay = document.getElementById('score');
const resultDisplay = document.getElementById('game-result');

const FOODS = [
    { key: 'hamburger', label: '漢堡', src: 'hamburger.png' },
    { key: 'cola', label: '可樂', src: 'cola.png' },
    { key: 'fries', label: '薯條', src: 'fries.png' }
];
const CATCHER_NORMAL_SRC = 'mcd-uncle.png';
const CATCHER_CRASH_SRC = 'crash-mcd-uncle.png';
const SPAWN_INTERVAL = 700;

let score = 0;
let spawnInterval = null;
let animationFrameId = null;
let isPlaying = false;
let catcherX = 0;
let boardWidth = 0;
let boardHeight = 0;
let catcherWidth = 130;
let targetQueue = [];
let fallingItems = [];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function resizeBoardState() {
    boardWidth = gameBoard.clientWidth;
    boardHeight = gameBoard.clientHeight;
    catcherWidth = catcher.clientWidth || 130;
    catcherX = clamp(catcherX, 0, boardWidth - catcherWidth);
    catcher.style.left = `${catcherX}px`;
}

function updateHUD() {
    scoreDisplay.textContent = score;
}

function randomFood() {
    const randomIndex = Math.floor(Math.random() * FOODS.length);
    return FOODS[randomIndex];
}

function updateTargetQueueUI() {
    for (let i = 0; i < targetSlots.length; i += 1) {
        const slot = targetSlots[i];
        const food = targetQueue[i] || randomFood();
        slot.src = food.src;
        slot.alt = `target item ${i + 1}`;
        slot.classList.toggle('is-current', i === 0);
    }
}

function resetTargetQueue() {
    targetQueue = [randomFood(), randomFood(), randomFood()];
    updateTargetQueueUI();
}

function consumeCurrentTarget() {
    targetQueue.shift();
    targetQueue.push(randomFood());
    updateTargetQueueUI();
}

function showGameView() {
    waitingView.classList.add('hidden');
    gameView.classList.remove('hidden');
}

function showWaitingView() {
    waitingView.classList.remove('hidden');
    gameView.classList.add('hidden');
}

function clearFallingItems() {
    for (const item of fallingItems) {
        item.el.remove();
    }
    fallingItems = [];
}

function spawnFallingItem() {
    const food = FOODS[Math.floor(Math.random() * FOODS.length)];
    const itemEl = document.createElement('img');
    itemEl.src = food.src;
    itemEl.alt = food.label;
    itemEl.className = 'falling-item';

    const size = 62;
    const x = Math.random() * Math.max(1, boardWidth - size);
    const speed = 1.5 + Math.random() * 2.2;

    itemEl.style.left = `${x}px`;
    itemEl.style.top = `-60px`;
    fallingLayer.appendChild(itemEl);

    fallingItems.push({
        el: itemEl,
        food,
        x,
        y: -60,
        size,
        speed
    });
}

function removeFallingItem(index) {
    const [item] = fallingItems.splice(index, 1);
    if (item) {
        item.el.remove();
    }
}

function isColliding(item) {
    const catcherHeight = catcher.clientHeight || 120;
    const catcherY = boardHeight - catcherHeight - 8;

    const itemLeft = item.x;
    const itemRight = item.x + item.size;
    const itemTop = item.y;
    const itemBottom = item.y + item.size;

    const catcherLeft = catcherX;
    const catcherRight = catcherX + catcherWidth;
    const catcherTop = catcherY;
    const catcherBottom = catcherY + catcherHeight;

    return (
        itemRight >= catcherLeft &&
        itemLeft <= catcherRight &&
        itemBottom >= catcherTop &&
        itemTop <= catcherBottom
    );
}

function stopLoops() {
    clearInterval(spawnInterval);
    spawnInterval = null;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function resetCatcherToNormal() {
    catcher.src = CATCHER_NORMAL_SRC;
    catcher.classList.remove('is-crashed');
    catcher.style.left = '';
}

function endGame(isSuccess, message) {
    isPlaying = false;
    stopLoops();
    clearFallingItems();

    if (isSuccess) {
        resetCatcherToNormal();
    } else {
        catcher.src = CATCHER_CRASH_SRC;
        catcher.style.left = '0px';
        catcher.classList.add('is-crashed');
    }

    if (message) {
        resultDisplay.textContent = message;
    } else if (isSuccess) {
        resultDisplay.textContent = `成功撐完 30 秒！你正確接到 ${score} 個指定餐點 🎉`;
    } else {
        resultDisplay.textContent = `遊戲結束！你共接到 ${score} 個指定餐點。`;
    }
}

function gameLoop() {
    if (!isPlaying) {
        return;
    }

    for (let i = fallingItems.length - 1; i >= 0; i -= 1) {
        const item = fallingItems[i];
        item.y += item.speed;
        item.el.style.top = `${item.y}px`;

        if (isColliding(item)) {
            const currentTarget = targetQueue[0];

            if (currentTarget && item.food.key === currentTarget.key) {
                score += 1;
                updateHUD();
                consumeCurrentTarget();
                removeFallingItem(i);
                continue;
            }

            endGame(false, `Wrong item!`);
            return;
        }

        if (item.y > boardHeight + 10) {
            removeFallingItem(i);
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
    stopLoops();
    clearFallingItems();
    resetCatcherToNormal();
    resizeBoardState();

    isPlaying = true;
    score = 0;
    resultDisplay.textContent = '';
    catcherX = (boardWidth - catcherWidth) / 2;
    catcher.style.left = `${catcherX}px`;

    updateHUD();
    resetTargetQueue();
    spawnFallingItem();

    spawnInterval = setInterval(() => {
        if (isPlaying) {
            spawnFallingItem();
        }
    }, SPAWN_INTERVAL);

    gameLoop();
}

function setCatcherByClientX(clientX) {
    if (!isPlaying) {
        return;
    }

    const boardRect = gameBoard.getBoundingClientRect();
    const relativeX = clientX - boardRect.left - catcherWidth / 2;
    catcherX = clamp(relativeX, 0, boardWidth - catcherWidth);
    catcher.style.left = `${catcherX}px`;
}

fryBtn.addEventListener('click', () => {
    showGameView();
    resizeBoardState();
    startGame();
});

startGameBtn.addEventListener('click', () => {
    startGame();
});

exitGameBtn.addEventListener('click', () => {
    isPlaying = false;
    stopLoops();
    clearFallingItems();
    resetCatcherToNormal();
    resultDisplay.textContent = '';
    showWaitingView();
});

gameBoard.addEventListener('mousemove', (event) => {
    setCatcherByClientX(event.clientX);
});

gameBoard.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
        setCatcherByClientX(event.touches[0].clientX);
    }
}, { passive: true });

window.addEventListener('keydown', (event) => {
    if (!isPlaying) {
        return;
    }

    const step = 28;
    if (event.key === 'ArrowLeft') {
        catcherX = clamp(catcherX - step, 0, boardWidth - catcherWidth);
        catcher.style.left = `${catcherX}px`;
    }

    if (event.key === 'ArrowRight') {
        catcherX = clamp(catcherX + step, 0, boardWidth - catcherWidth);
        catcher.style.left = `${catcherX}px`;
    }
});

window.addEventListener('resize', () => {
    if (gameView.classList.contains('hidden')) {
        return;
    }
    resizeBoardState();
});