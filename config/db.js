const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI is not set in the environment");
    }

    try {
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);

        if (mongoUri.includes("mongodb.net")) {
            console.error(
                "Atlas check: verify the URI format, add your current IP in Atlas Network Access, and make sure your network/DNS allows MongoDB Atlas resolution."
            );
        }

        throw error;
    }
};

module.exports = connectDB;
