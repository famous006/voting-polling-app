import mongoose, { Schema, models, model } from "mongoose";

const CandidateSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        party: {
            type: String,
            required: true,
            trim: true,
        },

        partyLogo: {
            type: String,
            default: "",
        },

        profileImage: {
            type: String,
            default: "",
        },

        state: {
            type: String,
            default: "National",
        },

        election: {
            type: Schema.Types.ObjectId,
            ref: "Election",
            required: true,
        },

        biography: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const Candidate =
    models.Candidate || model("Candidate", CandidateSchema);

export default Candidate;