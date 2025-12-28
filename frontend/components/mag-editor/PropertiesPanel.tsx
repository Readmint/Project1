"use client";

// import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditorElement } from "./MagEditor";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Type, Underline, Maximize, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
    element: EditorElement | null;
    onUpdate: (updates: Partial<EditorElement>) => void;
    onSetBackground?: () => void;
};

export function PropertiesPanel({ element, onUpdate, onSetBackground }: Props) {
    if (!element) {
        return (
            <div className="w-80 border-l bg-white p-6 flex items-center justify-center text-slate-400 text-sm">
                Select an element to edit properties
            </div>
        );
    }

    const updateStyle = (key: string, value: any) => {
        onUpdate({
            style: {
                ...element.style,
                [key]: value
            }
        });
    };

    return (
        <div className="w-80 border-l bg-white flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm uppercase text-slate-500">
                    {element.type} Properties
                </h3>
            </div>

            <div className="p-4 space-y-6">

                {/* Position & Size */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-slate-900">Dimensions</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-[10px] text-slate-500">X Position</Label>
                            <Input
                                type="number"
                                value={Math.round(element.x)}
                                onChange={(e) => onUpdate({ x: parseInt(e.target.value) })}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-slate-500">Y Position</Label>
                            <Input
                                type="number"
                                value={Math.round(element.y)}
                                onChange={(e) => onUpdate({ y: parseInt(e.target.value) })}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-slate-500">Width</Label>
                            <Input
                                type="number"
                                value={Math.round(element.width)}
                                onChange={(e) => onUpdate({ width: parseInt(e.target.value) })}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-slate-500">Height</Label>
                            <Input
                                type="number"
                                value={Math.round(element.height)}
                                onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Specific Actions */}
                {element.type === "image" && (
                    <div className="pt-2 border-t">
                        <h4 className="text-xs font-semibold text-slate-900 mb-2">Actions</h4>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 text-xs h-8"
                            onClick={onSetBackground}
                        >
                            <Maximize className="h-3 w-3" /> Set as Background
                        </Button>
                    </div>
                )}

                {/* Typography (Text Only) */}
                {element.type === "text" && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-slate-900">Typography</h4>

                        <div>
                            <Label className="text-[10px] text-slate-500">Font Family</Label>
                            <select
                                className="h-8 w-full border rounded text-xs px-2 bg-white"
                                value={element.style.fontFamily as string || "Inter"}
                                onChange={(e) => updateStyle("fontFamily", e.target.value)}
                            >
                                <option value="Inter">Inter</option>
                                <option value="serif">Serif</option>
                                <option value="sans-serif">Sans Serif</option>
                                <option value="monospace">Monospace</option>
                                <option value="cursive">Cursive</option>
                                <option value="fantasy">Fantasy</option>
                            </select>
                        </div>

                        <div>
                            <Label className="text-[10px] text-slate-500">Font Size</Label>
                            <div className="flex gap-2 items-center">
                                <Type size={14} className="text-slate-400" />
                                <Input
                                    className="h-8"
                                    value={parseInt(element.style.fontSize?.toString() || "16")}
                                    onChange={(e) => updateStyle("fontSize", `${e.target.value}px`)}
                                    type="number"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-[10px] text-slate-500">Color</Label>
                            <div className="flex gap-2 items-center mt-1">
                                <div className="relative overflow-hidden h-8 w-8 rounded border">
                                    <input
                                        type="color"
                                        className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] cursor-pointer p-0 border-0"
                                        value={element.style.color as string}
                                        onChange={(e) => updateStyle("color", e.target.value)}
                                    />
                                </div>
                                <Input
                                    className="h-8 font-mono text-xs"
                                    value={element.style.color as string}
                                    onChange={(e) => updateStyle("color", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg justify-between">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateStyle("fontWeight", element.style.fontWeight === 'bold' ? 'normal' : 'bold')}><Bold size={14} /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateStyle("fontStyle", element.style.fontStyle === 'italic' ? 'normal' : 'italic')}><Italic size={14} /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateStyle("textDecoration", element.style.textDecoration === 'underline' ? 'none' : 'underline')}><Underline size={14} /></Button>
                            <div className="w-px h-4 bg-slate-300 my-auto" />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateStyle("textAlign", "left")}><AlignLeft size={14} /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateStyle("textAlign", "center")}><AlignCenter size={14} /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => updateStyle("textAlign", "right")}><AlignRight size={14} /></Button>
                        </div>

                    </div>
                )}

                {/* Appearance */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-slate-900">Appearance</h4>
                    <div>
                        <Label className="text-[10px] text-slate-500">Opacity</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="range" min="0" max="1" step="0.1"
                                className="h-8"
                                onChange={(e) => updateStyle("opacity", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
