import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LockedCardProps {
  patientName: string;
  onRequestAccess?: () => void;
  pending?: boolean;
}

export function LockedCard({ patientName, onRequestAccess, pending }: LockedCardProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-muted p-3">
          <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium">Data access not granted</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {patientName} has not granted you read access to this category. You will see their data
            here only after they approve your request on their app.
          </p>
        </div>
        {onRequestAccess && (
          <Button
            size="sm"
            variant={pending ? "secondary" : "default"}
            disabled={pending}
            onClick={onRequestAccess}
          >
            {pending ? "Request pending…" : "Request data access"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
