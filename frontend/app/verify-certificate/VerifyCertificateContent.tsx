'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function VerifyCertificateContent() {
    const searchParams = useSearchParams();
    const [certId, setCertId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl) {
            setCertId(idFromUrl);
            handleVerify(idFromUrl);
        }
    }, [searchParams]);

    const handleVerify = async (id: string) => {
        if (!id.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/certificates/${id}/verify`);
            const data = await res.json();

            if (data.status === 'success') {
                setResult(data.data);
                toast.success('Certificate verified successfully');
            } else {
                setError(data.message || 'Invalid Certificate ID');
                toast.error(data.message || 'Verification failed');
            }
        } catch (err) {
            setError('Failed to connect to verification service');
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleVerify(certId);
    };

    return (
        <>
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
                    Certificate Verification
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Verify the authenticity of any MindRadiX publication certificate by entering its unique ID or scanning the QR code.
                </p>
            </div>

            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Verify Certificate</CardTitle>
                    <CardDescription className="text-center">Enter the Certificate ID found on the document.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="flex space-x-2">
                            <Input
                                placeholder="e.g. MRX-AUTH-1234"
                                value={certId}
                                onChange={(e) => setCertId(e.target.value)}
                                className="text-center font-mono uppercase"
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-6 flex flex-col items-center text-red-600 animate-in fade-in slide-in-from-top-2">
                            <XCircle className="h-12 w-12 mb-2" />
                            <p className="font-semibold">Invalid Certificate</p>
                            <p className="text-sm text-center">{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex flex-col items-center text-green-600 mb-4">
                                <CheckCircle className="h-12 w-12 mb-2" />
                                <p className="font-semibold text-lg">Certificate Valid</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Author:</span>
                                    <span className="font-medium text-gray-900">{result.author_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Type:</span>
                                    <span className="font-medium text-gray-900">{result.publication_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Published:</span>
                                    <span className="font-medium text-gray-900">{new Date(result.issued_at.seconds * 1000).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-xs text-center text-gray-500 mb-2">"{result.title}"</p>
                                <Button className="w-full" variant="outline" onClick={() => window.open(result.public_url, '_blank')}>
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-center border-t py-4 bg-gray-50/50">
                    <p className="text-xs text-gray-400 text-center">
                        Secured by MindRadiX Verification System
                    </p>
                </CardFooter>
            </Card>
        </>
    );
}
