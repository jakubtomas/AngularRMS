import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Business } from '../../../interfaces/business';
import { BusinessService } from '../../../services/business.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SearchBusiness } from '../../../interfaces/searchBusiness';

@Component({
  selector: 'app-search-business',
  templateUrl: './search-business.page.html',
  styleUrls: ['./search-business.page.scss'],
})
export class SearchBusinessPage implements OnInit {


  registerForm: FormGroup;
  businesses: Business[];
  business: Business;
  businessId: string;
  firebaseErrorMessage: string;
  typesOrganization = null;
  orderBy = 'nameOrganization';
  searching = false;

  noResultMessage = false;


  get nameOrganization(): FormControl {
    return this.registerForm.get('nameOrganization') as FormControl;
  }


  get zipCode(): FormControl {
    return this.registerForm.get('zipCode') as FormControl;
  }

  get city(): FormControl {
    return this.registerForm.get('city') as FormControl;
  }


  get typeOrganization(): FormControl {
    return this.registerForm.get('typeOrganization') as FormControl;
  }

  constructor(private businessService: BusinessService,
    private router: Router,
    private route: ActivatedRoute) {
  }

  ngOnInit() {

    this.firebaseErrorMessage = null;
    this.typesOrganization = this.getTypesOrganization();
    this.registerForm = new FormGroup(
      {
        nameOrganization: new FormControl(''),
        city: new FormControl(''),
        zipCode: new FormControl(''),
        typeOrganization: new FormControl('', Validators.required),
      });

    this.registerForm.setValue({
      nameOrganization: null,
      city: null,
      zipCode: null,
      typeOrganization: null
    });

  }

  onSubmit(): void {
    this.searching = true;
    const searchValues: SearchBusiness = {
      nameOrganization: this.capitalizeFirstLetter(this.nameOrganization.value),
      city: this.capitalizeFirstLetter(this.city.value),
      zipCode: this.zipCode.value,
      typeOfOrganization: this.typeOrganization.value
    };


    this.getSearchedBusinesses(searchValues);

  }

  getTypesOrganization(): { name: string }[] {
    return this.businessService.typesOfOrganization;
  }

  orderByName(): void {
    if (this.orderBy === 'nameOrganization') {
      this.businesses.reverse();
    } else {
      this.orderBy = 'nameOrganization';
    }
  }

  orderByAddress(): void {
    if (this.orderBy === 'city') {
      this.businesses.reverse();
    } else {
      this.orderBy = 'city';
    }
  }


  getSearchedBusinesses(searchValues: SearchBusiness): void {

    setTimeout(() => {
      if (this.searching) {
        this.searching = false;
        this.noResultMessage = true;
      }
    }, 1800);

    this.businessService.getSearchedBusinesses(searchValues).subscribe(value => {

      this.searching = false;
      this.businesses = value;

      if (this.businesses.length === 0) {
        this.noResultMessage = true;
      } else {
        this.noResultMessage = false;
      }
    }, error => {
      console.error(error);
    });
  }

  chooseBusiness(business: Business): void {

    if (business.id !== null) {
      this.router.navigate(['/detail-business'], { queryParams: { businessId: business.id } });
    }
  }
  private capitalizeFirstLetter(name: string): string {
    // return name;
    if (name !== undefined && name !== null && name.length > 0) {
      return name.replace(/^./, name[0].toUpperCase());
    }
    return name;
  }
}
