import "server-only"
import { router, createCallerFactory } from "./init"
import { academyRouter } from "./routers/academy"
import { memberRouter } from "./routers/member"
import { inviteRouter } from "./routers/invite"
import { classRouter } from "./routers/class"
import { sessionRouter } from "./routers/session"
import { attendanceRouter } from "./routers/attendance"

export const appRouter = router({
  academy: academyRouter,
  member: memberRouter,
  invite: inviteRouter,
  class: classRouter,
  session: sessionRouter,
  attendance: attendanceRouter,
  // Implemented in later weeks per MVP_STRATEGY.md:
  // curriculum: curriculumRouter,
  // billing: billingRouter,
  // studentPlan: studentPlanRouter,
  // notification: notificationRouter,
  // automation: automationRouter,
  // insight: insightRouter,
  // audit: auditRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
