import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-blue-700 p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
            <HeartPulse className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold">uMatter</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight">
            A calm, clinical workspace for the people you care for.
          </h1>
          <p className="max-w-md text-white/80">
            Manage your appointments, review your patients' tracking data when consented, and
            keep clinical notes in one private place.
          </p>
        </div>
        <p className="text-sm text-white/60">© 2026 uMatter Health. Vietnam.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Sign in to your console</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Licensed therapists only. Patients sign in through the mobile app.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have a therapist account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
