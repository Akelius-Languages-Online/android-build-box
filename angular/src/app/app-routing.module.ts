import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {Error404Component} from './error404/error404.component';
import {ServerErrorComponent} from "./server-error/server-error.component";

const title = 'Build Box';

const routes: Routes = [
  {path: '', component: DashboardComponent, title: `${title} - Dashboard`},
  {path: 'server-error', component: ServerErrorComponent, title: `${title} - Server Error`},
  {path: '**', component: Error404Component, title: `${title} - Error 404`},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
