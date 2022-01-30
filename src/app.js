import express, { json } from "express";
import cors from "cors";
import dayjs from "dayjs";

import mongoConnection from "./utils/mongoConnection.js";
import { validateParticipant, validateMessage } from "./utils/validations.js";
import validateDuplicity from "./utils/validateDuplicity.js";

const app = express();
app.use(json());
app.use(cors());


app.post("/participants", async (req,res) => {
  const validation = validateParticipant(req.body, res);
  if (validation) return;

  try {
    const mongoClient = await mongoConnection();

    const participantsCollection = mongoClient.db("Bate-Papo_Uol").collection("participants");

    const participantAlredyExist = await validateDuplicity(participantsCollection, { name: req.body.name }, res);
    if (participantAlredyExist) return;


    await participantsCollection.insertOne({ ...req.body, lastStatus: Date.now() });

    const messagesCollection = mongoClient.db("Bate-Papo_Uol").collection("messages");
    await messagesCollection.insertOne(
      {
        from: req.body.name, 
        to: 'Todos', 
        text: 'entra na sala...', 
        type: 'status', 
        time: dayjs().locale("br").format('HH:mm:ss'),
      }
    );

    res.sendStatus(201);
    mongoClient.close();
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
  }
});

app.get("/participants", async (req,res) => {
  try {
    const mongoClient = await mongoConnection();

    const participantsCollection = mongoClient.db("Bate-Papo_Uol").collection("participants");

    const participants = await participantsCollection.find({}).toArray();

    res.status(200).send(participants);
    mongoClient.close();
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
  }
});

app.post("/messages", async  (req, res) => {
  const message = { ...req.body, from: req.headers.user };
  
  const validation = await validateMessage(message, res);
  console.log(validation)
  if (validation) return;

  try {
    const mongoClient = await mongoConnection();

    const messagesCollection = mongoClient.db("Bate-Papo_Uol").collection("messages");

    await messagesCollection.insertOne({ ...message, time: dayjs().locale("br").format('HH:mm:ss') });

    res.sendStatus(201);
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
  }
  
})




app.listen(5000, console.log("Running in http://localhost:5000"))