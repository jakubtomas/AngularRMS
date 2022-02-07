import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
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
                private router: Router) {}

    ngOnInit() {

       // console.log("ngonitin password 2 have error " + this.registerForm.get("password2").hasError("mismatch"));

        this.firebaseErrorMessage = null;
        this.registerForm = new FormGroup(
            {
                email: new FormControl('', [
                    Validators.required,
                    Validators.email,
                    //Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,}$'),
                ]),
                firstName: new FormControl('', Validators.required),
                lastName: new FormControl('', Validators.required),

                password: new FormControl('', [
                    Validators.required,
                    Validators.minLength(6),

                    //  Validators.pattern('(?=\\D*\\d)(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z]).{6,30}'),
                ]),
                password2: new FormControl('', Validators.required),
            },
            this.passwordMatchValidator
        );

    }


    private passwordMatchValidator(model: FormGroup): ValidationErrors {
        const password = model.get('password');
        const password2 = model.get('password2');

        if (password.dirty  || password2.dirty) {

            if (password.value !== password2.value) {
                const errorMismatch = {mismatch: true};
                password2.setErrors(errorMismatch);
                return errorMismatch;

            } else {
                password2.setErrors(null);
                return null;
            }
        }
 }

    // private generateEmail() {
    //     let result = '';
    //     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //     const charactersLength = characters.length;
    //     for (let i = 0; i < 5; i++) {
    //         result += characters.charAt(Math.floor(Math.random() *
    //             charactersLength));
    //     }
    //     return result + '@gmail.com';
    // }


    // eslint-disable-next-line @typescript-eslint/member-ordering
    createUser(): void {
        const email: string = this.registerForm.get('email').value;
        const password: string = this.registerForm.get('password').value;
        const firstName: string = this.registerForm.get('firstName').value;
        const lastName: string = this.registerForm.get('lastName').value;



        this.authService.createUser(email, password,firstName,lastName).then((response) => {
            if (response == null) {// null is success, false means there was an error
                console.log('successful registration createUser.ts');
                //todo send arlso message successfully
                 this.router.navigate(['/dashboard']);

            } else {
                this.firebaseErrorMessage = response.message;
            }
        });
    }


}
