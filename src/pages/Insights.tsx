import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useI18n } from "@/lib/i18n";

const COLORS = [
  "hsl(230, 65%, 52%)", "hsl(250, 55%, 58%)", "hsl(142, 72%, 39%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(200, 70%, 50%)",
  "hsl(280, 60%, 55%)", "hsl(170, 60%, 45%)",
];

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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("insights.title")}</h1>
        <p className="text-muted-foreground">{t("insights.subtitle", { count: submissions.length })}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t("insights.most_used_tools")}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolsData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={75} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(230, 65%, 52%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("insights.most_used_models")}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelsData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(250, 55%, 58%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("insights.use_cases")}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={useCasesData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(142, 72%, 39%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("insights.time_saved")}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={timeSavedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {timeSavedData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t("insights.data_risk")}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sensitivityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {sensitivityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
