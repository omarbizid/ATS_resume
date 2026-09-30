import type { CVData } from '../types';

/** Reads a JSON backup chosen by the user, rejecting files that are not CV data. */
export async function readCVFile(file: File): Promise<CVData> {
    let data: unknown;
    try {
        data = JSON.parse(await file.text());
    } catch {
        throw new Error('This file is not valid JSON.');
    }
    const cv = data as Partial<CVData> | null;
    if (!cv || typeof cv !== 'object' || !cv.personal || !cv.sectionSettings) {
        throw new Error('This file is not a CV Studio backup.');
    }
    return cv as CVData;
}
