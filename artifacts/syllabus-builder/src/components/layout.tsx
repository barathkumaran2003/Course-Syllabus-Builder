import React from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, LayoutDashboard, Library, FileText, Settings, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
  activeCourseId?: string;
}

export function Layout({ children, activeCourseId }: LayoutProps) {
  const [location] = useLocation();

  const mainNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Course Library", href: "/courses", icon: Library },
  ];

  const courseNav = activeCourseId ? [
    { name: "Builder", href: `/builder/${activeCourseId}`, icon: Settings },
    { name: "Preview & Export", href: `/preview/${activeCourseId}`, icon: FileText },
    { name: "Version History", href: `/history/${activeCourseId}`, icon: History },
  ] : [];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 glass-panel flex flex-col z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-gradient">SyllabusPro</span>
        </div>

        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          <div>
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Menu</p>
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted hover:text-foreground'}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <AnimatePresence>
            {activeCourseId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Course</p>
                <nav className="space-y-1">
                  {courseNav.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted hover:text-foreground'}`}>
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto relative z-10 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
