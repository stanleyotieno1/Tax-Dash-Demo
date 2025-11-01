
import { SignUp } from './components/sign-up/sign-up';
import { Login } from './components/login/login';
import { MainPage } from './components/main-page/main-page';
import { FileUpLoad } from './components/file-upload/file-upload';
import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout';
import { RiskAnalysis } from './components/risk-analysis/risk-analysis';
import { Reports } from './components/reports/reports';
import { CompanyProfile } from './components/company-profile/company-profile';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'main-page',
        loadComponent: () => import('./components/main-page/main-page').then(m => m.MainPage)
      },
      {
        path: 'file-upload',
        loadComponent: () => import('./components/file-upload/file-upload').then(m => m.FileUpLoad)
      },
      {
        path: "risk-analysis",
        loadComponent: () => import('./components/risk-analysis/risk-analysis').then(m => m.RiskAnalysis)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/reports/reports').then(m => m.Reports)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/company-profile/company-profile').then(m => m.CompanyProfile)
      },
      {
        path: '',
        redirectTo: 'main-page',
        pathMatch: 'full'
      }
    ]
  },
  // Login/Signup routes (without layout)
  {
    path: 'log-in',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./components/sign-up/sign-up').then(m => m.SignUp)
  }
];