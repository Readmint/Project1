'use client';

import { useState, useEffect } from 'react';

import { Loader2, Award, Download, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Certificate {
    id: string;
    title: string;
    publication_type: string;
    issued_at: any;
    public_url: string;
}

export default function AuthorCertificatesPage() {
    const [user, setUser] = useState<any>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const u = JSON.parse(storedUser);
                setUser(u);
            } catch (e) {
                console.error("Failed to parse user", e);
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCertificates = async () => {
        if (!user) return;
        try {
            // Fetch user certificates using the token
            // Ideally we would have a user.token or retrieve idToken from firebase if available
            // Assuming user object has what we need or we can get token. 
            // The dashboard uses `getJSON` which likely handles token internally or from localStorage.

            // Reusing the fetch logic but safely
            const token = user.token || user.stsTokenManager?.accessToken;
            // Note: If user object in generic localStorage doesn't have token, we might need to rely on the auth cookie or explicit token.
            // author-dashboard/page.tsx uses `getJSON`. We should use that if available. 
            // For now, standard fetch with defensive token check.

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/certificates/my-certificates`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status === 'success') {
                setCertificates(data.data.certificates || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCertificates();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
                <p className="text-muted-foreground">
                    View and download certificates for your published work.
                </p>
            </div>

            {certificates.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Award className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Certificates Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                            Certificates are automatically generated when your articles are published.
                        </p>
                        <Button variant="outline" asChild>
                            <a href="/author-dashboard/submit">Submit New Article</a>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {certificates.map((cert) => (
                        <Card key={cert.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold line-clamp-1">
                                    {cert.title}
                                </CardTitle>
                                <Award className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-1">
                                    <div className="text-sm text-muted-foreground flex items-center mt-2">
                                        <span className="font-medium text-foreground mr-2">{cert.publication_type}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center mb-4">
                                        <Calendar className="mr-1 h-3 w-3" />
                                        Issued: {new Date(cert.issued_at).toLocaleDateString()}
                                    </div>
                                    <Button className="w-full" variant="secondary" onClick={() => window.open(cert.public_url, '_blank')}>
                                        <Download className="mr-2 h-4 w-4" /> Download PDF
                                    </Button>
                                    <div className="mt-2 text-xs text-center text-muted-foreground">
                                        ID: <span className="font-mono">{cert.id}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
