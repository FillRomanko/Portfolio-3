const sections = Array.from(document.querySelectorAll("section.slide"));
const navDots = Array.from(document.querySelectorAll(".nav-dot"));

function setActiveDot() {
    const scrollPos = window.scrollY + window.innerHeight / 2;
    let activeIndex = 0;
    sections.forEach((sec, idx) => {
        const rect = sec.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = top + rect.height;
        if (scrollPos >= top && scrollPos < bottom) {
            activeIndex = idx;
        }
    });
    navDots.forEach((dot, idx) => {
        dot.classList.toggle("active", idx === activeIndex);
    });
}

navDots.forEach((dot) => {
    dot.addEventListener("click", () => {
        const targetId = dot.dataset.target;
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    });
});

window.addEventListener("scroll", setActiveDot);
window.addEventListener("resize", setActiveDot);
setActiveDot();

/* 1 */
const notifList = document.getElementById("notifList");
const notifCounter = document.getElementById("notifCounter");
const notifMessage = document.getElementById("notifMessage");
const notifResetBtn = document.getElementById("notifResetBtn");
const phonePlayBtn = document.getElementById("phonePlayBtn");
const phoneResult = document.getElementById("phoneResult");
const phoneResultText = document.getElementById("phoneResultText");


const notifTemplates = [
    ["Forest", "Сегодня уже был фокус?"],
    ["Duolingo", "Ты пропускаешь ещё один урок."],
    ["Notion", "Задачи ждут уточнения и тегов."],
    ["Apple Watch", "Пора встать и немного пройтись."],
    ["Habitica", "Отмечай привычки, иначе потеряешь хп."],
    ["Calendar", "Собрание начнётся через 10 минут."],
    ["Email", "Входящее: ещё один срочный вопрос."],
];


let gameState = {
    started: false,
    finished: false,
    spawnedCount: 0,
    timeouts: []
};

function resetGame() {
    gameState.timeouts.forEach(id => clearTimeout(id));
    gameState.timeouts = [];

    gameState.started = false;
    gameState.finished = false;
    gameState.spawnedCount = 0;

    notifList.innerHTML = "";
    updateNotifCounter();
    notifMessage.textContent = "Нажми ▶, чтобы начать.";
    phonePlayBtn.style.display = "block";

    phoneResult.style.display = "none";
    phoneResultText.textContent = "";
}


function createNotif(item) {
    const el = document.createElement("div");
    el.className = "notif";
    el.innerHTML = `
        <div class="notif-icon">!</div>
        <div class="notif-content">
          <div class="notif-title">${item[0]}</div>
          <div class="notif-text">${item[1]}</div>
        </div>
        <div class="notif-time">${Math.floor(Math.random() * 23) + 1}:${
        Math.random() > 0.5 ? "05" : "30"
    }</div>
    `;
    enableSwipeToRemove(el);
    return el;
}

function scheduleNotifs() {
    const shuffled = [...notifTemplates].sort(() => Math.random() - 0.5);
    let totalDelay = 0;

    shuffled.forEach((tpl, index) => {
        // рандом от 500 до 1000 мс
        const randDelay = 500 + Math.random() * 500;
        totalDelay += randDelay;

        const timeoutId = setTimeout(() => {
            if (gameState.finished) return;
            const notifEl = createNotif(tpl);
            notifList.appendChild(notifEl);
            gameState.spawnedCount++;
            updateNotifCounter();
            checkLoseCondition();
        }, totalDelay);

        gameState.timeouts.push(timeoutId);
    });

    notifMessage.textContent =
        "Смахивай уведомления, пока экран не утонул в шуме.";
}

function updateNotifCounter() {
    const count = notifList.children.length;
    notifCounter.textContent = "Уведомления: " + count;
}

function checkLoseCondition() {
    const current = notifList.children.length;
    if (current >= 5 && !gameState.finished) {
        gameState.finished = true;
        notifMessage.textContent =
            "Экран захлестнули уведомления. Ты не справился и проиграл.";
        phoneResultText.textContent = "Поражение.\nСлишком много уведомлений.";
        phoneResult.style.display = "flex";

        gameState.timeouts.forEach(id => clearTimeout(id));
        gameState.timeouts = [];
    }
}


