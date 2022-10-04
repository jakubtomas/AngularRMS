import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
//import {error} from "selenium-webdriver";
//import {register} from "ts-node";

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
})
export class RegistrationPage implements OnInit {

  registerForm: FormGroup;

  successMsg = '';
  errorMsg = '';
  firebaseErrorMessage: string;



  error_msg = {
    email: [
      {
        type: 'required',
        message: 'require  email.'
      },
      {
        type: 'email',
        message: 'Email is not valid.'
      }
    ],
    firstName: [
      {
        type: 'required',
        message: 'First name required'
      }

    ],
    lastName: [
      {
        type: 'required',
        message: 'Last name required'
      }
    ],
    password: [
      {
        type: 'required',
        message: 'Password is required.'
      },
      {
        type: 'minlength',
        message: 'Password length should be 6 characters long.'
      }
    ],
    password2: [
      {
        type: 'required',
        message: 'Repeat password is required.'
      },
      {
        type: 'mismatch',
        message: 'Passwords do not match'
      }
    ]
  };

  constructor(private authService: AuthService,
    private toastCtrl: ToastController,
    private router: Router) { }

  ngOnInit() {
    this.firebaseErrorMessage = null;
    this.registerForm = new FormGroup(
      {
        email: new FormControl('', [
          Validators.required,
          Validators.email,
        ]),
        firstName: new FormControl('', Validators.required),
        lastName: new FormControl('', Validators.required),

        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6),

        ]),
        password2: new FormControl('', Validators.required),
      },
      this.passwordMatchValidator
    );

  }


  private passwordMatchValidator(model: FormGroup): ValidationErrors {

    const password = model.get('password');
    const password2 = model.get('password2');

    if (password.dirty || password2.dirty) {

      if (password.value !== password2.value) {
        const errorMismatch = { mismatch: true };
        password2.setErrors(errorMismatch);
        return errorMismatch;

      } else {
        password2.setErrors(null);
        return null;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  createUser(): void {
    const email: string = this.registerForm.get('email').value;
    const password: string = this.registerForm.get('password').value;
    const firstName: string = this.registerForm.get('firstName').value;
    const lastName: string = this.registerForm.get('lastName').value;



    this.authService.createUser(email, password, firstName, lastName)
      .then((response) => {
        if (response == null) {// null is success, false means there was an error
          this.router.navigate(['/dashboard']);
          this.showToast('The account has been created successfully.');


        } else {
          this.showToast(response.message);
          this.firebaseErrorMessage = response.message;
        }
      });
  }


  private async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position: 'middle',
      cssClass: 'alertMsg'
    });

    toast.onDidDismiss();
    await toast.present();
  }

}
