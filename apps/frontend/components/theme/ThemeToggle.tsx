"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/ThemeProvider";

export function ThemeToggle() {
  const { resolved, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={resolved === "dark" ? "Light mode" : "Dark mode"}
    >
      {resolved === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
