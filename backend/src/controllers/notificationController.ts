import { Request, Response } from 'express';
import { IRequest } from '../middleware/auth';
import Notification from '../models/Notification';

export const getNotifications = async (req: IRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const markNotificationRead = async (req: IRequest, res: Response) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!n) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.status(200).json({ success: true, data: n });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {};
