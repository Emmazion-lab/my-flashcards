import { TooltipProvider } from "@/components/ui/tooltip";
import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { router } from "./router";

export default function App() {
  useEffect(() => {
    if (window.location.hash.includes("caffeineAdminToken")) {
      window.location.hash = "#/";
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
