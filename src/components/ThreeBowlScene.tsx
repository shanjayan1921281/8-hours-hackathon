import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Lock, Sparkles, Shuffle, CheckCircle2, Eye, EyeOff, Activity, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  playCountdownBeep, 
  playWhoosh, 
  playRevealChime, 
  playQuantumChargeSound, 
  playQuantumBlastSound 
} from '../services/sound.js';

interface ThreeBowlSceneProps {
  isRevealed: boolean;
  isClaimed: boolean;
  assignedProblemCode?: string | null;
  onShuffle: () => Promise<{ problemCode: string } | null>;
  disabled?: boolean;
}

// 0. Camera Rig for subtle, controlled cinematic blast reaction
function CameraRig({ blastTime }: { blastTime: number }) {
  const { camera } = useThree();
  const basePos = useMemo(() => new THREE.Vector3(0, 1.8, 4.4), []);

  useFrame(() => {
    if (blastTime <= 0) {
      camera.position.lerp(basePos, 0.08);
      return;
    }

    const elapsed = (performance.now() - blastTime) / 1000;
    if (elapsed >= 0 && elapsed < 0.35) {
      // Very subtle cinematic impulse: micro-kick backward (max ~0.08) and tiny damped vibration
      const tNorm = elapsed / 0.35;
      const kick = Math.sin(tNorm * Math.PI) * Math.exp(-tNorm * 4.5) * 0.085;
      const shakeY = Math.sin(elapsed * 45) * (1 - tNorm) * 0.012;
      camera.position.set(basePos.x, basePos.y + shakeY, basePos.z + kick);
    } else {
      camera.position.lerp(basePos, 0.1);
    }
  });

  return null;
}

// 1. Quantum Blast & Charge Effect (Shockwaves, sparks, electrical arcs, lock-in pulse)
function QuantumBlastEffect({
  blastTime,
  isShuffling,
  countdown
}: {
  blastTime: number;
  isShuffling: boolean;
  countdown: number | null;
}) {
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwave2Ref = useRef<THREE.Mesh>(null);
  const lockPulseRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const chargeArcsRef = useRef<THREE.Group>(null);

  // 75 reusable GPU spark particles with precalculated radial trajectories
  const sparkCount = 75;
  const [sparkPos, sparkVel, sparkColors] = useMemo(() => {
    const pos = new Float32Array(sparkCount * 3);
    const vel = new Float32Array(sparkCount * 3);
    const col = new Float32Array(sparkCount * 3);

    const cCyan = new THREE.Color('#22d3ee');
    const cPurple = new THREE.Color('#a855f7');
    const cSky = new THREE.Color('#38bdf8');
    const cWhite = new THREE.Color('#ffffff');

    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.65;
      const speed = 2.4 + Math.random() * 3.2;

      vel[i * 3] = Math.cos(theta) * Math.cos(phi) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * speed * 0.65;
      vel[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * speed;

      const choice = Math.random();
      const color = choice < 0.4 ? cCyan : choice < 0.7 ? cPurple : choice < 0.9 ? cSky : cWhite;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, vel, col];
  }, [sparkCount]);

  useFrame((_, delta) => {
    const now = performance.now();
    const blastElapsed = blastTime > 0 ? (now - blastTime) / 1000 : 999;

    // 1. Primary Expanding Radial Shockwave
    if (shockwaveRef.current) {
      if (blastElapsed >= 0 && blastElapsed < 0.55) {
        shockwaveRef.current.visible = true;
        const progress = blastElapsed / 0.55;
        const scale = 0.15 + Math.pow(progress, 0.6) * 2.8;
        shockwaveRef.current.scale.set(scale, scale, scale);
        const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - progress) * 0.85;
      } else {
        shockwaveRef.current.visible = false;
      }
    }

    // 2. Secondary Concentric Shockwave
    if (shockwave2Ref.current) {
      if (blastElapsed >= 0.04 && blastElapsed < 0.5) {
        shockwave2Ref.current.visible = true;
        const progress = (blastElapsed - 0.04) / 0.46;
        const scale = 0.1 + Math.pow(progress, 0.7) * 2.2;
        shockwave2Ref.current.scale.set(scale, scale, scale);
        const mat = shockwave2Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - progress) * 0.65;
      } else {
        shockwave2Ref.current.visible = false;
      }
    }

    // 3. Selection Lock-in Holographic Wave (settling after blast)
    if (lockPulseRef.current) {
      if (blastElapsed >= 0.35 && blastElapsed < 1.2) {
        lockPulseRef.current.visible = true;
        const progress = (blastElapsed - 0.35) / 0.85;
        const scale = 0.8 + progress * 0.7;
        lockPulseRef.current.scale.set(scale, scale, scale);
        const mat = lockPulseRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - progress) * 0.4;
      } else {
        lockPulseRef.current.visible = false;
      }
    }

    // 4. Blast Spark Dispersion Particles
    if (particlesRef.current) {
      if (blastElapsed >= 0 && blastElapsed < 0.75) {
        particlesRef.current.visible = true;
        const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        const mat = particlesRef.current.material as THREE.PointsMaterial;
        mat.opacity = Math.max(0, 1 - Math.pow(blastElapsed / 0.75, 1.4));

        for (let i = 0; i < sparkCount; i++) {
          const drag = Math.max(0, 1 - blastElapsed * 1.3);
          array[i * 3] = sparkVel[i * 3] * blastElapsed * drag;
          array[i * 3 + 1] = -0.05 + sparkVel[i * 3 + 1] * blastElapsed * drag;
          array[i * 3 + 2] = sparkVel[i * 3 + 2] * blastElapsed * drag;
        }
        posAttr.needsUpdate = true;
      } else {
        particlesRef.current.visible = false;
      }
    }

    // 5. High-Energy Quantum Charge Electrical Arcs during countdown
    if (chargeArcsRef.current) {
      if (isShuffling && countdown !== null) {
        chargeArcsRef.current.visible = true;
        const spinSpeed = countdown === 1 ? 14 : countdown === 2 ? 8 : 4;
        chargeArcsRef.current.rotation.x += delta * spinSpeed;
        chargeArcsRef.current.rotation.y += delta * (spinSpeed * 1.3);
        chargeArcsRef.current.rotation.z += delta * (spinSpeed * 0.9);
        const arcScale = countdown === 1 ? 1.3 : countdown === 2 ? 1.1 : 0.9;
        chargeArcsRef.current.scale.set(arcScale, arcScale, arcScale);
      } else {
        chargeArcsRef.current.visible = false;
      }
    }
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* Primary Radial Shockwave */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2.2, 0, 0]} visible={false}>
        <ringGeometry args={[0.92, 1.05, 48]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Secondary Concentric Shockwave */}
      <mesh ref={shockwave2Ref} rotation={[-Math.PI / 2.5, Math.PI / 8, 0]} visible={false}>
        <ringGeometry args={[0.88, 0.98, 48]} />
        <meshBasicMaterial
          color="#c084fc"
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Lock-In Holographic Wave */}
      <mesh ref={lockPulseRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[1.2, 1.26, 48]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Quantum Blast Spark Particles */}
      <points ref={particlesRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[sparkColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* High-Energy Quantum Charge Electrical Arcs */}
      <group ref={chargeArcsRef} visible={false}>
        <mesh>
          <torusGeometry args={[0.22, 0.007, 12, 24, Math.PI * 0.65]} />
          <meshBasicMaterial color="#ffffff" blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[Math.PI / 2, Math.PI / 4, 0]}>
          <torusGeometry args={[0.18, 0.006, 12, 24, Math.PI * 0.55]} />
          <meshBasicMaterial color="#22d3ee" blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[0, Math.PI / 3, Math.PI / 3]}>
          <torusGeometry args={[0.26, 0.005, 12, 24, Math.PI * 0.7]} />
          <meshBasicMaterial color="#a855f7" blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
}

