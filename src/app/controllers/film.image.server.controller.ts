import {Request, Response} from "express";
import Logger from "../../config/logger";
import {findUserByToken} from "../models/user.server.model";
import * as films from "../models/film.server.model";

import path from "path";
import fs from "mz/fs";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const film = await films.getAllById(id);

        // No film matching the given film ID
        if(film.length === 0) {
            res.statusMessage = "Not found. No film found with id, or film has no image";
            res.status(404).send();
            return;
        }

        // Film doesn't have an image
        if(film[0].image_filename === null) {
            res.statusMessage = "Not found. No film found with id, or film has no image";
            res.status(404).send();
            return;
        }

        // Get filename from the film in the database
        const fileName = film[0].image_filename;
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
        const film = await films.getAllById(id);

        if (id === undefined) { id = "" }

        // No film matching the given film ID
        if (film.length === 0) {
            res.statusMessage = "Not Found. No film found with id";
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
        if (userByToken[0].id !== film[0].directorId) {
            res.statusMessage = "Forbidden. Only the director of a film can change the hero image";
            res.status(403).send();
            return;
        }

        // Check the file extension
        let extension = null;
        if (imageType === 'image/png') { extension = '.png' }
        else if (imageType === 'image/jpeg') { extension = '.jpeg' }
        else if (imageType === 'image/gif') { extension = '.gif' }
        else {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }

        // Create file
        const fileName = 'film_' + id + extension;
        const storagePath = path.join(__dirname, '../../../storage/images');
        const filePath = path.join(storagePath, fileName);
        await fs.writeFile(filePath, image, 'binary');

        // Update image filename in the database
        await films.updateImage(id, fileName);

        // Check if image has been updated or added
        if (film[0].image_filename === null) {
            res.statusMessage = "Created";
            res.status(201).send();
            return;
        } else {
            res.statusMessage = "OK";
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

export {getImage, setImage};