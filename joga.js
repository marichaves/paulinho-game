// ======= Corações flutuantes =======
let interval = 500, maxSize = 100, heartsCreated = 0;
function createHeart() {
  const heart = document.createElement('div');
  heart.className = 'heart';
  const size = Math.min(700, Math.random() * maxSize + 40);
  heart.style.width = size+'px';
  heart.style.height = size+'px';
  heart.style.left = Math.random()*(window.innerWidth-size)+'px';
  heart.style.top = Math.random()*(window.innerHeight-size)+'px';
  heart.style.zIndex = Math.floor(size);
  heart.style.opacity = 0.3 + Math.random()*0.7;
  const before = document.createElement('div'),
        after  = document.createElement('div');
  [before, after].forEach((el,i) => {
    el.style.width = size+'px'; el.style.height = size+'px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#ff4d4d';
    el.style.position = 'absolute';
    el.style.top = i===0 ? -size/2+'px' : '0';
    el.style.left = i===0 ? '0' : size/2+'px';
    heart.appendChild(el);
  });
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 15000);
  heartsCreated++;
  if (maxSize < 700) maxSize += 5;
  if (interval > 50) {
    clearInterval(timer);
    interval -= 10;
    timer = setInterval(createHeart, interval);
  }
  if (heartsCreated >= 100) {
    document.body.style.background = '#ff4d4d';
    document.querySelector('h1').style.color = 'white';
  }
}
let timer = setInterval(createHeart, interval);

// ======= Jogo estilo Dino com Double Jump e Aceleração =======
const canvas = document.getElementById("gameCanvas"),
      ctx    = canvas.getContext("2d"),
      startBtn = document.getElementById("startBtn"),
      scoreCounter = document.getElementById("scoreCounter"),
      overContainer = document.getElementById("gameOverContainer"),
      retryBtn = document.getElementById("retryBtn"),
      convertBtn = document.getElementById("convertBtn");

let player, gravity, collectibles, barriers, score, gameRunning;
let speedFactor, speedInterval, lastBarrierX, timeSinceLastBarrier;
const MAX_JUMPS = 2;
let baseJumpSpeed = -15;
let blackHeartCount = 0;
let redHeartCount = 0;
let playerImage = new Image();  // Variável para a imagem do jogador
const playerStandImage = new Image();
playerStandImage.src = "stand.png";
const playerJumpImage = new Image();
playerJumpImage.src = "jump.png";
let imagesLoaded = 0; // Contador para garantir que todas as imagens carreguem
const totalImages = 4; // Total de imagens a serem carregadas (stand, jump, collectible, redCollectible)


function initGame() {
  // reset estado
  player = { x:50, y:300, w:50, h:50, vy:0, jumps:0 };
  resizePlayer(90, 110, 10);
  gravity = 1;
  collectibles = [];
  barriers = [];
  score = 0;
  speedFactor = 1;
  gameRunning = true;
  lastBarrierX = 0;
  timeSinceLastBarrier = 0;
  baseJumpSpeed = -15;
  blackHeartCount = 0;
  redHeartCount = 0;
  playerImage = playerStandImage; // Inicializa com a imagem de pé
  scoreCounter.innerHTML = `<img src="blackh.png" style="width: 20px; height: 20px;">: ${blackHeartCount}  <img src="redh.png" style="width: 20px; height: 20px;">: ${redHeartCount}`;

  // UI
  scoreCounter.style.display = 'block';
  overContainer.style.display = 'none';
  canvas.style.display = 'block';

  // aceleração progressiva
  clearInterval(speedInterval);
  speedInterval = setInterval(() => {
    speedFactor += 0.1;
  }, 5000);

  // Garante que o jogo só comece após o carregamento das imagens
  if (imagesLoaded === totalImages) {
    requestAnimationFrame(updateGame);
  }
}

const collectibleImage = new Image();
collectibleImage.src = "blackh.png";
const redCollectibleImage = new Image();
redCollectibleImage.src = "redh.png";
const barrierImage = new Image();
barrierImage.src = "wall.png";

// Função para carregar imagens e iniciar o jogo após o carregamento completo
function loadImage(img, src, callback) {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
      callback(); // Inicia o jogo após todas as imagens carregarem
    }
  };
  img.src = src;
}

// Carrega todas as imagens antes de iniciar o jogo
loadImage(playerStandImage, playerStandImage.src, () => {});
loadImage(playerJumpImage, playerJumpImage.src, () => {});
loadImage(collectibleImage, collectibleImage.src, () => {});
loadImage(redCollectibleImage, redCollectibleImage.src, () => {});


function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
}


function jump() {
  if (player.jumps < MAX_JUMPS) {
    player.vy = baseJumpSpeed * (1 + speedFactor/10);
    player.jumps++;
    playerImage = playerJumpImage; // Muda para a imagem de pulo
  }
}

