import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGenerateWeeklyCalendar } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Calendar as CalendarIcon, Clock, Zap } from "lucide-react";

export default function Calendar() {
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

  const calendarMutation = useGenerateWeeklyCalendar();

  useEffect(() => {
    if (profileId && !calendarMutation.data && !calendarMutation.isPending) {
      calendarMutation.mutate({ data: { businessProfileId: profileId } });
    }
  }, [profileId]);

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "reel": return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100";
      case "carousel": return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
      case "static": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
      case "story": return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100";
      default: return "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100";
    }
  };

  if (!profileId) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Content Calendar
          </h1>
          <p className="text-slate-500 mt-2">Your AI-generated 7-day content plan.</p>
        </div>
        <Button 
          onClick={() => calendarMutation.mutate({ data: { businessProfileId: profileId } })}
          disabled={calendarMutation.isPending}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          {calendarMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Regenerate Calendar
        </Button>
      </div>

      {calendarMutation.isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7].map(i => (
            <Card key={i} className="animate-pulse border-slate-200">
              <CardHeader className="h-14 bg-slate-50 border-b border-slate-100"></CardHeader>
              <CardContent className="h-48 bg-white p-5 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : calendarMutation.data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {calendarMutation.data.days.map((day) => (
            <Card key={day.dayNumber} className="overflow-hidden hover:shadow-md transition-all border-slate-200 bg-white">
              <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-800 tracking-tight">
                  {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <Badge variant="outline" className={getBadgeColor(day.postType)}>{day.postType}</Badge>
              </div>
              <CardContent className="p-5 space-y-4">
                {day.festival && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 w-full justify-center py-1">
                    <Zap className="w-3.5 h-3.5 mr-1.5 fill-amber-500 text-amber-500" />
                    {day.festival}
                  </Badge>
                )}
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 leading-tight">{day.theme}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 bg-slate-50/50 p-3 rounded border border-slate-100">{day.caption}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center text-sm font-medium text-slate-500 bg-white">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  {day.postingTime}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg">Failed to load calendar. Please try generating again.</p>
        </div>
      )}
    </div>
  );
}