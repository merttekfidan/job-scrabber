# HuntIQ — Auth System Rebuild Plan

## URGENT — This plan addresses critical production bugs

The authentication system has 6 confirmed bugs and several design flaws that cause session inconsistencies between the web app and Chrome extension. The extension shows users as "connected" when they are logged out, logout silently fails, and production cookies may not reach the extension at all.

This plan replaces the entire auth system. Every auth-related file will be deleted and rewritten from scratch.

---

## Bug Inventory (Current System)

### BUG 1 — Extension has ZERO logout capability

**Severity**: Critical
**Location**: `extension/popup.js` (entire file — no logout handler exists)
**Impact**: When a user logs out from the web dashboard, the extension continues showing the old email. There is no logout button, no logout event listener, and `chrome.storage.local.userEmail` is never cleared.

### BUG 2 — Cookie domain blocks extension access

**Severity**: Critical
**Location**: `auth.config.js` line 24
```javascript
domain: process.env.NODE_ENV === 'production' ? '.huntiq.work' : undefined,
```
**Impact**: Chrome extensions operate under `chrome-extension://[ID]` origin. Cookies scoped to `.huntiq.work` domain may not be sent with extension requests in production, causing all extension API calls to return 401 silently.

### BUG 3 — Duplicate `sameSite` key in cookie config

**Severity**: Medium
**Location**: `auth.config.js` lines 32-33
```javascript
options: {
    sameSite: 'none',
    sameSite: 'none',   // BUG: duplicate key, likely should be httpOnly or something else
```
**Impact**: JavaScript silently takes the last value. If the first was intended to be `httpOnly: true`, it's lost.

### BUG 4 — Auth callback path typo (NOW FIXED in latest read)

**Severity**: Low (appears fixed in current code)
**Location**: `auth.config.js` line 56 — currently reads `'/login'` which is correct.
**Note**: Previously reported as `'login'` (missing leading `/`). Verify in production deployment.

### BUG 5 — Extension uses `callGroqAPI` instead of `callAIWithPool`

**Severity**: Medium
**Location**: `app/api/extension/process/route.js` line 65
```javascript
const aiResponse = await callGroqAPI(prompt, 0.2, session.user.id);
```
**Impact**: Extension bypasses the multi-provider AI pool system. If Groq is rate-limited or down, extension fails instead of falling back to Claude/Gemini/OpenRouter. All other AI endpoints use `callAIWithPool`.

### BUG 6 — Stale session state in extension

**Severity**: High
**Location**: `extension/popup.js` line 126
```javascript
chrome.storage.local.set({ userEmail: data.user.email });
```
**Impact**: `userEmail` is written on successful auth check but NEVER cleared. After web logout, extension still shows old email until the popup is reopened and `/api/stats` returns 401.

### DESIGN FLAW — No session endpoint for extension

The extension checks auth by calling `/api/stats` (a business endpoint) instead of a dedicated auth status endpoint. This couples authentication logic with business logic and makes it impossible to get clean auth status without loading stats data.

### DESIGN FLAW — 90-day bypass returns code to client

**Location**: `app/api/auth/send-otp/route.js` lines 55-58
```javascript
return NextResponse.json({
    success: true,
    bypass: true,
    bypassCode,     // SECURITY: sending auth code to client
});
```
**Impact**: The bypass code is sent in the API response body, then the client auto-submits it. This means the authentication code travels through the network in a JSON response, which is less secure than OTP-only flow.

---

## Files to DELETE (Complete Removal)

These files will be deleted and rewritten from scratch:

