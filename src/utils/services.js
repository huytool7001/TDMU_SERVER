import admin from 'firebase-admin';
import { FIREBASE_DB_URL } from '../configs/constant.js';
import { decryptToString } from './secure-file.js';
const secureFileName = './firebase-admin-sdk.json.secure';
const jsonStr = await decryptToString(secureFileName);
const serviceAccount = JSON.parse(jsonStr);

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
