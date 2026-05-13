export interface ResumeContacts {
    email?: string;
    phone?: string;
    telegram?: string;
    portfolio_url?: string;
}

export interface ResumeExperience {
    company: string;
    role: string;
    start_date?: string;
    end_date?: string;
    description?: string;
}

export interface ResumeEducation {
    institution: string;
    degree: string;
    start_year?: number;
    end_year?: number;
    description?: string;
}

export interface ResumeRecommendation {
    name: string;
    position?: string;
    contact?: string;
    text?: string;
}

export interface ResumeContent {
    full_name: string;
    qualification: string;
    goals?: string;
    contacts: ResumeContacts;
    experience: ResumeExperience[];
    education: ResumeEducation[];
    recommendations: ResumeRecommendation[];
    skills: string[];
}

export interface Resume {
    id: number;
    applicant_id: number;
    template_id?: number;
    title: string;
    content?: ResumeContent;
    is_primary: boolean;
    created_at: string;
    updated_at?: string;
}

export interface ResumeTemplate {
    id: number;
    name: string;
    preview_url?: string;
    structure: { slug?: string; description?: string };
    specializations: string[];
    created_at: string;
}

export interface ResumePreviewResponse {
    html: string;
}

export interface ResumeHelperResponse {
    missing_sections: string[];
    recommendations: string[];
}
