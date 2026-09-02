"use client";

import dynamic from "next/dynamic";
import GameLoader from "./loading-game";

const Game = dynamic(() => import("@/components/Game"), {
  loading: () => <GameLoader />,
  ssr: false,
});

export default function ClientPage() {
  return <Game />;
}
