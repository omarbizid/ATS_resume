import type { CVData, TemplateId } from '../../types';
import ClassicTemplate from './templates/ClassicTemplate';
import DesignedTemplate from './templates/DesignedTemplate';
import MinimalTemplate from './templates/MinimalTemplate';

interface Props {
    cvData: CVData;
    templateId: TemplateId;
}

export default function TemplateRenderer({ cvData, templateId }: Props) {
    switch (templateId) {
        case 'designed':
            return <DesignedTemplate cvData={cvData} />;
        case 'minimal':
            return <MinimalTemplate cvData={cvData} />;
        case 'classic':
        default:
            return <ClassicTemplate cvData={cvData} />;
    }
}
