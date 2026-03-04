import { useState, useRef } from 'react';
import { useCV } from '../../context/CVContext';
import PersonalInfoEditor from './PersonalInfoEditor';
import SummaryEditor from './SummaryEditor';
import ExperienceEditor from './ExperienceEditor';
import EducationEditor from './EducationEditor';
import SkillsEditor from './SkillsEditor';
import CertificationsEditor from './CertificationsEditor';
import LanguagesEditor from './LanguagesEditor';
import ExtracurricularsEditor from './ExtracurricularsEditor';
import ProjectsEditor from './ProjectsEditor';
import SectionReorder from './SectionReorder';
import type { SectionKey } from '../../types';

const SECTION_EDITORS: Record<SectionKey, { label: string; component: React.FC }> = {
    summary: { label: 'Summary', component: SummaryEditor },
    experience: { label: 'Work Experience', component: ExperienceEditor },
    education: { label: 'Education', component: EducationEditor },
    skills: { label: 'Skills', component: SkillsEditor },
    certifications: { label: 'Certifications', component: CertificationsEditor },
    languages: { label: 'Languages', component: LanguagesEditor },
    extracurriculars: { label: 'Extracurriculars', component: ExtracurricularsEditor },
    projects: { label: 'Projects', component: ProjectsEditor },
};

export default function Editor() {
    const { cvData, dispatch } = useCV();
    const [openSections, setOpenSections] = useState<Set<string>>(
        new Set(['personal', 'summary', 'experience'])
    );
    const [showReorder, setShowReorder] = useState(false);

    // Drag state
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragNodeRef = useRef<HTMLDivElement | null>(null);

    const toggleSection = (key: string) => {
        setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const sorted = [...cvData.sectionSettings].sort((a, b) => a.order - b.order);

    // --- Drag handlers ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index);
        dragNodeRef.current = e.currentTarget as HTMLDivElement;
        e.dataTransfer.effectAllowed = 'move';
        // Make the ghost semi-transparent
        setTimeout(() => {
            if (dragNodeRef.current) {
                dragNodeRef.current.style.opacity = '0.4';
            }
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragIndex === null || dragIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== toIndex) {
            dispatch({ type: 'MOVE_SECTION', payload: { fromIndex: dragIndex, toIndex } });
        }
        resetDrag();
    };

    const handleDragEnd = () => {
        resetDrag();
    };

    const resetDrag = () => {
        if (dragNodeRef.current) {
            dragNodeRef.current.style.opacity = '1';
        }
        setDragIndex(null);
        setDragOverIndex(null);
        dragNodeRef.current = null;
    };

    return (
        <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
            <div className="space-y-3 pb-8">
                {/* Personal Info - always first, not draggable */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('personal')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition"
                    >
                        <span className="text-sm font-semibold text-zinc-200">Personal Information</span>
                        <span className="text-zinc-500 text-xs">{openSections.has('personal') ? '−' : '+'}</span>
                    </button>
                    {openSections.has('personal') && (
                        <div className="px-4 pb-4">
                            <PersonalInfoEditor />
                        </div>
                    )}
                </div>

                {/* Dynamic sections - draggable */}
                {sorted.map((section, index) => {
                    const editor = SECTION_EDITORS[section.key];
                    if (!editor) return null;
                    const Component = editor.component;
                    const isDragging = dragIndex === index;
                    const isDragOver = dragOverIndex === index;

                    return (
                        <div
                            key={section.key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`bg-zinc-900/80 border rounded-xl overflow-hidden transition-all duration-150 ${isDragOver && !isDragging
                                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                                    : 'border-zinc-800'
                                } ${isDragging ? 'opacity-40' : ''}`}
                        >
                            <button
                                onClick={() => toggleSection(section.key)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition cursor-grab active:cursor-grabbing"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-600 text-xs select-none" title="Drag to reorder">⠿</span>
                                    <span className="text-sm font-semibold text-zinc-200">{editor.label}</span>
                                    {!section.visible && (
                                        <span className="text-[10px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">Hidden</span>
                                    )}
                                </div>
                                <span className="text-zinc-500 text-xs">{openSections.has(section.key) ? '−' : '+'}</span>
                            </button>
                            {openSections.has(section.key) && (
                                <div className="px-4 pb-4">
                                    <Component />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Section Reorder */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowReorder(!showReorder)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition"
                    >
                        <span className="text-sm font-semibold text-zinc-200">Section Order & Visibility</span>
                        <span className="text-zinc-500 text-xs">{showReorder ? '−' : '+'}</span>
                    </button>
                    {showReorder && (
                        <div className="px-4 pb-4">
                            <SectionReorder />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
