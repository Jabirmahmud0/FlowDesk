
export async function broadcast(event: string, data: any, room: string) {
    try {
        // In production, this URL should be an env var
        const response = await fetch('http://localhost:3001/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, data, room })
        });

        if (!response.ok) {
            console.warn(`Socket broadcast failed with status ${response.status}`);
        }
    } catch (err) {
        // Fail silently so we don't block the main request
        console.error('Socket broadcast error:', err);
    }
}
