import { useMemo, useState } from 'react';
import { useCV } from '../../context/CVContext';
import type { EditorTarget } from '../editor/editorNav';
import { cvWords, extractKeywords, hasKeyword } from '../../data/keywords';

interface Check {
    label: string;
    pass: boolean;
    message: string;
    /** Extra problems beyond the message, listed under it. */
    details?: string[];
    /** Where the user fixes this check. */
    target?: EditorTarget;
}

const JOB_DESCRIPTION_KEY = 'cv-builder-job-description';

function loadJobDescription() {
    try { return localStorage.getItem(JOB_DESCRIPTION_KEY) ?? ''; } catch { return ''; }
}

interface Props {
    /** Opens the editor at a section so the user can fix a failed check. */
    onJump: (target: EditorTarget) => void;
}

export default function ATSChecker({ onJump }: Props) {
    const { cvData } = useCV();

    const checks = useMemo<Check[]>(() => {
        const result: Check[] = [];
        const p = cvData.personal;
        result.push({
            label: 'Layout',
            pass: cvData.templateId !== 'designed',
            message: cvData.templateId === 'designed'
                ? 'Designed resumes use columns and an optional photo. Choose an ATS template for automated applications.'
                : 'Single-column layout without images',
            target: 'design',
        });

        result.push({
            label: 'Email',
            pass: !!p.email && p.email.includes('@'),
            message: !p.email ? 'Missing email address' : p.email.includes('@') ? 'Email provided' : 'Email address looks incomplete',
            target: 'personal',
        });

        result.push({
            label: 'Phone',
            pass: !!p.phone,
            message: p.phone ? 'Phone provided' : 'Missing phone number',
            target: 'personal',
        });

        const nameLen = p.fullName.length;
        result.push({
            label: 'Name length',
            pass: nameLen > 0 && nameLen <= 50,
            message: nameLen === 0 ? 'Name is empty' : nameLen > 50 ? `Name too long (${nameLen} chars)` : 'Name length OK',
            target: 'personal',
        });

        const summaryLen = cvData.summary.text.trim().length;
        result.push({
            label: 'Summary',
            pass: summaryLen >= 20,
            message: summaryLen === 0 ? 'Missing summary' : summaryLen < 20 ? 'Summary is too short: aim for 2–3 sentences' : 'Summary provided',
            target: 'summary',
        });

        const expBulletIssues: string[] = [];
        cvData.experience.forEach((exp) => {
            const filledBullets = exp.bullets.filter(Boolean).length;
            if (exp.role && filledBullets < 3) {
                expBulletIssues.push(`"${exp.role}" has only ${filledBullets} bullet(s) (min 3)`);
            }
            if (filledBullets > 6) {
                expBulletIssues.push(`"${exp.role}" has ${filledBullets} bullets (max 6)`);
            }
        });
        result.push({
            label: 'Bullet count',
            pass: expBulletIssues.length === 0,
            message: expBulletIssues.length ? expBulletIssues[0] : 'Bullet counts are good (3-6 per role)',
            details: expBulletIssues.slice(1),
            target: 'experience',
        });

        const dateMissing = cvData.experience.filter(
            (exp) => exp.role && (!exp.startDate || (!exp.endDate && !exp.isCurrent))
        );
        result.push({
            label: 'Dates',
            pass: dateMissing.length === 0,
            message: dateMissing.length
                ? `Missing dates: ${dateMissing.map((exp) => `"${exp.role}"`).join(', ')}`
                : 'All experience entries have dates',
            target: 'experience',
        });

        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        const contentSections: [EditorTarget, unknown][] = [
            ['personal', cvData.personal], ['summary', cvData.summary], ['experience', cvData.experience],
            ['education', cvData.education], ['skills', cvData.skillGroups], ['certifications', cvData.certifications],
            ['languages', cvData.languages], ['extracurriculars', cvData.extracurriculars], ['projects', cvData.projects],
        ];
        const emojiSection = contentSections.find(([, value]) => emojiRegex.test(JSON.stringify(value)))?.[0];
        result.push({
            label: 'Special chars',
            pass: !emojiSection,
            message: emojiSection ? 'Emojis or special symbols detected - remove for ATS' : 'No problematic special characters',
            target: emojiSection,
        });

        const hasSkills = cvData.skillGroups.some((g) => g.skills.some(Boolean));
        result.push({
            label: 'Skills',
            pass: hasSkills,
            message: hasSkills ? 'Skills section populated' : 'No skills listed',
            target: 'skills',
        });

        const visibleSections = cvData.sectionSettings.filter((s) => s.visible);
        result.push({
            label: 'Section headings',
            pass: visibleSections.length >= 3,
            message: visibleSections.length >= 3
                ? `${visibleSections.length} standard sections visible`
                : 'Too few sections visible (recommend at least 3)',
        });

        result.push({
            label: 'Location',
            pass: !!p.location,
            message: p.location ? 'Location provided' : 'Consider adding location',
            target: 'personal',
        });

        return result;
    }, [cvData]);

    const passed = checks.filter((c) => c.pass).length;
    const total = checks.length;
    const score = Math.round((passed / total) * 100);
    // Problems first, so the list reads as a to-do list.
    const ordered = [...checks.filter((c) => !c.pass), ...checks.filter((c) => c.pass)];

    const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
    const scoreBg = score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : score >= 60 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30';

    return (
        <div className="space-y-4">
            <div className={`text-center py-4 rounded-xl border ${scoreBg}`}>
                <div className={`text-3xl font-bold ${scoreColor}`}>{score}%</div>
                <div className="text-xs text-zinc-400 mt-1">
                    {passed}/{total} checks passed
                </div>
            </div>

            <ul className="space-y-2">
                {ordered.map((check) => (
                    <li
                        key={check.label}
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${check.pass ? 'bg-emerald-500/5 text-zinc-300' : 'bg-red-500/5 text-zinc-300'}`}
                    >
                        <span className={`mt-0.5 text-xs ${check.pass ? 'text-emerald-400' : 'text-red-400'}`} aria-hidden="true">
                            {check.pass ? '✓' : '✗'}
                        </span>
                        <div className="flex-1 min-w-0">
                            <span className="sr-only">{check.pass ? 'Passed: ' : 'Failed: '}</span>
                            <span className="font-medium">{check.label}:</span>{' '}
                            <span className="text-zinc-400">{check.message}</span>
                            {check.details && check.details.length > 0 && (
                                <ul className="mt-1 space-y-0.5 text-xs text-zinc-400 list-disc pl-4">
                                    {check.details.map((d) => <li key={d}>{d}</li>)}
                                </ul>
                            )}
                            {!check.pass && check.target && (
                                <button onClick={() => onJump(check.target!)} className="block mt-1 text-xs text-blue-400 hover:text-blue-300 transition">
                                    Fix this →
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            <JobMatch />
        </div>
    );
}

/** Compares the CV with a pasted job description, the way keyword-based ATS filters do. */
function JobMatch() {
    const { cvData } = useCV();
    const [jobDescription, setJobDescription] = useState(loadJobDescription);

    const keywords = useMemo(() => extractKeywords(jobDescription), [jobDescription]);
    const words = useMemo(() => cvWords(cvData), [cvData]);
    const found = keywords.filter((k) => hasKeyword(words, k));
    const missing = keywords.filter((k) => !hasKeyword(words, k));

    const update = (value: string) => {
        setJobDescription(value);
        try { localStorage.setItem(JOB_DESCRIPTION_KEY, value); } catch { /* Only a convenience; the match still works. */ }
    };

    return (
        <section className="space-y-2 pt-2 border-t border-zinc-800" aria-labelledby="job-match-title">
            <h3 id="job-match-title" className="text-sm font-semibold text-zinc-200">Job description match</h3>
            <textarea
                value={jobDescription}
                onChange={(e) => update(e.target.value)}
                rows={5}
                aria-label="Job description"
                placeholder="Paste a job description to see which of its keywords your CV covers."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition resize-y"
            />
            {keywords.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-zinc-300">
                        Your CV mentions <span className="font-semibold text-zinc-100">{found.length} of {keywords.length}</span> key terms.
                    </p>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden" aria-hidden="true">
                        <div className="h-full bg-emerald-500" style={{ width: `${(found.length / keywords.length) * 100}%` }} />
                    </div>
                    {missing.length > 0 && (
                        <div>
                            <p className="text-xs text-zinc-400 mb-1">Missing</p>
                            <ul className="flex flex-wrap gap-1">
                                {missing.map((k) => <li key={k} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-200">{k}</li>)}
                            </ul>
                        </div>
                    )}
                    {found.length > 0 && (
                        <div>
                            <p className="text-xs text-zinc-400 mb-1">Found</p>
                            <ul className="flex flex-wrap gap-1">
                                {found.map((k) => <li key={k} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">{k}</li>)}
                            </ul>
                        </div>
                    )}
                    <p className="text-xs text-zinc-500">Add missing terms only where they truly describe your experience.</p>
                </div>
            )}
        </section>
    );
}
