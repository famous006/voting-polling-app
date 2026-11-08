import mongoose, { Schema, models, model } from "mongoose";

const SettingsSchema = new Schema(
    {
        platformName: {
            type: String,
            default: "VoteHub",
        },
        description: {
            type: String,
            default: "Your trusted independent opinion polling platform.",
        },
        contactEmail: {
            type: String,
            default: "",
        },
        contactPhone: {
            type: String,
            default: "",
        },
        logo: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Settings =
    models.Settings || model("Settings", SettingsSchema);

export default Settings;