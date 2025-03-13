import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Text3D, useTexture, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// Casino chip component
function CasinoChip(props: any) {
  const ref = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    ref.current.rotation.x += 0.01;
    ref.current.rotation.y += 0.01;
  });
  
  return (
    <Float
      speed={1.5} 
      rotationIntensity={1.5} 
      floatIntensity={2}
    >
      <mesh
        {...props}
        ref={ref}
        scale={[0.7, 0.1, 0.7]}
        castShadow
      >
        <cylinderGeometry args={[1, 1, 1, 32]} />
        <meshStandardMaterial color={props.color || "#1876d1"} metalness={0.5} roughness={0.2} />
      </mesh>
    </Float>
  );
}

// Dice component
function Dice(props: any) {
  const ref = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    ref.current.rotation.x += 0.01;
    ref.current.rotation.y += 0.01;
    ref.current.rotation.z += 0.01;
  });
  
  return (
    <Float
      speed={2} 
      rotationIntensity={2} 
      floatIntensity={1.5}
    >
      <mesh
        {...props}
        ref={ref}
        scale={0.5}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.2} />
        <Dots position={[0, 0.51, 0]} rotation={[0, 0, 0]} /> {/* Top */}
        <Dots position={[0, -0.51, 0]} rotation={[0, 0, Math.PI]} /> {/* Bottom */}
        <Dots position={[0.51, 0, 0]} rotation={[0, Math.PI/2, 0]} /> {/* Right */}
        <Dots position={[-0.51, 0, 0]} rotation={[0, -Math.PI/2, 0]} /> {/* Left */}
        <Dots position={[0, 0, 0.51]} rotation={[Math.PI/2, 0, 0]} /> {/* Front */}
        <Dots position={[0, 0, -0.51]} rotation={[-Math.PI/2, 0, 0]} /> {/* Back */}
      </mesh>
    </Float>
  );
}

// Dice dots component
function Dots({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0.25, 0.25, 0]} scale={0.12}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.25, -0.25, 0]} scale={0.12}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </group>
  );
}

// Card component
function Card(props: any) {
  const ref = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    ref.current.rotation.y += 0.01;
  });
  
  return (
    <Float
      speed={1} 
      rotationIntensity={1} 
      floatIntensity={1}
    >
      <mesh
        {...props}
        ref={ref}
        scale={[0.6, 0.9, 0.01]}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f2f2f2" metalness={0.1} roughness={0.2} />
      </mesh>
    </Float>
  );
}

// Jackpot text component
function JackpotText(props: any) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    if (hovered) {
      gsap.to(ref.current.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.3 });
    } else {
      gsap.to(ref.current.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
    }
  }, [hovered]);
  
  useFrame((state) => {
    ref.current.rotation.y += 0.01;
  });
  
  return (
    <Float
      speed={1.5} 
      rotationIntensity={0.5} 
      floatIntensity={2}
    >
      <group
        ref={ref}
        {...props}
        scale={1}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <Text3D
          font={'/fonts/Inter_Bold.json'}
          size={0.5}
          height={0.1}
          curveSegments={12}
        >
          747
          <meshStandardMaterial color="#e4b400" metalness={0.8} roughness={0.1} />
        </Text3D>
      </group>
    </Float>
  );
}

export function CasinoElements3D() {
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        <CasinoChip position={[-3, 2, -2]} color="#e63946" />
        <CasinoChip position={[3, -2, -3]} color="#1876d1" />
        <CasinoChip position={[4, 1, -5]} color="#00b050" />
        
        <Dice position={[-2, -1, -3]} />
        <Dice position={[2, 3, -4]} />
        
        <Card position={[-4, -2, -5]} />
        <Card position={[5, 0, -6]} />
        
        <JackpotText position={[0, 0, -3]} />
      </Canvas>
    </div>
  );
}