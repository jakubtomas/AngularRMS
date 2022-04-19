import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { OrderBusinessesPipe } from './pipes/order-businesses.pipe';
import { OrderByOpeningHoursPipe } from './pipes/order-by-opening-hours.pipe';
import { FormatMeetingPipe } from './shared/shared/pipes/format-meeting.pipe';
import { SharedModule } from './shared/shared/shared.module';
// import { OrderBusinessesPipe } from './order-businesses.pipe';

@NgModule({
  declarations: [AppComponent, OrderByOpeningHoursPipe],
  entryComponents: [],
  imports: [BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    //AngularFireDatabaseModule
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    SharedModule

  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {
}
