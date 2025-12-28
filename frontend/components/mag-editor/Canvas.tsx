"use client";

import { motion, useDragControls } from "framer-motion";
import { EditorElement } from "./MagEditor";
import { useRef, useState, useEffect } from "react";
import { Trash2, Layers, ChevronUp, ChevronDown, Maximize, Move } from "lucide-react";

type CanvasProps = {
    elements: EditorElement[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<EditorElement>) => void;
    onDelete: (id: string) => void;
    onLayerChange: (id: string, dir: 'up' | 'down') => void;
    onSetBackground: (id: string) => void;
    onDoubleClick: (x: number, y: number) => void;
    scale: number;
    id?: string;
};

// A4 Dimensions in pixels (approx) at 96 DPI: 794 x 1123
// Let's use a standard scale
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

export function Canvas({ elements, selectedId, onSelect, onUpdate, onDelete, onLayerChange, onSetBackground, onDoubleClick, scale, id }: CanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

    // Close menu on click anywhere
    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener("click", closeMenu);
        return () => window.removeEventListener("click", closeMenu);
    }, []);

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ id, x: e.clientX, y: e.clientY });
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (e.target !== canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        // Calculate position relative to container, adjusted for scale
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        onDoubleClick(x, y);
    };

    return (
        <div
            id={id}
            ref={canvasRef}
            className="bg-white shadow-2xl transition-transform duration-200 ease-out origin-top relative"
            style={{
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                transform: `scale(${scale})`,
            }}
            onClick={(e) => {
                // Deselect if clicking blank area
                if (e.target === canvasRef.current) {
                    onSelect(null);
                }
            }}
            onDoubleClick={handleDoubleClick}
        >
            {/* Grid Pattern (Optional) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: "radial-gradient(#ccc 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}
            />

            {elements.map((el) => (
                <DraggableElement
                    key={el.id}
                    element={el}
                    isSelected={selectedId === el.id}
                    onSelect={() => onSelect(el.id)}
                    onUpdate={(updates) => onUpdate(el.id, updates)}
                    onContextMenu={(e) => handleContextMenu(e, el.id)}
                />
            ))}

            {contextMenu && (
                <div
                    className="fixed z-[100] bg-white border rounded shadow-lg w-48 py-1 text-sm text-slate-700"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2" onClick={() => onLayerChange(contextMenu.id, 'up')}>
                        <ChevronUp size={14} /> Bring Forward
                    </div>
                    <div className="px-3 py-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2" onClick={() => onLayerChange(contextMenu.id, 'down')}>
                        <ChevronDown size={14} /> Send Backward
                    </div>
                    {elements.find(e => e.id === contextMenu.id)?.type === 'image' && (
                        <div className="px-3 py-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2" onClick={() => onSetBackground(contextMenu.id)}>
                            <Maximize size={14} /> Set as Background
                        </div>
                    )}
                    <div className="border-t my-1" />
                    <div className="px-3 py-2 hover:bg-red-50 text-red-600 cursor-pointer flex items-center gap-2" onClick={() => onDelete(contextMenu.id)}>
                        <Trash2 size={14} /> Delete
                    </div>
                </div>
            )}
        </div>
    );
}

function DraggableElement({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onContextMenu
}: {
    element: EditorElement;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<EditorElement>) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}) {
    const [isResizing, setIsResizing] = useState(false);
    const dragControls = useDragControls();

    const handleResize = (e: React.PointerEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = element.width;
        const startHeight = element.height;

        const onPointerMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();

            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            if (direction === "se") {
                onUpdate({
                    width: Math.max(50, startWidth + deltaX),
                    height: Math.max(20, startHeight + deltaY)
                });
            } else if (direction === "sw") {
                onUpdate({ width: Math.max(50, startWidth - deltaX) });
            }
        };

        const onPointerUp = (upEvent: PointerEvent) => {
            upEvent.preventDefault();
            upEvent.stopPropagation();

            setIsResizing(false);
            target.releasePointerCapture(upEvent.pointerId);

            target.removeEventListener("pointermove", onPointerMove as any);
            target.removeEventListener("pointerup", onPointerUp as any);
        };

        target.addEventListener("pointermove", onPointerMove as any);
        target.addEventListener("pointerup", onPointerUp as any);
    };

    return (
        <motion.div
            drag={!isResizing} // Locked during resizing
            dragListener={false} // Disable default drag listener (fixes text selection issue)
            dragControls={dragControls} // Use explicit controls
            dragMomentum={false}
            initial={{ x: element.x, y: element.y }}
            // Sync state on drag end
            onDragEnd={(_, info) => {
                if (!isResizing) {
                    onUpdate({ x: element.x + info.offset.x, y: element.y + info.offset.y });
                }
            }}
            onContextMenu={onContextMenu}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                ...element.style,
                border: isSelected ? "2px solid #6366f1" : "1px dashed transparent",
                cursor: "default", // Default cursor, not move
                zIndex: element.style?.zIndex || (isSelected ? 10 : 1), // Respect background usage
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Move Handle - Only visible when selected */}
            {isSelected && (
                <div
                    className="absolute -top-8 left-0 p-1 bg-indigo-600 text-white rounded-t shadow-sm cursor-move flex items-center justify-center pointer-events-auto"
                    onPointerDown={(e) => dragControls.start(e)}
                    style={{ zIndex: 100 }}
                >
                    <Move size={14} />
                </div>
            )}

            {element.type === "text" && (
                <div
                    className="w-full h-full outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdate({ content: e.currentTarget.innerText })}
                    onPointerDown={(e) => e.stopPropagation()} // Allow text selection without dragging
                    style={{ width: '100%', height: '100%', cursor: 'text', overflow: 'hidden' }}
                >
                    {element.content}
                </div>
            )}

            {element.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={element.content} alt="" className="w-full h-full object-cover pointer-events-none" />
            )}

            {element.type === "shape" && (
                <div className="w-full h-full" style={{ backgroundColor: element.content }} />
            )}

            {/* Resize Handles - Interactive */}
            {isSelected && (
                <>
                    {/* Corners */}
                    {/* Top-Left */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-indigo-600 rounded-full cursor-nwse-resize z-50 pointer-events-auto" />

                    {/* Top-Right */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-indigo-600 rounded-full cursor-nesw-resize z-50 pointer-events-auto" />

                    {/* Bottom-Left */}
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-indigo-600 rounded-full cursor-nesw-resize z-50 pointer-events-auto" />

                    {/* Bottom-Right (Main Resizer) */}
                    <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-indigo-600 rounded-full cursor-nwse-resize z-50 pointer-events-auto"
                        onPointerDown={(e) => handleResize(e, "se")}
                    />
                </>
            )}
        </motion.div>
    );
}
