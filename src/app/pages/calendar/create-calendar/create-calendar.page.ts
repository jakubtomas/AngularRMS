/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CalendarService } from '../../../services/calendar.service';
import { Calendar } from '../../../interfaces/calendar';
import { AlertController, ToastController } from '@ionic/angular';


import { Day } from '../../../interfaces/day';
import * as moment from 'moment';
import { TimeMeeting } from '../../../interfaces/timeMeeting';
import { MeetingService } from '../../../services/meeting.service';
import { BusinessService } from 'src/app/services/business.service';
import { Meeting } from 'src/app/interfaces/meeting';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-create-calendar',
  templateUrl: './create-calendar.page.html',
  styleUrls: ['./create-calendar.page.scss'],
})
export class CreateCalendarPage implements OnInit {

  // contactForm: FormGroup;
  messageFirebase: string;
  selectedBusinessId: string;
  calendar: Calendar;
  isUpdateCalendar = false;
  docIdCalendar: string;
  errorsFromHours: string[] = [];
  timeZone: string = moment().format().toString().substring(19, 25);//25
  todayDate = moment().format('L');
  timeMeeting: TimeMeeting[] = [];
  formatOpeningHours = false;
  countOfMeetings = 0;
  permissionUpdate = false;
  private allMeetingsFromDb: Meeting[] = [];
  private deleteDay = false;
  private dateForDelete = [];
  private meetingsForDeleteFromDb = [];
  private allDatesForDelete = [];
  private allIdsMeetingsForDelete = [];
  private daysForDelete = [];


  //data for UI component
  ionTitle: string;
  ionButton: string;


  get MinutesForMeeting(): FormControl {
    return this.contactForm.get('MinutesForMeeting') as FormControl;
  }

  contactForm = new FormGroup(
    {
      MondayOpening: new FormControl('',),
      MondayClosing: new FormControl('',),

      TuesdayOpening: new FormControl('',),
      TuesdayClosing: new FormControl('',),

      WednesdayOpening: new FormControl('',),
      WednesdayClosing: new FormControl('',),

      ThursdayOpening: new FormControl('',),
      ThursdayClosing: new FormControl('',),

      FridayOpening: new FormControl('',),
      FridayClosing: new FormControl('',),

      SaturdayOpening: new FormControl('',),
      SaturdayClosing: new FormControl('',),

      SundayOpening: new FormControl('',),
      SundayClosing: new FormControl('',),

      MinutesForMeeting: new FormControl('', [Validators.required,
      Validators.min(10),
      Validators.max(360)]),

    });

  constructor(private route: ActivatedRoute,
    private calendarService: CalendarService,
    private meetingService: MeetingService,
    private toastCtrl: ToastController,
    private router: Router,
    public alertController: AlertController,
    private businessService: BusinessService,
  ) { }

  ngOnInit() {
    this.messageFirebase = null;
    this.isUpdateCalendar = false;

    this.route.queryParams.subscribe((params: Params) => {
      if (params.businessId !== undefined) {
        this.selectedBusinessId = params.businessId;
      }
      if (params.docCalendarId !== undefined && params.businessId !== undefined) {
        this.docIdCalendar = params.docCalendarId;

        this.controlBusinessPermission(params.businessId, params.docCalendarId);
        this.isUpdateCalendar = true;

      } else {
        this.isUpdateCalendar = false; //We are creating calendar
      }
      this.setValuesForPage();
    });
  }

  setValuesForPage(): void {
    if (this.isUpdateCalendar) {
      this.ionTitle = 'Update opening hours';
      this.ionButton = 'Update';
    } else {
      this.ionTitle = 'Create opening hours';
      this.ionButton = 'Create';
    }
  }

  controlBusinessPermission(businessId: string, docCalendarId: string): void {

    this.businessService.getBusinessPermission(businessId)
      .subscribe((permissions) => {
        const myId = localStorage.getItem('idUser');

        if (permissions.idUser === myId) {
          this.getOneCalendar(docCalendarId);

          this.getCountOfMeetingsForBusiness(businessId, this.todayDate);
        } else {
          this.router.navigate(['/dashboard']);
        }

      }, error => {
        console.error(error);
      });
  }