| File | Lines | Reason |
|------|-------|--------|
| `auth.config.js` | 70 | Cookie bugs, design flaws, being rewritten |
| `auth.js` | 104 | Entangled with buggy config, new clean setup |
| `middleware.js` | 70 | Mixed CORS + auth concerns, needs separation |
| `app/actions.js` | 21 | Server action for auth, will be rewritten |
| `app/login/page.js` | 211 | Login page, will be TypeScript |
| `app/api/auth/send-otp/route.js` | 95 | OTP endpoint, security improvements needed |
| `app/api/auth/[...nextauth]/route.js` | ~10 | NextAuth handler, trivial rewrite |
| `extension/popup.js` | 292 | No logout, stale state, needs auth overhaul |
| `extension/background.js` | 174 | Auth handling improvements needed |
| `extension/popup.html` | ~100 | Adding logout button to UI |

**Total**: ~1,147 lines deleted and rewritten

## Files to KEEP (No Changes)

| File | Reason |
|------|--------|
| `extension/content.js` | No auth logic, purely extracts page content |
| `extension/config.js` | Simple config, works fine |
| `extension/manifest.json` | Keep, but may need `cookies` permission added |
| `lib/email.js` | Email sending works, no auth coupling |
| `lib/rate-limit.js` | Rate limiting works independently |
| `lib/validations.js` | Zod schemas work, keep `SendOTPSchema` |
| Database `verification_codes` table | Schema is fine, no changes |
| Database `users` table | Schema is fine, no changes |

---

## New Architecture

### Design Principles

1. **Extension uses the same cookie mechanism** — but cookies must be configured correctly for cross-origin extension access
2. **Dedicated session endpoint** — `/api/auth/session` for clean auth status checks
3. **Extension has explicit logout** — button + handler + storage cleanup
4. **No bypass codes in response body** — 90-day bypass handled server-side only
5. **CORS and Auth middleware separated** — clear single-responsibility
6. **All files TypeScript** — type safety from day one

### Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                            │
│                                                              │
│  User enters email                                           │
│       │                                                      │
│       ▼                                                      │
│  POST /api/auth/send-otp                                     │
│       │                                                      │
│       ├── New user / >90 days ──► Send 6-digit OTP email     │
│       │                            │                         │
│       │                            ▼                         │
│       │                      User enters code                │
│       │                            │                         │
│       │                            ▼                         │
│       │                   POST /api/auth/[...nextauth]       │
│       │                      (credentials provider)          │
│       │                            │                         │
│       └── <90 days ──► Auto-login server-side (no bypass     │
│                        code in response)                     │
│                            │                                 │
│                            ▼                                 │
│                    JWT cookie set                             │
│                    Redirect to /dashboard                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTENSION AUTH FLOW                        │
│                                                              │
│  Popup opens                                                 │
│       │                                                      │
│       ▼                                                      │
│  GET /api/auth/session  (credentials: 'include')             │
│       │                                                      │
│       ├── 200 + user data ──► Show "Connected: user@email"   │
│       │                       Store email in chrome.storage   │
│       │                                                      │
│       └── 401 / no user ──► Clear chrome.storage             │
│                              Show "Login Required" link       │
│                                                              │
│  User clicks Logout button in extension                      │
│       │                                                      │
│       ▼                                                      │
│  POST /api/auth/signout  (NextAuth endpoint)                 │
│       │                                                      │
│       ▼                                                      │
│  Clear chrome.storage.local (userEmail, applications cache)  │
│  Update UI to "Disconnected"                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     LOGOUT FLOW                              │
│                                                              │
│  Web App logout (Dashboard)                                  │
│       │                                                      │
│       ▼                                                      │
│  signOut() from next-auth/react                              │
│  Cookie cleared, redirect to /login                          │
│                                                              │
│  Extension (next popup open)                                 │
│       │                                                      │
│       ▼                                                      │
│  GET /api/auth/session → 401                                 │
│  Clear chrome.storage                                        │
│  Show "Login Required"                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1 — New `auth.config.ts`

**File**: `auth.config.ts` (replaces `auth.config.js`)

