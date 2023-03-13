import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from "mysql2";

const getAll = async (): Promise<Film[]> => {
    Logger.info('Getting all films from the database');
    const conn = await getPool().getConnection();
    const query = 'SELECT film.id AS filmId, ' +
        'film.title, ' +
        'film.genre_id AS genreId, ' +
        'film.director_id AS directorId, ' +
        'user.first_name AS directorFirstName, ' +
        'user.last_name AS directorLastName, ' +
        'film.release_date AS releaseDate, ' +
        'film.age_rating AS ageRating, ' +
        'CAST(IFNULL(ROUND(AVG(rating), 1),0) AS float) AS rating ' +
        'FROM film ' +
        'LEFT JOIN film_review on film.id = film_review.film_id ' +
        'LEFT JOIN user ON film.id = user.id ' +
        'GROUP BY film.id ' +
        'ORDER BY releaseDate';
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
};

export { getAll }