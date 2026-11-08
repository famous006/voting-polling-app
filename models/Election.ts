import mongoose, { Schema, models, model } from "mongoose";

const ElectionSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Presidential",
                "Governorship",
                "Senatorial",
                "House of Representatives",
                "State Assembly",
            ],
        },

        state: {
            type: String,
            default: "National",
        },

        description: {
            type: String,
            default: "",
        },

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

const Election =
    models.Election || model("Election", ElectionSchema);

export default Election;