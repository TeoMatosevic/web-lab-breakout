const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const canvasMargin = 20;
const canvasPadding = 10;
const minScreenWidth = 800;
const minScreenHeight = 400;

let raf;
let gameState;
let gameConfig;

var beep;
var start;
var hit;
var hit2;
var end;
var win;

var font = new FontFace(
    "ArcadeClassic",
    "url(./static/fonts/arcadeclassicregular.ttf)"
);

let maxScore = localStorage.getItem("max-score");

/**
 * Adds padding to the left of a string
 * @param {string} str - The string to pad
 * @param {number} len - The length of the final string
 * @param {string} pad - The padding character
 * @returns {string} The padded string
 */
const leftPad = (str, len, pad) => {
    if (str.length > len) {
        return str;
    }
    const padding = pad.repeat(len);
    return (padding + str).slice(-len);
};

/**
 * Checks the orientation of three points
 * @param {number} x1 - The x coordinate of the first point
 * @param {number} y1 - The y coordinate of the first point
 * @param {number} x2 - The x coordinate of the second point
 * @param {number} y2 - The y coordinate of the second point
 * @param {number} x3 - The x coordinate of the third point
 * @param {number} y3 - The y coordinate of the third point
 * @returns {number} The orientation of the points
 */
const orientationLine = (x1, y1, x2, y2, x3, y3) => {
    let val = (y2 - y1) * (x3 - x2) - (x2 - x1) * (y3 - y2);

    if (val === 0) {
        return 0;
    }

    return val > 0 ? 1 : 2;
};

/**
 * Checks if points are on the same segment
 * @param {number} x1 - The x coordinate of the first point
 * @param {number} y1 - The y coordinate of the first point
 * @param {number} x2 - The x coordinate of the second point
 * @param {number} y2 - The y coordinate of the second point
 * @param {number} x3 - The x coordinate of the third point
 * @param {number} y3 - The y coordinate of the third point
 * @returns {boolean} Whether the points are on the same segment or not
 */
const onSegment = (x1, y1, x2, y2, x3, y3) => {
    if (
        x2 <= Math.max(x1, x3) &&
        x2 >= Math.min(x1, x3) &&
        y2 <= Math.max(y1, y3) &&
        y2 >= Math.min(y1, y3)
    ) {
        return true;
    }

    return false;
};

/**
 * Checks if two lines intersect
 * @param {number} x1 - The x coordinate of the first point of the first line
 * @param {number} y1 - The y coordinate of the first point of the first line
 * @param {number} x2 - The x coordinate of the second point of the first line
 * @param {number} y2 - The y coordinate of the second point of the first line
 * @param {number} x3 - The x coordinate of the first point of the second line
 * @param {number} y3 - The y coordinate of the first point of the second line
 * @param {number} x4 - The x coordinate of the second point of the second line
 * @param {number} y4 - The y coordinate of the second point of the second line
 * @returns {boolean} Whether the lines intersect or not
 */
const checkIfLinesIntersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
    let o1 = orientationLine(x1, y1, x2, y2, x3, y3);
    let o2 = orientationLine(x1, y1, x2, y2, x4, y4);
    let o3 = orientationLine(x3, y3, x4, y4, x1, y1);
    let o4 = orientationLine(x3, y3, x4, y4, x2, y2);

    if (o1 !== o2 && o3 !== o4) {
        return true;
    }

    if (o1 === 0 && onSegment(x1, y1, x3, y3, x2, y2)) {
        return true;
    }

    if (o2 === 0 && onSegment(x1, y1, x4, y4, x2, y2)) {
        return true;
    }

    if (o3 === 0 && onSegment(x3, y3, x1, y1, x4, y4)) {
        return true;
    }

    if (o4 === 0 && onSegment(x3, y3, x2, y2, x4, y4)) {
        return true;
    }

    return false;
};

