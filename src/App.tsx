import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { CareerShell } from '@/components/career-shell';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ProgressProvider } from '@/context/progress-context';
import { Login, Register } from '@/pages/auth-pages';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Applications, Dashboard, Discover, DSA, Practice, Profile, SettingsPage, SoftSkills } from '@/pages/career-pages';
import MockInterview from '@/pages/mock-interview';
import InterviewRoadmap from '@/pages/interview-roadmap';
import ResumeAnalyzer from '@/pages/resume-analyzer';
import Leaderboard from '@/pages/leaderboard';
import {
  Route,
  Redirect,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  const { user } = useAuth();

  if (!user) {
    return <Switch>
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route><Redirect to="/login" /></Route>
    </Switch>;
  }

  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <CareerShell>
        <Switch>
          <Route path="/login"><Redirect to="/" /></Route>
          <Route path="/register"><Redirect to="/" /></Route>
          <Route path="/" component={Dashboard} />
          <Route path="/discover" component={Discover} />
          <Route path="/job-swipe"><Redirect to="/discover" /></Route>
          <Route path="/mock-interview" component={MockInterview} />
          <Route path="/interview-roadmap" component={InterviewRoadmap} />
          <Route path="/practice" component={Practice} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/interview"><Redirect to="/mock-interview" /></Route>
          <Route path="/interview-prep"><Redirect to="/mock-interview" /></Route>
          <Route path="/resume" component={ResumeAnalyzer} />
          <Route path="/career-dna"><Redirect to="/soft-skills" /></Route>
          <Route path="/soft-skills" component={SoftSkills} />
          <Route path="/dsa" component={DSA} />
          <Route path="/applications" component={Applications} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </CareerShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <ProgressProvider>
              <Router />
            </ProgressProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
