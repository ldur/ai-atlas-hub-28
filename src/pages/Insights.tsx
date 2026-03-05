import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { useI18n } from "@/lib/i18n";
import { BarChart3, Brain, Briefcase, Clock, ShieldCheck } from "lucide-react";

const COLORS = [
  "hsl(230, 65%, 55%)", "hsl(250, 55%, 60%)", "hsl(162, 63%, 45%)",
  "hsl(38, 92%, 55%)", "hsl(340, 65%, 55%)", "hsl(200, 70%, 52%)",
  "hsl(280, 55%, 58%)", "hsl(170, 55%, 48%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-medium text-popover-foreground">{label || payload[0]?.name}</p>
      <p className="text-sm font-bold text-primary tabular-nums">{payload[0]?.value}</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-medium text-popover-foreground">{payload[0]?.name}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: payload[0]?.payload?.fill }}>{payload[0]?.value}</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function countArray(submissions: any[], field: string): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  submissions.forEach((s) => {
    const arr = s[field] || [];
    arr.forEach((v: string) => {
      counts[v] = (counts[v] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function countField(submissions: any[], field: string): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  submissions.forEach((s) => {
    const v = s[field];
    if (v) counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

const Insights = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    supabase.from("submissions").select("*").then(({ data }) => {
      setSubmissions(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  const toolsData = countArray(submissions, "tools_used").slice(0, 10);
  const modelsData = countArray(submissions, "models_used").slice(0, 10);
  const useCasesData = countArray(submissions, "use_cases");
  const timeSavedData = countField(submissions, "time_saved_range");
  const sensitivityData = countField(submissions, "data_sensitivity");

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("insights.title")}</h1>
        <p className="text-muted-foreground">{t("insights.subtitle", { count: submissions.length })}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Tools */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t("insights.most_used_tools")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolsData} layout="vertical" margin={{ left: 80, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={75} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                <defs>
                  <linearGradient id="toolGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(230, 65%, 55%)" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="hsl(250, 55%, 60%)" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#toolGrad)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Models */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Brain className="h-4 w-4 text-accent" />
            <CardTitle className="text-base">{t("insights.most_used_models")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelsData} layout="vertical" margin={{ left: 100, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                <defs>
                  <linearGradient id="modelGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(250, 55%, 58%)" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="hsl(280, 55%, 58%)" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#modelGrad)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Briefcase className="h-4 w-4 text-success" />
            <CardTitle className="text-base">{t("insights.use_cases")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={useCasesData} layout="vertical" margin={{ left: 100, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                <defs>
                  <linearGradient id="useCaseGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(162, 63%, 40%)" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="hsl(170, 55%, 48%)" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#useCaseGrad)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Saved */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Clock className="h-4 w-4 text-warning" />
            <CardTitle className="text-base">{t("insights.time_saved")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={timeSavedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} strokeWidth={2} stroke="hsl(var(--card))" labelLine={false} label={renderCustomLabel}>
                  {timeSavedData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Data Risk */}
        <Card className="overflow-hidden border-border/60 shadow-sm md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <ShieldCheck className="h-4 w-4 text-destructive" />
            <CardTitle className="text-base">{t("insights.data_risk")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sensitivityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} strokeWidth={2} stroke="hsl(var(--card))" labelLine={false} label={renderCustomLabel}>
                  {sensitivityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
