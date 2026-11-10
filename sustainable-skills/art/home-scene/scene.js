// A 3D model of a UK home with clean energy kit, rendered to a still for the Sustainable Local Energy Skills Roadmap.
// Query: ?w=2688&h=1504&mode=day|night&blades=0|1&ao=0|1
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const Q = new URLSearchParams(location.search);
const W = +Q.get('w') || 1344, H = +Q.get('h') || 752;
const NIGHT = Q.get('mode') === 'night';
const BLADES = Q.get('blades') === '1';
const AO = Q.get('ao') !== '0';

let seed = 11;
function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = NIGHT ? 1.05 : 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = NIGHT ? 0.05 : 0.5;

// ---------- textures drawn on canvases ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
function rep(tex, x, y) { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(x, y); return t; }
function rgb(r, g, b) { return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')'; }

// Bricks: 10 across and 30 courses in a 2.25 m square
const BRICK_M = 2.25;
const brickTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#cbbfb1'; g.fillRect(0, 0, w, h);
  const bw = w / 10, bh = h / 30;
  for (let r = 0; r < 30; r++) {
    const off = (r % 2) * bw / 2;
    for (let c = -1; c < 11; c++) {
      const x = c * bw + off, y = r * bh, v = (rnd() - 0.5) * 34, v2 = (rnd() - 0.5) * 12;
      g.fillStyle = rgb(176 + v, 96 + v * 0.55 + v2, 64 + v * 0.35);
      g.fillRect(x + 2.5, y + 2.5, bw - 5, bh - 5);
      for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(40,20,10,' + (rnd() * 0.12) + ')'; g.fillRect(x + 3 + rnd() * (bw - 8), y + 3 + rnd() * (bh - 8), 2 + rnd() * 3, 2); }
      g.fillStyle = 'rgba(255,240,220,0.08)'; g.fillRect(x + 2.5, y + 2.5, bw - 5, 3);
    }
  }
});
const brickMat = (w, h) => new THREE.MeshStandardMaterial({ map: rep(brickTex, w / BRICK_M, h / BRICK_M), roughness: 0.92 });

// Slates: 2 m square
const SLATE_M = 2;
const slateTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#2c3036'; g.fillRect(0, 0, w, h);
  const rows = 16, cols = 8, rh = h / rows, cw = w / cols;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * cw / 2;
    for (let c = -1; c <= cols; c++) {
      const v = (rnd() - 0.5) * 14;
      g.fillStyle = rgb(70 + v, 75 + v, 82 + v);
      g.fillRect(c * cw + off + 1, r * rh + 1, cw - 2, rh - 2);
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(c * cw + off + 1, r * rh + rh - 4, cw - 2, 3);
    }
  }
});
const slateMat = (w, h) => new THREE.MeshStandardMaterial({ map: rep(slateTex, w / SLATE_M, h / SLATE_M), roughness: 0.75, metalness: 0.05 });

// Solar panel face: 6 x 10 cells, portrait
const panelTex = canvasTex(256, 420, (g, w, h) => {
  g.fillStyle = '#c9ced4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#0f1d33'; g.fillRect(7, 7, w - 14, h - 14);
  const cw = (w - 14) / 6, ch = (h - 14) / 10;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) {
    const v = (rnd() - 0.5) * 8;
    g.fillStyle = rgb(22 + v, 38 + v, 70 + v);
    g.fillRect(7 + c * cw + 1.5, 7 + r * ch + 1.5, cw - 3, ch - 3);
    g.fillStyle = 'rgba(150,175,215,0.18)'; g.fillRect(7 + c * cw + 1.5, 7 + r * ch + ch / 2, cw - 3, 1);
  }
});

// Block paving: 2 m square
const paveTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#9b938b'; g.fillRect(0, 0, w, h);
  const bw = w / 10, bh = h / 20;
  for (let r = 0; r < 20; r++) {
    const off = (r % 2) * bw / 2;
    for (let c = -1; c <= 10; c++) {
      const v = (rnd() - 0.5) * 22;
      g.fillStyle = rgb(196 + v, 186 + v, 172 + v);
      g.fillRect(c * bw + off + 1.5, r * bh + 1.5, bw - 3, bh - 3);
    }
  }
});
// Grass with mowing stripes: 4 m square
const grassTex = canvasTex(512, 512, (g, w, h) => {
  for (let x = 0; x < w; x += 64) { g.fillStyle = (x / 64) % 2 ? '#6c9a50' : '#76a659'; g.fillRect(x, 0, 64, h); }
  for (let k = 0; k < 9000; k++) { const v = rnd(); g.fillStyle = v > 0.5 ? 'rgba(40,90,30,0.28)' : 'rgba(170,215,120,0.2)'; g.fillRect(rnd() * w, rnd() * h, 1.5, 3); }
});
// Pavement slabs: 2 m square
const slabTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#a7a8a6'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const v = (rnd() - 0.5) * 14; g.fillStyle = rgb(200 + v, 200 + v, 197 + v); g.fillRect(c * 64 + 1.5, r * 64 + 1.5, 61, 61); }
});
// Asphalt: 4 m square
const roadTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4b4f55'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 6000; k++) { const v = 60 + rnd() * 60; g.fillStyle = rgb(v, v + 3, v + 7); g.globalAlpha = 0.25; g.fillRect(rnd() * w, rnd() * h, 1.6, 1.6); }
  g.globalAlpha = 1;
});
// Garage door: horizontal panels
const garageTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#5b636c'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { g.fillStyle = '#4b535b'; g.fillRect(0, r * 64 + 60, w, 4); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, r * 64 + 2, w, 2); for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, r * 64 + 14 + k * 6, w, 1); } }
});
// Heat pump fan face: grille rings with a dark fan behind
const fanTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#e6e9ec'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2d3238'; g.beginPath(); g.arc(128, 128, 116, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#545b63';
  for (let i = 0; i < 3; i++) { g.save(); g.translate(128, 128); g.rotate(i * Math.PI * 2 / 3 + 0.4); g.beginPath(); g.moveTo(0, -10); g.bezierCurveTo(40, -60, 90, -70, 104, -40); g.bezierCurveTo(80, -20, 40, -6, 0, 10); g.fill(); g.restore(); }
  g.fillStyle = '#9aa2aa'; g.beginPath(); g.arc(128, 128, 18, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(210,214,219,0.85)'; g.lineWidth = 2.2;
  for (let r = 26; r < 118; r += 13) { g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.stroke(); }
  g.beginPath(); g.moveTo(10, 128); g.lineTo(246, 128); g.moveTo(128, 10); g.lineTo(128, 246); g.stroke();
});
const louvreTex = canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#e6e9ec'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c3c9cf'; for (let x = 10; x < w - 6; x += 9) g.fillRect(x, 20, 4, h - 40);
});

