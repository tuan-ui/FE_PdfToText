export const sanitizeInput = (value: string): string => {
    if (!value) return '';
    const temp = value
        .replace(/<[^>]*>/g, '') // remove HTML tags
        .replace(/script/gi, ''); // remove script keyword
    return temp;
};

// Utility: remove accents (Vietnamese)
export const removeAccents = (str: string) => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};