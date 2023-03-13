type Film = {
    /**
     * Film id as defined by the database
     */
    filmId: number,
    /**
     * Film's title as entered when created
     */
    title: string,
    /**
     * Genre id linking to the genre table in the database
     */
    genreId: number,
    /**
     * Film's age rating
     */
    ageRating: string,
    /**
     * Director id linking to the user table in the database
     */
    directorId: number,
    /**
     * Director's first name as entered in the user table
     */
    directorFirstName: string,
    /**
     * Director's last name as entered in the user table
     */
    directorLastName: string,
    /**
     * Film's rating as entered when created
     */
    rating: number,
    /**
     * Film's release date as entered when created
     */
    releaseDate: string,
    /**
     * Film's description as entered when created
     */
    description: string,
    /**
     * Film's runtime as entered when created
     */
    runtime: number,
    /**
     * Film's number of ratings as entered when created
     */
    numRatings: number
}