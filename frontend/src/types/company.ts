export enum CompanyVerificationStatus {
    PENDING = "pending",
    VERIFIED = "verified",
    REJECTED = "rejected",
}

export enum CompanySizeRange {
    SIZE_1_10 = "1-10",
    SIZE_11_50 = "11-50",
    SIZE_51_200 = "51-200",
    SIZE_201_500 = "201-500",
    SIZE_500_PLUS = "500+",
}

export interface Company {
    id: number;
    owner_id: number;
    name: string;
    slug: string;
    description?: string;
    industry_id?: number;
    website_url?: string;
    logo_url?: string;
    size?: CompanySizeRange;
    is_verified: CompanyVerificationStatus;
    created_at: string;
    updated_at?: string;
}

export interface CompanyCreateRequest {
    name: string;
    description?: string;
    industry_id?: number;
    website_url?: string;
    logo_url?: string;
    size?: CompanySizeRange;
}

export interface CompanyUpdateRequest extends CompanyCreateRequest { }

export interface CompanyListParams {
    industry_id?: number;
    size?: CompanySizeRange;
    limit?: number;
    offset?: number;
}
