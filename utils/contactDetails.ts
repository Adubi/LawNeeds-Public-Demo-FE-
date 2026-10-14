const EMAIL_PATTERN = /(?:^|[^\w.+-])[a-z0-9][a-z0-9._%+-]{0,63}\s*(?:@|\[\s*at\s*\]|\(\s*at\s*\)|\bat\b)\s*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\s*(?:\.|\[\s*dot\s*\]|\(\s*dot\s*\)|\bdot\b)\s*[a-z]{2,24})+(?=$|[^\w.-])/i;
const PHONE_CANDIDATE_PATTERN = /(?:^|[^\w])(?:\+?\d[\d\s().-]{5,}\d)(?=$|[^\w])/g;

export const containsContactDetails = (text?: string | null): boolean => {
    if (!text) return false;
    if (EMAIL_PATTERN.test(text)) return true;

    for (const match of text.matchAll(PHONE_CANDIDATE_PATTERN)) {
        const digitCount = (match[0].match(/\d/g) || []).length;
        const candidate = match[0].trimStart();
        const minimumDigits = candidate.startsWith('+') ? 7 : 10;
        if (digitCount >= minimumDigits && digitCount <= 15) return true;
    }
    return false;
};
