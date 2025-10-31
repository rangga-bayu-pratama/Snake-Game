// inisialisasi canvas dan konteks
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('GameOver');
// ukuran grid
const gridSize = 20;
const gridwidth = canvas.width / gridSize;
const gridHeight = canvas.height / gridSize;
// posisi ular
let snake = [{ x: Math.floor(gridwidth / 2), y: Math.floor(gridHeight / 2) }];
// posisi makanan
let food = { x:5 , y:5 };
let direction = 'right';
let score = 0;
let gamerunning = true;
// fungsi menggambar
function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
// gambar ular
    ctx.fillStyle = 'lime';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
// food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

}

draw(); // Memanggil fungsi draw agar canvas langsung muncul saat halaman dibuka

// fungsi update
function update() {
    if (!gamerunning) return;
    // menyalin posisi kepala ular
    const head = { ...snake[0] };

    // ubah posisi kepala berdasarkan arah
    if (direction === 'up') head.y--;
    else if (direction === 'down') head.y++;
    else if (direction === 'left') head.x--;
    else if (direction === 'right') head.x++;

    // cek tabrakan dengan dinding atau diri sendiri
if (head.x < 0 || head.x >= gridwidth || head.y < 0 || head.y >= gridHeight || snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    endgame();
    return;
}

// cek tabrakan dengan diri sendiri 
for (let segment of snake) {
    if (segment.x === head.x && segment.y === head.y) {
        endgame();
        return;
    } 
}

// menambahkan kepala baru ke depan ular
snake.unshift(head);

// cek makan food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    }
    else {
        snake.pop();
    }

}

// fungsi generate food
function generateFood() {
    food.x = Math.floor(Math.random() * gridwidth);
    food.y = Math.floor(Math.random() * gridHeight);
}

// fungsi endgame
function endgame() {
    gamerunning = false;
    gameOverElement.style.display = 'block';
}

// fungsi reset game
function resetGame() {
    snake = [{ x: Math.floor(gridwidth / 2), y: Math.floor(gridHeight / 2) }];
    direction = 'right';
    score = 0;
    scoreElement.textContent = score;
    gameOverElement.style.display = 'none';
    gamerunning = true;
}

// fungsi restart game
function RestartGame() {
    resetGame();
}

// fungsi game loop
function gameLoop() {
    update();
    draw();
}

// event listener untuk kontrol ular
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && direction !== 'down') direction = 'up';
    else if (e.key === 'ArrowDown' && direction !== 'up') direction = 'down';
    else if (e.key === 'ArrowLeft' && direction !== 'right') direction = 'left';
    else if (e.key === 'ArrowRight' && direction !== 'left') direction = 'right';   
});

// mulai game
resetGame();
setInterval(gameLoop, 100); // Menjalankan gameLoop setiap 100ms agar ular bergerak otomatis