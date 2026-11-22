const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const canvasWrap = document.getElementById("canvasWrap");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");
const overlay = document.getElementById("overlay");
const dpad = document.getElementById("dpad");
const speedText = document.getElementById("speed");
const slowBtn = document.getElementById("slowBtn");
const fastBtn = document.getElementById("fastBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const musicText = document.getElementById("musicValue");
const eatText = document.getElementById("eatValue");

const customBtn = document.getElementById("customBtn");
const customPanel = document.getElementById("customPanel");
const closeCustomBtn = document.getElementById("closeCustomBtn");
const skinText = document.getElementById("skinValue");
const mapText = document.getElementById("mapValue");
const foodText = document.getElementById("foodValue");
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");

const nameInput = document.getElementById("nameInput");
const resultScreen = document.getElementById("resultScreen");
const resultCloseBtn = document.getElementById("resultCloseBtn");
const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");

const jumpscare = document.getElementById("jumpscare");
const restartBtn = document.getElementById("restartBtn");

const scareSound = document.getElementById("scareSound");
const bgMusic = document.getElementById("bgMusic");
const eatSound = document.getElementById("eatSound");

const foodImg = document.getElementById("foodImg");
const headImg = document.getElementById("headImg");

const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");

const TILE_PC = 30;
const TILE_PHONE = 25;
let tile = TILE_PC;

const COLOR_FOOD = "#ff3d81";

const startMessage = "THINK FAST.";

const SKIN_NAMES = ["⚡ ", "🩸 ", "☄️ ", "🕷️ ", "🔥 "];
const SKIN_LIGHT = ["#fff176", "#7f0000", "#8a8f99", "#2b2b2b", "#ffb300"];
const SKIN_DARK = ["#ffb300", "#000000", "#1f2226", "#000000", "#d50000"];
const SKIN_LINE = ["#00b0ff", "#ff1744", "#ff6d00", "#76ff03", "#ffea00"];
const SKIN_GLOW = ["#00b0ff", "#ff1744", "#ff6d00", "#76ff03", "#ff3d00"];
const SKIN_EYE = ["#00e5ff", "#ff1744", "#ffab00", "#b2ff59", "#ffff00"];

const MAP_NAMES = [" BLOOD ARENA", " GRAVEYARD", " INFERNO", " CYBER GRID", " FOREST"];

const FOOD_NAMES = ["NAILONG", " APPLE", " BURGER", " MOUSE"];
const FOOD_EMOJI = ["", "🍎", "🍔", "🐭"];

let snake = [];
let food = {};
let walls = [];
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;

let score = 0;
let best = Number(localStorage.getItem("snakeBest")) || 0;

let speed = 5;
let gameLoop;
let running = false;

let countdownTimer;
let countdownText = "";

let musicVolume = loadNumber("snakeMusic", 3);
let eatVolume = loadNumber("snakeEat", 10);
let skinChoice = loadNumber("snakeSkin", 0);
let foodChoice = loadNumber("snakeFood", 0);
let mapChoice = loadNumber("snakeMap", 3);

let playerName = "";

bestText.textContent = best;
speedText.textContent = speed;

function loadNumber(key, defaultValue) {
    const saved = localStorage.getItem(key);
    if (saved === null) {
        return defaultValue;
    }
    return Number(saved);
}

function limit(value, min, max) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

function setTopButtons(enabled) {
    settingsBtn.disabled = !enabled;
    customBtn.disabled = !enabled;
    nameInput.disabled = !enabled;
}

function showOverlay() {
    overlay.classList.remove("hidden");
}

function hideOverlay() {
    overlay.classList.add("hidden");
}

function fitCanvas() {
    if (window.innerWidth <= 700) {
        tile = TILE_PHONE;
    } else {
        tile = TILE_PC;
    }

    const w = canvasWrap.clientWidth;
    const h = canvasWrap.clientHeight;

    const cols = Math.max(8, Math.floor((w - 4) / tile));
    const rows = Math.max(8, Math.floor((h - 4) / tile));

    canvas.width = cols * tile;
    canvas.height = rows * tile;
}

function getDelay() {
    return 200 - speed * 16;
}

function changeSpeed(amount) {
    speed = limit(speed + amount, 1, 10);
    speedText.textContent = speed;

    if (running) {
        clearInterval(gameLoop);
        gameLoop = setInterval(updateGame, getDelay());
    }
}

function stopSounds() {
    scareSound.pause();
    scareSound.currentTime = 0;
    bgMusic.pause();
    bgMusic.currentTime = 0;
}

function playEatSound() {
    eatSound.volume = eatVolume / 10;
    eatSound.currentTime = 0;
    eatSound.play();
}

function isOnSnake(x, y) {
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) {
            return true;
        }
    }
    return false;
}

function isOnWall(x, y) {
    for (let i = 0; i < walls.length; i++) {
        if (walls[i].x === x && walls[i].y === y) {
            return true;
        }
    }
    return false;
}

function addWall(col, row) {
    const cols = canvas.width / tile;
    const rows = canvas.height / tile;
    const startCol = Math.floor(cols / 4);
    const startRow = Math.floor(rows / 2);

    if (col < 0 || col >= cols || row < 0 || row >= rows) {
        return;
    }

    if (row === startRow && col >= startCol && col < startCol + 9) {
        return;
    }

    if (isOnWall(col * tile, row * tile)) {
        return;
    }

    walls.push({ x: col * tile, y: row * tile });
}

