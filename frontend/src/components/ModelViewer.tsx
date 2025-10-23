import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stage, Grid, PerspectiveCamera, Environment } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { Eye, EyeOff, Box, Maximize2 } from 'lucide-react'
import './ModelViewer.css'

function STLModel({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useLoader(STLLoader, url)

  useEffect(() => {
    if (geometry && meshRef.current) {
      // Center the geometry
      geometry.computeBoundingBox()
      const boundingBox = geometry.boundingBox
      if (boundingBox) {
        const center = new THREE.Vector3()
        boundingBox.getCenter(center)
        geometry.translate(-center.x, -center.y, -center.z)
      }

      // Compute normals for proper lighting
      geometry.computeVertexNormals()
    }
  }, [geometry])

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#3b82f6"
        roughness={0.3}
        metalness={0.5}
      />
    </mesh>
  )
}

function WireframeModel({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useLoader(STLLoader, url)

  useEffect(() => {
    if (geometry && meshRef.current) {
      geometry.computeBoundingBox()
      const boundingBox = geometry.boundingBox
      if (boundingBox) {
        const center = new THREE.Vector3()
        boundingBox.getCenter(center)
        geometry.translate(-center.x, -center.y, -center.z)
      }
    }
  }, [geometry])

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color="#3b82f6"
        wireframe={true}
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  )
}

function FallbackBox() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  )
}

function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>در حال بارگذاری مدل...</p>
    </div>
  )
}

export default function ModelViewer() {
  const { uploadedFile, modelAnalysis } = useStore()
  const [viewMode, setViewMode] = useState<'solid' | 'wireframe'>('solid')
  const [showGrid, setShowGrid] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)

  // Construct full URL for the model
  const modelUrl = uploadedFile
    ? `${window.location.origin}${uploadedFile.path}`
    : null

  const isSTL = uploadedFile?.originalName.toLowerCase().endsWith('.stl')

  return (
    <div className="model-viewer">
      <div className="viewer-controls">
        <div className="control-group">
          <button
            className={`control-btn ${viewMode === 'solid' ? 'active' : ''}`}
            onClick={() => setViewMode('solid')}
            title="نمایش Solid"
          >
            <Box size={18} />
          </button>
          <button
            className={`control-btn ${viewMode === 'wireframe' ? 'active' : ''}`}
            onClick={() => setViewMode('wireframe')}
            title="نمایش Wireframe"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        <div className="control-group">
          <button
            className={`control-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="نمایش Grid"
          >
            {showGrid ? <Eye size={18} /> : <EyeOff size={18} />}
            Grid
          </button>
        </div>

        <div className="control-group">
          <button
            className={`control-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="چرخش خودکار"
          >
            🔄 Auto Rotate
          </button>
        </div>
      </div>

      <div className="canvas-container">
        <Canvas camera={{ position: [100, 100, 100], fov: 50 }}>
          <PerspectiveCamera makeDefault position={[100, 100, 100]} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />

          <Suspense fallback={null}>
            {modelUrl && isSTL ? (
              <Stage environment="city" intensity={0.6}>
                {viewMode === 'solid' ? (
                  <STLModel url={modelUrl} />
                ) : (
                  <WireframeModel url={modelUrl} />
                )}
              </Stage>
            ) : (
              <Stage environment="city" intensity={0.6}>
                <FallbackBox />
              </Stage>
            )}
          </Suspense>

          {showGrid && (
            <Grid
              infiniteGrid
              fadeDistance={300}
              fadeStrength={5}
              cellSize={10}
              sectionSize={50}
            />
          )}

          <OrbitControls
            makeDefault
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enableDamping
            dampingFactor={0.05}
          />

          <Environment preset="city" />
        </Canvas>

        {!uploadedFile && (
          <div className="no-model-overlay">
            <Box size={64} color="#9ca3af" />
            <p>فایلی آپلود نشده است</p>
          </div>
        )}
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
              {modelAnalysis.boundingBox.x.toFixed(1)} × {modelAnalysis.boundingBox.y.toFixed(1)} × {modelAnalysis.boundingBox.z.toFixed(1)} mm
            </strong>
          </div>
          <div className="info-row">
            <span>سطح:</span>
            <strong>{modelAnalysis.surfaceArea.toFixed(2)} mm²</strong>
          </div>
          {modelAnalysis.overhangs && modelAnalysis.overhangs.length > 0 && (
            <div className="info-row">
              <span>نیاز به ساپورت:</span>
              <span className="badge badge-warning">بله</span>
            </div>
          )}
          {modelAnalysis.thinWalls && (
            <div className="info-row">
              <span>دیوارهای نازک:</span>
              <span className="badge badge-warning">شناسایی شد</span>
            </div>
          )}
          {modelAnalysis.bridging && (
            <div className="info-row">
              <span>Bridging:</span>
              <span className="badge badge-warning">نیاز دارد</span>
            </div>
          )}
        </div>
      )}

      <div className="viewer-hints">
        <p>🖱️ کلیک چپ: چرخش | میانی: حرکت | اسکرول: زوم</p>
      </div>
    </div>
  )
}
