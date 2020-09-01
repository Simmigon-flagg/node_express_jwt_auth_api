const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  email: {
    type: String,
    require: true,
    lowercase: true,
    // Later Set this to true
    unique: false,
  },
  password: {
    type: String,
    require: true,
  },
});

UserSchema.pre("save", async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    const beforehash = this.password;
    this.password = hashedPassword;
    console.log("Created New User");
    console.log(this.email, beforehash, this.password);
    next()

  } catch (error) {
    next(error);
  }
});

UserSchema.methods.checkPassword = async function(password) {
  try {
   return await bcrypt.compare(password,this.password)
  } catch (error) {
    throw error
  }
}
module.exports = mongoose.model("Users", UserSchema);
