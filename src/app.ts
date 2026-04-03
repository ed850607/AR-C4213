import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { loadManifest, type AssemblyManifest } from './manifest';

type Phase = 'compat' | 'calibration' | 'assembly';

const GHOST_OPACITY = 0.32;
const HIGHLIGHT_EMISSIVE = 0x4488ff;

export class App {
  private phase: Phase = 'compat';
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private uiRoot: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private rootGroup = new THREE.Group();
  private calibrationMesh: THREE.Object3D | null = null;
  private dragControls: DragControls | null = null;
  private manifest!: AssemblyManifest;
  private stepMeshes: THREE.Object3D[] = [];
  private currentStepIndex = 0;

  constructor() {
    const v = document.getElementById('camera-feed');
    const c = document.getElementById('three-canvas');
    const u = document.getElementById('ui-root');
    if (!v || !c || !u) throw new Error('Missing #camera-feed, #three-canvas, or #ui-root');
    this.video = v as HTMLVideoElement;
    this.canvas = c as HTMLCanvasElement;
    this.uiRoot = u;
  }

  async start(): Promise<void> {
    const ok = this.checkCapabilities();
    if (!ok) return;

    try {
      this.manifest = await loadManifest();
    } catch (e) {
      this.showCompat(
        'Could not load assembly data.',
        'Please check your connection and reload.',
        false,
      );
      console.error(e);
      return;
    }

    await this.startCamera();
    this.initThree();
    this.buildCalibrationModel();
    this.phase = 'calibration';
    this.renderCalibrationUI();
    this.setupXRButton();
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });
  }

  private checkCapabilities(): boolean {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      (canvas.getContext('webgl') as WebGL2RenderingContext | null);
    if (!gl) {
      this.showCompat(
        'WebGL is not available.',
        'Please update your browser or use a newer phone.',
        false,
      );
      return false;
    }
    return true;
  }

  private showCompat(title: string, detail: string, showRetry: boolean): void {
    this.phase = 'compat';
    this.uiRoot.innerHTML = `
      <div class="panel card">
        <div class="badge">Compatibility</div>
        <h1>${title}</h1>
        <p>${detail}</p>
        ${showRetry ? '<button type="button" id="btn-retry">Retry camera</button>' : ''}
      </div>`;
    if (showRetry) {
      document.getElementById('btn-retry')?.addEventListener('click', () => location.reload());
    }
  }

  private async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.showCompat(
        'Camera API not supported.',
        'Please use a modern mobile browser (HTTPS or localhost).',
        false,
      );
      throw new Error('no getUserMedia');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      this.video.srcObject = stream;
      await this.video.play();
    } catch {
      this.showCompat(
        'Camera access denied or unavailable.',
        'Allow camera permission and use HTTPS (or localhost) for testing.',
        true,
      );
      throw new Error('camera denied');
    }
  }

  private initThree(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 200);
    this.camera.position.set(0, 0.2, 1.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.xr.enabled = true;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    hemi.position.set(0, 1, 0);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(2, 4, 3);
    this.scene.add(dir);

    this.scene.add(this.rootGroup);

    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private buildCalibrationModel(): void {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x6a7a8c,
        metalness: 0.2,
        roughness: 0.65,
      }),
    );
    body.position.y = 0.175;
    group.add(body);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.52, 0.37, 0.24)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }),
    );
    edges.position.y = 0.175;
    group.add(edges);
    group.position.set(0, -0.15, -0.6);
    this.calibrationMesh = group;
    this.rootGroup.add(group);

    const dc = new DragControls([group], this.camera, this.canvas);
    dc.rotateSpeed = 0;
    this.dragControls = dc;
  }

  private renderCalibrationUI(): void {
    const xrHint =
      'webxr' in navigator
        ? '<p class="hint-xr" style="font-size:0.8rem;opacity:0.75">On supported phones you can also use <strong>Enter AR</strong> below.</p>'
        : '';
    this.uiRoot.innerHTML = `
      <div class="panel card">
        <div class="badge">步骤 0 — 摆放</div>
        <h1>对齐虚拟模型</h1>
        <p>在画面上<strong>直接拖动灰色方块</strong>来移动位置（比小箭头更好点）。需要微调时用下面按钮旋转或缩放。</p>
        <div class="toolbar" id="calib-tools">
          <button type="button" id="btn-rot-ccw" class="secondary">左转</button>
          <button type="button" id="btn-rot-cw" class="secondary">右转</button>
          <button type="button" id="btn-scale-down" class="secondary">缩小</button>
          <button type="button" id="btn-scale-up" class="secondary">放大</button>
        </div>
        <div class="row">
          <button type="button" id="btn-lock">确认摆放</button>
        </div>
        ${xrHint}
      </div>`;

    const mesh = this.calibrationMesh;
    const rotStep = Math.PI / 12;
    const scaleMul = 1.08;
    document.getElementById('btn-rot-ccw')?.addEventListener('click', () => {
      if (!mesh) return;
      mesh.rotation.y += rotStep;
    });
    document.getElementById('btn-rot-cw')?.addEventListener('click', () => {
      if (!mesh) return;
      mesh.rotation.y -= rotStep;
    });
    document.getElementById('btn-scale-up')?.addEventListener('click', () => {
      if (!mesh) return;
      const s = Math.min(3, mesh.scale.x * scaleMul);
      mesh.scale.setScalar(s);
    });
    document.getElementById('btn-scale-down')?.addEventListener('click', () => {
      if (!mesh) return;
      const s = Math.max(0.35, mesh.scale.x / scaleMul);
      mesh.scale.setScalar(s);
    });

    document.getElementById('btn-lock')?.addEventListener('click', () => this.lockAndStartAssembly());
  }

  private setupXRButton(): void {
    if (!('xr' in navigator) || !navigator.xr) return;
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
      if (!supported) return;
      let host = document.getElementById('ar-button-container');
      if (!host) {
        host = document.createElement('div');
        host.id = 'ar-button-container';
        document.body.appendChild(host);
      }
      host.innerHTML = '';
      const link = ARButton.createButton(this.renderer);
      host.appendChild(link);
    });
  }

  private lockAndStartAssembly(): void {
    if (this.phase !== 'calibration' || !this.dragControls || !this.calibrationMesh) return;
    this.dragControls.dispose();
    this.dragControls = null;
    this.rootGroup.remove(this.calibrationMesh);
    this.calibrationMesh = null;

    this.phase = 'assembly';
    void this.buildAssemblyMeshes();
  }

  private async buildAssemblyMeshes(): Promise<void> {
    this.stepMeshes = [];
    const loader = new GLTFLoader();
    const steps = this.manifest.steps;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let obj: THREE.Object3D;
      if (step.partModel) {
        const url = `${import.meta.env.BASE_URL}${step.partModel}`;
        try {
          const gltf = await loader.loadAsync(url);
          obj = gltf.scene;
        } catch (e) {
          console.warn('GLB load failed, using placeholder', e);
          obj = this.makePlaceholderMesh(i, steps.length);
        }
      } else {
        obj = this.makePlaceholderMesh(i, steps.length);
      }
      obj.userData.stepIndex = i;
      this.rootGroup.add(obj);
      this.stepMeshes.push(obj);
    }

    this.currentStepIndex = 0;
    this.updateStepVisuals();
    this.renderAssemblyUI();
  }

  private makePlaceholderMesh(index: number, total: number): THREE.Mesh {
    const hue = 0.55 + (index / Math.max(total, 1)) * 0.12;
    const color = new THREE.Color().setHSL(hue, 0.35, 0.55);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.1, 0.35),
      new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.7 }),
    );
    mesh.position.set(0.05 * index, 0.05, -0.55 + index * 0.08);
    return mesh;
  }

  private applyGhostStyle(object: THREE.Object3D, ghost: boolean): void {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.transparent = ghost;
          m.depthWrite = !ghost;
          m.opacity = ghost ? GHOST_OPACITY : 1;
          if (ghost) {
            m.emissive.setHex(0);
            m.emissiveIntensity = 0;
          }
        }
      }
    });
  }

  private setMeshHighlight(object: THREE.Object3D, highlight: boolean): void {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.emissive.setHex(highlight ? HIGHLIGHT_EMISSIVE : 0);
          m.emissiveIntensity = highlight ? 0.55 : 0;
        }
      }
    });
  }

  private updateStepVisuals(): void {
    const idx = this.currentStepIndex;
    this.stepMeshes.forEach((obj, i) => {
      const ghost = i < idx;
      const current = i === idx;
      const future = i > idx;
      obj.visible = !future;
      if (future) return;
      this.applyGhostStyle(obj, ghost);
      this.setMeshHighlight(obj, current && !ghost);
    });
  }

  private renderAssemblyUI(): void {
    const step = this.manifest.steps[this.currentStepIndex];
    const isLast = this.currentStepIndex >= this.manifest.steps.length - 1;
    this.uiRoot.innerHTML = `
      <div class="panel card">
        <div class="badge">Step ${this.currentStepIndex + 1} / ${this.manifest.steps.length}</div>
        <h1>${escapeHtml(step.title)}</h1>
        <p>${escapeHtml(step.description)}</p>
        <p><strong>Measurements</strong></p>
        <ul>${step.measurements.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>
        <p><strong>Tools</strong></p>
        <ul>${step.tools.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
        <p><strong>Parts</strong></p>
        <ul>${step.parts.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        <div class="row">
          ${this.currentStepIndex > 0 ? '<button type="button" class="secondary" id="btn-prev">Previous</button>' : ''}
          <button type="button" id="btn-next">${isLast ? 'Finish' : 'Next step'}</button>
        </div>
      </div>`;

    document.getElementById('btn-next')?.addEventListener('click', () => this.onNextStep());
    document.getElementById('btn-prev')?.addEventListener('click', () => this.onPrevStep());
  }

  private onNextStep(): void {
    if (this.currentStepIndex >= this.manifest.steps.length - 1) {
      this.uiRoot.innerHTML = `
        <div class="panel card">
          <div class="badge">Done</div>
          <h1>Assembly complete</h1>
          <p>Great job. Verify all fasteners and clearances before use.</p>
        </div>`;
      return;
    }
    this.currentStepIndex++;
    this.updateStepVisuals();
    this.renderAssemblyUI();
  }

  private onPrevStep(): void {
    if (this.currentStepIndex <= 0) return;
    this.currentStepIndex--;
    this.updateStepVisuals();
    this.renderAssemblyUI();
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
