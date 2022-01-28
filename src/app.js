import express, { json } from "express";
import cors from "cors";
import dayjs from "dayjs";

import mongoConnection from "./utils/mongoConnection.js";
import validate from "./utils/validate.js";
import validateDuplicity from "./utils/validateDuplicity.js";

const app = express();
app.use(json());
app.use(cors());


app.post("/participants", async (req,res) => {
  const validation = validate(req.body, res);

  if (!validation) return;

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
    )
    console.log(dayjs().format('HH:mm:ss'))

    res.sendStatus(201);
    mongoClient.close();
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
  }
});




app.listen(5000, console.log("Running in http://localhost:5000"))