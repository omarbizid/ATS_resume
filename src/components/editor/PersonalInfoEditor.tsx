import { useCV } from '../../context/CVContext';

export default function PersonalInfoEditor() {
    const { cvData, updateField } = useCV();
    const p = cvData.personal;

    const fields: { label: string; key: keyof typeof p; type?: string; placeholder: string }[] = [
        { label: 'Full name', key: 'fullName', placeholder: 'Amira Haddad' },
        { label: 'Target title', key: 'targetTitle', placeholder: 'Software Engineer' },
        { label: 'Email', key: 'email', type: 'email', placeholder: 'amira.haddad@email.com' },
        { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+33 6 48 21 90 37' },
        { label: 'Location', key: 'location', placeholder: 'New York, NY' },
        { label: 'LinkedIn', key: 'linkedIn', placeholder: 'linkedin.com/in/amirahaddad' },
        { label: 'GitHub', key: 'github', placeholder: 'github.com/amirahaddad' },
        { label: 'Portfolio', key: 'portfolio', placeholder: 'amirahaddad.dev' },
    ];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((f) => (
                    <div key={f.key} className={f.key === 'fullName' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">{f.label}</label>
                        <input
                            type={f.type || 'text'}
                            value={p[f.key]}
                            onChange={(e) => updateField(`personal.${f.key}`, e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
