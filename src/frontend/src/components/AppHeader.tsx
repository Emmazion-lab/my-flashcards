import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Globe, Library, LogOut, Pencil } from "lucide-react";
import { useState } from "react";
import { useProfile } from "../hooks/useQueries";
import { ProfileSetupDialog } from "./ProfileSetupDialog";

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { identity, clear, login } = useInternetIdentity();
  const { data: profile } = useProfile();
  const [editNameOpen, setEditNameOpen] = useState(false);

  const isAuthenticated = !!identity;
  const hasProfile = isAuthenticated && profile && profile.username;

  const handleLogout = () => {
    queryClient.clear();
    clear();
    navigate({ to: "/" });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        className="border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between"
        style={{ backgroundColor: "#003f87" }}
      >
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="font-display font-bold text-white text-xl tracking-tight hover:text-white/90 transition-colors flex items-center gap-2"
            data-ocid="app.logo_link"
          >
            <span role="img" aria-label="French flag">
              🇫🇷
            </span>
            Français Flashcards
          </button>
          <nav className="hidden sm:flex items-center gap-1">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/" })}
                className={cn(
                  "text-sm",
                  isActive("/")
                    ? "text-white font-medium bg-white/20 hover:bg-white/25"
                    : "text-white/70 hover:text-white hover:bg-white/10",
                )}
                data-ocid="nav.my_decks_link"
              >
                My Decks
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate({
                  to: "/browse",
                  search: { q: "", category: "", sort: "popular", page: 0 },
                })
              }
              className={cn(
                "text-sm",
                isActive("/browse")
                  ? "text-white font-medium bg-white/20 hover:bg-white/25"
                  : "text-white/70 hover:text-white hover:bg-white/10",
              )}
              data-ocid="nav.browse_link"
            >
              Browse
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {hasProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0 hover:bg-white/10"
                  data-ocid="app.user_menu_button"
                >
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarFallback
                      className="text-sm font-bold"
                      style={{ backgroundColor: "#ef3b36", color: "#ffffff" }}
                    >
                      {profile.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{profile.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setEditNameOpen(true)}
                  data-ocid="app.edit_profile_button"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  data-ocid="app.logout_button"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => login()}
              className="text-white/80 hover:text-white hover:bg-white/10"
              data-ocid="app.sign_in_button"
            >
              Sign in
            </Button>
          ) : null}
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
        <nav className="flex items-center justify-around py-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                isActive("/") ? "font-medium" : "text-muted-foreground",
              )}
              style={isActive("/") ? { color: "#003f87" } : {}}
              data-ocid="nav.my_decks_tab"
            >
              <Library className="h-5 w-5" />
              My Decks
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/browse",
                search: { q: "", category: "", sort: "popular", page: 0 },
              })
            }
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
              isActive("/browse") ? "font-medium" : "text-muted-foreground",
            )}
            style={isActive("/browse") ? { color: "#003f87" } : {}}
            data-ocid="nav.browse_tab"
          >
            <Globe className="h-5 w-5" />
            Browse
          </button>
        </nav>
      </div>

      {isAuthenticated && (
        <ProfileSetupDialog
          open={editNameOpen}
          onOpenChange={setEditNameOpen}
          currentUsername={profile?.username}
          currentDisplayName={profile?.displayName}
        />
      )}
    </>
  );
}
