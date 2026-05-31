import { type ReactNode } from "react";
import { Navigate } from "react-router";
import { getCookie } from "@/lib/utils";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 7;

const hasValidGame = (): boolean => {
  const raw = getCookie("countPlayers");
  if (raw === null) return false;
  const count = Number(raw);
  return Number.isInteger(count) && count >= MIN_PLAYERS && count <= MAX_PLAYERS;
};

export default function GameGuard({ children }: { children: ReactNode }) {
  if (!hasValidGame()) {
    return <Navigate to="/start" replace />;
  }
  return <>{children}</>;
}
