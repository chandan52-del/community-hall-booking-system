import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A modern community hall, built from simple geometry (no heavy model download).
 * Proportions are in metres-ish units: the glass hall is ~11m wide and ~4m tall.
 *
 * Materials follow the site palette — limestone, warm white, bronze, timber and sage —
 * so the 3D scene reads as part of the brand rather than a game asset.
 */

const PALETTE = {
  limestone: '#DCD5C6',
  paving: '#E6E0D3',
  roof: '#F4F1EA',
  bronze: '#5E5140',
  timber: '#9A7550',
  gold: '#C6A66B',
  lawn: '#A3AF8E',
  water: '#6F8F8B',
  hedge: '#5C7650',
  interiorFloor: '#C9B79A',
};

/* ---------- Trees: trunk + two overlapping canopies ---------- */
const Tree: React.FC<{ position: [number, number, number]; scale?: number; tint?: string }> = ({ position, scale = 1, tint = '#61805A' }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.9, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.12, 1.8, 8]} />
      <meshStandardMaterial color="#6B5A45" roughness={0.9} />
    </mesh>
    <mesh position={[0, 2.3, 0]} castShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={tint} roughness={0.85} flatShading />
    </mesh>
    <mesh position={[0.45, 2.0, 0.25]} castShadow>
      <icosahedronGeometry args={[0.65, 1]} />
      <meshStandardMaterial color={tint} roughness={0.85} flatShading />
    </mesh>
  </group>
);

/* ---------- Interior seating rendered as ONE instanced draw call ---------- */
const Seating: React.FC = () => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 12; col++) {
        if (col === 5 || col === 6) continue; // central aisle
        list.push([-3.3 + col * 0.6, 0.78, -0.4 + row * 0.75]);
      }
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    positions.forEach((p, i) => {
      m.setPosition(...p);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} castShadow>
      <boxGeometry args={[0.4, 0.45, 0.4]} />
      <meshStandardMaterial color="#8C6F4F" roughness={0.7} />
    </instancedMesh>
  );
};

