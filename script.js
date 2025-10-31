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
// setup Web Audio API (digunakan untuk suara tabrakan)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudioContext() {
    if (!audioCtx && AudioContext) {
        audioCtx = new AudioContext();
    }
}

function playCollisionSound() {
    try {
        ensureAudioContext();
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;
        
        // Oscillator utama untuk melodi
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'square'; // Untuk suara retro
        
        // Nada turun ala Mario death sound
        osc1.frequency.setValueAtTime(880, now); // Start dengan A5
        osc1.frequency.setValueAtTime(784, now + 0.1); // G5
        osc1.frequency.setValueAtTime(698.46, now + 0.2); // F5
        osc1.frequency.setValueAtTime(587.33, now + 0.3); // D5
        osc1.frequency.setValueAtTime(523.25, now + 0.4); // C5
        osc1.frequency.setValueAtTime(440, now + 0.5); // A4
        
        // Volume envelope
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.setValueAtTime(0.3, now + 0.5);
        gain1.gain.linearRampToValueAtTime(0, now + 0.6);
        
        // Oscillator kedua untuk efek
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'square';
        osc2.detune.value = -10; // Sedikit detune untuk efek lebih tebal
        
        // Copy frekuensi dari osc1
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(784, now + 0.1);
        osc2.frequency.setValueAtTime(698.46, now + 0.2);
        osc2.frequency.setValueAtTime(587.33, now + 0.3);
        osc2.frequency.setValueAtTime(523.25, now + 0.4);
        osc2.frequency.setValueAtTime(440, now + 0.5);
        
        // Volume envelope untuk osc2
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.setValueAtTime(0.2, now + 0.5);
        gain2.gain.linearRampToValueAtTime(0, now + 0.6);
        
        // Connect dan start
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.7);
        osc2.stop(now + 0.7);
        
    } catch (e) {
        console.warn('Tidak bisa memutar suara:', e);
    }
}

// ---------- tambahan suara saat bermain ----------
let isMuted = false;
const bg = {
    isPlaying: false,
    oscillators: [],
    gain: null,
    intervalId: null,
    noteIndex: 0
};

function startBackgroundMusic() {
    if (isMuted) return;
    ensureAudioContext();
    if (!audioCtx || bg.isPlaying) return;

    const now = audioCtx.currentTime;
    
    // Gain untuk mengontrol volume utama
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    masterGain.connect(audioCtx.destination);

    // Oscillator melodi utama
    const melody = audioCtx.createOscillator();
    const melodyGain = audioCtx.createGain();
    melody.type = 'square';
    melodyGain.gain.setValueAtTime(0.2, now);
    melody.connect(melodyGain);
    melodyGain.connect(masterGain);

    // Oscillator bass
    const bass = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bass.type = 'triangle';
    bassGain.gain.setValueAtTime(0.3, now);
    bass.connect(bassGain);
    bassGain.connect(masterGain);

    melody.start(now);
    bass.start(now);

    bg.oscillators = [melody, bass];
    bg.gain = masterGain;
    bg.isPlaying = true;

    // Melodi yang lebih ceria (nada-nada mayor)
    const melodyNotes = [
        392.00,  // G4
        493.88,  // B4
        587.33,  // D5
        493.88,  // B4
        392.00,  // G4
        440.00,  // A4
        493.88,  // B4
        587.33   // D5
    ];
    
    // Bass line yang mendukung
    const bassNotes = [
        196.00,  // G3
        246.94,  // B3
        293.66,  // D4
        246.94,  // B3
        196.00,  // G3
        220.00,  // A3
        246.94,  // B3
        293.66   // D4
    ];

    bg.noteIndex = 0;
    bg.intervalId = setInterval(() => {
        if (!bg.isPlaying) return;
        const mNote = melodyNotes[bg.noteIndex % melodyNotes.length];
        const bNote = bassNotes[bg.noteIndex % bassNotes.length];
        const now2 = audioCtx.currentTime;
        
        // Smooth transition untuk melodi
        melody.frequency.linearRampToValueAtTime(mNote, now2 + 0.05);
        bass.frequency.linearRampToValueAtTime(bNote, now2 + 0.05);
        
        // Artikulasi nada (envelope sederhana)
        melodyGain.gain.setValueAtTime(0.2, now2);
        melodyGain.gain.linearRampToValueAtTime(0.1, now2 + 0.1);
        
        bg.noteIndex++;
    }, 200); // Tempo lebih cepat dan riang
}

function stopBackgroundMusic() {
    if (!bg.isPlaying) return;
    if (bg.intervalId) {
        clearInterval(bg.intervalId);
        bg.intervalId = null;
    }
    const now = audioCtx ? audioCtx.currentTime : 0;
    try {
        bg.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    } catch (e) { /* ignore */ }
    bg.oscillators.forEach(o => { try { o.stop(now + 0.25); } catch (e) {} });
    bg.oscillators = [];
    bg.isPlaying = false;
}

function toggleSound() {
    isMuted = !isMuted;
    const btn = document.getElementById('soundToggle');
    if (isMuted) {
        // mute: stop music
        stopBackgroundMusic();
        if (btn) btn.textContent = 'Sound: Off';
    } else {
        if (btn) btn.textContent = 'Sound: On';
        // try to start music on unmute
        startBackgroundMusic();
    }
}

// start music on first user gesture (keydown/click)
let _startedAudioOnGesture = false;
function startAudioIfNeeded() {
    if (_startedAudioOnGesture) return;
    ensureAudioContext();
    if (!audioCtx) return;
    // resume audio context (required in many browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    _startedAudioOnGesture = true;
    startBackgroundMusic();
}

// Jika user membuka file langsung (file://) tanpa server, beberapa browser
// masih memerlukan gesture untuk mengizinkan audio. Pasang listener sekali
// untuk 'keydown' dan 'click' sehingga audio akan di-unlock setelah satu
// interaksi—membuat game bisa dimainkan tanpa perlu menjalankan localhost.
document.addEventListener('keydown', () => startAudioIfNeeded(), { once: true });
document.addEventListener('click', () => startAudioIfNeeded(), { once: true });

function playEatSound() {
    if (isMuted) return;
    try {
        ensureAudioContext();
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(700, now);
        o.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        o.stop(now + 0.3);
    } catch (e) { console.warn('eat sound fail', e); }
}

// expose toggleSound globally so HTML onclick can call it
window.toggleSound = toggleSound;
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
        // mainkan suara makan dan hasilkan makanan baru
        try { playEatSound(); } catch (e) { /* ignore */ }
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
    // mainkan suara tabrakan (jika tersedia)
    try { playCollisionSound(); } catch (e) { /* ignore */ }
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