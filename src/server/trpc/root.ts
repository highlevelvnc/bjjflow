import "server-only"
import { router, createCallerFactory } from "./init"
import { academyRouter } from "./routers/academy"
import { memberRouter } from "./routers/member"
import { inviteRouter } from "./routers/invite"
import { classRouter } from "./routers/class"
import { sessionRouter } from "./routers/session"
import { attendanceRouter } from "./routers/attendance"
import { checkinRouter } from "./routers/checkin"
import { portalRouter } from "./routers/portal"
import { billingRouter } from "./routers/billing"
import { techniqueRouter } from "./routers/technique"
import { contractRouter } from "./routers/contract"
import { eventRouter } from "./routers/event"
import { announcementRouter } from "./routers/announcement"
import { inventoryRouter } from "./routers/inventory"

export const appRouter = router({
  academy: academyRouter,
  member: memberRouter,
  invite: inviteRouter,
  class: classRouter,
  session: sessionRouter,
  attendance: attendanceRouter,
  checkin: checkinRouter,
  portal: portalRouter,
  billing: billingRouter,
  technique: techniqueRouter,
  contract: contractRouter,
  event: eventRouter,
  announcement: announcementRouter,
  inventory: inventoryRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
