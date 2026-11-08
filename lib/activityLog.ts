import { connectDB } from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";

interface LogActivityParams {
    adminId: string;
    action: string;
    description: string;
    targetType?: string;
    targetId?: string;
}

export async function logActivity({
    adminId,
    action,
    description,
    targetType = "General",
    targetId,
}: LogActivityParams) {
    try {
        await connectDB();

        await ActivityLog.create({
            admin: adminId,
            action,
            description,
            targetType,
            targetId: targetId || null,
        });
    } catch (error) {
        console.error("Activity logging error:", error);
    }
}