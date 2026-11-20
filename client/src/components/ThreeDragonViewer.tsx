import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ThreeDragonViewerProps {
  vipLevel?: number;
  onAnimationComplete?: () => void;
  className?: string;
}

// Tailored perch offsets for 12 VIP tiers:
// Anchors the dragon's body and claws right to the outer top-left corner crest of the VIP frame,
// completely clear of the user's face, hair, and portrait (0% obstruction)!
const VIP_CORNER_OFFSETS: Record<number, { posX: number; posY: number }> = {
  1: { posX: -0.68, posY: 0.52 },
  2: { posX: -0.69, posY: 0.53 },
  3: { posX: -0.70, posY: 0.54 },
  4: { posX: -0.71, posY: 0.55 },
  5: { posX: -0.72, posY: 0.56 },
  6: { posX: -0.73, posY: 0.57 },
  7: { posX: -0.74, posY: 0.58 },
  8: { posX: -0.74, posY: 0.58 },
  9: { posX: -0.75, posY: 0.59 },
  10: { posX: -0.76, posY: 0.60 },
  11: { posX: -0.77, posY: 0.61 },
  12: { posX: -0.78, posY: 0.62 },
};

export const ThreeDragonViewer: React.FC<ThreeDragonViewerProps> = ({
  vipLevel = 1,
  onAnimationComplete,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'flying' | 'perched'>('flying');
  const [fireActive, setFireActive] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const currentVip = Math.min(12, Math.max(1, vipLevel || 1));
  const perchConfig = VIP_CORNER_OFFSETS[currentVip] || VIP_CORNER_OFFSETS[1];

  // Sound generator using Web Audio API
  const playDragonRoar = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 2.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(340, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.6);
      filter.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 2.0);
      filter.Q.value = 2.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio autoplay restrictions
    }
  };

  // Helper to construct ethereal glowing dragon wings
  const createDragonWing = (isRight: boolean): THREE.Group => {
    const wingGroup = new THREE.Group();

    // Curved bat/dragon wing membrane shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.1, 0.22, 0.28, 0.55, 0.55, 0.8);
    shape.bezierCurveTo(0.85, 1.0, 1.25, 0.95, 1.55, 0.72); // top wing tip
    shape.bezierCurveTo(1.3, 0.45, 1.15, 0.26, 0.98, 0.05); // outer scallop
    shape.bezierCurveTo(0.78, -0.12, 0.62, -0.24, 0.48, -0.3); // middle scallop
    shape.bezierCurveTo(0.26, -0.22, 0.1, -0.1, 0, 0); // inner scallop back to joint

    const geometry = new THREE.ShapeGeometry(shape, 18);

    // Ethereal glowing azure translucent material
    const membraneMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff, // glowing cyan / favo rang
      emissive: 0x0088cc,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.35,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, membraneMaterial);
    wingGroup.add(mesh);

    // Golden-azure structural wing bone ribs
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.0,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Main leading arm bone
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.32, 0.52, 0.02),
      new THREE.Vector3(0.85, 0.92, 0.03),
      new THREE.Vector3(1.55, 0.72, 0.03),
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 16, 0.026, 8, false);
    wingGroup.add(new THREE.Mesh(armGeo, boneMaterial));

    // Rib 1
    const rib1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.32, 0.52, 0.02),
      new THREE.Vector3(0.72, 0.3, 0.02),
      new THREE.Vector3(0.98, 0.05, 0.02),
    ]);
    wingGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rib1Curve, 10, 0.018, 6, false), boneMaterial));

    const scale = 0.28;
    if (isRight) {
      wingGroup.scale.set(-scale, scale, scale);
    } else {
      wingGroup.scale.set(scale, scale, scale);
    }

    return wingGroup;
  };

  // Helper to create glowing fire sprite texture
  const createFireTexture = (): THREE.Texture => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(0, 240, 255, 0.95)');
    grad.addColorStop(0.55, 'rgba(14, 165, 233, 0.7)');
    grad.addColorStop(0.85, 'rgba(2, 132, 199, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId = 0;
    const width = 280;
    const height = 260;

    // 1. Scene & Camera centered directly on the avatar
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.0);

    // Perch Target in Three.js coordinates
    const targetX = perchConfig.posX;
    const targetY = perchConfig.posY;

    // 2. Renderer with Transparent Canvas
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.6);
    dirLight1.position.set(3, 4, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f0ff, 1.9);
    dirLight2.position.set(-3, -2, -2);
    scene.add(dirLight2);

    // Dynamic fire breath point light at dragon's snout
    const mouthLight = new THREE.PointLight(0x00f0ff, 0, 3.5);
    scene.add(mouthLight);

    // 4. Fire Particle System
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: THREE.Vector3[] = [];
    const particleLifes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
      particleVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.3 - 0.2,
          Math.random() * 0.6 + 0.3
        )
      );
      particleLifes[i] = Math.random();
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      map: createFireTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    });
    const fireParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(fireParticles);

    // 5. Dragon Group & Wings
    let mixer: THREE.AnimationMixer | null = null;
    const dragonGroup = new THREE.Group();
    scene.add(dragonGroup);

    // Ethereal Wings (attached to upper back/shoulders)
    const leftWing = createDragonWing(false);
    const rightWing = createDragonWing(true);
    leftWing.position.set(-0.10, 0.10, -0.05);
    rightWing.position.set(0.10, 0.10, -0.05);
    leftWing.rotation.set(0.3, -0.2, 0.35);
    rightWing.rotation.set(0.3, 0.2, -0.35);
    dragonGroup.add(leftWing);
    dragonGroup.add(rightWing);

    // 6. Load GLTF
    const loader = new GLTFLoader();
    loader.load(
      '/assets/chinese_dragon.glb',
      (gltf) => {
        const model = gltf.scene;

        // Compute Bounding Box to normalize size
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Max dimension is ~4969 units (along Z). We normalize model to ~1.05 units
        const maxDim = Math.max(size.x, size.y, size.z);
        const normScale = 1.05 / (maxDim || 1);

        // Directly scale and center model geometry
        model.scale.setScalar(normScale);
        model.position.set(-center.x * normScale, -center.y * normScale, -center.z * normScale);

        // Traverse & Apply "Favo Rang" (Azure Sapphire Cyan Glow) Palette
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.name.includes('eye')) {
              // Glowing celestial eyes
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0x00f0ff,
                emissiveIntensity: 1.8,
                roughness: 0.1,
                metalness: 0.9,
              });
            } else {
              // Imperial Favo Rang / Azure Cyan Scales
              mesh.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0x00b4d8), // rich favo / havorang
                emissive: new THREE.Color(0x0077b6), // inner celestial cyan glow
                emissiveIntensity: 0.65,
                roughness: 0.28,
                metalness: 0.65,
              });
            }
          }
        });

        dragonGroup.add(model);

        // Setup Animation Mixer
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.setEffectiveTimeScale(1.2);
          action.play();
        }
      },
      undefined,
      (err) => {
        console.error('Error loading chinese_dragon.glb:', err);
        setLoadError(true);
      }
    );

    // Timeline control: 4.0s entrance flight -> perched pose
    const startTime = performance.now();
    let currentFireIntensity = 0;

    // Trigger dragon roar and fire flame sequence
    const tSound = setTimeout(() => {
      setFireActive(true);
      playDragonRoar();
    }, 600);

    const tFireOff = setTimeout(() => {
      setFireActive(false);
    }, 3200);

    const tPerch = setTimeout(() => {
      setPhase('perched');
      onAnimationComplete?.();
    }, 4000);

    // 7. Render Animation Loop
    let lastTime = performance.now();
    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (mixer) {
        mixer.update(delta);
      }

      const elapsed = (now - startTime) / 1000;

      // Animate Ethereal Wings Flapping
      const flapRate = elapsed < 4.0 ? 0.009 : 0.0035;
      const flapAmp = elapsed < 4.0 ? 0.35 : 0.15;
      const wingFlap = Math.sin(now * flapRate) * flapAmp;
      leftWing.rotation.z = 0.35 + wingFlap;
      leftWing.rotation.y = -0.2 + Math.cos(now * flapRate) * 0.12;
      rightWing.rotation.z = -0.35 - wingFlap;
      rightWing.rotation.y = 0.2 - Math.cos(now * flapRate) * 0.12;

      // Trajectory Phase Interpolation
      if (elapsed < 4.0) {
        // ENTRANCE FLIGHT (0.0s to 4.0s):
        // Swoops in a magnificent 3D spiral around the avatar, breathing fire, then lands at top-left corner
        const p = Math.min(1, elapsed / 4.0);

        if (p < 0.35) {
          // Swoop from upper-left background around right side
          const tSub = p / 0.35;
          dragonGroup.position.x = THREE.MathUtils.lerp(-1.4, 1.0, tSub);
          dragonGroup.position.y = THREE.MathUtils.lerp(1.1, -0.3, tSub);
          dragonGroup.position.z = THREE.MathUtils.lerp(-1.2, 0.3, tSub);
          dragonGroup.rotation.x = THREE.MathUtils.lerp(0.1, 0.35, tSub);
          dragonGroup.rotation.y = THREE.MathUtils.lerp(0.5, 2.0, tSub);
          dragonGroup.rotation.z = THREE.MathUtils.lerp(-0.2, 0.2, tSub);
        } else if (p < 0.75) {
          // Arc across front-center while breathing fire
          const tSub = (p - 0.35) / 0.4;
          dragonGroup.position.x = THREE.MathUtils.lerp(1.0, -0.5, tSub);
          dragonGroup.position.y = THREE.MathUtils.lerp(-0.3, 0.45, tSub);
          dragonGroup.position.z = THREE.MathUtils.lerp(0.3, 0.1, tSub);
          dragonGroup.rotation.x = THREE.MathUtils.lerp(0.35, 0.22, tSub);
          dragonGroup.rotation.y = THREE.MathUtils.lerp(2.0, 1.2, tSub);
          dragonGroup.rotation.z = THREE.MathUtils.lerp(0.2, -0.1, tSub);
        } else {
          // Ascend and touch down gracefully on the top-left VIP corner junction
          const tSub = (p - 0.75) / 0.25;
          dragonGroup.position.x = THREE.MathUtils.lerp(-0.5, targetX, tSub);
          dragonGroup.position.y = THREE.MathUtils.lerp(0.45, targetY, tSub);
          dragonGroup.position.z = THREE.MathUtils.lerp(0.1, 0.0, tSub);
          dragonGroup.rotation.x = THREE.MathUtils.lerp(0.22, 0.20, tSub);
          dragonGroup.rotation.y = THREE.MathUtils.lerp(1.2, 0.95, tSub);
          dragonGroup.rotation.z = THREE.MathUtils.lerp(-0.1, -0.06, tSub);
        }

        // Fire breath active between 0.6s and 3.2s
        if (elapsed >= 0.6 && elapsed <= 3.2) {
          currentFireIntensity = THREE.MathUtils.lerp(currentFireIntensity, 1.0, 0.1);
        } else {
          currentFireIntensity = THREE.MathUtils.lerp(currentFireIntensity, 0.0, 0.15);
        }
      } else {
        // PERCHED STATE (elapsed >= 4.0s):
        // Anchored atop the outer VIP frame corner junction with gentle breathing hover
        const breathe = Math.sin((now - startTime) * 0.0025);
        dragonGroup.position.x = targetX + breathe * 0.006;
        dragonGroup.position.y = targetY + breathe * 0.010;
        dragonGroup.position.z = 0.0;
        // Proud upright pose: Head looking right towards frame corner and user name
        dragonGroup.rotation.x = 0.20 + breathe * 0.02;
        dragonGroup.rotation.y = 0.95 + breathe * 0.03;
        dragonGroup.rotation.z = -0.06;

        currentFireIntensity = THREE.MathUtils.lerp(currentFireIntensity, 0.04, 0.1); // subtle idle embers
      }

      // Fire Particles Update
      particleMat.opacity = currentFireIntensity * 0.95;
      mouthLight.intensity = currentFireIntensity * (2.8 + Math.random() * 2.0);
      mouthLight.position.copy(dragonGroup.position);
      mouthLight.position.x += 0.22;
      mouthLight.position.y += 0.10;
      mouthLight.position.z += 0.2;

      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        particleLifes[i] += delta * 1.5;
        if (particleLifes[i] >= 1.0) {
          particleLifes[i] = 0;
          positions[i * 3] = dragonGroup.position.x + 0.18;
          positions[i * 3 + 1] = dragonGroup.position.y + 0.08;
          positions[i * 3 + 2] = dragonGroup.position.z + 0.18;
          particleVelocities[i].set(
            (Math.random() - 0.2) * 0.45,
            (Math.random() - 0.5) * 0.25 - 0.12,
            Math.random() * 0.65 + 0.25
          );
        } else {
          positions[i * 3] += particleVelocities[i].x * delta;
          positions[i * 3 + 1] += particleVelocities[i].y * delta;
          positions[i * 3 + 2] += particleVelocities[i].z * delta;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(tSound);
      clearTimeout(tFireOff);
      clearTimeout(tPerch);
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      container.innerHTML = '';
    };
  }, [currentVip]);

  // Interactive Click: Make dragon roar and fly another loop
  const handleInteractiveClick = () => {
    if (phase !== 'perched') return;
    setPhase('flying');
    setFireActive(true);
    playDragonRoar();

    setTimeout(() => {
      setFireActive(false);
    }, 2800);

    setTimeout(() => {
      setPhase('perched');
    }, 4000);
  };

  if (loadError) {
    return null;
  }

  return (
    <>
      {/* Ambient Flame Screen Glow */}
      {fireActive && (
        <div
          className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, rgba(0, 210, 255, 0.35) 0%, rgba(2, 132, 199, 0.2) 40%, transparent 75%)',
            mixBlendMode: 'screen',
            animation: 'screenAzureFlicker 0.16s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* 3D WebGL Canvas Centered Directly on the Avatar */}
      <div
        ref={mountRef}
        onClick={handleInteractiveClick}
        className={`absolute pointer-events-auto cursor-pointer select-none z-40 transition-transform ${className}`}
        style={{
          width: 280,
          height: 260,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter:
            fireActive
              ? 'drop-shadow(0 0 25px rgba(0,210,255,0.75)) drop-shadow(0 0 45px rgba(2,132,199,0.5))'
              : 'drop-shadow(0 6px 18px rgba(0,0,0,0.55)) drop-shadow(0 0 16px rgba(0,210,255,0.45))',
        }}
        title={`3D Favo rang Imperator Ajdarhosi — bosing, olov purkab aylanib uchadi! 🔥`}
      />

      <style>{`
        @keyframes screenAzureFlicker {
          0% {
            opacity: 0.8;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};