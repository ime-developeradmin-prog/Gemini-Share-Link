import { Cpu, MonitorDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface GraphicsModeToggleProps {
  mode: "hybrid" | "dgpu";
  setMode: (mode: "hybrid" | "dgpu") => void;
}

export function GraphicsModeToggle({ mode, setMode }: GraphicsModeToggleProps) {
  return (
    <div className="bg-card border border-border p-2 rounded-lg flex items-center justify-between shadow-sm">
      <div className="flex gap-2 w-full">
        <button
          onClick={() => setMode("hybrid")}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-md transition-all duration-200 border-2 font-mono relative overflow-hidden",
            mode === "hybrid" 
              ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(0,255,0,0.1)]" 
              : "bg-background border-transparent text-muted-foreground hover:bg-muted/50"
          )}
        >
          {mode === "hybrid" && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          <Cpu className="w-6 h-6 mb-2" />
          <span className="font-bold tracking-wider text-sm">HYBRID MODE</span>
          <span className="text-[10px] opacity-70 mt-1 uppercase">Intel + NVIDIA PRIME</span>
        </button>

        <button
          onClick={() => setMode("dgpu")}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-md transition-all duration-200 border-2 font-mono relative overflow-hidden",
            mode === "dgpu" 
              ? "bg-destructive/10 border-destructive text-destructive shadow-[0_0_15px_rgba(255,0,0,0.1)]" 
              : "bg-background border-transparent text-muted-foreground hover:bg-muted/50"
          )}
        >
          {mode === "dgpu" && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
          )}
          <MonitorDot className="w-6 h-6 mb-2" />
          <span className="font-bold tracking-wider text-sm">dGPU ONLY</span>
          <span className="text-[10px] opacity-70 mt-1 uppercase">Discrete GPU Forced</span>
        </button>
      </div>
    </div>
  );
}