const winTex = canvasTex(256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  if (NIGHT) { gr.addColorStop(0, '#ffcf8a'); gr.addColorStop(1, '#f2a75a'); } else { gr.addColorStop(0, '#8fa9bf'); gr.addColorStop(0.35, '#3d5163'); gr.addColorStop(1, '#22303c'); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // curtains at the sides
  for (const side of [0, 1]) { const x0 = side ? w * 0.8 : 0; for (let k = 0; k < 8; k++) { g.fillStyle = (k % 2) ? (NIGHT ? 'rgba(255,236,205,0.85)' : 'rgba(236,232,224,0.92)') : (NIGHT ? 'rgba(240,210,170,0.85)' : 'rgba(214,209,200,0.92)'); g.fillRect(x0 + k * w * 0.025, 0, w * 0.025, h); } }
  // a soft reflection streak
  if (!NIGHT) { g.save(); g.globalAlpha = 0.22; g.fillStyle = '#ffffff'; g.translate(w * 0.55, 0); g.rotate(0.5); g.fillRect(0, -40, 26, h * 2); g.fillRect(40, -40, 10, h * 2); g.restore(); }
});
// ---------- materials ----------
const M = {
  frame: new THREE.MeshStandardMaterial({ color: 0x353b42, roughness: 0.45, metalness: 0.2 }),
  glass: new THREE.MeshPhysicalMaterial({ map: winTex, color: 0xffffff, roughness: 0.08, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.55, emissive: NIGHT ? 0xffb35c : 0x000000, emissiveMap: NIGHT ? winTex : null, emissiveIntensity: NIGHT ? 1.2 : 0 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xe6e0d4, roughness: 0.85 }),
  fascia: new THREE.MeshStandardMaterial({ color: 0x2f343a, roughness: 0.6 }),
  door: new THREE.MeshStandardMaterial({ color: 0x1f6f68, roughness: 0.4, metalness: 0.1 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf1f3f4, roughness: 0.45 }),
  whiteDark: new THREE.MeshStandardMaterial({ color: 0xd8dde1, roughness: 0.5 }),
  black: new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.6 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.92 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xb9c0c7, roughness: 0.28, metalness: 0.9 }),
  carPaint: new THREE.MeshPhysicalMaterial({ color: 0x2a5ea8, roughness: 0.3, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.06 }),
  vanPaint: new THREE.MeshPhysicalMaterial({ color: 0xf3f5f6, roughness: 0.35, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
  tinted: new THREE.MeshPhysicalMaterial({ color: 0x141c24, roughness: 0.05, metalness: 0.2, envMapIntensity: 1.6 }),
  led: new THREE.MeshStandardMaterial({ color: 0x2eb895, emissive: 0x2eb895, emissiveIntensity: NIGHT ? 4 : 1.6 }),
  tail: new THREE.MeshStandardMaterial({ color: 0x9a1b1b, emissive: 0xc0221f, emissiveIntensity: NIGHT ? 2.2 : 0.4, roughness: 0.3 }),
  head: new THREE.MeshStandardMaterial({ color: 0xe9eef2, emissive: 0xfff6dc, emissiveIntensity: NIGHT ? 1.2 : 0.15, roughness: 0.2 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.5 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8a6a4b, roughness: 0.85 }),
  fence: new THREE.MeshStandardMaterial({ color: 0x7b5f45, roughness: 0.9 }),
  hivis: new THREE.MeshStandardMaterial({ color: 0xf28c28, roughness: 0.7 }),
  reflect: new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.35, emissive: 0x666666, emissiveIntensity: 0.2 }),
  trousers: new THREE.MeshStandardMaterial({ color: 0x252f3d, roughness: 0.85 }),
  boots: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 }),
  toolbox: new THREE.MeshStandardMaterial({ color: 0xc8352f, roughness: 0.5 }),
  tablet: new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.3, emissive: 0x3a6f9c, emissiveIntensity: 0.5 }),
  turbine: new THREE.MeshStandardMaterial({ color: 0xe9edf0, roughness: 0.5, fog: false }),
  steel: new THREE.MeshStandardMaterial({ color: 0x8c959e, roughness: 0.6, metalness: 0.4 }),
  kerb: new THREE.MeshStandardMaterial({ color: 0xbfc0bd, roughness: 0.9 }),
  soil: new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 1 }),
  chipping: new THREE.MeshStandardMaterial({ color: 0xb6b1aa, roughness: 1 }),
};
function mesh(geo, mat, cast = true, receive = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; return m; }
function box(w, h, d, mat, x, y, z, parent = scene) { const m = mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }
function rbox(w, h, d, r, mat, x, y, z, parent = scene) { const m = mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat); m.position.set(x, y, z); parent.add(m); return m; }

