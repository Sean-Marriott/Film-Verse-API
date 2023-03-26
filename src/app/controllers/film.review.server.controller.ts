import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from '../models/film.server.model';

const getReviews = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        // Check film exists
        const film = await films.getOne(id);
        if (film.length === 0 ) {
            res.statusMessage = "Not Found. No film found with id";
            res.status(404).send();
            return;
        }
        const result = await films.getReviews(id.toString());
        res.statusMessage = "OK";
        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const addReview = async (req: Request, res: Response): Promise<void> => {
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



export {getReviews, addReview}