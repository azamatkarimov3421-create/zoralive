import React, { useEffect, useRef, useState } from 'react';
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
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let destroyed = false;
    let animId: number;

    const width = 380;
    const height = 380;

    // 1. Three.js Scene with 100% transparent background
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

    // 4. Studio Lighting matching the sky-blue dragon aesthetics
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 2.2);
    mainSun.position.set(3, 5, 4);
    scene.add(mainSun);

    // Cyan / sky-blue rim light for sparkling dragon scales & wings
    const skyRimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    skyRimLight.position.set(-4, 2, -3);
    scene.add(skyRimLight);

    // Warm fire accent point light positioned near dragon landing crest
    const fireGlowLight = new THREE.PointLight(0xf59e0b, 1.6, 4);
    fireGlowLight.position.set(0, 0.28, 0.3);
    scene.add(fireGlowLight);

    // 5. Load the custom Sky Blue Dragon GLB
    const loader = new GLTFLoader();
    loader.load(
      '/assets/havo_rangli_ajdarcha_ramka.glb',
      (gltf) => {
        if (destroyed) return;

        const root = gltf.scene;

        // Hide only the reference wireframe box so the sky-blue dragon, wings & fire remain 100% visible
        root.traverse((child) => {
          if (child.name === 'StraightRectangularFrame') {
            child.visible = false;
          }
        });

        // Scale & Position root so dragon perches perfectly atop the VIP frame crest
        const scale = 0.58;
        root.scale.set(scale, scale, scale);
        root.position.set(0, 0.28, 0);

        scene.add(root);

        // 6. Setup Animation
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

    // 7. Render Loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (destroyed) return;
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Dynamic fire flicker during fire breath phase
      if (actionRef.current) {
        const time = actionRef.current.time % 8.0;
        if (time >= 5.0 && time <= 7.2) {
          // Perched & breathing fire
          fireGlowLight.intensity = 2.4 + Math.sin(time * 25) * 1.0;
        } else if (time >= 0.8 && time <= 2.2) {
          // Mid-flight fire burst
          fireGlowLight.intensity = 1.8 + Math.sin(time * 20) * 0.8;
        } else {
          fireGlowLight.intensity = 0.3;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
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
      aria-hidden="true"
    >
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};