// ---------- the house ----------
const HX0 = -4.5, HX1 = 4.5, HZ0 = -3.75, HZ1 = 3.75, EAVE = 5.6, OVER = 0.38;
const houseW = HX1 - HX0, houseD = HZ1 - HZ0;
{
  const mats = [brickMat(houseD, EAVE), brickMat(houseD, EAVE), M.stone, M.stone, brickMat(houseW, EAVE), brickMat(houseW, EAVE)];
  const b = mesh(new THREE.BoxGeometry(houseW, EAVE, houseD), mats); b.position.set(0, EAVE / 2, 0); scene.add(b);
}
// gable triangles (left and right)
const halfSpan = houseD / 2 + OVER, pitch = THREE.MathUtils.degToRad(38), rise = halfSpan * Math.tan(pitch), RIDGE = EAVE + rise - OVER * Math.tan(pitch);
{
  const tri = new THREE.Shape(); tri.moveTo(HZ0, 0); tri.lineTo(HZ1, 0); tri.lineTo(0, RIDGE - EAVE); tri.closePath();
  const g = new THREE.ExtrudeGeometry(tri, { depth: houseW, bevelEnabled: false });
  const tex = rep(brickTex, 1 / BRICK_M, 1 / BRICK_M);
  const m = mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }));
  m.rotation.y = Math.PI / 2; m.position.set(HX0, EAVE, 0);
  // ExtrudeGeometry extrudes along +z of the shape; after rotating, shape x maps to -z: fix by mirroring
  m.scale.set(1, 1, 1);
  scene.add(m);
}
// roof slopes
const slopeLen = halfSpan / Math.cos(pitch);
const roofLen = houseW + 0.6;
function roofSlope(front) {
  const grp = new THREE.Group();
  const s = front ? 1 : -1;
  grp.position.set(0, EAVE - OVER * Math.tan(pitch), s * (houseD / 2 + OVER));
  grp.rotation.x = s * -(Math.PI / 2 - pitch) + (front ? 0 : 0);
  scene.add(grp);
  // slope plane: local x along ridge, local y along slope (towards ridge)
  const plate = mesh(new THREE.BoxGeometry(roofLen, slopeLen, 0.16), [M.fascia, M.fascia, M.fascia, M.fascia, slateMat(roofLen, slopeLen), M.fascia]);
  plate.position.set(0, slopeLen / 2, 0.0);
  grp.add(plate);
  return grp;
}
// A plane tilted to the slope: build with lookAt-free math instead
const roofFront = new THREE.Group(); scene.add(roofFront);
const roofBack = new THREE.Group(); scene.add(roofBack);
{
  const eaveY = EAVE - OVER * Math.tan(pitch);
  for (const [grp, s] of [[roofFront, 1], [roofBack, -1]]) {
    grp.position.set(0, eaveY, s * (houseD / 2 + OVER));
    grp.rotation.x = -s * (Math.PI / 2 - pitch);
    if (s < 0) grp.rotation.y = Math.PI, grp.rotation.x = -(Math.PI / 2 - pitch), grp.position.z = -(houseD / 2 + OVER);
    const plate = mesh(new THREE.BoxGeometry(roofLen, slopeLen, 0.16), [M.fascia, M.fascia, M.fascia, M.fascia, slateMat(roofLen, slopeLen), M.fascia]);
    plate.position.set(0, slopeLen / 2, 0);
    grp.add(plate);
  }
}
// ridge, fascia and gutters
box(roofLen + 0.05, 0.16, 0.34, M.fascia, 0, RIDGE + 0.04, 0);
box(roofLen, 0.24, 0.12, M.fascia, 0, EAVE - OVER * Math.tan(pitch) - 0.05, houseD / 2 + OVER + 0.02);
{
  const gut = mesh(new THREE.CylinderGeometry(0.07, 0.07, roofLen, 12, 1, false, 0, Math.PI), M.fascia); gut.rotation.z = Math.PI / 2; gut.position.set(0, EAVE - OVER * Math.tan(pitch) - 0.12, houseD / 2 + OVER + 0.1); scene.add(gut);
}
// bargeboards on the gables
for (const sx of [HX0 - 0.3, HX1 + 0.3]) {
  for (const s of [1, -1]) {
    const len = slopeLen + 0.1;
    const bb = box(0.08, 0.26, len, M.fascia, sx, 0, 0);
    bb.position.set(sx, (EAVE - OVER * Math.tan(pitch) + RIDGE) / 2 + 0.02, s * (houseD / 2 + OVER) / 2);
    bb.rotation.x = s * pitch;
  }
}
// chimney on the right gable
box(0.75, 1.5, 0.6, brickMat(0.75, 1.5), HX1 - 0.45, RIDGE + 0.35, -0.2);
box(0.85, 0.1, 0.7, M.stone, HX1 - 0.45, RIDGE + 1.12, -0.2);
box(0.18, 0.35, 0.18, M.fascia, HX1 - 0.6, RIDGE + 1.33, -0.2);

// solar panels on the front slope: 5 columns x 2 rows, portrait
const panels = new THREE.Group(); roofFront.add(panels);
const PW = 1.04, PH = 1.74, GAP = 0.03, COLS = 5, ROWS = 2;
const arrW = COLS * PW + (COLS - 1) * GAP, arrH = ROWS * PH + (ROWS - 1) * GAP;
const arrX0 = -arrW / 2 - 0.4, arrY0 = 0.55;
const panelMat = new THREE.MeshPhysicalMaterial({ map: panelTex, roughness: 0.18, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 });
const frameMat = new THREE.MeshStandardMaterial({ color: 0xc4cad1, metalness: 0.9, roughness: 0.3 });
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const p = mesh(new THREE.BoxGeometry(PW, PH, 0.045), [frameMat, frameMat, frameMat, frameMat, panelMat, frameMat]);
  p.position.set(arrX0 + c * (PW + GAP) + PW / 2, arrY0 + r * (PH + GAP) + PH / 2, 0.14);
  panels.add(p);
}

// ---------- facade details ----------
const FZ = HZ1; // front wall plane
function windowAt(x0, x1, y0, y1, opts = {}) {
  const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, fw = 0.07, d = 0.1;
  box(w + 0.02, h + 0.02, 0.04, M.frame, cx, cy, FZ + 0.005); // reveal backing
  const g = mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), M.glass, false, true); g.position.set(cx, cy, FZ + 0.03); scene.add(g);
  box(w, fw, d, M.frame, cx, y1 - fw / 2, FZ + 0.04); box(w, fw, d, M.frame, cx, y0 + fw / 2, FZ + 0.04);
  box(fw, h, d, M.frame, x0 + fw / 2, cy, FZ + 0.04); box(fw, h, d, M.frame, x1 - fw / 2, cy, FZ + 0.04);
  const mull = opts.mullions || 1;
  for (let i = 1; i <= mull; i++) box(0.06, h, d * 0.8, M.frame, x0 + (w * i) / (mull + 1), cy, FZ + 0.04);
  if (opts.transom) box(w, 0.06, d * 0.8, M.frame, cx, y1 - h * 0.28, FZ + 0.04);
  box(w + 0.16, 0.07, 0.16, M.stone, cx, y0 - 0.035, FZ + 0.07); // sill
  if (opts.header !== false) box(w + 0.1, 0.16, 0.06, M.stone, cx, y1 + 0.1, FZ + 0.02);
  return { cx, cy };
}
const winLiving = windowAt(-3.6, -1.1, 0.9, 2.3, { mullions: 2, transom: true });
const winSmall = windowAt(2.1, 3.45, 1.0, 2.3, { mullions: 1 });
const winUp1 = windowAt(-3.5, -1.2, 3.35, 4.75, { mullions: 2 });
const winUp2 = windowAt(-0.45, 0.65, 3.35, 4.75, { mullions: 0 });
const winUp3 = windowAt(1.55, 3.55, 3.35, 4.75, { mullions: 1 });
// door, side light and canopy
box(1.02, 2.18, 0.06, M.frame, 0.95, 1.09, FZ + 0.01);
box(0.92, 2.08, 0.08, M.door, 0.95, 1.06, FZ + 0.05);
{ const gl = mesh(new THREE.PlaneGeometry(0.16, 1.5), M.glass, false); gl.position.set(1.18, 1.15, FZ + 0.095); scene.add(gl); }
box(0.05, 0.22, 0.05, M.rim, 0.62, 1.05, FZ + 0.12);
box(1.4, 0.14, 0.3, M.stone, 0.95, 0.07, FZ + 0.2); // step
{
  const cg = new THREE.Group(); cg.position.set(0.95, 2.48, FZ); scene.add(cg);
  const cl = 0.9, ang = THREE.MathUtils.degToRad(28);
  for (const s of [-1, 1]) {
    const pl = mesh(new THREE.BoxGeometry(cl, 0.08, 0.95), slateMat(cl, 0.95));
    pl.position.set(s * cl / 2 * Math.cos(ang), Math.sin(ang) * cl / 2, 0.48); pl.rotation.z = -s * ang; cg.add(pl);
  }
  for (const s of [-1, 1]) { const br = box(0.08, 0.5, 0.08, M.wood, s * 0.72, -0.25, 0.75, cg); br.rotation.x = 0.6; }
}
// stone band above the ground floor
box(houseW + 0.04, 0.12, 0.05, M.stone, 0, 2.62, FZ + 0.02);
// downpipe
{ const dp = mesh(new THREE.CylinderGeometry(0.045, 0.045, EAVE - 0.2, 10), M.fascia); dp.position.set(HX0 + 0.25, (EAVE - 0.2) / 2, FZ + 0.12); scene.add(dp); }