/**
 * Checks if the ball collides with the player
 * @param {object} gs - The game state
 * @param {object} gc - The game config
 * @returns {object} The updated game state
 */
const checkCollisionPlayer = (gs, gc) => {
    const ball = gs.ball;
    const player = gs.player;

    if (player.colided) {
        player.colided = false;
        return gs;
    }

    if (
        ball.x + gc.ball.width >= player.x &&
        ball.x <= player.x + gc.player.width &&
        ball.y + gc.ball.height >= player.y
    ) {
        const right = player.x + gc.player.width;
        const left = player.x;
        const top = player.y;
        const bottom = player.y + gc.player.height;

        const ballMiddleX = ball.x + gc.ball.width / 2;
        const ballMiddleY = ball.y + gc.ball.height / 2;
        const ballMiddlePrevX = ballMiddleX - ball.vBallX;
        const ballMiddlePrevY = ballMiddleY - ball.vBallY;

        if (
            checkIfLinesIntersect(
                ballMiddleX,
                ballMiddleY,
                ballMiddlePrevX,
                ballMiddlePrevY,
                left,
                top,
                right,
                top
            )
        ) {
            ball.vBallY = -ball.vBallY;
            player.colided = true;
            hit2.play();
        } else if (
            checkIfLinesIntersect(
                ballMiddleX,
                ballMiddleY,
                ballMiddlePrevX,
                ballMiddlePrevY,
                left,
                top,
                left,
                bottom
            )
        ) {
            ball.vBallX = -ball.vBallX;
            player.colided = true;
            hit2.play();
        } else if (
            checkIfLinesIntersect(
                ballMiddleX,
                ballMiddleY,
                ballMiddlePrevX,
                ballMiddlePrevY,
                right,
                top,
                right,
                bottom
            )
        ) {
            ball.vBallX = -ball.vBallX;
            player.colided = true;
            hit2.play();
        }
    }

    return gs;
};

/**
 * Checks if the ball collides with the bricks
 * @param {object} gs - The game state
 * @param {object} gc - The game config
 * @returns {object} The updated game state
 */
const checkCollisionBricks = (gs, gc) => {
    const ball = gs.ball;
    const bricks = gs.bricks;

    let collided = false;
    let index = -1;

    bricks.forEach((row) => {
        row.forEach((brick) => {
            if (!brick.show) {
                return;
            }

            if (
                ball.x + gc.ball.width >= brick.x &&
                ball.x <= brick.x + gc.bricks.width &&
                ball.y + gc.ball.height >= brick.y &&
                ball.y <= brick.y + gc.bricks.height
            ) {
                const right = brick.x + gc.bricks.width;
                const left = brick.x;
                const top = brick.y;
                const bottom = brick.y + gc.bricks.height;

                const ballMiddleX = ball.x + gc.ball.width / 2;
                const ballMiddleY = ball.y + gc.ball.height / 2;
                const ballMiddlePrevX = ballMiddleX - ball.vBallX;
                const ballMiddlePrevY = ballMiddleY - ball.vBallY;

                if (
                    checkIfLinesIntersect(
                        ballMiddleX,
                        ballMiddleY,
                        ballMiddlePrevX,
                        ballMiddlePrevY,
                        left,
                        bottom,
                        right,
                        bottom
                    )
                ) {
                    ball.vBallY = -ball.vBallY;
                    collided = true;
                    index = brick.index;
                    gs.currentScore++;
                } else if (
                    checkIfLinesIntersect(
                        ballMiddleX,
                        ballMiddleY,
                        ballMiddlePrevX,
                        ballMiddlePrevY,
                        left,
                        top,
                        right,
                        top
                    )
                ) {
                    ball.vBallY = -ball.vBallY;
                    collided = true;
                    index = brick.index;
                    gs.currentScore++;
                } else if (
                    checkIfLinesIntersect(
                        ballMiddleX,
                        ballMiddleY,
                        ballMiddlePrevX,
                        ballMiddlePrevY,
                        left,
                        top,
                        left,
                        bottom
                    )
                ) {
                    ball.vBallX = -ball.vBallX;
                    collided = true;
                    index = brick.index;
                    gs.currentScore++;
                } else if (
                    checkIfLinesIntersect(
                        ballMiddleX,
                        ballMiddleY,
                        ballMiddlePrevX,
                        ballMiddlePrevY,
                        right,
                        top,
                        right,
                        bottom
                    )
                ) {
                    ball.vBallX = -ball.vBallX;
                    collided = true;
                    index = brick.index;
                    gs.currentScore++;
                }
            }
        });
    });

    if (collided) {
        const newBricks = bricks.map((row) => {
            return row.map((brick) => {
                if (brick.index !== index) {
                    return brick;
                } else {
                    return { ...brick, show: false };
                }
            });
        });

        beep.play();

        gs.bricks = newBricks;

        if (newBricks.every((row) => row.every((brick) => !brick.show))) {
            gs.passed = true;
            win.play();
        }
    }

    return gs;
};

