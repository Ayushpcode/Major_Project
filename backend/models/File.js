import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
   fileName: {
      type: String,
      required: true,               
    },
      totalChunks: {
      type: Number,
      default: 0,
    },
      chromaIds: {
      type: [String],
      default: [],
    },
}, { timestamps: true });

export default mongoose.model("Document", documentSchema);