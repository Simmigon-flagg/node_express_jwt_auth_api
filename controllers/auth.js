const express = require("express");
const createError = require("http-errors");
const router = express.Router();
const User = require("../models/Users");
const { authSchema } = require("../config/validation_schema");
const client = require("../config/redis");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt_auth");

router.get("/", async (request, response, next) => {
  response.send("Home");
});

router.get("/redisvalues", async (request, response, next) => {
  try {
    const users = await User.find();

    for (let n of users) {
      console.log(n.id)
      client.get(n.id,  (err, reply) => {
        if (reply) {
          console.log(reply+"\n");
        } else {
          console.log(`Key ${n._id} not found in Redis.\n`);
        }
      });
    }
    return response.status(200)
  } catch (error) {
    if (error.isJoi) error.status = 422;
    next(error);
  }
});
router.get("/resetusercollection", async (request, response, next) => {
  try {
    await User.collection.drop();
    response.json({ Success: true });
  } catch (error) {
    if (error.isJoi) error.status = 422;
    next(error);
  }
});
router.post("/register", async (request, response, next) => {
  try {
    const result = await authSchema.validateAsync(request.body);

    const userfound = await User.findOne({ email: result.email });
    if (userfound)
      throw createError.Conflict(`${result.email} already in database`);

    const user = new User(result);
    const savedUser = await user.save();
    const accessToken = await signAccessToken(savedUser.id);
    const refreshToken = await signRefreshToken(savedUser.id);

    console.log("Registerd User ", savedUser);
    response.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    // if (error.isJoi === true) error.status = 422;
    if (error.isJoi) error.status = 422;
    next(error);
  }
  // response.send("register");
});
router.post("/login", async (request, response, next) => {
  try {
    const result = await authSchema.validateAsync(request.body);
    const user = await User.findOne({ email: result.email });

    if (!user) throw createError.NotFound("User Doesn't Exist");

    const isMatch = await user.checkPassword(result.password);
    if (!isMatch) throw createError.Unauthorized("Username/Password not Valid");
    console.log({ Logged_in: true });

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);

    response.send({ accessToken, refreshToken });
  } catch (error) {
    if (error.isJoi)
      return next(createError.BadRequest("Invalid Username/Password"));
    next(error);
  }
});
router.post("/refresh-token", async (request, response, next) => {
  try {
    console.log(request.body.refreshToken);
    const token = request.body.refreshToken;

    if (!token) throw createError.BadRequest();
    const userId = await verifyRefreshToken(token);
    const accessToken = await signAccessToken(userId);
    const refreshToken = await signRefreshToken(userId);

    response.send({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});
router.delete("/logout", async (request, response, next) => {
  console.log("logout");
  try {
    
    const { refreshToken } = request.body;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    client.del(userId, (error, value) => {
      if (error) {
        console.log(error.message);
        throw createError.InternalServerError();
      }
      console.log(value);
      response.sendStatus(204);
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
