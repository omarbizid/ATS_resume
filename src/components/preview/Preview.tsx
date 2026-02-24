import { useCV } from '../../context/CVContext';
import TemplateRenderer from './TemplateRenderer';

export default function Preview() {
    const { cvData } = useCV();

    return (
        <div className="h-full overflow-y-auto flex justify-center bg-zinc-800/30 p-4 custom-scrollbar">
            <div id="cv-preview" className="cv-page-wrapper shadow-2xl">
                <TemplateRenderer cvData={cvData} templateId={cvData.templateId} />
            </div>
        </div>
    );
}
