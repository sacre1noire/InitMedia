import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getResumePreview } from "@/services/resumeService";
import { Loader2 } from "lucide-react";

const ResumePreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [html, setHtml] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) {
                setError("Некорректный ID резюме");
                setLoading(false);
                return;
            }
            try {
                const data = await getResumePreview(Number(id));
                setHtml(data.html);
            } catch (e) {
                console.error(e);
                setError("Не удалось загрузить предпросмотр");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Предпросмотр</h1>
                    <Link
                        to="/resumes"
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Назад
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
                        {error}
                    </div>
                ) : (
                    <div
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                )}
            </div>
        </Layout>
    );
};

export default ResumePreviewPage;
