import * as React from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockNotes } from "@/lib/mockData";

export function ClinicalNotesListPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");

  const filtered = mockNotes
    .filter((n) => (status === "all" ? true : n.status.toLowerCase() === status))
    .filter((n) =>
      search ? n.patientName.toLowerCase().includes(search.toLowerCase()) : true,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clinical notes</h1>
          <p className="text-sm text-muted-foreground">
            Your private working record. Patients never see these.
          </p>
        </div>
        <Button asChild>
          <Link to="/clinical-notes/new">New note</Link>
        </Button>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="finalized">Finalized</TabsTrigger>
          </TabsList>
          <Input
            placeholder="Search by patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Appointment</th>
                <th className="p-3 text-left">Summary</th>
                <th className="p-3 text-left">Last edited</th>
                <th className="p-3 text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">{format(parseISO(n.createdAt), "PP")}</td>
                  <td className="p-3 font-medium">
                    <Link
                      to={`/patients/${n.patientId}`}
                      className="hover:underline"
                    >
                      {n.patientName}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {n.appointmentId ? (
                      <Link
                        to={`/appointments/${n.appointmentId}`}
                        className="text-primary hover:underline"
                      >
                        {n.appointmentId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {n.summary ?? "(no summary)"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {format(parseISO(n.updatedAt), "PP HH:mm")}
                  </td>
                  <td className="p-3">
                    <Badge variant={n.status === "FINALIZED" ? "default" : "warning"}>
                      {n.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/clinical-notes/${n.id}`}
                      className="text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    No notes match.
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
