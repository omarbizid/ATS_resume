import { useState, useRef, useEffect } from 'react';
import { useCV } from '../../context/CVContext';
import DesignEditor from './DesignEditor';
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
import { onOpenEditorSection } from './editorNav';
import { CaretDown, DotsSixVertical } from '@phosphor-icons/react';
import type { SectionKey } from '../../types';

const SECTION_EDITORS: Record<SectionKey, { label: string; component: React.FC }> = {
    summary: { label: 'Summary', component: SummaryEditor },
    experience: { label: 'Work experience', component: ExperienceEditor },
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

    // Other panels (e.g. the ATS checker) can ask to open a section and bring it into view.
    useEffect(() => onOpenEditorSection((target) => {
        setOpenSections((prev) => new Set(prev).add(target));
        requestAnimationFrame(() => {
            const el = document.getElementById(`editor-${target}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            el?.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true });
        });
    }), []);

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
                <div id="editor-design" className="scroll-mt-2">
                    <DesignEditor />
                </div>
                {/* Personal Info - always first, not draggable */}
                <div id="editor-personal" className="scroll-mt-2 bg-zinc-900/60 border border-zinc-800/70 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('personal')}
                        aria-expanded={openSections.has('personal')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition"
                    >
                        <span className="text-[15px] font-medium text-zinc-100">Personal information</span>
                        <CaretDown className={`text-zinc-500 transition-transform duration-200 ${openSections.has('personal') ? 'rotate-180' : ''}`} />
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
                            id={`editor-${section.key}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`scroll-mt-2 bg-zinc-900/60 border rounded-xl overflow-hidden transition-all duration-150 ${isDragOver && !isDragging
                                    ? 'border-accent-500 ring-2 ring-accent-500/30'
                                    : 'border-zinc-800/70'
                                } ${isDragging ? 'opacity-40' : ''}`}
                        >
                            <button
                                onClick={() => toggleSection(section.key)}
                                aria-expanded={openSections.has(section.key)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition cursor-grab active:cursor-grabbing"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-600 select-none" title="Drag to reorder"><DotsSixVertical /></span>
                                    <span className="text-[15px] font-medium text-zinc-100">{editor.label}</span>
                                    {!section.visible && (
                                        <span className="text-xs text-zinc-500">Hidden</span>
                                    )}
                                </div>
                                <CaretDown className={`text-zinc-500 transition-transform duration-200 ${openSections.has(section.key) ? 'rotate-180' : ''}`} />
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
                <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowReorder(!showReorder)}
                        aria-expanded={showReorder}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition"
                    >
                        <span className="text-[15px] font-medium text-zinc-100">Section order and visibility</span>
                        <CaretDown className={`text-zinc-500 transition-transform duration-200 ${showReorder ? 'rotate-180' : ''}`} />
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
