import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    sources: [
      {
        chunkIndex: Number,      
        similarity: String,     
        preview:    String,       
      },
    ],
  },
  { timestamps: true }    
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    fileName: {
      type: String,
      default: "",
    },

    messages: [messageSchema],
  },
  { timestamps: true }      
);

export default mongoose.model("Chat", chatSchema);