// garage (attached, flush with the front)
const GX0 = HX1, GX1 = HX1 + 3.4, GH = 3.0, GZ0 = HZ1 - 6.0;
{
  const gw = GX1 - GX0, gd = HZ1 - GZ0;
  const mats = [brickMat(gd, GH), brickMat(gd, GH), M.fascia, M.fascia, brickMat(gw, GH), brickMat(gw, GH)];
  const g = mesh(new THREE.BoxGeometry(gw, GH, gd), mats); g.position.set((GX0 + GX1) / 2, GH / 2, (GZ0 + HZ1) / 2); scene.add(g);
  box(gw + 0.15, 0.22, gd + 0.15, M.fascia, (GX0 + GX1) / 2, GH + 0.05, (GZ0 + HZ1) / 2);
  const door = mesh(new THREE.BoxGeometry(2.5, 2.15, 0.05), [M.fascia, M.fascia, M.fascia, M.fascia, new THREE.MeshStandardMaterial({ map: rep(garageTex, 1, 1), roughness: 0.55, metalness: 0.3 }), M.fascia]);
  door.position.set((GX0 + GX1) / 2, 1.075, HZ1 + 0.01); scene.add(door);
  box(2.66, 0.08, 0.1, M.frame, (GX0 + GX1) / 2, 2.19, HZ1 + 0.04);
}

// ---------- clean energy kit ----------
// battery on the front wall, left of the living room window
const battery = rbox(0.6, 1.05, 0.17, 0.035, M.white, -4.1, 1.15, FZ + 0.1);
box(0.04, 0.5, 0.01, M.led, -4.1, 1.2, FZ + 0.19);
// heat pump beside the house, facing the street
const HP = new THREE.Vector3(-6.45, 0, 2.7);
{
  box(1.25, 0.12, 0.6, M.stone, HP.x, 0.06, HP.z); // pad
  const body = rbox(1.08, 0.86, 0.4, 0.03, M.white, HP.x, 0.12 + 0.18 + 0.43, HP.z);
  for (const dx of [-0.4, 0.4]) box(0.12, 0.18, 0.36, M.black, HP.x + dx, 0.21, HP.z);
  const fan = mesh(new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshStandardMaterial({ map: fanTex, roughness: 0.6 }), false); fan.position.set(HP.x - 0.17, 0.73, HP.z + 0.205); scene.add(fan);
  const lv = mesh(new THREE.PlaneGeometry(0.28, 0.6), new THREE.MeshStandardMaterial({ map: louvreTex, roughness: 0.6 }), false); lv.position.set(HP.x + 0.33, 0.73, HP.z + 0.205); scene.add(lv);
  // pipes into the wall
  const pipeLen = HX0 - (HP.x + 0.54) + 0.05;
  for (const dy of [0.55, 0.7]) { const p = mesh(new THREE.CylinderGeometry(0.035, 0.035, pipeLen, 8), M.black); p.rotation.z = Math.PI / 2; p.position.set(HP.x + 0.54 + pipeLen / 2, dy, HP.z - 0.05); scene.add(p); }
}
const fanCentre = new THREE.Vector3(HP.x - 0.17, 0.73, HP.z + 0.21), fanEdge = new THREE.Vector3(HP.x - 0.17 + 0.25, 0.73, HP.z + 0.21);
// EV charger on the front wall between the window and the garage
const WB = new THREE.Vector3(4.05, 1.18, FZ + 0.08);
rbox(0.3, 0.44, 0.14, 0.04, M.white, WB.x, WB.y, WB.z);
box(0.22, 0.3, 0.01, M.black, WB.x, WB.y + 0.02, WB.z + 0.075);
box(0.1, 0.02, 0.01, M.led, WB.x, WB.y + 0.13, WB.z + 0.082);

