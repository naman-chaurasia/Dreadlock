import * as THREE from 'three';

/**
 * Generates procedural PBR textures directly into HTML Canvas elements.
 * Produces crisp, reproducible, zero-bandwidth PBR textures (Diffuse, Normal, Roughness)
 * tailored for brutalist supernatural horror.
 */
export class MaterialFactory {
  private static instance: MaterialFactory;

  public concreteMaterial!: THREE.MeshStandardMaterial;
  public darkMetalMaterial!: THREE.MeshStandardMaterial;
  public hazardMaterial!: THREE.MeshStandardMaterial;
  public shardMaterial!: THREE.MeshPhysicalMaterial;
  public glyphMaterial!: THREE.MeshStandardMaterial;
  public gateCoreMaterial!: THREE.MeshStandardMaterial;

  private constructor() {
    this.initMaterials();
  }

  public static getInstance(): MaterialFactory {
    if (!MaterialFactory.instance) {
      MaterialFactory.instance = new MaterialFactory();
    }
    return MaterialFactory.instance;
  }

  private initMaterials(): void {
    // 1. Concrete Vault Slabs & Pillars
    const concreteDiffuse = this.generateConcreteDiffuse(512);
    const concreteNormal = this.generateNormalMapFromCanvas(concreteDiffuse, 2.0);
    const concreteRoughness = this.generateConcreteRoughness(512);

    concreteDiffuse.wrapS = THREE.RepeatWrapping;
    concreteDiffuse.wrapT = THREE.RepeatWrapping;
    concreteDiffuse.repeat.set(2, 2);

    concreteNormal.wrapS = THREE.RepeatWrapping;
    concreteNormal.wrapT = THREE.RepeatWrapping;
    concreteNormal.repeat.set(2, 2);

    concreteRoughness.wrapS = THREE.RepeatWrapping;
    concreteRoughness.wrapT = THREE.RepeatWrapping;
    concreteRoughness.repeat.set(2, 2);

    this.concreteMaterial = new THREE.MeshStandardMaterial({
      map: concreteDiffuse,
      normalMap: concreteNormal,
      roughnessMap: concreteRoughness,
      roughness: 0.85,
      metalness: 0.12,
      color: new THREE.Color(0x3a4047)
    });

    // 2. Dark Industrial Metal (Pipes, Door Frame, Brackets)
    const metalDiffuse = this.generateMetalDiffuse(512);
    const metalNormal = this.generateNormalMapFromCanvas(metalDiffuse, 1.5);
    const metalRoughness = this.generateMetalRoughness(512);

    this.darkMetalMaterial = new THREE.MeshStandardMaterial({
      map: metalDiffuse,
      normalMap: metalNormal,
      roughnessMap: metalRoughness,
      roughness: 0.35,
      metalness: 0.88,
      color: new THREE.Color(0x1a2026)
    });

    // 3. Hazard Barrier / Threshold Warning Stripes
    const hazardTex = this.generateHazardStripes(256);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.wrapT = THREE.RepeatWrapping;
    hazardTex.repeat.set(4, 1);

    this.hazardMaterial = new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.6,
      metalness: 0.4
    });

    // 4. Supernatural Covenant Shard (Translucent / Emissive Physical Material)
    this.shardMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x00f0d2),
      emissive: new THREE.Color(0x00a896),
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.55,
      transparent: true,
      opacity: 0.95
    });

    // 5. Ancient Architectural Glyphs
    const glyphTex = this.generateGlyphTexture(256);
    this.glyphMaterial = new THREE.MeshStandardMaterial({
      map: glyphTex,
      emissiveMap: glyphTex,
      emissive: new THREE.Color(0x00f0d2),
      emissiveIntensity: 1.2,
      transparent: true,
      roughness: 0.3,
      metalness: 0.5
    });

    // 6. Sealed Gate Core (Deep Iron with Amber Emergency Emissive Lines)
    this.gateCoreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x14181d),
      roughness: 0.45,
      metalness: 0.82,
      emissive: new THREE.Color(0xff8800),
      emissiveIntensity: 0.15
    });
  }

  // --- Procedural Canvas Texture Generators ---

  private generateConcreteDiffuse(size: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base dark slate color
    ctx.fillStyle = '#2b3138';
    ctx.fillRect(0, 0, size, size);

    // Multilayer noise and grit
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 32;
      const grain = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + noise + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + grain + 2));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + grain + 4));
    }
    ctx.putImageData(imgData, 0, 0);

    // Add subtle concrete panel seams / fine stains
    ctx.strokeStyle = 'rgba(15, 20, 25, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private generateConcreteRoughness(size: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const val = 180 + (Math.random() - 0.5) * 60;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);

    return new THREE.CanvasTexture(canvas);
  }

  private generateMetalDiffuse(size: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e242a';
    ctx.fillRect(0, 0, size, size);

    // Brushed metal linear micro-scratches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 300; i++) {
      const y = Math.random() * size;
      const len = 30 + Math.random() * 80;
      const x = Math.random() * (size - len);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }

    // Heavy scratch marks
    ctx.strokeStyle = 'rgba(120, 140, 160, 0.15)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 20; i++) {
      const x1 = Math.random() * size;
      const y1 = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (Math.random() - 0.5) * 50, y1 + (Math.random() - 0.5) * 50);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  private generateMetalRoughness(size: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#666666';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const val = 70 + (Math.random() - 0.5) * 35;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);

    return new THREE.CanvasTexture(canvas);
  }

  private generateHazardStripes(size: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a1814';
    ctx.fillRect(0, 0, size, size);

    const stripeWidth = 24;
    ctx.fillStyle = '#d48800';

    for (let x = -size; x < size * 2; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + size, size);
      ctx.lineTo(x + size, size);
      ctx.closePath();
      ctx.fill();
    }

    // Grime overlay
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grime = (Math.random() - 0.5) * 20;
      data[i] = Math.max(0, data[i] + grime);
      data[i + 1] = Math.max(0, data[i + 1] + grime);
      data[i + 2] = Math.max(0, data[i + 2] + grime);
    }
    ctx.putImageData(imgData, 0, 0);

    return new THREE.CanvasTexture(canvas);
  }

  private generateGlyphTexture(size: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#00f0d2';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0d2';
    ctx.shadowBlur = 8;

    const center = size / 2;
    // Concentric geometric ritual circles
    ctx.beginPath();
    ctx.arc(center, center, size * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, size * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    // Ancient angular symbols
    ctx.beginPath();
    ctx.moveTo(center, size * 0.1);
    ctx.lineTo(size * 0.9, center);
    ctx.lineTo(center, size * 0.9);
    ctx.lineTo(size * 0.1, center);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.25, size * 0.25);
    ctx.lineTo(size * 0.75, size * 0.75);
    ctx.moveTo(size * 0.75, size * 0.25);
    ctx.lineTo(size * 0.25, size * 0.75);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates a tangent-space normal map from an existing height/diffuse canvas
   */
  private generateNormalMapFromCanvas(srcTex: THREE.CanvasTexture, intensity: number = 1.0): THREE.CanvasTexture {
    const srcCanvas = srcTex.image as HTMLCanvasElement;
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const srcCtx = srcCanvas.getContext('2d')!;
    const srcData = srcCtx.getImageData(0, 0, w, h).data;

    const normCanvas = document.createElement('canvas');
    normCanvas.width = w;
    normCanvas.height = h;
    const normCtx = normCanvas.getContext('2d')!;
    const normImg = normCtx.createImageData(w, h);
    const dstData = normImg.data;

    const getHeight = (x: number, y: number): number => {
      const px = (x + w) % w;
      const py = (y + h) % h;
      const idx = (py * w + px) * 4;
      return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255.0;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const left = getHeight(x - 1, y);
        const right = getHeight(x + 1, y);
        const top = getHeight(x, y - 1);
        const bottom = getHeight(x, y + 1);

        const dx = (right - left) * intensity;
        const dy = (bottom - top) * intensity;
        const dz = 1.0;

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const nx = (dx / len) * 0.5 + 0.5;
        const ny = (-dy / len) * 0.5 + 0.5;
        const nz = (dz / len) * 0.5 + 0.5;

        const dstIdx = (y * w + x) * 4;
        dstData[dstIdx] = Math.round(nx * 255);
        dstData[dstIdx + 1] = Math.round(ny * 255);
        dstData[dstIdx + 2] = Math.round(nz * 255);
        dstData[dstIdx + 3] = 255;
      }
    }

    normCtx.putImageData(normImg, 0, 0);
    return new THREE.CanvasTexture(normCanvas);
  }

  public dispose(): void {
    this.concreteMaterial.dispose();
    this.darkMetalMaterial.dispose();
    this.hazardMaterial.dispose();
    this.shardMaterial.dispose();
    this.glyphMaterial.dispose();
    this.gateCoreMaterial.dispose();
  }
}
