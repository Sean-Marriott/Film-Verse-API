import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.server.model';
import * as schemas from '../resources/schemas.json';
import { validate } from '../../validate'
import * as bcrypt from 'bcrypt';

const register = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.user_register,
            req.body);
        if (validation !== true) {
            res.status(400).send();
            return;
        }
        const email = req.body.email;
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const password = req.body.password  ;
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await users.insert(email.toString(), firstName.toString(), lastName.toString(), passwordHash);
        res.status(201).send({"userId":result.insertId});
    } catch (err) {
        if (err.errno === 1062) {
            res.statusMessage = "Forbidden. Email already in use";
            res.status(403).send();
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.user_login,
            req.body);
        if (validation !== true) {
            res.status(400).send();
            return;
        }
        const email = req.body.email;
        const password = req.body.password;
        // @ts-ignore
        const user = await users.getByEmail(email);
        // tslint:disable-next-line:no-console
        console.log(user);
        if (!user) {
            res.statusMessage = "Not Authorised. Incorrect email/password";
            res.status(401).send();
        }
        if (await bcrypt.compare(password, user[0].password)) {
            res.statusMessage = "OK";
            res.status(200).send({"userId": user[0].id, "token": "BLAHBLAHBLAH"});
        } else {
            res.statusMessage = "Not Authorised. Incorrect email/password";
            res.status(401).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const update = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}