function addBlock(col, row) {
    addWall(col, row);
    addWall(col + 1, row);
    addWall(col, row + 1);
    addWall(col + 1, row + 1);
}

function addSpots(list) {
    const cols = canvas.width / tile;
    const rows = canvas.height / tile;

    for (let i = 0; i < list.length; i++) {
        addWall(Math.floor(cols * list[i][0]), Math.floor(rows * list[i][1]));
    }
}

function addBar(rowFraction, fromFraction, toFraction) {
    const cols = canvas.width / tile;
    const rows = canvas.height / tile;
    const row = Math.floor(rows * rowFraction);

    for (let c = Math.floor(cols * fromFraction); c < Math.floor(cols * toFraction); c++) {
        addWall(c, row);
    }
}

function makeWalls() {
    walls = [];

    const cols = canvas.width / tile;
    const rows = canvas.height / tile;

    if (mapChoice === 0) {
        const left = Math.floor(cols / 4);
        const right = Math.floor(cols * 3 / 4) - 1;
        const top = Math.floor(rows / 4);
        const bottom = Math.floor(rows * 3 / 4) - 1;

        addBlock(left, top);
        addBlock(right, top);
        addBlock(left, bottom);
        addBlock(right, bottom);
    } else if (mapChoice === 1) {
        addSpots([
            [0.18, 0.18], [0.42, 0.14], [0.7, 0.2], [0.88, 0.35], [0.55, 0.45],
            [0.12, 0.62], [0.38, 0.78], [0.62, 0.7], [0.85, 0.82]
        ]);
    } else if (mapChoice === 2) {
        const lava = [[0.2, 0.2], [0.62, 0.18], [0.78, 0.72], [0.28, 0.78], [0.5, 0.4], [0.72, 0.5]];

        for (let i = 0; i < lava.length; i++) {
            const c = Math.floor(cols * lava[i][0]);
            const r = Math.floor(rows * lava[i][1]);
            addWall(c, r);
            addWall(c + 1, r);
        }
    } else if (mapChoice === 3) {
        addBar(0.25, 0.15, 0.4);
        addBar(0.25, 0.6, 0.85);
        addBar(0.75, 0.15, 0.4);
        addBar(0.75, 0.6, 0.85);
    } else {
        addSpots([
            [0.1, 0.15], [0.3, 0.1], [0.52, 0.2], [0.8, 0.12], [0.9, 0.4], [0.18, 0.38],
            [0.7, 0.35], [0.12, 0.72], [0.4, 0.7], [0.62, 0.8], [0.88, 0.75], [0.3, 0.9]
        ]);
    }
}

function fillFloor(centerColor, edgeColor) {
    const w = bgCanvas.width;
    const h = bgCanvas.height;
    const g = bgCtx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, centerColor);
    g.addColorStop(1, edgeColor);
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, w, h);
}

function drawFloorGrid(color) {
    bgCtx.strokeStyle = color;
    bgCtx.lineWidth = 1;
    bgCtx.beginPath();
    for (let x = tile; x < bgCanvas.width; x += tile) {
        bgCtx.moveTo(x + 0.5, 0);
        bgCtx.lineTo(x + 0.5, bgCanvas.height);
    }
    for (let y = tile; y < bgCanvas.height; y += tile) {
        bgCtx.moveTo(0, y + 0.5);
        bgCtx.lineTo(bgCanvas.width, y + 0.5);
    }
    bgCtx.stroke();
}

function drawBorder(color, glowColor, thickness) {
    bgCtx.save();
    bgCtx.strokeStyle = color;
    bgCtx.lineWidth = thickness;
    bgCtx.shadowColor = glowColor;
    bgCtx.shadowBlur = 18;
    bgCtx.strokeRect(thickness / 2, thickness / 2, bgCanvas.width - thickness, bgCanvas.height - thickness);
    bgCtx.restore();
}

function drawFog(fx, fy, radius, rgb, alpha) {
    const x = bgCanvas.width * fx;
    const y = bgCanvas.height * fy;
    const g = bgCtx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, "rgba(" + rgb + "," + alpha + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    bgCtx.fillStyle = g;
    bgCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawVignette(strength) {
    const w = bgCanvas.width;
    const h = bgCanvas.height;
    const g = bgCtx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(0, 0, 0, 0)");
    g.addColorStop(1, "rgba(0, 0, 0, " + strength + ")");
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, w, h);
}

function drawEdgeGlow(rgb, alpha) {
    const w = bgCanvas.width;
    const h = bgCanvas.height;
    const d = tile * 1.8;
    const strong = "rgba(" + rgb + "," + alpha + ")";
    const none = "rgba(" + rgb + ",0)";

    let g = bgCtx.createLinearGradient(0, 0, 0, d);
    g.addColorStop(0, strong);
    g.addColorStop(1, none);
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, w, d);

    g = bgCtx.createLinearGradient(0, h, 0, h - d);
    g.addColorStop(0, strong);
    g.addColorStop(1, none);
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, h - d, w, d);

    g = bgCtx.createLinearGradient(0, 0, d, 0);
    g.addColorStop(0, strong);
    g.addColorStop(1, none);
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, d, h);

    g = bgCtx.createLinearGradient(w, 0, w - d, 0);
    g.addColorStop(0, strong);
    g.addColorStop(1, none);
    bgCtx.fillStyle = g;
    bgCtx.fillRect(w - d, 0, d, h);
}

