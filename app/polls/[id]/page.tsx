import PollDetailsClient from "./PollDetailsClient";

export const instant = false;

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function PollDetailsPage({ params }: PageProps) {
    const { id } = await params;

    return <PollDetailsClient id={id} />;
}