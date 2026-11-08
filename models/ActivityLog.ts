import mongoose, { Schema, models, model } from "mongoose";

const ActivityLogSchema = new Schema(
    {
        admin: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        targetType: {
            type: String,
            default: "General",
        },
        targetId: {
            type: Schema.Types.ObjectId,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const ActivityLog =
    models.ActivityLog || model("ActivityLog", ActivityLogSchema);

export default ActivityLog;