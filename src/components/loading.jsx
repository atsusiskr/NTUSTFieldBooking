import { useTranslation } from "../locale/i18n";

export default function Loading({ isLoading = false, text }) {
    const t = useTranslation();
    if (!isLoading) return null;

    return (
        <div className='fixed inset-0 z-99 flex items-center justify-center'
        role = "dialog"
        >
            <div className="absolute inset-0 bg-black/30"/>
            <div className="relative md:w-96 w-[80%]  z-99  aspect-6/4 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full" />
                    <span className="loading-text">{text ?? t("common.loading")}</span>
                </div>
            </div>
            
        </div>
    );
}
