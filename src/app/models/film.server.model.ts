import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from "mysql2";

const getAll = async (
    q: string,
    count: string,
    startIndex: string,
    directorId: string,
    sortBy: string): Promise<Film[]> => {
    Logger.info('Getting all films from the database');
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
        'CAST(IFNULL(ROUND(AVG(rating), 1),0) AS float) AS rating ' +
        'FROM film ' +
        'LEFT JOIN film_review on film.id = film_review.film_id ' +
        'LEFT JOIN user ON film.director_id = user.id ' +
        'WHERE (film.title LIKE ? OR film.description LIKE ?) ';

    if (directorId !== "") {
        query += ' AND user.id = ? ';
        params.push(parseInt(directorId, 10));
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

    let [ rows ] = await conn.query( query, params );
    await conn.release();

    if (startIndex !== "" && count !== "") {
        rows = rows.slice(parseInt(startIndex, 10), parseInt(startIndex,10) + parseInt(count, 10))
    } else if (count !== "") {
        rows = rows.slice(0, parseInt(count, 10))
    } else if (startIndex !== "") {
        rows = rows.slice(parseInt(startIndex, 10))
    }

    return rows;
};

export { getAll }