# Dashboard Release Checklist (Block 3 - Production Ready)

## 1. Environment Configuration
- [ ] Ensure `DASHBOARD_CACHE_TTL` is set in `.env` (default: 120).
- [ ] Verify that a cache driver (Redis recommended for production) is configured.

## 2. Database & Migration
- [ ] Run `php artisan migrate` to apply the following indexes:
  - `appointments`: `starts_at`, `status`, `professional_id+starts_at`, `service_id+starts_at`.
  - `charges`: `status`, `due_date`, `appointment_id+status`.
- [ ] (Optional) Run `php artisan db:seed --class=BenchmarkSeeder` in staging to validate performance with 10k+ records.

## 3. Authorization & Security
- [ ] Verify `User` model has a `role` attribute.
- [ ] Confirm Gates (`view-dashboard`, `export-dashboard`) are registered in `AppServiceProvider`.
- [ ] Test `/dashboard/export` with an `operator` account (should return 403).

## 4. Cache Invalidation
- [ ] Verify `AppointmentObserver` and `ChargeObserver` are registered.
- [ ] Test: Create an appointment and check if the dashboard metrics update (cache version should increment).

## 5. Performance Monitoring
- [ ] Check `storage/logs/laravel.log` for "Dashboard Load" entries.
- [ ] Confirm total execution time is within acceptable limits (< 500ms for cached hits).

## 6. Frontend UX
- [ ] Verify search input has 300ms debounce.
- [ ] Test maximum range limit (365 days) triggers a 422 error and displays correctly.
- [ ] Verify "Export CSV" button visibility matches user permissions.
