import { Suspense } from 'react';
import VerifyCertificateContent from '@/app/verify-certificate/VerifyCertificateContent';
import Footer from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';

export default function VerifyCertificatePage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center">
                <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                    <VerifyCertificateContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
