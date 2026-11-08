import mongoose, { Schema, models, model } from "mongoose";

const VoteSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        poll: {
            type: Schema.Types.ObjectId,
            ref: "Poll",
            required: true,
        },

        candidate: {
            type: Schema.Types.ObjectId,
            ref: "Candidate",
            required: true,
        },
    },
    { timestamps: true }
);

// Prevent a user from voting more than once in the same poll
VoteSchema.index(
    { user: 1, poll: 1 },
    { unique: true }
);

const Vote = models.Vote || model("Vote", VoteSchema);

export default Vote;