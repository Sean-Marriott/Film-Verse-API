import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.server.model';
import {findUserByToken} from "../models/user.server.model";
import path from "path";
import fs from "mz/fs";

const getImage = async (req: Request, res: Response): Promise<void> => {
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


const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        let id = req.params.id;
        const image = req.body;
        const imageType = req.header('Content-Type')
        const token = req.header('X-Authorization');
        const userByToken = await findUserByToken(token);
        const userById = await users.getAllById(id);

        if (id === undefined) { id = "" }

        // No user matching the given user ID
        if (userById.length === 0) {
            res.statusMessage = "Not found. No such user with ID given";
            res.status(404).send();
            return;
        }

        // Logged-in user does not exist
        if (userByToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }

        // Check the userId matches the user logged in
        if (userByToken[0].id !== userById[0].id) {
            res.statusMessage = "Forbidden. Can not change another user's profile photo";
            res.status(403).send();
            return;
        }

        // Check the file extension
        let extension = null;
        if (imageType === 'image/png') { extension = '.png' }
        else if (imageType === 'image/jpeg') { extension = '.jpeg' }
        else if (imageType === 'image/gif') { extension = '.gif' }
        else {
            res.statusMessage = "Bad Request. Invalid image supplied (possibly incorrect file type)";
            res.status(400).send();
            return;
        }

        // Create file
        const fileName = 'user_' + id + extension;
        const storagePath = path.join(__dirname, '../../../storage/images');
        const filePath = path.join(storagePath, fileName);
        await fs.writeFile(filePath, image);

        // Update image filename in the database
        await users.updateImage(id, fileName);

        // Check if image has been updated or added
        if (userById[0].image_filename === null) {
            res.statusMessage = "Created. New image created";
            res.status(201).send();
            return;
        } else {
            res.statusMessage = "OK. Image updated";
            res.status(200).send();
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const deleteImage = async (req: Request, res: Response): Promise<void> => {
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

export {getImage, setImage, deleteImage}