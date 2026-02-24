import type { CVData } from '../types';
import { v4 } from './uuid';

export const studentCV: CVData = {
    personal: {
        fullName: 'Sarah Mitchell',
        targetTitle: 'Computer Science Graduate',
        email: 'sarah.mitchell@email.com',
        phone: '+44 7700 900123',
        location: 'London, UK',
        linkedIn: 'linkedin.com/in/sarahmitchell',
        github: 'github.com/sarahmitchell',
        portfolio: '',
    },
    summary: {
        text: 'Final-year Computer Science student at University College London with a strong foundation in software engineering, data structures, and web development. Passionate about building accessible, user-centric applications. Seeking a graduate role in software engineering or product development.',
        highlights: [
            'Dean\'s List 2024 - Top 5% of cohort',
            'Built a full-stack inventory system used by a local charity',
            'Led a team of 4 in a university hackathon, winning Best Technical Implementation',
        ],
    },
    experience: [
        {
            id: v4(),
            role: 'Software Engineering Intern',
            company: 'TechStart Ltd',
            location: 'London, UK',
            startDate: 'Jun 2025',
            endDate: 'Sep 2025',
            isCurrent: false,
            bullets: [
                'Developed RESTful API endpoints using Node.js and Express, handling 10,000+ daily requests',
                'Collaborated with the frontend team to integrate React components with backend services',
                'Wrote unit tests achieving 85% code coverage using Jest and Supertest',
                'Participated in Agile sprints, daily stand-ups, and code review sessions',
            ],
        },
        {
            id: v4(),
            role: 'Teaching Assistant',
            company: 'University College London',
            location: 'London, UK',
            startDate: 'Oct 2024',
            endDate: 'Mar 2025',
            isCurrent: false,
            bullets: [
                'Assisted 120+ first-year students in Introduction to Programming (Python)',
                'Held weekly office hours and graded assignments with detailed feedback',
                'Created supplementary learning materials that improved pass rates by 12%',
            ],
        },
    ],
    education: [
        {
            id: v4(),
            degree: 'BSc Computer Science',
            school: 'University College London',
            location: 'London, UK',
            startDate: 'Sep 2023',
            endDate: 'Jun 2026',
            grade: 'First Class (Predicted)',
            modules: [
                'Data Structures and Algorithms',
                'Software Engineering',
                'Database Systems',
            ],
        },
    ],
    skillGroups: [
        {
            id: v4(),
            category: 'Programming Languages',
            skills: ['Python', 'JavaScript', 'TypeScript', 'Java', 'SQL'],
        },
        {
            id: v4(),
            category: 'Frameworks and Tools',
            skills: ['React', 'Node.js', 'Express', 'Git', 'Docker', 'PostgreSQL'],
        },
        {
            id: v4(),
            category: 'Soft Skills',
            skills: ['Team collaboration', 'Problem solving', 'Technical writing', 'Presentation'],
        },
    ],
    certifications: [
        {
            id: v4(),
            name: 'AWS Cloud Practitioner',
            issuer: 'Amazon Web Services',
            year: '2025',
        },
    ],
    languages: [
        { id: v4(), language: 'English', level: 'Native' },
        { id: v4(), language: 'French', level: 'Intermediate (B1)' },
    ],
    extracurriculars: [
        {
            id: v4(),
            title: 'UCL Computer Science Society - Events Coordinator',
            bullets: [
                'Organized 6 tech talks and 2 hackathons with 200+ attendees',
                'Managed sponsorship relationships with 4 tech companies',
            ],
        },
        {
            id: v4(),
            title: 'Volunteer Web Developer - Shelter UK',
            bullets: [
                'Redesigned the local branch website, increasing online donations by 25%',
            ],
        },
    ],
    sectionSettings: [
        { key: 'summary', label: 'Summary', visible: true, order: 0 },
        { key: 'experience', label: 'Work Experience', visible: true, order: 1 },
        { key: 'education', label: 'Education', visible: true, order: 2 },
        { key: 'skills', label: 'Skills', visible: true, order: 3 },
        { key: 'certifications', label: 'Certifications', visible: true, order: 4 },
        { key: 'languages', label: 'Languages', visible: true, order: 5 },
        { key: 'extracurriculars', label: 'Extracurriculars', visible: true, order: 6 },
    ],
    templateId: 'classic',
    cvLanguage: 'en',
};

