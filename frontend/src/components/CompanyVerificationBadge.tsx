import React from "react";
import { BadgeCheck, XCircle } from "lucide-react";
import { CompanyVerificationStatus } from "@/types/company";

interface Props {
    status: CompanyVerificationStatus;
}

const CompanyVerificationBadge: React.FC<Props> = ({ status }) => {
    if (status === CompanyVerificationStatus.REJECTED) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                <XCircle className="h-3.5 w-3.5" />
                Отклонено
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Верифицировано
        </span>
    );
};

export default CompanyVerificationBadge;
