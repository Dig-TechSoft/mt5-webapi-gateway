import { Request, Response } from 'express';
import { getMt5Client } from '../../mt5/instances';
import { UserService } from './user.service';

export class UserLoginsController {
    static async getUserLogins(req: Request, res: Response) {
        const rawGroup = req.query.group ?? req.body.group;
        if (!rawGroup) {
            return res.status(400).json({ success: false, error: 'Missing group parameter' });
        }

        const groups: string[] = Array.isArray(rawGroup)
            ? rawGroup.map(String).map(s => s.trim()).filter(Boolean)
            : String(rawGroup).split(',').map(s => s.trim()).filter(Boolean);

        const mt5 = getMt5Client();
        const service = new UserService(mt5);
        try {
            const raw = await service.getUserLoginsRaw(groups);
            return res.json(raw);
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
}
