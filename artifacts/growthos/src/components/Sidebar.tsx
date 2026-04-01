import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, PenTool, Zap, Target, BarChart2, LogOut, Menu, X } from "lucide-react";
import { useGetBusinessProfile, getGetBusinessProfileQueryKey } from "@workspace/api-client-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/captions", label: "Captions", icon: PenTool },
  { href: "/festivals", label: "Festivals", icon: Zap },
  { href: "/ads", label: "Ads", icon: Target },
  { href: "/performance", label: "Performance", icon: BarChart2 },
];

function SidebarContent({
  location,
  profile,
  onReset,
  onNavClick,
}: {
  location: string;
  profile: { businessName?: string } | null | undefined;
  onReset: () => void;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
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
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavClick}
              data-testid={`nav-${link.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-gray-400 hover:text-white hover:bg-sidebar-accent/50"}`}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {profile?.businessName ? (
          <div className="mb-4 px-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Business</p>
            <p className="text-sm font-medium text-white truncate">{profile.businessName}</p>
          </div>
        ) : null}
        <button
          onClick={onReset}
          data-testid="button-new-business"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-md hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          New Business
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleReset = () => {
    localStorage.removeItem("businessProfileId");
    setMobileOpen(false);
    setLocation("/");
  };

  const handleNavClick = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        data-testid="button-mobile-menu"
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-sidebar text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent
          location={location}
          profile={profile}
          onReset={handleReset}
          onNavClick={handleNavClick}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border fixed left-0 top-0">
        <SidebarContent
          location={location}
          profile={profile}
          onReset={handleReset}
        />
      </aside>
    </>
  );
}
