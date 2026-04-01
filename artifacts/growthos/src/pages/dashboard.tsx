import React, { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useGetBusinessProfile, getGetBusinessProfileQueryKey, useGenerateWeeklyCalendar } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, PenTool, Zap, Target, BarChart2, ArrowRight } from "lucide-react";

export default function Dashboard() {
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

  const { data: profile, isLoading: profileLoading } = useGetBusinessProfile(profileId || "", {
    query: {
      enabled: !!profileId,
      queryKey: getGetBusinessProfileQueryKey(profileId || ""),
    },
  });

  const calendarMutation = useGenerateWeeklyCalendar();

  useEffect(() => {
    if (profileId) {
      calendarMutation.mutate({ data: { businessProfileId: profileId } });
    }
  }, [profileId]);

  if (!profileId || profileLoading) {
    return <div className="p-8 flex items-center justify-center h-[calc(100vh-4rem)]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!profile) return null;

  const todayPost = calendarMutation.data?.days?.[0];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{profile.businessName}</h1>
        <p className="text-slate-500 mt-2 text-lg">{profile.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle>Business Profile Insights</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Unique Selling Proposition</h3>
              <p className="text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{profile.usp}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Brand Tone</h3>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200 px-3 py-1 text-sm">{profile.brandTone}</Badge>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Content Pillars</h3>
              <div className="flex flex-wrap gap-2">
                {profile.contentPillars.map(pillar => (
                  <Badge key={pillar} variant="outline" className="bg-white px-3 py-1 text-sm text-slate-700">{pillar}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Top Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {profile.topHashtags.map(tag => (
                  <span key={tag} className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{tag}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start h-12 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium">
                <Link href="/calendar"><Calendar className="w-5 h-5 mr-3 text-blue-500" /> Content Calendar</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start h-12 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium">
                <Link href="/captions"><PenTool className="w-5 h-5 mr-3 text-indigo-500" /> Create Captions</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start h-12 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium">
                <Link href="/festivals"><Zap className="w-5 h-5 mr-3 text-amber-500" /> View Festivals</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start h-12 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium">
                <Link href="/ads"><Target className="w-5 h-5 mr-3 text-rose-500" /> Ad Campaigns</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start h-12 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium">
                <Link href="/performance"><BarChart2 className="w-5 h-5 mr-3 text-emerald-500" /> Performance</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-blue-400" />
                Today's Post
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calendarMutation.isPending ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : todayPost ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/20 border-0">{todayPost.postType}</Badge>
                    <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded">{todayPost.postingTime}</span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-4 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    {todayPost.caption}
                  </p>
                  <Button asChild variant="secondary" className="w-full bg-white text-slate-900 hover:bg-slate-100 mt-2 font-semibold">
                    <Link href="/calendar">View Full Calendar <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Failed to load today's post.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}