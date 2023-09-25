import Admin from '../models/admin.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../configs/constant.js';

class AdminController {
  constructor() {}

  get = async (req, res) => {
    const { id } = req.params;
    const admin = await Admin.findOne(
      { id },
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0, password: 0 }
    );
    if (!admin) {
      return res.status(400).json({ error: 'Admin not found' });
    }
    return res.status(200).json(admin);
  };

  search = async (req, res) => {
    const { query } = req;
    const limit = query && query.limit ? parseInt(query.limit) : 0;
    const skip = query && query.skip ? parseInt(query.skip) : 0;
    const sort = query && query.sort ? JSON.parse(query.sort) : { id: 1 };

    delete query.limit;
    delete query.skip;
    delete query.sort;

    if (query.name !== undefined) {
      query.name = { $regex: '.*' + query.name + '.*', $options: 'i' };
    }

    const admins = await Admin.find(query).sort(sort).skip(skip).limit(limit);

    const totalCount = await Admin.count();

    return res.status(200).json({ admins, totalCount });
  };

  create = async (req, res) => {
    try {
      const { id, password, name } = req.body;
      if (!id || !password || !name) {
        return res.status(400).json({
          error: 'Please fill in all fields',
        });
      }

      const admin = await Admin.create({
        ...req.body,
        password: bcrypt.hashSync(password, 5),
      });

      return res.status(200).json(admin);
    } catch (err) {
      console.log(
        '🚀 ~ file: admin.controller.js:58 ~ AdminController ~ create= ~ err:',
        err
      );
      return res.status(400).json(err);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);

    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 5);
    }

    const admin = await Admin.findOneAndUpdate({ id }, req.body, {
      new: true,
    });

    if (!admin) {
      return res.status(400).json({ error: 'Admin not found' });
    }

    return res.status(200).json(admin);
  };

  delete = async (req, res) => {
    const { id } = req.params;
    const admin = await Admin.findOneAndDelete({ id });

    return res.status(200).json(admin);
  };

  deleteMany = async (req, res) => {
    let { ids } = req.query;
    ids = ids.split(',') || [];
    const admins = await Admin.deleteMany({ id: { $in: ids } });

    return res.status(200).json(admins);
  };

  login = async (req, res) => {
    const { id, password, loginToken } = req.body;

    let admin = null;
    if (loginToken) {
      const { adminId } = await this.verifyToken(loginToken).catch((err) => {
        if (err instanceof jwt.TokenExpiredError) {
          return res.status(400).json({ error: 'Token expired' });
        }

        if (err instanceof jwt.JsonWebTokenError) {
          return res.status(400).json({ error: 'Token is invalid' });
        }

        return res.status(400).json({ err });
      });

      admin = await Admin.findOne(
        { id: adminId },
        { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
      );

      if (!admin) {
        return res.status(400).json({ error: 'Admin not found' });
      }
    } else {
      admin = await Admin.findOne(
        { id },
        { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
      ).lean();

      if (!admin) {
        return res.status(400).json({ error: 'Admin not found' });
      }

      if (!bcrypt.compareSync(password, admin.password)) {
        return res.status(400).json({ error: 'Password is not correct' });
      }
    }

    delete admin.password;

    const token = await jwt.sign(
      {
        adminId: admin.id,
        exp: Math.floor(Date.now() / 1000) + 3600, // seconds
      },
      SECRET_KEY
    );

    const refreshToken = await jwt.sign(
      {
        adminId: admin.id,
        exp: Math.floor(Date.now() / 1000) + 3600 * 24, // seconds
      },
      SECRET_KEY
    );

    return res.status(200).json({ ...admin, token, refreshToken });
  };

  verifyToken = async (token) => {
    const result = await jwt.verify(token, SECRET_KEY);
    return result;
  };

  refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    const data = await this.verifyToken(refreshToken);
    if (!data) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    return jwt.sign(
      {
        ...data,
        exp: Math.floor(Date.now() / 1000) + 3600, // seconds
      },
      SECRET_KEY
    );
  };
}

const adminController = new AdminController();
export default adminController;