function checkWinCondition() {
    const current = notifList.children.length;
    if (
        !gameState.finished &&
        gameState.spawnedCount === notifTemplates.length &&
        current === 0
    ) {
        gameState.finished = true;
        notifMessage.textContent =
            "Тишина. Можно наконец заняться чем‑то важным.";
        phoneResultText.textContent = "Победа.\nТы справился со всеми уведомлениями.";
        phoneResult.style.display = "flex";
    }
}


function enableSwipeToRemove(el) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    function pointerDown(e) {
        if (gameState.finished) return;
        isDragging = true;
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        el.style.transition = "none";
    }

    function pointerMove(e) {
        if (!isDragging) return;
        currentX = e.touches ? e.touches[0].clientX : e.clientX;
        const delta = currentX - startX;
        el.style.transform = `translateX(${delta}px)`;
        el.style.opacity = String(
            Math.max(0.1, 1 - Math.abs(delta) / 200)
        );
    }

    function pointerUp() {
        if (!isDragging) return;
        isDragging = false;
        const delta = currentX - startX;
        const threshold = 80;
        el.style.transition = "transform 0.2s ease, opacity 0.2s ease";
        if (Math.abs(delta) > threshold) {
            el.classList.add("removed");
            setTimeout(() => {
                el.remove();
                updateNotifCounter();
                checkWinCondition();
            }, 200);
        } else {
            el.style.transform = "translateX(0)";
            el.style.opacity = "1";
        }
    }

    el.addEventListener("mousedown", pointerDown);
    document.addEventListener("mousemove", pointerMove);
    document.addEventListener("mouseup", pointerUp);

    el.addEventListener("touchstart", pointerDown, { passive: true });
    el.addEventListener("touchmove", pointerMove, { passive: true });
    el.addEventListener("touchend", pointerUp);
    el.addEventListener("touchcancel", pointerUp);
}

phonePlayBtn.addEventListener("click", () => {
    resetGame();
    gameState.started = true;
    phonePlayBtn.style.display = "none";
    scheduleNotifs();
});

notifResetBtn.addEventListener("click", resetGame);

resetGame();

/* 2 */
const runnerField = document.getElementById("runnerField");
const runnerStartBtn = document.getElementById("runnerStartBtn");
const runnerStatus = document.getElementById("runnerStatus");
const runnerStepsLabel = document.getElementById("runnerStepsLabel");
const runnerRunsLabel = document.getElementById("runnerRunsLabel");

let runnerPlaying = false;
let runnerObstacles = [];
let runnerPlayer = null;
let runnerPlayerPos = { x: 0, y: 0 };
let runnerPlayerSpeed = 0; // px / ms
let runnerBaseObstacleSpeed = 0; // px / ms
let lastTimestamp = null;
let finishedRuns = 0;
let fieldRect = null;

const iconSvgs = [
    "./assets/icons/i.svg",
    "./assets/icons/d.svg",
    "./assets/icons/f.svg",
    "./assets/icons/tg.svg",
    "./assets/icons/tk.svg",
    "./assets/icons/tw.svg",
    "./assets/icons/v.svg",
    "./assets/icons/x.svg",
    "./assets/icons/y.svg",
];

const LANES = 5;

function updateFieldMetrics() {
    fieldRect = runnerField.getBoundingClientRect();
    const width = fieldRect.width;
    const height = fieldRect.height;

    runnerBaseObstacleSpeed = height / 1500;
    runnerPlayerSpeed = runnerBaseObstacleSpeed * 1.5;
}

function createPlayer() {
    if (runnerPlayer) runnerPlayer.remove();

    runnerPlayer = document.createElement("div");
    runnerPlayer.className = "runner-player";
    runnerPlayer.textContent = "🙂";
    runnerField.appendChild(runnerPlayer);

    fieldRect = runnerField.getBoundingClientRect();
    const startX = 10;
    const startY = fieldRect.height / 2 - 20;

    runnerPlayerPos.x = startX;
    runnerPlayerPos.y = startY;
    applyPlayerPosition();
}

