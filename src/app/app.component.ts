/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @angular-eslint/use-lifecycle-interface */
import { Component, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { BusinessService } from './services/business.service';
import { Subject, Subscription } from 'rxjs';
import { UserService } from './services/user.service';
import { UserDetails } from './interfaces/userDetails';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  appPages = [
    {
      title: 'Search Business',
      url: '/search-business',
      icon: 'search'
    },
    {
      title: 'Schedule',
      url: '/calendar-meetings',
      icon: 'calendar'
    },
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'clipboard'
    },

    {
      title: 'My Meetings',
      url: '/meetings',
      icon: 'people'
    }
  ];

  subscription: Subscription;
  businessMode = this.businessService.businessMode$;
  loggedIn = false;
  dark = false;
  firebaseErrorMessage: void;
  userDetails: UserDetails;


  constructor(
    public afAuth: AngularFireAuth,
    private authService: AuthService,
    private businessService: BusinessService,
    private userService: UserService,
    private menu: MenuController
  ) { }

  ngOnInit(): void { }

  getUserDetails(): void {
    this.userService.getUserDetailsInformation().subscribe((userDetails) => {
      this.userDetails = userDetails[0];
    });
  }



  signOut(): void {
    this.authService.signOut().then((result) => {
      if (result == null) {// null is success, false means there was an error
        this.userDetails = null;

      } else {
        this.firebaseErrorMessage = result;
      }
    });

  }

  clickToggle(toggle): void {

    if (toggle.detail.checked) {
      this.businessService.updateBusinessMode(true);
      this.businessService.isActiveMode = true;
    } else {

      this.businessService.updateBusinessMode(false);
      this.businessService.isActiveMode = false;
    }
  }

  ngOnDestroy(): void {
    this.userDetails = null;
  }

}
