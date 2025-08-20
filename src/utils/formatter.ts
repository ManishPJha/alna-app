export function formatText(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
