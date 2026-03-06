import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminAction, isAdmin } from "@/lib/adminAction";
import { useI18n } from "@/lib/i18n";
import { getAdminToken } from "@/lib/nickname";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Sparkles, Users, Coins, TrendingUp, Edit2, Loader2, DollarSign, Zap, Package, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type DisplayCurrency = "USD" | "NOK" | "EUR";

const EXCHANGE_RATES: Record<DisplayCurrency, number> = {
  USD: 1,
  NOK: 10.85,
  EUR: 0.92,
};

const CURRENCY_FORMATTERS: Record<DisplayCurrency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
  NOK: new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }),
  EUR: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }),
};

const CURRENCY_INT_FORMATTERS: Record<DisplayCurrency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  NOK: new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }),
  EUR: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
};

interface PricingConfig {
  id: string;
  tool_id: string | null;
  model_id: string | null;
  pricing_type: string;
  currency: string;
  tiers: any[];
  input_token_price: number | null;
  output_token_price: number | null;
  notes: string | null;
  ai_generated: boolean;
  last_fetched: string | null;
}

interface OrgParams {
  id: string;
  num_seats: number;
  monthly_api_calls: number;
  monthly_input_tokens: number;
  monthly_output_tokens: number;
  notes: string | null;
}

type ToolRow = { id: string; name: string; vendor: string | null; link: string | null; category: string | null };
type ModelRow = { id: string; name: string; provider: string | null; link: string | null };

function calculateMonthlyCost(config: PricingConfig | undefined, org: OrgParams, selectedTierIndex: number = 0): number {
  if (!config) return 0;
  const tierIdx = Math.min(selectedTierIndex, Math.max((config.tiers?.length || 1) - 1, 0));
  switch (config.pricing_type) {
    case "free":
      return 0;
    case "per_seat": {
      const tier = config.tiers?.[tierIdx];
      return tier ? (tier.price || 0) * org.num_seats : 0;
    }
    case "per_token": {
      const inputCost = ((org.monthly_input_tokens / 1_000_000) * (config.input_token_price || 0));
      const outputCost = ((org.monthly_output_tokens / 1_000_000) * (config.output_token_price || 0));
      return inputCost + outputCost;
    }
    case "flat": {
      const tier = config.tiers?.[tierIdx];
      return tier?.price || 0;
    }
    case "tiered": {
      const tier = config.tiers?.[tierIdx];
      if (!tier) return 0;
      if (tier.unit?.includes("seat")) return (tier.price || 0) * org.num_seats;
      return tier.price || 0;
    }
    case "usage_based": {
      const tier = config.tiers?.[tierIdx];
      return tier?.price || 0;
    }
    default:
      return 0;
  }
}

function costColor(cost: number): string {
  if (cost === 0) return "text-green-600 dark:text-green-400";
  if (cost < 50) return "text-blue-600 dark:text-blue-400";
  if (cost < 500) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function pricingBadgeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "free": return "secondary";
    case "per_seat": return "default";
    case "per_token": return "outline";
    default: return "default";
  }
}