  getCountOfMeetingsForBusiness(idBusiness: string, dateForCalendar: string): void {
    this.meetingService.getMeetingsByIdBusinessByDate(idBusiness, dateForCalendar)
      .subscribe((meetings: Meeting[]) => {
        this.allMeetingsFromDb = meetings;
        this.countOfMeetings = meetings.length;
      });
  }


  saveCalendar(forUpdate?: boolean): void {

    const calendar: Calendar = {
      idBusiness: this.selectedBusinessId,
      timeMeeting: this.contactForm.value.MinutesForMeeting,
      week: this.mapOpeningClosingHours(),
      break: '',
      timeZone: this.timeZone
    };

    if (this.errorsFromHours.length === 0) { // when we do not have errors
      this.calendarService.addCalendar(calendar).then(() => {

        if (forUpdate) {
          this.showToast('Calendar has been updated successfully');
        } else {
          this.showToast('Calendar has been created successfully');
        }
        this.router.navigate(['/detail-business'],
          { queryParams: { businessId: this.selectedBusinessId } });

      }).catch((error) => {
        console.log(error);
        this.showToast('Something is wrong');
      });
    }
  }

  prepareUpdateCalendar(): void {
    this.dateForDelete = [];
    this.daysForDelete = [];

    let readyTimeZone = this.timeZone;
    if (this.docIdCalendar !== undefined) {
      // old value
      readyTimeZone = this.calendar.timeZone;
    }

    const updateCalendar: Calendar = {
      idBusiness: this.calendar.idBusiness,
      week: this.mapOpeningClosingHours(),
      timeMeeting: this.contactForm.value.MinutesForMeeting,
      break: 'no break',
      timeZone: readyTimeZone
    };

    // control error messages from OH
    if (this.errorsFromHours.length > 0) {
      return;
    }

    const lengthArray = this.calendar.week.length;
    let counter = 0;
    let counterNoChange = 0;

    // go across every day/line and control that we have different value
    while (counter < lengthArray) {

      // compare old calendar with new calendar
      if (this.calendar.week[counter].openingHours !== updateCalendar.week[counter].openingHours
        || this.calendar.week[counter].closingHours !== updateCalendar.week[counter].closingHours) {

        this.deleteDay = true;
        this.daysForDelete.push(updateCalendar.week[counter].day);

        // in case when hours are empty string, we won't delete any meeting
        if (this.calendar.week[counter].openingHours === ''
          && this.calendar.week[counter].closingHours === '') {
          this.daysForDelete.pop();
          this.deleteDay = false;
        }

      } else {
        counterNoChange++;
      }
      ++counter;
    }

    //let deleteWithoutCalculate = false;
    // in case that user change minutes for meeting , app have delete all meetings
    if (this.calendar.timeMeeting !== updateCalendar.timeMeeting) {
      this.deleteDay = true;
    }

    // no change counter for 7 days , no different timeMeeting value
    if (counterNoChange === 7 && this.calendar.timeMeeting === updateCalendar.timeMeeting) {
      this.showToast('You did not change any value. Nothing for update.');
      return;
    }

    // count of meeting for this calendar from Firestore
    if (this.countOfMeetings > 0 && this.deleteDay) {

      const newLocal = 'Warning are you sure with updating this calendar. This command can delete some meetings ';
      this.showAlertMessage(newLocal, updateCalendar);
    } else {

      this.updateCalendar(updateCalendar);
    }
  }

  private updateCalendar(newCalendar: Calendar, deleteWithoutCalculate?: boolean): void {

    if (this.errorsFromHours.length === 0) {

      this.calendarService.updateCalendar(this.docIdCalendar, newCalendar).then(() => {

        if (this.deleteDay) {
          this.deleteMeetingsForUpdateCalendar();
        }

        this.router.navigate(['/detail-business'], { queryParams: { businessId: newCalendar.idBusiness } });
        this.showToast('Calendar has been updated');

      }).catch((error) => {
        console.log(error);
      });
    }
  }

