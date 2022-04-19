/* eslint-disable @typescript-eslint/member-ordering */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BusinessService } from '../../../services/business.service';
import { Business } from '../../../interfaces/business';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

interface Item {
  id?: string;
  name?: string;
  age?: number;
}

@Component({
  selector: 'app-list-business',
  templateUrl: './list-business.page.html',
  styleUrls: ['./list-business.page.scss'],
})
export class ListBusinessPage implements OnInit, OnDestroy {

  items: Item[];
  messageFirebase: string;
  orderBy = 'nameOrganization';
  directionOrderBy = 'asc';
  businesses: Business[];

  constructor(private route: ActivatedRoute,
    private businessService: BusinessService,
    private router: Router) {
  }

  ngOnInit() {
    this.messageFirebase = null;

    this.route.queryParams.subscribe((params: Params) => {

      this.getAllMyBusinesses();
      if (params.deletedBusiness) {
        this.messageFirebase = 'Business successfully deleted';
      }

      if (params.createdBusiness !== undefined) {
        this.messageFirebase = 'Business successfully created';
      }
    }, error => {
      console.log('you got error ');
      console.log(error);
    });

  }


  orderByName(): void {
    if (this.orderBy === 'nameOrganization') {

      if (this.directionOrderBy === 'desc') {
        this.directionOrderBy = 'asc';
      } else {
        this.directionOrderBy = 'desc';
      }
    } else {
      this.orderBy = 'nameOrganization';
      this.directionOrderBy = 'asc';
    }
  }

  orderByAddress(): void {
    if (this.orderBy === 'city') {

      if (this.directionOrderBy === 'desc') {
        this.directionOrderBy = 'asc';
      } else {
        this.directionOrderBy = 'desc';
      }
    } else {
      this.orderBy = 'city';
      this.directionOrderBy = 'asc';
    }

  }

  // get all ID business which are my /
  private getAllMyBusinesses(): void {
    this.businessService.getAllMyBusinesses()
      .subscribe(businesses => {

        //businesses.map(businesses=> businesses.filter((business) => business.nameOrganization))
        this.businesses = businesses.filter((business) => business.nameOrganization);

      }, error => {
        console.log(error);
      });
  }

  chooseBusiness(business: Business): void {

    if (business.id !== null) {
      this.router.navigate(['/detail-business'],
        { queryParams: { businessId: business.id } });
    }
  }

  ngOnDestroy(): void {
    this.messageFirebase = '';
  }


}
