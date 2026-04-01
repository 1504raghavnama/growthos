import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetFestivalTrends } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, CalendarDays, Copy, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Festivals() {
  const [, setLocation] = useLocation();
  const [profileId, setProfileId] = useState<string | null>(null);
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = localStorage.getItem("businessProfileId");
    if (!id) {
      setLocation("/");
    } else {
      setProfileId(id);
    }
  }, [setLocation]);

  const festivalsMutation = useGetFestivalTrends();

  useEffect(() => {
    if (profileId && !festivalsMutation.data && !festivalsMutation.isPending) {
      festivalsMutation.mutate({ data: { businessProfileId: profileId } });
    }
  }, [profileId]);

  const toggleOpen = (name: string) => {
    setOpenItems(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const copyToClipboard = (name: string, text: string, hashtags: string[]) => {
    const fullText = `${text}\n\n${hashtags.join(" ")}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(name);
    toast({
      title: "Copied to clipboard",
      description: "Festival caption copied successfully.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency.includes("Today")) return "bg-red-100 text-red-800 border-red-200";
    if (urgency.includes("Week")) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  if (!profileId) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
          Festival Trend Radar
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Capitalize on upcoming Indian festivals and cultural moments with tailored campaigns.</p>
      </div>

      {festivalsMutation.isPending ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : festivalsMutation.data ? (
        <div className="space-y-6">
          {festivalsMutation.data.festivals.map((festival) => (
            <Card key={festival.name} className="overflow-hidden border-slate-200 shadow-sm">
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-xl font-bold text-slate-900">{festival.name}</h3>
                    <Badge variant="outline" className={`${getUrgencyColor(festival.urgency)} px-2.5 py-0.5`}>
                      {festival.urgency}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <CalendarDays className="w-4 h-4 mr-2 text-slate-400" />
                    {festival.date}
                    <span className="mx-3 text-slate-300">•</span>
                    {festival.type}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="mb-6 bg-amber-50/50 rounded-xl p-5 border border-amber-100/50">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Campaign Idea
                  </h4>
                  <p className="text-slate-800 text-lg leading-relaxed">{festival.campaignIdea}</p>
                </div>

                <Collapsible open={openItems[festival.name]} onOpenChange={() => toggleOpen(festival.name)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-12 text-slate-700 font-medium hover:bg-slate-50">
                      View Ready-to-Use Caption
                      {openItems[festival.name] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 relative">
                      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[15px] mb-6">{festival.caption}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {festival.suggestedHashtags.map(tag => (
                          <span key={tag} className="text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex justify-end pt-4 border-t border-slate-200">
                        <Button 
                          onClick={() => copyToClipboard(festival.name, festival.caption, festival.suggestedHashtags)}
                          className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                        >
                          {copiedId === festival.name ? (
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Copied to Clipboard</>
                          ) : (
                            <><Copy className="w-4 h-4 mr-2" /> Copy Full Caption & Hashtags</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg">Failed to load festival trends. Please try again.</p>
        </div>
      )}
    </div>
  );
}