Key changes from current:
- Remove `domain` attribute from cookies (fixes extension cookie access)
- Fix `sameSite: 'lax'` for session token (more secure default)
- Use `sameSite: 'none'` ONLY if extension cross-origin requires it
- Remove duplicate key bug
- TypeScript with proper NextAuth types
- Clean `authorized` callback

```typescript
// auth.config.ts - key cookie configuration
cookies: {
    sessionToken: {
        name: process.env.NODE_ENV === 'production'
            ? '__Secure-authjs.session-token'
            : 'authjs.session-token',
        options: {
            httpOnly: true,
            sameSite: 'none' as const,  // Required for cross-origin extension requests
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            // NO domain attribute — this is the critical fix
            // Removing domain makes the cookie available to the exact host only,
            // which the browser WILL send with credentialed extension requests
        },
    },
    csrfToken: {
        name: process.env.NODE_ENV === 'production'
            ? '__Host-authjs.csrf-token'
            : 'authjs.csrf-token',
        options: {
            httpOnly: true,
            sameSite: 'none' as const,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        },
    },
},
```

**Critical change**: Removing `domain: '.huntiq.work'`. When no `domain` is set, the cookie is a "host-only" cookie for the exact hostname. Browsers correctly send host-only cookies with credentialed cross-origin requests from extensions, but may NOT send domain-scoped cookies. This single change likely fixes the extension auth issue.

### Step 2 — New `auth.ts`

**File**: `auth.ts` (replaces `auth.js`)

Key changes:
- TypeScript with proper types
- Credentials provider with improved error handling
- Error messages no longer swallowed by `catch → return null`
- Session callback properly typed

```typescript
// The authorize function should throw errors, not return null silently
async authorize(credentials): Promise<User | null> {
    const { email, code } = credentials as { email: string; code: string };
    
    if (!email || !code) {
        throw new Error("Email and code are required.");
    }
    
    // ... OTP verification logic (same as current, but typed)
    
    // IMPORTANT: throw errors with clear messages instead of returning null
    // Current code catches errors and returns null, which NextAuth converts
    // to a generic "CredentialsSignin" error, losing the specific message
}
```

### Step 3 — New `middleware.ts`

**File**: `middleware.ts` (replaces `middleware.js`)

Current middleware mixes CORS handling with auth. New version separates concerns:

```typescript
// middleware.ts — clean separation
export default auth(async function middleware(req) {
    const response = applyCorsHeaders(req);
    
    // Auth is handled by the auth() wrapper automatically
    // No manual auth logic needed here
    
    return response;
});

function applyCorsHeaders(req: NextRequest): NextResponse {
    // CORS logic isolated here
}
```

Key changes:
- TypeScript
- CORS logic extracted to helper function
- Extension origin pattern validation stays
- No business logic in middleware

### Step 4 — New `app/api/auth/send-otp/route.ts`

**File**: `app/api/auth/send-otp/route.ts` (replaces `.js`)

Key changes:
- TypeScript with typed request/response
- 90-day bypass NO LONGER returns bypassCode to client
- Instead, bypass sets a temporary session cookie server-side, or auto-calls signIn

```typescript
// BEFORE (insecure):
return NextResponse.json({
    success: true,
    bypass: true,
    bypassCode,  // Auth code in response body!
});

// AFTER (secure):
// Server-side auto-login for 90-day bypass
if (isWithin90Days) {
    // Generate code, verify it internally, create session
    // Return redirect or success without exposing the code
    return NextResponse.json({
        success: true,
        autoLogin: true,
        // No code in response
    });
}
```

### Step 5 — New `app/actions.ts`

**File**: `app/actions.ts` (replaces `.js`)

```typescript
'use server'

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(
    prevState: string | undefined,
    formData: FormData
): Promise<string | undefined> {
    try {
        await signIn("credentials", {
            email: formData.get('email') as string,
            code: formData.get('code') as string,
            redirectTo: "/dashboard",  // Changed from "/" to "/dashboard"
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return error.cause?.err?.message || "Authentication failed.";
        }
        throw error;
    }
}

export async function handleSignOut(): Promise<void> {
    await signOut({ redirectTo: "/login" });
}
```

