import services from '../utils/services.js';

class FirebaseController {
  constructor() {}

  getUsers = async (req, res) => {
    let { emails } = req.query;
    emails = emails.split(',');
    const MAX = 100;
    let users = [];
    let notFound = [];
    let errors = [];

    try {
      const process = [];
      for (let i = 0; i < Math.ceil(emails.length / MAX); i++) {
        process.push(
          services.firebaseAuth.getUsers(
            emails.slice(i * MAX, (i + 1) * MAX).map((email) => ({ email }))
          )
        );
      }

      await Promise.all(process).then((result) =>
        result.forEach((res) => {
          users = [...users, ...res.users];
          notFound = [...notFound, ...res.notFound];
        })
      );
    } catch (err) {
      errors.push(err);
    }

    return res.status(200).json({ users, notFound, errors });
  };
}

const firebaseController = new FirebaseController();
export default firebaseController;
