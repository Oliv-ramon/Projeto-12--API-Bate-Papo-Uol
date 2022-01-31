import express, { json } from "express";
import cors from "cors";
import dayjs from "dayjs";

import mongoConnection from "./utils/mongoConnection.js";
import { validateParticipant, validateMessage } from "./utils/validations.js";
import validateDuplicity from "./utils/validateDuplicity.js";
import { ObjectId } from "bson";
import { stripHtml } from "string-strip-html";

const app = express();
app.use(json());
app.use(cors());


app.post("/participants", async (req,res) => {
  const nameCleaned = stripHtml(req.body.name).result.trim();

  const validation = validateParticipant(req.body, res);
  if (validation) return;

  try {
    const mongoClient = await mongoConnection();

    const participantsCollection = mongoClient.db("Bate-Papo_Uol").collection("participants");

    const participantAlredyExist = await validateDuplicity(participantsCollection, { name: nameCleaned }, res);
    if (participantAlredyExist) return;


    await participantsCollection.insertOne({ name: nameCleaned, lastStatus: Date.now() });

    const messagesCollection = mongoClient.db("Bate-Papo_Uol").collection("messages");
    await messagesCollection.insertOne(
      {
        from: nameCleaned, 
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
  if (validation) return;

  try {
    const mongoClient = await mongoConnection();

    const messagesCollection = mongoClient.db("Bate-Papo_Uol").collection("messages");

    await messagesCollection.insertOne({ ...message, time: dayjs().locale("br").format('HH:mm:ss') });

    res.sendStatus(201);
    mongoClient.close();
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
  }
});

app.get("/messages", async (req,res) => {
  const user = req.headers.user;
  const limit = req.query.limit;
  
  try {
    const mongoClient = await mongoConnection();

    const messagesCollection = mongoClient.db("Bate-Papo_Uol").collection("messages");

    const messages = await messagesCollection.find({$or: [
      { to: "Todos" }, 
      { to: user },
      { from: user }
    ]}).toArray();

    res.status(200).send(messages.slice(-limit));
    mongoClient.close();
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
  }
});

app.delete("/messages/:messageId", async (req, res) => {
  const user = req.headers.user;
  const id = req.params.messageId;

  try {
    const mongoClient = await mongoConnection();
    
    const messagesCollection = mongoClient.db("Bate-Papo_Uol").collection("messages");

    const message = await messagesCollection.findOne({ _id: new ObjectId(id) });

    if (!message) {
      res.sendStatus(404);
      return;
    } else if (message.from !== user) {
      res.sendStatus(401);
      return;
    }
    
    await messagesCollection.deleteOne({ _id: new ObjectId(id) });
    res.status(200).send("Deleted");
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.put("/messages/:messageId", async (req, res) => {
  const id = req.params.messageId;
  const newMessage = { ...req.body, from: req.headers.user };

  const validation = await validateMessage(newMessage, res);
  if (validation) return;

  try {
    const mongoClient = await mongoConnection();
    
    const messagesCollection = mongoClient.db("Bate-Papo_Uol").collection("messages");

    const message = await messagesCollection.findOne({ _id: new ObjectId(id) });

    if (!message) {
      res.sendStatus(404);
      return;
    } else if (message.from !== req.headers.user ) {
      res.sendStatus(401);
      return;
    }
    
    await messagesCollection.updateOne({ _id: new ObjectId(id) }, { $set: newMessage });
    res.status(200).send("Updated");
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  const userCleaned = stripHtml(req.headers.user).result.trim();

  try {
    const mongoClient = await mongoConnection();

    const participantsCollection = mongoClient.db("Bate-Papo_Uol").collection("participants");

    const updatement = await participantsCollection.updateOne({ name: userCleaned }, { $set: { lastStatus: Date.now() } });

    if (updatement.modifiedCount === 0) {
      res.sendStatus(404);
      return;
    }

    res.sendStatus(200);
    mongoClient.close();
  } catch (error) {
    console.log(error)
    res.sendStatus(500);
  }
});

setInterval(async () => {
  const now = Date.now();

  try {
    const mongoClient = await mongoConnection();

    const participantsCollection = mongoClient.db("Bate-Papo_Uol").collection("participants");
    
    const offLineParticipants = await participantsCollection.find({ lastStatus: { $lt: now - 10000 }}).toArray();
    await participantsCollection.deleteMany({ lastStatus: { $lt: now - 10000 }});

    offLineParticipants.forEach( async ({name}) => {
      const messagesCollection = mongoClient.db("Bate-Papo_Uol").collection("messages");
      await messagesCollection.insertOne(
        {
          from: name, 
          to: 'Todos', 
          text: 'sai da sala...', 
          type: 'status', 
          time: dayjs().locale("br").format('HH:mm:ss'),
        }
      );
      mongoClient.close();
    })

  } catch {
    console.log(error);
    res.sendStatus(500);
  }

}, 15000);

app.listen(5000, console.log("Running in http://localhost:5000"))