// 2. Central Energy Core (High-energy quantum reactor)
function EnergyCore({
  isShuffling,
  isRevealed,
  countdown,
  blastTime
}: {
  isShuffling: boolean;
  isRevealed: boolean;
  countdown: number | null;
  blastTime: number;
}) {
  const coreRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const haloMeshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const blastElapsed = blastTime > 0 ? (performance.now() - blastTime) / 1000 : 999;

    let baseScale = 1.0;
    let emissiveInt = isRevealed ? 1.8 : 0.6;
    let spinMult = 1.0;

    if (isShuffling && countdown !== null) {
      if (countdown === 3) {
        // Gather stage: pulsing slightly faster
        baseScale = 1.0 + Math.sin(t * 7) * 0.08;
        emissiveInt = 2.4;
        spinMult = 3.0;
      } else if (countdown === 2) {
        // Charge stage: compressed core, increasing glow
        baseScale = 0.88 + Math.sin(t * 12) * 0.06;
        emissiveInt = 3.8;
        spinMult = 6.0;
      } else if (countdown === 1) {
        // Max charge: maximum energy compression, peak luminance
        baseScale = 0.78 + (Math.random() - 0.5) * 0.08;
        emissiveInt = 5.2;
        spinMult = 10.0;
      }
    } else if (blastElapsed >= 0 && blastElapsed < 0.5) {
      // Blast flare: instant radial expansion and flash
      const p = blastElapsed / 0.5;
      baseScale = 1.6 * (1 - p * 0.6);
      emissiveInt = 5.5 * (1 - p * 0.6);
      spinMult = 4.0;
    } else {
      baseScale = 1 + Math.sin(t * 1.8) * 0.05;
      spinMult = 1.0;
    }

    if (coreRef.current) {
      coreRef.current.scale.set(baseScale, baseScale, baseScale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.4 * spinMult;
      ringRef.current.rotation.y += delta * 0.35 * spinMult;
    }
    if (innerMeshRef.current) {
      const mat = innerMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = emissiveInt;
    }
    if (haloMeshRef.current) {
      const haloMat = haloMeshRef.current.material as THREE.MeshBasicMaterial;
      haloMat.opacity = isShuffling ? 0.45 : isRevealed ? 0.18 : 0.08;
    }
  });

  return (
    <group ref={coreRef} position={[0, -0.08, 0]}>
      {/* Luminous Core Sphere */}
      <mesh ref={innerMeshRef}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial
          color={isRevealed ? '#e0f2fe' : '#475569'}
          emissive={isRevealed ? '#06b6d4' : '#1e293b'}
          emissiveIntensity={isRevealed ? 1.8 : 0.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Volumetric Halo Glow */}
      <mesh ref={haloMeshRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color={isRevealed ? '#38bdf8' : '#334155'}
          transparent
          opacity={isRevealed ? 0.18 : 0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Thin Micro-Orbit Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.25, 0.006, 16, 36]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#a855f7"
          emissiveIntensity={isRevealed ? 1.8 : 0.5}
        />
      </mesh>
    </group>
  );
}

