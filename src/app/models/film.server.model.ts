import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";

const getAll = async (
    q: string,
    genreId: string,
    ageRating: string,
    directorId: string,
    reviewerId: string,
    sortBy: string
    ): Promise<Film[]> => {
    const ageRatings = ageRating.split(',');
    const genreIds = genreId.split(',');
    const params: any[] = ['%' + q + '%', '%' + q + '%'];
    const conn = await getPool().getConnection();
    let query = 'SELECT film.id AS filmId, ' +
        'film.title, ' +
        'film.genre_id AS genreId, ' +
        'film.director_id AS directorId, ' +
        'user.first_name AS directorFirstName, ' +
        'user.last_name AS directorLastName, ' +
        'film.release_date AS releaseDate, ' +
        'film.age_rating AS ageRating, ' +
        '(SELECT CAST(IFNULL(ROUND(AVG(rating), 1),0) AS float) FROM film_review WHERE film.id = film_review.film_id) AS rating ' +
        'FROM film ' +
        'LEFT JOIN film_review ON film.id = film_review.film_id ' +
        'LEFT JOIN user ON film.director_id = user.id ' +
        'WHERE (film.title LIKE ? OR film.description LIKE ?)';

    if (directorId !== "") {
        query += ' AND (user.id = ?) ';
        params.push(parseInt(directorId, 10));
    }

    if (reviewerId !== "") {
        query += ' AND (film_review.user_id = ?) ';
        params.push(parseInt(reviewerId, 10));
    }

    if (genreId !== "") {
        const [ allGenreIds ] = await conn.query( "SELECT id FROM genre" );
        for (let i=0; i<genreIds.length; i++){
            if (genreIds[i] in allGenreIds) {
                if (i === 0) {
                    query += ' AND ('
                }
                if (i !== genreIds.length-1) {
                    query += 'film.genre_id = "' + genreIds[i] +'" OR '
                } else {
                    query += 'film.genre_id = "' + genreIds[i] + '") '
                }
            } else {
                throw new Error("BAD GENRE ID");
            }
        }
    }

    if (ageRating !== "") {
        query += ' AND ('
        for (let i=0; i<ageRatings.length; i++){
            if (i !== ageRatings.length-1) {
                query += 'film.age_rating = "' + ageRatings[i] +'" OR '
            } else {
                query += 'film.age_rating = "' + ageRatings[i] + '") '
            }
        }
    }

    query += 'GROUP BY film.id ORDER BY ';

    let sortMethod = 'film.release_date ASC';

    switch (sortBy) {
        case "ALPHABETICAL_ASC":
            sortMethod = 'film.title ASC';
            break;
        case "ALPHABETICAL_DESC":
            sortMethod = 'film.title DESC';
            break;
        case "RELEASED_DESC":
            sortMethod = 'film.release_date DESC';
            break;
        case "RATING_ASC":
            sortMethod = 'RATING ASC';
            break;
        case "RATING_DESC":
            sortMethod = 'RATING DESC';
            break;
    }

    query += sortMethod + ', film.id ASC';

    const [ rows ] = await conn.query( query, params );
    await conn.release();

    return rows;
};

const getOne = async (id: string): Promise<Film[]> => {
    Logger.info('Getting film ${id} from the database');
    const conn = await getPool().getConnection();
    const query = 'SELECT film.id AS filmId, ' +
        'film.title AS title, ' +
        'film.genre_id AS genreId, ' +
        'film.age_rating AS ageRating, ' +
        'film.director_id AS directorId, ' +
        'user.first_name AS directorFirstName, ' +
        'user.last_name AS directorLastName, ' +
        '(SELECT CAST(IFNULL(ROUND(AVG(rating), 1),0) AS float) FROM film_review WHERE film.id = film_review.film_id) AS rating, ' +
        'film.release_date AS releaseDate, ' +
        'film.description AS description, ' +
        'film.runtime AS runtime, ' +
        '(SELECT COUNT(*) FROM film_review WHERE film.id = film_review.film_id) AS numReviews ' +
        'FROM film ' +
        'LEFT JOIN film_review ON film.id = film_review.film_id ' +
        'LEFT JOIN user ON film.director_id = user.id ' +
        'WHERE film.id = ?';
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
}

