import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Survey from "./pages/Survey";
import Insights from "./pages/Insights";
import Stack from "./pages/Stack";
import Catalog from "./pages/Catalog";
import Learning from "./pages/Learning";
import Admin from "./pages/Admin";
import ToolDetail from "./pages/ToolDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/kartlegging" element={<Survey />} />
            <Route path="/innsikt" element={<Insights />} />
            <Route path="/stack" element={<Stack />} />
            <Route path="/katalog" element={<Catalog />} />
            <Route path="/katalog/:toolId" element={<ToolDetail />} />
            <Route path="/laering" element={<Learning />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
