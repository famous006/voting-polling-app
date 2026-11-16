import { Resend } from "resend";

// Email data for registration
interface WelcomeEmailProps {
    email: string;
    name: string;
}

// Email data after voting
interface VoteConfirmationEmailProps {
    email: string;
    name: string;
    pollTitle: string;
    candidateName: string;
    electionTitle?: string;
}

// Initialize Resend only when needed
function getResend() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    return new Resend(apiKey);
}

// Sender information
function getSender() {
    return process.env.EMAIL_FROM || "VoteHub <onboarding@resend.dev>";
}

// Welcome email after registration
export async function sendWelcomeEmail({
    email,
    name,
}: WelcomeEmailProps) {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
        from: getSender(),
        to: email,
        subject: "Welcome to VoteHub 🇳🇬",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #1e293b;">
                <h1 style="color: #1d4ed8;">Welcome to VoteHub 🇳🇬</h1>

                <p>Hello ${escapeHtml(name)},</p>

                <p>
                    Your VoteHub account has been created successfully!
                </p>

                <p>
                    Thank you for joining Nigeria's independent election
                    opinion polling platform.
                </p>

                <p>
                    You can now explore elections, learn about candidates,
                    participate in opinion polls and view polling results.
                </p>

                <p>
                    Your voice matters. Thank you for being part of VoteHub.
                </p>

                <hr style="margin-top: 30px; border: 0; border-top: 1px solid #e2e8f0;" />

                <p style="font-size: 12px; color: #64748b;">
                    VoteHub © 2026. An independent Nigerian election opinion polling platform.
                </p>
            </div>
        `,
    });

    if (error) {
        console.error("Welcome email error:", error);
        throw new Error("Unable to send welcome email");
    }

    return data;
}

// Vote confirmation email
export async function sendVoteConfirmationEmail({
    email,
    name,
    pollTitle,
    candidateName,
    electionTitle,
}: VoteConfirmationEmailProps) {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
        from: getSender(),
        to: email,
        subject: "Your VoteHub Vote Confirmation",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #1e293b;">

                <h1 style="color: #1d4ed8;">Vote Recorded Successfully!</h1>

                <p>Hello ${escapeHtml(name)},</p>

                <p>
                    Thank you for participating in an opinion poll on VoteHub.
                </p>

                <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">

                    <h3 style="margin-top: 0; color: #1e293b;">
                        Vote Confirmation Details
                    </h3>

                    <p>
                        <strong>Poll:</strong>
                        ${escapeHtml(pollTitle)}
                    </p>

                    ${
                        electionTitle
                            ? `<p><strong>Election:</strong> ${escapeHtml(electionTitle)}</p>`
                            : ""
                    }

                    <p>
                        <strong>Selected Candidate:</strong>
                        ${escapeHtml(candidateName)}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        <span style="color: #16a34a; font-weight: bold;">
                            Successfully Recorded
                        </span>
                    </p>

                </div>

                <p>
                    Your participation helps us understand public opinion
                    across Nigeria.
                </p>

                <p>
                    Thank you for using VoteHub!
                </p>

                <hr style="margin-top: 30px; border: 0; border-top: 1px solid #e2e8f0;" />

                <p style="font-size: 12px; color: #64748b;">
                    VoteHub © 2026. An independent Nigerian election opinion polling platform.
                </p>

            </div>
        `,
    });

    if (error) {
        console.error("Vote confirmation email error:", error);
        throw new Error("Unable to send vote confirmation email");
    }

    return data;
}

// Prevent HTML injection
function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[character];
    });
}
