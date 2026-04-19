import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { BootParameter } from "@workspace/api-client-react";

interface ParameterCardProps {
  parameter: BootParameter;
  activeMode: "hybrid" | "dgpu";
  onClick: () => void;
}

export function ParameterCard({ parameter, activeMode, onClick }: ParameterCardProps) {
  const relevance = activeMode === "hybrid" ? parameter.relevanceHybrid : parameter.relevanceDgpu;
  
  const riskColor = {
    safe: "text-green-500 border-green-500/20 bg-green-500/10",
    moderate: "text-yellow-500 border-yellow-500/20 bg-yellow-500/10",
    advanced: "text-red-500 border-red-500/20 bg-red-500/10"
  }[parameter.riskLevel];

  const progressColor = activeMode === "hybrid" ? "bg-primary" : "bg-destructive";

  return (
    <div 
      onClick={onClick}
      className="group bg-card border border-border hover:border-primary/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-mono text-base font-bold text-foreground truncate mr-4">
          {parameter.name}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase rounded-sm bg-muted/50 border-border">
            {parameter.category}
          </Badge>
          <Badge variant="outline" className={cn("font-mono text-[10px] uppercase rounded-sm", riskColor)}>
            {parameter.riskLevel}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-1.5 mt-4">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
          <span>Relevance Score</span>
          <span>{relevance}/100</span>
        </div>
        <Progress 
          value={relevance} 
          className="h-1.5 bg-muted" 
          indicatorClassName={progressColor} 
        />
      </div>
    </div>
  );
}
