import type { CSSProperties } from 'react';
import type { CVData } from '../../../types';
import ClassicTemplate from './ClassicTemplate';

export default function DesignedTemplate({ cvData }: { cvData: CVData }) {
    const { personal: p, design } = cvData;
    const sidebar = new Set(['skills', 'languages', 'certifications']);
    const column = (side: boolean) => ({ ...cvData, sectionSettings: cvData.sectionSettings.filter(s => sidebar.has(s.key) === side) });
    const accent = /^#[0-9a-f]{6}$/i.test(design?.accent ?? '') ? design!.accent : '#245c62';
    const photo = design?.photo?.match(/^data:image\/(jpeg|png|webp);base64,/) ? design.photo : undefined;
    // No full-width header band: the photo tops the sidebar and the name tops the main column, so content starts higher.
    return (
        <article className="cv-page designed-page" style={{ '--resume-accent': accent } as CSSProperties}>
            <div className="designed-columns">
                <aside className="designed-sidebar">
                    {photo && <img className="designed-photo" src={photo} alt={p.fullName ? `Portrait of ${p.fullName}` : 'Resume portrait'} style={{ objectPosition: `50% ${design?.photoPosition ?? 50}%` }} />}
                    <section className="designed-contact">
                        <h2 className="cv-heading-classic">Contact</h2>
                        {[p.email, p.phone, p.location, p.linkedIn, p.github, p.portfolio].filter(Boolean).map((value, index) => <p key={index}>{value}</p>)}
                    </section>
                    <ClassicTemplate cvData={column(true)} sectionsOnly />
                </aside>
                <main className="designed-main">
                    <header className="designed-header">
                        <p className="designed-eyebrow">{cvData.cvLanguage === 'fr' ? 'CURRICULUM VITAE' : 'RESUME'}</p>
                        <h1>{p.fullName || 'Your Name'}</h1>
                        {p.targetTitle && <p className="designed-title">{p.targetTitle}</p>}
                    </header>
                    <ClassicTemplate cvData={column(false)} sectionsOnly />
                </main>
            </div>
        </article>
    );
}
