import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.server.model';
import {findUserByToken} from "../models/user.server.model";
import path from "path";
import fs from "mz/fs";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const userById = await users.getAllById(id);

        // No user matching the given user ID
        if (userById.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID, or user has no image";
            res.status(404).send();
            return;
        }

        // User doesn't have image
        if (userById[0].image_filename === null) {
            res.statusMessage = "Not Found. No user with specified ID, or user has no image";
            res.status(404).send();
            return;
        }

        // Get filename from the user in the database
        const fileName = userById[0].image_filename;
        const storagePath = path.join(__dirname, '../../../storage/images');
        const filePath = path.join(storagePath, fileName);
        await fs.readFile(filePath, function read(err, data) {
            if (err) {
                throw err;
            }
            const content = data;
            const fileType = fileName.split('.')[1]
            res.statusMessage = 'OK';
            res.status(200).header("Content-Type", "image/" + fileType).send(content);
        })
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
        await fs.writeFile(filePath, image, 'binary');

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
        let id = req.params.id;
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
            res.statusMessage = "Forbidden. Can not delete another user's profile photo";
            res.status(403).send();
            return;
        }

        // Get filename from the user in the database
        const fileName = userById[0].image_filename;
        if (fileName === null) {
            res.statusMessage = "Not found";
            res.status(404).send();
            return;
        }
        const storagePath = path.join(__dirname, '../../../storage/images');
        const filePath = path.join(storagePath, fileName);
        await fs.unlink(filePath);

        // Update the filename in the database to null
        await users.updateImage(id, null);

        res.statusMessage = 'OK';
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}