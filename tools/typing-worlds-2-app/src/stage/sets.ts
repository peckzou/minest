/**
 * Set pieces built for single worlds (used from StageSpec.build). Like the kit they are added
 * to the world's scene and freed with it.
 */
import * as THREE from 'three';

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A dark wooden desk top under a sheet of paper: the 1.0 desks are a flat near-black plane. */
export function woodDesk(scene: THREE.Scene, y: number, opts: { base?: string; grain?: string; size?: number } = {}) {
  const base = opts.base ?? '#3a2415';
  const grain = opts.grain ?? '#1c0f08';
  const tex = canvasTexture(1024, 1024, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    // planks
    const planks = 5;
    for (let p = 0; p < planks; p++) {
      const y0 = (p * h) / planks;
      const shade = (Math.random() - 0.5) * 0.16;
      g.fillStyle = shade > 0 ? `rgba(255,220,170,${shade})` : `rgba(0,0,0,${-shade})`;
      g.fillRect(0, y0, w, h / planks);
      // grain: long wavy lines
      for (let i = 0; i < 46; i++) {
        const yy = y0 + Math.random() * (h / planks);
        const amp = 2 + Math.random() * 5;
        const ph = Math.random() * 6.28;
        g.strokeStyle = grain;
        g.globalAlpha = 0.08 + Math.random() * 0.22;
        g.lineWidth = 0.6 + Math.random() * 1.6;
        g.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const v = yy + Math.sin(x * 0.006 + ph) * amp + Math.sin(x * 0.021 + ph * 2) * amp * 0.35;
          if (x === 0) g.moveTo(x, v);
          else g.lineTo(x, v);
        }
        g.stroke();
      }
      g.globalAlpha = 0.55;
      g.fillStyle = '#0a0503';
      g.fillRect(0, y0, w, 2);
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,230,190' : '0,0,0'},${Math.random() * 0.05})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 1);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const size = opts.size ?? 60;
  tex.repeat.set(size / 14, size / 14);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0.05 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  mesh.name = 't2-desk';
  scene.add(mesh);
  return mesh;
}

/** A far city skyline with lit windows along the bottom of a night sky. */
export function skyline(scene: THREE.Scene, opts: { z: number; y: number; width: number; height: number; window?: string }) {
  const tex = canvasTexture(2048, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    let x = 0;
    while (x < w) {
      const bw = 26 + Math.random() * 70;
      const bh = h * (0.46 + Math.pow(Math.random(), 1.8) * 0.5); // the lower half is below the frame
      g.fillStyle = `rgb(${6 + Math.random() * 6},${7 + Math.random() * 6},${12 + Math.random() * 8})`;
      g.fillRect(x, h - bh, bw, bh);
      if (Math.random() < 0.25) g.fillRect(x + bw * 0.45, h - bh - 16 - Math.random() * 26, 2, 44);
      const cols = Math.floor(bw / 8);
      const rows = Math.floor(bh / 9);
      for (let r = 1; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.3) continue;
          const warm = Math.random() < 0.8;
          g.fillStyle = warm ? `rgba(255,${190 + Math.random() * 40},${110 + Math.random() * 50},${0.35 + Math.random() * 0.6})` : `rgba(170,215,255,${0.3 + Math.random() * 0.5})`;
          g.fillRect(x + 3 + c * 8, h - bh + r * 9, 3.5, 4.5);
        }
      }
      x += bw + Math.random() * 5;
    }
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false, color: opts.window ?? '#ffffff' });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(opts.width, opts.height), mat);
  mesh.position.set(0, opts.y + opts.height / 2, opts.z);
  mesh.renderOrder = -900;
  mesh.name = 't2-skyline';
  scene.add(mesh);
  return mesh;
}
