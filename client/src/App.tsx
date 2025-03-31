import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "./store/slices/authSlice";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AdminIndex from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users";
import AdminVideos from "@/pages/admin/videos";
import AdminSubscriptions from "@/pages/admin/subscriptions";
import AdminApiConfig from "@/pages/admin/api-config";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminIndex} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/videos" component={AdminVideos} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/api-config" component={AdminApiConfig} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const dispatch = useDispatch();

  // Check user authentication status on app load
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
