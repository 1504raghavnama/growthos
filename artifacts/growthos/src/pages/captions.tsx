import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGenerateCaptions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PenTool, Copy, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  postDescription: z.string().min(5, "Please describe the post"),
  platform: z.string().min(1, "Required"),
  tone: z.string().min(1, "Required"),
});

export default function Captions() {
  const [, setLocation] = useLocation();
  const [profileId, setProfileId] = useState<string | null>(null);
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("businessProfileId");
    if (!id) {
      setLocation("/");
    } else {
      setProfileId(id);
    }
  }, [setLocation]);

  const generateCaptions = useGenerateCaptions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postDescription: "",
      platform: "Instagram",
      tone: "Promotional",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!profileId) return;
    generateCaptions.mutate({
      data: {
        businessProfileId: profileId,
        ...values,
      }
    });
  }

  const copyToClipboard = (id: number, text: string, hashtags: string[]) => {
    const fullText = `${text}\n\n${hashtags.join(" ")}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(id);
    toast({
      title: "Copied to clipboard",
      description: "Caption and hashtags copied successfully.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!profileId) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <PenTool className="w-8 h-8 text-indigo-600" />
          AI Caption Generator
        </h1>
        <p className="text-slate-500 mt-2">Generate engaging, platform-optimized captions for your next post.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-1 border-slate-200 shadow-sm sticky top-8">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">Post Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="postDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">What is this post about?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. New summer collection launch next week, 20% off early birds..." 
                          className="resize-none h-32 bg-slate-50" 
                          {...field} 
                        />
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
                      <FormLabel className="text-slate-700">Platform</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Twitter">Twitter</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Tone of Voice</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Promotional">Promotional</SelectItem>
                          <SelectItem value="Educational">Educational</SelectItem>
                          <SelectItem value="Inspirational">Inspirational</SelectItem>
                          <SelectItem value="Festive">Festive</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700 h-12 text-base shadow-sm" 
                  disabled={generateCaptions.isPending}
                >
                  {generateCaptions.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
                  ) : (
                    "Generate 3 Captions"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {generateCaptions.isPending && (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse border-slate-200">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
                    <div className="h-6 w-24 bg-slate-100 rounded"></div>
                    <div className="h-4 w-16 bg-slate-100 rounded"></div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!generateCaptions.isPending && !generateCaptions.data && (
            <div className="h-[500px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-white shadow-sm">
              <PenTool className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg">Fill out the form to generate custom captions</p>
            </div>
          )}

          {generateCaptions.data?.captions.map((caption) => (
            <Card key={caption.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-center justify-between bg-slate-50/50 border-b">
                <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1 font-medium">{caption.style}</Badge>
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">{caption.charCount} chars</span>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{caption.caption}</p>
                <div className="mt-6 flex flex-wrap gap-2">
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
                  onClick={() => copyToClipboard(caption.id, caption.caption, caption.hashtags)}
                >
                  {copiedId === caption.id ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Copied</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2 text-slate-500" /> Copy Text</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}