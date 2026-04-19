import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useListCategories } from "@workspace/api-client-react";

interface SidebarFilterProps {
  search: string;
  setSearch: (s: string) => void;
  category: string;
  setCategory: (c: string) => void;
  riskLevel: string;
  setRiskLevel: (r: string) => void;
  totalCount: number;
}

export function SidebarFilter({
  search,
  setSearch,
  category,
  setCategory,
  riskLevel,
  setRiskLevel,
  totalCount
}: SidebarFilterProps) {
  const { data: categories, isLoading, isFetching } = useListCategories();

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-bold font-mono tracking-tight text-sidebar-foreground flex items-center gap-2">
          <span className="text-primary">&gt;_</span> PARAM_EXPLORER
        </h2>
        <div className="text-xs text-muted-foreground mt-1 font-mono">
          FEDORA 43 KDE RAWHIDE // ASUS TUF
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Search Parameters</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="e.g. i915.modeset..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-mono bg-background border-sidebar-border focus-visible:ring-primary text-sm"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex justify-between items-center">
            <span>Risk Level</span>
            <Badge variant="outline" className="font-mono text-[10px]">{riskLevel || "ALL"}</Badge>
          </Label>
          <RadioGroup value={riskLevel} onValueChange={setRiskLevel} className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="risk-all" />
              <Label htmlFor="risk-all" className="text-sm font-mono cursor-pointer flex-1">ALL LEVELS</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="safe" id="risk-safe" />
              <Label htmlFor="risk-safe" className="text-sm font-mono cursor-pointer flex items-center gap-2 flex-1">
                <ShieldCheck className="h-4 w-4 text-green-500" /> Safe
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="moderate" id="risk-moderate" />
              <Label htmlFor="risk-moderate" className="text-sm font-mono cursor-pointer flex items-center gap-2 flex-1">
                <Shield className="h-4 w-4 text-yellow-500" /> Moderate
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="advanced" id="risk-advanced" />
              <Label htmlFor="risk-advanced" className="text-sm font-mono cursor-pointer flex items-center gap-2 flex-1">
                <ShieldAlert className="h-4 w-4 text-red-500" /> Advanced
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex justify-between items-center">
            <span>Category</span>
            {isLoading || isFetching ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <Badge variant="outline" className="font-mono text-[10px]">{category || "ALL"}</Badge>
            )}
          </Label>
          
          {isLoading || isFetching ? (
            <div className="space-y-2 mt-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <RadioGroup value={category} onValueChange={setCategory} className="space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="cat-all" />
                <Label htmlFor="cat-all" className="text-sm font-mono cursor-pointer flex-1 flex justify-between">
                  <span>ALL CATEGORIES</span>
                </Label>
              </div>
              {categories?.map((cat) => (
                <div key={cat.name} className="flex items-center space-x-2">
                  <RadioGroupItem value={cat.name} id={`cat-${cat.name}`} />
                  <Label htmlFor={`cat-${cat.name}`} className="text-sm font-mono cursor-pointer flex-1 flex justify-between">
                    <span className="truncate max-w-[120px]">{cat.name}</span>
                    <span className="text-muted-foreground opacity-50">[{cat.count}]</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-sidebar-border bg-sidebar/50">
        <div className="flex flex-col items-center justify-center p-3 border border-sidebar-border/50 rounded bg-background">
          <div className="text-2xl font-bold font-mono text-primary">{totalCount}</div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">Parameters Found</div>
        </div>
      </div>
    </div>
  );
}