function applyPlayerPosition() {
    if (!fieldRect) updateFieldMetrics();
    const maxX = fieldRect.width - runnerPlayer.offsetWidth;
    const maxY = fieldRect.height - runnerPlayer.offsetHeight;

    runnerPlayerPos.x = Math.max(0, Math.min(maxX, runnerPlayerPos.x));
    runnerPlayerPos.y = Math.max(0, Math.min(maxY, runnerPlayerPos.y));

    runnerPlayer.style.left = runnerPlayerPos.x + "px";
    runnerPlayer.style.top = runnerPlayerPos.y + "px";

    const progress = Math.min(
        100,
        Math.round((runnerPlayerPos.x / maxX) * 100)
    );
    runnerStepsLabel.textContent = "Пройдено: " + progress + "%";
}

const pressedKeys = {
    up: false,
    down: false,
    left: false,
    right: false
};

window.addEventListener("keydown", (e) => {
    switch (e.code) {
        case "ArrowUp":
        case "KeyW":
            pressedKeys.up = true;
            e.preventDefault();
            break;
        case "ArrowDown":
        case "KeyS":
            pressedKeys.down = true;
            e.preventDefault();
            break;
        case "ArrowLeft":
        case "KeyA":
            pressedKeys.left = true;
            e.preventDefault();
            break;
        case "ArrowRight":
        case "KeyD":
            pressedKeys.right = true;
            e.preventDefault();
            break;
    }
});

window.addEventListener("keyup", (e) => {
    switch (e.code) {
        case "ArrowUp":
        case "KeyW":
            pressedKeys.up = false;
            break;
        case "ArrowDown":
        case "KeyS":
            pressedKeys.down = false;
            break;
        case "ArrowLeft":
        case "KeyA":
            pressedKeys.left = false;
            break;
        case "ArrowRight":
        case "KeyD":
            pressedKeys.right = false;
            break;
    }
});


let mouseDown = false;
let touchDown = false;
let targetCursorX = 0;
let targetCursorY = 0;

function updateTargetCursor(e) {
    const rect = runnerField.getBoundingClientRect();
    targetCursorX = e.clientX - rect.left;
    targetCursorY = e.clientY - rect.top;
}

runnerField.addEventListener("mousedown", (e) => {
    mouseDown = true;
    updateTargetCursor(e);
});
runnerField.addEventListener("mouseup", () => {
    mouseDown = false;
});
runnerField.addEventListener("mousemove", (e) => {
    if (mouseDown) updateTargetCursor(e);
});

runnerField.addEventListener("touchstart", (e) => {
    touchDown = true;
    const t = e.touches[0];
    updateTargetCursor(t);
    e.preventDefault();
}, { passive: false });

runnerField.addEventListener("touchend", () => {
    touchDown = false;
});
runnerField.addEventListener("touchmove", (e) => {
    if (touchDown) {
        const t = e.touches[0];
        updateTargetCursor(t);
        e.preventDefault();
    }
}, { passive: false });


let swipeStartX = 0;
let swipeStartY = 0;
runnerField.addEventListener(
    "touchstart",
    (e) => {
        const t = e.touches[0];
        swipeStartX = t.clientX;
        swipeStartY = t.clientY;
    },
    { passive: true }
);
runnerField.addEventListener(
    "touchend",
    (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - swipeStartX;
        const dy = t.clientY - swipeStartY;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

        const step = 60;
        if (Math.abs(dx) > Math.abs(dy)) {
            runnerPlayerPos.x += dx > 0 ? step : -step;
        } else {
            runnerPlayerPos.y += dy > 0 ? step : -step;
        }
        applyPlayerPosition();
    },
    { passive: true }
);

