import mongoose, { Schema, models, model } from "mongoose";

const PollSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        question: {
            type: String,
            required: true,
            trim: true,
        },

        election: {
            type: Schema.Types.ObjectId,
            ref: "Election",
            required: true,
        },

        candidates: [
            {
                type: Schema.Types.ObjectId,
                ref: "Candidate",
            },
        ],

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: ["Upcoming", "Active", "Closed"],
            default: "Upcoming",
        },
    },
    { timestamps: true }
);

const Poll = models.Poll || model("Poll", PollSchema);

export default Poll;