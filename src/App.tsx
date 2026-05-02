import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyForm from "./pages/CompanyForm";
import CompanyDetail from "./pages/CompanyDetail";
import Audits from "./pages/Audits";
import AuditDetail from "./pages/AuditDetail";
import Registry from "./pages/Registry";
import Actions from "./pages/Actions";
import Library from "./pages/Library";
import ClientActions from "./pages/ClientActions";
import CalendarPage from "./pages/Calendar";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/entreprises" element={<Companies />} />
              <Route path="/entreprises/nouveau" element={<CompanyForm />} />
              <Route path="/entreprises/:id" element={<CompanyDetail />} />
              <Route path="/entreprises/:id/edit" element={<CompanyForm />} />
              <Route path="/audits" element={<Audits />} />
              <Route path="/audits/:id" element={<AuditDetail />} />
              <Route path="/registre" element={<Registry />} />
              <Route path="/actions" element={<Actions />} />
              <Route path="/bibliotheque" element={<Library />} />
              <Route path="/calendrier" element={<CalendarPage />} />
              <Route path="/portail/actions" element={<ClientActions />} />
              <Route path="/portail/calendrier" element={<CalendarPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
