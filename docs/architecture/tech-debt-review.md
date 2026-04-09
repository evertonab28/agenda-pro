# Agenda Pro: Technical Debt Review

This document identifies the most critical technical debts in the system, prioritized by their impact on scalability, maintainability, and reliability.

## Priority P0: Critical Risk (Stability / Accuracy)

### 1. SQL Dialect Leaks in Core Logic
- **Location**: `App\Services\AgendaService@hasConflict` (Lines 68-72)
- **Impact**: Feature parity risk. The system uses different SQL strings for SQLite (testing) and MySQL (production). Complex date math in raw strings is prone to drift.
- **Recommendation**: Abstract date/time calculations into a Query Builder extension or a dedicated DateHelper that detects the driver, or use standard Carbon/Laravel `whereRaw` with consistent syntax if possible.

### 2. Transactional Boundaries in Billing
- **Location**: `App\Services\Billing\WorkspaceBillingService@confirmPayment`
- **Impact**: If `confirmPayment` fails after updating the `WorkspaceBillingInvoice` but before updating the `WorkspaceSubscription`, the workspace stays "active" in the billing provider but "overdue" locally.
- **Recommendation**: Ensure the entire block is wrapped in a DB Transaction (already partially done, but needs verification for all side-effects like Event creation).

## Priority P1: Maintainability & Scaling

### 1. Performance Debt: O(N) Segment Calculation
- **Location**: `App\Services\CRMService@getSegmentCounts` (Lines 52-67)
- **Impact**: Escalates linearly with the number of customers. Querying all customers and calculating segments in PHP will time out for workspaces with >5,000 customers.
- **Recommendation**: Move segmentation logic to a scheduled job that updates a `segment` column on the `Customer` table, or use specialized SQL aggregation.

### 2. Coupling: SaaS Admin vs. Tenant isolation
- **Location**: `App\Http\Controllers\Admin\AdminWorkspaceController@index` (Lines 24, 49, 53)
- **Impact**: Heavy reliance on `withoutGlobalScopes()`. This developer-heavy pattern is error-prone; missing one call can lead to showing zero data to platform admins.
- **Recommendation**: Create a "Read-Only Platform Repository" that explicitly operates on all tenants, removing the need for ad-hoc scope removal in controllers.

### 3. Service Provider Bloat
- **Location**: `App\Providers\AppServiceProvider.php`
- **Impact**: Violation of Single Responsibility. The provider registers dependencies, defines gates, registers observers, and sets up global configuration.
- **Recommendation**: Split into `AuthServiceProvider`, `ObserverServiceProvider`, and `BillingServiceProvider`.

## Priority P2: Refinement & Clarity

### 1. Implicit Event Patterns
- **Location**: Throughout `WorkspaceBillingService` and `CRMService`.
- **Impact**: Inconsistency. Some domains use `WorkspaceSubscriptionEvent::create` (DB-based), while others use Eloquent Observers. Makes it hard to track "What happened across the system?"
- **Recommendation**: Standardize on Laravel Events & Listeners. Commercial logs should be a *listener* to a `SubscriptionActivated` event, not the logic inside the service itself.

### 2. Lack of Typed Payloads
- **Location**: `WorkspaceSubscriptionEvent` model (JSON cast).
- **Impact**: Difficult to maintain payload consistency. Keys are defined as string literals in multiple service files.
- **Recommendation**: Use DTOs (Data Transfer Objects) or Value Objects for event payloads to ensure structure at the code level.

---
*Last updated: 2026-04-09*
