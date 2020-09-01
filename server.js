require("dotenv").config();
const express = require("express");
const createError = require('http-errors');
const morgan = require("morgan");
const auth = require('./controllers/auth');
const { verfityToken } = require('./config/jwt_auth')
require('./config/mongoconnection');


const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());
app.use(morgan("tiny"));
app.use('/api/v1/',auth)



app.get("/dashboard", verfityToken ,async (request, response, next) => {
  console.log(request.payload)
  response.send("Home");
});

app.use(async (request, response ,next) =>{
    next(createError.NotFound("Not ready"))
})
app.use((error, request, response, next) =>{
    response.status(error.status || 500)
    response.send({
        error:{
            status: error.status || 500,
            message: error.message,
        },
    })
   
})


// const auth = require('./controllers/auth');
// app.use('/api/auth', auth);

// const users = require('./controllers/users');
// app.use('/api/user', users);

// const adminportal = require('./controllers/adminportal');
// app.use('/api/adminportal', adminportal);

// // 
// const owner = require('./controllers/owners');
// app.use('/api/owners', owner);
// const manager = require('./controllers/managers');
// app.use('/api/managers', manager);
// const teammember = require('./controllers/teammembers');
// app.use('/api/teammembers', teammember);

// // 
// const items = require('./controllers/items');
// app.use('/api/items', items);

if (process.env.NODE_ENV === "production") {
  app.use(express.static("./client/build"));
}


app.listen(PORT, function () {
  console.log(`App listening on PORT ${PORT}`);
});
