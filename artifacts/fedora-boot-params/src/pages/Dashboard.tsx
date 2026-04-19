import { useState } from "react";
import { useListParameters, useGetStats, useListCategories } from "@workspace/api-client-react";
import { SidebarFilter } from "@/components/SidebarFilter";
import { GraphicsModeToggle } from "@/components/GraphicsModeToggle";
import { ParameterCard } from "@/components/ParameterCard";
import { ParameterDetailDrawer } from "@/components/ParameterDetailDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Shield, ShieldAlert, TerminalSquare } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from "recharts";

const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

export default function Dashboard() {
  const [graphicsMode, setGraphicsMode] = useState<"hybrid" | "dgpu">("hybrid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [selectedParamId, setSelectedParamId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, isFetching: statsFetching } = useGetStats();
  const { data: parameters, isLoading: paramsLoading, isFetching: paramsFetching } = useListParameters({
    graphicsMode,
    category: category || undefined,
    search: search || undefined,
    riskLevel: riskLevel || undefined,
  });
  
  const loadingParams = paramsLoading || paramsFetching;
  const loadingStats = statsLoading || statsFetching;

  const chartData = stats?.categoryCounts || [];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <div className="w-80 shrink-0 hidden md:block">
        <SidebarFilter 
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          riskLevel={riskLevel}
          setRiskLevel={setRiskLevel}
          totalCount={parameters?.length || 0}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-border bg-card/30">
          <GraphicsModeToggle mode={graphicsMode} setMode={setGraphicsMode} />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Configs" 
              value={stats?.totalParameters} 
              icon={<TerminalSquare className="w-4 h-4 text-muted-foreground" />}
              loading={loadingStats}
              valueColor="#0079F2"
            />
            <StatCard 
              title="Safe Parameters" 
              value={stats?.riskCounts.safe} 
              icon={<ShieldCheck className="w-4 h-4 text-green-500" />}
              loading={loadingStats}
              valueColor="#22c55e"
            />
            <StatCard 
              title="Moderate Risk" 
              value={stats?.riskCounts.moderate} 
              icon={<Shield className="w-4 h-4 text-yellow-500" />}
              loading={loadingStats}
              valueColor="#eab308"
            />
            <StatCard 
              title="Advanced / Danger" 
              value={stats?.riskCounts.advanced} 
              icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
              loading={loadingStats}
              valueColor="#ef4444"
            />
          </div>

          {/* Chart */}
          <Card className="border-border">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="w-full h-[180px]" />
              ) : (
                <ResponsiveContainer width="100%" height={180} debounce={0}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} width={120} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#0079F2' }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS.blue} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Parameters List */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm font-bold tracking-widest text-muted-foreground uppercase border-b border-border pb-2">
              Configuration Parameters
            </h3>
            
            {loadingParams ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
              </div>
            ) : parameters && parameters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {parameters.map(param => (
                  <ParameterCard 
                    key={param.id} 
                    parameter={param} 
                    activeMode={graphicsMode} 
                    onClick={() => setSelectedParamId(param.id)} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg bg-card/30">
                <TerminalSquare className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-lg font-mono font-semibold mb-2">No Parameters Found</h2>
                <p className="text-sm font-mono text-muted-foreground">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ParameterDetailDrawer 
        parameterId={selectedParamId} 
        onClose={() => setSelectedParamId(null)} 
      />
    </div>
  );
}

function StatCard({ title, value, icon, loading, valueColor }: { title: string, value?: number, icon: React.ReactNode, loading: boolean, valueColor: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold font-mono" style={{ color: valueColor }}>{value || 0}</p>
          )}
        </div>
        <div className="bg-muted p-2 rounded-full">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