function drawLine(points, color, glowColor, width) {
    bgCtx.save();
    bgCtx.strokeStyle = color;
    bgCtx.lineWidth = width;
    bgCtx.lineJoin = "round";
    bgCtx.lineCap = "round";
    bgCtx.shadowColor = glowColor;
    bgCtx.shadowBlur = 12;
    bgCtx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const px = points[i][0] * bgCanvas.width;
        const py = points[i][1] * bgCanvas.height;
        if (i === 0) {
            bgCtx.moveTo(px, py);
        } else {
            bgCtx.lineTo(px, py);
        }
    }
    bgCtx.stroke();
    bgCtx.restore();
}

function drawSplat(fx, fy, size) {
    const x = bgCanvas.width * fx;
    const y = bgCanvas.height * fy;
    const r = tile * 0.45 * size;

    bgCtx.fillStyle = "rgba(120, 0, 10, 0.55)";
    bgCtx.beginPath();
    bgCtx.arc(x, y, r, 0, Math.PI * 2);
    bgCtx.fill();

    for (let i = 0; i < 6; i++) {
        const angle = i * 1.05;
        bgCtx.beginPath();
        bgCtx.arc(x + Math.cos(angle) * r * 1.6, y + Math.sin(angle) * r * 1.6, r * 0.25, 0, Math.PI * 2);
        bgCtx.fill();
    }
}

function drawBloodArena() {
    fillFloor("#2a0707", "#050000");
    drawFloorGrid("rgba(255, 23, 68, 0.08)");

    drawSplat(0.15, 0.2, 1);
    drawSplat(0.82, 0.16, 1.4);
    drawSplat(0.7, 0.58, 0.9);
    drawSplat(0.25, 0.82, 1.3);
    drawSplat(0.9, 0.86, 0.8);

    drawFog(0.5, 0.5, tile * 8, "150, 0, 20", 0.18);
    drawEdgeGlow("255, 23, 68", 0.3);
    drawBorder("#ff1744", "#ff1744", 6);
    drawVignette(0.45);
}

function drawDeadTree(fx, fy) {
    const x = bgCanvas.width * fx;
    const y = bgCanvas.height * fy;

    drawFog(fx, fy, tile * 2.5, "126, 87, 194", 0.18);

    bgCtx.save();
    bgCtx.strokeStyle = "#05070b";
    bgCtx.lineWidth = 4;
    bgCtx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
        const angle = i * 0.9;
        const len = tile * (1.1 + (i % 3) * 0.35);
        const ex = x + Math.cos(angle) * len;
        const ey = y + Math.sin(angle) * len;

        bgCtx.beginPath();
        bgCtx.moveTo(x, y);
        bgCtx.lineTo(ex, ey);
        bgCtx.lineTo(ex + Math.cos(angle + 0.6) * len * 0.4, ey + Math.sin(angle + 0.6) * len * 0.4);
        bgCtx.stroke();
    }
    bgCtx.restore();
}

function drawGraveyard() {
    fillFloor("#1a2236", "#04060c");
    drawFloorGrid("rgba(140, 160, 220, 0.04)");

    drawFog(0.2, 0.3, tile * 3, "10, 30, 20", 0.5);
    drawFog(0.75, 0.7, tile * 3, "10, 30, 20", 0.5);

    drawFog(0.3, 0.25, tile * 4, "200, 210, 235", 0.13);
    drawFog(0.75, 0.4, tile * 4, "200, 210, 235", 0.12);
    drawFog(0.45, 0.75, tile * 4, "200, 210, 235", 0.13);
    drawFog(0.85, 0.88, tile * 3, "200, 210, 235", 0.1);
    drawFog(0.12, 0.8, tile * 3, "200, 210, 235", 0.1);

    drawDeadTree(0.04, 0.06);
    drawDeadTree(0.96, 0.07);
    drawDeadTree(0.05, 0.94);
    drawDeadTree(0.95, 0.93);

    drawBorder("#5e4b9a", "#7e57c2", 4);
    drawVignette(0.5);
}

function drawInferno() {
    fillFloor("#2a140c", "#060201");

    const cols = bgCanvas.width / tile;
    const rows = bgCanvas.height / tile;
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            if ((c * 7 + r * 13) % 5 === 0) {
                bgCtx.fillStyle = "rgba(255, 255, 255, 0.035)";
                bgCtx.fillRect(c * tile + 1, r * tile + 1, tile - 2, tile - 2);
            }
        }
    }
    drawFloorGrid("rgba(255, 120, 40, 0.09)");

    const cracks = [
        [[0.0, 0.3], [0.12, 0.34], [0.2, 0.3], [0.3, 0.42]],
        [[0.6, 0.0], [0.64, 0.12], [0.58, 0.22], [0.66, 0.3]],
        [[1.0, 0.62], [0.88, 0.6], [0.8, 0.68], [0.7, 0.66]],
        [[0.2, 1.0], [0.26, 0.88], [0.18, 0.8], [0.3, 0.72]]
    ];
    for (let i = 0; i < cracks.length; i++) {
        drawLine(cracks[i], "#ff6d00", "#ff3d00", 4);
        drawLine(cracks[i], "#ffe0b2", "rgba(0, 0, 0, 0)", 1.5);
    }

    drawEdgeGlow("255, 80, 0", 0.5);
    drawBorder("#ff5722", "#ff3d00", 6);
    drawVignette(0.35);
}

