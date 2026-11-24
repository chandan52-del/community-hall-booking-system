import React, { Component, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, OrbitControls } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import { CommunityHallModel } from './CommunityHallModel';

export const HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80';

/** Elegant photographic fallback for devices without WebGL (or if rendering fails). */
const ImageFallback: React.FC = () => (
  <img src={HERO_FALLBACK_IMAGE} alt="A bright, elegantly set community hall interior" className="h-full w-full object-cover" />
);

/** If anything inside the 3D canvas throws, show the photo instead of a blank box. */
class SceneErrorBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <ImageFallback /> : this.props.children;
  }
}

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
};

/**
 * CommunityHallScene
 * Performance decisions:
 *  - The scene stops rendering ("frameloop: never") when scrolled out of view.
 *  - AdaptiveDpr lowers resolution automatically on slower GPUs.
 *  - Zoom is disabled so the page scroll is never hijacked; users can still drag to orbit.
 *  - Auto-rotation is turned off for visitors who prefer reduced motion.
 */
export const CommunityHallScene: React.FC = () => {
  const [webgl] = useState(supportsWebGL);
  const [inView, setInView] = useState(true);
  const wrapper = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!wrapper.current) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    io.observe(wrapper.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="relative h-full w-full bg-gradient-to-b from-[#EAE5D9] via-[#F1EDE3] to-[#E3DFD2]">
      {!webgl ? (
        <ImageFallback />
      ) : (
        <SceneErrorBoundary>
          <Canvas
            shadows
            dpr={[1, 1.75]}
            frameloop={inView ? 'always' : 'never'}
            camera={{ position: [15, 7.5, 17], fov: 34, near: 0.5, far: 120 }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            aria-label="Interactive 3D model of a modern community hall"
          >
            <fog attach="fog" args={['#EEEAE0', 30, 70]} />
            {/* Daylight: soft sky fill + one warm sun casting shadows */}
            <hemisphereLight args={['#F7F3EA', '#8E9C7E', 1.1]} />
            <directionalLight
              position={[14, 18, 10]}
              intensity={2.4}
              color="#FFF2DC"
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0004}
              shadow-camera-left={-18}
              shadow-camera-right={18}
              shadow-camera-top={18}
              shadow-camera-bottom={-18}
            />
            <Suspense fallback={null}>
              <CommunityHallModel />
            </Suspense>
            <OrbitControls
              target={[0, 1.8, 0]}
              enableZoom={false}
              enablePan={false}
              enableDamping
              dampingFactor={0.06}
              minPolarAngle={0.95}
              maxPolarAngle={1.32}
              autoRotate={!reduceMotion}
              autoRotateSpeed={0.35}
            />
            <AdaptiveDpr pixelated={false} />
          </Canvas>
        </SceneErrorBoundary>
      )}
    </div>
  );
};

export default CommunityHallScene;
