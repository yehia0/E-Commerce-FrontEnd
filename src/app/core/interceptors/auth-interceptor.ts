import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  let token: string | null = null;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    token = localStorage.getItem('token');
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }

        const currentUrl = router.url;
        const isAdminRoute = currentUrl.includes('/admin');

        if (isAdminRoute) {
          router.navigate(['/admin-login'], {
            queryParams: { returnUrl: currentUrl }
          });
        } else {
          router.navigate(['/login'], {
            queryParams: { returnUrl: currentUrl }
          });
        }
      }

      if (error.status === 403) {
        const currentUrl = router.url;
        if (currentUrl.includes('/admin')) {
          router.navigate(['/admin-login']);
        } else {
          router.navigate(['/']);
        }
      }

      return throwError(() => error);
    })
  );
};