// 3. Five Floating AI Objects (React to Gravitational Gather, Charge, and Blast Burst)
function FiveFloatingObjects({
  isShuffling,
  isRevealed,
  countdown,
  blastTime
}: {
  isShuffling: boolean;
  isRevealed: boolean;
  countdown: number | null;
  blastTime: number;
}) {
  const obj1Ref = useRef<THREE.Group>(null); // Crystalline Data Shard (Upper-Left Front)
  const obj2Ref = useRef<THREE.Group>(null); // Tiny Metallic Cube (Upper-Right Rear)
  const obj3Ref = useRef<THREE.Group>(null); // Small Energy Orb (Center Hovering)
  const obj4Ref = useRef<THREE.Group>(null); // Geometric Prism / Shard (Lower-Left Rear)
  const obj5Ref = useRef<THREE.Group>(null); // Holographic Diamond (Lower-Right Front)

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const blastElapsed = blastTime > 0 ? (performance.now() - blastTime) / 1000 : 999;

    // Determine gravitational pull or blast impulse modifier
    let gravFactor = 1.0;
    let blastImpulse = 0.0;
    let rotSpeed = 1.0;

    if (isShuffling && countdown !== null) {
      if (countdown === 3) {
        // Gather: Objects smoothly pulled toward center
        gravFactor = 0.65;
        rotSpeed = 2.5;
      } else if (countdown === 2) {
        // Charge: Compressed closer to core
        gravFactor = 0.42;
        rotSpeed = 4.0;
      } else if (countdown === 1) {
        // Maximum charge: Highly compressed with subtle energetic jitter
        gravFactor = 0.28;
        rotSpeed = 6.0;
      }
    } else if (blastElapsed >= 0 && blastElapsed < 0.65) {
      // Blast burst: Outward radial explosion impulse decaying to normal
      const progress = blastElapsed / 0.65;
      blastImpulse = Math.sin(progress * Math.PI) * 0.42;
      gravFactor = 1.0 + blastImpulse;
      rotSpeed = 3.5 * (1 - progress);
    }

    // 1. Crystalline Data Shard
    if (obj1Ref.current) {
      const baseX = -0.50 * gravFactor;
      const baseY = 0.18 * (gravFactor * 0.7 + 0.3);
      const baseZ = 0.40 * gravFactor;
      obj1Ref.current.position.x = baseX + Math.sin(t * 0.85 * rotSpeed) * 0.05;
      obj1Ref.current.position.y = baseY + Math.cos(t * 1.05 * rotSpeed) * 0.04;
      obj1Ref.current.position.z = baseZ + Math.sin(t * 0.65 * rotSpeed) * 0.04;
      obj1Ref.current.rotation.x += delta * 0.7 * rotSpeed;
      obj1Ref.current.rotation.y += delta * 0.9 * rotSpeed;
    }

    // 2. Metallic Cube
    if (obj2Ref.current) {
      const baseX = 0.46 * gravFactor;
      const baseY = 0.14 * (gravFactor * 0.7 + 0.3);
      const baseZ = -0.36 * gravFactor;
      obj2Ref.current.position.x = baseX + Math.cos(t * 0.75 * rotSpeed) * 0.04;
      obj2Ref.current.position.y = baseY + Math.sin(t * 1.15 * rotSpeed) * 0.04;
      obj2Ref.current.position.z = baseZ + Math.cos(t * 0.55 * rotSpeed) * 0.04;
      obj2Ref.current.rotation.y += delta * 1.1 * rotSpeed;
      obj2Ref.current.rotation.z += delta * 0.8 * rotSpeed;
    }

    // 3. Energy Orb
    if (obj3Ref.current) {
      obj3Ref.current.position.x = Math.sin(t * 0.5 * rotSpeed) * (0.04 * gravFactor);
      obj3Ref.current.position.y = 0.02 + Math.sin(t * 1.35 * rotSpeed) * 0.04;
      obj3Ref.current.position.z = Math.cos(t * 0.55 * rotSpeed) * (0.04 * gravFactor);
      obj3Ref.current.rotation.y += delta * 1.4 * rotSpeed;
    }

    // 4. Geometric Prism
    if (obj4Ref.current) {
      const baseX = -0.42 * gravFactor;
      const baseY = -0.15 * (gravFactor * 0.7 + 0.3);
      const baseZ = -0.30 * gravFactor;
      obj4Ref.current.position.x = baseX + Math.cos(t * 0.65 * rotSpeed) * 0.04;
      obj4Ref.current.position.y = baseY + Math.sin(t * 0.85 * rotSpeed) * 0.035;
      obj4Ref.current.position.z = baseZ + Math.sin(t * 1.05 * rotSpeed) * 0.035;
      obj4Ref.current.rotation.x += delta * 1.0 * rotSpeed;
      obj4Ref.current.rotation.z += delta * 0.65 * rotSpeed;
    }

    // 5. Holographic Diamond
    if (obj5Ref.current) {
      const baseX = 0.42 * gravFactor;
      const baseY = -0.13 * (gravFactor * 0.7 + 0.3);
      const baseZ = 0.32 * gravFactor;
      obj5Ref.current.position.x = baseX + Math.sin(t * 0.95 * rotSpeed) * 0.04;
      obj5Ref.current.position.y = baseY + Math.cos(t * 0.75 * rotSpeed) * 0.035;
      obj5Ref.current.position.z = baseZ + Math.cos(t * 0.85 * rotSpeed) * 0.035;
      obj5Ref.current.rotation.y += delta * 1.2 * rotSpeed;
      obj5Ref.current.rotation.x += delta * 0.55 * rotSpeed;
    }
  });

  return (
    <group>
      {/* 1. Crystalline Data Shard (Cyan Octahedron) */}
      <group ref={obj1Ref} position={[-0.50, 0.18, 0.40]}>
        <mesh>
          <octahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive={isRevealed ? '#22d3ee' : '#0891b2'}
            emissiveIntensity={isRevealed ? 2.0 : 0.7}
            roughness={0.12}
            metalness={0.8}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.OctahedronGeometry(0.112, 0)]} />
          <lineBasicMaterial color="#38bdf8" />
        </lineSegments>
      </group>

      {/* 2. Metallic Micro-Cube (Violet Cube) */}
      <group ref={obj2Ref} position={[0.46, 0.14, -0.36]}>
        <mesh>
          <boxGeometry args={[0.125, 0.125, 0.125]} />
          <meshStandardMaterial
            color="#1e1b4b"
            emissive={isRevealed ? '#8b5cf6' : '#3730a3'}
            emissiveIntensity={isRevealed ? 1.8 : 0.5}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(0.127, 0.127, 0.127)]} />
          <lineBasicMaterial color="#c084fc" />
        </lineSegments>
      </group>

      {/* 3. Small Energy Orb (Emerald Sphere) */}
      <group ref={obj3Ref} position={[0, 0.02, 0]}>
        <mesh>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial
            color="#064e3b"
            emissive={isRevealed ? '#10b981' : '#047857'}
            emissiveIntensity={isRevealed ? 2.2 : 0.7}
            roughness={0.15}
            metalness={0.85}
          />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.12, 0.005, 12, 24]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
      </group>

      {/* 4. Geometric Prism Shard (Amber Tetrahedron) */}
      <group ref={obj4Ref} position={[-0.42, -0.15, -0.30]}>
        <mesh>
          <tetrahedronGeometry args={[0.115, 0]} />
          <meshStandardMaterial
            color="#78350f"
            emissive={isRevealed ? '#f59e0b' : '#b45309'}
            emissiveIntensity={isRevealed ? 1.8 : 0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.TetrahedronGeometry(0.117, 0)]} />
          <lineBasicMaterial color="#fbbf24" />
        </lineSegments>
      </group>

      {/* 5. Holographic Diamond (Ruby Dodecahedron) */}
      <group ref={obj5Ref} position={[0.42, -0.13, 0.32]}>
        <mesh>
          <dodecahedronGeometry args={[0.095, 0]} />
          <meshStandardMaterial
            color="#881337"
            emissive={isRevealed ? '#f43f5e' : '#9f1239'}
            emissiveIntensity={isRevealed ? 2.0 : 0.6}
            roughness={0.15}
            metalness={0.85}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.DodecahedronGeometry(0.097, 0)]} />
          <lineBasicMaterial color="#fb7185" />
        </lineSegments>
      </group>
    </group>
  );
}

