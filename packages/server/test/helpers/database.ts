import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

/**
 * Connect to in-memory MongoDB instance for testing
 */
export async function connectDatabase() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
}

/**
 * Close database connection and stop MongoDB instance
 */
export async function closeDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
}

/**
 * Clear all test data from database
 */
export async function clearDatabase() {
    const {models} = mongoose;
    const promises = Object.values(models).map(model => model.deleteMany({}));
    await Promise.all(promises);
}