const getGenres = async(): Promise<Genre[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT genre.id AS genreId, genre.name as name FROM genre';
    const [ rows ] = await conn.query( query );
    await conn.release();

    return rows;
}

const addFilm = async(title: string,
                      description: string,
                      releaseDate: string,
                      genreId: string,
                      runtime: string,
                      ageRating: string,
                      directorId: string): Promise<ResultSetHeader> => {
    Logger.info('Adding film ${title} to the database');
    if (runtime === "") { runtime = null }

    const conn = await getPool().getConnection();
    const query = 'INSERT INTO film (title, description, release_date, runtime, director_id, genre_id, age_rating) VALUES (?, ?, ?, ?, ?, ?, ?)'
    const [ result ] = await conn.query( query, [title, description, releaseDate, runtime, directorId, genreId, ageRating]);
    await conn.release();
    return result;
}

const getReviews = async(filmId: string): Promise<Review[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT film_review.user_id AS reviewerId, ' +
        'film_review.rating AS rating, ' +
        'film_review.review AS review, ' +
        'user.first_name AS reviewerFirstName, ' +
        'user.last_name AS reviewerLastName, ' +
        'film_review.timestamp AS timestamp ' +
        'FROM film_review ' +
        'JOIN user ON film_review.user_id = user.id ' +
        'WHERE film_review.film_id = ? ' +
        'ORDER BY film_review.timestamp DESC';
    const [ rows ] = await conn.query( query, [ filmId ] );
    await conn.release();
    return rows;
}

const editFilm = async(filmId: string,
                       title: string,
                       description: string,
                       releaseDate: string,
                       genreId: string,
                       runtime: string,
                       ageRating: string): Promise<ResultSetHeader> => {
    Logger.info('Editing film ${filmId} in the database');
    const params: [string, string][] = [];
    if (title !== "") { params.push(["title", title]) }
    if (description !== "") { params.push(["description", description]) }
    if (releaseDate !== "") { params.push(["release_date", releaseDate]) }
    if (genreId !== "") { params.push(["genre_id", genreId]) }
    if (runtime !== "") { params.push(["runtime", runtime]) }
    if (ageRating !== "") { params.push(["age_rating", ageRating]) }
    if (params.length === 0) { return null;}
    const conn = await getPool().getConnection();
    let query = 'UPDATE film SET';
    for (let i=0; i<params.length; i++) {
        if (i === params.length - 1) {
            query += ' ' + params[i][0] + ' = "' + params[i][1] + '"'
        } else {
            query += ' ' + params[i][0] + ' = "' + params[i][1] + '",'
        }
    }
    query += " WHERE id = " + filmId;
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const addReview = async(filmId: string,
                      userId: string,
                      rating: string,
                      review: string): Promise<ResultSetHeader> => {
    Logger.info('Adding review by ${userId} to film ${filmId} in the database');
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO film_review (film_id, user_id, rating, review) VALUES (?, ?, ?, ?)'
    const [ result ] = await conn.query( query, [filmId, userId, rating, review]);
    await conn.release();
    return result;
}

const deleteFilm = async(filmId: string): Promise<ResultSetHeader> => {
    Logger.info('Deleting film ${filmId} in the database');
    const conn = await getPool().getConnection();
    const query = 'DELETE FROM film WHERE id = ?';
    const [ result ] = await conn.query( query, [ filmId ]);
    await conn.release();
    return result;
}

const updateImage = async(id: string, ImageFileName: string): Promise<ResultSetHeader> => {
    Logger.info('Updating image for film ${id} in the database');
    const conn = await getPool().getConnection();
    const query = 'UPDATE film SET image_filename = ? WHERE id = ?'
    const [ result ] = await conn.query( query, [ ImageFileName, id ]);
    await conn.release();
    return result;
}

const getAllById = async(id: string): Promise<Film[]> => {
    Logger.info('Getting user ${email} from the database');
    const conn = await getPool().getConnection();
    const query = 'SELECT id AS filId,' +
        'title, ' +
        'genre_id AS genreId, ' +
        'age_rating AS ageRating, ' +
        'director_id AS directorId, ' +
        'release_date AS releaseDate, ' +
        'image_filename, ' +
        'description, ' +
        'runtime ' +
        'FROM film WHERE id = ?'
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
}


export { getAll, getOne, getGenres, addFilm, getReviews, editFilm, addReview, deleteFilm, updateImage, getAllById }