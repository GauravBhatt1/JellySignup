import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminTrials from "@/pages/admin/trials";
import AdminApprovals from "@/pages/admin/approvals";
import AdminRecycleBin from "@/pages/admin/recycle-bin";
import AdminHealth from "@/pages/admin/health";
import DemandAnalytics from "@/pages/admin/demand";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/users" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/approvals" component={AdminApprovals} />
      <Route path="/admin/trials" component={AdminTrials} />
      <Route path="/admin/recycle-bin" component={AdminRecycleBin} />
      <Route path="/admin/health" component={AdminHealth} />
      <Route path="/admin/demand" component={DemandAnalytics} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen w-full overflow-y-auto">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
