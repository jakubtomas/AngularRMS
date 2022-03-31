import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BusinessService } from '../../../services/business.service';
import { Business } from '../../../interfaces/business';
import { AlertController, ToastController } from '@ionic/angular';
import { CalendarService } from '../../../services/calendar.service';
import { Calendar } from '../../../interfaces/calendar';
import * as moment from 'moment';
import { MeetingService } from 'src/app/services/meeting.service';

@Component({
  selector: 'app-detail-business',
  templateUrl: './detail-business.page.html',
  styleUrls: ['./detail-business.page.scss'],
})

export class DetailBusinessPage implements OnInit, OnDestroy {
  messageFirebase: string;
  business: Business;
  selectedBusinessId: string;
  calendar: Calendar;
  calendars: Calendar[];
  isThisMyBusiness = false;
  subscription;
  countOfMeetings = 0;
  todayDate = moment().format('L');



  timeZone = moment().format().toString().substring(19, 25);

  constructor(
    private meetingService: MeetingService,
    private route: ActivatedRoute,
    private businessService: BusinessService,
    private router: Router,
    private toastCtrl: ToastController,
    public alertController: AlertController,
    private calendarService: CalendarService,
  ) {
  }


  ngOnInit(): void {

    this.route.queryParams.subscribe((params: Params) => {

      if (params.businessId !== undefined) {
        this.selectedBusinessId = params.businessId;

        this.controlBusinessPermission(params.businessId);
        this.getOneBusiness(params.businessId);
        this.getCalendars();

      }

    });
  }


  ionViewWillEnter(): void {
    //  this.messageFirebase = null;
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position: 'middle'
    });

    toast.onDidDismiss();
    await toast.present();
  }


  getOneBusiness(documentID: string): void {

    this.subscription = this.businessService.getOneBusiness(documentID).subscribe((business) => {
      this.business = business;
    }, error => {
      console.log(error);
    }
    );
  }

  controlBusinessPermission(documentID: string): void {

    this.businessService.getBusinessPermission(documentID).subscribe((permissions) => {
      const myId = localStorage.getItem('idUser');
      if (permissions.idUser === myId) {
        this.isThisMyBusiness = true;
        this.getCountOfMeetingsForBusiness(this.selectedBusinessId, this.todayDate);
      }

    }, error => {
      console.error(error);
    });
  }

  selectMeetings(): void {
    this.router.navigate(['/calendar-meetings'], { queryParams: { businessId: this.selectedBusinessId } });

  }
  editBusiness(): void {
    this.router.navigate(['/register-business'], { queryParams: { businessId: this.selectedBusinessId } });
  }


  deleteBusiness(): void {
    this.businessService.deleteBusiness(this.selectedBusinessId).then(() => {
      //   this.router.navigate(['/list-business', {deletedBusiness: true}]);
      this.business = null;
      this.selectedBusinessId = null;
      this.deleteMeetingsByIdBusiness();
      this.router.navigate(['/list-business'], { queryParams: { deletedBusiness: true } });

    }).catch((error) => {
      console.log('error you got error ');
      console.log(error);
      this.messageFirebase = 'Something is wrong';
      this.showToast('Something is wrong');
    });
  }

  async showAlertForDelete(input: string): Promise<any> {
    let deleteBusiness: boolean = null;
    deleteBusiness = input === 'business';

    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Confirm Deletion',
      animated: true,
      backdropDismiss: true,
      message: 'Are you sure you want to permanently remove this item?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Yes',
          handler: () => {

            //number of meeting with this calendar
            if (this.countOfMeetings > 0) {
              const newLocal =
                'Warning are you sure about deleting this calendar?. This calendar has ' + this.countOfMeetings + ' meetings ';
              this.showAlertMessage(newLocal, deleteBusiness);
            } else {// when do not have any meeting
              if (deleteBusiness) {
                this.deleteBusiness();
              }
              if (!deleteBusiness) {
                this.deleteCalendar();
              }
            }


            // potrebne vytvorit showAlertMessage with
            // are you sure you want to delete this busi or calenddar with all meetings

            // no nothing happend
            // yes  call function delete calendar or delete busines and inside theses
            // function after than  call function  deleteMeetingsByIdBusiness fomr meeting service
          }
        }]
    });

    await alert.present();
  }

  async showAlertMessage(alertMessage: string, deleteBusiness: boolean) {

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
            if (deleteBusiness) {
              this.deleteBusiness();
            }
            if (!deleteBusiness) {
              this.deleteCalendar();
            };
          }
        },
      ]
    });
    await alert.present();

  }


  changeDateFormat(): void {

    const newWeek = this.calendar.week.map((item) => ({
      day: item.day,
      openingHours: item.openingHours,
      closingHours: item.closingHours
    }));

    this.calendar = {
      id: this.calendar.id,
      idBusiness: this.calendar.idBusiness,
      week: newWeek,
      break: 'no break',
      timeZone: this.calendar.timeZone
    };

  }

  // return all calendar and filter which is my
  getCalendars(): void {
    this.calendarService.getCalendars().subscribe(calendars => {
      this.calendars = calendars;

      if (this.calendars.length > 0) {
        this.calendars.forEach(calendar => {

          if (calendar.idBusiness === this.selectedBusinessId) {
            this.calendar = calendar;
            this.changeDateFormat();
          }
        });
      }
    }, error => {
      console.log('you got error ');
      console.log(error);
    });
  }

  createCalendar(): void {
    this.router.navigate(['/create-calendar'],
      { queryParams: { businessId: this.selectedBusinessId } });
  }

  editCalendar(): void {
    this.router.navigate(['/create-calendar'], { queryParams: { docCalendarId: this.calendar.id, businessId: this.selectedBusinessId } });
  }

  deleteCalendar(): void {
    this.calendarService.deleteCalendar(this.calendar.id).then(() => {
      this.deleteMeetingsByIdBusiness();
      this.showToast('Calendar has been deleted');
      this.calendar = null;

    }).catch((error) => {
      console.log('error you got error ');
      console.log(error);
      this.messageFirebase = 'Something is wrong';
      this.showToast('Operation Failed something is wrong');
    });
  }

  createMeeting(): void {
    this.router.navigate(['/create-meeting'],
      { queryParams: { businessId: this.selectedBusinessId } });
  }

  ngOnDestroy(): void {
    //  this.subscription.unsubscribe();
  }

  private getCountOfMeetingsForBusiness(idBusiness: string, dateForCalendar: string): void {
    this.meetingService.getMeetingsByIdBusinessByDate(idBusiness, dateForCalendar)
      .subscribe((meetings) => {
        console.log('vsetky meeting od dnesneho dna');
        console.log(meetings);
        console.log(' ');
        this.countOfMeetings = meetings.length;
      });
  }

  private deleteMeetingsByIdBusiness(): void {

    this.meetingService.deleteMeetingsByIdBusiness(this.selectedBusinessId, this.todayDate)
      .toPromise().then(() => {
        console.log('       ');
        console.log('Meetings have been deleted okey');
        console.log('         ');

      }).catch((error) => {
        console.log('error you got error ');
        console.log(error);
      });
  }



}