### Step 6 — New `app/login/page.tsx`

**File**: `app/login/page.tsx` (replaces `.js`)

Key changes:
- TypeScript
- Handle `autoLogin` response from bypass (no bypassCode on client)
- Better error display
- Shadcn/UI components (if Phase 4 done, otherwise Tailwind)
- Proper loading states

### Step 7 — New `app/api/auth/[...nextauth]/route.ts`

**File**: Trivial rewrite

```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

### Step 8 — Extension `popup.js` Rewrite

**CRITICAL CHANGES**:

1. **Add logout button** to popup HTML and JS
2. **Clear storage on 401** — when any API call returns 401, clear local state immediately
3. **Check `/api/auth/session`** instead of `/api/stats` for auth status
4. **Logout handler** calls signout endpoint and clears storage

```javascript
// NEW: Logout handler
async function handleLogout() {
    try {
        const baseUrl = CONFIG.BACKEND_URL;
        
        // Call NextAuth signout endpoint
        // This is a GET to /api/auth/signout which returns a CSRF token,
        // then POST with the token to actually sign out
        const csrfRes = await fetch(baseUrl + '/api/auth/csrf', {
            credentials: 'include'
        });
        const { csrfToken } = await csrfRes.json();
        
        await fetch(baseUrl + '/api/auth/signout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `csrfToken=${csrfToken}`
        });
    } catch (e) {
        console.error('Logout API failed:', e);
    }
    
    // Always clear local state regardless of API success
    await chrome.storage.local.remove(['userEmail']);
    
    // Update UI
    updateUIToLoggedOut();
}

// NEW: Auth check uses dedicated session endpoint
async function checkConnection() {
    try {
        const response = await fetch(CONFIG.BACKEND_URL + '/api/auth/session', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            // Clear stale state
            await chrome.storage.local.remove(['userEmail']);
            updateUIToLoggedOut();
            return;
        }
        
        const session = await response.json();
        
        if (session?.user?.email) {
            updateUIToLoggedIn(session.user.email);
            chrome.storage.local.set({ userEmail: session.user.email });
        } else {
            await chrome.storage.local.remove(['userEmail']);
            updateUIToLoggedOut();
        }
    } catch (error) {
        await chrome.storage.local.remove(['userEmail']);
        updateUIToLoggedOut();
    }
}
```

### Step 9 — Extension `popup.html` Update

Add logout button to the UI:

```html
<!-- Add to user status section -->
<button id="logoutBtn" class="logout-btn hidden" title="Sign Out">
    <!-- Logout icon SVG -->
</button>
```

Show logout button when connected, hide when disconnected.

### Step 10 — Extension `background.js` Rewrite

Key changes:
- On 401 from any API call, send message to popup to update state
- Use `callAIWithPool` endpoint fix (not direct, but the backend route should use it)
- Better error messages for auth failures

### Step 11 — Fix Extension Process Route

**File**: `app/api/extension/process/route.js` line 65

```javascript
// BEFORE:
import { callGroqAPI, parseAIResponse } from '@/lib/ai';
const aiResponse = await callGroqAPI(prompt, 0.2, session.user.id);

