import admin from 'firebase-admin';
import serviceAccount from '../../firebase-admin-sdk.json' assert { type: 'json' };

class Services {
  constructor() {
    this.firebaseAdmin = null;

    this.firebaseMessaging = null;
  }

  load = () => {
    this.firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL:
        'https://tdmu-386502-default-rtdb.asia-southeast1.firebasedatabase.app',
    });

    this.firebaseMessaging = this.firebaseAdmin.messaging();
  };
}

const services = new Services();
export default services;
