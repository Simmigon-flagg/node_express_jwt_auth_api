const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./redis");

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ACCESS_TOKEN;
      const options = {
        expiresIn: "50s",
        issuer: process.env.COMPANY_WEBSITE_NAME,
        audience: userId,
      };
      JWT.sign(payload, secret, options, (error, token) => {
        if (error) {
          console.log(error.message);
          // reject(error)
          return reject(createError.InternalServerError());
        }

        resolve(token);
      });
    });
  },
  verfityToken: (request, response, next) => {
    if (!request.headers["authorization"])
      return next(createError.Unauthorized());
    const authHeader = request.headers["authorization"];
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    console.log(token);
    JWT.verify(token, process.env.ACCESS_TOKEN, (error, payload) => {
      if (error) {
        const message =
          error.name === "JsonWebTokenError" ? "Unauthorized" : error.message;
        return next(createError.Unauthorized(message));
      }

      request.payload = payload;
      next();
    });
  },

  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN;
      const options = {
        expiresIn: '1y',
        issuer: process.env.COMPANY_WEBSITE_NAME,
        audience: userId,
      };

      JWT.sign(payload, secret, options, (error, token) => {
        if (error) {
          console.log(error.message);
          return reject(createError.InternalServerError());
        }

        client.setex(userId, 364 * 60 * 60 * 24, token, (err, reply) => {
          if (error) {
            console.log(`Error: ${error}`);
            return reject(createError.InternalServerError());
          }
          console.log(`reply: ${reply}`);
          return resolve(token);
        });
      });
    });
  },

  verifyRefreshToken: (refreshtoken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(refreshtoken, process.env.REFRESH_TOKEN, (error, payload) => {
        if (error) return reject(createError.Unauthorized());
        const userId = payload.aud;
        // Blacklisting happens here using Redis
        client.get(userId,  (err, redisToken) => {
          if (error) {
            console.log(error.message);

            return reject(createError.InternalServerError());
          }
          // 
          if (refreshtoken === redisToken) return resolve(userId);
          reject(createError.Unauthorized());
        });
      });
    });
  },
};
