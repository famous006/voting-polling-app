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

        // Password is optional for Google users
        password: {
            type: String,
            required: false,
            select: false,
        },

        // Google account ID
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        state: {
            type: String,
            default: "",
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

        isEmailVerified: {
            type: Boolean,
            default: true,
        },

        emailVerificationTokenHash: {
            type: String,
            select: false,
        },

        emailVerificationExpiresAt: {
            type: Date,
            select: false,
        },

        emailVerifiedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = models.User || model("User", UserSchema);

export default User;