import { type ReactNode } from "react";
import { Navigate } from "react-router";
import { useGame } from "@/lib/useGame";

export default function GameGuard({ children }: { children: ReactNode }) {
  const { game } = useGame();

  if (game === null) {
    return <Navigate to="/start" replace />;
  }
  return <>{children}</>;
}
