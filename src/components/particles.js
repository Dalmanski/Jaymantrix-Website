const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

document.body.style.margin = '0';

canvas.style.position = 'fixed';
canvas.style.inset = '0';
canvas.style.display = 'block';

const isMobile = window.innerWidth <= 768;

const CONFIG = {
  count: isMobile ? 20 : 60,
  sizeMin: 2.4,
  sizeMax: 5.2,
  startSizeMultiplier: 1,
  opacityMax: 0.35,
  opacityMin: 0.02,
  fadeInMin: 400,
  fadeInMax: 1000,
  lifeMin: 6000,
  lifeMax: 14000,
  startDelayMin: 0,
  startDelayMax: 600,
  velocityX: 0.45,
  velocityY: 0.45
};

let DPR = Math.max(1, window.devicePixelRatio || 1);

function resize() {
  DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(innerWidth * DPR);
  canvas.height = Math.floor(innerHeight * DPR);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

addEventListener('resize', resize, { passive: true });
resize();

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

class Particle {
  constructor(x, y) {
    this.reset(x, y, true);
  }

  reset(x, y, first) {
    this.x = x ?? rand(0, innerWidth);
    this.y = y ?? rand(0, innerHeight);
    this.vx = (Math.random() - 0.5) * CONFIG.velocityX;
    this.vy = (Math.random() - 0.35) * CONFIG.velocityY;
    this.baseSize = rand(CONFIG.sizeMin, CONFIG.sizeMax) * CONFIG.startSizeMultiplier;
    this.size = this.baseSize;
    this.age = 0;
    this.ttl = rand(CONFIG.lifeMin, CONFIG.lifeMax);
    this.fadeIn = rand(CONFIG.fadeInMin, CONFIG.fadeInMax);
    this.delay = first ? rand(CONFIG.startDelayMin, CONFIG.startDelayMax) : 0;
    this.started = this.delay === 0;
  }

  update(dt) {
    if (!this.started) {
      this.delay -= dt;
      if (this.delay > 0) return;
      this.started = true;
      this.age = 0;
    }

    this.age += dt;
    this.x += this.vx * dt * 0.06;
    this.y += this.vy * dt * 0.06;
    this.vx *= 0.999;
    this.vy *= 0.999;
    this.vy += 0.00006 * dt;

    const n = this.age / this.ttl;
    this.size = this.baseSize * (1 - Math.min(1, n) * 0.5);
  }

  draw() {
    if (!this.started) return;

    const n = this.age / this.ttl;
    const inOpacity = Math.min(1, this.age / this.fadeIn);
    const outOpacity = Math.max(0, 1 - n);
    const alpha = Math.max(
      CONFIG.opacityMin,
      Math.min(CONFIG.opacityMax, inOpacity * outOpacity * CONFIG.opacityMax)
    );

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(this.x - this.size * 0.5, this.y - this.size * 0.5, this.size, this.size);
  }

  dead() {
    return this.started && this.age >= this.ttl;
  }
}

const particles = [];

function populate() {
  particles.length = 0;
  for (let i = 0; i < CONFIG.count; i++) {
    particles.push(new Particle(rand(0, innerWidth), rand(0, innerHeight)));
  }
}

populate();

let last = performance.now();

function loop(t) {
  const dt = t - last;
  last = t;

  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update(dt);
    p.draw();

    if (
      p.dead() ||
      p.x < -80 ||
      p.x > innerWidth + 80 ||
      p.y < -80 ||
      p.y > innerHeight + 140
    ) {
      p.reset();
    }
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