function drawBracket(x, y, dirX, dirY) {
    const len = tile * 1.2;
    bgCtx.beginPath();
    bgCtx.moveTo(x + dirX * len, y);
    bgCtx.lineTo(x, y);
    bgCtx.lineTo(x, y + dirY * len);
    bgCtx.stroke();
}

function drawCyberGrid() {
    const w = bgCanvas.width;
    const h = bgCanvas.height;

    fillFloor("#071433", "#01030a");

    drawFloorGrid("rgba(0, 176, 255, 0.28)");

    bgCtx.save();
    bgCtx.strokeStyle = "rgba(0, 229, 255, 0.55)";
    bgCtx.lineWidth = 1.5;
    bgCtx.shadowColor = "#00e5ff";
    bgCtx.shadowBlur = 8;
    bgCtx.beginPath();
    for (let x = tile * 4; x < w; x += tile * 4) {
        bgCtx.moveTo(x + 0.5, 0);
        bgCtx.lineTo(x + 0.5, h);
    }
    for (let y = tile * 4; y < h; y += tile * 4) {
        bgCtx.moveTo(0, y + 0.5);
        bgCtx.lineTo(w, y + 0.5);
    }
    bgCtx.stroke();
    bgCtx.restore();

    drawLine([[0, 0.12], [0.1, 0.12], [0.1, 0.06], [0.3, 0.06]], "rgba(255, 0, 200, 0.7)", "#ff00c8", 2);
    drawLine([[1, 0.9], [0.9, 0.9], [0.9, 0.95], [0.7, 0.95]], "rgba(255, 0, 200, 0.7)", "#ff00c8", 2);
    drawLine([[0, 0.88], [0.08, 0.88], [0.08, 0.78]], "rgba(0, 229, 255, 0.7)", "#00e5ff", 2);
    drawLine([[1, 0.2], [0.92, 0.2], [0.92, 0.3], [0.85, 0.3]], "rgba(0, 229, 255, 0.7)", "#00e5ff", 2);

    drawEdgeGlow("0, 229, 255", 0.25);

    bgCtx.save();
    bgCtx.strokeStyle = "#ff00c8";
    bgCtx.lineWidth = 3;
    bgCtx.shadowColor = "#ff00c8";
    bgCtx.shadowBlur = 10;
    drawBracket(12, 12, 1, 1);
    drawBracket(w - 12, 12, -1, 1);
    drawBracket(12, h - 12, 1, -1);
    drawBracket(w - 12, h - 12, -1, -1);
    bgCtx.restore();

    drawBorder("#00e5ff", "#00e5ff", 4);
    drawVignette(0.3);
}

function drawGlowEyes(fx, fy) {
    bgCtx.save();
    bgCtx.fillStyle = "#ffee58";
    bgCtx.shadowColor = "#ffee58";
    bgCtx.shadowBlur = 10;
    for (let k = -1; k <= 1; k += 2) {
        bgCtx.beginPath();
        bgCtx.arc(bgCanvas.width * fx + k * 7, bgCanvas.height * fy, 3, 0, Math.PI * 2);
        bgCtx.fill();
    }
    bgCtx.restore();
}

function drawForest() {
    fillFloor("#0f3318", "#020a04");

    const cols = bgCanvas.width / tile;
    const rows = bgCanvas.height / tile;
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            if ((c * 5 + r * 11) % 4 === 0) {
                bgCtx.fillStyle = "rgba(0, 40, 10, 0.45)";
                bgCtx.beginPath();
                bgCtx.arc(c * tile + tile / 2, r * tile + tile / 2, tile * 0.3, 0, Math.PI * 2);
                bgCtx.fill();
            }
            if ((c * 3 + r * 7) % 6 === 0) {
                bgCtx.fillStyle = "rgba(100, 180, 100, 0.1)";
                bgCtx.beginPath();
                bgCtx.arc(c * tile + tile * 0.3, r * tile + tile * 0.7, tile * 0.12, 0, Math.PI * 2);
                bgCtx.fill();
            }
        }
    }

    drawFog(0.25, 0.3, tile * 4, "170, 220, 190", 0.12);
    drawFog(0.7, 0.5, tile * 4, "170, 220, 190", 0.12);
    drawFog(0.4, 0.85, tile * 4, "170, 220, 190", 0.12);
    drawFog(0.85, 0.15, tile * 3, "170, 220, 190", 0.1);
    drawFog(0.1, 0.8, tile * 3, "170, 220, 190", 0.1);

    drawGlowEyes(0.06, 0.5);
    drawGlowEyes(0.94, 0.62);
    drawGlowEyes(0.5, 0.05);

    drawBorder("#2e7d32", "#69f0ae", 4);
    drawVignette(0.7);
}