/**
 * Checks if the ball collides with the walls
 * @param {object} gs - The game state
 * @param {object} gc - The game config
 * @returns {object} The updated game state
 */
const checkCollisionWalls = (gs, gc) => {
    if (gs.ball.x < 0 || gs.ball.x > gc.screen.width - gc.ball.width) {
        gs.ball.vBallX = -gs.ball.vBallX;
        hit.play();
    }

    if (gs.ball.y < 0) {
        gs.ball.vBallY = -gs.ball.vBallY;
        hit.play();
    }

    if (gs.ball.y > gc.screen.height - gc.ball.height) {
        gs.failed = true;
        end.play();
    }

    return gs;
};

/**
 * Initializes state of the bricks
 * @param {object} gc - The game config
 * @returns {array} The bricks
 */
const initBricks = (gc) => {
    const bricks = [];

    let index = 0;

    for (let i = 0; i < gc.bricks.rows; i++) {
        const row = [];

        for (let j = 0; j < gc.bricks.bricksPerRow; j++) {
            row.push({
                x: 2 + j * gc.bricks.width + j * 5,
                y: 2 + i * 20 + i * 5,
                index: index++,
                show: true,
            });
        }

        bricks.push(row);
    }

    return bricks;
};

/**
 * Initializes state of the player
 * @param {object} gc - The game config
 * @returns {object} The player
 */
const initPlayer = (gc) => {
    const middle = gc.screen.width / 2;
    const bottom = gc.screen.height - 20 - canvasPadding;
    return {
        x: middle - gc.player.width / 2,
        y: bottom,
        colided: false,
    };
};

/**
 * Initializes state of the ball
 * @param {object} gc - The game config
 * @returns {object} The ball
 */
const initBall = (gc) => {
    const middle = gc.screen.width / 2;
    const bottom = gc.screen.height - 20 - canvasPadding;
    return {
        x: middle,
        y: bottom - 20,
        vBallX: -gc.ball.vBallX,
        vBallY: -gc.ball.vBallY,
    };
};

/**
 * Draws text on the canvas
 * @param {array} text - The text to draw
 */
const drawText = (text) => {
    ctx.fillStyle = "rgb(21 28 24 / 40%)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const width = ctx.canvas.width / 2;
    const height = ctx.canvas.height / 2;

    for (let i = 0; i < text.length; i++) {
        ctx.font = "60px ArcadeClassic";
        ctx.fillStyle = "#cc1242";
        ctx.textAlign = "center";
        ctx.fillText(
            text[i],
            width,
            height - 30 * Math.floor(text.length / 2) + i * 30
        );
    }

    ctx.font = "30px ArcadeClassic";
    ctx.fillStyle = "#cc1242";
    ctx.textAlign = "center";
    ctx.fillText("Press any key to restart", width, height + 50);
};

