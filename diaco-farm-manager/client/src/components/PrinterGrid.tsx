import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Printer, PrinterStatus } from '../types';
import PrinterCard from './PrinterCard';

interface PrinterGridProps {
  printers: Printer[];
  printerStatuses: Record<string, PrinterStatus>;
  onUpdatePrinter: (id: string, updates: Partial<Printer>) => void;
  onDeletePrinter: (id: string) => void;
  onReorderPrinters: (printerIds: string[]) => void;
  onEditPrinter: (id: string) => void;
  onRefreshStatus: (id: string) => void;
}

interface SortablePrinterCardProps {
  printer: Printer;
  status: PrinterStatus | undefined;
  onUpdate: (id: string, updates: Partial<Printer>) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onRefresh: (id: string) => void;
}

function SortablePrinterCard({
  printer,
  status,
  onUpdate,
  onDelete,
  onEdit,
  onRefresh
}: SortablePrinterCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: printer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PrinterCard
        printer={printer}
        status={status}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onEdit={onEdit}
        onRefresh={onRefresh}
      />
    </div>
  );
}

export default function PrinterGrid({
  printers,
  printerStatuses,
  onUpdatePrinter,
  onDeletePrinter,
  onReorderPrinters,
  onEditPrinter,
  onRefreshStatus
}: PrinterGridProps) {
  const [items, setItems] = useState(printers.map(p => p.id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onReorderPrinters(newItems);
    }
  };

  // Update items when printers change
  if (printers.length !== items.length || printers.some(p => !items.includes(p.id))) {
    const newItems = printers.map(p => p.id);
    setItems(newItems);
  }

  if (printers.length === 0) {
    return (
      <div className="glass-dark rounded-xl p-12 text-center">
        <p className="text-white/70 text-lg mb-4">No printers configured</p>
        <p className="text-white/50 text-sm">
          Click the menu button in the header to add your first printer
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {items.map(id => {
            const printer = printers.find(p => p.id === id);
            if (!printer) return null;

            return (
              <SortablePrinterCard
                key={printer.id}
                printer={printer}
                status={printerStatuses[printer.id]}
                onUpdate={onUpdatePrinter}
                onDelete={onDeletePrinter}
                onEdit={onEditPrinter}
                onRefresh={onRefreshStatus}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
