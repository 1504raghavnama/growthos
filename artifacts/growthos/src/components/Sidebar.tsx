import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, PenTool, Zap, Target, BarChart2, LogOut } from "lucide-react";
import { useGetBusinessProfile } from "@workspace/api-client-react";
import { getGetBusinessProfileQueryKey } from "@workspace/api-client-react";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileId(localStorage.getItem("businessProfileId"));
    }
  }, []);

  const { data: profile } = useGetBusinessProfile(profileId || "", {
    query: {
      enabled: !!profileId,
      queryKey: getGetBusinessProfileQueryKey(profileId || ""),
    },
  });

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/captions", label: "Captions", icon: PenTool },
    { href: "/festivals", label: "Festivals", icon: Zap },
    { href: "/ads", label: "Ads", icon: Target },
    { href: "/performance", label: "Performance", icon: BarChart2 },
  ];

  const handleReset = () => {
    localStorage.removeItem("businessProfileId");
    setLocation("/");
  };

  return (
    <div className="w-64 h-screen bg-sidebar text-sidebar-foreground border-r flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400 fill-blue-400" />
          GrowthOS
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-gray-400 hover:text-white hover:bg-sidebar-accent/50'}`}>
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {profile ? (
          <div className="mb-4 px-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Business</p>
            <p className="text-sm font-medium text-white truncate">{profile.businessName}</p>
          </div>
        ) : null}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-md hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          New Business
        </button>
      </div>
    </div>
  );
}