/**
 * Draws the bricks on the canvas
 * @param {array} bricks - The bricks to draw
 * @param {object} gc - The game config
 */
const drawBricks = (bricks, gc) => {
    bricks.forEach((row) => {
        row.forEach((brick) => {
            if (!brick.show) {
                return;
            }
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 2;
            ctx.shadowColor = "#151c18";

            ctx.fillStyle = gc.bricks.bgColor;
            ctx.fillRect(brick.x, brick.y, gc.bricks.width, gc.bricks.height);
        });
    });
};

/**
 * Draws the player on the canvas
 * @param {object} player - The player to draw
 * @param {object} gc - The game config
 */
const drawPlayer = (player, gc) => {
    ctx.fillStyle = gc.player.bgColor;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 2;
    ctx.shadowColor = "#151c18";

    ctx.fillRect(player.x, player.y, gc.player.width, gc.player.height);
};

/**
 * Draws the ball on the canvas
 * @param {object} ball - The ball to draw
 * @param {object} gc - The game config
 */
const drawBall = (ball, gc) => {
    ctx.fillStyle = gc.ball.bgColor;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, gc.ball.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
};

/**
 * Draws the header on the canvas
 */
const drawHeader = () => {
    ctx.fillStyle = "#151c18";
    ctx.fillRect(
        0,
        -gameConfig.screen.headerHeight,
        ctx.canvas.width,
        gameConfig.screen.headerHeight
    );
    ctx.strokeStyle = "#cc1242";
    ctx.lineWidth = 8;
    ctx.strokeRect(
        0,
        -gameConfig.screen.headerHeight,
        ctx.canvas.width,
        gameConfig.screen.headerHeight
    );

    ctx.font = "normal 50px ArcadeClassic";
    ctx.fillStyle = "#cc1242";
    ctx.textAlign = "right";
    ctx.fillText(
        `Score: ${leftPad(gameState.currentScore.toString(), 3, "0")}`,
        ctx.canvas.width - 20,
        -50
    );
    ctx.font = "normal 30px ArcadeClassic";
    ctx.fillText(
        `Max Score: ${leftPad(gameState.maxScore.toString(), 3, "0")}`,
        ctx.canvas.width - 20,
        -10
    );
};

/**
 * Draws the menu on the canvas
 * @param {array} text - The text to draw
 */
const drawMenu = (text) => {
    ctx.fillStyle = "rgb(21 28 24 / 80%)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const width = ctx.canvas.width / 2;
    const height = ctx.canvas.height / 2;

    ctx.font = "50px ArcadeClassic";
    ctx.fillStyle = "#cc1242";
    ctx.textAlign = "center";

    for (let i = 0; i < text.length; i++) {
        ctx.fillText(
            text[i],
            width,
            height - 30 * Math.floor(text.length / 2) + i * 40
        );
    }
};

/**
 * Initializes the game state
 * @param {boolean} inMenu - Whether the game is in the menu or not
 */
const initialGameState = (inMenu) => {
    return {
        valid: true,
        bricks: initBricks(gameConfig),
        player: initPlayer(gameConfig),
        ball: initBall(gameConfig),
        failed: false,
        passed: false,
        currentScore: 0,
        maxScore: maxScore ? maxScore : 0,
        inMenu: inMenu,
        started: false,
    };
};

/**
 * Initializes the game
 */
