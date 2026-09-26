import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, Torus, Icosahedron, Box, Octahedron, Tetrahedron } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Stylized Robotic Head & Floating Geometric Tokens Scene
function RoboticHeadAndTokens() {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const tokensGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.8) * 0.35;
      headRef.current.rotation.x = Math.cos(t * 0.6) * 0.15;
      headRef.current.position.y = Math.sin(t * 1.5) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
      ringRef.current.rotation.x = t * 0.2;
    }
    if (tokensGroupRef.current) {
      tokensGroupRef.current.rotation.y = t * 0.4;
    }
    // Pulse eyes
    const pulse = 1 + Math.sin(t * 6) * 0.2;
    if (leftEyeRef.current) leftEyeRef.current.scale.set(pulse, pulse, pulse);
    if (rightEyeRef.current) rightEyeRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Robotic Head & Core */}
      <group ref={headRef}>
        {/* Main Robotic Helmet / Skull (Outer Wireframe) */}
        <Icosahedron args={[0.85, 1]}>
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={1.2}
            roughness={0.2}
            metalness={0.9}
            wireframe
          />
        </Icosahedron>

        {/* Inner Solid Core */}
        <Sphere args={[0.55, 32, 32]}>
          <meshStandardMaterial
            color="#1e1b4b"
            emissive="#3b82f6"
            emissiveIntensity={1.5}
            roughness={0.1}
            metalness={0.8}
          />
        </Sphere>

        {/* Glowing Robotic Eyes */}
        <mesh ref={leftEyeRef} position={[-0.22, 0.1, 0.52]}>
          <boxGeometry args={[0.16, 0.08, 0.08]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={4} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.22, 0.1, 0.52]}>
          <boxGeometry args={[0.16, 0.08, 0.08]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={4} />
        </mesh>

        {/* Neural Visor Band */}
        <Torus ref={ringRef} args={[1.1, 0.025, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={1}
          />
        </Torus>
      </group>

      {/* Floating Geometric AI Problem Tokens Orbiting the Robot */}
      <group ref={tokensGroupRef}>
        <Float speed={3} rotationIntensity={3} floatIntensity={2} position={[-1.6, 0.5, 0]}>
          <Octahedron args={[0.28, 0]}>
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={3} roughness={0.2} metalness={0.8} />
          </Octahedron>
        </Float>

        <Float speed={4} rotationIntensity={2} floatIntensity={3} position={[1.7, -0.4, 0.4]}>
          <Tetrahedron args={[0.3, 0]}>
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={3} roughness={0.2} metalness={0.8} />
          </Tetrahedron>
        </Float>

        <Float speed={3.5} rotationIntensity={2.5} floatIntensity={2.5} position={[1.1, 1.2, -0.5]}>
          <Box args={[0.3, 0.3, 0.3]}>
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={3} roughness={0.2} metalness={0.8} />
          </Box>
        </Float>

        <Float speed={2.8} rotationIntensity={3} floatIntensity={2} position={[-1.2, -1.0, -0.3]}>
          <Octahedron args={[0.26, 0]}>
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={3} roughness={0.2} metalness={0.8} />
          </Octahedron>
        </Float>
      </group>
    </group>
  );
}

// Custom Cursor-Reactive Data-Stream Particle Field
function DataStreamParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 350;

  const [positions] = React.useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 7;
      pos[i + 1] = (Math.random() - 0.5) * 7;
      pos[i + 2] = (Math.random() - 0.5) * 5;
    }
    return pos;
  });

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.04;
    pointsRef.current.rotation.x = Math.sin(t * 0.08) * 0.1;

    // Smoothly react to mouse position
    const { x, y } = state.pointer;
    pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, x * 0.5, 0.06);
    pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, y * 0.5, 0.06);
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
        color="#22d3ee"
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function HeroRobotCanvas() {
  return (
    <div className="w-full h-[380px] sm:h-[440px] relative pointer-events-auto cursor-crosshair">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 55 }}>
        <color attach="background" args={['#05070f']} />
        <ambientLight intensity={1.2} />
        <pointLight position={[10, 10, 10]} intensity={3} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#3b82f6" />
        
        <RoboticHeadAndTokens />
        <DataStreamParticles />

        <EffectComposer>
          <Bloom
            intensity={1.4}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>

        <OrbitControls enableZoom={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
