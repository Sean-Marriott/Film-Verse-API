import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from '../models/film.server.model';
import * as schemas from '../resources/schemas.json';
import { validate } from '../../validate'

const viewAll = async (req: Request, res: Response): Promise<void> => {

    const validation = await validate(
        schemas.film_search,
        req.query);
    if (validation !== true) {
        res.statusMessage = 'Bad Request: ${validation.toString()}';
        res.status(400).send();
        return;
    }

    let startIndex = req.query.startIndex;
    let count = req.query.count;
    let q = req.query.q;
    let genreIds = req.query.genreIds
    let directorId = req.query.directorId;
    let sortBy = req.query.sortBy;
    let ageRatings = req.query.ageRatings;

    if (q === undefined) { q = "" }
    if (count === undefined) { count = "" }
    if (startIndex === undefined) { startIndex = ""}
    if (directorId === undefined) { directorId = ""}
    if (sortBy === undefined) { sortBy = ""}
    if (ageRatings === undefined) { ageRatings = ""}
    if (genreIds === undefined) { genreIds = ""}


    try {
        const result = await films.getAll(
            q.toString(),
            count.toString(),
            startIndex.toString(),
            directorId.toString(),
            sortBy.toString(),
            ageRatings.toString(),
            genreIds.toString());

        res.status(200).send({"films": result, "count": result.length});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send('ERROR getting users ${err}');
    }
}

const getOne = async (req: Request, res: Response): Promise<void> => {
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

const addOne = async (req: Request, res: Response): Promise<void> => {
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

export {viewAll, getOne, addOne, editOne, deleteOne, getGenres};