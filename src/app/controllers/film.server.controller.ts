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
    try{
        const validation = await validate(
            schemas.film_post,
            req.query);
        if (validation !== true) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
            return;
        }

        const title = req.query.title;
        const description = req.query.description;
        let releaseDate = req.query.releaseDate;
        const genreId = req.query.genreId;
        let runTime = req.query.runTime;
        let ageRating = req.query.ageRating;
        const token = req.header('X-Authorization');
        const userByToken = await findUserByToken(token);
        if (userByToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }
        const directorId = userByToken[0].id;
        if (releaseDate === undefined) {releaseDate = Date()}
        if (runTime === undefined) {runTime = ""}
        if (ageRating === undefined) {ageRating = "TBC"}

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
        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editOne = async (req: Request, res: Response): Promise<void> => {
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