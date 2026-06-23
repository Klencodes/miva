import React, { useState, useEffect, useCallback } from "react";
import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./SideBar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CommonLayoutProps {
  children: React.ReactNode;
}

// ─── Hook: detect mobile breakpoint ──────────────────────────────────────────
function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

// ─── CommonLayout ─────────────────────────────────────────────────────────────
// Used for ProtectedRoute — includes Header, Sidebar, and Footer.
// Sidebar is persistent on desktop, overlay on mobile.
const CommonLayout: React.FC<CommonLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  // Start open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Sync when viewport crosses mobile breakpoint
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Fixed Header ── */}
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      {/* ── Below header: sidebar + main ── */}
      <div className="flex flex-1 pt-16">

        {/* ── Sidebar ── */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} isMobile={isMobile} />

        {/* ── Main area ── */}
        {/* 
          On desktop: shift right by sidebar width (260px) when open.
          On mobile: always full width (sidebar overlays).
        */}
        <div
          className={[
            "flex flex-col flex-1 min-w-0 ",
            "transition-[margin-left] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            !isMobile && sidebarOpen ? "ml-[260px]" : "ml-0",
          ].join(" ")}
        >
          {/* Page content */}
          <main
            className="flex-1 p-6 bg-background"
            id="main-content"
          >
            {children}
          </main>

          {/* ── Footer ── */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default CommonLayout;