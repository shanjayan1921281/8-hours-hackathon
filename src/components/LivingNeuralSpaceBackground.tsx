import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Torus, Icosahedron, Octahedron } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// 3D Digital Reactor & Neural Core Scene
function DigitalReactorCore() {
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleCount = 400;
  const [positions] = React.useState(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 12;
      pos[i + 1] = (Math.random() - 0.5) * 12;
      pos[i + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  });

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.15;
      coreRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.4;
      ring1Ref.current.rotation.x = t * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.3;
      ring2Ref.current.rotation.z = t * 0.25;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -t * 0.35;
      ring3Ref.current.rotation.y = t * 0.2;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.03;
      const { x, y } = state.pointer;
      particlesRef.current.position.x = THREE.MathUtils.lerp(particlesRef.current.position.x, x * 0.8, 0.05);
      particlesRef.current.position.y = THREE.MathUtils.lerp(particlesRef.current.position.y, y * 0.8, 0.05);
    }
  });

  return (
    <group position={[1.5, 0, -1]}>
      {/* Central Abstract AI Core */}
      <group ref={coreRef}>
        <Icosahedron args={[1.2, 1]}>
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.9}
            wireframe
            transparent
            opacity={0.4}
          />
        </Icosahedron>

        <Sphere args={[0.7, 32, 32]}>
          <meshStandardMaterial
            color="#0f172a"
            emissive="#3b82f6"
            emissiveIntensity={1.2}
            roughness={0.1}
            metalness={0.8}
          />
        </Sphere>

        {/* Layered Transparent Orbital Rings */}
        <Torus ref={ring1Ref} args={[2.0, 0.03, 16, 64]}>
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} roughness={0.1} metalness={1} />
        </Torus>

        <Torus ref={ring2Ref} args={[2.6, 0.02, 16, 64]}>
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} roughness={0.1} metalness={1} />
        </Torus>

        <Torus ref={ring3Ref} args={[3.2, 0.015, 16, 64]}>
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.5} roughness={0.1} metalness={1} />
        </Torus>
      </group>

      {/* Floating Data & Neural Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#38bdf8"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export function LivingNeuralSpaceBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#04060c]">
      {/* Volumetric atmosphere & fog layers */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#04060c] via-[#070b19]/80 to-[#04060c]" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-purple-600/5 rounded-full blur-[180px]" />

      {/* 3D Reactor Canvas */}
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} className="absolute inset-0">
        <color attach="background" args={['#04060c']} />
        <ambientLight intensity={1.0} />
        <pointLight position={[10, 10, 10]} intensity={2.5} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#8b5cf6" />
        
        <DigitalReactorCore />

        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.25}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Subtle perspective grid & scanline overlay */}
      <div className="absolute inset-0 bg-grid-cyber opacity-40" />
      <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
    </div>
  );
}