function spawnObstacle() {
    if (!runnerPlaying || !fieldRect) return;

    const laneWidth = fieldRect.width / LANES;
    const freeLanes = [];

    for (let lane = 0; lane < LANES; lane++) {
        const laneXCenter = lane * laneWidth + laneWidth / 2;
        const laneOccupied = runnerObstacles.some((o) => {
            const oCenter = o.x + o.width / 2;
            return Math.abs(oCenter - laneXCenter) < laneWidth * 0.7;
        });
        if (!laneOccupied) freeLanes.push(lane);
    }

    if (freeLanes.length === 0) return;

    const chosenLane =
        freeLanes[Math.floor(Math.random() * freeLanes.length)];
    const x = chosenLane * laneWidth + laneWidth / 2;
    const dir = Math.random() < 0.5 ? 1 : -1; // 1: вниз, -1: вверх
    const speed = runnerBaseObstacleSpeed;

    const icon = iconSvgs[Math.floor(Math.random() * iconSvgs.length)];

    const el = document.createElement("div");
    el.className = "runner-obstacle";
    el.style.backgroundImage = `url("${icon}")`;
    runnerField.appendChild(el);

    const width = el.offsetWidth || 64;
    const height = el.offsetHeight || 64;

    const startY = dir === 1 ? -height : fieldRect.height;

    const obstacle = {
        el,
        x: x - width / 2,
        y: startY,
        width,
        height,
        dir,
        speed
    };

    el.style.left = obstacle.x + "px";
    el.style.top = obstacle.y + "px";

    runnerObstacles.push(obstacle);
}

let spawnTimeout = null;
function scheduleNextSpawn() {
    const delay = 200 + Math.random() * 400;
    spawnTimeout = setTimeout(() => {
        spawnObstacle();
        scheduleNextSpawn();
    }, delay);
}

function circlesOverlap(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distSq = dx * dx + dy * dy;
    const radSum = r1 + r2;
    return distSq <= radSum * radSum;
}

function checkCollision() {
    const pw = runnerPlayer.offsetWidth;
    const ph = runnerPlayer.offsetHeight;

    // центр и радиус игрока
    const pCx = runnerPlayerPos.x + pw / 2;
    const pCy = runnerPlayerPos.y + ph / 2;
    const pR  = Math.min(pw, ph) / 2;

    return runnerObstacles.some((o) => {
        const ow = o.width;
        const oh = o.height;
        const oCx = o.x + ow / 2;
        const oCy = o.y + oh / 2;
        const oR  = Math.min(ow, oh) / 2;

        return circlesOverlap(pCx, pCy, pR, oCx, oCy, oR);
    });
}


function gameLoop(timestamp) {
    if (!runnerPlaying) return;

    if (lastTimestamp == null) {
        lastTimestamp = timestamp;
    }
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // движение игрока
    let moveX = 0;
    let moveY = 0;

    if (pressedKeys.up) moveY -= 1;
    if (pressedKeys.down) moveY += 1;
    if (pressedKeys.left) moveX -= 1;
    if (pressedKeys.right) moveX += 1;

    const anyKeyPressed =
        pressedKeys.up || pressedKeys.down ||
        pressedKeys.left || pressedKeys.right;

    if (!anyKeyPressed && (mouseDown || touchDown)) {
        const targetX = targetCursorX - runnerPlayer.offsetWidth / 2;
        const targetY = targetCursorY - runnerPlayer.offsetHeight / 2;

        const dx = targetX - runnerPlayerPos.x;
        const dy = targetY - runnerPlayerPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            moveX += dx / dist;
            moveY += dy / dist;
        }
    }


    if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY) || 1;
        moveX /= len;
        moveY /= len;
        runnerPlayerPos.x += moveX * runnerPlayerSpeed * dt;
        runnerPlayerPos.y += moveY * runnerPlayerSpeed * dt;
        applyPlayerPosition();
    }

    runnerObstacles.forEach((o) => {
        o.y += o.dir * o.speed * dt;
        o.el.style.top = o.y + "px";
    });

    runnerObstacles = runnerObstacles.filter((o) => {
        const outside = o.y > fieldRect.height || o.y + o.height < 0;
        if (outside) o.el.remove();
        return !outside;
    });

    const maxX = fieldRect.width - runnerPlayer.offsetWidth;
    if (runnerPlayerPos.x >= maxX - 5) {
        finishedRuns++;
        runnerRunsLabel.textContent = "Завершено: " + finishedRuns;
        runnerStatus.textContent = "Ты дошёл до края! Нажми старт, чтобы пройти ещё раз.";
        stopRunner();
        return;
    }

    if (checkCollision()) {
        runnerStatus.textContent = "Столкновение. Нажми старт, чтобы попробовать ещё раз.";
        stopRunner();
        return;
    }

    requestAnimationFrame(gameLoop);
}


