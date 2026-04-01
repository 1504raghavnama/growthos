import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGenerateCaptions,
  useGetFestivalTrends,
  useGenerateWeeklyCalendar,
  useGeneratePostImage,
} from "@workspace/api-client-react";
import type { UnsplashPhoto } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, PenTool, Copy, CheckCircle2, Calendar, Zap,
  ChevronDown, ChevronUp, Sparkles, ImageIcon, Download, RefreshCw, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  postDescription: z.string().min(5, "Please describe the post"),
  platform: z.string().min(1, "Required"),
  tone: z.string().min(1, "Required"),
});

type CaptionContext = {
  description: string;
  platform: string;
  tone: string;
  label: string;
  festival?: string | null;
  date?: string;
  postType?: string;
};

type CalendarDay = {
  dayNumber: number;
  date: string;
  theme: string;
  postType: string;
  caption: string;
  festival: string | null;
  contentIdea?: string;
  postingTime: string;
};

type ActiveContext = {
  description: string;
  platform: string;
  theme: string;
  postType: string;
};

export default function Captions() {
  const [, setLocation] = useLocation();
  const [profileId, setProfileId] = useState<string | null>(null);
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [activeCtx, setActiveCtx] = useState<ActiveContext | null>(null);
  const [cachedDays, setCachedDays] = useState<CalendarDay[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);
  const autoFired = useRef(false);

  useEffect(() => {
    const id = localStorage.getItem("businessProfileId");
    if (!id) {
      setLocation("/");
    } else {
      setProfileId(id);
    }
    const cached = localStorage.getItem("calendarCache");
    if (cached) {
      try { setCachedDays(JSON.parse(cached)); } catch { /* ignore */ }
    }
  }, [setLocation]);

  const generateCaptions = useGenerateCaptions();
  const generateImage = useGeneratePostImage();
  const festivalMutation = useGetFestivalTrends();
  const calendarMutation = useGenerateWeeklyCalendar();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { postDescription: "", platform: "Instagram", tone: "Promotional" },
  });

  useEffect(() => {
    if (!profileId) return;
    festivalMutation.mutate({ data: { businessProfileId: profileId } });
    if (cachedDays.length === 0) {
      calendarMutation.mutate({ data: { businessProfileId: profileId } });
    }
  }, [profileId]);

  useEffect(() => {
    if (calendarMutation.data?.days) {
      const days = calendarMutation.data.days;
      setCachedDays(days);
      localStorage.setItem("calendarCache", JSON.stringify(days));
    }
  }, [calendarMutation.data]);

  useEffect(() => {
    if (!profileId || autoFired.current) return;
    const raw = localStorage.getItem("captionContext");
    if (!raw) return;
    try {
      const ctx: CaptionContext = JSON.parse(raw);
      localStorage.removeItem("captionContext");
      autoFired.current = true;
      form.setValue("postDescription", ctx.description);
      form.setValue("platform", ctx.platform || "Instagram");
      form.setValue("tone", ctx.tone || "Promotional");
      setActiveLabel(ctx.label);
      setActiveCtx({
        description: ctx.description,
        platform: ctx.platform || "Instagram",
        theme: ctx.label,
        postType: ctx.postType || "Static",
      });
      generateCaptions.mutate({
        data: {
          businessProfileId: profileId,
          postDescription: ctx.description,
          platform: ctx.platform || "Instagram",
          tone: ctx.tone || "Promotional",
        },
      });
    } catch { /* ignore */ }
  }, [profileId]);

  useEffect(() => {
    if (generateCaptions.isPending) {
      generateImage.reset();
      setSelectedPhoto(null);
    }
  }, [generateCaptions.isPending]);

  const triggerGenerate = (
    desc: string, platform: string, tone: string, label: string, postType = "Static"
  ) => {
    if (!profileId) return;
    form.setValue("postDescription", desc);
    form.setValue("platform", platform);
    form.setValue("tone", tone);
    setActiveLabel(label);
    setActiveCtx({ description: desc, platform, theme: label, postType });
    generateImage.reset();
    setSelectedPhoto(null);
    generateCaptions.mutate({
      data: { businessProfileId: profileId, postDescription: desc, platform, tone },
    });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!profileId) return;
    setActiveLabel("Custom");
    setActiveCtx({
      description: values.postDescription,
      platform: values.platform,
      theme: values.postDescription.slice(0, 60),
      postType: "Static",
    });
    generateImage.reset();
    setSelectedPhoto(null);
    generateCaptions.mutate({ data: { businessProfileId: profileId, ...values } });
  }

  const handleFindPhotos = () => {
    if (!profileId || !activeCtx || !generateCaptions.data) return;
    const firstCaption = generateCaptions.data.captions[0];
    setSelectedPhoto(null);
    generateImage.mutate({
      data: {
        businessProfileId: profileId,
        captionText: firstCaption?.caption || activeCtx.description,
        platform: activeCtx.platform,
        theme: activeCtx.theme,
        postType: activeCtx.postType,
      },
    });
  };

  const trackAndDownload = async (photo: UnsplashPhoto) => {
    try {
      await fetch(`/api/growthos/track-photo-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
      });
    } catch { /* best-effort */ }
    window.open(photo.url + "&dl=1", "_blank");
  };

  const copyToClipboard = (id: number, text: string, hashtags: string[]) => {
    navigator.clipboard.writeText(`${text}\n\n${hashtags.join(" ")}`);
    setCopiedId(id);
    toast({ title: "Copied to clipboard", description: "Caption and hashtags copied." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const dayTone = (day: CalendarDay) => {
    if (day.festival) return "Festive";
    if (day.postType === "Reel") return "Inspirational";
    if (day.postType === "Carousel") return "Educational";
    return "Promotional";
  };

  const upcomingDays = (cachedDays.length > 0 ? cachedDays : calendarMutation.data?.days ?? []).slice(0, 4);
  const upcomingFestivals = (festivalMutation.data?.festivals ?? [])
    .filter((f) => f.urgency === "Today" || f.urgency === "This Week")
    .slice(0, 3);

  if (!profileId) return null;

  const hasCaptions = !generateCaptions.isPending && !!generateCaptions.data;
  const photos = generateImage.data?.photos ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <PenTool className="w-8 h-8 text-indigo-600" />
          AI Caption Generator
        </h1>
        <p className="text-slate-500 mt-2">Professional captions + curated stock photos, powered by your business strategy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-5">

          {/* From Calendar */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 px-5 border-b bg-slate-50/50">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                From Your Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {(calendarMutation.isPending && cachedDays.length === 0) ? (
                <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : upcomingDays.length > 0 ? (
                upcomingDays.map((day) => (
                  <button
                    key={day.dayNumber}
                    data-testid={`quick-gen-day-${day.dayNumber}`}
                    onClick={() => triggerGenerate(
                      day.contentIdea ? `${day.theme}: ${day.contentIdea}` : `${day.theme}. ${day.caption.slice(0, 120)}`,
                      "Instagram", dayTone(day), day.theme, day.postType
                    )}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                      activeLabel === day.theme
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                    }`}
                    disabled={generateCaptions.isPending}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-800 leading-tight">{day.theme}</span>
                      <Badge variant="outline" className="shrink-0 text-xs px-1.5 py-0">{day.postType}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                      {day.festival && <span className="text-amber-600 font-medium">· {day.festival}</span>}
                    </div>
                    {activeLabel === day.theme && generateCaptions.isPending && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-indigo-600 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">Calendar not loaded yet</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Festivals */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 px-5 border-b bg-slate-50/50">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Upcoming Festivals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {festivalMutation.isPending ? (
                <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : upcomingFestivals.length > 0 ? (
                upcomingFestivals.map((festival, i) => (
                  <button
                    key={i}
                    data-testid={`quick-gen-festival-${i}`}
                    onClick={() => triggerGenerate(
                      `${festival.name} special post: ${festival.campaignIdea}`,
                      "Instagram", "Festive", festival.name, "Static"
                    )}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                      activeLabel === festival.name
                        ? "border-amber-400 bg-amber-50"
                        : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                    disabled={generateCaptions.isPending}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{festival.name}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        festival.urgency === "Today" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      }`}>{festival.urgency}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{festival.campaignIdea}</p>
                    {activeLabel === festival.name && generateCaptions.isPending && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No urgent festivals this week</p>
              )}
            </CardContent>
          </Card>

          {/* Custom Form */}
          <Card className="border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setShowCustomForm((v) => !v)}
              className="w-full px-5 py-4 flex items-center justify-between text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Custom Caption
              </span>
              {showCustomForm ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showCustomForm && (
              <CardContent className="px-5 pb-5 pt-0 border-t">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="postDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 text-xs">What is this post about?</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g. New summer collection, 20% off sale..." className="resize-none h-24 bg-slate-50 text-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 text-xs">Platform</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="bg-slate-50 text-sm"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Instagram">Instagram</SelectItem>
                              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                              <SelectItem value="Facebook">Facebook</SelectItem>
                              <SelectItem value="Twitter">Twitter</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 text-xs">Tone</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="bg-slate-50 text-sm"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Promotional">Promotional</SelectItem>
                              <SelectItem value="Educational">Educational</SelectItem>
                              <SelectItem value="Inspirational">Inspirational</SelectItem>
                              <SelectItem value="Festive">Festive</SelectItem>
                              <SelectItem value="Casual">Casual</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-indigo-600 text-white hover:bg-indigo-700 h-10 text-sm" disabled={generateCaptions.isPending}>
                      {generateCaptions.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Captions"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-2 space-y-5">

          {/* Loading skeletons */}
          {generateCaptions.isPending && (
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-slate-200">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-slate-50">
                    <div className="h-6 w-24 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!generateCaptions.isPending && !generateCaptions.data && (
            <div className="h-[480px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white">
              <PenTool className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-700">Pick a post to generate captions</p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs text-center">
                Select a calendar day or upcoming festival — expert-level captions will appear here instantly.
              </p>
            </div>
          )}

          {/* Results */}
          {hasCaptions && (
            <>
              {/* Context badge */}
              {activeLabel && (
                <div className="flex items-center gap-2 text-sm text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-lg">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Captions for: <span className="font-bold">{activeLabel}</span></span>
                </div>
              )}

              {/* Photo Finder Card */}
              <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-sm">
                <CardHeader className="pb-3 px-6 pt-5 border-b border-violet-100">
                  <CardTitle className="text-base flex items-center gap-2 text-violet-900">
                    <ImageIcon className="w-5 h-5 text-violet-600" />
                    Post Visuals
                    <Badge variant="outline" className="ml-auto text-xs bg-white border-violet-200 text-violet-700">Unsplash</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">

                  {/* Loading state */}
                  {generateImage.isPending && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
                        <ImageIcon className="w-5 h-5 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-sm text-violet-700 font-medium">Finding the best photos for this post...</p>
                    </div>
                  )}

                  {/* Initial state */}
                  {!generateImage.isPending && photos.length === 0 && !generateImage.isError && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center">
                        <ImageIcon className="w-9 h-9 text-violet-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700">Find professional stock photos for this post</p>
                        <p className="text-xs text-slate-400 mt-1">AI picks the best search terms from your caption and brand — curated photos appear in seconds</p>
                      </div>
                      <Button
                        onClick={handleFindPhotos}
                        className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                        data-testid="button-generate-image"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Find Photos
                      </Button>
                    </div>
                  )}

                  {/* Error state */}
                  {generateImage.isError && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <p className="text-sm text-red-600 font-medium text-center">Could not load photos. Please try again.</p>
                      <Button onClick={handleFindPhotos} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Retry
                      </Button>
                    </div>
                  )}

                  {/* Photo grid */}
                  {!generateImage.isPending && photos.length > 0 && (
                    <div className="space-y-4">
                      {generateImage.data?.searchQuery && (
                        <p className="text-xs text-violet-600 font-medium bg-violet-100 px-3 py-1.5 rounded-lg">
                          🔍 Searched for: <span className="font-semibold">"{generateImage.data.searchQuery}"</span>
                        </p>
                      )}

                      {/* Selected photo preview */}
                      {selectedPhoto && (
                        <div className="space-y-3">
                          <div className="relative rounded-xl overflow-hidden border-2 border-violet-400 shadow-lg">
                            <img
                              src={selectedPhoto.url}
                              alt="Selected post visual"
                              className="w-full object-cover max-h-72"
                              data-testid="generated-post-image"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                              <a
                                href={selectedPhoto.photographerProfile + "?utm_source=growthos&utm_medium=referral"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white text-xs opacity-80 hover:opacity-100 flex items-center gap-1"
                              >
                                Photo by {selectedPhoto.photographer} on Unsplash
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => trackAndDownload(selectedPhoto)}
                              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2"
                              data-testid="button-download-image"
                            >
                              <Download className="w-4 h-4" /> Download Photo
                            </Button>
                            <Button
                              onClick={() => setSelectedPhoto(null)}
                              variant="outline"
                              className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                            >
                              Change
                            </Button>
                            <Button
                              onClick={handleFindPhotos}
                              variant="outline"
                              className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                              disabled={generateImage.isPending}
                            >
                              <RefreshCw className="w-4 h-4" /> New Search
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Photo grid */}
                      {!selectedPhoto && (
                        <>
                          <p className="text-xs text-slate-500 font-medium">Click a photo to select it</p>
                          <div className="grid grid-cols-3 gap-2">
                            {photos.map((photo, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedPhoto(photo)}
                                className="relative rounded-lg overflow-hidden border-2 border-transparent hover:border-violet-400 transition-all group aspect-square"
                                title={`Photo by ${photo.photographer}`}
                              >
                                <img
                                  src={photo.thumbUrl}
                                  alt={`Stock photo option ${i + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-[9px] truncate">{photo.photographer}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-end">
                            <Button
                              onClick={handleFindPhotos}
                              variant="outline"
                              size="sm"
                              className="gap-2 text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                              disabled={generateImage.isPending}
                            >
                              <RefreshCw className="w-3 h-3" /> Search again
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Caption Cards */}
              {generateCaptions.data!.captions.map((caption) => (
                <Card key={caption.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between bg-slate-50/50 border-b">
                    <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1 font-medium">
                      {caption.style}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {caption.charCount} chars
                    </span>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{caption.caption}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {caption.hashtags.map((tag) => (
                        <span key={tag} className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 justify-between items-center border-t border-slate-100 px-6 py-4 bg-slate-50/30">
                    <div className="text-sm font-medium text-slate-700 max-w-[70%]">
                      <span className="text-slate-400 mr-2 uppercase tracking-wider text-xs">CTA:</span>
                      {caption.cta}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 bg-white"
                      data-testid={`button-copy-caption-${caption.id}`}
                      onClick={() => copyToClipboard(caption.id, caption.caption, caption.hashtags)}
                    >
                      {copiedId === caption.id ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Copied</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-2 text-slate-500" /> Copy</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
