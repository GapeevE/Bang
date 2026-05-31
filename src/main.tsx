import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import App from '@/components/pages/App.tsx';
import { BrowserRouter, Routes, Route } from "react-router";
import Header from '@/components/blocks/Header.tsx';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Start from '@/components/pages/Start';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <Header />
      <div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/start" element={<Start />} />
          </Routes>
        </BrowserRouter>
      </div>
      <Toaster />
    </TooltipProvider>
  </StrictMode>,
)
