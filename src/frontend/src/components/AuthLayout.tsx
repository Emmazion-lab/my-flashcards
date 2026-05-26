import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { createActor } from "../backend";
import { useProfile } from "../hooks/useQueries";
import { AppHeader } from "./AppHeader";
import { LandingPage } from "./LandingPage";
import { ProfileSetupDialog } from "./ProfileSetupDialog";

export function AuthLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching, actor } = useActor(createActor);
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useProfile();

  const isAuthenticated = !!identity;
  const hasProfile = profile?.username;

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (isInitializing || !actor || isFetching || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "#003f87" }}
        />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Failed to load profile.</p>
      </div>
    );
  }

  return (
    <>
      <ProfileSetupDialog open={!hasProfile} />
      {hasProfile ? (
        <div className="min-h-screen flex flex-col bg-background pb-14 sm:pb-0">
          <AppHeader />
          <Outlet />
        </div>
      ) : (
        <div className="min-h-screen bg-background" />
      )}
    </>
  );
}
