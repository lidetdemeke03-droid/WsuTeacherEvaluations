# Migration Plan

## 1. Database Setup

1.  **Create a MongoDB Atlas Cluster:** Set up a new MongoDB Atlas cluster to host the application database.
2.  **Configure Environment Variables:** In your production environment, set the `MONGO_URI` environment variable to the connection string of your new Atlas cluster.

## 2. Initial Data Seeding

1.  **Run the Seed Script:** Once the application is deployed, run the seed script to populate the database with initial data. This script will create the necessary departments, users, courses, and evaluation criteria.

    ```bash
    npm run seed
    ```

## 3. Indexing

The following indexes are automatically created by the application's Mongoose schemas. However, it's a good practice to verify that they have been created correctly in your MongoDB Atlas cluster.

*   **Users:**
    *   `email`: Unique index to prevent duplicate user accounts.
*   **Courses:**
    *   `department`: Index to improve query performance when filtering courses by department.
    *   `instructor`: Index to improve query performance when filtering courses by instructor.
*   **Evaluations:**
    *   `course`, `student`: Unique compound index to enforce the one-evaluation-per-student-per-course rule.
    *   `instructor`: Index to improve query performance when retrieving evaluations for a specific instructor.
    *   `period`: Index to improve query performance when filtering evaluations by evaluation period.
*   **Notifications:**
    *   `recipient`: Index to improve query performance when fetching notifications for a specific user.
