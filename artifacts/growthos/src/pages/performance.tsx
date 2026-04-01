import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetPerformanceMetrics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, BarChart2, TrendingUp, Sparkles, MousePointerClick, Banknote, Target, ArrowUpRight, Instagram, Facebook, Linkedin } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Performance() {
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

  const metricsMutation = useGetPerformanceMetrics();

  useEffect(() => {
    if (profileId && !metricsMutation.data && !metricsMutation.isPending) {
      metricsMutation.mutate({ data: { businessProfileId: profileId } });
    }
  }, [profileId]);

  if (!profileId) return null;

  const m = metricsMutation.data;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const reachData = m?.weeklyReach.map((val, i) => ({
    name: days[i],
    reach: val
  })) || [];

  const platformData = m ? [
    { name: 'Instagram', engagement: m.platformEngagement.instagram, fill: '#E1306C' },
    { name: 'Facebook', engagement: m.platformEngagement.facebook, fill: '#1877F2' },
    { name: 'LinkedIn', engagement: m.platformEngagement.linkedin, fill: '#0A66C2' },
  ] : [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-emerald-600" />
            Performance Command Center
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Simulated analytics and AI insights for your digital presence.</p>
        </div>
        {m && (
          <Badge variant="outline" className="bg-white px-4 py-2 border-slate-200 text-slate-600 hidden md:flex">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Live Simulation Data
          </Badge>
        )}
      </div>

      {metricsMutation.isPending ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        </div>
      ) : m ? (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Click-Through Rate</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-4xl font-bold text-slate-900">{m.ctr}%</h3>
                      <span className="flex items-center text-sm font-medium text-emerald-600 mb-1"><ArrowUpRight className="w-4 h-4" /> 1.2%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><MousePointerClick className="w-6 h-6" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Cost Per Click</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-4xl font-bold text-slate-900">₹{m.cpc.toFixed(2)}</h3>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Banknote className="w-6 h-6" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Return on Ad Spend</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-4xl font-bold text-slate-900">{m.roas}x</h3>
                      <span className="flex items-center text-sm font-medium text-emerald-600 mb-1"><ArrowUpRight className="w-4 h-4" /> 0.5x</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Conversion Rate</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-4xl font-bold text-slate-900">{m.conversionRate}%</h3>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Target className="w-6 h-6" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Charts */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-lg">Weekly Reach Trend</CardTitle>
                  <CardDescription>Number of unique accounts that saw your content across platforms</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reachData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dx={-10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                          itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                        />
                        <Line type="monotone" dataKey="reach" stroke="#10b981" strokeWidth={4} dot={{r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8, strokeWidth: 0, fill: '#059669'}} animationDuration={1500} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-lg">Platform Engagement Rate</CardTitle>
                  <CardDescription>Average interaction rate by social channel</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} tickFormatter={(value) => `${value}%`} dx={-10} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}} 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`${value}%`, 'Engagement Rate']}
                        />
                        <Bar dataKey="engagement" radius={[6, 6, 0, 0]} maxBarSize={70} animationDuration={1500}>
                          {platformData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Column */}
            <div className="space-y-8">
              <Card className="bg-indigo-900 border-indigo-800 text-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-32 h-32" />
                </div>
                <CardHeader className="pb-3 relative z-10">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <div className="p-2 bg-indigo-800 rounded-lg">
                      <Sparkles className="w-5 h-5 text-indigo-300" />
                    </div>
                    AI Growth Insight
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-indigo-100 text-[15px] leading-relaxed">
                    {m.aiInsight}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-lg">Top Performing Post</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                      {m.topPost.platform.toLowerCase() === 'instagram' ? <Instagram className="w-5 h-5 text-[#E1306C]" /> : null}
                      {m.topPost.platform.toLowerCase() === 'facebook' ? <Facebook className="w-5 h-5 text-[#1877F2]" /> : null}
                      {m.topPost.platform.toLowerCase() === 'linkedin' ? <Linkedin className="w-5 h-5 text-[#0A66C2]" /> : null}
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-900">{m.topPost.platform}</span>
                      <span className="block text-xs text-slate-500">Most engaged content this week</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative">
                    <p className="text-[15px] text-slate-800 line-clamp-5 leading-relaxed">"{m.topPost.caption}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reach</span>
                      <span className="text-2xl font-bold text-slate-900">{m.topPost.reach.toLocaleString()}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center shadow-sm">
                      <span className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Engagement</span>
                      <span className="text-2xl font-bold text-emerald-600">{m.topPost.engagement}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <BarChart2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg">Failed to load performance metrics.</p>
        </div>
      )}
    </div>
  );
}