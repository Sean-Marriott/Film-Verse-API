import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import logger from "../../config/logger";

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
    logger.info(query);

    const [ rows ] = await conn.query( query, params );
    await conn.release();

    return rows;
};

const getOne = async(id: number): Promise<Film[]> => {
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

export { getAll, getOne, getGenres }