import mongoose, { Schema, models, model } from "mongoose";

const PoliticalPartySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        abbreviation: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        logo: {
            type: String,
            default: "",
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        website: {
            type: String,
            default: "",
            trim: true,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

const PoliticalParty =
    models.PoliticalParty ||
    model("PoliticalParty", PoliticalPartySchema);

export default PoliticalParty;