// AFTER:
import { callAIWithPool } from '@/lib/ai-router';
import { parseAIResponse } from '@/lib/ai';
const aiResponse = await callAIWithPool(prompt, 0.2, session.user.id);
```

This ensures extension users benefit from the multi-provider fallback system.

### Step 12 — Extension `manifest.json` Update

May need to add `cookies` permission if the extension needs to read/clear cookies directly:

```json
{
    "permissions": [
        "activeTab",
        "storage",
        "scripting",
        "cookies"   // NEW: if needed for direct cookie management
    ]
}
```

---

## Testing Checklist

### Web App Auth Tests

- [ ] Fresh user can enter email and receive OTP
- [ ] OTP code validates and creates account on first login
- [ ] Existing user (<90 days) gets auto-login bypass
- [ ] Existing user (>90 days) gets OTP flow
- [ ] Wrong OTP code shows clear error message
- [ ] Expired OTP code shows clear error message
- [ ] Used OTP code shows clear error message
- [ ] Rate limiting works (5 requests / 15 minutes per IP)
- [ ] After login, user redirected to `/dashboard` (not `/`)
- [ ] Logout from dashboard clears session cookie
- [ ] After logout, visiting `/dashboard` redirects to `/login`
- [ ] After logout, visiting `/` shows landing page

### Extension Auth Tests

- [ ] Opening extension popup when logged in shows email + green dot
- [ ] Opening extension popup when logged out shows "Login Required" link
- [ ] "Login Required" link opens web app login page in new tab
- [ ] After web login, reopening extension popup shows "Connected"
- [ ] Logout button in extension is visible when connected
- [ ] Clicking logout button clears session and shows "Login Required"
- [ ] After web logout, reopening extension shows "Login Required" (not stale email)
- [ ] Extension "Apply" button works when authenticated
- [ ] Extension "Apply" shows "Not logged in" error when unauthenticated
- [ ] Extension auth works in production (huntiq.work domain)
- [ ] Extension auth works in development (localhost:3000)

### Cookie Tests

- [ ] Session cookie is set without `domain` attribute
- [ ] Session cookie has `SameSite=None; Secure` for cross-origin extension access
- [ ] Session cookie is `httpOnly` (not accessible via JavaScript)
- [ ] Cookie is sent with extension `credentials: 'include'` requests
- [ ] Cookie is cleared on signOut (both web and extension)

### Edge Cases

- [ ] User opens extension, then logs out in web, then clicks Apply → clean 401 message
- [ ] User logs in on web, opens extension, extension shows connected
- [ ] Two browser tabs: logout in one, other tab's API calls fail gracefully
- [ ] Extension on chrome:// or new tab page → does not crash
- [ ] Rate limit on OTP → clear countdown message

---

## Execution Order

```
Step 1:  auth.config.ts        (cookie fix — the root cause)
Step 2:  auth.ts               (clean NextAuth setup)
Step 3:  middleware.ts          (CORS separation)
Step 4:  send-otp/route.ts     (secure bypass)
Step 5:  actions.ts            (typed server actions)
Step 6:  login/page.tsx        (TypeScript login page)
Step 7:  [...nextauth]/route.ts (trivial)
Step 8:  extension/popup.js    (logout + session check)
Step 9:  extension/popup.html  (logout button UI)
Step 10: extension/background.js (401 handling)
Step 11: extension/process route (AI pool fix)
Step 12: extension/manifest.json (permissions if needed)
```

**Total files changed**: 12
**Estimated time**: 1-2 days
**Risk**: High (production auth) — test thoroughly before deploying

### Deployment Strategy

1. Deploy backend changes first (Steps 1-7, 11)
2. Test web app auth thoroughly
3. Update extension (Steps 8-10, 12)
4. Test extension against production
5. Publish extension update to Chrome Web Store

---

## Summary of Key Fixes

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Extension logout not working | No logout handler exists | Add logout button + handler + storage cleanup |
| Extension shows stale email | `userEmail` never cleared | Clear on 401 and on explicit logout |
| Cookie not reaching extension | `domain: '.huntiq.work'` | Remove domain attribute (host-only cookie) |
| Duplicate sameSite key | Copy-paste error | Rewrite cookie config from scratch |
| Extension bypasses AI pool | Uses `callGroqAPI` directly | Switch to `callAIWithPool` |
| Bypass code in response | Insecure design | Handle bypass server-side, don't expose code |
| Auth check via /api/stats | Wrong endpoint | Use `/api/auth/session` (NextAuth built-in) |
