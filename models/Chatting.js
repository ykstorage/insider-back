var mongoose = require("mongoose");

// var ChattingSchema = new mongoose.Schema(
//     {
//         body: String,
//         author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" }
//     },
//     { timestamps: true, usePushEach: true }
// );

var ChattingSchema = new mongoose.Schema(
    {
        author: String,
        type: String,
        data: Object
    },
    { timestamps: true, usePushEach: true }
);

mongoose.model("Chatting", ChattingSchema);
