import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database connected successfully");
    });

    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables. Please set it in your .env file.");
    }

    // If URI already includes database name, use it as-is
    // Otherwise, specify dbName separately
    const uriHasDbName = mongoUri.match(/\/[^\/\?]+(\?|$)/);
    
    if (uriHasDbName) {
      // URI already has database name, use it directly
      await mongoose.connect(mongoUri);
    } else {
      // URI doesn't have database name, specify it separately
      await mongoose.connect(mongoUri, {
        dbName: 'Freshora'
      });
    }
  } catch (error) {
    console.log("DB Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
