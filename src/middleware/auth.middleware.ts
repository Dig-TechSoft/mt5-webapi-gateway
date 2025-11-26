import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Missing API Key' });
    }
    // TODO: Validate API key against database/cache
    next();
};
