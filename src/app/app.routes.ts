import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { ViewDetails } from './features/view-details/view-details';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then(m => m.Home)
      },
      {
        path: 'men',
        loadComponent: () => import('./features/products/products').then(m => m.Products),
        data: { gender: 'men' }
      },
      {
        path: 'women',
        loadComponent: () => import('./features/products/products').then(m => m.Products),
        data: { gender: 'women' }
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./features/product-details/product-details').then(m => m.ProductDetails)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart').then(m => m.Cart)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout').then(m => m.Checkout),
        canActivate: [authGuard]
      },
      {
        path: 'account',
        loadComponent: () => import('./features/account/account').then(m => m.Account),
        canActivate: [authGuard]
      },
      {
        path: 'order-tracking/:id',
        loadComponent: () => import('./features/order-tracking/order-tracking').then(m => m.OrderTracking),
        canActivate: [authGuard]
      },
      {
  path: 'account/orders/:id',
  component: ViewDetails,
  canActivate: [authGuard]
},
      {
        path: 'about',
        loadComponent: () => import('./features/about/about').then(m => m.About)
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/contact/contact').then(m => m.Contact)
      },
      {
        path: 'faq',
        loadComponent: () => import('./features/faq/faq').then(m => m.Faq)
      }
    ]
  },

  // User Auth Routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },

  // Admin Auth Route
  {
    path: 'admin-login',
    loadComponent: () => import('./features/auth/adminLogin/admin-login').then(m => m.AdminLogin)
  },

  // Admin Routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./layouts/admin/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'products',
        loadComponent: () => import('./layouts/admin/products/products').then(m => m.AdminProducts)
      },
      {
        path: 'orders',
        loadComponent: () => import('./layouts/admin/orders/orders').then(m => m.Orders)
      },
      {
        path: 'users',
        loadComponent: () => import('./layouts/admin/users/users').then(m => m.Users)
      },
      {
        path: 'categories',
        loadComponent: () => import('./layouts/admin/categories/categories').then(m => m.Categories)
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./layouts/admin/reviews/reviews').then(m => m.AdminReviewsComponent)
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];