export default function PriceCalculator() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const admin = isAdmin();
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("USD");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});
  const [editDialog, setEditDialog] = useState<{ open: boolean; config?: PricingConfig; toolId?: string; modelId?: string; itemName?: string }>({ open: false });
  const [editForm, setEditForm] = useState({ pricing_type: "flat", currency: "USD", tiers: "[]", input_token_price: "", output_token_price: "", notes: "" });

  const cx = (usdAmount: number) => usdAmount * EXCHANGE_RATES[displayCurrency];
  const fmtCost = (usdAmount: number) => CURRENCY_FORMATTERS[displayCurrency].format(cx(usdAmount));
  const fmtCostInt = (usdAmount: number) => CURRENCY_INT_FORMATTERS[displayCurrency].format(cx(usdAmount));
  const fmtUnit = (price: number, unit: string) => `${CURRENCY_FORMATTERS[displayCurrency].format(cx(price))}/${unit}`;

  // Fetch data
  const { data: tools } = useQuery({ queryKey: ["tools"], queryFn: async () => { const { data } = await supabase.from("tools").select("id, name, vendor, link, category"); return (data || []) as ToolRow[]; } });
  const { data: models } = useQuery({ queryKey: ["models"], queryFn: async () => { const { data } = await supabase.from("models").select("id, name, provider, link"); return (data || []) as ModelRow[]; } });
  const { data: pricingConfigs, refetch: refetchPricing } = useQuery({ queryKey: ["pricing_configs"], queryFn: async () => { const { data } = await supabase.from("pricing_configs").select("*"); return (data || []) as PricingConfig[]; } });
  const { data: orgParams, refetch: refetchOrg } = useQuery({ queryKey: ["org_usage_params"], queryFn: async () => { const { data } = await supabase.from("org_usage_params").select("*").limit(1).single(); return data as OrgParams | null; } });
  const { data: evaluations } = useQuery({ queryKey: ["evaluations"], queryFn: async () => { const { data } = await supabase.from("evaluations").select("tool_id, model_id, decided_status"); return data || []; } });

  const org: OrgParams = orgParams || { id: "", num_seats: 10, monthly_api_calls: 1000, monthly_input_tokens: 1000000, monthly_output_tokens: 500000, notes: "" };

  // Get evaluated items, filtered by status
  const filteredEvaluations = statusFilter === "all" 
    ? evaluations 
    : evaluations?.filter(e => e.decided_status === statusFilter);
  const evaluatedToolIds = new Set(filteredEvaluations?.filter(e => e.tool_id).map(e => e.tool_id!));
  const evaluatedModelIds = new Set(filteredEvaluations?.filter(e => e.model_id).map(e => e.model_id!));
  const evaluatedTools = tools?.filter(t => evaluatedToolIds.has(t.id)) || [];
  const evaluatedModels = models?.filter(m => evaluatedModelIds.has(m.id)) || [];

  // Get unique statuses for filter
  const allStatuses = [...new Set(evaluations?.map(e => e.decided_status) || [])];

  const getSelectedTier = (id: string) => selectedTiers[id] ?? 0;
  const setTierForItem = (id: string, tierIdx: number) => setSelectedTiers(prev => ({ ...prev, [id]: tierIdx }));

  const getPricing = (toolId?: string, modelId?: string) => pricingConfigs?.find(p => (toolId && p.tool_id === toolId) || (modelId && p.model_id === modelId));

  // Fetch pricing with AI
  const fetchPricingMutation = useMutation({
    mutationFn: async ({ name, type, vendor, link, tool_id, model_id }: any) => {
      setFetchingId(tool_id || model_id);
      const { data, error } = await supabase.functions.invoke("fetch-pricing", {
        body: { name, type, vendor, link, tool_id, model_id },
        headers: { "x-admin-token": getAdminToken() || "" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchPricing();
      toast({ title: t("common.saved"), description: "Prisinformasjon hentet med AI" });
      setFetchingId(null);
    },
    onError: (e: any) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
      setFetchingId(null);
    },
  });

  // Save org params
  const saveOrgParams = async (updates: Partial<OrgParams>) => {
    if (!org.id) return;
    try {
      await adminAction({ action: "update", table: "org_usage_params", id: org.id, payload: { ...updates, updated_at: new Date().toISOString() } });
      refetchOrg();
      toast({ title: t("common.saved") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  // Save edited pricing
  const saveEditedPricing = async () => {
    try {
      let tiersJson: any[];
      try { tiersJson = JSON.parse(editForm.tiers); } catch { tiersJson = []; }
      
      const payload = {
        pricing_type: editForm.pricing_type,
        currency: editForm.currency,
        tiers: tiersJson,
        input_token_price: editForm.input_token_price ? parseFloat(editForm.input_token_price) : null,
        output_token_price: editForm.output_token_price ? parseFloat(editForm.output_token_price) : null,
        notes: editForm.notes || null,
        ai_generated: false,
        tool_id: editDialog.toolId || null,
        model_id: editDialog.modelId || null,
        updated_at: new Date().toISOString(),
      };

      if (editDialog.config?.id) {
        await adminAction({ action: "update", table: "pricing_configs", id: editDialog.config.id, payload });
      } else {
        await adminAction({ action: "insert", table: "pricing_configs", payload });
      }
      refetchPricing();
      setEditDialog({ open: false });
      toast({ title: t("common.saved") });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const openEditDialog = (config: PricingConfig | undefined, toolId?: string, modelId?: string, itemName?: string) => {
    setEditForm({
      pricing_type: config?.pricing_type || "flat",
      currency: config?.currency || "USD",
      tiers: JSON.stringify(config?.tiers || [], null, 2),
      input_token_price: config?.input_token_price?.toString() || "",
      output_token_price: config?.output_token_price?.toString() || "",
      notes: config?.notes || "",
    });
    setEditDialog({ open: true, config, toolId, modelId, itemName });
  };

  // Calculate totals
  const toolCosts = evaluatedTools.map(t => ({ ...t, cost: calculateMonthlyCost(getPricing(t.id), org, getSelectedTier(t.id)) }));
  const modelCosts = evaluatedModels.map(m => ({ ...m, cost: calculateMonthlyCost(getPricing(undefined, m.id), org, getSelectedTier(m.id)) }));
  const totalToolCost = toolCosts.reduce((s, t) => s + t.cost, 0);
  const totalModelCost = modelCosts.reduce((s, m) => s + m.cost, 0);
  const totalMonthlyCost = totalToolCost + totalModelCost;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          {t("pricing.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("pricing.subtitle")}</p>
      </div>

      {/* Org Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            {t("pricing.org_params")}
          </CardTitle>
          <CardDescription>{t("pricing.org_params_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("pricing.seats")}</Label>
              <Input type="number" value={org.num_seats} onChange={e => admin && saveOrgParams({ num_seats: parseInt(e.target.value) || 0 })} disabled={!admin} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("pricing.api_calls")}</Label>
              <Input type="number" value={org.monthly_api_calls} onChange={e => admin && saveOrgParams({ monthly_api_calls: parseInt(e.target.value) || 0 })} disabled={!admin} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("pricing.input_tokens")}</Label>
              <Input type="number" value={org.monthly_input_tokens} onChange={e => admin && saveOrgParams({ monthly_input_tokens: parseInt(e.target.value) || 0 })} disabled={!admin} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("pricing.output_tokens")}</Label>
              <Input type="number" value={org.monthly_output_tokens} onChange={e => admin && saveOrgParams({ monthly_output_tokens: parseInt(e.target.value) || 0 })} disabled={!admin} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("pricing.display_currency")}</Label>
              <Select value={displayCurrency} onValueChange={v => setDisplayCurrency(v as DisplayCurrency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="NOK">NOK (kr)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {displayCurrency !== "USD" && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              {t("pricing.exchange_note")} (1 USD = {EXCHANGE_RATES[displayCurrency]} {displayCurrency})
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {(evaluatedTools.length > 0 || evaluatedModels.length > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t("pricing.summary")}
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status.all_statuses")}</SelectItem>
                  {allStatuses.map(s => (
                    <SelectItem key={s} value={s}>
                      {s === "ALLOWED" ? t("status.allowed") : s === "NOT_ALLOWED" ? t("status.not_allowed") : s === "TRIAL" ? t("status.trial") : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("pricing.tools_cost")}</p>
                <p className={`text-2xl font-bold ${costColor(totalToolCost)}`}>{fmtCost(totalToolCost)}</p>
                <p className="text-xs text-muted-foreground">/mnd</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("pricing.models_cost")}</p>
                <p className={`text-2xl font-bold ${costColor(totalModelCost)}`}>{fmtCost(totalModelCost)}</p>
                <p className="text-xs text-muted-foreground">/mnd</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("pricing.total")}</p>
                <p className={`text-3xl font-bold ${costColor(totalMonthlyCost)}`}>{fmtCost(totalMonthlyCost)}</p>
                <p className="text-xs text-muted-foreground">/mnd · {fmtCostInt(totalMonthlyCost * 12)}/år</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools Section */}
      {evaluatedTools.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" /> {t("common.tools")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {evaluatedTools.map(tool => {
              const config = getPricing(tool.id);
              const tierIdx = getSelectedTier(tool.id);
              const cost = calculateMonthlyCost(config, org, tierIdx);
              const hasTiers = config && config.tiers?.length > 1;
              return (
                <Card key={tool.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        <CardDescription className="text-xs">{tool.vendor || t("common.unknown")}</CardDescription>
                      </div>
                      {config && <Badge variant={pricingBadgeVariant(config.pricing_type)}>{config.pricing_type}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config ? (
                      <>
                        {hasTiers && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t("pricing.select_plan")}</Label>
                            <Select value={String(tierIdx)} onValueChange={v => setTierForItem(tool.id, parseInt(v))}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {config.tiers.map((tier: any, i: number) => (
                                  <SelectItem key={i} value={String(i)}>
                                    {tier.name} – {fmtUnit(tier.price || 0, tier.unit)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {!hasTiers && config.tiers?.length === 1 && (
                          <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{config.tiers[0].name}</span>
                            <span>{fmtUnit(config.tiers[0].price || 0, config.tiers[0].unit)}</span>
                          </div>
                        )}
                        {config.pricing_type === "per_token" && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>Input: ${config.input_token_price}/1M tokens</div>
                            <div>Output: ${config.output_token_price}/1M tokens</div>
                          </div>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t("pricing.monthly_cost")}</span>
                          <span className={`text-lg font-bold ${costColor(cost)}`}>{fmtCost(cost)}</span>
                        </div>
                        {config.notes && <p className="text-xs text-muted-foreground italic">{config.notes}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("pricing.no_pricing")}</p>
                    )}
                    {admin && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => fetchPricingMutation.mutate({ name: tool.name, type: "tool", vendor: tool.vendor, link: tool.link, tool_id: tool.id })} disabled={fetchingId === tool.id}>
                          {fetchingId === tool.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                          {t("pricing.fetch_ai")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(config, tool.id, undefined, tool.name)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Models Section */}
      {evaluatedModels.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" /> {t("common.models")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {evaluatedModels.map(model => {
              const config = getPricing(undefined, model.id);
              const tierIdx = getSelectedTier(model.id);
              const cost = calculateMonthlyCost(config, org, tierIdx);
              const hasTiers = config && config.tiers?.length > 1;
              return (
                <Card key={model.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{model.name}</CardTitle>
                        <CardDescription className="text-xs">{model.provider || t("common.unknown")}</CardDescription>
                      </div>
                      {config && <Badge variant={pricingBadgeVariant(config.pricing_type)}>{config.pricing_type}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config ? (
                      <>
                        {hasTiers && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t("pricing.select_plan")}</Label>
                            <Select value={String(tierIdx)} onValueChange={v => setTierForItem(model.id, parseInt(v))}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {config.tiers.map((tier: any, i: number) => (
                                  <SelectItem key={i} value={String(i)}>
                                    {tier.name} – {fmtUnit(tier.price || 0, tier.unit)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {!hasTiers && config.tiers?.length === 1 && (
                          <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{config.tiers[0].name}</span>
                            <span>{fmtUnit(config.tiers[0].price || 0, config.tiers[0].unit)}</span>
                          </div>
                        )}
                        {config.pricing_type === "per_token" && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>Input: ${config.input_token_price}/1M tokens</div>
                            <div>Output: ${config.output_token_price}/1M tokens</div>
                          </div>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t("pricing.monthly_cost")}</span>
                          <span className={`text-lg font-bold ${costColor(cost)}`}>{fmtCost(cost)}</span>
                        </div>
                        {config.notes && <p className="text-xs text-muted-foreground italic">{config.notes}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("pricing.no_pricing")}</p>
                    )}
                    {admin && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => fetchPricingMutation.mutate({ name: model.name, type: "model", vendor: model.provider, link: model.link, model_id: model.id })} disabled={fetchingId === model.id}>
                          {fetchingId === model.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                          {t("pricing.fetch_ai")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(config, undefined, model.id, model.name)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {evaluatedTools.length === 0 && evaluatedModels.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("pricing.no_items")}
          </CardContent>
        </Card>
      )}




      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={o => !o && setEditDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pricing.edit_pricing")} – {editDialog.itemName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("pricing.pricing_type")}</Label>
              <Select value={editForm.pricing_type} onValueChange={v => setEditForm(f => ({ ...f, pricing_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="per_seat">Per seat</SelectItem>
                  <SelectItem value="per_token">Per token</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="tiered">Tiered</SelectItem>
                  <SelectItem value="usage_based">Usage-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Input token pris (per 1M)</Label>
                <Input type="number" step="0.01" value={editForm.input_token_price} onChange={e => setEditForm(f => ({ ...f, input_token_price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Output token pris (per 1M)</Label>
                <Input type="number" step="0.01" value={editForm.output_token_price} onChange={e => setEditForm(f => ({ ...f, output_token_price: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tiers (JSON)</Label>
              <Textarea rows={4} value={editForm.tiers} onChange={e => setEditForm(f => ({ ...f, tiers: e.target.value }))} className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("form.notes")}</Label>
              <Input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false })}>{t("common.cancel")}</Button>
            <Button onClick={saveEditedPricing}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
