import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { AccountThemeProvider } from "./context/AccountThemeProvider.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import "./index.css";
import { queryClient } from "./queryClient.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* AuthProvider is outermost so the theme bridge can read the signed-in
            user's stored preference and persist changes back to the account. */}
        <AuthProvider>
          <AccountThemeProvider>
            <AppErrorBoundary>
              <App />
            </AppErrorBoundary>
          </AccountThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
