import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { GenderProvider } from "./context/GenderContext.jsx";
import { ScrollExpandImagesProvider } from "./context/ScrollExpandImagesContext.jsx";
import { GuestCartProvider } from "./context/GuestCartContext.jsx";
import { BulkCartProvider } from "./context/BulkCartContext.jsx";

// The browser's own back/forward scroll restoration and this app's route-change
// scroll reset (see App.jsx's ScrollToTop) both want to control scroll position
// on navigation. Left on 'auto', the browser restores the *previous* page's
// scroll offset natively -- often instantly, before React has even remounted
// the new route -- landing the fresh page deep-scrolled into a section whose
// scroll-driven layout (e.g. CategoryScrollStack's pinned transforms) hasn't
// been computed for that offset yet, which reads as a blank/frozen page until
// the user scrolls it back into a sane position themselves. Disabling native
// restoration makes ScrollToTop the single source of truth for scroll
// position on every navigation, including browser Back/Forward.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <GenderProvider>
            <ToastProvider>
              <AuthProvider>
                <GuestCartProvider>
                  <BulkCartProvider>
                    <ScrollExpandImagesProvider>
                      <App />
                    </ScrollExpandImagesProvider>
                  </BulkCartProvider>
                </GuestCartProvider>
              </AuthProvider>
            </ToastProvider>
          </GenderProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
