import * as React from "react";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { updateProfile, uploadAvatar } from "@/lib/api/auth";

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { lang, setLang } = useI18n();
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState(() => ({
    fullName: user?.fullName ?? "",
    phoneNumber: user?.phone ?? "",
    avatarUrl: user?.avatarUrl ?? "",
  }));

  React.useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        phoneNumber: user.phone,
        avatarUrl: user.avatarUrl ?? "",
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateProfile({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        avatarUrl: form.avatarUrl || undefined,
      });
      updateUser({
        fullName: updated.fullName,
        phone: updated.phoneNumber ?? form.phoneNumber,
        avatarUrl: updated.avatarUrl ?? form.avatarUrl,
      });
      setMessage("Profile updated.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
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
          Manage your profile, availability defaults, notifications, and security.
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
          <TabsTrigger value="availability">Availability</TabsTrigger>
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

              <div className="md:col-span-2 text-xs text-muted-foreground">
                Specialization, bio, years of experience, consultation fee and languages are
                captured on registration but are not yet exposed by the
                <code className="mx-1">PATCH /api/v1/auth/profile</code>
                endpoint.
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Default session settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The backend does not yet expose endpoints for therapist availability defaults
                (session length, buffer, templates). See
                <code className="mx-1">docs/Missing API endpoints.md</code>.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Default session length (min)</Label>
                  <Input type="number" defaultValue={50} step={5} disabled />
                </div>
                <div>
                  <Label>Buffer between sessions (min)</Label>
                  <Input type="number" defaultValue={10} step={5} disabled />
                </div>
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
                Notification preferences (per-channel toggles) are not yet exposed by the
                notification service. The inbox is populated via{" "}
                <code>GET /api/v1/notifications/&#123;profileId&#125;</code> with no per-user
                preferences endpoint.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="license">
          <Card>
            <CardHeader>
              <CardTitle>License</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {user.licenseNumber ? (
                <div className="rounded-md border p-3">
                  <p className="font-medium">{user.licenseNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Issued by {user.licenseAuthority}
                  </p>
                  {user.licenseExpiresAt && (
                    <p className="mt-1 text-xs">
                      Expires{" "}
                      <strong>{format(parseISO(user.licenseExpiresAt), "PP")}</strong>
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="success">
                      {user.status === "ACTIVE" ? "Verified" : user.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  License records are not exposed by{" "}
                  <code>GET /api/v1/auth/me</code> yet. They are captured at registration but
                  not retrievable from the API.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Password change and session-management endpoints are not exposed by the auth
                service yet. See <code>docs/Missing API endpoints.md</code>.
              </p>
              <div className="grid gap-4 md:grid-cols-3 opacity-50">
                <div>
                  <Label>Current password</Label>
                  <Input type="password" disabled />
                </div>
                <div>
                  <Label>New password</Label>
                  <Input type="password" disabled />
                </div>
                <div>
                  <Label>Confirm</Label>
                  <Input type="password" disabled />
                </div>
              </div>
              <Button disabled>Change password</Button>
            </CardContent>
          </Card>
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

      <div className="text-xs text-muted-foreground">Bio area</div>
      <Card>
        <CardContent className="pt-4">
          <Label>Bio (read-only)</Label>
          <Textarea rows={4} value={user.bio} disabled />
        </CardContent>
      </Card>
    </div>
  );
}
