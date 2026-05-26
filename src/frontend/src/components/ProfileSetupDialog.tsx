import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCheckUsername, useSetProfile } from "../hooks/useQueries";
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_USERNAME_LENGTH,
} from "../utils/constants";

interface ProfileSetupDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  currentUsername?: string;
  currentDisplayName?: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]*$/;

export function ProfileSetupDialog({
  open,
  onOpenChange,
  currentUsername,
  currentDisplayName,
}: ProfileSetupDialogProps) {
  const [username, setUsername] = useState(currentUsername ?? "");
  const [displayName, setDisplayName] = useState(currentDisplayName ?? "");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate: setProfile, isPending } = useSetProfile();
  const isEditing = !!currentUsername;

  const usernameValid =
    username.length >= 3 &&
    username.length <= MAX_USERNAME_LENGTH &&
    USERNAME_REGEX.test(username);

  const { data: isAvailable, isLoading: isCheckingUsername } =
    useCheckUsername(debouncedUsername);

  // If editing and username unchanged, it's "available" (it's ours)
  const isOwnUsername =
    isEditing &&
    currentUsername?.toLowerCase() === debouncedUsername.toLowerCase();
  const usernameAvailable = isOwnUsername || isAvailable === true;

  useEffect(() => {
    if (open) {
      setUsername(currentUsername ?? "");
      setDisplayName(currentDisplayName ?? "");
      setDebouncedUsername(currentUsername ?? "");
      setError(null);
    }
  }, [open, currentUsername, currentDisplayName]);

  // Debounce username availability check
  useEffect(() => {
    if (!usernameValid) return;
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 400);
    return () => clearTimeout(timer);
  }, [username, usernameValid]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError(null);
  };

  const canSubmit =
    usernameValid &&
    usernameAvailable &&
    !isCheckingUsername &&
    displayName.trim().length > 0 &&
    displayName.trim().length <= MAX_DISPLAY_NAME_LENGTH &&
    !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setProfile(
      { username: username.trim(), displayName: displayName.trim() },
      {
        onSuccess: () => {
          onOpenChange?.(false);
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Failed to save profile",
          );
        },
      },
    );
  };

  const showUsernameStatus =
    username.length > 0 && usernameValid && debouncedUsername === username;

  return (
    <Dialog open={open} onOpenChange={isEditing ? onOpenChange : undefined}>
      <DialogContent showCloseButton={isEditing} className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Profile" : "Welcome to Français Flashcards!"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your profile information."
                : "Set up your Français Flashcards profile to start learning French."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  @
                </span>
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleUsernameChange(e.target.value)
                  }
                  maxLength={MAX_USERNAME_LENGTH}
                  autoFocus
                  className="pl-7"
                  disabled={isPending}
                />
                {showUsernameStatus && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : usernameAvailable ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {username.length > 0 && !USERNAME_REGEX.test(username)
                  ? "Only letters, numbers, and underscores"
                  : username.length > 0 && username.length < 3
                    ? "Must be at least 3 characters"
                    : showUsernameStatus &&
                        !isCheckingUsername &&
                        !usernameAvailable
                      ? "Username is already taken"
                      : "3-20 characters, letters, numbers, and underscores"}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your Display Name"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDisplayName(e.target.value)
                }
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground text-right">
                {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Saving..." : isEditing ? "Save" : "Get Started"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