function drawWall(x, y) {
    const t = tile;
    bgCtx.save();

    if (mapChoice === 0) {
        bgCtx.shadowColor = "#ff1744";
        bgCtx.shadowBlur = 14;
        bgCtx.fillStyle = "#1a1a1f";
        bgCtx.beginPath();
        bgCtx.roundRect(x + 2, y + 2, t - 4, t - 4, 6);
        bgCtx.fill();
        bgCtx.shadowBlur = 0;
        bgCtx.strokeStyle = "#ff1744";
        bgCtx.lineWidth = 2;
        bgCtx.stroke();
        bgCtx.strokeStyle = "rgba(255, 23, 68, 0.4)";
        bgCtx.lineWidth = 1;
        bgCtx.strokeRect(x + t * 0.3, y + t * 0.3, t * 0.4, t * 0.4);
    } else if (mapChoice === 1) {
        const tx = x + t * 0.2;
        const tw = t * 0.6;
        const ty = y + t * 0.12;
        const th = t * 0.76;
        const g = bgCtx.createLinearGradient(tx, ty, tx + tw, ty + th);
        g.addColorStop(0, "#8b93a7");
        g.addColorStop(1, "#4a5062");

        bgCtx.shadowColor = "#7e57c2";
        bgCtx.shadowBlur = 8;
        bgCtx.fillStyle = g;
        bgCtx.beginPath();
        bgCtx.moveTo(tx, ty + th);
        bgCtx.lineTo(tx, ty + tw / 2);
        bgCtx.arc(tx + tw / 2, ty + tw / 2, tw / 2, Math.PI, 0);
        bgCtx.lineTo(tx + tw, ty + th);
        bgCtx.closePath();
        bgCtx.fill();
        bgCtx.shadowBlur = 0;
        bgCtx.strokeStyle = "#2a2f3f";
        bgCtx.lineWidth = 2;
        bgCtx.stroke();

        bgCtx.beginPath();
        bgCtx.moveTo(x + t * 0.5, y + t * 0.3);
        bgCtx.lineTo(x + t * 0.5, y + t * 0.64);
        bgCtx.moveTo(x + t * 0.38, y + t * 0.42);
        bgCtx.lineTo(x + t * 0.62, y + t * 0.42);
        bgCtx.stroke();
    } else if (mapChoice === 2) {
        bgCtx.fillStyle = "#1a0a05";
        bgCtx.beginPath();
        bgCtx.roundRect(x + 1, y + 1, t - 2, t - 2, 8);
        bgCtx.fill();
        bgCtx.strokeStyle = "#4e2a14";
        bgCtx.lineWidth = 2;
        bgCtx.stroke();

        const g = bgCtx.createLinearGradient(x, y, x + t, y + t);
        g.addColorStop(0, "#ff6d00");
        g.addColorStop(1, "#bf360c");
        bgCtx.shadowColor = "#ff3d00";
        bgCtx.shadowBlur = 14;
        bgCtx.fillStyle = g;
        bgCtx.beginPath();
        bgCtx.roundRect(x + 6, y + 6, t - 12, t - 12, 6);
        bgCtx.fill();
        bgCtx.shadowBlur = 0;

        bgCtx.fillStyle = "rgba(255, 235, 59, 0.7)";
        bgCtx.beginPath();
        bgCtx.arc(x + t * 0.4, y + t * 0.42, t * 0.08, 0, Math.PI * 2);
        bgCtx.fill();
    } else if (mapChoice === 3) {
        bgCtx.shadowColor = "#00e5ff";
        bgCtx.shadowBlur = 12;
        bgCtx.fillStyle = "#06122b";
        bgCtx.beginPath();
        bgCtx.roundRect(x + 2, y + 2, t - 4, t - 4, 5);
        bgCtx.fill();
        bgCtx.strokeStyle = "#00e5ff";
        bgCtx.lineWidth = 2;
        bgCtx.stroke();
        bgCtx.shadowBlur = 0;

        bgCtx.strokeStyle = "rgba(255, 0, 200, 0.7)";
        bgCtx.beginPath();
        bgCtx.moveTo(x + t * 0.25, y + t * 0.75);
        bgCtx.lineTo(x + t * 0.75, y + t * 0.25);
        bgCtx.stroke();
    } else {
        bgCtx.fillStyle = "#3e2723";
        bgCtx.fillRect(x + t * 0.42, y + t * 0.6, t * 0.16, t * 0.35);

        bgCtx.shadowColor = "#69f0ae";
        bgCtx.shadowBlur = 8;
        bgCtx.fillStyle = "#14401a";
        bgCtx.beginPath();
        bgCtx.arc(x + t * 0.5, y + t * 0.4, t * 0.3, 0, Math.PI * 2);
        bgCtx.arc(x + t * 0.3, y + t * 0.52, t * 0.22, 0, Math.PI * 2);
        bgCtx.arc(x + t * 0.7, y + t * 0.52, t * 0.22, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.shadowBlur = 0;

        bgCtx.fillStyle = "rgba(105, 240, 174, 0.15)";
        bgCtx.beginPath();
        bgCtx.arc(x + t * 0.42, y + t * 0.32, t * 0.12, 0, Math.PI * 2);
        bgCtx.fill();
    }

    bgCtx.restore();
}

function buildBackground() {
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;

    if (mapChoice === 0) {
        drawBloodArena();
    } else if (mapChoice === 1) {
        drawGraveyard();
    } else if (mapChoice === 2) {
        drawInferno();
    } else if (mapChoice === 3) {
        drawCyberGrid();
    } else {
        drawForest();
    }

    for (let i = 0; i < walls.length; i++) {
        drawWall(walls[i].x, walls[i].y);
    }
}

function drawPattern(x, y) {
    const t = tile;

    ctx.strokeStyle = SKIN_LINE[skinChoice];
    ctx.fillStyle = SKIN_LINE[skinChoice];
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = SKIN_GLOW[skinChoice];
    ctx.shadowBlur = 6;
    ctx.beginPath();

    if (skinChoice === 0) {
        ctx.moveTo(x + t * 0.55, y + t * 0.2);
        ctx.lineTo(x + t * 0.35, y + t * 0.5);
        ctx.lineTo(x + t * 0.62, y + t * 0.5);
        ctx.lineTo(x + t * 0.42, y + t * 0.8);
        ctx.stroke();
    } else if (skinChoice === 1) {
        ctx.arc(x + t / 2, y + t / 2, t * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + t / 2, y + t / 2, t * 0.07, 0, Math.PI * 2);
        ctx.fill();
    } else if (skinChoice === 2) {
        ctx.moveTo(x + t * 0.25, y + t * 0.25);
        ctx.lineTo(x + t * 0.45, y + t * 0.5);
        ctx.lineTo(x + t * 0.35, y + t * 0.78);
        ctx.moveTo(x + t * 0.62, y + t * 0.2);
        ctx.lineTo(x + t * 0.7, y + t * 0.55);
        ctx.lineTo(x + t * 0.58, y + t * 0.8);
        ctx.stroke();
    } else if (skinChoice === 3) {
        ctx.moveTo(x + t * 0.5, y + t * 0.2);
        ctx.lineTo(x + t * 0.78, y + t * 0.5);
        ctx.lineTo(x + t * 0.5, y + t * 0.8);
        ctx.lineTo(x + t * 0.22, y + t * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + t / 2, y + t / 2, t * 0.06, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.moveTo(x + t * 0.5, y + t * 0.15);
        ctx.quadraticCurveTo(x + t * 0.85, y + t * 0.55, x + t * 0.5, y + t * 0.85);
        ctx.quadraticCurveTo(x + t * 0.15, y + t * 0.55, x + t * 0.5, y + t * 0.15);
        ctx.fill();
    }
}

function drawEyes(part) {
    const x = part.x;
    const y = part.y;
    const t = tile;
    let eyeX = [];
    let eyeY = [];

    if (dx > 0) {
        eyeX = [x + t * 0.7, x + t * 0.7];
        eyeY = [y + t * 0.3, y + t * 0.7];
    } else if (dx < 0) {
        eyeX = [x + t * 0.3, x + t * 0.3];
        eyeY = [y + t * 0.3, y + t * 0.7];
    } else if (dy < 0) {
        eyeX = [x + t * 0.3, x + t * 0.7];
        eyeY = [y + t * 0.3, y + t * 0.3];
    } else {
        eyeX = [x + t * 0.3, x + t * 0.7];
        eyeY = [y + t * 0.7, y + t * 0.7];
    }

    for (let i = 0; i < 2; i++) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(eyeX[i], eyeY[i], t * 0.14, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = SKIN_EYE[skinChoice];
        ctx.shadowBlur = 8;
        ctx.fillStyle = SKIN_EYE[skinChoice];
        ctx.beginPath();
        ctx.arc(eyeX[i], eyeY[i], t * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(eyeX[i], eyeY[i], t * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSnakePart(part, index) {
    const x = part.x;
    const y = part.y;

    ctx.save();

    const grad = ctx.createLinearGradient(x, y, x + tile, y + tile);
    grad.addColorStop(0, SKIN_LIGHT[skinChoice]);
    grad.addColorStop(1, SKIN_DARK[skinChoice]);

    ctx.shadowColor = SKIN_GLOW[skinChoice];
    if (index === 0) {
        ctx.shadowBlur = 22;
    } else {
        ctx.shadowBlur = 12;
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, tile - 2, tile - 2, 11);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = SKIN_LINE[skinChoice];
    ctx.stroke();

    if (index > 0) {
        drawPattern(x, y);
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 4, tile - 12, 5, 3);
    ctx.fill();

    if (index === 0) {
        drawEyes(part);
    }

    ctx.restore();
}

function createFood() {
    do {
        food = {
            x: Math.floor(Math.random() * (canvas.width / tile)) * tile,
            y: Math.floor(Math.random() * (canvas.height / tile)) * tile
        };
    } while (isOnSnake(food.x, food.y) || isOnWall(food.x, food.y));
}

function resetGame() {
    const startX = Math.floor(canvas.width / tile / 4) * tile;
    const startY = Math.floor(canvas.height / tile / 2) * tile;

    snake = [
        { x: startX + tile * 2, y: startY },
        { x: startX + tile, y: startY },
        { x: startX, y: startY }
    ];

    dx = tile;
    dy = 0;
    nextDx = tile;
    nextDy = 0;

    score = 0;
    scoreText.textContent = score;

    makeWalls();
    buildBackground();
    createFood();
    drawGame();
}

function drawGame() {
    ctx.drawImage(bgCanvas, 0, 0);

    const glow = ctx.createRadialGradient(food.x + tile / 2, food.y + tile / 2, 0, food.x + tile / 2, food.y + tile / 2, tile * 0.9);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(food.x - tile, food.y - tile, tile * 3, tile * 3);

    if (foodChoice === 0 && foodImg.complete && foodImg.naturalWidth > 0) {
        ctx.drawImage(foodImg, food.x, food.y, tile, tile);
    } else if (foodChoice === 0) {
        ctx.save();
        ctx.shadowColor = COLOR_FOOD;
        ctx.shadowBlur = 16;
        ctx.fillStyle = COLOR_FOOD;
        ctx.beginPath();
        ctx.roundRect(food.x + 6, food.y + 6, tile - 12, tile - 12, 8);
        ctx.fill();
        ctx.restore();
    } else {
        ctx.save();
        ctx.font = (tile - 10) + "px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(FOOD_EMOJI[foodChoice], food.x + tile / 2, food.y + tile / 2 + 2);
        ctx.restore();
    }

    for (let i = snake.length - 1; i >= 0; i--) {
        if (i === 0 && headImg.complete && headImg.naturalWidth > 0) {
            let angle = 0;
            if (dx < 0) {
                angle = Math.PI;
            } else if (dy < 0) {
                angle = -Math.PI / 2;
            } else if (dy > 0) {
                angle = Math.PI / 2;
            }

            ctx.save();
            ctx.translate(snake[i].x + tile / 2, snake[i].y + tile / 2);
            ctx.rotate(angle);
            ctx.drawImage(headImg, -tile / 2, -tile / 2, tile, tile);
            ctx.restore();
        } else {
            drawSnakePart(snake[i], i);
        }
    }

    if (countdownText !== "") {
        const fontSize = Math.min(80, canvas.width / 4);
        ctx.save();
        ctx.fillStyle = "#fbff00";
        ctx.shadowColor = "#e2e600";
        ctx.shadowBlur = 24;
        ctx.font = "800 " + fontSize + "px Inter, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(countdownText, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
}

function updateGame() {
    dx = nextDx;
    dy = nextDy;

    const head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    const eating = (head.x === food.x && head.y === food.y);

    let hit = false;
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        hit = true;
    }

    if (isOnWall(head.x, head.y)) {
        hit = true;
    }

    for (let i = 0; i < snake.length; i++) {
        if (i === snake.length - 1 && !eating) {
            continue;
        }
        if (snake[i].x === head.x && snake[i].y === head.y) {
            hit = true;
        }
    }

    if (hit) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (eating) {
        score++;
        scoreText.textContent = score;
        playEatSound();

        if (score > best) {
            best = score;
            bestText.textContent = best;
            localStorage.setItem("snakeBest", best);
        }

        createFood();
    } else {
        snake.pop();
    }

    drawGame();
}

function endGame() {
    clearInterval(gameLoop);
    running = false;

    resultTitle.textContent = playerName.toUpperCase();
    resultScore.textContent = score + " POINTS";

    stopSounds();
    jumpscare.classList.add("active");
    scareSound.volume = 1;
    scareSound.play();
}

function startGame() {
    const name = nameInput.value.trim();
    if (name === "") {
        message.textContent = "Enter your name…";
        nameInput.focus();
        return;
    }
    playerName = name;
    nameInput.blur();

    clearInterval(gameLoop);
    clearInterval(countdownTimer);

    jumpscare.classList.remove("active");
    stopSounds();
    hideOverlay();
    setTopButtons(false);

    fitCanvas();
    resetGame();

    running = false;
    message.textContent = "Humanda...";
    startBtn.textContent = "RESTART";

    let count = 3;
    countdownText = count;
    drawGame();

    countdownTimer = setInterval(function () {
        count--;

        if (count > 0) {
            countdownText = count;
            drawGame();
        } else {
            clearInterval(countdownTimer);

            countdownText = "";
            running = true;
            message.textContent = "";

            bgMusic.volume = musicVolume / 10;
            bgMusic.play();

            gameLoop = setInterval(updateGame, getDelay());
        }
    }, 1000);
}

function closeResult() {
    resultScreen.classList.add("hidden");

    playerName = "";
    nameInput.value = "";
    message.textContent = startMessage;
    startBtn.textContent = "PLAY";
    setTopButtons(true);
    showOverlay();
}

function backToStart() {
    clearInterval(gameLoop);
    clearInterval(countdownTimer);
    countdownText = "";
    running = false;

    jumpscare.classList.remove("active");
    stopSounds();

    fitCanvas();
    resetGame();
    resultScreen.classList.remove("hidden");
}

function setDirection(dir) {
    if (dir === "up" && dy === 0) {
        nextDx = 0;
        nextDy = -tile;
    } else if (dir === "down" && dy === 0) {
        nextDx = 0;
        nextDy = tile;
    } else if (dir === "left" && dx === 0) {
        nextDx = -tile;
        nextDy = 0;
    } else if (dir === "right" && dx === 0) {
        nextDx = tile;
        nextDy = 0;
    }
}

function openSettings() {
    settingsPanel.classList.remove("hidden");

    bgMusic.volume = musicVolume / 10;
    bgMusic.currentTime = 0;
    bgMusic.play();
}

function closeSettings() {
    settingsPanel.classList.add("hidden");
    stopSounds();
}

function changeMusic(amount) {
    musicVolume = limit(musicVolume + amount, 0, 10);
    musicText.textContent = musicVolume * 10 + "%";
    localStorage.setItem("snakeMusic", musicVolume);
    bgMusic.volume = musicVolume / 10;
}

function changeEat(amount) {
    eatVolume = limit(eatVolume + amount, 0, 10);
    eatText.textContent = eatVolume * 10 + "%";
    localStorage.setItem("snakeEat", eatVolume);
    playEatSound();
}

function updatePreview() {
    const scale = Math.max(previewCanvas.width / canvas.width, previewCanvas.height / canvas.height);
    const sw = previewCanvas.width / scale;
    const sh = previewCanvas.height / scale;
    const sx = (canvas.width - sw) / 2;
    const sy = (canvas.height - sh) / 2;

    previewCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, previewCanvas.width, previewCanvas.height);
}

function openCustom() {
    customPanel.classList.remove("hidden");
    drawGame();
    updatePreview();
}

function closeCustom() {
    customPanel.classList.add("hidden");
}

function changeSkin(amount) {
    skinChoice = (skinChoice + amount + SKIN_NAMES.length) % SKIN_NAMES.length;
    localStorage.setItem("snakeSkin", skinChoice);
    skinText.textContent = SKIN_NAMES[skinChoice];
    drawGame();
    updatePreview();
}

function changeMap(amount) {
    mapChoice = (mapChoice + amount + MAP_NAMES.length) % MAP_NAMES.length;
    localStorage.setItem("snakeMap", mapChoice);
    mapText.textContent = MAP_NAMES[mapChoice];
    resetGame();
    updatePreview();
}

function changeFood(amount) {
    foodChoice = (foodChoice + amount + FOOD_NAMES.length) % FOOD_NAMES.length;
    localStorage.setItem("snakeFood", foodChoice);
    foodText.textContent = FOOD_NAMES[foodChoice];
    drawGame();
    updatePreview();
}

document.addEventListener("keydown", function (e) {
    if (!running) {
        return;
    }

    const key = e.key.toLowerCase();

    if (key === "arrowup" || key === "w") {
        setDirection("up");
    } else if (key === "arrowdown" || key === "s") {
        setDirection("down");
    } else if (key === "arrowleft" || key === "a") {
        setDirection("left");
    } else if (key === "arrowright" || key === "d") {
        setDirection("right");
    }

    if (key.startsWith("arrow")) {
        e.preventDefault();
    }
});

const dpadButtons = dpad.querySelectorAll(".dpad-btn");
for (let i = 0; i < dpadButtons.length; i++) {
    dpadButtons[i].addEventListener("pointerdown", function (e) {
        e.preventDefault();
        if (running) {
            setDirection(dpadButtons[i].dataset.dir);
        }
    });
}

let touchStartX = 0;
let touchStartY = 0;
let touchOnDpad = false;
const swipeMin = 24;

document.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

    touchOnDpad = (e.target.closest(".dpad") !== null);
});

document.addEventListener("touchmove", function (e) {
    if (!running) {
        return;
    }

    e.preventDefault();

    if (touchOnDpad) {
        return;
    }

    const diffX = e.touches[0].clientX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;

    if (Math.abs(diffX) < swipeMin && Math.abs(diffY) < swipeMin) {
        return;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
            setDirection("right");
        } else {
            setDirection("left");
        }
    } else {
        if (diffY > 0) {
            setDirection("down");
        } else {
            setDirection("up");
        }
    }

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

window.addEventListener("resize", function () {
    if (running || countdownText !== "") {
        return;
    }
    fitCanvas();
    resetGame();
});

settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
customBtn.addEventListener("click", openCustom);
closeCustomBtn.addEventListener("click", closeCustom);

nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        startGame();
    }
});

document.getElementById("musicDown").addEventListener("click", function () {
    changeMusic(-1);
});
document.getElementById("musicUp").addEventListener("click", function () {
    changeMusic(1);
});
document.getElementById("eatDown").addEventListener("click", function () {
    changeEat(-1);
});
document.getElementById("eatUp").addEventListener("click", function () {
    changeEat(1);
});

document.getElementById("skinPrev").addEventListener("click", function () {
    changeSkin(-1);
});
document.getElementById("skinNext").addEventListener("click", function () {
    changeSkin(1);
});
document.getElementById("mapPrev").addEventListener("click", function () {
    changeMap(-1);
});
document.getElementById("mapNext").addEventListener("click", function () {
    changeMap(1);
});
document.getElementById("foodPrev").addEventListener("click", function () {
    changeFood(-1);
});
document.getElementById("foodNext").addEventListener("click", function () {
    changeFood(1);
});

slowBtn.addEventListener("click", function () {
    changeSpeed(-1);
});
fastBtn.addEventListener("click", function () {
    changeSpeed(1);
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", backToStart);
resultCloseBtn.addEventListener("click", closeResult);

message.textContent = startMessage;

if (skinChoice >= SKIN_NAMES.length) {
    skinChoice = 0;
}
if (mapChoice >= MAP_NAMES.length) {
    mapChoice = 3;
}
if (foodChoice >= FOOD_NAMES.length) {
    foodChoice = 0;
}

skinText.textContent = SKIN_NAMES[skinChoice];
mapText.textContent = MAP_NAMES[mapChoice];
foodText.textContent = FOOD_NAMES[foodChoice];
musicText.textContent = musicVolume * 10 + "%";
eatText.textContent = eatVolume * 10 + "%";

fitCanvas();
resetGame();
