import * as React from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export function SettingsPage() {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, availability defaults, notifications, and security.
        </p>
      </div>

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
                <Input defaultValue={user.fullName} />
              </div>
              <div>
                <Label>Email</Label>
                <Input defaultValue={user.email} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input defaultValue={user.phone} />
              </div>
              <div>
                <Label>Specialization</Label>
                <Input defaultValue={user.specialization} />
              </div>
              <div>
                <Label>Years of experience</Label>
                <Input type="number" defaultValue={user.yearsOfExperience} />
              </div>
              <div>
                <Label>Consultation fee (VND)</Label>
                <Input type="number" defaultValue={user.consultationFee} />
              </div>
              <div>
                <Label>Languages</Label>
                <Input defaultValue={user.languages.join(", ")} />
              </div>
              <div className="md:col-span-2">
                <Label>Bio</Label>
                <Textarea rows={4} defaultValue={user.bio} />
              </div>
              <div className="md:col-span-2">
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Default session settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Default session length (min)</Label>
                <Input type="number" defaultValue={50} step={5} />
              </div>
              <div>
                <Label>Buffer between sessions (min)</Label>
                <Input type="number" defaultValue={10} step={5} />
              </div>
              <div className="md:col-span-2">
                <Button>Save</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "New bookings",
                "Cancellations",
                "New messages",
                "Permission grants",
                "Mood alerts",
                "License renewal reminders",
              ].map((label) => (
                <div key={label} className="flex items-center justify-between rounded-md border p-3">
                  <span>{label}</span>
                  <div className="flex items-center gap-3">
                    <Toggle label="Email" defaultOn />
                    <Toggle label="In-app" defaultOn />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="license">
          <Card>
            <CardHeader>
              <CardTitle>License</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="font-medium">{user.licenseNumber}</p>
                <p className="text-xs text-muted-foreground">
                  Issued by {user.licenseAuthority}
                </p>
                <p className="mt-1 text-xs">
                  Expires{" "}
                  <strong>{format(parseISO(user.licenseExpiresAt), "PP")}</strong>
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="success">Verified</Badge>
                  <Button size="sm" variant="outline">
                    Upload renewal
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Verification history</p>
                <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                  <li>15/02/2024 — Verified by admin@umatter.health</li>
                  <li>10/02/2024 — Application submitted</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Current password</Label>
                  <Input type="password" />
                </div>
                <div>
                  <Label>New password</Label>
                  <Input type="password" />
                </div>
                <div>
                  <Label>Confirm</Label>
                  <Input type="password" />
                </div>
              </div>
              <Button>Change password</Button>
              <hr />
              <div>
                <h3 className="text-sm font-semibold">Active sessions</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-center justify-between rounded-md border p-2">
                    <span>Windows · Chrome · Ho Chi Minh City (this device)</span>
                    <Badge variant="success">Current</Badge>
                  </li>
                  <li className="flex items-center justify-between rounded-md border p-2">
                    <span>iPhone · Safari · Da Nang</span>
                    <Button size="sm" variant="ghost">Sign out</Button>
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="mt-3">
                  Sign out all other devices
                </Button>
              </div>
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
    </div>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = React.useState(!!defaultOn);
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}
