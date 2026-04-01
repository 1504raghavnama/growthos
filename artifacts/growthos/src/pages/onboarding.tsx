import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAnalyzeBusinessProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, ArrowRight, Loader2 } from "lucide-react";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  websiteUrl: z.string().optional(),
  businessType: z.string().min(1, "Required"),
  targetAudience: z.string().min(2, "Required"),
  location: z.string().min(2, "Required"),
  productsOrServices: z.string().min(5, "Required"),
  monthlyBudget: z.string().min(1, "Required"),
  primaryGoal: z.string().min(1, "Required"),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const analyzeProfile = useAnalyzeBusinessProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      websiteUrl: "",
      businessType: "",
      targetAudience: "",
      location: "",
      productsOrServices: "",
      monthlyBudget: "",
      primaryGoal: "",
    },
  });

  useEffect(() => {
    if (localStorage.getItem("businessProfileId")) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    analyzeProfile.mutate(
      { data: values },
      {
        onSuccess: (profile) => {
          localStorage.setItem("businessProfileId", profile.id);
          setLocation("/dashboard");
        },
      }
    );
  }

  const demos = [
    {
      label: "Priya's Boutique",
      data: {
        businessName: "Priya's Boutique",
        websiteUrl: "",
        businessType: "Fashion",
        targetAudience: "Women 20-35",
        location: "Mumbai",
        productsOrServices: "Ethnic fusion wear and modern Indian designs",
        monthlyBudget: "₹5,000-20,000",
        primaryGoal: "Brand Awareness"
      }
    },
    {
      label: "TechEdge Academy",
      data: {
        businessName: "TechEdge Academy",
        websiteUrl: "techedge.in",
        businessType: "Education",
        targetAudience: "College students and young professionals",
        location: "Bangalore",
        productsOrServices: "Python, web dev, data science courses",
        monthlyBudget: "₹20,000-50,000",
        primaryGoal: "Lead Generation"
      }
    },
    {
      label: "Spice Garden",
      data: {
        businessName: "Spice Garden Restaurant",
        websiteUrl: "",
        businessType: "Restaurant",
        targetAudience: "Families and office groups",
        location: "Delhi",
        productsOrServices: "North Indian vegetarian and non-vegetarian cuisine, catering",
        monthlyBudget: "₹5,000-20,000",
        primaryGoal: "Sales"
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Left Side: Brand */}
        <div className="bg-slate-900 p-10 flex flex-col text-white justify-between">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">GrowthOS</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">Your digital marketing team on autopilot.</h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              We analyze your business and generate ready-to-use content calendars, AI captions, and ad campaigns tailored for the Indian market.
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Try a quick demo</p>
            <div className="flex flex-col gap-3">
              {demos.map((demo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => form.reset(demo.data)}
                  className="text-left px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm"
                >
                  <span className="font-semibold block">{demo.label}</span>
                  <span className="text-slate-400 block mt-1 line-clamp-1">{demo.data.productsOrServices}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-10 max-h-[90vh] overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tell us about your business</h2>
            <p className="text-slate-500 text-sm">Fill in the details below to get a custom marketing strategy.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sharma Sweets" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="www.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Business Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Restaurant">Restaurant / Cafe</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Fashion">Fashion / Clothing</SelectItem>
                          <SelectItem value="Tech">Tech / Software</SelectItem>
                          <SelectItem value="Education">Education / Coaching</SelectItem>
                          <SelectItem value="Healthcare">Healthcare / Clinic</SelectItem>
                          <SelectItem value="Real Estate">Real Estate</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>City / Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Bangalore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. College students, local families" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productsOrServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Products or Services</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what you sell in a few words..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyBudget"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Monthly Ad Budget</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select budget" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Under ₹5,000">Under ₹5,000</SelectItem>
                          <SelectItem value="₹5,000-20,000">₹5,000 - ₹20,000</SelectItem>
                          <SelectItem value="₹20,000-50,000">₹20,000 - ₹50,000</SelectItem>
                          <SelectItem value="₹50,000+">₹50,000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryGoal"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Primary Goal</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select goal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Brand Awareness">Brand Awareness</SelectItem>
                          <SelectItem value="Lead Generation">Lead Generation</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="App Downloads">App Downloads</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-6 text-lg" 
                disabled={analyzeProfile.isPending}
              >
                {analyzeProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing your business...
                  </>
                ) : (
                  <>
                    Generate Strategy
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
