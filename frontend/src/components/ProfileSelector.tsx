import { useEffect, useState } from 'react'
import { Printer, Package } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getMaterials, getPrinters } from '../api/client'
import './ProfileSelector.css'

export default function ProfileSelector() {
  const { selectedMaterial, selectedPrinter, setSelectedMaterial, setSelectedPrinter } = useStore()
  const [materials, setMaterials] = useState<any[]>([])
  const [printers, setPrinters] = useState<any[]>([])

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const [materialsData, printersData] = await Promise.all([
        getMaterials(),
        getPrinters(),
      ])

      setMaterials(materialsData.materials)
      setPrinters(printersData.printers)

      // Set defaults
      if (materialsData.materials.length > 0 && !selectedMaterial) {
        setSelectedMaterial(materialsData.materials[0])
      }
      if (printersData.printers.length > 0 && !selectedPrinter) {
        setSelectedPrinter(printersData.printers[0])
      }
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  return (
    <div className="profile-selector">
      <div className="profile-group">
        <label className="label">
          <Package size={16} />
          مواد (Material)
        </label>
        <select
          className="select"
          value={selectedMaterial?.id || ''}
          onChange={(e) => {
            const material = materials.find(m => m.id === e.target.value)
            setSelectedMaterial(material)
          }}
        >
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name} ({material.type})
            </option>
          ))}
        </select>
      </div>

      <div className="profile-group">
        <label className="label">
          <Printer size={16} />
          پرینتر
        </label>
        <select
          className="select"
          value={selectedPrinter?.id || ''}
          onChange={(e) => {
            const printer = printers.find(p => p.id === e.target.value)
            setSelectedPrinter(printer)
          }}
        >
          {printers.map((printer) => (
            <option key={printer.id} value={printer.id}>
              {printer.name}
            </option>
          ))}
        </select>
      </div>

      {selectedMaterial && (
        <div className="profile-details">
          <div className="detail-item">
            <span>دمای پرینت:</span>
            <strong>{selectedMaterial.printTemperature}°C</strong>
          </div>
          <div className="detail-item">
            <span>دمای صفحه:</span>
            <strong>{selectedMaterial.bedTemperature}°C</strong>
          </div>
        </div>
      )}
    </div>
  )
}
