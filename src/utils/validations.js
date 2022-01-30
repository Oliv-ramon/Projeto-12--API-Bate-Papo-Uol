import joi from "joi";

import mongoConnection from "./mongoConnection.js";

function validateParticipant(data, res) {
  const participantSchema = joi.object({
    name: joi.string().required(),
  });

  const validation = participantSchema.validate(data, {  abortEarly: false });

  if (validation.error) {
    const errorMessages = validation.error.details.map(({message}) => message);
    res.status(422).send(`Validation error(s): ${errorMessages.join(", ")}`);
    return true;
  }

  return false;
}

async function validateMessage(data, res) {
  const mongoClient = await mongoConnection();
  
  const participantsCollection = mongoClient.db("Bate-Papo_Uol").collection("participants");
  const participants = await participantsCollection.find({}).toArray();
  const participantsNames = participants.map(({name}) => name);

  const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.valid("message", "private_message").required(),
    from: joi.valid(...participantsNames).required(),
  });

  const validation = messageSchema.validate(data, {  abortEarly: false });

  if (validation.error) {
    const errorMessages = validation.error.details.map(({message}) => message);
    res.status(422).send(`Validation error(s): ${errorMessages.join(", ")}`);
    return true;
  }

  mongoClient.close();

  return false;  
}


export { 
  validateParticipant,
  validateMessage
};