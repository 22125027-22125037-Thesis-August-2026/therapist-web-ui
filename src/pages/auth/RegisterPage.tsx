import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileUp, HeartPulse, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

type FileSlot = { name: string; size: number } | null;

function FileDrop({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FileSlot;
  onChange: (f: FileSlot) => void;
}) {
  const id = React.useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground hover:bg-muted/50"
      >
        <FileUp className="h-5 w-5" />
        {value ? (
          <span className="font-medium text-foreground">
            {value.name} · {(value.size / 1024).toFixed(0)} KB
          </span>
        ) : (
          <span>Drag and drop PDF / JPG / PNG, or click to browse (≤10 MB)</span>
        )}
      </label>
      <input
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange({ name: f.name, size: f.size });
        }}
      />
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
    specialization: "",
    bio: "",
    yearsOfExperience: 0,
    consultationFee: 0,
    licenseNumber: "",
    licenseAuthority: "",
  });
  const [licenseDoc, setLicenseDoc] = React.useState<FileSlot>(null);
  const [govId, setGovId] = React.useState<FileSlot>(null);
  const [agreed, setAgreed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setField = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!licenseDoc || !govId) {
      setError("Both License document and Government ID are required.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the terms.");
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dob: form.dob,
        password: form.password,
        specialization: form.specialization,
        bio: form.bio,
        yearsOfExperience: Number(form.yearsOfExperience),
        consultationFee: Number(form.consultationFee),
        licenseNumber: form.licenseNumber,
        licenseAuthority: form.licenseAuthority,
      });
      navigate("/license-pending");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <HeartPulse className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Apply for a therapist account</h1>
          <p className="text-sm text-muted-foreground">
            We review every application. Expect 1-3 business days.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  required
                  value={form.dob}
                  onChange={(e) => setField("dob", e.target.value)}
                />
              </div>
              <div />
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                />
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Adolescent CBT, anxiety, family therapy"
                  value={form.specialization}
                  onChange={(e) => setField("specialization", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="yoe">Years of experience</Label>
                <Input
                  id="yoe"
                  type="number"
                  min={0}
                  value={form.yearsOfExperience}
                  onChange={(e) => setField("yearsOfExperience", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="fee">Consultation fee (VND)</Label>
                <Input
                  id="fee"
                  type="number"
                  min={0}
                  step={50000}
                  value={form.consultationFee}
                  onChange={(e) => setField("consultationFee", Number(e.target.value))}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                License verification
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="licenseNumber">License number</Label>
                  <Input
                    id="licenseNumber"
                    required
                    value={form.licenseNumber}
                    onChange={(e) => setField("licenseNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="licenseAuthority">Issuing authority / country</Label>
                  <Input
                    id="licenseAuthority"
                    required
                    value={form.licenseAuthority}
                    onChange={(e) => setField("licenseAuthority", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FileDrop label="License document" value={licenseDoc} onChange={setLicenseDoc} />
                <FileDrop label="Government ID" value={govId} onChange={setGovId} />
              </div>
            </section>

            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed((e.target as HTMLInputElement).checked)}
              />
              <span className="text-muted-foreground">
                I confirm the information provided is accurate and agree to uMatter's terms and
                data handling policy.
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between">
              <Link to="/login" className="text-sm text-muted-foreground hover:underline">
                ← Back to login
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
