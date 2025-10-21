const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: Number,
  username: { type: String, default: "unknown" },
  isNew: { type: Boolean, default: true },
  settings: {
    pageSize: { type: String, default: "A4" },
    orientation: { type: String, default: "portrait" },
    compress: { type: Boolean, default: true },
    header: { type: Boolean, default: true },
    footer: { type: Boolean, default: true },
    password: { type: String, default: "" },
    includeOCR: { type: Boolean, default: true },
    language: { type: String, default: "en" }
  }
});

module.exports = mongoose.model("User", UserSchema);
