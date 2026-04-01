import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetAdRecommendations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, Users, Megaphone, Lightbulb, Info, Coins, Instagram, Facebook, Linkedin } from "lucide-react";

export default function Ads() {
  const [, setLocation] = useLocation();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("businessProfileId");
    if (!id) {
      setLocation("/");
    } else {
      setProfileId(id);
    }
  }, [setLocation]);

  const adsMutation = useGetAdRecommendations();

  useEffect(() => {
    if (profileId && !adsMutation.data && !adsMutation.isPending) {
      adsMutation.mutate({ data: { businessProfileId: profileId } });
    }
  }, [profileId]);

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("instagram")) return <Instagram className="w-7 h-7 text-[#E1306C]" />;
    if (p.includes("facebook")) return <Facebook className="w-7 h-7 text-[#1877F2]" />;
    if (p.includes("linkedin")) return <Linkedin className="w-7 h-7 text-[#0A66C2]" />;
    return <Megaphone className="w-7 h-7 text-slate-600" />;
  };

  if (!profileId) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Target className="w-8 h-8 text-rose-500" />
          Ad Campaign Blueprint
        </h1>
        <p className="text-slate-500 mt-2 text-lg">AI-optimized targeting, formats, and budget splits tailored to your goals.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4 text-blue-900 shadow-sm">
        <Info className="w-6 h-6 shrink-0 mt-0.5 text-blue-500" />
        <div>
          <h4 className="font-semibold mb-1">Implementation Guide</h4>
          <p className="text-sm text-blue-800/80 leading-relaxed">These are strategic recommendations for planning. Use these exact parameters when setting up your campaigns in Meta Ads Manager or LinkedIn Campaign Manager for optimal results.</p>
        </div>
      </div>

      {adsMutation.isPending ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        </div>
      ) : adsMutation.data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {adsMutation.data.campaigns.map((campaign, i) => (
            <Card key={i} className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    {getPlatformIcon(campaign.platform)}
                  </div>
                  <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 font-medium px-3 py-1">
                    {campaign.adFormat}
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-tight text-slate-900">{campaign.name}</CardTitle>
                <div className="flex items-center gap-2 mt-3 text-emerald-700 font-semibold bg-emerald-50 w-fit px-3 py-1.5 rounded-lg text-sm border border-emerald-100">
                  <Coins className="w-4 h-4" />
                  {campaign.budgetSplit} of Budget
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-6 space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    <Users className="w-4 h-4 text-slate-400" />
                    Target Audience
                  </h4>
                  <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {campaign.audienceTargeting}
                  </p>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    Expected Reach
                  </h4>
                  <p className="text-slate-900 font-semibold text-lg">{campaign.expectedReach}</p>
                </div>

                <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-4">
                  <h4 className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Why This Works
                  </h4>
                  <p className="text-amber-900/80 text-sm leading-relaxed">{campaign.whyItWorks}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Creative Direction</h4>
                  <p className="text-slate-700 text-sm italic border-l-2 border-slate-300 pl-3 py-1 bg-slate-50 rounded-r-lg">
                    "{campaign.insight}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg">Failed to load ad recommendations.</p>
        </div>
      )}
    </div>
  );
}