// 4. Interior Atmospheric Micro-Particles
function InteriorAtmosphericParticles({ isShuffling, isRevealed }: { isShuffling: boolean; isRevealed: boolean }) {
  const count = 65;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, speeds, phases, radii] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const phs = new Float32Array(count);
    const rad = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 0.15 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const y = -0.36 + (r / 1.3) * 0.62 + (Math.random() - 0.5) * 0.18;

      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;

      spd[i] = 0.3 + Math.random() * 0.7;
      phs[i] = Math.random() * Math.PI * 2;
      rad[i] = r;
    }
    return [pos, spd, phs, rad];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const mult = isShuffling ? 3.5 : 1.0;

    for (let i = 0; i < count; i++) {
      const angle = t * speeds[i] * mult + phases[i];
      const r = radii[i] + Math.sin(t * 1.2 + phases[i]) * 0.04;

      array[i * 3] = Math.cos(angle) * r;
      array[i * 3 + 1] = positions[i * 3 + 1] + Math.sin(t * 1.6 + phases[i]) * 0.05;
      array[i * 3 + 2] = Math.sin(angle) * r;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={isShuffling ? 0.032 : 0.022}
        color={isRevealed ? '#38bdf8' : '#64748b'}
        transparent
        opacity={isShuffling ? 0.85 : 0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 5. Holographic Halo (Backdrop Energy Field)
function HoveringHolographicHalo({ isShuffling, isRevealed }: { isShuffling: boolean; isRevealed: boolean }) {
  const haloGroupRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Group>(null);
  const sweepNodeRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const mult = isShuffling ? 2.5 : 1.0;

    if (haloGroupRef.current) {
      const pulse = 1 + Math.sin(t * 1.0) * 0.018;
      haloGroupRef.current.scale.set(pulse, pulse, 1);
      haloGroupRef.current.position.y = -0.05 + Math.sin(t * 0.7) * 0.03;
      haloGroupRef.current.rotation.z += delta * 0.05 * mult;
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.075 * mult;
    }

    // Scanning light sweep node around halo perimeter
    if (sweepNodeRef.current) {
      const angle = t * 0.65 * mult;
      sweepNodeRef.current.position.x = Math.cos(angle) * 1.82;
      sweepNodeRef.current.position.y = Math.sin(angle) * 1.82;
    }
  });

  const radialGeometry = useMemo(() => {
    const positions: number[] = [];
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const isMajor = i % 4 === 0;
      const r1 = isMajor ? 1.68 : 1.74;
      const r2 = isMajor ? 1.94 : 1.87;
      positions.push(Math.cos(angle) * r1, Math.sin(angle) * r1, 0);
      positions.push(Math.cos(angle) * r2, Math.sin(angle) * r2, 0);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, []);

  return (
    <group position={[0, -0.05, -0.75]}>
      <group ref={haloGroupRef}>
        {/* Outer Boundary Ring */}
        <mesh>
          <ringGeometry args={[1.89, 1.905, 64]} />
          <meshBasicMaterial
            color={isRevealed ? '#38bdf8' : '#334155'}
            transparent
            opacity={isRevealed ? 0.3 : 0.1}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Segmented Energy Arc 1 */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[1.79, 1.815, 48, 1, 0, Math.PI * 0.65]} />
          <meshBasicMaterial
            color={isRevealed ? '#22d3ee' : '#475569'}
            transparent
            opacity={isRevealed ? 0.5 : 0.18}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Segmented Energy Arc 2 */}
        <mesh rotation={[0, 0, Math.PI * 0.8]}>
          <ringGeometry args={[1.79, 1.815, 48, 1, 0, Math.PI * 0.55]} />
          <meshBasicMaterial
            color={isRevealed ? '#a855f7' : '#334155'}
            transparent
            opacity={isRevealed ? 0.45 : 0.15}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Segmented Energy Arc 3 */}
        <mesh rotation={[0, 0, Math.PI * 1.5]}>
          <ringGeometry args={[1.79, 1.815, 48, 1, 0, Math.PI * 0.35]} />
          <meshBasicMaterial
            color={isRevealed ? '#38bdf8' : '#334155'}
            transparent
            opacity={isRevealed ? 0.4 : 0.12}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Soft Translucent Field Disk */}
        <mesh>
          <ringGeometry args={[1.65, 1.91, 48]} />
          <meshBasicMaterial
            color={isRevealed ? '#083358' : '#0a1526'}
            transparent
            opacity={isRevealed ? 0.12 : 0.04}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Radial Holographic Grid Markings */}
        <lineSegments geometry={radialGeometry}>
          <lineBasicMaterial
            color={isRevealed ? '#22d3ee' : '#475569'}
            transparent
            opacity={isRevealed ? 0.4 : 0.15}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Inner Counter-Rotating Concentric Ring */}
        <group ref={innerRingRef}>
          <mesh>
            <ringGeometry args={[1.66, 1.675, 48, 1, 0, Math.PI * 0.4]} />
            <meshBasicMaterial
              color={isRevealed ? '#c084fc' : '#475569'}
              transparent
              opacity={isRevealed ? 0.35 : 0.12}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI]}>
            <ringGeometry args={[1.66, 1.675, 48, 1, 0, Math.PI * 0.35]} />
            <meshBasicMaterial
              color={isRevealed ? '#22d3ee' : '#334155'}
              transparent
              opacity={isRevealed ? 0.3 : 0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Traveling Luminous Sweep Node */}
        <mesh ref={sweepNodeRef} position={[1.82, 0, 0.01]}>
          <circleGeometry args={[0.024, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={isRevealed ? 0.9 : 0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

// 6. 5 Small Floating Energy Crystals
function FloatingEnergyCrystals({ isShuffling, isRevealed }: { isShuffling: boolean; isRevealed: boolean }) {
  const crystalData = useMemo(() => [
    { pos: [-1.45, 0.38, 0.42], scale: 0.075, color: '#06b6d4', emissive: '#22d3ee', speed: 0.7, phase: 0.2, type: 'oct' },
    { pos: [1.42, 0.42, -0.38], scale: 0.065, color: '#8b5cf6', emissive: '#a855f7', speed: 0.85, phase: 1.4, type: 'tetra' },
    { pos: [-1.15, -0.35, -0.65], scale: 0.060, color: '#10b981', emissive: '#34d399', speed: 0.75, phase: 2.8, type: 'oct' },
    { pos: [1.38, -0.22, 0.45], scale: 0.068, color: '#f59e0b', emissive: '#fbbf24', speed: 0.6, phase: 4.1, type: 'ico' },
    { pos: [0.0, -0.65, 1.10], scale: 0.058, color: '#6366f1', emissive: '#818cf8', speed: 0.9, phase: 0.9, type: 'ico' }
  ], []);

  const meshRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const mult = isShuffling ? 2.5 : 1.0;

    crystalData.forEach((item, idx) => {
      const mesh = meshRefs.current[idx];
      if (mesh) {
        mesh.position.y = item.pos[1] + Math.sin(t * item.speed * mult + item.phase) * 0.07;
        mesh.rotation.x += delta * 0.55 * mult;
        mesh.rotation.y += delta * 0.8 * mult;
      }
    });
  });

  return (
    <group>
      {crystalData.map((item, idx) => (
        <group
          key={`cryst-${idx}`}
          ref={(el) => (meshRefs.current[idx] = el)}
          position={item.pos as [number, number, number]}
        >
          <mesh>
            {item.type === 'oct' ? (
              <octahedronGeometry args={[item.scale, 0]} />
            ) : item.type === 'tetra' ? (
              <tetrahedronGeometry args={[item.scale, 0]} />
            ) : (
              <icosahedronGeometry args={[item.scale, 0]} />
            )}
            <meshStandardMaterial
              color={item.color}
              emissive={isRevealed ? item.emissive : '#1e293b'}
              emissiveIntensity={isRevealed ? 2.0 : 0.5}
              roughness={0.15}
              metalness={0.85}
              transparent
              opacity={0.85}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[
              item.type === 'oct'
                ? new THREE.OctahedronGeometry(item.scale * 1.02, 0)
                : item.type === 'tetra'
                ? new THREE.TetrahedronGeometry(item.scale * 1.02, 0)
                : new THREE.IcosahedronGeometry(item.scale * 1.02, 0)
            ]} />
            <lineBasicMaterial color={item.emissive} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

// 7. Tiny Broken Energy Arcs (Short Partial Energy Bursts)
function ShortEnergyArcs({ isShuffling, isRevealed }: { isShuffling: boolean; isRevealed: boolean }) {
  const arc1Ref = useRef<THREE.Group>(null);
  const arc2Ref = useRef<THREE.Group>(null);
  const arc3Ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const mult = isShuffling ? 3.0 : 1.0;
    if (arc1Ref.current) arc1Ref.current.rotation.z += delta * 0.22 * mult;
    if (arc2Ref.current) arc2Ref.current.rotation.z -= delta * 0.28 * mult;
    if (arc3Ref.current) arc3Ref.current.rotation.z += delta * 0.18 * mult;
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* Short Arc 1 */}
      <group ref={arc1Ref} rotation={[Math.PI / 6, Math.PI / 8, 0]}>
        <mesh>
          <torusGeometry args={[1.52, 0.0045, 12, 32, Math.PI * 0.35]} />
          <meshBasicMaterial
            color={isRevealed ? '#38bdf8' : '#475569'}
            transparent
            opacity={isRevealed ? 0.7 : 0.2}
          />
        </mesh>
      </group>

      {/* Short Arc 2 */}
      <group ref={arc2Ref} rotation={[-Math.PI / 7, -Math.PI / 6, Math.PI / 4]}>
        <mesh>
          <torusGeometry args={[1.65, 0.0035, 12, 32, Math.PI * 0.30]} />
          <meshBasicMaterial
            color={isRevealed ? '#c084fc' : '#334155'}
            transparent
            opacity={isRevealed ? 0.6 : 0.18}
          />
        </mesh>
      </group>

      {/* Short Arc 3 */}
      <group ref={arc3Ref} rotation={[Math.PI / 4, -Math.PI / 8, Math.PI / 2]}>
        <mesh>
          <torusGeometry args={[1.76, 0.0035, 12, 28, Math.PI * 0.25]} />
          <meshBasicMaterial
            color={isRevealed ? '#22d3ee' : '#1e293b'}
            transparent
            opacity={isRevealed ? 0.55 : 0.12}
          />
        </mesh>
      </group>
    </group>
  );
}

// 8. Subtle Under-Bowl Ground Energy Field
function UnderBowlEnergyField({ isShuffling, isRevealed }: { isShuffling: boolean; isRevealed: boolean }) {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (glowRef.current) {
      const p = 1 + Math.sin(t * (isShuffling ? 4.5 : 1.8)) * 0.06;
      glowRef.current.scale.set(p, p, 1);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.004;
    }
  });

  return (
    <group position={[0, -0.82, 0]}>
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 32]} />
        <meshBasicMaterial
          color={isRevealed ? '#06b6d4' : '#1e293b'}
          transparent
          opacity={isRevealed ? 0.2 : 0.06}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.02, 1.15, 32]} />
        <meshBasicMaterial
          color={isRevealed ? '#38bdf8' : '#334155'}
          transparent
          opacity={isRevealed ? 0.25 : 0.06}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// 9. Gravity-Field Ambient Particles
