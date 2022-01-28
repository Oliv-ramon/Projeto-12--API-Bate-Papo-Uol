import joi from "joi";


function validate(data, res) {
  const participantSchema = joi.object({
    name: joi.string().required().min(1),
  });
  
  const validation = participantSchema.validate(data, {  abortEarly: false });

  if (validation.error) {
    const errorMessages = validation.error.details.map(({message}) => message);
    res.status(422).send(`Validation error(s): ${errorMessages.join(", ")}`);
    return false;
  }

  return true;
}

export default validate;