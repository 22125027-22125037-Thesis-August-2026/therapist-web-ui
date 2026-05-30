import * as React from "react";
import { format, parseISO } from "date-fns";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import {
  changePassword,
  getLicense,
  renewLicense,
  updateProfile,
  uploadAvatar,
  type LicenseResponse,
} from "@/lib/api/auth";

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { lang, setLang } = useI18n();
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState(() => ({
    fullName: user?.fullName ?? "",
    phoneNumber: user?.phone ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    specialization: user?.specialization ?? "",
    bio: user?.bio ?? "",
    yearsOfExperience: user?.yearsOfExperience ?? 0,
    consultationFee: user?.consultationFee ?? 0,
    languages: (user?.languages ?? []).join(", "),
  }));

  React.useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        phoneNumber: user.phone,
        avatarUrl: user.avatarUrl ?? "",
        specialization: user.specialization ?? "",
        bio: user.bio ?? "",
        yearsOfExperience: user.yearsOfExperience,
        consultationFee: user.consultationFee,
        languages: user.languages.join(", "),
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateProfile({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        avatarUrl: form.avatarUrl || undefined,
        specialization: form.specialization || undefined,
        bio: form.bio || undefined,
        yearsOfExperience: Number(form.yearsOfExperience),
        consultationFee: Number(form.consultationFee),
        languages: form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      updateUser({
        fullName: updated.fullName,
        phone: updated.phoneNumber ?? form.phoneNumber,
        avatarUrl: updated.avatarUrl ?? form.avatarUrl,
        specialization: updated.specialization ?? form.specialization,
        bio: updated.bio ?? form.bio,
        yearsOfExperience: updated.yearsOfExperience ?? Number(form.yearsOfExperience),
        consultationFee: updated.consultationFee ?? Number(form.consultationFee),
        languages:
          updated.languages ?? form.languages.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setMessage("Profile updated.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const { url } = await uploadAvatar(file);
      setForm((f) => ({ ...f, avatarUrl: url }));
      updateUser({ avatarUrl: url });
      setMessage("Avatar uploaded. Click Save to persist other profile changes.");
    } catch (err: any) {
      setError(err?.message ?? "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, license, notifications, and security.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-success/40 bg-success/5 p-3 text-sm text-success">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="license">License</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Full name</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={form.avatarUrl}
                    placeholder="https://..."
                    onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                  />
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent">
                    {uploadingAvatar && <Loader2 className="h-3 w-3 animate-spin" />}
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Specialization</Label>
                <Input
                  value={form.specialization}
                  onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                />
              </div>
              <div>
                <Label>Years of experience</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.yearsOfExperience}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, yearsOfExperience: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <Label>Consultation fee (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  step={50000}
                  value={form.consultationFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, consultationFee: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Languages (comma-separated, e.g. vi, en)</Label>
                <Input
                  value={form.languages}
                  onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Bio</Label>
                <Textarea
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                You receive every kind of notification — bookings, cancellations, new messages,
                permission grants, mood alerts, and license-renewal reminders. Per-channel
                toggles are not currently available.
              </p>
              <p className="text-xs">
                View all notifications from the bell icon in the top bar.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="license">
          <LicenseTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>Language</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Button variant={lang === "vi" ? "default" : "outline"} onClick={() => setLang("vi")}>
                Tiếng Việt
              </Button>
              <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>
                English
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LicenseTab() {
  const [license, setLicense] = React.useState<LicenseResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [renewLicenseNumber, setRenewLicenseNumber] = React.useState("");
  const [renewAuthority, setRenewAuthority] = React.useState("");
  const [renewExpiresAt, setRenewExpiresAt] = React.useState("");
  const [renewFile, setRenewFile] = React.useState<File | null>(null);
  const [renewMsg, setRenewMsg] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lic = await getLicense();
      setLicense(lic);
      setRenewLicenseNumber(lic.licenseNumber ?? "");
      setRenewAuthority(lic.licenseAuthority ?? "");
      setRenewExpiresAt(lic.licenseExpiresAt ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load license");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    setRenewMsg(null);
    try {
      const updated = await renewLicense({
        document: renewFile ?? undefined,
        licenseNumber: renewLicenseNumber || undefined,
        licenseAuthority: renewAuthority || undefined,
        licenseExpiresAt: renewExpiresAt || undefined,
      });
      setLicense(updated);
      setRenewFile(null);
      setRenewMsg("Renewal submitted. License is now PENDING_VERIFICATION.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit renewal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>License</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : license ? (
          <div className="rounded-md border p-3">
            <p className="font-medium">{license.licenseNumber ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              Issued by {license.licenseAuthority ?? "—"}
            </p>
            {license.licenseExpiresAt && (
              <p className="mt-1 text-xs">
                Expires{" "}
                <strong>{format(parseISO(license.licenseExpiresAt), "PP")}</strong>
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <LicenseStatusBadge status={license.status} />
              {license.documentUrl && (
                <Button asChild size="sm" variant="link" className="h-auto p-0 text-xs">
                  <a href={license.documentUrl} target="_blank" rel="noreferrer">
                    View document
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {renewMsg && (
          <div className="rounded-md border border-success/40 bg-success/5 p-3 text-xs text-success">
            {renewMsg}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>License number</Label>
            <Input
              value={renewLicenseNumber}
              onChange={(e) => setRenewLicenseNumber(e.target.value)}
            />
          </div>
          <div>
            <Label>Issuing authority</Label>
            <Input value={renewAuthority} onChange={(e) => setRenewAuthority(e.target.value)} />
          </div>
          <div>
            <Label>Expires at</Label>
            <Input
              type="date"
              value={renewExpiresAt}
              onChange={(e) => setRenewExpiresAt(e.target.value)}
            />
          </div>
          <div>
            <Label>Renewal document (PDF / JPG / PNG)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setRenewFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit renewal
        </Button>
      </CardContent>
    </Card>
  );
}

function LicenseStatusBadge({ status }: { status: LicenseResponse["status"] }) {
  if (status === "VERIFIED")
    return (
      <Badge variant="success" className="gap-1">
        <ShieldCheck className="h-3 w-3" /> Verified
      </Badge>
    );
  if (status === "PENDING_VERIFICATION")
    return (
      <Badge variant="warning" className="gap-1">
        <ShieldAlert className="h-3 w-3" /> Pending review
      </Badge>
    );
  if (status === "REJECTED")
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldAlert className="h-3 w-3" /> Rejected
      </Badge>
    );
  return (
    <Badge variant="destructive" className="gap-1">
      <ShieldAlert className="h-3 w-3" /> Expired
    </Badge>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleChange = async () => {
    setError(null);
    setMessage(null);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && <p className="text-sm text-success">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Current password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Confirm</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleChange} disabled={busy || !currentPassword || !newPassword}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Change password
        </Button>
      </CardContent>
    </Card>
  );
}
