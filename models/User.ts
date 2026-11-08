import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        state: {
            type: String,
            required: true,
        },

        lga: {
            type: String,
            default: "",
        },

        role: {
            type: String,
            enum: ["user", "admin", "superadmin"],
            default: "user",
        },

        accountStatus: {
            type: String,
            enum: ["active", "suspended"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

const User = models.User || model("User", UserSchema);

export default User;