import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "./pages/dashboard";
import Courses from "./pages/courses";
import Builder from "./pages/builder";
import Preview from "./pages/preview";
import History from "./pages/history";
import AIGenerator from "./pages/ai-generator";
import Templates from "./pages/templates";
import Branding from "./pages/branding";
import Settings from "./pages/settings";
import { BrandingProvider } from "./contexts/branding-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch local storage aggressively
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/courses" component={Courses} />
      <Route path="/ai-generator" component={AIGenerator} />
      <Route path="/templates" component={Templates} />
      <Route path="/branding" component={Branding} />
      <Route path="/settings" component={Settings} />
      <Route path="/builder/:courseId" component={Builder} />
      <Route path="/preview/:courseId" component={Preview} />
      <Route path="/history/:courseId" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
