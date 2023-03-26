type Review = {
    /**
     * Reviewer's id as defined by the database
     */
    reviewerId: number,
    /**
     * Review's rating as entered when created
     */
    rating: number,
    /**
     * Review's review body as entered when created
     */
    review: string,
    /**
     * Reviewer's first name as defined by the database
     */
    reviewerFirstName: string,
    /**
     * Reviewer's last name as defined by the database
     */
    reviewerLastName: string,
    /**
     * Review's timestamp as defined when created
     */
    timeStamp: number
}