/**
 * Centralised route path constants.
 * Use these instead of string literals to prevent typos and ease refactors.
 */
export const ROUTES = {
  // ── Public ──────────────────────────────────────────────────────────────
  HOME: "/",
  PRICING: "/pricing",
  FEATURES: "/features",

  // ── Auth ────────────────────────────────────────────────────────────────
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  INVITE: "/invite",
  CALLBACK: "/callback",

  // ── Onboarding ──────────────────────────────────────────────────────────
  SETUP: "/setup",
  PLAN: "/plan",
  ONBOARDING_COMPLETE: "/complete",

  // ── Dashboard ───────────────────────────────────────────────────────────
  DASHBOARD: "/dashboard",
  SCHEDULE: "/schedule",
  MEMBERS: "/members",
  CURRICULUM: "/curriculum",
  ATTENDANCE: "/attendance",
  BILLING: "/billing",
  AUTOMATIONS: "/automations",
  INSIGHTS: "/insights",
  SETTINGS: "/settings",

  // ── Status ───────────────────────────────────────────────────────────────
  SUSPENDED: "/suspended",
  MEMBER_SUSPENDED: "/member-suspended",
  REACTIVATE: "/reactivate",
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]
