// Remembers which pricing-section plan a visitor clicked, so the signup flow —
// both the RegisterModal and the /register page — can pre-select it at the
// "Plan" step (step 3).
//
// Client-only. The chosen plan also travels to /register as a `?plan=` query
// param; this sessionStorage copy is the fallback that additionally covers the
// modal (which has no URL to carry it). sessionStorage survives the navigation
// to /register but not a browser restart, and each selection is consumed once so
// it can't go stale and silently pre-select a plan on an unrelated later signup.

const KEY = "resthru:selectedPlanId";

/** Record the plan a visitor clicked in the pricing section. */
export function recordSelectedPlan(planId: string) {
  if (!planId) return;
  try {
    sessionStorage.setItem(KEY, planId);
  } catch {
    /* storage unavailable (private mode / SSR) — the ?plan= param still works */
  }
}

/** Read the recorded plan and clear it, so it's used at most once. */
export function consumeSelectedPlan(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    if (value) sessionStorage.removeItem(KEY);
    return value || null;
  } catch {
    return null;
  }
}
