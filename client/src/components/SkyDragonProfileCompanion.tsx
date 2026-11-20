import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface SkyDragonProfileCompanionProps {
  vipLevel?: number;
  className?: string;
  onLoaded?: () => void;
}

export const SkyDragonProfileCompanion: React.FC<SkyDragonProfileCompanionProps> = ({
  vipLevel = 1,
  className = '',
  onLoaded,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [roarBadge, setRoarBadge] = useState<string | null>(null);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const neckRef = useRef<THREE.Object3D | null>(null);
  const rootRef = useRef<THREE.Group | null>(null);
  const eyesMeshRef = useRef<THREE.Mesh | null>(null);
  const fireGlowLightRef = useRef<THREE.PointLight | null>(null);

  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Procedural Web Audio Dragon Roar
  const playRoarSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // 1. Deep rumble sub-bass
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);

      // 2. Fiery breath whoosh noise
      const bufSize = Math.floor(ctx.sampleRate * 0.9);
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(1350, ctx.currentTime + 0.35);
      filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.9);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 0.9);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const triggerReaction = useCallback(() => {
    playRoarSound();
    setRoarBadge('🐉🔥 Roaaar!');
    setTimeout(() => setRoarBadge(null), 2200);

    // Boost fire glow temporarily
    if (fireGlowLightRef.current) {
      fireGlowLightRef.current.intensity = 4.2;
    }
  }, [playRoarSound]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let destroyed = false;
    let animId: number;

    const width = 380;
    const height = 380;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera setup - aligned with avatar VIP frame
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 3.8);
    camera.lookAt(0, -0.15, 0);

    // 3. Renderer with transparent background (alpha: true)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 4. Lighting: Ambient + Direct Sun + Cyan Rim + Warm Fire Glow
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 2.2);
    mainSun.position.set(3, 5, 4);
    scene.add(mainSun);

    const skyRimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    skyRimLight.position.set(-4, 2, -3);
    scene.add(skyRimLight);

    const fireGlowLight = new THREE.PointLight(0xf59e0b, 1.6, 4);
    fireGlowLight.position.set(0, 0.28, 0.3);
    scene.add(fireGlowLight);
    fireGlowLightRef.current = fireGlowLight;

    // 5. Magical Particle System: Swirling Cyan & Golden Stardust Aura
    const PARTICLE_COUNT = 44;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const particleSpeeds: { angle: number; radius: number; baseY: number; speed: number; wobble: number }[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 0.55 + Math.random() * 0.85;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1.1 + 0.35;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

      // Half vibrant sky-blue, half golden dragon embers
      if (Math.random() > 0.42) {
        particleColors[i * 3] = 0.22;    // R
        particleColors[i * 3 + 1] = 0.78; // G
        particleColors[i * 3 + 2] = 1.0;  // B (cyan / sky)
      } else {
        particleColors[i * 3] = 1.0;     // R
        particleColors[i * 3 + 1] = 0.82; // G
        particleColors[i * 3 + 2] = 0.2;  // B (gold)
      }

      particleSpeeds.push({
        angle,
        radius,
        baseY: y,
        speed: 0.7 + Math.random() * 1.2,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    // Glowing particle circle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(56,189,248,0.9)');
      grad.addColorStop(0.7, 'rgba(245,158,11,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const particleTex = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      map: particleTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Load GLB
    const loader = new GLTFLoader();
    loader.load(
      '/assets/havo_rangli_ajdarcha_ramka.glb',
      (gltf) => {
        if (destroyed) return;

        const root = gltf.scene;
        rootRef.current = root;

        root.traverse((child) => {
          if (child.name === 'StraightRectangularFrame') {
            child.visible = false;
          }
          if (child.name === 'NeckAndHead') {
            neckRef.current = child;
          }
          if (child.name === 'DragonEyes' && (child as THREE.Mesh).isMesh) {
            eyesMeshRef.current = child as THREE.Mesh;
          }

          // Glossy living dragon scales & wings
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (child.name.toLowerCase().includes('dragon') || child.name.toLowerCase().includes('wing')) {
              mat.roughness = 0.28;
              mat.metalness = 0.2;
            }
          }
        });

        // Scale & Position root so dragon perches atop VIP frame crest
        const scale = 0.58;
        root.scale.set(scale, scale, scale);
        root.position.set(0, 0.28, 0);

        scene.add(root);

        // Setup Animation
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(root);
          mixerRef.current = mixer;

          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          action.play();
          actionRef.current = action;
        }

        setLoading(false);
        if (onLoaded) onLoaded();
      },
      undefined,
      (err) => {
        console.error('Failed to load dragon GLB:', err);
        if (!destroyed) {
          setLoadError('Ajdarcha yuklanmadi');
          setLoading(false);
        }
      }
    );

    // 7. Mouse / Touch Move Listener for Interactive Head Gaze Tracking
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = Math.max(-1, Math.min(1, x));
      mouseRef.current.targetY = Math.max(-1, Math.min(1, y));
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // 8. Render Loop with Living Micro-Dynamics
    const clock = new THREE.Clock();
    const animate = () => {
      if (destroyed) return;
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth mouse gaze interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      if (mixerRef.current) {
        mixerRef.current.update(delta);

        // Living interactive head tracking when perched
        if (neckRef.current) {
          neckRef.current.rotation.y += mouseRef.current.x * 0.35;
          neckRef.current.rotation.x += -mouseRef.current.y * 0.25;
        }

        // Living Eye Glow Pulse
        if (eyesMeshRef.current && (eyesMeshRef.current.material as THREE.MeshStandardMaterial)) {
          const mat = eyesMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 1.3 + Math.sin(time * 4) * 0.6;
        }

        // Organic Breathing Bobbing while perched
        if (rootRef.current && actionRef.current) {
          const clipTime = actionRef.current.time % 8.0;
          if (clipTime >= 5.0 && clipTime <= 7.2) {
            rootRef.current.position.y = 0.28 + Math.sin(time * 3.2) * 0.009;
          } else {
            rootRef.current.position.y = 0.28;
          }
        }
      }

      // Update Swirling Stardust Aura
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particleSpeeds[i];
        p.angle += p.speed * delta * 0.65;
        p.wobble += delta * 2;

        positions[i * 3] = Math.cos(p.angle) * p.radius;
        positions[i * 3 + 1] = p.baseY + Math.sin(p.wobble) * 0.09;
        positions[i * 3 + 2] = Math.sin(p.angle) * p.radius;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Dynamic Fire Flicker
      if (actionRef.current) {
        const t = actionRef.current.time % 8.0;
        if (t >= 5.0 && t <= 7.2) {
          // Perched fire breath
          fireGlowLight.intensity = 2.4 + Math.sin(t * 25) * 1.0;
        } else if (t >= 0.8 && t <= 2.2) {
          // Mid-flight fire burst
          fireGlowLight.intensity = 1.8 + Math.sin(t * 20) * 0.8;
        } else {
          fireGlowLight.intensity = Math.max(0.3, fireGlowLight.intensity * 0.95);
        }
      }

      // Subtle living camera micro-float
      camera.position.x = Math.sin(time * 0.7) * 0.03;
      camera.position.y = 0.5 + Math.cos(time * 0.9) * 0.015;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [onLoaded]);

  return (
    <div
      className={`pointer-events-none select-none absolute z-25 flex items-center justify-center ${className}`}
      style={{
        width: '380px',
        height: '380px',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      aria-label="3D Havo Rangli Ajdarho"
    >
      <div ref={mountRef} className="w-full h-full pointer-events-none" />

      {/* Interactive Dragon Click Hitbox - Only covers the upper crest where dragon flies & perches */}
      <div
        onClick={triggerReaction}
        className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 w-48 h-36 cursor-pointer z-30 group"
        title="Ajdarchani bosib bo'kirtiring!"
      />

      {/* Floating Roar Badge / Reaction */}
      {roarBadge && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/90 text-amber-300 text-xs font-black rounded-full border border-amber-400/60 shadow-lg animate-bounce pointer-events-none z-35">
          {roarBadge}
        </div>
      )}
    </div>
  );
};
