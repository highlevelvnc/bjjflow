import type { Metadata } from "next"
import { LeaderboardClient } from "./LeaderboardClient"
export const metadata: Metadata = { title: "Ranking" }
export default function LeaderboardPage() { return <LeaderboardClient /> }