function spawnCollectible() {
  const heartType = Math.random() < 0.8 ? 'black' : 'red';
  const x = 800;
  const y = Math.random() * 100 + 200;
  const w = 30;
  const h = 30;

  collectibles.push({ x, y, w, h, type: heartType });
}
function spawnBarrier() {
    const minSpacing = player.w * 1.5;
    const maxSpacing = player.w * 4;
    let spacing;

    // Lógica de espaçamento mais parecida com a do Dino
    if (timeSinceLastBarrier < 100) {
        spacing = minSpacing;
    } else {
        spacing = Math.random() * (maxSpacing - minSpacing) + minSpacing;
    }

    let newBarrierX = lastBarrierX + spacing + 40;
    if (barriers.length === 0) {
        newBarrierX = 800;
    }

    const barrierY = 300 - 60 + 100;
    barriers.push({ x: newBarrierX, y: barrierY, w: 40, h: 60 });
    lastBarrierX = newBarrierX;
    timeSinceLastBarrier = 0;
}

function drawObjs(arr, color) {
  ctx.fillStyle = color;
  arr.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
}
function drawImages(arr, img) {
  arr.forEach(o => ctx.drawImage(img, o.x, o.y, o.w, o.h));
}

function hit(a, b) {
  // Ajustando as bordas de contato para o player e obstáculo
  const playerReducedWidth = a.w * 0.8;
  const playerReducedHeight = a.h * 0.8;
  const playerOffsetX = (a.w - playerReducedWidth) / 2;
  const playerOffsetY = (a.h - playerReducedHeight) / 2;

  const barrierReducedWidth = b.w * 0.6;
  const barrierReducedHeight = b.h * 0.6;
  const barrierOffsetX = (b.w - barrierReducedWidth) / 2;
  const barrierOffsetY = (b.h - barrierReducedHeight) / 2;

  const playerLeft = a.x + playerOffsetX;
  const playerRight = a.x + playerReducedWidth + playerOffsetX;
  const playerTop = a.y + playerOffsetY;
  const playerBottom = a.y + playerReducedHeight + playerOffsetY;

  const barrierLeft = b.x + barrierOffsetX;
  const barrierRight = b.x + barrierReducedWidth + barrierOffsetX;
  const barrierTop = b.y + barrierOffsetY;
  const barrierBottom = b.y + barrierReducedHeight + barrierOffsetY;

  return playerLeft < barrierRight &&
         playerRight > barrierLeft &&
         playerTop < barrierBottom &&
         playerBottom > barrierTop;
}

function updateGame() {
  if (!gameRunning) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // física do player
  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 300) {
    player.y = 300;
    player.vy = 0;
    player.jumps = 0;
    playerImage = playerStandImage; // Volta para a imagem de pé quando toca o chão
  }
  drawPlayer();

  // corações (agora collectibles)
  if (Math.random() < 0.02) spawnCollectible();
  collectibles.forEach(c => c.x -= 4 * speedFactor);
  collectibles = collectibles.filter(c => c.x + c.w > 0);
  collectibles.forEach((c, i) => {
    if (hit(player, c)) {
      collectibles.splice(i, 1);
      if (c.type === 'black') {
        blackHeartCount++;
      } else {
        redHeartCount++;
      }
      scoreCounter.innerHTML = `<img src="blackh.png" style="width: 20px; height: 20px;">: ${blackHeartCount}  <img src="redh.png" style="width: 20px; height: 20px;">: ${redHeartCount}`;
    }
  });
  collectibles.forEach(c => {
    if (c.type === 'black') {
      ctx.drawImage(collectibleImage, c.x, c.y, c.w, c.h);
    } else {
      ctx.drawImage(redCollectibleImage, c.x, c.y, c.w, c.h);
    }
  });

  // barreiras (antes alarms)
    if (Math.random() < 0.015) spawnBarrier();
    barriers.forEach(b => b.x -= 6 * speedFactor);
    barriers = barriers.filter(b => b.x + b.w > 0);
    drawImages(barriers, barrierImage);
    for (let b of barriers) {
        if (hit(player, b)) {
            gameRunning = false;
            clearInterval(speedInterval);
            overContainer.style.display = 'block';
            return;
        }
    }
    timeSinceLastBarrier += 1;

  requestAnimationFrame(updateGame);
}

// eventos
startBtn.addEventListener("click", () => {
  clearInterval(timer);
  document.querySelectorAll('.heart').forEach(h => h.remove());
  document.querySelector('h1').style.display = 'none';
  startBtn.style.display = 'none';
  // Adicionando a linha para esconder a imagem do casal
  document.querySelector('img[alt="Imagem de um casal"]').style.display = 'none';
  initGame();
});

retryBtn.addEventListener("click", initGame);
convertBtn.addEventListener("click", () => {
  const totalAbbracos = Math.floor(blackHeartCount * 2 / 3);
  const totalBeijos = Math.floor(redHeartCount * 4 / 5);
  let mensagem = `Meu amor por você não se curva ao tempo ou humores. Amo você, piriquitin.
  Você converteu:
${blackHeartCount} Corações Pretos por: ${totalAbbracos} Abraços
${redHeartCount} Corações Vermelhos por: ${totalBeijos} Beijos`;

  if (totalAbbracos > 0 && totalBeijos > 0 && totalAbbracos + totalBeijos > 9) {
    mensagem += "\nParabéns! Você ganhou uma massagem especial";
  }
  alert(mensagem);
});

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});
document.addEventListener("touchstart", () => {
  jump();
});

function resizePlayer(width, height, offsetY = 0) {
    player.w = width;
    player.h = height;
    player.y = 300 - height + offsetY;
  }