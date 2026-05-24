import * as React from "react";
import { Bell, LogOut, Search, User as UserIcon, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { mockNotifications, mockPatients } from "@/lib/mockData";

export function TopBar() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [openSearch, setOpenSearch] = React.useState(false);

  const unread = mockNotifications.filter((n) => !n.read).length;

  const results = q
    ? mockPatients.filter((p) => p.fullName.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpenSearch(true);
          }}
          onFocus={() => setOpenSearch(true)}
          onBlur={() => setTimeout(() => setOpenSearch(false), 150)}
          placeholder="Search patient by name or id…"
          className="pl-9"
          aria-label="Global patient search"
        />
        {openSearch && results.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-20 rounded-md border bg-popover p-1 shadow-md">
            {results.slice(0, 6).map((p) => (
              <button
                key={p.id}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                onMouseDown={() => navigate(`/patients/${p.id}`)}
              >
                <span>{p.fullName}</span>
                <span className="text-xs text-muted-foreground">{p.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Notifications (${unread} unread)`}>
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockNotifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => n.link && navigate(n.link)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{n.title}</span>
                  {!n.read && <Badge variant="default" className="ml-2 h-1.5 w-1.5 p-0" />}
                </div>
                <span className="text-xs text-muted-foreground">{n.body}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(user?.fullName ?? "T")}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-sm font-medium">{user?.fullName}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <UserIcon className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLang(lang === "vi" ? "en" : "vi")}>
              <Globe className="h-4 w-4" />
              Language: {lang === "vi" ? "Tiếng Việt" : "English"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-destructive"
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
