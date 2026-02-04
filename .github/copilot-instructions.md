# Copilot Instructions: Urban Style E-Commerce Frontend

## Project Overview
**Urban Style** is an Angular 20 standalone component-based e-commerce application with SSR (Server-Side Rendering), featuring role-based user and admin interfaces.

### Key Architecture
- **Framework**: Angular 20 with standalone components (no NgModules)
- **Styling**: SCSS with utility functions in `src/styles/`
- **Backend API**: Express server at `http://localhost:5000` (proxied via `proxy.conf.json`)
- **Authentication**: JWT tokens stored in localStorage; includes user and admin login flows
- **Deployment**: Universal/SSR support via `@angular/ssr`

## Critical Patterns & Conventions

### 1. Service Architecture
All services are located in `src/app/core/services/` and follow naming convention: lowercase filename (e.g., `auth.ts` exports class `Auth`).

**Key services:**
- `auth.ts` - JWT token management, dual login flows (user/admin), role handling
- `product.ts` - Product filtering, sorting, pagination
- `cart.ts` - Shopping cart state management
- `order.ts` - Order creation and tracking
- `user.ts` - User profile management

**Service pattern:**
```typescript
@Injectable({ providedIn: 'root' })
export class ServiceName {
  private apiUrl = `${environment.apiUrl}/endpoint`;
  // BehaviorSubject for reactive state
  private stateSubject = new BehaviorSubject<Type>(initialValue);
  public state$ = this.stateSubject.asObservable();
}
```

### 2. Component Structure
Features are in `src/app/features/` with isolated `components/` subdirectories. Standalone components import dependencies directly via `imports` array.

**Routing uses lazy loading:**
```typescript
{ path: 'route', loadComponent: () => import('./feature/component').then(m => m.Component) }
```

### 3. Guards & Authentication
- `auth-guard.ts` - Protects routes requiring login (redirect to `/auth/login`)
- `admin-guard.ts` - Protects admin routes (redirect to `/admin-login` on 401)
- Auth state: Check `authService.isLoggedIn()` and `currentUser$` observable for role

**User object includes role field** - use for conditional rendering:
```typescript
@if (authService.currentUser$ | async as user) {
  @if (user.role === 'admin') { /* admin UI */ }
}
```

### 4. HTTP & Interceptors
- `auth-interceptor.ts` - Auto-attaches Bearer token, handles 401 redirects (splits admin/user flows)
- `error-interceptor.ts` - Global error handling
- Requests to `/api/*` are proxied to backend in development

**Always check `environment.apiUrl`** for endpoint construction.

### 5. Admin Layout
Admin routes use separate layout at `src/app/layouts/admin/` with isolated navbar/sidebar. Root component (`app.ts`) conditionally hides user header/footer on admin routes via `isAdminRoute()`.

**Admin route structure:**
```
/admin-login - Admin authentication
/admin - Protected admin dashboard with sidebar navigation
```

### 6. Styling & Design Tokens
- SCSS variables in `src/styles/_variables.scss` (colors, spacing, fonts)
- Mixins in `src/styles/_mixins.scss` (responsive breakpoints, animations)
- Component styles use `styleUrl: './component.scss'` with scoped encapsulation
- Global animations in `src/styles/_animations.scss`

### 7. Data Flow & Models
Models are in `src/app/core/models/` - interface definitions for type safety:
- `user.ts` - User/AuthResponse interfaces
- `product.ts` - Product and filters
- `cart.ts` - CartItem, Cart state
- `order.ts` - Order details

## Development Commands

```bash
ng serve                  # Dev server on localhost:4200 with proxy
ng build                  # Production build (size budgets enforced)
npm run watch             # Watch mode for incremental builds
ng test                   # Run Karma/Jasmine tests
npm run serve:ssr:my-app  # Run SSR server locally
```

## Common Development Workflows

### Adding a New Feature Page
1. Create in `src/app/features/feature-name/` with `.ts`, `.html`, `.scss`
2. Add route to `app.routes.ts` with lazy loading
3. Use `ActivatedRoute` to access route data (e.g., `gender` param in products page)
4. Inject required services and subscribe to `$` observables

### Creating a New Service
1. File: `src/app/core/services/service-name.ts` (lowercase)
2. Export class: PascalCase (e.g., `ServiceName`)
3. Use `BehaviorSubject` for state, expose as `state$` observable
4. Use environment.apiUrl for endpoints

### Adding Route Protection
- Import `authGuard` or `adminGuard` in route definition
- Guards check `authService.isLoggedIn()` and user role
- Failed auth redirects automatically (interceptor handles 401)

## Project-Specific Notes

- **No NgModules**: All components are standalone; import dependencies directly
- **Prettier config**: 100 char width, single quotes, custom Angular HTML parser
- **SSR**: App runs on Node.js server; avoid `window`/`document` without `isPlatformBrowser` checks
- **Dual Auth Flows**: Auth service differentiates user vs admin login routes on 401
- **Role-Based UI**: Check `currentUser$.subscribe(user => user.role)` for conditional features
- **Pagination**: Products page implements pagination with `currentPage` and `itemsPerPage`

## Testing & Debugging

- Unit tests: `src/app/**/*.spec.ts` (Jasmine + Karma)
- Console logs use emoji prefixes (✅, ❌, 🔐, 🔄, etc.) for visual debugging
- Browser DevTools: Check localStorage for `token` and `user` keys on auth issues
- Network tab: Verify proxy works (`/api/*` → `localhost:5000`)

## Integration Points

- **Backend API**: Express server at `http://localhost:5000`, all endpoints under `/api`
- **Marketplace/Third-party**: None currently configured
- **External auth**: None (custom JWT implementation)

---

**Last Updated**: January 2025 | Angular 20.3.13 | Node.js 20+
