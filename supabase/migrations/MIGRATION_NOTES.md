# Migration Notes — 00001_schema.sql

## 1. Migration Order

```
00001_schema.sql          ← THIS FILE (tables, indexes, constraints, triggers)
00002_rls_policies.sql    ← NEXT (all RLS policies per RLS_MODEL.md)
00003_grants.sql          ← GRANTs on views, role permissions
seed.sql                  ← Dev/test seed data (never run in production)
```

### Internal Dependency Order Within 00001

The SQL is ordered so every FK target exists before the referencing table:

```
1.  Helper functions (no table dependencies)
2.  academies (references auth.users only)
3.  members (references academies, auth.users)
4.  member_belt_history (references academies, members)
5.  invites (references academies, members)
6.  classes (references academies, members)
7.  class_sessions (references academies, classes, members)
8.  techniques (references academies, members)
      ↑ Must be created BEFORE session_techniques
9.  session_techniques (references academies, class_sessions, techniques)
10. attendance (references academies, class_sessions, members)
11. check_ins (references academies, members, class_sessions)
12. technique_media (references academies, techniques)
13. subscriptions (references academies)
14. payments (references academies, subscriptions)
15. student_plans (references academies, members)
16. notifications (references academies, members)
17. automations (references academies, members)
18. automation_runs (references academies, automations)
19. automation_logs (references academies, automation_runs, members)
20. ai_insights (references academies, members)
21. ai_insight_actions (references academies, ai_insights, members)
22. audit_log (references academies, members)
23. ownership_transfers (references academies, auth.users)
24. academy_public VIEW (references academies)
25. ENABLE RLS on all tables (must be last — tables must exist)
```

## 2. Schema Assumptions

```
A-1  Supabase manages auth.users.
     We never CREATE or ALTER the auth.users table. We only
     reference it via FK. Supabase Auth handles user creation,
     email verification, password hashing, and JWT issuance.

A-2  pgcrypto is available.
     gen_random_uuid() and gen_random_bytes() require pgcrypto.
     Supabase enables it by default. The CREATE EXTENSION is
     explicit for self-hosted compatibility.

A-3  All timestamps are timestamptz (UTC).
     Application layer converts to academy timezone for display.
     Database stores everything in UTC.

A-4  UUIDs for all primary keys.
     No serial/bigserial IDs. UUIDs prevent enumeration attacks
     and are safe for distributed systems / future sharding.

A-5  Soft delete strategy varies by table:
     - academies: status = 'deleted'
     - members: status = 'inactive' or 'suspended'
     - classes: is_active = false
     - class_sessions: status = 'cancelled'
     - student_plans: status = 'cancelled'
     - invites: revoked_at timestamp
     - automations: is_active = false
     Hard delete is reserved for LGPD/GDPR compliance
     (executed via service role by ops team).

A-6  The subscriptions.billing_interval column was renamed from
     "interval" (the original schema) to avoid conflict with the
     PostgreSQL reserved word INTERVAL.

A-7  techniques.position and techniques.category have NO CHECK
     constraints. Academies define custom taxonomies. Validation
     is at the application layer (Zod schema).

A-8  The belt_stripe_earned notification type (renamed from
     stripe_earned per SCHEMA_REVISION L-4) avoids confusion
     with Stripe payment platform terminology.

A-9  members.created_by is a self-referencing FK. On the first
     member (academy bootstrap), created_by = NULL. This is by
     design — the owner creates themselves.

A-10 The record_belt_promotion() trigger fires BEFORE UPDATE,
     recording the OLD values. This means the history row captures
     what the belt WAS before the promotion, not what it became.
```

## 3. Future-Safe Extension Notes

```
F-1  SHARDING BY academy_id
     Every tenant table has academy_id as the first column in
     composite indexes. This enables future hash-partitioning
     by academy_id with minimal index changes.

F-2  STRIPE CONNECT (student payments via Stripe)
     student_plans.payment_method already has 'stripe' as an option.
     When Stripe Connect is added, new columns will be needed:
       stripe_connected_account_id on academies
       stripe_subscription_id on student_plans
     No current schema change needed.

F-3  MULTI-LANGUAGE CURRICULUM
     techniques.name and techniques.description are plain text.
     For i18n, add a technique_translations table keyed by
     (technique_id, locale). Do NOT change the current schema.

F-4  TOURNAMENT / INTER-ACADEMY FEATURES
     The current schema is strictly single-tenant per table.
     Cross-academy features (tournaments, rankings) require a
     SEPARATE schema (e.g., public_tournaments) with its own
     access model. Do NOT add cross-tenant columns to existing tables.

F-5  CUSTOM ROLES
     The role CHECK constraint ('admin', 'instructor', 'student') can
     be expanded to include custom roles (e.g., 'assistant_instructor',
     'front_desk'). This requires:
       - Expanding the CHECK constraint (migration)
       - Updating permission matrix in app code
       - No RLS changes (RLS only checks tenant, not role)

F-6  FILE STORAGE
     technique_media.url and members.avatar_url currently store URLs.
     When migrating to Supabase Storage, these become storage paths
     (e.g., 'techniques/{academy_id}/{id}/video.mp4'). The column
     type (text) does not need to change.

F-7  REAL-TIME SUBSCRIPTIONS
     Supabase Realtime works with RLS. Clients subscribing to table
     changes only receive rows that pass their RLS policies. No
     additional configuration needed — the policies in 00002 will
     automatically scope real-time events.

F-8  AUDIT LOG ARCHIVAL
     audit_log will grow indefinitely. Plan for:
       - Table partitioning by created_at (range partitioning)
       - Archival to cold storage after 2 years
       - No schema change needed now; partition can be added via
         ALTER TABLE without downtime on PostgreSQL 14+.
```

## 4. Table Count Summary

```
Tables:     22
Views:       1 (academy_public)
Functions:   5 (get_current_academy_id, is_academy_admin, set_updated_at,
                record_belt_promotion, maintain_attendance_count)
Triggers:    9 (7 updated_at + 1 belt_promotion + 1 attendance_count)
```
