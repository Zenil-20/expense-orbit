const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    // active: more expenses + settlements may still happen
    // settling: a settle-up plan exists, some legs unpaid
    // settled: all legs paid; group is closed
    status: { type: String, enum: ["active", "settling", "settled"], default: "active" },
    settledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

groupSchema.index({ members: 1 });

module.exports = mongoose.models.Group || mongoose.model("Group", groupSchema);
