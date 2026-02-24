import type { SectionKey } from '../types';

export type CVLanguage = 'en' | 'fr';

interface CVTranslations {
    headings: Record<SectionKey, string>;
    labels: {
        present: string;
        grade: string;
        relevantModules: string;
    };
}

const translations: Record<CVLanguage, CVTranslations> = {
    en: {
        headings: {
            summary: 'SUMMARY',
            experience: 'WORK EXPERIENCE',
            education: 'EDUCATION',
            skills: 'SKILLS',
            certifications: 'CERTIFICATIONS',
            languages: 'LANGUAGES',
            extracurriculars: 'EXTRACURRICULARS',
        },
        labels: {
            present: 'Present',
            grade: 'Grade',
            relevantModules: 'Relevant Modules',
        },
    },
    fr: {
        headings: {
            summary: 'PROFIL',
            experience: 'EXPERIENCE PROFESSIONNELLE',
            education: 'FORMATION',
            skills: 'COMPETENCES',
            certifications: 'CERTIFICATIONS',
            languages: 'LANGUES',
            extracurriculars: 'ACTIVITES EXTRA-PROFESSIONNELLES',
        },
        labels: {
            present: 'Aujourd\'hui',
            grade: 'Mention',
            relevantModules: 'Modules pertinents',
        },
    },
};

// Minimal headings for the "minimal" template (title-case)
const minimalTranslations: Record<CVLanguage, Record<SectionKey, string>> = {
    en: {
        summary: 'Summary',
        experience: 'Work Experience',
        education: 'Education',
        skills: 'Skills',
        certifications: 'Certifications',
        languages: 'Languages',
        extracurriculars: 'Extracurriculars',
    },
    fr: {
        summary: 'Profil',
        experience: 'Exp\u00e9rience professionnelle',
        education: 'Formation',
        skills: 'Comp\u00e9tences',
        certifications: 'Certifications',
        languages: 'Langues',
        extracurriculars: 'Activit\u00e9s extra-professionnelles',
    },
};

export function getTranslations(lang: CVLanguage): CVTranslations {
    return translations[lang];
}

export function getMinimalHeadings(lang: CVLanguage): Record<SectionKey, string> {
    return minimalTranslations[lang];
}
