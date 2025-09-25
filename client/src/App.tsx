import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/authContext";
import PrimeNavbar from './components/PrimeNavbar';
import MovieRow from './components/MovieRow';
import Home from "@/pages/home";
import Setup from "@/pages/setup";
import Login from "@/pages/login";
import Preferences from "@/pages/preferences";
import Questionnaire from "@/pages/questionnaire";
import Profile from "@/pages/profile";
import UserProfile from "./UserProfile";
import UserPublicProfile from "@/pages/UserPublicProfile";
import UploadProject from "@/pages/upload-project";
import SavedProjects from "@/pages/saved-projects";
import Feed from "@/pages/feed";
import Recommendations from "@/pages/recommendations";
import Browse from "@/pages/browse";
import Search from "@/pages/search";
import Watch from "@/pages/watch";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/setup" component={Setup} />
      <Route path="/login" component={Login} />
      <Route path="/preferences" component={Preferences} />
      <Route path="/questionnaire" component={Questionnaire} />
      <Route path="/profile" component={Profile} />
      <Route path="/user-profile" component={UserProfile} />
      <Route path="/user/:userId" component={UserPublicProfile} />
      <Route path="/upload-project" component={UploadProject} />
      <Route path="/upload" component={UploadProject} />
      <Route path="/saved" component={SavedProjects} />
      <Route path="/feed" component={Feed} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/browse" component={Browse} />
      <Route path="/search" component={Search} />
      <Route path="/watch/:id" component={Watch} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const showNavbar = location !== '/setup' && location !== '/preferences' && location !== '/login' && location !== '/questionnaire' && location !== '/profile' && location !== '/upload-project' && location !== '/upload' && location !== '/saved' && location !== '/feed' && location !== '/recommendations' && location !== '/browse' && location !== '/search' && !location.startsWith('/watch/') && location !== '/admin' && !location.startsWith('/user/');

  return (
    <div className="App">
      {showNavbar && <PrimeNavbar />}
      <Toaster />
      <Router />
      {showNavbar && <MovieRow />}
    </div>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
