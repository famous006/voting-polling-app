import PollDetailsClient from "./PollDetailsClient";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function PollDetailsPage({ params }: PageProps) {
    const { id } = await params;

    return <PollDetailsClient id={id} />;
}