export const juniorDevCV: CVData = {
    personal: {
        fullName: 'James Rodriguez',
        targetTitle: 'Junior Full-Stack Developer',
        email: 'james.rodriguez@email.com',
        phone: '+1 555-0147',
        location: 'Austin, TX',
        linkedIn: 'linkedin.com/in/jamesrodriguez',
        github: 'github.com/jroddev',
        portfolio: 'jamesrodriguez.dev',
    },
    summary: {
        text: 'Junior full-stack developer with 1.5 years of professional experience building web applications using React, Node.js, and PostgreSQL. Strong communicator who thrives in collaborative environments. Eager to contribute to impactful products and continue growing as an engineer.',
        highlights: [
            'Shipped 3 production features adopted by 50,000+ users',
            'Reduced API response times by 40% through query optimization',
            'Mentored 2 interns during their onboarding process',
        ],
    },
    experience: [
        {
            id: v4(),
            role: 'Junior Software Developer',
            company: 'DataFlow Inc.',
            location: 'Austin, TX',
            startDate: 'Jul 2024',
            endDate: '',
            isCurrent: true,
            bullets: [
                'Build and maintain React-based dashboard used by 500+ enterprise clients',
                'Develop RESTful APIs using Node.js and Express with PostgreSQL database',
                'Implement automated testing pipelines reducing bug reports by 30%',
                'Collaborate with product and design teams in 2-week Agile sprints',
                'Conduct code reviews and contribute to internal documentation',
            ],
        },
        {
            id: v4(),
            role: 'Frontend Developer Intern',
            company: 'WebCraft Studio',
            location: 'Austin, TX',
            startDate: 'Jan 2024',
            endDate: 'Jun 2024',
            isCurrent: false,
            bullets: [
                'Developed responsive UI components using React and Tailwind CSS',
                'Integrated third-party APIs for payment processing and analytics',
                'Improved Lighthouse performance scores from 65 to 92 across 4 client sites',
            ],
        },
        {
            id: v4(),
            role: 'Freelance Web Developer',
            company: 'Self-Employed',
            location: 'Remote',
            startDate: 'Jun 2023',
            endDate: 'Dec 2023',
            isCurrent: false,
            bullets: [
                'Designed and developed WordPress and custom HTML/CSS websites for 8 small businesses',
                'Managed client relationships, project timelines, and deliverables independently',
                'Achieved 100% client satisfaction rate with repeat business from 5 clients',
            ],
        },
    ],
    education: [
        {
            id: v4(),
            degree: 'BS Computer Science',
            school: 'University of Texas at Austin',
            location: 'Austin, TX',
            startDate: 'Aug 2020',
            endDate: 'May 2024',
            grade: 'GPA: 3.7/4.0',
            modules: [
                'Web Application Development',
                'Operating Systems',
                'Machine Learning',
            ],
        },
    ],
    skillGroups: [
        {
            id: v4(),
            category: 'Frontend',
            skills: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS'],
        },
        {
            id: v4(),
            category: 'Backend',
            skills: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST APIs', 'GraphQL'],
        },
        {
            id: v4(),
            category: 'DevOps and Tools',
            skills: ['Git', 'GitHub Actions', 'Docker', 'AWS (S3, EC2)', 'Vercel', 'Linux'],
        },
    ],
    certifications: [
        {
            id: v4(),
            name: 'Meta Front-End Developer Professional Certificate',
            issuer: 'Coursera / Meta',
            year: '2023',
        },
        {
            id: v4(),
            name: 'AWS Solutions Architect Associate',
            issuer: 'Amazon Web Services',
            year: '2024',
        },
    ],
    languages: [
        { id: v4(), language: 'English', level: 'Native' },
        { id: v4(), language: 'Spanish', level: 'Conversational (B2)' },
    ],
    extracurriculars: [
        {
            id: v4(),
            title: 'Open Source Contributor - React Component Library',
            bullets: [
                'Contributed 12 pull requests to a popular open-source UI library (2,000+ stars)',
                'Fixed accessibility issues improving WCAG 2.1 compliance',
            ],
        },
        {
            id: v4(),
            title: 'Austin Code Meetup - Co-Organizer',
            bullets: [
                'Co-organized monthly meetups with 50-80 attendees',
                'Delivered 3 lightning talks on React performance optimization',
            ],
        },
    ],
    sectionSettings: [
        { key: 'summary', label: 'Summary', visible: true, order: 0 },
        { key: 'experience', label: 'Work Experience', visible: true, order: 1 },
        { key: 'education', label: 'Education', visible: true, order: 2 },
        { key: 'skills', label: 'Skills', visible: true, order: 3 },
        { key: 'certifications', label: 'Certifications', visible: true, order: 4 },
        { key: 'languages', label: 'Languages', visible: true, order: 5 },
        { key: 'extracurriculars', label: 'Extracurriculars', visible: true, order: 6 },
    ],
    templateId: 'classic',
    cvLanguage: 'en',
};
