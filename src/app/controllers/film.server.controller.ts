import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from '../models/film.server.model';
import * as schemas from '../resources/schemas.json';
import { validate } from '../../validate'
import {findUserByToken} from "../models/user.server.model";

const viewAll = async (req: Request, res: Response): Promise<void> => {

    const validation = await validate(
        schemas.film_search,
        req.query);
    if (validation !== true) {
        res.status(400).send();
        return;
    }

    let startIndex = req.query.startIndex;
    let count = req.query.count;
    let q = req.query.q;
    let genreIds = req.query.genreIds
    let ageRatings = req.query.ageRatings;
    let directorId = req.query.directorId;
    let reviewerId = req.query.reviewerId;
    let sortBy = req.query.sortBy;

    if (startIndex === undefined) { startIndex = ""}
    if (count === undefined) { count = "" }
    if (q === undefined) { q = "" }
    if (genreIds === undefined) { genreIds = ""}
    if (ageRatings === undefined) { ageRatings = ""}
    if (directorId === undefined) { directorId = ""}
    if (reviewerId === undefined) { reviewerId = ""}
    if (sortBy === undefined) { sortBy = ""}


    try {
        let result = await films.getAll(
            q.toString(),
            genreIds.toString(),
            ageRatings.toString(),
            directorId.toString(),
            reviewerId.toString(),
            sortBy.toString());

        const filmCount = result.length;

        if (startIndex !== "" && count !== "") {
            result = result.slice(parseInt(startIndex.toString(), 10), parseInt(startIndex.toString(),10) + parseInt(count.toString(), 10))
        } else if (count !== "") {
            result = result.slice(0, parseInt(count.toString(), 10))
        } else if (startIndex !== "") {
            result = result.slice(parseInt(startIndex.toString(), 10))
        }

        res.status(200).send({"films": result, "count": filmCount});
    } catch (err) {
        if (err.toString() === "Error: BAD GENRE ID") {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        }
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getOne = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.info('GET single film id: ${req.params.id}');
        let id = req.params.id;
        if (id === undefined) { id = ""}
        const result = await films.getOne(id.toString());
        if (result.length === 0 ){
            res.status(404).send('Not Found. No film with id');
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

const addOne = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validate(
            schemas.film_post,
            req.body);
        if (validation !== true) {
            Logger.info(validation);
            res.statusMessage = 'Bad Request';
            res.status(400).send();
            return;
        }

        // Required Params
        const title = req.body.title;
        const description = req.body.description;
        const genreId = req.body.genreId;
        const token = req.header('X-Authorization');
        const userByToken = await findUserByToken(token);

        // Optional Params
        let releaseDate = req.body.releaseDate;
        let runTime = req.body.runtime;
        let ageRating = req.body.ageRating;

        // Check user is logged in
        if (userByToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }
        const directorId = userByToken[0].id;

        // Define optional params if undefined
        if (runTime === undefined) { runTime = "" }
        if (ageRating === undefined) { ageRating = "TBC" }
        if (releaseDate === undefined) { releaseDate = new Date().toISOString().split('T')[0] }
        else {
            // Check release date in the future
            const todayTime = new Date();
            const releaseTime = new Date(releaseDate);
            if (releaseTime.getTime() - todayTime.getTime() < 0) {
                res.statusMessage = "Forbidden. Film title is not unique, or cannot release a film in the past";
                res.status(403).send();
                return;
            }
        }

        // Query Database
        const result = await films.addFilm(
            title.toString(),
            description.toString(),
            releaseDate.toString(),
            genreId.toString(),
            runTime.toString(),
            ageRating.toString(),
            directorId.toString()
        );
        res.statusMessage = "Created";
        res.status(201).send({"filmId":result.insertId});
        return;
    } catch (err) {
        Logger.error(err);
        if (err.errno === 1062) {
            res.statusMessage = "Forbidden. Film title is not unique, or cannot release a film in the past";
            res.status(403).send();
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
        }
        return;
    }
}

const editOne = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.film_patch,
            req.body);
        if (validation !== true) {
            Logger.info(validation);
            res.statusMessage = 'Bad Request';
            res.status(400).send();
            return;
        }

        // Required Params
        const token = req.header('X-Authorization');
        const userByToken = await findUserByToken(token);
        const filmId = req.params.id;

        // Optional Params
        let title = req.body.title;
        let description = req.body.description;
        let releaseDate = req.body.releaseDate;
        let genreId = req.body.genreId;
        let runTime = req.body.runtime;
        let ageRating = req.body.ageRating;

        // Check film exists
        const film = await films.getOne(filmId.toString());
        if (film.length === 0) {
            res.statusMessage = "Not Found. No film found with id";
            res.status(404).send();
            return;
        }

        // Define optional params if undefined
        if (title === undefined) { title = "" }
        if (description === undefined) { description = "" }
        if (genreId === undefined) { genreId = "" }
        else {
            // Check genreId references an existing genre
            const genres = await films.getGenres();
            const genreIds: string | any[] = [];
            for (const item of genres) { genreIds.push(item.genreId.toString(10)) }
            if (!genreIds.includes(genreId.toString())) {
                res.statusMessage = "Bad Request. Invalid information";
                res.status(400).send();
                return;
            }
        }
        if (runTime === undefined) { runTime = "" }
        if (ageRating === undefined) { ageRating = "" }
        if (releaseDate === undefined) { releaseDate = "" }
        else {
            // Check release date hasn't passed
            const oldReleaseTime = new Date(film[0].releaseDate)
            // Check release date in the future
            const todayTime = new Date();
            const releaseTime = new Date(releaseDate);
            if (releaseTime.getTime() - todayTime.getTime() < 0 || oldReleaseTime.getTime() - todayTime.getTime() < 0) {
                res.statusMessage = "Forbidden. Only the director of an film may change it, cannot change the releaseDate since it has already passed, cannot edit a film that has a review placed, or cannot release a film in the past";
                res.status(403).send();
                return;
            }
        }

        // Check user is logged in
        if (userByToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        } else {
            // Check user is director
            // Check no reviews have been placed
            const reviews = await films.getReviews(filmId.toString());
            if (film[0].directorId !== userByToken[0].id || reviews.length !== 0) {
                res.statusMessage = "Forbidden. Only the director of an film may change it, cannot change the releaseDate since it has already passed, cannot edit a film that has a review placed, or cannot release a film in the past";
                res.status(403).send();
                return;
            }
        }

        await films.editFilm(filmId.toString(), title.toString(), description.toString(), releaseDate.toString(), genreId.toString(), runTime.toString(), ageRating.toString())
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

const deleteOne = async (req: Request, res: Response): Promise<void> => {
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

const getGenres = async (req: Request, res: Response): Promise<void> => {
    try{
        const result = await films.getGenres();
        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {viewAll, getOne, addOne, editOne, deleteOne, getGenres};