import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stage, Grid } from '@react-three/drei'
import { useStore } from '../store/useStore'
import './ModelViewer.css'

function RotatingBox() {
  const meshRef = useRef<any>()

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  )
}

export default function ModelViewer() {
  const { uploadedFile, modelAnalysis } = useStore()

  return (
    <div className="model-viewer">
      <div className="canvas-container">
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <Stage environment="city" intensity={0.6}>
            <RotatingBox />
          </Stage>
          <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />
          <OrbitControls makeDefault />
        </Canvas>
      </div>

      {modelAnalysis && (
        <div className="model-info">
          <div className="info-row">
            <span>حجم:</span>
            <strong>{modelAnalysis.volume.toFixed(2)} mm³</strong>
          </div>
          <div className="info-row">
            <span>ابعاد:</span>
            <strong>
              {modelAnalysis.boundingBox.x} × {modelAnalysis.boundingBox.y} × {modelAnalysis.boundingBox.z} mm
            </strong>
          </div>
          <div className="info-row">
            <span>سطح:</span>
            <strong>{modelAnalysis.surfaceArea.toFixed(2)} mm²</strong>
          </div>
          {modelAnalysis.overhangs.length > 0 && (
            <div className="info-row">
              <span>نیاز به ساپورت:</span>
              <span className="badge badge-warning">بله</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
