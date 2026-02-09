import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { irisService } from '@renderer/services/Iris-voice-ai'

const CustomParticleSphere = ({ count = 5000 }) => {
  const mesh = useRef<THREE.Points>(null)

  const dataArray = useMemo(() => new Uint8Array(128), [])

  // 1. Generate Particles & Store Original Positions
  const { positions, originalPositions, spreadFactors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const orig = new Float32Array(count * 3)
    const spread = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2 - 1
      const y = Math.random() * 2 - 1
      const z = Math.random() * 2 - 1

      const vector = new THREE.Vector3(x, y, z)
      vector.normalize().multiplyScalar(2) // Radius 2 (Circumference)

      // Set current position
      pos[i * 3] = vector.x
      pos[i * 3 + 1] = vector.y
      pos[i * 3 + 2] = vector.z

      // Save original position for "snap back"
      orig[i * 3] = vector.x
      orig[i * 3 + 1] = vector.y
      orig[i * 3 + 2] = vector.z

      // Random factor: Some particles spread far, some stay close
      spread[i] = Math.random()
    }
    return { positions: pos, originalPositions: orig, spreadFactors: spread }
  }, [count])

  useFrame((state, delta) => {
    if (!state.clock.running || !mesh.current) return

    // Rotation
    mesh.current.rotation.y += delta * 0.15
    mesh.current.rotation.z += delta * 0.05

    // Audio Analysis
    let volume = 0
    if (irisService.analyser) {
      irisService.analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b) / dataArray.length
      volume = avg / 128
    }

    // Color Logic (Preserved)
    const color = new THREE.Color('#33db12').lerp(new THREE.Color('#FFFFFF'), volume)
    ;(mesh.current.material as THREE.PointsMaterial).color = color

    // ⚡ SPREAD LOGIC (The Change)
    // Instead of scaling the whole mesh, we move points individually
    const currentPos = mesh.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2

      // "Spread" factor calculates how far this specific particle pushes out.
      // volume * spreadFactors[i] * 1.5 -> Makes it look like a fuzzy electric field
      const expansion = 1 + volume * spreadFactors[i] * 0.35

      currentPos[ix] = originalPositions[ix] * expansion
      currentPos[iy] = originalPositions[iy] * expansion
      currentPos[iz] = originalPositions[iz] * expansion
    }

    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          name="position"
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00F0FF"
        size={0.015} // Size kept exactly as requested
        transparent={true}
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

const Sphere = () => {
  return (
    <Canvas camera={{ position: [0, 0, 4.5] }}>
      <ambientLight intensity={0.5} />
      <CustomParticleSphere />
    </Canvas>
  )
}

export default Sphere
