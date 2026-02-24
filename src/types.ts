export interface PersonalInfo {
    fullName: string;
    targetTitle: string;
    email: string;
    phone: string;
    location: string;
    linkedIn: string;
    github: string;
    portfolio: string;
}

export interface Summary {
    text: string;
    highlights: string[];
}

export interface ExperienceItem {
    id: string;
    role: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    bullets: string[];
}

export interface EducationItem {
    id: string;
    degree: string;
    school: string;
    location: string;
    startDate: string;
    endDate: string;
    grade: string;
    modules: string[];
}

export interface SkillGroup {
    id: string;
    category: string;
    skills: string[];
}

export interface CertificationItem {
    id: string;
    name: string;
    issuer: string;
    year: string;
}

export interface LanguageItem {
    id: string;
    language: string;
    level: string;
}

export interface ExtracurricularItem {
    id: string;
    title: string;
    bullets: string[];
}

export type SectionKey =
    | 'summary'
    | 'experience'
    | 'education'
    | 'skills'
    | 'certifications'
    | 'languages'
    | 'extracurriculars';

export interface SectionSetting {
    key: SectionKey;
    label: string;
    visible: boolean;
    order: number;
}

export type TemplateId = 'classic' | 'minimal';
export type CVLanguage = 'en' | 'fr';

export interface CVData {
    personal: PersonalInfo;
    summary: Summary;
    experience: ExperienceItem[];
    education: EducationItem[];
    skillGroups: SkillGroup[];
    certifications: CertificationItem[];
    languages: LanguageItem[];
    extracurriculars: ExtracurricularItem[];
    sectionSettings: SectionSetting[];
    templateId: TemplateId;
    cvLanguage: CVLanguage;
}
