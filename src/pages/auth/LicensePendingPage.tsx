import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Loader2, LogOut, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { getLicense, type LicenseResponse } from "@/lib/api/auth";

export function LicensePendingPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [license, setLicense] = React.useState<LicenseResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lic = await getLicense();
      setLicense(lic);
      if (lic.status === "VERIFIED") {
        await refreshUser();
        navigate("/", { replace: true });
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load license status");
    } finally {
      setLoading(false);
    }
  }, [navigate, refreshUser]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border-l-4 border-warning bg-warning/10 p-6">
        <h1 className="text-xl font-semibold">
          {license?.status === "REJECTED"
            ? "Your license application was rejected"
            : license?.status === "EXPIRED"
              ? "Your license has expired"
              : "Your license is being reviewed"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {license?.status === "REJECTED"
            ? "Contact support to discuss next steps, or upload an updated document."
            : license?.status === "EXPIRED"
              ? "Submit your renewal documents so we can verify the new expiry."
              : "Estimated time: 1–3 business days. You'll receive an email when your account is approved."}{" "}
          {user?.fullName ? `(${user.fullName})` : ""}
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>License status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {license && (
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    license.status === "PENDING_VERIFICATION"
                      ? "warning"
                      : license.status === "REJECTED" || license.status === "EXPIRED"
                        ? "destructive"
                        : "success"
                  }
                >
                  {license.status}
                </Badge>
                {license.documentUrl && (
                  <Button asChild size="sm" variant="link" className="h-auto p-0 text-xs">
                    <a href={license.documentUrl} target="_blank" rel="noreferrer">
                      <FileText className="h-3 w-3" /> View document
                    </a>
                  </Button>
                )}
              </div>
              {license.licenseNumber && (
                <p className="mt-2 text-xs text-muted-foreground">
                  License {license.licenseNumber}
                  {license.licenseAuthority ? ` · ${license.licenseAuthority}` : ""}
                </p>
              )}
              {license.licenseExpiresAt && (
                <p className="text-xs text-muted-foreground">
                  Expires {format(parseISO(license.licenseExpiresAt), "PP")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="gap-2">
          <Mail className="h-4 w-4" /> Contact support
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Check status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
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
