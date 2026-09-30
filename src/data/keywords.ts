import type { CVData } from '../types';

// Common English and French words, plus job-ad filler that says nothing about skills.
const STOPWORDS = new Set(`
a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each etc few for from further had has have having he her here hers him his how i if in into is it its itself just like may me might more most must my no nor not now of off on once only or other our ours out over own per same she should so some such than that the their them then there these they this those through to too under until up upon very via was we were what when where which while who whom why will with within without would you your yours
able ability across additional app apps apply based build building create creating deliver develop developing ensure benefits best candidate candidates company culture day days degree environment excellent experience experienced familiar focus good great help high highly hire hiring ideal including job join key knowledge least level looking make new offer opportunity plus position preferred required requirements responsibilities role salary seeking skills strong team teams understanding using well work working write writing year years
au aux avec ce ces cette dans de des du elle en et être il ils je la le les leur leurs lui ma mais me même mes moi mon ne nos notre nous ou où par pas pour qu que qui sa se ses son sont sur ta te tes toi ton tu un une vos votre vous
afin ainsi avoir bonne bonnes capacité connaissance connaissances entreprise équipe expérience fait mission missions nouveau nouvelle poste profil recherche rejoindre sein serez souhaité tout toute travail très
`.trim().split(/\s+/));

const TOKEN = /[\p{L}\p{N}][\p{L}\p{N}+#./-]*/gu;

/** Lower-cased words, keeping tech spellings such as c++, c#, node.js and ci/cd. */
function tokenize(text: string): string[] {
    return (text.toLowerCase().match(TOKEN) ?? []).map((t) => t.replace(/[./-]+$/, '')).filter(Boolean);
}

/** The most frequent meaningful terms of a job description, most important first. */
export function extractKeywords(jobDescription: string, limit = 25): string[] {
    const counts = new Map<string, number>();
    for (const token of tokenize(jobDescription)) {
        if (token.length < 2 || STOPWORDS.has(token) || !/\p{L}/u.test(token)) continue;
        counts.set(token, (counts.get(token) ?? 0) + 1);
    }
    // Map keeps first-seen order, so ties favour terms that appear earlier in the ad.
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([term]) => term);
}

/** Every word of the CV's content (not its layout settings or photo). */
export function cvWords(cv: CVData): Set<string> {
    const strings: string[] = [];
    const collect = (value: unknown, key = '') => {
        if (key === 'id') return;
        if (typeof value === 'string') strings.push(value);
        else if (Array.isArray(value)) value.forEach((v) => collect(v));
        else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => collect(v, k));
    };
    const { personal, summary, experience, education, skillGroups, certifications, languages, extracurriculars, projects } = cv;
    collect({ personal, summary, experience, education, skillGroups, certifications, languages, extracurriculars, projects });
    return new Set(tokenize(strings.join(' ')));
}

export function hasKeyword(words: Set<string>, keyword: string): boolean {
    // Accept a simple plural either way ("api" / "apis").
    return words.has(keyword) || words.has(`${keyword}s`) || (keyword.endsWith('s') && words.has(keyword.slice(0, -1)));
}
