import express, { json } from "express";
import cors from "cors";
import mongoConnection from "./utils/mongoConnection.js";

const app = express();
app.use(json());
app.use(cors());

app.post("/participants", async (req,res) => {
  try {
    const mongoClient = await mongoConnection();

    const participantsCollection = mongoClient.db("Bate-Papo_Uol").collection("participants");
    await participantsCollection.insertOne(req.body);
    const participants = await participantsCollection.find({}).toArray();

    res.send(participants);
    mongoClient.close();
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
  }
})


app.listen(5000, console.log("Running in http://localhost:5000"))