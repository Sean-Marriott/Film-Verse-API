import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from '../models/film.server.model';
import {validate} from "../../validate";
import * as schemas from "../resources/schemas.json";
import {findUserByToken} from "../models/user.server.model";

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
        const validation = await validate(
            schemas.film_review_post,
            req.body);
        if (validation !== true) {
            Logger.info(validation);
            res.statusMessage = 'Bad Request. Invalid information';
            res.status(400).send();
            return;
        }
        // Required params
        const filmId = req.params.id;
        const rating = req.body.rating;
        const token = req.header('X-Authorization');
        const userByToken = await findUserByToken(token);

        // Optional params
        const review = req.body.review;

        // Check film exists
        const film = await films.getOne(filmId.toString());
        if (film.length === 0) {
            res.statusMessage = "Not Found. No film found with id";
            res.status(404).send();
            return;
        }

        // Check user is logged in
        if (userByToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }

        // Check film has released
        // Check user is not director
        const todayTime = new Date();
        const releaseTime = new Date(film[0].releaseDate);
        const user = userByToken[0];
        if (releaseTime.getTime() - todayTime.getTime() > 0 || user.id === film[0].directorId) {
            res.statusMessage = "Forbidden. Cannot review your own film, or cannot post a review on a film that has not yet released";
            res.status(403).send();
            return;
        }

        await films.addReview(filmId.toString(), user.id.toString(), rating.toString(), review.toString())

        res.statusMessage = "Created";
        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}



export {getReviews, addReview}