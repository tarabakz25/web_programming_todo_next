'use client';

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="flex justify-between py-4 px-8">
      <div className="text-2xl font-bold font-orbitron">ACnew</div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">通知</span>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