function GravityFieldParticles({ isShuffling, isRevealed }: { isShuffling: boolean; isRevealed: boolean }) {
  const count = 135;
  const pointsRef = useRef<THREE.Points>(null);
  const { pointer } = useThree();

  const [initialData] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const phs = new Float32Array(count);
    const radii = new Float32Array(count);
    const yBases = new Float32Array(count);
    const types = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const pType = i % 3;
      let r = 0;
      let y = 0;
      let z = 0;

      if (pType === 0) {
        // Upward flow through core
        r = 0.3 + Math.random() * 1.0;
        y = -0.7 + Math.random() * 1.5;
        z = (Math.random() - 0.5) * 1.1;
      } else if (pType === 1) {
        // Curving gravity field
        r = 1.05 + Math.random() * 0.85;
        y = (Math.random() - 0.4) * 1.7;
        z = (Math.random() - 0.5) * 1.3;
      } else {
        // Background depth
        r = 1.55 + Math.random() * 1.5;
        y = (Math.random() - 0.3) * 1.9;
        z = -0.6 - Math.random() * 1.3;
      }

      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = pType === 2 ? (Math.random() - 0.5) * 4.0 : Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = pType === 2 ? z : Math.sin(theta) * r;

      spd[i] = 0.15 + Math.random() * 0.35;
      phs[i] = Math.random() * Math.PI * 2;
      radii[i] = r;
      yBases[i] = y;
      types[i] = pType;
    }
    return [{ pos, spd, phs, radii, yBases, types }];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    const px = pointer.x * 0.16;
    const py = pointer.y * 0.10;

    for (let i = 0; i < count; i++) {
      const pType = initialData.types[i];
      const parallaxFactor = pType === 0 ? 0.75 : pType === 1 ? 0.95 : 0.25;
      const spd = initialData.spd[i] * (isShuffling ? 2.5 : 1.0);
      const angle = t * spd * 0.38 + initialData.phs[i];

      if (pType === 0) {
        const rMagnetic = initialData.radii[i] * (1 + Math.sin(t * 1.1 + initialData.phs[i]) * 0.08);
        array[i * 3] = Math.cos(angle) * rMagnetic + px * parallaxFactor;
        const yRise = ((t * spd * 0.32 + initialData.yBases[i] + 1.0) % 2.1) - 0.7;
        array[i * 3 + 1] = yRise + py * parallaxFactor;
        array[i * 3 + 2] = Math.sin(angle) * rMagnetic;
      } else if (pType === 1) {
        const rField = initialData.radii[i] + Math.sin(t * 0.75 + initialData.phs[i]) * 0.1;
        array[i * 3] = Math.cos(angle) * rField + px * parallaxFactor;
        const yDrift = ((t * spd * 0.18 + initialData.yBases[i] + 1.5) % 3.0) - 1.5;
        array[i * 3 + 1] = yDrift + py * parallaxFactor;
        array[i * 3 + 2] = Math.sin(angle) * rField;
      } else {
        array[i * 3] = initialData.pos[i * 3] + px * parallaxFactor;
        array[i * 3 + 1] = initialData.pos[i * 3 + 1] + Math.sin(t * 0.25 + initialData.phs[i]) * 0.06 + py * parallaxFactor;
        array[i * 3 + 2] = initialData.pos[i * 3 + 2];
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initialData.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={isShuffling ? 0.032 : 0.022}
        color={isRevealed ? '#38bdf8' : '#64748b'}
        transparent
        opacity={isRevealed ? 0.6 : 0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 10. Transparent Holographic Quantum Glass Bowl (Hero Object)
function ProportionalDiscoveryBowl({
  isShuffling,
  isRevealed,
  blastTime = 0
}: {
  isShuffling: boolean;
  isRevealed: boolean;
  blastTime?: number;
}) {
  const bowlGroupRef = useRef<THREE.Group>(null);
  const rimLightRef = useRef<THREE.Mesh>(null);
  const glassMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const glitterPointsRef = useRef<THREE.Points>(null);
  const causticRef = useRef<THREE.Group>(null);

  // Micro-glitter particles embedded across the glass bowl wall
  const glitterCount = 96;
  const [glitterData] = useMemo(() => {
    const pos = new Float32Array(glitterCount * 3);
    const col = new Float32Array(glitterCount * 3);
    const twSpeeds = new Float32Array(glitterCount);
    const twPhases = new Float32Array(glitterCount);

    const c1 = new THREE.Color('#38bdf8'); // cyan
    const c2 = new THREE.Color('#c084fc'); // violet
    const c3 = new THREE.Color('#60a5fa'); // sky blue
    const c4 = new THREE.Color('#ffffff'); // diamond white

    for (let i = 0; i < glitterCount; i++) {
      const u = Math.random();
      // Interpolate along bowl profile height from -0.48 to 0.52
      const y = -0.48 + u * 0.98;
      // Radius profile matching the U-curvature of the lathe wall
      const r = 0.55 + 0.90 * Math.sin(u * (Math.PI / 2)) + (Math.random() - 0.5) * 0.08;
      const theta = Math.random() * Math.PI * 2;

      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;

      const choice = Math.random();
      const color = choice < 0.35 ? c1 : choice < 0.65 ? c2 : choice < 0.85 ? c3 : c4;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      twSpeeds[i] = 1.2 + Math.random() * 2.8;
      twPhases[i] = Math.random() * Math.PI * 2;
    }

    return [{ pos, col, twSpeeds, twPhases }];
  }, [glitterCount]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const blastElapsed = blastTime > 0 ? (performance.now() - blastTime) / 1000 : 999;

    // Slow rotation of bowl assembly
    if (bowlGroupRef.current) {
      bowlGroupRef.current.rotation.y += delta * (isShuffling ? 1.2 : 0.05);
    }

    // Traveling rim highlight node
    if (rimLightRef.current) {
      const speed = isShuffling ? 4.5 : 0.85;
      const angle = t * speed;
      rimLightRef.current.position.x = Math.cos(angle) * 1.48;
      rimLightRef.current.position.z = Math.sin(angle) * 1.48;
    }

    // Moving subtle caustic reflection sheen
    if (causticRef.current) {
      causticRef.current.rotation.y = t * 0.15;
      causticRef.current.rotation.x = Math.sin(t * 0.25) * 0.15;
    }

    // Dynamic glass emissive & transmission response
    if (glassMatRef.current) {
      if (blastElapsed >= 0 && blastElapsed < 0.5) {
        const p = blastElapsed / 0.5;
        // Brief luminous energy catch during blast
        glassMatRef.current.emissiveIntensity = 0.25 + (1 - p) * 1.8;
        glassMatRef.current.roughness = 0.04;
      } else if (isShuffling) {
        glassMatRef.current.emissiveIntensity = 0.45 + Math.sin(t * 6) * 0.15;
      } else {
        glassMatRef.current.emissiveIntensity = isRevealed ? 0.28 : 0.08;
      }
    }

    // Glitter twinkling animation
    if (glitterPointsRef.current) {
      const mat = glitterPointsRef.current.material as THREE.PointsMaterial;
      if (blastElapsed >= 0 && blastElapsed < 0.5) {
        mat.opacity = 0.95;
        mat.size = 0.028;
      } else {
        mat.opacity = isRevealed ? 0.75 : 0.4;
        mat.size = isRevealed ? 0.022 : 0.016;
      }
    }
  });

  const bowlGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const segments = 32;

    points.push(new THREE.Vector2(0.001, -0.52));
    points.push(new THREE.Vector2(0.44, -0.52));
    points.push(new THREE.Vector2(0.58, -0.50));

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = 0.58 + 0.92 * Math.sin(t * (Math.PI / 2));
      const y = -0.50 + 1.02 * t;
      points.push(new THREE.Vector2(x, y));
    }

    points.push(new THREE.Vector2(1.50, 0.53));
    points.push(new THREE.Vector2(1.46, 0.55));
    points.push(new THREE.Vector2(1.38, 0.53));

    for (let i = segments; i >= 1; i--) {
      const t = i / segments;
      const x = 0.50 + 0.88 * Math.sin(t * (Math.PI / 2));
      const y = -0.44 + 0.96 * t;
      points.push(new THREE.Vector2(x, y));
    }

    points.push(new THREE.Vector2(0.44, -0.44));
    points.push(new THREE.Vector2(0.001, -0.44));

    return new THREE.LatheGeometry(points, 64);
  }, []);

  return (
    <group ref={bowlGroupRef} position={[0, -0.05, 0]}>
      {/* 1. Transparent Holographic Quantum Glass Bowl */}
      <mesh geometry={bowlGeometry}>
        <meshPhysicalMaterial
          ref={glassMatRef}
          color="#e0f2fe"
          emissive={isRevealed ? '#0284c7' : '#0f172a'}
          emissiveIntensity={isRevealed ? 0.28 : 0.08}
          roughness={0.04}
          metalness={0.10}
          transmission={0.96}
          thickness={0.80}
          ior={1.52}
          transparent={true}
          opacity={0.68}
          reflectivity={0.92}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          attenuationColor="#38bdf8"
          attenuationDistance={2.4}
        />
      </mesh>

      {/* 2. Embedded Holographic Micro-Glitter & Sparkles */}
      <points ref={glitterPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glitterData.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[glitterData.col, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.022}
          vertexColors
          transparent
          opacity={0.75}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3. Moving Holographic Specular Caustic Sheen */}
      <group ref={causticRef}>
        <mesh position={[0, 0.08, 0]}>
          <torusGeometry args={[1.40, 0.008, 12, 48, Math.PI * 0.4]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={isRevealed ? 0.45 : 0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[0, Math.PI, 0]}>
          <torusGeometry args={[1.18, 0.007, 12, 48, Math.PI * 0.35]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={isRevealed ? 0.35 : 0.12}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 4. Illuminated Holographic Lip Rim */}
      <mesh position={[0, 0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.38, 1.50, 64]} />
        <meshBasicMaterial
          color={isRevealed ? '#38bdf8' : '#334155'}
          transparent
          opacity={isRevealed ? 0.75 : 0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 5. Traveling Luminous Rim Pulse Node */}
      <mesh ref={rimLightRef} position={[1.44, 0.54, 0]}>
        <sphereGeometry args={[0.032, 16, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={isRevealed ? 0.95 : 0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 6. Dark Titanium & Crystal Pedestal Support */}
      <group position={[0, -0.62, 0]}>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.42, 0.52, 0.08, 36]} />
          <meshStandardMaterial
            color="#080f1e"
            roughness={0.25}
            metalness={0.9}
          />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.54, 0.60, 0.04, 36]} />
          <meshStandardMaterial
            color="#050a14"
            roughness={0.3}
            metalness={0.85}
          />
        </mesh>
        <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.41, 0.43, 36]} />
          <meshBasicMaterial
            color={isRevealed ? '#06b6d4' : '#1e293b'}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    </group>
  );
}