export const CommunityHallModel: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const intro = useRef(0);

  // A one-time, eased "settle" rotation as the scene appears — subtle, not flashy.
  useFrame((_, delta) => {
    if (!group.current || intro.current >= 1) return;
    intro.current = Math.min(1, intro.current + delta / 2.4);
    const eased = 1 - Math.pow(1 - intro.current, 3);
    group.current.rotation.y = -0.5 * (1 - eased);
  });

  const glass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#B9CCC6', roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.32, clearcoat: 1, side: THREE.DoubleSide }),
    [],
  );
  const bronze = useMemo(() => new THREE.MeshStandardMaterial({ color: PALETTE.bronze, roughness: 0.4, metalness: 0.6 }), []);

  const frontMullions = useMemo(() => Array.from({ length: 11 }, (_, i) => -5.5 + i * 1.1), []);
  const sideMullions = useMemo(() => Array.from({ length: 7 }, (_, i) => -3.5 + i * (7 / 6)), []);
  const louvres = useMemo(() => Array.from({ length: 13 }, (_, i) => -1.8 + i * 0.3), []);

  return (
    <group ref={group}>
      {/* ---------------- SITE ---------------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color={PALETTE.lawn} roughness={1} />
      </mesh>

      {/* Forecourt paving */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 6.5]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color={PALETTE.paving} roughness={0.9} />
      </mesh>
      {/* Approach path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 13]} receiveShadow>
        <planeGeometry args={[3, 8]} />
        <meshStandardMaterial color={PALETTE.paving} roughness={0.9} />
      </mesh>

      {/* Reflecting pool with stone coping */}
      <mesh position={[5.2, 0.06, 7]} receiveShadow>
        <boxGeometry args={[4.4, 0.12, 3]} />
        <meshStandardMaterial color={PALETTE.limestone} roughness={0.8} />
      </mesh>
      <mesh position={[5.2, 0.125, 7]}>
        <boxGeometry args={[4, 0.02, 2.6]} />
        <meshStandardMaterial color={PALETTE.water} roughness={0.05} metalness={0.3} />
      </mesh>

      {/* Low hedges framing the forecourt */}
      {[-7.6, 7.6].map((x) => (
        <mesh key={x} position={[x, 0.3, 6.5]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.6, 5.6]} />
          <meshStandardMaterial color={PALETTE.hedge} roughness={0.95} />
        </mesh>
      ))}
      {[-4.4, -2.2].map((x) => (
        <mesh key={x} position={[x, 0.25, 8.6]} castShadow>
          <boxGeometry args={[1.6, 0.5, 0.6]} />
          <meshStandardMaterial color={PALETTE.hedge} roughness={0.95} />
        </mesh>
      ))}

      {/* ---------------- BUILDING ---------------- */}
      {/* Limestone plinth + entrance steps */}
      <mesh position={[-1, 0.25, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[17, 0.5, 9]} />
        <meshStandardMaterial color={PALETTE.limestone} roughness={0.85} />
      </mesh>
      {[0, 1, 2].map((s) => (
        <mesh key={s} position={[0, 0.08 + s * 0.14, 4.35 - s * 0.3]} receiveShadow castShadow>
          <boxGeometry args={[4.5, 0.16, 0.6]} />
          <meshStandardMaterial color={PALETTE.limestone} roughness={0.85} />
        </mesh>
      ))}

      {/* Interior: warm floor, timber feature wall, stage, seating, pendant lights */}
      <mesh position={[0, 0.51, -0.5]} receiveShadow>
        <boxGeometry args={[10.8, 0.02, 6.8]} />
        <meshStandardMaterial color={PALETTE.interiorFloor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.5, -3.75]} receiveShadow>
        <boxGeometry args={[10.8, 4, 0.2]} />
        <meshStandardMaterial color={PALETTE.timber} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.7, -2.9]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.4, 1.4]} />
        <meshStandardMaterial color="#7A5D40" roughness={0.6} />
      </mesh>
      <Seating />
      {[-3, 0, 3].map((x) => (
        <group key={x} position={[x, 3.6, -0.6]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1, 4]} />
            <meshBasicMaterial color="#3d3a33" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color="#FFF3DA" emissive="#FFD9A0" emissiveIntensity={1.4} />
          </mesh>
          <pointLight color="#FFD9A0" intensity={2.5} distance={5} decay={2} />
        </group>
      ))}

      {/* Glass curtain wall — front and sides */}
      <mesh position={[0, 2.5, 2.9]} material={glass}>
        <boxGeometry args={[11, 4, 0.04]} />
      </mesh>
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, 2.5, -0.4]} rotation={[0, Math.PI / 2, 0]} material={glass}>
          <boxGeometry args={[6.6, 4, 0.04]} />
        </mesh>
      ))}

      {/* Slender bronze mullions + transom */}
      {frontMullions.map((x) => (
        <mesh key={x} position={[x, 2.5, 2.93]} material={bronze} castShadow>
          <boxGeometry args={[0.06, 4, 0.1]} />
        </mesh>
      ))}
      <mesh position={[0, 3.6, 2.93]} material={bronze}>
        <boxGeometry args={[11, 0.05, 0.1]} />
      </mesh>
      {sideMullions.map((z) => (
        <mesh key={z} position={[5.53, 2.5, -0.4 + z]} material={bronze}>
          <boxGeometry args={[0.1, 4, 0.06]} />
        </mesh>
      ))}

      {/* Solid stone service wing on the left with timber louvres */}
      <mesh position={[-7.6, 2, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 3, 8]} />
        <meshStandardMaterial color="#E4DED1" roughness={0.9} />
      </mesh>
      {louvres.map((dx) => (
        <mesh key={dx} position={[-7.6 + dx, 2, 3.56]} castShadow>
          <boxGeometry args={[0.08, 2.6, 0.25]} />
          <meshStandardMaterial color={PALETTE.timber} roughness={0.7} />
        </mesh>
      ))}

      {/* Floating roof slab with a deep front overhang and thin gold fascia */}
      <mesh position={[-1, 4.7, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[17.4, 0.4, 10.6]} />
        <meshStandardMaterial color={PALETTE.roof} roughness={0.6} />
      </mesh>
      <mesh position={[-1, 4.7, 5.62]}>
        <boxGeometry args={[17.4, 0.12, 0.04]} />
        <meshStandardMaterial color={PALETTE.gold} roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Slim columns holding the overhang */}
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 2.5, 4.9]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 4, 12]} />
          <meshStandardMaterial color={PALETTE.roof} roughness={0.5} />
        </mesh>
      ))}

      {/* ---------------- LANDSCAPE ---------------- */}
      <Tree position={[-11, 0, 4]} scale={1.3} />
      <Tree position={[-12.5, 0, -3]} scale={1.5} tint="#56744F" />
      <Tree position={[10, 0, 2.5]} scale={1.2} tint="#6E8B5E" />
      <Tree position={[11.5, 0, -4]} scale={1.6} />
      <Tree position={[-9, 0, -7.5]} scale={1.4} tint="#6E8B5E" />
      <Tree position={[6, 0, -8]} scale={1.7} tint="#56744F" />
      <Tree position={[-3, 0, -9]} scale={1.5} />
      <Tree position={[-4.5, 0, 12]} scale={1.1} tint="#6E8B5E" />
      <Tree position={[4.5, 0, 12.5]} scale={1.0} />
    </group>
  );
};