// ---------- the car (side on, nose to the left) ----------
function extrudedProfile(points, depth, mat, bevel = 0.06) {
  const s = new THREE.Shape(); s.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  return mesh(g, mat);
}
function wheel(parent, x, z, r = 0.36, w = 0.25) {
  const t = mesh(new THREE.CylinderGeometry(r, r, w, 28), M.rubber); t.rotation.x = Math.PI / 2; t.position.set(x, r, z); parent.add(t);
  const rim = mesh(new THREE.CylinderGeometry(r * 0.66, r * 0.66, w + 0.02, 24), M.rim); rim.rotation.x = Math.PI / 2; rim.position.set(x, r, z); parent.add(rim);
  const hub = mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, w + 0.04, 12), M.black); hub.rotation.x = Math.PI / 2; hub.position.set(x, r, z); parent.add(hub);
  for (let i = 0; i < 5; i++) { const sp = box(0.05, r * 1.15, 0.02, M.black, x, r, z + Math.sign(z) * (w / 2 + 0.012), parent); sp.rotation.z = i * Math.PI * 2 / 5; }
}
const car = new THREE.Group(); scene.add(car);
const CAR = new THREE.Vector3(6.55, 0, 7.15);
car.position.copy(CAR);
{
  const L = 4.4;
  const prof = [[0.05, 0.36], [0, 0.62], [0.04, 0.78], [0.22, 0.88], [0.62, 0.95], [1.12, 1.0], [1.5, 1.22], [1.86, 1.43], [2.3, 1.52], [3.2, 1.53], [3.72, 1.46], [4.08, 1.32], [4.3, 1.12], [4.4, 0.9], [4.38, 0.4]];
  const body = extrudedProfile(prof, 1.72, M.carPaint, 0.07); body.position.x = -L / 2; car.add(body);
  const glassProf = [[1.2, 1.04], [1.86, 1.4], [2.32, 1.48], [3.2, 1.49], [3.68, 1.42], [4.02, 1.26], [4.12, 1.08]];
  const gl = extrudedProfile(glassProf, 1.74, M.tinted, 0.03); gl.position.x = -L / 2; car.add(gl);
  box(0.09, 0.44, 1.83, M.carPaint, -L / 2 + 2.58, 1.28, 0, car); // B pillar
  wheel(car, -L / 2 + 0.88, 0.8); wheel(car, -L / 2 + 3.5, 0.8); wheel(car, -L / 2 + 0.88, -0.8); wheel(car, -L / 2 + 3.5, -0.8);
  box(0.06, 0.12, 1.4, M.head, -L / 2 - 0.02, 0.8, 0, car);
  box(0.06, 0.1, 1.5, M.tail, L / 2 + 0.03, 0.98, 0, car);
  box(0.16, 0.1, 0.12, M.carPaint, -L / 2 + 1.25, 1.12, 0.95, car); // mirror
  box(0.5, 0.03, 0.02, M.rim, -L / 2 + 2.0, 0.92, 0.94, car); // handle line
  box(0.5, 0.03, 0.02, M.rim, -L / 2 + 3.0, 0.92, 0.94, car);
  box(2.5, 0.09, 0.03, new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.7 }), 0.0, 0.4, 0.92, car); // lower cladding between the wheels
  box(2.5, 0.09, 0.03, new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.7 }), 0.0, 0.4, -0.92, car);
  box(3.2, 0.025, 0.02, new THREE.MeshStandardMaterial({ color: 0x9fb8d8, roughness: 0.3, metalness: 0.6 }), 0.1, 0.98, 0.935, car); // shoulder line
  for (const wx of [-L / 2 + 0.88, -L / 2 + 3.5]) { const arch = mesh(new THREE.CylinderGeometry(0.44, 0.44, 1.76, 24, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.9, side: THREE.DoubleSide })); arch.rotation.x = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.position.set(wx, 0.38, 0); car.add(arch); }
}
const chargePort = new THREE.Vector3(CAR.x - 2.2 + 0.55, 0.86, CAR.z + 0.95);
// charging cable from the wallbox to the car
const cableCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(WB.x, WB.y - 0.22, WB.z + 0.02), new THREE.Vector3(WB.x + 0.03, 0.55, WB.z + 0.1), new THREE.Vector3(WB.x + 0.1, 0.04, WB.z + 0.45),
  new THREE.Vector3(WB.x + 0.35, 0.04, 5.6), new THREE.Vector3(chargePort.x - 0.15, 0.04, chargePort.z - 0.05), new THREE.Vector3(chargePort.x - 0.05, 0.5, chargePort.z + 0.05), chargePort.clone()
]);
scene.add(mesh(new THREE.TubeGeometry(cableCurve, 80, 0.028, 8, false), M.cable));

// ---------- people ----------
function person(opts) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: opts.skin, roughness: 0.6 });
  const legL = mesh(new THREE.CapsuleGeometry(0.088, 0.7, 6, 12), M.trousers); legL.position.set(-0.1, 0.47, 0); legL.rotation.x = opts.step || 0; g.add(legL);
  const legR = mesh(new THREE.CapsuleGeometry(0.088, 0.7, 6, 12), M.trousers); legR.position.set(0.1, 0.47, 0); legR.rotation.x = -(opts.step || 0); g.add(legR);
  const hips = mesh(new THREE.CapsuleGeometry(0.16, 0.12, 6, 12), M.trousers); hips.rotation.z = Math.PI / 2; hips.scale.set(1, 1, 0.75); hips.position.set(0, 0.9, 0); g.add(hips);
  box(0.13, 0.08, 0.26, M.boots, -0.1, 0.04, 0.04 + (opts.step || 0) * 0.4, g); box(0.13, 0.08, 0.26, M.boots, 0.1, 0.04, 0.04 - (opts.step || 0) * 0.4, g);
  const torso = mesh(new THREE.CapsuleGeometry(0.2, 0.36, 6, 16), M.hivis); torso.scale.set(1, 1, 0.66); torso.position.set(0, 1.2, 0); g.add(torso);
  for (const y of [1.08, 1.24]) { const st = mesh(new THREE.CylinderGeometry(0.207, 0.207, 0.05, 20), M.reflect); st.scale.set(1, 1, 0.67); st.position.set(0, y, 0); g.add(st); }
  const shoulder = mesh(new THREE.CapsuleGeometry(0.11, 0.3, 6, 12), M.trousers); shoulder.rotation.z = Math.PI / 2; shoulder.scale.set(1, 1, 0.8); shoulder.position.set(0, 1.42, 0); g.add(shoulder);
  const armL = mesh(new THREE.CapsuleGeometry(0.065, 0.52, 6, 10), M.trousers); armL.geometry.translate(0, -0.26, 0); armL.position.set(-0.27, 1.45, 0); armL.rotation.z = 0.1; armL.rotation.x = opts.armL || 0; g.add(armL);
  const armR = mesh(new THREE.CapsuleGeometry(0.065, 0.52, 6, 10), M.trousers); armR.geometry.translate(0, -0.26, 0); armR.position.set(0.27, 1.45, 0); armR.rotation.z = -0.1; armR.rotation.x = opts.armR || 0; g.add(armR);
  const neck = mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.12, 12), skin); neck.position.set(0, 1.55, 0); g.add(neck);
  const head = mesh(new THREE.SphereGeometry(0.115, 24, 18), skin); head.scale.set(0.95, 1.08, 1); head.position.set(0, 1.7, 0); g.add(head);
  if (opts.hair === 'hijab') {
    const hj = mesh(new THREE.SphereGeometry(0.128, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshStandardMaterial({ color: opts.scarf || 0x2e5f9e, roughness: 0.8 })); hj.position.set(0, 1.705, -0.015); g.add(hj);
    const dr = mesh(new THREE.CylinderGeometry(0.11, 0.17, 0.2, 18), hj.material); dr.position.set(0, 1.54, -0.01); g.add(dr);
    head.scale.set(0.92, 0.95, 0.92);
  } else {
    const hr = mesh(new THREE.SphereGeometry(0.116, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x1d1814, roughness: 0.9 })); hr.position.set(0, 1.725, -0.01); hr.rotation.x = -0.25; g.add(hr);
    if (opts.hair === 'hat') { const hat = mesh(new THREE.SphereGeometry(0.13, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffd34d, roughness: 0.45 })); hat.position.set(0, 1.74, 0); g.add(hat); const brim = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 20), hat.material); brim.position.set(0, 1.745, 0.02); g.add(brim); }
  }
  if (opts.toolbox) { box(0.4, 0.22, 0.18, M.toolbox, 0.33, 0.78, 0.06, g); box(0.2, 0.04, 0.03, M.black, 0.33, 0.92, 0.06, g); }
  if (opts.tablet) { const tb = box(0.27, 0.02, 0.2, M.tablet, 0, 1.12, 0.3, g); tb.rotation.x = -0.75; }
  g.position.copy(opts.at); g.rotation.y = opts.turn || 0;
  scene.add(g);
  return g;
}
const p1 = person({ at: new THREE.Vector3(-7.3, 0, 3.6), skin: 0x8a5a3c, hair: 'hat', tablet: true, armL: -0.9, armR: -0.9, turn: 0.75 });
const p2 = person({ at: new THREE.Vector3(3.15, 0, 6.3), skin: 0x6b4430, hair: 'hijab', scarf: 0x2b4f86, toolbox: true, step: 0.28, armL: 0.25, turn: -0.35 });

