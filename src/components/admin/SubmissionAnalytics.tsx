import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import {
  BarChart3, TrendingUp, AlertTriangle, Zap, ChevronDown, ChevronUp,
  CircleCheck, CircleX, FlaskConical, ArrowRight, Users, Clock, Shield
} from "lucide-react";

interface SubmissionAnalyticsProps {
  submissions: any[];
  tools: { id: string; name: string }[];
  models: { id: string; name: string }[];
  evaluations: { id: string; tool_id: string | null; model_id: string | null; decided_status: string }[];
  onCreateEvaluation: (type: "tool" | "model", entityId: string) => void;
}

interface RankedItem {
  name: string;
  count: number;
  percentage: number;
  entityId?: string;
  entityType?: "tool" | "model";
  status?: string;
  mustKeepMentions: number;
}

const statusIcons: Record<string, typeof CircleCheck> = {
  ALLOWED: CircleCheck,
  NOT_ALLOWED: CircleX,
  TRIAL: FlaskConical,
};

const statusColors: Record<string, string> = {
  ALLOWED: "text-emerald-600 dark:text-emerald-400",
  NOT_ALLOWED: "text-destructive",
  TRIAL: "text-amber-600 dark:text-amber-400",
};

export function SubmissionAnalytics({ submissions, tools, models, evaluations, onCreateEvaluation }: SubmissionAnalyticsProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);

  const analysis = useMemo(() => {
    const toolCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};
    const mustKeepCounts: Record<string, number> = {};
    const useCaseCounts: Record<string, number> = {};
    const timeSavedCounts: Record<string, number> = {};
    const sensitivityCounts: Record<string, number> = {};
    let painPointsList: string[] = [];
    const freetextTools: Record<string, number> = {};

    for (const s of submissions) {
      for (const tool of s.tools_used || []) {
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      }
      for (const model of s.models_used || []) {
        modelCounts[model] = (modelCounts[model] || 0) + 1;
      }
      for (const uc of s.use_cases || []) {
        useCaseCounts[uc] = (useCaseCounts[uc] || 0) + 1;
      }
      if (s.must_keep_tool) {
        const normalized = s.must_keep_tool.trim();
        mustKeepCounts[normalized] = (mustKeepCounts[normalized] || 0) + 1;
      }
      if (s.time_saved_range) {
        timeSavedCounts[s.time_saved_range] = (timeSavedCounts[s.time_saved_range] || 0) + 1;
      }
      if (s.data_sensitivity) {
        sensitivityCounts[s.data_sensitivity] = (sensitivityCounts[s.data_sensitivity] || 0) + 1;
      }
      if (s.pain_points) {
        painPointsList.push(s.pain_points);
      }
      if (s.tools_freetext) {
        s.tools_freetext.split(/[,;]/).map((t: string) => t.trim()).filter(Boolean).forEach((t: string) => {
          freetextTools[t] = (freetextTools[t] || 0) + 1;
        });
      }
    }

    const total = submissions.length;

    const rankedTools: RankedItem[] = Object.entries(toolCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => {
        const matchedTool = tools.find(t => t.name === name);
        const eval_ = matchedTool ? evaluations.find(e => e.tool_id === matchedTool.id) : undefined;
        return {
          name,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
          entityId: matchedTool?.id,
          entityType: "tool" as const,
          status: eval_?.decided_status,
          mustKeepMentions: mustKeepCounts[name] || 0,
        };
      });

    const rankedModels: RankedItem[] = Object.entries(modelCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => {
        const matchedModel = models.find(m => m.name === name);
        const eval_ = matchedModel ? evaluations.find(e => e.model_id === matchedModel.id) : undefined;
        return {
          name,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
          entityId: matchedModel?.id,
          entityType: "model" as const,
          status: eval_?.decided_status,
          mustKeepMentions: mustKeepCounts[name] || 0,
        };
      });

    const unclassifiedTools = rankedTools.filter(t => t.entityId && !t.status);
    const unclassifiedModels = rankedModels.filter(m => m.entityId && !m.status);

    const rankedFreetext = Object.entries(freetextTools)
      .sort(([, a], [, b]) => b - a)
      .filter(([name]) => !tools.some(t => t.name.toLowerCase() === name.toLowerCase()));

    const sensitiveRisk = sensitivityCounts["ja"] || 0;
    const sensitiveUnsure = sensitivityCounts["usikker"] || 0;

    return {
      total,
      rankedTools,
      rankedModels,
      unclassifiedTools,
      unclassifiedModels,
      useCaseCounts,
      timeSavedCounts,
      painPointsList,
      rankedFreetext,
      sensitiveRisk,
      sensitiveUnsure,
      mustKeepCounts,
    };
  }, [submissions, tools, models, evaluations]);

  if (submissions.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.02] to-transparent">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t("admin.analytics_title")}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" /> {analysis.total}
              </Badge>
              {(analysis.unclassifiedTools.length + analysis.unclassifiedModels.length) > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {analysis.unclassifiedTools.length + analysis.unclassifiedModels.length} {t("admin.unclassified")}
                </Badge>
              )}
            </div>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        <CardDescription>{t("admin.analytics_desc")}</CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Key metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              icon={<Users className="h-4 w-4" />}
              label={t("admin.total_responses")}
              value={analysis.total}
            />
            <MetricCard
              icon={<Clock className="h-4 w-4" />}
              label={t("admin.saves_5h")}
              value={analysis.timeSavedCounts["5+"] || 0}
              suffix={`/ ${analysis.total}`}
            />
            <MetricCard
              icon={<Shield className="h-4 w-4" />}
              label={t("admin.data_risk_count")}
              value={analysis.sensitiveRisk + analysis.sensitiveUnsure}
              variant={analysis.sensitiveRisk > 0 ? "danger" : "default"}
            />
            <MetricCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label={t("admin.needs_review")}
              value={analysis.unclassifiedTools.length + analysis.unclassifiedModels.length}
              variant={(analysis.unclassifiedTools.length + analysis.unclassifiedModels.length) > 0 ? "warning" : "default"}
            />
          </div>

          {/* Unclassified items needing action */}
          {(analysis.unclassifiedTools.length > 0 || analysis.unclassifiedModels.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 text-accent-foreground">
                <Zap className="h-4 w-4" /> {t("admin.action_needed")}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {[...analysis.unclassifiedTools, ...analysis.unclassifiedModels]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-2 rounded-lg border border-accent bg-accent/50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} {t("admin.mentions")}
                          {item.mustKeepMentions > 0 && (
                            <span className="text-accent-foreground"> · ★ {item.mustKeepMentions}× {t("admin.must_keep_short")}</span>
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1 text-xs"
                        onClick={() => item.entityId && item.entityType && onCreateEvaluation(item.entityType, item.entityId)}
                      >
                        {t("admin.classify")} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tool rankings */}
          <div className="grid gap-6 md:grid-cols-2">
            <RankingList
              title={t("admin.tool_ranking")}
              items={analysis.rankedTools.slice(0, 8)}
              onClassify={onCreateEvaluation}
            />
            <RankingList
              title={t("admin.model_ranking")}
              items={analysis.rankedModels.slice(0, 8)}
              onClassify={onCreateEvaluation}
            />
          </div>

          {/* Freetext tool suggestions */}
          {analysis.rankedFreetext.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" /> {t("admin.freetext_tools")}
              </h3>
              <p className="text-xs text-muted-foreground">{t("admin.freetext_desc")}</p>
              <div className="flex flex-wrap gap-2">
                {analysis.rankedFreetext.slice(0, 12).map(([name, count]) => (
                  <Badge key={name} variant="outline" className="gap-1 py-1">
                    {name} <span className="text-muted-foreground">×{count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Pain points summary */}
          {analysis.painPointsList.length > 0 && (
            <PainPointsSummary painPoints={analysis.painPointsList} />
          )}
        </CardContent>
      )}
    </Card>
  );
}

function MetricCard({ icon, label, value, suffix, variant = "default" }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  variant?: "default" | "danger" | "warning";
}) {
  const variantClasses = {
    default: "border-border",
    danger: "border-destructive/30 bg-destructive/5",
    warning: "border-accent bg-accent/50",
  };

  return (
    <div className={`rounded-lg border p-3 text-center ${variantClasses[variant]}`}>
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function RankingList({ title, items, onClassify }: {
  title: string;
  items: RankedItem[];
  onClassify: (type: "tool" | "model", entityId: string) => void;
}) {
  const { t } = useI18n();
  if (items.length === 0) return null;
  const maxCount = items[0]?.count || 1;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const StatusIcon = item.status ? statusIcons[item.status] : undefined;
          return (
            <div key={item.name} className="group flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4 text-right tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm truncate font-medium">{item.name}</span>
                  {StatusIcon && (
                    <Tooltip>
                      <TooltipTrigger>
                        <StatusIcon className={`h-3.5 w-3.5 ${statusColors[item.status!]}`} />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">{item.status}</TooltipContent>
                    </Tooltip>
                  )}
                  {item.mustKeepMentions > 0 && (
                    <span className="text-xs text-accent-foreground">★</span>
                  )}
                  {!item.status && item.entityId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => item.entityType && onClassify(item.entityType, item.entityId!)}
                    >
                      {t("admin.classify")}
                    </Button>
                  )}
                </div>
                <Progress value={(item.count / maxCount) * 100} className="h-1.5" />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                {Math.round(item.percentage)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PainPointsSummary({ painPoints }: { painPoints: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const { t } = useI18n();
  const display = showAll ? painPoints : painPoints.slice(0, 3);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" /> {t("admin.pain_points_title")}
      </h3>
      <div className="space-y-2">
        {display.map((p, i) => (
          <div key={i} className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2.5 italic border-l-2 border-muted-foreground/20">
            "{p}"
          </div>
        ))}
      </div>
      {painPoints.length > 3 && (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowAll(!showAll)}>
          {showAll ? t("admin.show_less") : t("admin.show_all", { count: painPoints.length })}
        </Button>
      )}
    </div>
  );
}
