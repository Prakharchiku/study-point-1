import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Create the root element before rendering
const rootElement = document.getElementById("root");

// Simple rendering without StudyProvider for debugging
createRoot(rootElement!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