  private deleteMeetingsForUpdateCalendar() {
    this.meetingsForDeleteFromDb = [];
    //this.meetingService.deleteMeetingsByIdBusiness(this.selectedBusinessId, this.todayDate)
    this.meetingService.deleteMeetingsByIdBusinessByDays(this.selectedBusinessId, this.todayDate, this.daysForDelete)
      .toPromise().then((meetings: { idMeeting: string; day: string }[]) => {

        meetings.forEach((meeting) => {
          this.daysForDelete.forEach((day) => {
            if (meeting.day === day) {
              this.meetingsForDeleteFromDb.push(meeting);
            }
          });
        });
        // call foreach for delete
        this.meetingsForDeleteFromDb.forEach((meeting) =>
          this.meetingService.deleteMeeting(meeting.idMeeting));

      }).catch((error) => {
        console.log(error);
        this.showToast('Operation failed. Something is wrong');
      });

  }

  private async showAlertMessage(alertMessage: string, updateCalendar: Calendar, deleteWithoutCalculate?: boolean): Promise<any> {

    const alert = await this.alertController.create({
      cssClass: 'alertForm',
      header: 'Warning',

      message: alertMessage,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        },
        {
          text: 'OK',
          cssClass: 'secondary',
          handler: () => {
            this.updateCalendar(updateCalendar, deleteWithoutCalculate);
          }
        },
      ]
    });
    await alert.present();
  }

  private async showToast(msg: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position: 'middle'
    });

    toast.onDidDismiss();
    await toast.present();
  }


  getOneCalendar(docCalendarId: string): void {

    this.calendarService.getOneCalendar(docCalendarId)
      .subscribe(calendar => {

        this.calendar = calendar;
        this.transformOpeningHoursDataForForm(calendar, true);

      }, error => {
        console.log(error);
      });
  }

  private mapOpeningClosingHours(skipChecking?: boolean): Day[] {
    const formData = this.contactForm.value;

    const hours = [
      {
        day: 'Monday', // todo create ternar operater if formData.MondayOpening is empty string use '' else use
        openingHours: formData.MondayOpening === '' ? '' : moment(formData.MondayOpening).format('HH:mm'),
        closingHours: formData.MondayClosing === '' ? '' : moment(formData.MondayClosing).format('HH:mm')
      },
      {
        day: 'Tuesday',
        openingHours: formData.TuesdayOpening === '' ? '' : moment(formData.TuesdayOpening).format('HH:mm'),
        closingHours: formData.TuesdayClosing === '' ? '' : moment(formData.TuesdayClosing).format('HH:mm')
      },
      {
        day: 'Wednesday',
        openingHours: formData.WednesdayOpening === '' ? '' : moment(formData.WednesdayOpening).format('HH:mm'),
        closingHours: formData.WednesdayClosing === '' ? '' : moment(formData.WednesdayClosing).format('HH:mm')
      },
      {
        day: 'Thursday',
        openingHours: formData.ThursdayOpening === '' ? '' : moment(formData.ThursdayOpening).format('HH:mm'),
        closingHours: formData.ThursdayClosing === '' ? '' : moment(formData.ThursdayClosing).format('HH:mm')
      },
      {
        day: 'Friday',
        openingHours: formData.FridayOpening === '' ? '' : moment(formData.FridayOpening).format('HH:mm'),
        closingHours: formData.FridayClosing === '' ? '' : moment(formData.FridayClosing).format('HH:mm')
      },
      {
        day: 'Saturday',
        openingHours: formData.SaturdayOpening === '' ? '' : moment(formData.SaturdayOpening).format('HH:mm'),
        closingHours: formData.SaturdayClosing === '' ? '' : moment(formData.SaturdayClosing).format('HH:mm')
      },
      {
        day: 'Sunday',
        openingHours: formData.SundayOpening === '' ? '' : moment(formData.SundayOpening).format('HH:mm'),
        closingHours: formData.SundayClosing === '' ? '' : moment(formData.SundayClosing).format('HH:mm')
      },

    ];

    this.formatOpeningHours = true;

    this.errorsFromHours = [];

    if (skipChecking) {
      return hours;
    }


    // eslint-disable-next-line @typescript-eslint/no-shadow
    hours.forEach((value, index) => {

      if (value.openingHours === '' && value.closingHours !== '') {
        this.errorsFromHours.push(value.day + ' Opening hours is empty we got closing');
      } else if (value.openingHours !== '' && value.closingHours === '') {
        this.errorsFromHours.push(value.day + '  Closing hours is empty but we got Opening ');
      }
    });

    return hours;
  }

  resetForm(): void {
    this.contactForm.setValue({
      MondayOpening: '',
      MondayClosing: '',
      TuesdayOpening: '',
      TuesdayClosing: '',
      WednesdayOpening: '',
      WednesdayClosing: '',
      ThursdayOpening: '',
      ThursdayClosing: '',
      FridayOpening: '',
      FridayClosing: '',
      SaturdayOpening: '',
      SaturdayClosing: '',
      SundayOpening: '',
      SundayClosing: '',
      MinutesForMeeting: null
    });
  }




  private transformOpeningHoursDataForForm(calendar: Calendar, useCalendarTimeZone?: boolean): void {

    const todayDay = moment().format('YYYY-MM-DD');

    this.contactForm.setValue({

      MondayOpening:
        calendar.week[0]?.openingHours === '' ? '' : todayDay + 'T' + calendar.week[0]?.openingHours + ':00.000' + this.timeZone,
      MondayClosing:
        calendar.week[0]?.closingHours === '' ? '' : todayDay + 'T' + calendar.week[0]?.closingHours + ':00.000' + this.timeZone,
      TuesdayOpening:
        calendar.week[1]?.openingHours === '' ? '' : todayDay + 'T' + calendar.week[1]?.openingHours + ':00.000' + this.timeZone,
      TuesdayClosing:
        calendar.week[1]?.closingHours === '' ? '' : todayDay + 'T' + calendar.week[1]?.closingHours + ':00.000' + this.timeZone,
      WednesdayOpening:
        calendar.week[2]?.openingHours === '' ? '' : todayDay + 'T' + calendar.week[2]?.openingHours + ':00.000' + this.timeZone,
      WednesdayClosing:
        calendar.week[2]?.closingHours === '' ? '' : todayDay + 'T' + calendar.week[2]?.closingHours + ':00.000' + this.timeZone,
      ThursdayOpening:
        calendar.week[3]?.openingHours === '' ? '' : todayDay + 'T' + calendar.week[3]?.openingHours + ':00.000' + this.timeZone,
      ThursdayClosing:
        calendar.week[3]?.closingHours === '' ? '' : todayDay + 'T' + calendar.week[3]?.closingHours + ':00.000' + this.timeZone,
      FridayOpening:
        calendar.week[4]?.openingHours === '' ? '' : todayDay + 'T' + calendar.week[4]?.openingHours + ':00.000' + this.timeZone,
      FridayClosing:
        calendar.week[4]?.closingHours === '' ? '' : todayDay + 'T' + calendar.week[4]?.closingHours + ':00.000' + this.timeZone,
      SaturdayOpening:
        calendar.week[5]?.openingHours === '' ? '' : todayDay + 'T' + calendar.week[5]?.openingHours + ':00.000' + this.timeZone,
      SaturdayClosing:
        calendar.week[5]?.closingHours === '' ? '' : todayDay + 'T' + calendar.week[5]?.closingHours + ':00.000' + this.timeZone,
      SundayOpening:
        calendar.week[6]?.openingHours === '' ? '' : todayDay + 'T' + calendar.week[6]?.openingHours + ':00.000' + this.timeZone,
      SundayClosing:
        calendar.week[6]?.closingHours === '' ? '' : todayDay + 'T' + calendar.week[6]?.closingHours + ':00.000' + this.timeZone,

      MinutesForMeeting: calendar.timeMeeting == null ? null : calendar.timeMeeting

    });
  }

  resetHours(event: any, item: string | number): void {

    const weekData = this.mapOpeningClosingHours(true);

    // delete line time
    weekData[item].openingHours = '';
    weekData[item].closingHours = '';

    let readyTimeZone = this.timeZone;


    if (this.docIdCalendar !== undefined) {
      readyTimeZone = this.calendar.timeZone;
    }

    const changeCalendar: Calendar = {
      idBusiness: this.selectedBusinessId,
      week: weekData,
      timeMeeting: this.contactForm.value.MinutesForMeeting,
      break: 'no break',
      timeZone: readyTimeZone

    };
    this.transformOpeningHoursDataForForm(changeCalendar);
  }


}
