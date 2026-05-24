import * as React from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PermissionBadge } from "@/components/PermissionBadge";
import { RiskBadge } from "@/components/StatusBadge";
import { initials } from "@/lib/utils";
import { mockPatients } from "@/lib/mockData";

export function PatientsListPage() {
  const [search, setSearch] = React.useState("");
  const [onlyGranted, setOnlyGranted] = React.useState(false);
  const [tag, setTag] = React.useState("");

  const allTags = Array.from(new Set(mockPatients.flatMap((p) => p.tags))).sort();

  const filtered = mockPatients.filter((p) => {
    if (onlyGranted && !p.permission.theyGaveMeAccess) return false;
    if (tag && !p.tags.includes(tag)) return false;
    if (search && !p.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {mockPatients.length} patients shown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyGranted}
              onChange={(e) => setOnlyGranted(e.target.checked)}
            />
            Only with permission
          </label>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Age</th>
                <th className="p-3 text-left">Primary concern</th>
                <th className="p-3 text-left">Last session</th>
                <th className="p-3 text-left">Next session</th>
                <th className="p-3 text-left">Access</th>
                <th className="p-3 text-left">Risk</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(p.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          to={`/patients/${p.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.fullName}
                        </Link>
                        <div className="flex gap-1 pt-0.5">
                          {p.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{p.age}</td>
                  <td className="p-3 text-muted-foreground">{p.primaryConcern}</td>
                  <td className="p-3 text-muted-foreground">
                    {p.lastSessionAt ? format(parseISO(p.lastSessionAt), "PP") : "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {p.nextSessionAt ? format(parseISO(p.nextSessionAt), "PP") : "—"}
                  </td>
                  <td className="p-3">
                    <PermissionBadge granted={p.permission.theyGaveMeAccess} />
                  </td>
                  <td className="p-3">
                    <RiskBadge level={p.riskLevel} />
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/patients/${p.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    No patients match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
