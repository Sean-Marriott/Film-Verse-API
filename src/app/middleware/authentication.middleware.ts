import {Request, Response} from "express";
import Logger from "../../config/logger";
import {findUserByToken} from '../models/user.server.model';

export let loginRequired = async (req: Request, res: Response, next: () => void) => {
    const token = req.header('X-Authorization')
    try {
        const result = await findUserByToken(token);
        if (result.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401)
                .send();
        } else {
            // req.authenticatedUserId = result[0].id.toString();
            next();
        }
    } catch (err) {
        if (!err.hasBeenLogged) Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500)
            .send();
    }

}

