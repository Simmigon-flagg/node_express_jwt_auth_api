const mongoose = require("mongoose");
const client = require("../config/redis");
const Users = require("../models/Users");
const uri = process.env.MONGODB_URI || process.env.DB_CONNECTION;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(() =>{
    console.log("Connected To MONGO")
}).catch((error) =>{
    console.log(error.message)
})


mongoose.connection.on("connected", async () => {
  console.log("Connected to DATABASE");
  const user =  await Users.find();
  console.log("From Redis")
  for(let n of user){
    
    client.get(n.id, (err, token) =>{
      console.log({userId: n.id,token});
    })

  }
});

mongoose.connection.on("error", (error) => {
  console.log("error: " + error.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose default connection is disconnected");
});

process.on('SIGINT', async () =>{
    await mongoose.connection.close()
    process.exit(0)
})