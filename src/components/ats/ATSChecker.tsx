import { useMemo } from 'react';
import { useCV } from '../../context/CVContext';

interface Check {
    label: string;
    pass: boolean;
    message: string;
}

export default function ATSChecker() {
    const { cvData } = useCV();

    const checks = useMemo<Check[]>(() => {
        const result: Check[] = [];
        const p = cvData.personal;

        // 1. Email present
        result.push({
            label: 'Email',
            pass: !!p.email && p.email.includes('@'),
            message: p.email ? 'Email provided' : 'Missing email address',
        });

        // 2. Phone present
        result.push({
            label: 'Phone',
            pass: !!p.phone,
            message: p.phone ? 'Phone provided' : 'Missing phone number',
        });

        // 3. Name length
        const nameLen = p.fullName.length;
        result.push({
            label: 'Name length',
            pass: nameLen > 0 && nameLen <= 50,
            message: nameLen === 0 ? 'Name is empty' : nameLen > 50 ? `Name too long (${nameLen} chars)` : 'Name length OK',
        });

        // 4. Summary present
        result.push({
            label: 'Summary',
            pass: !!cvData.summary.text && cvData.summary.text.length >= 20,
            message: cvData.summary.text ? 'Summary provided' : 'Missing or too short summary',
        });

        // 5. Experience bullets check
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
        });

        // 6. Dates present on experience
        const dateMissing = cvData.experience.filter(
            (exp) => exp.role && (!exp.startDate || (!exp.endDate && !exp.isCurrent))
        );
        result.push({
            label: 'Dates',
            pass: dateMissing.length === 0,
            message: dateMissing.length
                ? `${dateMissing.length} experience(s) missing dates`
                : 'All experience entries have dates',
        });

        // 7. Special characters / emojis
        const allText = JSON.stringify(cvData);
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const hasEmoji = emojiRegex.test(allText);
        result.push({
            label: 'Special chars',
            pass: !hasEmoji,
            message: hasEmoji ? 'Emojis or special symbols detected - remove for ATS' : 'No problematic special characters',
        });

        // 8. Skills present
        const hasSkills = cvData.skillGroups.some((g) => g.skills.some(Boolean));
        result.push({
            label: 'Skills',
            pass: hasSkills,
            message: hasSkills ? 'Skills section populated' : 'No skills listed',
        });

        // 9. Section headings standard
        const visibleSections = cvData.sectionSettings.filter((s) => s.visible);
        result.push({
            label: 'Section headings',
            pass: visibleSections.length >= 3,
            message: visibleSections.length >= 3
                ? `${visibleSections.length} standard sections visible`
                : 'Too few sections visible (recommend at least 3)',
        });

        // 10. Location present
        result.push({
            label: 'Location',
            pass: !!p.location,
            message: p.location ? 'Location provided' : 'Consider adding location',
        });

        return result;
    }, [cvData]);

    const passed = checks.filter((c) => c.pass).length;
    const total = checks.length;
    const score = Math.round((passed / total) * 100);

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

            <div className="space-y-2">
                {checks.map((check, i) => (
                    <div
                        key={i}
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${check.pass ? 'bg-emerald-500/5 text-zinc-300' : 'bg-red-500/5 text-zinc-300'
                            }`}
                    >
                        <span className={`mt-0.5 text-xs ${check.pass ? 'text-emerald-400' : 'text-red-400'}`}>
                            {check.pass ? '✓' : '✗'}
                        </span>
                        <div>
                            <span className="font-medium">{check.label}:</span>{' '}
                            <span className="text-zinc-400">{check.message}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
