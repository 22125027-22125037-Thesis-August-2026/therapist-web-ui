import { Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PermissionBadgeProps {
  granted: boolean;
  className?: string;
}

export function PermissionBadge({ granted, className }: PermissionBadgeProps) {
  return (
    <Badge
      variant={granted ? "success" : "muted"}
      className={className}
      role="status"
      aria-label={granted ? "Data access granted by patient" : "Data access not granted"}
    >
      {granted ? (
        <>
          <Unlock className="mr-1 h-3 w-3" aria-hidden="true" /> Access
        </>
      ) : (
        <>
          <Lock className="mr-1 h-3 w-3" aria-hidden="true" /> No access
        </>
      )}
    </Badge>
  );
}
