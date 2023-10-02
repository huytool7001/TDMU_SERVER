import admin from 'firebase-admin';
import serviceAccount from '/etc/secrets/firebase-admin-sdk.json' assert { type: 'json' };
import { FIREBASE_DB_URL } from '../configs/constant.js';

class Services {
  constructor() {
    this.firebaseAdmin = null;
    this.firebaseMessaging = null;
  }

  load = () => {
    this.firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: FIREBASE_DB_URL,
    });

    this.firebaseMessaging = this.firebaseAdmin.messaging();
  };
}

const services = new Services();
export default services;