const init = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    ctx.canvas.width = width - canvasMargin;
    ctx.canvas.height = height - canvasMargin;

    const randomAngle = Math.random() * (Math.PI / 2) + Math.PI / 4;
    const vBall = 12;
    const vBallX = vBall * Math.cos(randomAngle);
    const vBallY = vBall * Math.sin(randomAngle);

    const bricksPerRow = 20;
    const headerHeight = 100;

    gameConfig = {
        bricks: {
            bricksPerRow: bricksPerRow,
            rows: 6,
            width: (width - bricksPerRow * 6) / bricksPerRow,
            height: 20,
            bgColor: "#f0745c",
        },
        player: {
            width: 150,
            height: 20,
            bgColor: "#cc1242",
            strokeColor: "f0745c",
            vPlayer: 50,
        },
        screen: {
            width: width - canvasMargin,
            height: height - canvasMargin - headerHeight,
            headerHeight: headerHeight,
        },
        ball: {
            bgColor: "#cc1242",
            vBallX: vBallX,
            vBallY: vBallY,
            width: 16,
            height: 16,
        },
    };

    gameState = initialGameState(true);

    if (width < minScreenWidth || height < minScreenHeight) {
        drawText([
            `Please resize the window to at least ${minScreenWidth}x${minScreenHeight}`,
        ]);
        return;
    }

    beep = new Audio("./static/sounds/beep.mp3");
    start = new Audio("./static/sounds/start1.mp3");
    hit = new Audio("./static/sounds/hit1.mp3");
    hit2 = new Audio("./static/sounds/hit2.mp3");
    end = new Audio("./static/sounds/end.mp3");
    win = new Audio("./static/sounds/win.mp3");

    ctx.translate(0, gameConfig.screen.headerHeight);

    window.requestAnimationFrame(draw);
};

/**
 * Updates the game state
 * @param {object} gs - The game state
 * @param {object} gc - The game config
 */
const update = (gs, gc) => {
    gs = checkCollisionPlayer(gs, gc);
    gs = checkCollisionBricks(gs, gc);
    gs = checkCollisionWalls(gs, gc);

    gs.ball.x += gs.ball.vBallX;
    gs.ball.y += gs.ball.vBallY;
};

/**
 * Draws the game
 */
const draw = () => {
    if (gameState.started === true) {
        start.play();
        gameState.started = false;
    }
    drawHeader();

    ctx.clearRect(0, 0, gameConfig.screen.width, gameConfig.screen.height);

    drawBall(gameState.ball, gameConfig);
    drawBricks(gameState.bricks, gameConfig);
    drawPlayer(gameState.player, gameConfig);

    if (gameState.failed) {
        if (gameState.currentScore > gameState.maxScore) {
            localStorage.setItem("max-score", gameState.currentScore);
            maxScore = gameState.currentScore;
        }
        drawText(["GAME OVER!"]);
    } else if (gameState.passed) {
        if (gameState.currentScore > gameState.maxScore) {
            localStorage.setItem("max-score", gameState.currentScore);
            maxScore = gameState.currentScore;
        }
        drawText(["YOU WON!"]);
    } else if (gameState.inMenu) {
        const menuText = ["Press any key to start", "Use arrow keys to move"];
        drawMenu(menuText);
    } else {
        update(gameState, gameConfig);
    }

    window.requestAnimationFrame(draw);
};

/**
 * Handles keydown events (arrow keys to move the player)
 * @param {object} e - The event object
 */
document.addEventListener("keydown", (e) => {
    if (gameState.inMenu) {
        gameState.inMenu = false;
        gameState.started = true;
        return;
    }

    if (gameState.failed || gameState.passed) {
        gameState = initialGameState(false);
        return;
    }

    if (e.key === "ArrowLeft") {
        if (gameState.player.x > gameConfig.player.vPlayer) {
            gameState.player.x -= gameConfig.player.vPlayer;
        } else {
            gameState.player.x = 0;
        }
    } else if (e.key === "ArrowRight") {
        if (
            gameState.player.x <
            gameConfig.screen.width -
                gameConfig.player.width -
                gameConfig.player.vPlayer
        ) {
            gameState.player.x += gameConfig.player.vPlayer;
        } else {
            gameState.player.x =
                gameConfig.screen.width - gameConfig.player.width;
        }
    }
});

/**
 * When window loads, load the font and initialize the game
 */
window.onload = () => {
    font.load().then(() => {
        document.fonts.add(font);
        init();
    });
};