// ---------- garden, drive, street ----------
function ground(w, d, mat, x, z, y = 0) { const m = mesh(new THREE.PlaneGeometry(w, d), mat, false, true); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; }
ground(400, 400, new THREE.MeshStandardMaterial({ color: 0x7fae5c, roughness: 1 }), 0, -150, -0.02);
ground(15.5, 7.3, new THREE.MeshStandardMaterial({ map: rep(grassTex, 15.5 / 4, 7.3 / 4), roughness: 0.95 }), -4.3, 7.4, 0.002);
ground(5.6, 7.3, new THREE.MeshStandardMaterial({ map: rep(paveTex, 5.6 / 2, 7.3 / 2), roughness: 0.85 }), 6.1, 7.4, 0.004);
ground(1.3, 7.3, new THREE.MeshStandardMaterial({ map: rep(paveTex, 1.3 / 2, 7.3 / 2), roughness: 0.85 }), 0.95, 7.4, 0.005);
ground(80, 2.2, new THREE.MeshStandardMaterial({ map: rep(slabTex, 40, 1.1), roughness: 0.9 }), 0, 12.15, 0.006);
ground(80, 7.5, new THREE.MeshStandardMaterial({ map: rep(roadTex, 20, 1.9), roughness: 0.95 }), 0, 17.0, 0.0);
box(80, 0.13, 0.16, M.kerb, 0, 0.065, 13.25);
for (let x = -40; x < 40; x += 4.5) box(2.2, 0.01, 0.12, new THREE.MeshStandardMaterial({ color: 0xe9e7df, roughness: 0.8 }), x, 0.006, 17.2);
// planting beds along the front wall
ground(3.0, 0.9, M.soil, -2.4, 4.25, 0.008);
ground(2.2, 0.8, M.chipping, -6.4, 3.0, 0.009);
function shrub(x, z, r, col) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const c = new THREE.Color(col);
  for (let i = 0; i < 9; i++) { const cc = c.clone().offsetHSL(0, 0, (rnd() - 0.5) * 0.08); const s = mesh(new THREE.SphereGeometry(r * (0.45 + rnd() * 0.4), 20, 14), new THREE.MeshStandardMaterial({ color: cc, roughness: 0.95 })); s.position.set((rnd() - 0.5) * r * 1.5, r * (0.45 + rnd() * 0.45), (rnd() - 0.5) * r); g.add(s); }
}
shrub(-3.4, 4.25, 0.42, 0x4f8a3f); shrub(-2.5, 4.3, 0.36, 0x7d5fa6); shrub(-1.6, 4.25, 0.4, 0x5c9446); shrub(2.7, 4.2, 0.3, 0x4f8a3f);
shrub(-8.7, 4.4, 0.6, 0x3f7a35); shrub(-9.3, 6.4, 0.7, 0x467f3a);
// clipped bay trees in pots by the door
for (const x of [-0.05, 2.0]) { box(0.4, 0.45, 0.4, M.stone, x, 0.225, FZ + 0.4); const b = mesh(new THREE.IcosahedronGeometry(0.33, 2), new THREE.MeshStandardMaterial({ color: 0x4d7e3a, roughness: 0.85 })); b.position.set(x, 1.05, FZ + 0.4); scene.add(b); const st = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), M.wood); st.position.set(x, 0.62, FZ + 0.4); scene.add(st); }
// side fence
{ const hg = rbox(0.9, 1.55, 9.0, 0.35, new THREE.MeshStandardMaterial({ color: 0x3f7536, roughness: 1 }), -7.75, 0.78, 0.3); }
// trees: canopies built from lumpy, organic clumps
function clumpGeo(r) {
  const g = new THREE.SphereGeometry(r, 28, 20), pos = g.attributes.position, v = new THREE.Vector3();
  const k1 = rnd() * 10, k2 = rnd() * 10;
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const n = 1 + 0.13 * Math.sin(v.x * 5.1 / r + k1) * Math.cos(v.y * 4.3 / r + k2) + 0.07 * Math.sin(v.z * 9.7 / r + k1); v.multiplyScalar(n); pos.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
function tree(x, z, h, r, cols, trunkCol = 0x6d5440) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const t = mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.13, h * 0.62, 8), new THREE.MeshStandardMaterial({ color: trunkCol, roughness: 0.9 })); t.position.y = h * 0.31; g.add(t);
  // a few branches, then a canopy built from many soft clumps
  for (let i = 0; i < 4; i++) { const br = mesh(new THREE.CylinderGeometry(r * 0.03, r * 0.06, r * 0.9, 6), t.material); br.position.set(0, h * 0.58, 0); br.rotation.z = (i - 1.5) * 0.45; br.rotation.y = i * 1.3; br.translateY(r * 0.35); g.add(br); }
  for (let i = 0; i < 64; i++) {
    const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * r * 0.95, yy = (rnd() - 0.35) * r * 0.95;
    const cc = new THREE.Color(cols[i % cols.length]).offsetHSL(0, 0, (rnd() - 0.5) * 0.06);
    const s = mesh(clumpGeo(r * (0.22 + rnd() * 0.15)), new THREE.MeshStandardMaterial({ color: cc, roughness: 0.95 }));
    s.position.set(Math.cos(a) * rr, h * 0.66 + yy, Math.sin(a) * rr * 0.8); g.add(s);
  }
}
tree(-9.0, 6.2, 6.2, 2.4, [0xf3cfdb, 0xfbeef2, 0xe9b3c6, 0xf7dde6, 0x8fb06a]);
tree(10.6, -1.0, 6.8, 2.6, [0x5a8c44, 0x689c4f, 0x4c7d3b, 0x77a85a]);
tree(-12.5, -6.5, 7.0, 2.8, [0x5a9447, 0x6ea455]);
tree(17.5, 3.5, 5.5, 2.2, [0xeeb6c9, 0xf7dbe4, 0xfbeef2, 0x8fb06a]);
// neighbouring houses
function smallHouse(x, z, w, d, h, rotY = 0, tone = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  const b = mesh(new THREE.BoxGeometry(w, h, d), [brickMat(d, h), brickMat(d, h), M.stone, M.stone, brickMat(w, h), brickMat(w, h)]); b.position.y = h / 2; g.add(b);
  const ang = THREE.MathUtils.degToRad(38), hs = d / 2 + 0.3, sl = hs / Math.cos(ang);
  for (const s of [1, -1]) { const r = mesh(new THREE.BoxGeometry(w + 0.4, sl, 0.14), slateMat(w + 0.4, sl)); r.position.set(0, h + Math.sin(ang) * sl / 2 - 0.2, s * (hs - Math.cos(ang) * sl / 2)); r.rotation.x = s * -(Math.PI / 2 - ang); g.add(r); }
  for (let i = 0; i < 2; i++) { const wn = box(1.1, 1.1, 0.05, M.glass, -w / 4 + i * w / 2, h * 0.72, d / 2 + 0.03, g); wn.material = M.glass; box(1.1, 1.0, 0.05, M.glass, -w / 4 + i * w / 2, h * 0.28, d / 2 + 0.03, g); }
  return g;
}
smallHouse(-18.5, -4.0, 8, 7, 5.4);
smallHouse(19.5, -7.0, 8, 7, 5.4);
smallHouse(29.0, -9.0, 8, 7, 5.2);