function startRunner() {
    if (runnerPlaying) return;
    updateFieldMetrics();
    runnerObstacles.forEach((o) => o.el.remove());
    runnerObstacles = [];
    lastTimestamp = null;

    createPlayer();
    runnerStatus.textContent =
        "Двигайся вправо и избегай иконок.";
    runnerPlaying = true;
    scheduleNextSpawn();
    requestAnimationFrame(gameLoop);
}

function stopRunner() {
    runnerPlaying = false;
    lastTimestamp = null;
    pressedKeys.up = false;
    pressedKeys.down = false;
    pressedKeys.left = false;
    pressedKeys.right = false;
    if (spawnTimeout) clearTimeout(spawnTimeout);
    spawnTimeout = null;
}


runnerStartBtn.addEventListener("click", startRunner);

window.addEventListener("resize", () => {
    if (!runnerField) return;
    const oldRect = fieldRect;
    updateFieldMetrics();
    if (!oldRect) return;

    const kx = fieldRect.width / oldRect.width;
    const ky = fieldRect.height / oldRect.height;

    // масштабируем позиции
    runnerPlayerPos.x *= kx;
    runnerPlayerPos.y *= ky;
    applyPlayerPosition();

    runnerObstacles.forEach((o) => {
        o.x *= kx;
        o.y *= ky;
        o.el.style.left = o.x + "px";
        o.el.style.top = o.y + "px";
    });
});

iconSvgs.forEach(url => {
    const svg = new Image();
    svg.src = url;
});

updateFieldMetrics();
createPlayer();
runnerStatus.textContent = "Нажми старт";


/* 3 */
const memoryGrid = document.getElementById("memoryGrid");
const memoryStatus = document.getElementById("memoryStatus");
const memoryResetBtn = document.getElementById("memoryResetBtn");

const memoryPairs = [
    "./assets/images/m1.png",
    "./assets/images/m2.png",
    "./assets/images/m3.png",
    "./assets/images/m4.png"
];
let memoryCards = [];
let firstCard = null;
let lockBoard = false;
let matchedCount = 0;

function createMemoryDeck() {
    const values = [...memoryPairs, ...memoryPairs].sort(
        () => Math.random() - 0.5
    );
    memoryGrid.innerHTML = "";
    memoryCards = [];
    matchedCount = 0;

    values.forEach((value, index) => {
        const card = document.createElement("div");
        card.className = "memory-card";
        card.dataset.value = value;
        card.dataset.index = index;

        card.innerHTML = `
        <div class="memory-card-inner">
            <div class="memory-face memory-back">?</div>
            <div class="memory-face memory-front" style="background-image: url('${value}');"></div>
        </div>
    `;

        card.addEventListener("click", onCardClick);
        memoryGrid.appendChild(card);
        memoryCards.push(card);
    });

    memoryStatus.textContent = "Найди пары картинок.";
    firstCard = null;
    lockBoard = false;
}

function onCardClick(e) {
    const card = e.currentTarget;
    if (lockBoard || card.classList.contains("flipped")) return;

    card.classList.add("flipped");

    if (!firstCard) {
        firstCard = card;
        return;
    }

    const secondCard = card;

    if (firstCard.dataset.value === secondCard.dataset.value) {
        matchedCount++;
        memoryStatus.textContent =
            matchedCount === memoryPairs.length
                ? "Все пары найдены!"
                : "Есть совпадение. Осталось пар: " +
                (memoryPairs.length - matchedCount) +
                ".";
        firstCard = null;
    } else {
        lockBoard = true;
        memoryStatus.textContent = "Не пара. Попробуй ещё.";
        setTimeout(() => {
            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");
            firstCard = null;
            lockBoard = false;
        }, 700);
    }
}

memoryResetBtn.addEventListener("click", createMemoryDeck);
createMemoryDeck();
