import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2 } from "lucide-react";
import type React from "react";
import { createActor } from "../backend";
import { useProfile } from "../hooks/useQueries";
import { AppHeader } from "./AppHeader";
import { ProfileSetupDialog } from "./ProfileSetupDialog";

export function StudyLayout({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor(createActor);
  const isAuthenticated = !!identity;

  const { data: profile, isLoading: isProfileLoading } = useProfile();

  if (isInitializing || !actor || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasProfile = isAuthenticated && profile && profile.username;

  return (
    <>
      {isAuthenticated && !isProfileLoading && !hasProfile && (
        <ProfileSetupDialog open />
      )}
      <div className="min-h-screen flex flex-col bg-background pb-14 sm:pb-0">
        <AppHeader />
        {children}
      </div>
    </>
  );
}