// ---------- hills, turbines and pylons ----------
const hillMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 });
function hill(x, z, sx, sy, sz, c) { const h = mesh(new THREE.SphereGeometry(1, 48, 24), hillMat(c), false, true); h.scale.set(sx, sy, sz); h.position.set(x, -sy * 0.15, z); scene.add(h); }
hill(-70, -190, 130, 34, 70, 0x8fbb73); hill(85, -215, 150, 46, 80, 0x86b56c); hill(10, -280, 190, 60, 80, 0x9cc485);
// hedgerows on the hills
for (let i = 0; i < 90; i++) { const x = -170 + rnd() * 340, z = -165 - rnd() * 70; const t = mesh(new THREE.SphereGeometry(2.2 + rnd() * 2.5, 12, 8), new THREE.MeshStandardMaterial({ color: 0x547f45, roughness: 1 }), false, false); t.position.set(x, 1 + rnd() * 3, z); scene.add(t); }
const TURB = [];
const TX1 = +(Q.get('tx1') || 62), TZ1 = +(Q.get('tz1') || -212), TX2 = +(Q.get('tx2') || 108), TZ2 = +(Q.get('tz2') || -226), TS = +(Q.get('ts') || 0.22);
// ground height on the right-hand hill, so the turbines stand on it
function hillY(x, z) { const q = 1 - ((x - 85) / 150) ** 2 - ((z + 215) / 80) ** 2; return q > 0 ? -6.9 + 46 * Math.sqrt(q) : 0; }
function turbine(x, z, scale) {
  const baseY = hillY(x, z) - 0.8;
  const g = new THREE.Group(); g.position.set(x, baseY, z); g.scale.setScalar(scale); scene.add(g);
  const tower = mesh(new THREE.CylinderGeometry(0.9, 1.7, 62, 20), M.turbine, false, false); tower.position.y = 31; g.add(tower);
  const nac = rbox(3.2, 2.4, 2.2, 0.6, M.turbine, 0.6, 62.8, 0, g); nac.castShadow = false;
  const hub = mesh(new THREE.SphereGeometry(1.1, 16, 12), M.turbine, false, false); hub.position.set(0, 62.8, 1.6); g.add(hub);
  if (BLADES) {
    for (let i = 0; i < 3; i++) {
      const bl = new THREE.Shape(); bl.moveTo(-0.7, 0); bl.bezierCurveTo(-1.6, 8, -0.8, 26, -0.15, 36); bl.lineTo(0.15, 36); bl.bezierCurveTo(0.9, 24, 1.3, 8, 0.7, 0); bl.closePath();
      const m = mesh(new THREE.ShapeGeometry(bl), M.turbine, false, false); m.position.set(0, 62.8, 1.75); m.rotation.z = i * Math.PI * 2 / 3 + 0.5; g.add(m);
    }
  }
  TURB.push({ hub: new THREE.Vector3(x, baseY + 62.8 * scale, z + 1.75 * scale), len: 36 * scale });
}
turbine(TX1, TZ1, TS); turbine(TX2, TZ2, TS);
const PYL = [];
function pylon(x, z, s) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  const legs = [[-3, -3], [3, -3], [3, 3], [-3, 3]];
  for (const [lx, lz] of legs) { const l = mesh(new THREE.CylinderGeometry(0.18, 0.25, 40, 6), M.steel, false, false); l.position.set(lx / 2, 20, lz / 2); l.rotation.z = -lx * 0.018; l.rotation.x = lz * 0.018; g.add(l); }
  for (let y = 4; y < 38; y += 4.5) { const w = 3 - y * 0.055; for (const r of [0, Math.PI / 2]) { const br = box(w * 2.1, 0.12, 0.12, M.steel, 0, y, 0, g); br.rotation.y = r; br.rotation.z = 0.5; br.castShadow = false; } }
  for (const y of [28, 33, 37.5]) { const arm = box(y === 37.5 ? 7 : 11, 0.3, 0.3, M.steel, 0, y, 0, g); arm.castShadow = false; }
  PYL.push(new THREE.Vector3(x, 30 * s, z));
  return g;
}
pylon(-58, -95, 0.62); pylon(-30, -125, 0.62); pylon(-4, -160, 0.62);
{
  for (const dx of [-3.2, 3.2]) {
    const pts = [];
    const ends = [new THREE.Vector3(-58 + dx * 0.62, 28 * 0.62, -95), new THREE.Vector3(-30 + dx * 0.62, 28 * 0.62, -125), new THREE.Vector3(-4 + dx * 0.62, 28 * 0.62, -160)];
    for (let k = 0; k < ends.length - 1; k++) for (let t = 0; t <= 1; t += 0.05) { const p = ends[k].clone().lerp(ends[k + 1], t); p.y -= Math.sin(t * Math.PI) * 2.2; pts.push(p); }
    scene.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.08, 4, false), M.steel, false, false));
  }
}

