async function validateDuplicity(collection, filter, res) {
  const alredyExist = await collection.findOne(filter);

    if (alredyExist) {
      res.status(409).send("User Alredy Exist");
      return true;
    }
    return false;
}

export default validateDuplicity;