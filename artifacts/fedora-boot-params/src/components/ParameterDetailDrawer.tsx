import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldAlert, ShieldCheck, Info } from "lucide-react";
import { useGetParameter } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface ParameterDetailDrawerProps {
  parameterId: string | null;
  onClose: () => void;
}

export function ParameterDetailDrawer({ parameterId, onClose }: ParameterDetailDrawerProps) {
  const { data: param, isLoading } = useGetParameter(parameterId || "", {
    query: { enabled: !!parameterId }
  });

  return (
    <Sheet open={!!parameterId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl border-l border-border bg-background p-0 flex flex-col">
        {isLoading ? (
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : param ? (
          <>
            <SheetHeader className="p-6 border-b border-border bg-card/50">
              <SheetTitle className="font-mono text-2xl text-primary break-all">
                {param.name}
              </SheetTitle>
              <div className="flex items-center gap-3 mt-4">
                <Badge variant="secondary" className="font-mono bg-muted text-muted-foreground uppercase">
                  {param.category}
                </Badge>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium uppercase border",
                  param.riskLevel === 'safe' && "text-green-500 border-green-500/20 bg-green-500/10",
                  param.riskLevel === 'moderate' && "text-yellow-500 border-yellow-500/20 bg-yellow-500/10",
                  param.riskLevel === 'advanced' && "text-red-500 border-red-500/20 bg-red-500/10"
                )}>
                  {param.riskLevel === 'safe' && <ShieldCheck className="w-3.5 h-3.5" />}
                  {param.riskLevel === 'moderate' && <Shield className="w-3.5 h-3.5" />}
                  {param.riskLevel === 'advanced' && <ShieldAlert className="w-3.5 h-3.5" />}
                  {param.riskLevel}
                </div>
              </div>
            </SheetHeader>
            
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8 pb-8">
                {/* Relevance Scores */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <MonitorIcon className="w-4 h-4" /> Relevance Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-6 bg-card border border-border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono font-medium">
                        <span className="text-primary">HYBRID</span>
                        <span>{param.relevanceHybrid}/100</span>
                      </div>
                      <Progress value={param.relevanceHybrid} className="h-2 bg-muted" indicatorClassName="bg-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono font-medium">
                        <span className="text-destructive">dGPU</span>
                        <span>{param.relevanceDgpu}/100</span>
                      </div>
                      <Progress value={param.relevanceDgpu} className="h-2 bg-muted" indicatorClassName="bg-destructive" />
                    </div>
                  </div>
                </div>

                {/* Technical Configuration */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" /> Parameter Syntax
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Recommended Value</div>
                      <div className="bg-black border border-border rounded p-3 font-mono text-sm text-green-400 overflow-x-auto">
                        {param.name}={param.recommendedValue}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Available Switches</div>
                        <div className="bg-muted border border-border rounded p-2.5 font-mono text-xs text-foreground">
                          {param.switches || "None"}
                        </div>
                      </div>
                      
                      {param.positionalParams && (
                        <div>
                          <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Positional Params</div>
                          <div className="bg-muted border border-border rounded p-2.5 font-mono text-xs text-foreground">
                            {param.positionalParams}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documentation */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <Info className="w-4 h-4" /> Documentation
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-card border border-border p-4 rounded-lg leading-relaxed text-foreground/90">
                    {param.verboseDescription}
                  </div>
                </div>

                {/* Tags */}
                {param.tags && param.tags.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-semibold text-muted-foreground uppercase">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {param.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="font-mono text-[10px] bg-background">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            Parameter not found.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MonitorIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
