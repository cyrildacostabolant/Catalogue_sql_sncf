import { Routes } from '@angular/router';
import { AuthComponent } from './auth';
import { LayoutComponent } from './layout';
import { AdminUsersComponent } from './admin/users';
import { AdminCategoriesComponent } from './admin/categories';
import { AdminQueriesComponent } from './admin/queries';
import { AdminQueryEditorComponent } from './admin/query-editor';
import { CatalogComponent } from './catalog/catalog';
import { QueryDetailComponent } from './catalog/query-detail';
export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'catalog', pathMatch: 'full' },
      { path: 'catalog', component: CatalogComponent },
      { path: 'catalog/:id', component: QueryDetailComponent },
      { path: 'admin/users', component: AdminUsersComponent },
      { path: 'admin/categories', component: AdminCategoriesComponent },
      { path: 'admin/queries', component: AdminQueriesComponent },
      { path: 'admin/queries/new', component: AdminQueryEditorComponent },
      { path: 'admin/queries/:id', component: AdminQueryEditorComponent },
    ]
  }
];
