import express, { json } from "express";
import cors from "cors";
import joi from "joi";
import mongoConnection from "./utils/mongoConnection.js";

const app = express();
app.use(json());
app.use(cors());

const participantSchema = joi.object({
  name: joi.string().required().min(1),
  laststatus: joi.number().required(),
})

app.post("/participants", async (req,res) => {
  const validation = participantSchema.validate(req.body, {  abortEarly: false });

  if (validation.error) {
    const errorMessages = validation.error.details.map(({message}) => message);
    res.status(422).send(`Validation error(s): ${errorMessages.join(", ")}`);
    return;
  }

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