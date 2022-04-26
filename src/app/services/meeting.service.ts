/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable arrow-body-style */
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentReference } from '@angular/fire/compat/firestore';
import { Meeting } from '../interfaces/meeting';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import { forkJoin, Observable, of, zip } from 'rxjs';
import * as moment from 'moment';
import { BusinessService } from './business.service';
import { UserService } from './user.service';
import { Business } from '../interfaces/business';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {

  /*
   * time : TimeMeeting,
   idBusiness : string,
   idUser:string,*/
  private idUser = localStorage.getItem('idUser');

  meetingCollection: AngularFirestoreCollection<Meeting>;
  meetingCollection2: AngularFirestoreCollection<Meeting>;
  meetingCollection3: AngularFirestoreCollection<Meeting>;
  meetingCollection4: AngularFirestoreCollection<Meeting>;
  meetingCollection5: AngularFirestoreCollection<Meeting>;
  meetingCollection6: AngularFirestoreCollection<Meeting>;
  meetingCollection7: AngularFirestoreCollection<Meeting>;

  constructor(public afs: AngularFirestore,
    private businessService: BusinessService,
    private userService: UserService,

  ) {

    this.meetingCollection = this.afs.collection('meetings');
    this.meetingCollection2 = this.afs.collection('meetings');
    this.meetingCollection4 = this.afs.collection('meetings');
    this.meetingCollection5 = this.afs.collection('meetings');
  }

  addMeeting(meetingData: Meeting): Promise<DocumentReference<Meeting>> {
    return this.meetingCollection5.add(meetingData);
  }

  // return meeting by bussines and date
  getMeetingsByIdBusinessByDate(idBusiness: string, dateForCalendar: string): Observable<Meeting[]> {

    const helpTime = moment(dateForCalendar).format('YYYY-MM-DDT00:00:00+00:00');

    this.meetingCollection5 = this.afs.collection('meetings',
      ref => ref.where('idBusiness', '==', idBusiness)
        .where('date', '>', helpTime)
    );

    return this.meetingCollection5.snapshotChanges().pipe(
      map(changes => changes.map(a => {
        const data = a.payload.doc.data() as Meeting;
        data.id = a.payload.doc.id;
        return data;
      })));
  }


  // just for one date
  getMeetingsByIdBusinessByOneDay(idBusiness: string, dateForCalendar: string): Observable<Meeting[]> {

    const helpTime = moment(dateForCalendar).format('L');


    this.meetingCollection5 = this.afs.collection('meetings',
      ref => ref.where('idBusiness', '==', idBusiness)
        .where('dateForCalendar', '==', helpTime)
    );

    return this.meetingCollection5.snapshotChanges().pipe(
      map(changes => changes.map(a => {
        const data = a.payload.doc.data() as Meeting;
        data.id = a.payload.doc.id;
        return data;
      })));
  }

  getAllMeetingsByIdBusinessAndDay(idBusiness: string, nameDay: string): Observable<Meeting[]> {
    this.meetingCollection6 = this.afs.collection('meetings',
      ref => ref.where('idBusiness', '==', idBusiness)
        .where('nameDay', '==', nameDay)
    );

    return this.meetingCollection6.snapshotChanges().pipe(
      map(changes => changes.map(a => {
        const data = a.payload.doc.data() as Meeting;
        data.id = a.payload.doc.id;
        return data;
      })));
  }



  deleteMeetingsByIdBusiness(idBusiness: string, dateForCalendar: string): Observable<void[]> {

    return this.getMeetingsByIdBusinessByDate(idBusiness, dateForCalendar).pipe(
      take(1),
      switchMap((arrayMeetings: Meeting[]) =>
        forkJoin(arrayMeetings.map(meeting => {
          return this.deleteMeeting(meeting.id);
        }))
      )
    );
  }

  deleteMeetingsByIdBusinessByDays(idBusiness: string, dateForCalendar: string, daysForDelete: string[]): Observable<any> {

    return this.getMeetingsByIdBusinessByDate(idBusiness, dateForCalendar).pipe(
      take(1),
      map((arrayMeeting: Meeting[]) => {
        return arrayMeeting.map((meeting) => {
          return { idMeeting: meeting.id, day: moment(meeting.dateForCalendar).format('dddd') };
        });
      }),
    );
  }

  getMeetingByIdBusinessByDateWithUserDetails(idBusiness: string, dateForCalendar: string) {
    return this.getMeetingsByIdBusinessByDate(idBusiness, dateForCalendar).pipe(
      switchMap((arrayMeetings: Meeting[]) =>
        zip(arrayMeetings.map(meeting => {
          return this.userService.getUserDetailsInformation(meeting.idUser).pipe(
            map((userDetails) => {
              return { userDetails, meeting };
            }
            ));
        }))
      )
    );
  }

  getMeetingsByIdUserOrderByDate(idUser: string, currentDay?: string): Observable<Meeting[]> {


    this.meetingCollection3 = this.afs.collection('meetings',
      ref => ref.where('idUser', '==', idUser)
        .where('date', '>', currentDay)
    );

    return this.meetingCollection3.snapshotChanges().pipe(
      map(changes => changes.map(a => {
        const data = a.payload.doc.data() as Meeting;
        data.id = a.payload.doc.id;
        return data;
      })));
  }

  getMeetingsAndDetailsBusinessByIdUser(idUser: string, currentDay?: string): Observable<{ business: Business; meeting: Meeting }[]> {
    return this.getMeetingsByIdUserOrderByDate(idUser, currentDay).pipe(
      switchMap((arrayMeetings: Meeting[]) =>
        forkJoin(arrayMeetings.map(meeting => {
          return this.businessService.getOneBusiness(meeting.idBusiness).pipe(
            map(business => {
              return {
                business,
                meeting
              };
            })
          ).pipe(
          );
        }))
      ),
      tap(() => {

      })
    );
  }


  getMeetingsByIdUserByDate(idUser: string, dateForCalendar: string): Observable<Meeting[]> {

    const helpTime = moment(dateForCalendar).format('YYYY-MM-DDT00:00:00+01:00');

    this.meetingCollection3 = this.afs.collection('meetings',
      ref => ref.where('dateForCalendar', '==', dateForCalendar)
        .where('idUser', '==', idUser)
        .where('date', '>', helpTime)
    );

    return this.meetingCollection3.snapshotChanges().pipe(
      map(changes => {
        return changes.map(a => {
          const data = a.payload.doc.data() as Meeting;
          data.id = a.payload.doc.id;
          return data;
        });
      }));
  }

  getMeetingsByIdUserByDateByBusiness(idUser: string, dateForCalendar: string): Observable<Meeting[]> {

    const helpTime = moment(dateForCalendar).format('YYYY-MM-DDT00:00:00+01:00');

    this.meetingCollection3 = this.afs.collection('meetings',
      ref => ref.where('dateForCalendar', '==', dateForCalendar)
        .where('idUser', '==', idUser)
        .where('date', '>', helpTime)
    );

    return this.meetingCollection3.snapshotChanges().pipe(
      map(changes => {
        return changes.map(a => {
          const data = a.payload.doc.data() as Meeting;
          data.id = a.payload.doc.id;
          return data;
        });
      }));
  }




  getMeetingsByIdUserForOneDay(idUser: string, dateForCalendar: string) {

    return this.getMeetingsByIdUserByDate(idUser, dateForCalendar).pipe(
      switchMap((arrayMeetings: Meeting[]) =>
        forkJoin(arrayMeetings.map(meeting => {
          return this.businessService.getOneBusiness(meeting.idBusiness).pipe(
            map(business => {
              return { business, meeting };
            }));
        }),
        )), tap(() => {
        })
    );
  }

  getOneMeeting(documentId: string): Observable<Meeting> {
    //return this.meetingCollection2.doc('6p4hV0ozXqFPLC5c2IDe').valueChanges();
    return this.meetingCollection2.doc(documentId).valueChanges();

  }

  getOneMeetingWithUserInformation(documentId: string): Observable<any> {
    return this.getOneMeeting(documentId).pipe(
      switchMap(meeting => {
        return this.userService.getUserDetailsInformation(meeting.idUser).pipe(
          map((userDetails) => {
            return { meeting, userDetails };
          })
        );
      })
    );
  }


  getExistMeeting(idBusiness: string, minutes: number, dateForCalendar: string): Observable<boolean> {
    this.meetingCollection3 = this.afs.collection('meetings',
      ref => ref.where('idBusiness', '==', idBusiness)
        .where('minutes', '==', minutes)
        .where('dateForCalendar', '==', dateForCalendar)
    );

    return this.meetingCollection3.valueChanges().pipe(
      take(1),
      map((arrayMeeting) => arrayMeeting.length > 0 ? true : false)
    );
  }

  getMeetingsByIdBusiness(idBusiness: string): Observable<Meeting[]> {
    this.meetingCollection3 = this.afs.collection('meetings',
      ref => ref.where('idBusiness', '==', idBusiness)
    );

    return this.meetingCollection3.valueChanges();
  }

  deleteMeeting(docIdMeeting: string): Promise<void> {
    return this.meetingCollection4.doc(docIdMeeting).delete();
  }

}
