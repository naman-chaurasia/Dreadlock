import * as THREE from 'three';
import { Input } from './input';
import { StatsOverlay } from './stats';

/**
 * DREADLOCK — Phase 2: minimal graphics proof.
 * One small test environment: floor, a few walls, pillars, one teal accent
 * light, one lightweight concrete material. No shadows, no antialiasing,
 * internal render scale 0.8, per the low-laptop performance directive.
 */

const RENDER_SCALE = 0.8;
const MOVE_SPEED = 4; // m/s
const EYE_HEIGHT = 1.7;
const ROOM_HALF = 10; // room is 20 x 20 m, walls at +/-10
const WALL_HEIGHT = 4;

// --- renderer ---------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * RENDER_SCALE);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;

const app = document.getElementById('app');
if (!app) throw new Error('#app container not found');
app.appendChild(renderer.domElement);

// --- scene ------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080a);
scene.fog = new THREE.Fog(0x05080a, 10, 38); // cheap atmospheric depth cue

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, EYE_HEIGHT, 7);

// One lightweight shared material: worn concrete.
const concrete = new THREE.MeshStandardMaterial({
  color: 0x40464c,
  roughness: 0.95,
  metalness: 0.0,
});

// Floor (single quad).
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_HALF * 2, ROOM_HALF * 2), concrete);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Four walls from one shared box geometry.
const wallGeo = new THREE.BoxGeometry(ROOM_HALF * 2 + 0.8, WALL_HEIGHT, 0.4);
const wallSpecs: Array<{ pos: [number, number, number]; rotY: number }> = [
  { pos: [0, WALL_HEIGHT / 2, -ROOM_HALF], rotY: 0 },
  { pos: [0, WALL_HEIGHT / 2, ROOM_HALF], rotY: 0 },
  { pos: [-ROOM_HALF, WALL_HEIGHT / 2, 0], rotY: Math.PI / 2 },
  { pos: [ROOM_HALF, WALL_HEIGHT / 2, 0], rotY: Math.PI / 2 },
];
for (const spec of wallSpecs) {
  const wall = new THREE.Mesh(wallGeo, concrete);
  wall.position.set(...spec.pos);
  wall.rotation.y = spec.rotY;
  scene.add(wall);
}

// Two pillars for silhouette variation, sharing one geometry.
const pillarGeo = new THREE.BoxGeometry(0.8, WALL_HEIGHT, 0.8);
for (const x of [-5, 5]) {
  const pillar = new THREE.Mesh(pillarGeo, concrete);
  pillar.position.set(x, WALL_HEIGHT / 2, -4);
  scene.add(pillar);
}

// --- lighting ---------------------------------------------------------------
// Very dim ambient so recesses read as dark but not pure black.
scene.add(new THREE.AmbientLight(0x101c22, 0.6));
// The single accent light: teal, matching DREADLOCK's cyan/teal identity.
const accent = new THREE.PointLight(0x24e0d8, 60, 40, 2);
accent.position.set(0, WALL_HEIGHT - 0.6, -2);
scene.add(accent);

// --- input + stats ----------------------------------------------------------
const input = new Input(renderer.domElement);
const stats = new StatsOverlay('stats');

// --- resize -----------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- main loop (delta-time aware, no per-frame allocations) ------------------
const timer = new THREE.Timer();
timer.connect(document); // pause timing when the tab is hidden
const forward = { x: 0, z: 0 };
const right = { x: 0, z: 0 };
const move = { x: 0, z: 0 };

function tick(): void {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.1); // clamp big tab-switch deltas

  // Movement in camera yaw space.
  input.getMoveAxis(move);
  input.getForward(forward);
  input.getRight(right);
  camera.position.x += (forward.x * move.z + right.x * move.x) * MOVE_SPEED * dt;
  camera.position.z += (forward.z * move.z + right.z * move.x) * MOVE_SPEED * dt;

  // Keep the camera inside the room (simple wall collision).
  const bound = ROOM_HALF - 0.5;
  camera.position.x = Math.max(-bound, Math.min(bound, camera.position.x));
  camera.position.z = Math.max(-bound, Math.min(bound, camera.position.z));
  camera.position.y = EYE_HEIGHT;

  camera.rotation.order = 'YXZ';
  camera.rotation.y = input.yawRad;
  camera.rotation.x = input.pitchRad;

  const t0 = performance.now();
  renderer.render(scene, camera);
  stats.frame(renderer, performance.now() - t0);

  requestAnimationFrame(tick);
}

tick();

// Debug handle for automated browser verification (read-only for tests).
(window as unknown as { __dreadlock: unknown }).__dreadlock = { camera, renderer };
