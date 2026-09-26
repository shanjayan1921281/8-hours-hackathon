import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Torus, Icosahedron, Octahedron, Tetrahedron, Box, Cylinder } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// 3D Infinite AI Command Universe Core & Architectural Environment
function DigitalUniverseCore() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const orbital1Ref = useRef<THREE.Mesh>(null);
  const orbital2Ref = useRef<THREE.Mesh>(null);
  const fragmentsGroupRef = useRef<THREE.Group>(null);
  const pillarsGroupRef = useRef<THREE.Group>(null);

  // Generate floating 3D geometric glass fragments & shards
  const fragments = useMemo(() => {
    const list = [];
    for (let i = 0; i < 50; i++) {
      list.push({
        position: [
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 10 - 1
        ] as [number, number, number],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
        scale: 0.15 + Math.random() * 0.4,
        speed: 0.8 + Math.random() * 1.8,
        type: i % 4
      });
    }
    return list;
  }, []);

  // Generate distant architectural glass pillars & pillars
  const pillars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 6 + Math.random() * 3;
      list.push({
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 6,
          -4 - Math.random() * 4
        ] as [number, number, number],
        height: 4 + Math.random() * 4
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Smooth mouse parallax & gentle drift
      const { x, y } = state.pointer;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 2.2 + x * 0.6, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, y * 0.6, 0.05);
      groupRef.current.rotation.y = t * 0.05 + x * 0.12;
      groupRef.current.rotation.x = -y * 0.12;
    }

    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 3.5) * 0.15;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.25;
      outerRingRef.current.rotation.x = t * 0.1;
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.y = -t * 0.45;
      innerRingRef.current.rotation.z = t * 0.2;
    }

    if (orbital1Ref.current) {
      orbital1Ref.current.rotation.x = t * 0.35;
      orbital1Ref.current.rotation.y = t * 0.22;
    }

    if (orbital2Ref.current) {
      orbital2Ref.current.rotation.y = -t * 0.28;
      orbital2Ref.current.rotation.z = -t * 0.22;
    }

    if (fragmentsGroupRef.current) {
      fragmentsGroupRef.current.rotation.y = t * 0.04;
    }

    if (pillarsGroupRef.current) {
      pillarsGroupRef.current.rotation.y = -t * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[2.2, 0, -2.5]}>
      {/* Central High-Energy AI Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#38bdf8"
          emissiveIntensity={3.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Inner Geometric Casing */}
      <Icosahedron ref={innerRingRef} args={[1.2, 1]}>
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#06b6d4"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.9}
          wireframe
        />
      </Icosahedron>

      {/* Outer Transparent Energy Ring */}
      <Torus ref={outerRingRef} args={[2.2, 0.035, 24, 96]}>
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#06b6d4"
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={1}
          transparent
          opacity={0.85}
        />
      </Torus>

      {/* Orbital Path 1 */}
      <Torus ref={orbital1Ref} args={[3.0, 0.02, 16, 64]} rotation={[Math.PI / 4, 0, 0]}>
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={2.2}
          roughness={0.1}
          metalness={0.9}
        />
      </Torus>

      {/* Orbital Path 2 */}
      <Torus ref={orbital2Ref} args={[3.8, 0.015, 16, 64]} rotation={[0, Math.PI / 3, Math.PI / 6]}>
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={2.0}
          roughness={0.1}
          metalness={0.9}
        />
      </Torus>

      {/* Distant Architectural Glass Pillars */}
      <group ref={pillarsGroupRef}>
        {pillars.map((pillar, idx) => (
          <Cylinder key={idx} args={[0.08, 0.08, pillar.height, 16]} position={pillar.position}>
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#06b6d4"
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.4}
            />
          </Cylinder>
        ))}
      </group>

      {/* Floating Glass Shards & Geometric Fragments */}
      <group ref={fragmentsGroupRef}>
        {fragments.map((frag, idx) => {
          const Geo = frag.type === 0 ? Tetrahedron : frag.type === 1 ? Octahedron : frag.type === 2 ? Box : Torus;
          const geoArgs = frag.type === 3 ? [frag.scale * 0.8, frag.scale * 0.2, 16, 32] : [frag.scale];
          return (
            <Float key={idx} speed={frag.speed * 2} rotationIntensity={3} floatIntensity={3} position={frag.position}>
              <Geo args={geoArgs as any} rotation={frag.rotation}>
                <meshStandardMaterial
                  color={idx % 2 === 0 ? "#38bdf8" : "#c084fc"}
                  emissive={idx % 2 === 0 ? "#06b6d4" : "#8b5cf6"}
                  emissiveIntensity={1.4}
                  roughness={0.1}
                  metalness={0.8}
                  transparent
                  opacity={0.7}
                />
              </Geo>
            </Float>
          );
        })}
      </group>
    </group>
  );
}

// Multi-Depth Particle Universe Field
function UniverseParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  const [positions] = React.useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 20;
      pos[i + 1] = (Math.random() - 0.5) * 20;
      pos[i + 2] = (Math.random() - 0.5) * 16 - 4;
    }
    return pos;
  });

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.012;
    pointsRef.current.rotation.x = Math.sin(t * 0.025) * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#38bdf8"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Global3DBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#03050a]">
      {/* Deep atmospheric graphite base & soft volumetric background gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#03050a] via-[#050814]/90 to-[#03050a]" />
      <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[180px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[900px] h-[900px] bg-purple-600/10 rounded-full blur-[200px]" />

      {/* Single Unified Global R3F Canvas */}
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} className="absolute inset-0">
        <color attach="background" args={['#03050a']} />
        <ambientLight intensity={1.2} />
        <pointLight position={[10, 10, 10]} intensity={3.5} color="#22d3ee" />
        <pointLight position={[-10, -10, -5]} intensity={2.0} color="#8b5cf6" />
        
        <DigitalUniverseCore />
        <UniverseParticleField />

        <EffectComposer>
          <Bloom
            intensity={1.6}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Subtle cinematic vignette overlay to keep text perfectly readable */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
    </div>
  );
}
