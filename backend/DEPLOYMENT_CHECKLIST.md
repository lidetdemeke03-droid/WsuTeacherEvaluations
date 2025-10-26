# Deployment Checklist

## 1. Environment Variables

Ensure the following environment variables are set in your production environment:

*   `PORT`: The port on which the application server will run.
*   `MONGO_URI`: The connection string for your MongoDB Atlas cluster.
*   `JWT_SECRET`: A secret key for signing JWT access tokens.
*   `JWT_REFRESH_SECRET`: A secret key for signing JWT refresh tokens.
*   `CLOUDINARY_CLOUD_NAME`: (Optional) Your Cloudinary cloud name for file uploads.
*   `CLOUDINARY_API_KEY`: (Optional) Your Cloudinary API key.
*   `CLOUDINARY_API_SECRET`: (Optional) Your Cloudinary API secret.

## 2. Security

*   **Enable HTTPS:** Configure your production environment to use HTTPS to encrypt all traffic to and from the application.
*   **CORS Policy:** The application's CORS policy is configured to allow all origins. For a production environment, you should restrict this to only allow requests from your frontend application's domain.
*   **Rate Limiting:** The application has a basic rate limiting policy in place. You may want to adjust the rate limit settings based on your application's traffic patterns.

## 3. Backups

*   **MongoDB Atlas Backups:** Configure regular backups for your MongoDB Atlas cluster. This will allow you to restore the database in case of a disaster.

## 4. Monitoring

*   **Logging:** The application is configured to log errors to a file. You should set up a log monitoring service to alert you of any errors that occur in the application.
*   **Metrics:** Monitor key application metrics, such as CPU usage, memory usage, and response times, to ensure the application is running smoothly.

## 5. TLS Enforcement

*   Ensure that your production environment is configured to enforce TLS 1.2 or higher.