export const ThreeBowlScene: React.FC<ThreeBowlSceneProps> = ({
  isRevealed,
  isClaimed,
  assignedProblemCode,
  onShuffle,
  disabled = false
}) => {
  const [shuffling, setShuffling] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [blastTriggerTime, setBlastTriggerTime] = useState<number>(0);
  const [revealedProblem, setRevealedProblem] = useState<string | null>(assignedProblemCode || null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (assignedProblemCode) {
      setRevealedProblem(assignedProblemCode);
    }
  }, [assignedProblemCode]);

  const handleStartShuffle = async () => {
    if (shuffling || isClaimed || !isRevealed || disabled) return;

    setShuffling(true);
    setBlastTriggerTime(0);

    let serverResult: { problemCode: string } | null = null;
    try {
      serverResult = await onShuffle();
    } catch (e) {
      setShuffling(false);
      return;
    }

    if (!serverResult) {
      setShuffling(false);
      return;
    }

    const assignedCode = serverResult.problemCode;

    // Phase 1: Countdown 3 → ENERGY GATHER (Objects accelerate & gravitational pull inward)
    setCountdown(3);
    playCountdownBeep(600);
    playQuantumChargeSound();

    // Phase 2: Countdown 2 → QUANTUM CHARGE (Core compresses, glowing electrical arcs flare)
    setTimeout(() => {
      setCountdown(2);
      playCountdownBeep(750);
    }, 900);

    // Phase 3: Countdown 1 → MAXIMUM CHARGE & CRITICAL TENSION
    setTimeout(() => {
      setCountdown(1);
      playCountdownBeep(900);
    }, 1800);

    // Phase 4: BLAST MOMENT & SELECTION LOCK-IN
    setTimeout(() => {
      const now = performance.now();
      setBlastTriggerTime(now);
      playQuantumBlastSound();
      setCountdown(null);
      setShuffling(false);
      setRevealedProblem(assignedCode);

      // Micro-delay for celebratory reveal chime & particle dispersion
      setTimeout(() => {
        playRevealChime();
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#38bdf8', '#8b5cf6', '#10b981', '#f59e0b']
        });
      }, 150);
    }, 2700);
  };

  return (
    <div className="relative w-full rounded-3xl border border-cyan-500/30 bg-[#040813] overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.15)] flex flex-col items-center">
      {/* Header Info Banner */}
      <div className="w-full px-6 py-5 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>3D QUANTUM DISCOVERY BOWL</span>
            {isRevealed && !isClaimed && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">
            AI DISCOVERY CHAMBER • 5 QUANTUM ARTIFACTS IN HARMONIC SUSPENSION
          </p>
        </div>

        <button
          onClick={() => setReducedMotion(!reducedMotion)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 rounded-xl transition-colors hover:bg-cyan-900/50 font-mono"
          title="Toggle 3D View / 2D Fallback"
        >
          {reducedMotion ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{reducedMotion ? 'Enable 3D View' : '2D View Mode'}</span>
        </button>
      </div>

      {/* Main 3D Canvas / 2D Fallback Area */}
      <div className="relative w-full h-[460px] sm:h-[530px] flex items-center justify-center bg-[#02050f]">
        {/* Cinematic Countdown Overlay with Stage Indicators */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md pointer-events-none animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center">
              <span className="text-8xl sm:text-9xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_0_60px_rgba(6,182,212,1)] animate-pulse">
                {countdown}
              </span>
              <div className="absolute -inset-8 border border-cyan-400/40 rounded-full animate-ping opacity-30" />
            </div>

            <div className="flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 font-mono text-xs text-cyan-300 tracking-[0.25em] uppercase">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              <span>
                {countdown === 3 && 'STAGE 1: GRAVITATIONAL ENERGY GATHER'}
                {countdown === 2 && 'STAGE 2: QUANTUM CORE CHARGING'}
                {countdown === 1 && 'STAGE 3: CRITICAL BLAST CONVERGENCE'}
              </span>
            </div>
          </div>
        )}

        {/* Locked Overlay Before Reveal */}
        {!isRevealed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md px-4 text-center">
            <div className="p-4 rounded-full bg-slate-900 border border-cyan-500/30 mb-4 shadow-xl">
              <Lock className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold font-display tracking-wider text-white uppercase mb-2">
              DISCOVERY BOWL SEALED
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-mono">
              The 3D Quantum Discovery Bowl is currently sealed by Admin. Once unlocked, activate the chamber to extract your challenge.
            </p>
          </div>
        )}

        {reducedMotion ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#040711]">
            <div className="relative w-72 h-56 rounded-3xl border-2 border-cyan-500/50 bg-cyan-950/20 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
              {isClaimed || revealedProblem ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="font-mono text-lg font-bold text-white">{revealedProblem}</span>
                  <span className="text-[10px] text-emerald-400 font-mono mt-1">ASSIGNED & LOCKED</span>
                </>
              ) : shuffling ? (
                <Shuffle className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
              ) : (
                <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse mb-2" />
              )}
              <span className="text-xs font-mono text-slate-300 mt-2">QUANTUM DISCOVERY BOWL</span>
            </div>
          </div>
        ) : (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center text-cyan-400 font-mono text-xs animate-pulse">
              INITIALIZING 3D DISCOVERY BOWL...
            </div>
          }>
            <Canvas
              camera={{ position: [0, 1.8, 4.4], fov: 41 }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              {/* Balanced Cinematic Lighting Hierarchy */}
              <ambientLight intensity={1.1} />
              <pointLight position={[4, 5.5, 4]} intensity={3.5} color="#38bdf8" />
              <pointLight position={[-4, -3, -3]} intensity={2.0} color="#8b5cf6" />
              <pointLight position={[0, 0.05, 0]} intensity={2.2} color="#22d3ee" distance={3.5} />
              <directionalLight position={[0, 6.5, 3]} intensity={1.8} />

              {/* 0. Cinematic Camera Rig for gentle blast kick & smooth recovery */}
              <CameraRig blastTime={blastTriggerTime} />

              {/* 1. HOLOGRAPHIC HALO (Energy-Backdrop behind Bowl) */}
              <HoveringHolographicHalo isShuffling={shuffling} isRevealed={isRevealed} />

              {/* 2. PREMIUM 3D DISCOVERY BOWL (Hero Object) */}
              <ProportionalDiscoveryBowl
                isShuffling={shuffling}
                isRevealed={isRevealed}
                blastTime={blastTriggerTime}
              />

              {/* 3. EXACTLY FIVE MAIN FLOATING AI OBJECTS INSIDE */}
              <FiveFloatingObjects
                isShuffling={shuffling}
                isRevealed={isRevealed}
                countdown={countdown}
                blastTime={blastTriggerTime}
              />

              {/* 4. INTERIOR ATMOSPHERIC PARTICLES */}
              <InteriorAtmosphericParticles isShuffling={shuffling} isRevealed={isRevealed} />

              {/* 5. CENTRAL ENERGY CORE */}
              <EnergyCore
                isShuffling={shuffling}
                isRevealed={isRevealed}
                countdown={countdown}
                blastTime={blastTriggerTime}
              />

              {/* 6. QUANTUM BLAST & CHARGE EFFECT (Shockwaves, sparks, electrical arcs) */}
              <QuantumBlastEffect
                blastTime={blastTriggerTime}
                isShuffling={shuffling}
                countdown={countdown}
              />

              {/* 7. 5 SMALL FLOATING ENERGY CRYSTALS */}
              <FloatingEnergyCrystals isShuffling={shuffling} isRevealed={isRevealed} />

              {/* 8. SHORT BROKEN ENERGY ARCS */}
              <ShortEnergyArcs isShuffling={shuffling} isRevealed={isRevealed} />

              {/* 9. UNDER-BOWL PEDESTAL GROUND ENERGY FIELD */}
              <UnderBowlEnergyField isShuffling={shuffling} isRevealed={isRevealed} />

              {/* 10. GRAVITY-FIELD PARTICLES */}
              <GravityFieldParticles isShuffling={shuffling} isRevealed={isRevealed} />

              {/* 11. SUBTLE POST-PROCESSING BLOOM SHADER */}
              <EffectComposer multisampling={4}>
                <Bloom
                  luminanceThreshold={0.35}
                  luminanceSmoothing={0.85}
                  intensity={isRevealed ? 0.8 : 0.45}
                  mipmapBlur
                />
              </EffectComposer>

              {/* Orbit Controls with elevated 3/4 perspective into the bowl */}
              <OrbitControls
                enablePan={false}
                enableZoom={false}
                minPolarAngle={Math.PI / 4.5}
                maxPolarAngle={Math.PI / 1.85}
              />
            </Canvas>
          </Suspense>
        )}
      </div>

      {/* Action Controller Footer */}
      <div className="w-full px-6 py-5 border-t border-cyan-500/20 bg-slate-950/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono">
            <span className="text-slate-400">CHAMBER STATUS: </span>
            <span className={`font-bold tracking-wider ${
              isClaimed
                ? 'text-emerald-400'
                : isRevealed
                ? 'text-cyan-400'
                : 'text-slate-500'
            }`}>
              {isClaimed
                ? 'CHALLENGE LOCKED & ASSIGNED'
                : isRevealed
                ? 'READY FOR QUANTUM DISCOVERY'
                : 'BOWL SEALED'}
            </span>
          </div>
        </div>

        {/* Discovery Button */}
        {isClaimed || revealedProblem ? (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-bold shadow-lg shadow-emerald-950/40 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>ASSIGNED CHALLENGE: {revealedProblem}</span>
          </div>
        ) : (
          <button
            onClick={handleStartShuffle}
            disabled={!isRevealed || shuffling || disabled}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold font-display uppercase tracking-wider transition-all shadow-lg ${
              !isRevealed || disabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : shuffling
                ? 'bg-cyan-700 text-cyan-200 cursor-wait animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Shuffle className={`w-4 h-4 ${shuffling ? 'animate-spin' : ''}`} />
            <span>{shuffling ? 'QUANTUM BLAST SHUFFLING...' : 'SHUFFLE & DISCOVER'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