// ---------- sky, fog and light ----------
const skyTex = canvasTex(1024, 576, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  if (NIGHT) { gr.addColorStop(0, '#05121f'); gr.addColorStop(0.7, '#0e2840'); gr.addColorStop(1, '#1c3e57'); }
  else { gr.addColorStop(0, '#5f9fd6'); gr.addColorStop(0.55, '#a8cdec'); gr.addColorStop(1, '#e4eef5'); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (NIGHT) { for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + rnd() * 0.7) + ')'; g.fillRect(rnd() * w, rnd() * h * 0.7, rnd() < 0.1 ? 2 : 1, rnd() < 0.1 ? 2 : 1); } }
  else {
    const cloud = (cx, cy, s) => { for (let i = 0; i < 9; i++) { const x = cx + (rnd() - 0.5) * 160 * s, y = cy + (rnd() - 0.5) * 26 * s, r = (26 + rnd() * 34) * s; const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(0.6, 'rgba(255,255,255,0.75)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } };
    cloud(140, 90, 1.1); cloud(820, 70, 1.25); cloud(620, 170, 0.8); cloud(950, 220, 0.7); cloud(330, 210, 0.6);
  }
});
scene.background = skyTex;
{ const env = skyTex.clone(); env.needsUpdate = true; env.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pmrem.fromEquirectangular(env).texture; scene.environmentIntensity = NIGHT ? 0.15 : 0.9; }
scene.fog = new THREE.Fog(NIGHT ? 0x10273a : 0xcfe2ee, 70, 520);
const hemi = new THREE.HemisphereLight(NIGHT ? 0x2a4a6a : 0xd4e8ff, NIGHT ? 0x0c1410 : 0x7c8a55, NIGHT ? 0.35 : 0.95); scene.add(hemi);
const sun = new THREE.DirectionalLight(NIGHT ? 0x9fb8e8 : 0xffe4c2, NIGHT ? 0.35 : 3.4);
sun.position.set(-30, 21, 20); sun.target.position.set(2, 0, 3); scene.add(sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 18, bottom: -16, near: 1, far: 110 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun);
if (NIGHT) {
  for (const p of [[winLiving.cx, winLiving.cy], [winUp1.cx, winUp1.cy], [winUp3.cx, winUp3.cy], [winSmall.cx, winSmall.cy]]) { const l = new THREE.PointLight(0xffb866, 6, 7, 2); l.position.set(p[0], p[1], FZ + 1.2); scene.add(l); }
  const porch = new THREE.PointLight(0xffd59a, 10, 6, 2); porch.position.set(0.95, 2.3, FZ + 0.9); scene.add(porch);
  const glow = new THREE.PointLight(0x2eb895, 2.5, 3, 2); glow.position.set(WB.x, WB.y, WB.z + 0.4); scene.add(glow);
  const lamp = new THREE.PointLight(0xffe2b0, 40, 18, 2); lamp.position.set(9.5, 5.5, 12.6); scene.add(lamp);
}


// ---------- camera, render and the positions of key parts on screen ----------
const camera = new THREE.PerspectiveCamera(31, W / H, 0.5, 1200);
camera.position.set(-0.9, 2.75, 28.0);
camera.lookAt(2.6, 4.55, 0);
camera.updateMatrixWorld();
scene.updateMatrixWorld(true);

function px(v) { const p = v.clone().project(camera); return [+(((p.x + 1) / 2) * 1344).toFixed(1), +(((1 - p.y) / 2) * 752).toFixed(1)]; }
const corners = [[0, 0], [arrW, 0], [arrW, arrH], [0, arrH]].map(([u, v]) => px(roofFront.localToWorld(new THREE.Vector3(arrX0 + u, arrY0 + v, 0.17))));
const P = {
  fan: px(fanCentre), fanR: Math.hypot(px(fanEdge)[0] - px(fanCentre)[0], px(fanEdge)[1] - px(fanCentre)[1]),
  panels: corners,
  panelsMid: px(roofFront.localToWorld(new THREE.Vector3(arrX0 + arrW / 2, arrY0 + arrH / 2, 0.17))),
  heatpump: px(new THREE.Vector3(HP.x + 0.33, 0.95, HP.z + 0.25)),
  battery: px(new THREE.Vector3(-4.1, 1.25, FZ + 0.2)),
  wallbox: px(WB), chargePort: px(chargePort),
  cable: cableCurve.getPoints(24).map(px),
  car: px(new THREE.Vector3(CAR.x + 0.4, 1.0, CAR.z + 0.95)),
  living: px(new THREE.Vector3(winLiving.cx + 0.4, winLiving.cy + 0.2, FZ)),
  wall: px(new THREE.Vector3(0.1, 2.95, FZ)),
  loft: px(roofFront.localToWorld(new THREE.Vector3(arrX0 + arrW + 0.9, slopeLen * 0.42, 0.1))),
  pylon: px(PYL[0]), pylons: PYL.map(px),
  turbines: TURB.map(t => { const h = px(t.hub); const tip = px(t.hub.clone().add(new THREE.Vector3(0, t.len, 0))); return { hub: h, len: +Math.hypot(tip[0] - h[0], tip[1] - h[1]).toFixed(1) }; }),
  people: [px(new THREE.Vector3(p1.position.x, 1.7, p1.position.z)), px(new THREE.Vector3(p2.position.x, 1.7, p2.position.z))],
};
window.__proj = P;

if (AO) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, W, H);
  gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 16 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  gtao.blendIntensity = 0.8;
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  composer.render();
} else {
  renderer.render(scene, camera);
}
window.__done = true;
