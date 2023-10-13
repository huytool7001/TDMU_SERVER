import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { FIREBASE_DB_URL } from '../configs/constant.js';
import { decryptToString } from './secure-file.js';

const serviceAccountFileName = './firebase-admin-sdk.json.secure';
const serviceAccountJsonStr = await decryptToString(serviceAccountFileName);
const serviceAccount = JSON.parse(serviceAccountJsonStr);

const firebaseConfigFileName = './firebase-config.json.secure';
const firebaseConfigJsonStr = await decryptToString(firebaseConfigFileName);
const firebaseConfig = JSON.parse(firebaseConfigJsonStr);

class Services {
  constructor() {
    this.firebaseMessaging = null;
    this.firebaseStorage = null;
  }

  load = () => {
    const firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: FIREBASE_DB_URL,
    });
    this.firebaseMessaging = firebaseAdmin.messaging();

    const app = initializeApp(firebaseConfig);
    this.firebaseStorage = getStorage(app);
  };
}

const services = new Services();
export default services;
