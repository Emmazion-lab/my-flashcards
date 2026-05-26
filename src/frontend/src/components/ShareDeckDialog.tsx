import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Principal } from "@icp-sdk/core/principal";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  CheckCheck,
  Link,
  Loader2,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Visibility } from "../backend";
import {
  useApproveAccess,
  useGetAccessRequests,
  useGetSharedUsers,
  useRejectAccess,
  useSetDeckVisibility,
  useShareDeckWith,
  useUnshareDeckWith,
} from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";

interface SharedUser {
  principal: Principal;
  name: string;
}

interface AccessRequestItem {
  requester: Principal;
  requesterName: string;
  timestamp: bigint;
}

interface ShareDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: bigint;
  visibility: Visibility;
}

export function ShareDeckDialog({
  open,
  onOpenChange,
  deckId,
  visibility,
}: ShareDeckDialogProps) {
  const currentVisibility = visibility as string;
  const [username, setUsername] = useState("");
  const [addError, setAddError] = useState("");
  const [copied, setCopied] = useState(false);

  const { mutate: setVisibility, isPending: isSettingVisibility } =
    useSetDeckVisibility();
  const { mutate: shareDeckWith, isPending: isSharing } = useShareDeckWith();
  const { mutate: unshareDeckWith, isPending: isUnsharing } =
    useUnshareDeckWith();
  const { mutate: approveAccess, isPending: isApproving } = useApproveAccess();
  const { mutate: rejectAccess, isPending: isRejecting } = useRejectAccess();

  const {
    data: sharedUsers,
    isLoading: isLoadingUsers,
    isError: isUsersError,
  } = useGetSharedUsers(deckId);
  const {
    data: accessRequests,
    isLoading: isLoadingRequests,
    isError: isRequestsError,
  } = useGetAccessRequests(deckId);

  const handleVisibilityChange = (value: string) => {
    if (!value || value === currentVisibility) return;
    setVisibility(
      { deckId, visibility: value as Visibility },
      {
        onSuccess: () => {
          toast.success(`Deck visibility set to ${value.toLowerCase()}`);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to change visibility");
        },
      },
    );
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setAddError("Enter a username");
      return;
    }
    setAddError("");
    shareDeckWith(
      { deckId, username: trimmed },
      {
        onSuccess: () => {
          toast.success(`Shared with ${trimmed}`);
          setUsername("");
        },
        onError: (err) => {
          setAddError(err.message || "Failed to share");
        },
      },
    );
  };

  const handleRemoveUser = (principal: Principal, name: string) => {
    unshareDeckWith(
      { deckId, principal },
      {
        onSuccess: () => {
          toast.success(`Removed ${name}`);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to remove user");
        },
      },
    );
  };

  const handleApprove = (requester: Principal, name: string) => {
    approveAccess(
      { deckId, requester },
      {
        onSuccess: () => {
          toast.success(`Approved ${name}`);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to approve");
        },
      },
    );
  };

  const handleReject = (requester: Principal, name: string) => {
    rejectAccess(
      { deckId, requester },
      {
        onSuccess: () => {
          toast.success(`Rejected ${name}`);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reject");
        },
      },
    );
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/deck/${deckId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (open) {
      setUsername("");
      setAddError("");
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Deck</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Visibility</Label>
            <ToggleGroup
              type="single"
              value={currentVisibility}
              onValueChange={handleVisibilityChange}
              disabled={isSettingVisibility}
              className="justify-start"
            >
              <ToggleGroupItem value="Private" className="text-xs">
                Private
              </ToggleGroupItem>
              <ToggleGroupItem value="Public" className="text-xs">
                Public
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              {currentVisibility === "Public"
                ? "Anyone can discover and study this deck."
                : "Only you and people you share with can access this deck."}
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/#/deck/${deckId}`}
              readOnly
              className="flex-1 text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <CheckCheck className="h-4 w-4 text-green-600" />
              ) : (
                <Link className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Add User</Label>
            <form onSubmit={handleAddUser} className="flex gap-2">
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setAddError("");
                }}
                placeholder="Enter exact username"
                disabled={isSharing}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={isSharing}>
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </form>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
          </div>

          <div className="space-y-2">
            <Label>Shared With</Label>
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </div>
            ) : isUsersError ? (
              <p className="text-xs text-destructive">
                Failed to load shared users.
              </p>
            ) : sharedUsers && sharedUsers.length > 0 ? (
              <ScrollArea className="max-h-32">
                <div className="space-y-1">
                  {sharedUsers.map((user: SharedUser) => (
                    <div
                      key={user.name}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="text-sm">{user.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          handleRemoveUser(user.principal, user.name)
                        }
                        disabled={isUnsharing}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-xs text-muted-foreground">
                No users added yet.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Access Requests</Label>
              {accessRequests && accessRequests.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {accessRequests.length}
                </Badge>
              )}
            </div>
            {isLoadingRequests ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </div>
            ) : isRequestsError ? (
              <p className="text-xs text-destructive">
                Failed to load access requests.
              </p>
            ) : accessRequests && accessRequests.length > 0 ? (
              <ScrollArea className="max-h-32">
                <div className="space-y-1">
                  {accessRequests.map((req: AccessRequestItem) => (
                    <div
                      key={req.requesterName}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div>
                        <span className="text-sm font-medium">
                          {req.requesterName}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(fromNanoseconds(req.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600"
                          onClick={() =>
                            handleApprove(req.requester, req.requesterName)
                          }
                          disabled={isApproving || isRejecting}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleReject(req.requester, req.requesterName)
                          }
                          disabled={isApproving || isRejecting}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-xs text-muted-foreground">
                No pending requests.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
