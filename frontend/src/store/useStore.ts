import { create } from 'zustand'

interface SlicingSettings {
  layerHeight: number
  initialLayerHeight: number
  lineWidth: number
  wallThickness: number
  topBottomThickness: number
  infillDensity: number
  infillPattern: string
  infillLineWidth: number
  printSpeed: number
  infillSpeed: number
  wallSpeed: number
  topBottomSpeed: number
  travelSpeed: number
  initialLayerSpeed: number
  printingTemperature: number
  buildPlateTemperature: number
  initialLayerTemperature: number
  supportEnabled: boolean
  supportDensity: number
  supportPattern: string
  supportOverhangAngle: number
  fanSpeed: number
  initialLayerFanSpeed: number
  regularFanSpeedAtHeight: number
  retractionEnabled: boolean
  retractionDistance: number
  retractionSpeed: number
  material: string
  materialDiameter: number
  flowRate: number
}

interface UploadedFile {
  filename: string
  originalName: string
  size: number
  path: string
}

interface MaterialProfile {
  id: string
  name: string
  type: string
  printTemperature: number
  bedTemperature: number
}

interface PrinterProfile {
  id: string
  name: string
  buildVolumeX: number
  buildVolumeY: number
  buildVolumeZ: number
  nozzleDiameter: number
}

interface ModelAnalysis {
  volume: number
  surfaceArea: number
  boundingBox: {
    x: number
    y: number
    z: number
  }
  overhangs: Array<{ angle: number; area: number }>
  thinWalls: boolean
  bridging: boolean
}

interface Store {
  uploadedFile: UploadedFile | null
  slicingSettings: SlicingSettings | null
  selectedMaterial: MaterialProfile | null
  selectedPrinter: PrinterProfile | null
  modelAnalysis: ModelAnalysis | null
  isOptimizing: boolean

  setUploadedFile: (file: UploadedFile | null) => void
  setSlicingSettings: (settings: SlicingSettings | null) => void
  setSelectedMaterial: (material: MaterialProfile | null) => void
  setSelectedPrinter: (printer: PrinterProfile | null) => void
  setModelAnalysis: (analysis: ModelAnalysis | null) => void
  setIsOptimizing: (isOptimizing: boolean) => void
  updateSetting: (key: keyof SlicingSettings, value: any) => void
}

export const useStore = create<Store>((set) => ({
  uploadedFile: null,
  slicingSettings: null,
  selectedMaterial: null,
  selectedPrinter: null,
  modelAnalysis: null,
  isOptimizing: false,

  setUploadedFile: (file) => set({ uploadedFile: file }),
  setSlicingSettings: (settings) => set({ slicingSettings: settings }),
  setSelectedMaterial: (material) => set({ selectedMaterial: material }),
  setSelectedPrinter: (printer) => set({ selectedPrinter: printer }),
  setModelAnalysis: (analysis) => set({ modelAnalysis: analysis }),
  setIsOptimizing: (isOptimizing) => set({ isOptimizing }),

  updateSetting: (key, value) =>
    set((state) => ({
      slicingSettings: state.slicingSettings
        ? { ...state.slicingSettings, [key]: value }
        : null,
    })),
}))
