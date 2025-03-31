import {MongoClient, ServerApiVersion, ObjectId} from 'mongodb';

const password="Zehfu468";
const userName="rajavi";
const server="cluster0.w4nc2bx.mongodb.net";

const encodedUsername=encodeURIComponent(userName);
const encodedPassword=encodeURIComponent(password);

const connectionURI = "mongodb+srv://rajavi:Zehfu468@cluster0.q2w1i.mongodb.net/CourseWorkS?retryWrites=true&w=majority";
const client = new MongoClient(connectionURI, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(connectionURI);

const database=client.db("CourseWork");
const collection=database.collection("cw2");

export {collection};

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB successfully");
        const db = client.db("CourseWork"); // Explicitly use the database name
        const collectionsList = await db.listCollections().toArray(); // Renamed to avoid conflict
        console.log('Collections: ', collectionsList);

        return db;
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

await client.close()

export default connectDB;
connectDB();