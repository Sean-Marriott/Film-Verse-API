import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.server.model';
import * as schemas from '../resources/schemas.json';
import { validate } from '../../validate'
import * as bcrypt from 'bcrypt';
import * as randToken from 'rand-token';
import {findUserByToken} from "../models/user.server.model";
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
        const password = req.body.password;
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await users.insert(email.toString(), firstName.toString(), lastName.toString(), passwordHash);
        res.status(201).send({"userId":result.insertId});
        return;
    } catch (err) {
        Logger.error(err);
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
        const user = await users.getByEmail(email);
        const token = randToken.generate(16);

        if (!user) {
            res.statusMessage = "Not Authorised. Incorrect email/password";
            res.status(401).send();
            return;
        }
        if (await bcrypt.compare(password, user[0].password)) {
            await users.insertToken(user[0].id, token);
            res.statusMessage = "OK";
            res.status(200).send({"userId": user[0].id, "token": token});
        } else {
            res.statusMessage = "Not Authorised. Incorrect email/password";
            res.status(401).send();
        }
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.header('X-Authorization')
        const user = await findUserByToken(token);
        if (user.length === 0) {
            res.statusMessage = "Unauthorized. Cannot log out if you are not authenticated";
            res.status(401).send();
            return;
        }
        await users.insertToken(user[0].id, null);
        res.statusMessage = "OK";
        res.status(200).send();
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
        let id = req.params.id;
        if (id === undefined) { id = ""}
        const token = req.header('X-Authorization')
        const user = await findUserByToken(token);
        let loggedIn = true;
        if (user.length === 0) {loggedIn = false}
        else if (user[0].id.toString() !== id) {loggedIn = false}
        const result = await users.getById(id.toString(), loggedIn);
        if (result.length === 0 ){
            res.status(404).send('Not Found. No user with specified ID');
        } else {
            res.status(200).send(result[0]);
        }
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
        const validation = await validate(
            schemas.user_edit,
            req.body);
        if (validation !== true) {
            res.statusMessage = "Bad request. Invalid information"
            res.status(400).send();
            return;
        }
        let id = req.params.id;
        let email = req.body.email;
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        let password = req.body.password;
        const salt = await bcrypt.genSalt();
        const token = req.header('X-Authorization')
        const userById = await users.getAllById(id);
        const userByToken = await findUserByToken(token);
        const currentPassword = req.body.currentPassword;

        if (id === undefined) { id = "" }
        if (email === undefined) { email = "" }
        if (firstName === undefined) { firstName = "" }
        if (lastName === undefined) { lastName = "" }
        if (password === undefined) { password = "" }

        // No user matching the given user ID
        if (userById.length === 0) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        // Logged-in user does not exist
        if (userByToken.length === 0) {
            res.statusMessage = "Unauthorized or Invalid currentPassword";
            res.status(401).send();
            return;
        }

        // Check the userId matches the user logged in
        if (userByToken[0].id !== userById[0].id) {
            res.statusMessage = "Forbidden. This is not your account, or the email is already in use, or identical current and new passwords";
            res.status(403).send();
            return;
        }

        // Check old password matches the one in the database
        if (!await bcrypt.compare(currentPassword, userById[0].password)) {
            res.statusMessage = "Unauthorized or Invalid currentPassword";
            res.status(401).send();
            return;
        }

        // Check new password does not match old one
        if (await bcrypt.compare(password, userById[0].password)) {
            res.statusMessage = "Forbidden. This is not your account, or the email is already in use, or identical current and new passwords";
            res.status(403).send();
            return;
        } else {
            password = await bcrypt.hash(password, salt)
            await users.editUser(id.toString(), email.toString(), firstName.toString(), lastName.toString(), password)
            res.status(200).send();
            return;
        }

    } catch (err) {
        Logger.error(err);
        if (err.errno === 1062) {
            res.statusMessage = "Forbidden. This is not your account, or the email is already in use, or identical current and new passwords";
            res.status(403).send();
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
    }
}



export {register, login, logout, view, update}