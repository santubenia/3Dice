import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { RoundedBoxGeometry } from './RoundedBoxGeometry.js';

const app = document.getElementById('app');
const resultEl = document.getElementById('result');
const rollBtn = document.getElementById('rollBtn');
const guessInput = document.getElementById('guessInput');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');

let score = 0;
let guessValue = null;
let highScore = parseInt(localStorage.getItem('dice_high_score') || '0', 10) || 0;
if (highScoreEl) highScoreEl.textContent = `High: ${highScore}`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio || 1);
app.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x888888));
// stronger hemisphere for nicer lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 0.6));

function createPipTexture(n) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // white face
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  // pip color
  ctx.fillStyle = '#0b0b0b';
  const r = size * 0.06;

  const cx = x => Math.round(size * x);
  const cy = y => Math.round(size * y);
  const draw = (x, y) => {
    ctx.beginPath();
    ctx.arc(cx(x), cy(y), r, 0, Math.PI * 2);
    ctx.fill();
  };

  // positions: using normalized coords
  const positions = {
    tl: [0.25, 0.25], tr: [0.75, 0.25], bl: [0.25, 0.75], br: [0.75, 0.75],
    lmid: [0.25, 0.5], rmid: [0.75, 0.5], mid: [0.5, 0.5]
  };

  const layout = {
    1: ['mid'],
    2: ['tl', 'br'],
    3: ['tl', 'mid', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'mid', 'bl', 'br'],
    6: ['tl', 'lmid', 'bl', 'tr', 'rmid', 'br']
  };

  for (const p of layout[n]) draw(...positions[p]);

  // store the canvas so we can show a 2D preview later
  faceCanvases[n] = canvas;

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}


// map numbers to box face order: +X, -X, +Y, -Y, +Z, -Z (keep opposites sum to 7)
const faceCanvases = {};
const faceNumbers = [3, 4, 1, 6, 2, 5];
const materials = faceNumbers.map(n => new THREE.MeshPhysicalMaterial({
  map: createPipTexture(n),
  color: 0xffffff,
  metalness: 0.02,
  roughness: 0.5,
  clearcoat: 0.2,
  clearcoatRoughness: 0.1
}));

let geometry;
try {
  geometry = new RoundedBoxGeometry(1.4, 1.4, 1.4, 16, 0.12);
} catch (err) {
  console.warn('RoundedBoxGeometry failed, falling back to BoxGeometry', err);
  geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
}
const cube = new THREE.Mesh(geometry, materials);
scene.add(cube);

// store local normals and associated numbers for each face index
const faceInfos = [
  { num: faceNumbers[0], normal: new THREE.Vector3(1, 0, 0) }, // +X
  { num: faceNumbers[1], normal: new THREE.Vector3(-1, 0, 0) }, // -X
  { num: faceNumbers[2], normal: new THREE.Vector3(0, 1, 0) }, // +Y (top)
  { num: faceNumbers[3], normal: new THREE.Vector3(0, -1, 0) }, // -Y (bottom)
  { num: faceNumbers[4], normal: new THREE.Vector3(0, 0, 1) }, // +Z
  { num: faceNumbers[5], normal: new THREE.Vector3(0, 0, -1) }, // -Z
];

