import type { CVData, SectionKey } from '../../../types';
import { getMinimalHeadings, getTranslations } from '../../../data/translations';

interface Props {
    cvData: CVData;
}

export default function MinimalTemplate({ cvData }: Props) {
    const { personal, summary, experience, education, skillGroups, certifications, languages, extracurriculars } = cvData;
    const sections = [...cvData.sectionSettings].sort((a, b) => a.order - b.order).filter((s) => s.visible);
    const lang = cvData.cvLanguage ?? 'en';
    const H = getMinimalHeadings(lang);
    const t = getTranslations(lang);

    const renderSection = (key: SectionKey) => {
        switch (key) {
            case 'summary': {
                if (!summary.text && summary.highlights.every((h) => !h)) return null;
                return (
                    <div key={key} className="mb-3">
                        <h2 className="cv-heading-minimal">{H.summary}</h2>
                        {summary.text && <p className="cv-text mt-1">{summary.text}</p>}
                        {summary.highlights.filter(Boolean).length > 0 && (
                            <ul className="cv-list mt-1">
                                {summary.highlights.filter(Boolean).map((h, i) => (
                                    <li key={i}>{h}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            }
            case 'experience': {
                const filled = experience.filter((e) => e.role || e.company);
                if (!filled.length) return null;
                return (
                    <div key={key} className="mb-3">
                        <h2 className="cv-heading-minimal">{H.experience}</h2>
                        {filled.map((exp) => (
                            <div key={exp.id} className="cv-entry">
                                <div className="cv-entry-header">
                                    <div>
                                        <span className="cv-entry-title">{exp.role}</span>
                                        {exp.company && <span className="cv-entry-subtitle"> - {exp.company}</span>}
                                        {exp.location && <span className="cv-entry-subtitle">, {exp.location}</span>}
                                    </div>
                                    <span className="cv-entry-date">
                                        {exp.startDate}{exp.startDate && ' - '}{exp.isCurrent ? t.labels.present : exp.endDate}
                                    </span>
                                </div>
                                {exp.bullets.filter(Boolean).length > 0 && (
                                    <ul className="cv-list">
                                        {exp.bullets.filter(Boolean).map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }
            case 'education': {
                const filled = education.filter((e) => e.degree || e.school);
                if (!filled.length) return null;
                return (
                    <div key={key} className="mb-3">
                        <h2 className="cv-heading-minimal">{H.education}</h2>
                        {filled.map((edu) => (
                            <div key={edu.id} className="cv-entry">
                                <div className="cv-entry-header">
                                    <div>
                                        <span className="cv-entry-title">{edu.degree}</span>
                                        {edu.school && <span className="cv-entry-subtitle"> - {edu.school}</span>}
                                        {edu.location && <span className="cv-entry-subtitle">, {edu.location}</span>}
                                    </div>
                                    <span className="cv-entry-date">
                                        {edu.startDate}{edu.startDate && ' - '}{edu.endDate}
                                    </span>
                                </div>
                                {edu.grade && <p className="cv-text" style={{ marginTop: '2px' }}>{t.labels.grade}: {edu.grade}</p>}
                                {edu.modules.filter(Boolean).length > 0 && (
                                    <p className="cv-text" style={{ marginTop: '2px' }}>
                                        {t.labels.relevantModules}: {edu.modules.filter(Boolean).join(', ')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }
            case 'skills': {
                const filled = skillGroups.filter((g) => g.category && g.skills.some(Boolean));
                if (!filled.length) return null;
                return (
                    <div key={key} className="mb-3">
                        <h2 className="cv-heading-minimal">{H.skills}</h2>
                        {filled.map((group) => (
                            <p key={group.id} className="cv-text" style={{ marginTop: '2px' }}>
                                <strong>{group.category}:</strong> {group.skills.filter(Boolean).join(', ')}
                            </p>
                        ))}
                    </div>
                );
            }
            case 'certifications': {
                const filled = certifications.filter((c) => c.name);
                if (!filled.length) return null;
                return (
                    <div key={key} className="mb-3">
                        <h2 className="cv-heading-minimal">{H.certifications}</h2>
                        {filled.map((cert) => (
                            <p key={cert.id} className="cv-text" style={{ marginTop: '2px' }}>
                                {cert.name}{cert.issuer && ` - ${cert.issuer}`}{cert.year && ` (${cert.year})`}
                            </p>
                        ))}
                    </div>
                );
            }
            case 'languages': {
                const filled = languages.filter((l) => l.language);
                if (!filled.length) return null;
                return (
                    <div key={key} className="mb-3">
                        <h2 className="cv-heading-minimal">{H.languages}</h2>
                        <p className="cv-text" style={{ marginTop: '2px' }}>
                            {filled.map((l) => `${l.language} (${l.level})`).join(' | ')}
                        </p>
                    </div>
                );
            }
            case 'extracurriculars': {
                const filled = extracurriculars.filter((e) => e.title);
                if (!filled.length) return null;
                return (
                    <div key={key} className="mb-3">
                        <h2 className="cv-heading-minimal">{H.extracurriculars}</h2>
                        {filled.map((item) => (
                            <div key={item.id} className="cv-entry">
                                <span className="cv-entry-title">{item.title}</span>
                                {item.bullets.filter(Boolean).length > 0 && (
                                    <ul className="cv-list">
                                        {item.bullets.filter(Boolean).map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className="cv-page font-['Arial',_'Helvetica',_sans-serif]">
            {/* Header */}
            <div className="mb-3">
                <h1 className="text-[18px] font-bold text-black">
                    {personal.fullName || 'Your Name'}
                </h1>
                {personal.targetTitle && (
                    <p className="text-[11px] text-gray-600 mt-0.5">{personal.targetTitle}</p>
                )}
                <p className="text-[10px] text-gray-500 mt-1">
                    {[personal.email, personal.phone, personal.location].filter(Boolean).join(' | ')}
                </p>
                {(personal.linkedIn || personal.github || personal.portfolio) && (
                    <p className="text-[10px] text-gray-500">
                        {[personal.linkedIn, personal.github, personal.portfolio].filter(Boolean).join(' | ')}
                    </p>
                )}
            </div>

            {/* Sections */}
            {sections.map((s) => renderSection(s.key))}
        </div>
    );
}
