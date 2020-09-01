// const redis = require('redis')

const redis = require("redis")
  const client = redis.createClient({
    port: process.env.REDIS_PORT, // replace with your hostanme or IP address
    
    host: process.env.REDIS_HOST
  });

client.on("connect", () => {
  console.log("Redis client connected");

});


client.on("ready", () => {
  console.log("Redis client ready to use");

});

client.on("error", (error) => {
  console.log(error.message);
});

client.on("end", () => {
  console.log("Redis client disconnect");
});

client.on("end", () => {
  console.log("Redis client disconnect");
});

process.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
