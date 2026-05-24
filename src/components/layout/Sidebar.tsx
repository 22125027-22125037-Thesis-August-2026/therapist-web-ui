import { NavLink } from "react-router-dom";
import {
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  NotebookPen,
  Settings,
  Users,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/availability", label: "Availability", icon: CalendarClock },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/clinical-notes", label: "Clinical Notes", icon: NotebookPen },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">uMatter</div>
          <div className="text-xs text-muted-foreground">Therapist console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Primary">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <it.icon className="h-4 w-4" aria-hidden="true" />
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4 text-xs text-muted-foreground">
        <p>uMatter Therapist v0.1</p>
        <p>© 2026</p>
      </div>
    </aside>
  );
}