function fitCameraToBox() {
  const boxSize = new THREE.Vector3(1.4, 1.4, 1.4);
  const boundingRadius = boxSize.length() * 0.5;
  const fov = (camera.fov * Math.PI) / 180;
  const distance = Math.abs(boundingRadius / Math.sin(fov / 2)) * 1.3;
  camera.position.set(0, boundingRadius * 0.9, distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (renderer.domElement) {
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
  }
}

window.addEventListener('resize', fitCameraToBox);
fitCameraToBox();

let spinning = false;
let angularVel = 0; // radians per second
let spinAxis = new THREE.Vector3(0, 1, 0);
let lastTime = performance.now();
let snapTargetQuat = null;
let snapping = false;

function roll() {
  if (spinning || snapping) return;
  const guess = parseInt(guessInput.value, 10);
  if (!guess || guess < 1 || guess > 6) {
    resultEl.textContent = 'Enter 1-6';
    resultEl.classList.remove('hidden');
    return;
  }
  guessValue = guess;
  resultEl.classList.add('hidden');
  spinning = true;
  // random axis and speed
  spinAxis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize();
  angularVel = 12 + Math.random() * 26; // rad/s
}

function computeTopFaceAndSnap() {
  const up = new THREE.Vector3(0, 1, 0);
  let best = { dot: -Infinity, info: null };
  for (const info of faceInfos) {
    const worldNormal = info.normal.clone().applyQuaternion(cube.quaternion);
    const d = worldNormal.dot(up);
    if (d > best.dot) best = { dot: d, info };
  }
  const face = best.info;
  // compute quaternion that orients this face normal to world up
  // Preserve cube yaw: find rotation that maps face.normal to up while keeping rotation around up minimal
  const targetQuat = new THREE.Quaternion().setFromUnitVectors(face.normal.clone(), new THREE.Vector3(0, 1, 0));
  snapTargetQuat = targetQuat;
  snapping = true;
  // reveal the result after snapping completes
  resultEl.dataset.showNumber = String(face.num);
}

function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.03, (time - lastTime) / 1000);
  lastTime = time;

  if (spinning) {
    // apply rotation
    const angle = angularVel * dt;
    cube.rotateOnAxis(spinAxis, angle);
    // decay
    angularVel *= Math.max(0, 1 - dt * 1.8); // friction
    if (angularVel < 0.3) {
      spinning = false;
      // determine which face ended up on top and prepare snap
      computeTopFaceAndSnap();
    }
  } else if (snapping && snapTargetQuat) {
    // smooth slerp to target orientation
    cube.quaternion.slerp(snapTargetQuat, Math.min(1, dt * 6));
    // when close, finish
    if (cube.quaternion.angleTo(snapTargetQuat) < 0.01) {
      cube.quaternion.copy(snapTargetQuat);
      snapping = false;
      snapTargetQuat = null;
      // show result stored
      const n = resultEl.dataset.showNumber || '—';
      showResult(n);
    }
  } else {
    // idle gentle rotation
    cube.rotation.y += 0.002;
  }

  renderer.render(scene, camera);
}

function showResult(n) {
  const preview = document.getElementById('preview');
  const pv = document.getElementById('facePreview');
  const previewLabel = document.getElementById('previewLabel');
  const resultNum = Number(n);
  let message = `Result: ${resultNum}`;

  if (guessValue !== null) {
    if (guessValue === resultNum) {
      score += 1;
      message = `Correct! ${resultNum}`;
    } else {
      message = `Wrong. ${resultNum}`;
    }
    scoreEl.textContent = `Score: ${score}`;
    // update high score
    if (score > highScore) {
      highScore = score;
      try { localStorage.setItem('dice_high_score', String(highScore)); } catch (e) {}
      if (highScoreEl) highScoreEl.textContent = `High: ${highScore}`;
    }
  }

  resultEl.textContent = message;
  resultEl.classList.remove('hidden');

  if (pv && faceCanvases[resultNum]) {
    const ctx = pv.getContext('2d');
    ctx.clearRect(0, 0, pv.width, pv.height);
    ctx.drawImage(faceCanvases[resultNum], 0, 0, pv.width, pv.height);
    if (previewLabel) previewLabel.textContent = message;
    preview.classList.remove('hidden');
    setTimeout(() => preview.classList.add('hidden'), 2000);
  } else if (preview) {
    preview.classList.add('hidden');
  }

  guessValue = null;
}

guessInput.addEventListener('input', event => {
  const value = parseInt(event.target.value, 10);
  guessValue = Number.isInteger(value) && value >= 1 && value <= 6 ? value : null;
});

rollBtn.addEventListener('click', roll);
renderer.domElement.addEventListener('pointerdown', () => roll());

animate(performance.now());
