import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, LogOut, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function LicensePendingPage() {
  const { user, logout, setStatus } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border-l-4 border-warning bg-warning/10 p-6">
        <h1 className="text-xl font-semibold">Your license is being reviewed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimated time: <span className="font-medium">1–3 business days</span>. You'll receive
          an email when {user?.fullName ?? "your account"} is approved.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Submitted documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">License document</p>
                <p className="text-xs text-muted-foreground">license.pdf · 1.2 MB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Replace document
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Government ID</p>
                <p className="text-xs text-muted-foreground">id_front.jpg · 800 KB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Replace document
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="gap-2">
          <Mail className="h-4 w-4" /> Contact support
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus("ACTIVE");
              navigate("/");
            }}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" /> Simulate approval (demo)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
