export const removeUnderscoresAndCapitalize = (str: string): string => {
    if (!str) return "";
    return str
        .replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};