import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Torus, Icosahedron, Octahedron, Tetrahedron, Box } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// 3D AI Energy Reactor Chamber Scene
function ReactorMachine() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const orbitalRing1Ref = useRef<THREE.Mesh>(null);
  const orbitalRing2Ref = useRef<THREE.Mesh>(null);
  const shardsGroupRef = useRef<THREE.Group>(null);
  const plasmaGroupRef = useRef<THREE.Group>(null);

  // Generate floating glass shards
  const shards = useMemo(() => {
    const list = [];
    for (let i = 0; i < 45; i++) {
      list.push({
        position: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6 - 1
        ] as [number, number, number],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
        scale: 0.15 + Math.random() * 0.35,
        speed: 0.5 + Math.random() * 1.5,
        type: i % 3
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Smooth mouse parallax
      const { x, y } = state.pointer;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 2.4 + x * 0.4, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, y * 0.4, 0.05);
      groupRef.current.rotation.y = t * 0.08 + x * 0.15;
      groupRef.current.rotation.x = -y * 0.15;
    }

    if (coreRef.current) {
      // Pulsating energy core
      const pulse = 1 + Math.sin(t * 4) * 0.15;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.3;
      outerRingRef.current.rotation.x = t * 0.15;
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.y = -t * 0.5;
      innerRingRef.current.rotation.z = t * 0.2;
    }

    if (orbitalRing1Ref.current) {
      orbitalRing1Ref.current.rotation.x = t * 0.4;
      orbitalRing1Ref.current.rotation.y = t * 0.25;
    }

    if (orbitalRing2Ref.current) {
      orbitalRing2Ref.current.rotation.y = -t * 0.35;
      orbitalRing2Ref.current.rotation.z = -t * 0.3;
    }

    if (shardsGroupRef.current) {
      shardsGroupRef.current.rotation.y = t * 0.05;
    }

    if (plasmaGroupRef.current) {
      plasmaGroupRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[2.4, 0, -2]}>
      {/* Central High-Energy Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#38bdf8"
          emissiveIntensity={3.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Inner Rotating Machine Casing */}
      <Icosahedron ref={innerRingRef} args={[1.2, 1]}>
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.9}
          wireframe
        />
      </Icosahedron>

      {/* Large Transparent Outer Reactor Ring */}
      <Torus ref={outerRingRef} args={[2.2, 0.04, 24, 96]}>
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#06b6d4"
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={1}
          transparent
          opacity={0.8}
        />
      </Torus>

      {/* Orbital Ring 1 */}
      <Torus ref={orbitalRing1Ref} args={[3.0, 0.025, 16, 64]} rotation={[Math.PI / 4, 0, 0]}>
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={2.0}
          roughness={0.1}
          metalness={0.9}
        />
      </Torus>

      {/* Orbital Ring 2 */}
      <Torus ref={orbitalRing2Ref} args={[3.8, 0.015, 16, 64]} rotation={[0, Math.PI / 3, Math.PI / 6]}>
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={2.0}
          roughness={0.1}
          metalness={0.9}
        />
      </Torus>

      {/* Plasma Energy Field Lines */}
      <group ref={plasmaGroupRef}>
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
          <Torus key={i} args={[2.6 + i * 0.2, 0.008, 16, 64]} rotation={[angle, angle * 0.5, 0]}>
            <meshStandardMaterial
              color={i % 2 === 0 ? "#06b6d4" : "#a855f7"}
              emissive={i % 2 === 0 ? "#22d3ee" : "#c084fc"}
              emissiveIntensity={3}
              transparent
              opacity={0.6}
            />
          </Torus>
        ))}
      </group>

      {/* Floating Glass Shards & Geometric Fragments */}
      <group ref={shardsGroupRef}>
        {shards.map((shard, idx) => {
          const ShardGeo = shard.type === 0 ? Tetrahedron : shard.type === 1 ? Octahedron : Box;
          return (
            <Float key={idx} speed={shard.speed * 2} rotationIntensity={3} floatIntensity={3} position={shard.position}>
              <ShardGeo args={[shard.scale]} rotation={shard.rotation}>
                <meshStandardMaterial
                  color={idx % 2 === 0 ? "#38bdf8" : "#c084fc"}
                  emissive={idx % 2 === 0 ? "#06b6d4" : "#8b5cf6"}
                  emissiveIntensity={1.5}
                  roughness={0.1}
                  metalness={0.8}
                  transparent
                  opacity={0.7}
                />
              </ShardGeo>
            </Float>
          );
        })}
      </group>
    </group>
  );
}

// Background Particle Nebula Field
function EnergyNebulaParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  const [positions] = React.useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 16;
      pos[i + 1] = (Math.random() - 0.5) * 16;
      pos[i + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    return pos;
  });

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.02;
    pointsRef.current.rotation.x = Math.sin(t * 0.04) * 0.05;
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

export function AIEnergyReactorBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#03050a]">
      {/* Deep Space Atmosphere & Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#03050a] via-[#060a17]/90 to-[#03050a]" />
      <div className="absolute -top-40 left-1/4 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[180px]" />
      <div className="absolute bottom-0 right-0 w-[900px] h-[900px] bg-purple-600/10 rounded-full blur-[200px]" />

      {/* 3D Reactor Chamber Canvas */}
      <Canvas camera={{ position: [0, 0, 5.5], fov: 55 }} className="absolute inset-0">
        <color attach="background" args={['#03050a']} />
        <ambientLight intensity={1.2} />
        <pointLight position={[10, 10, 10]} intensity={3.5} color="#22d3ee" />
        <pointLight position={[-10, -10, -5]} intensity={2.0} color="#8b5cf6" />
        
        <ReactorMachine />
        <EnergyNebulaParticles />

        <EffectComposer>
          <Bloom
            intensity={1.6}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Architectural Grid & Cinematic Vignette Overlays */}
      <div className="absolute inset-0 bg-grid-cyber opacity-35" />
      <div className="absolute inset-0 bg-scanlines opacity-15 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
    </div>
  );
}
