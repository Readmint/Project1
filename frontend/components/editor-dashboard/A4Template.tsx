import React, { forwardRef, useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { splitContentIntoPages } from '@/utils/content-pagination';

interface A4TemplateProps {
    content: string; // HTML content from rich text editor
    metadata: {
        issn?: string;
        volume?: string;
        issue?: string;
        editorName?: string;
        authorName?: string;
        title?: string;
        logo?: string; // URL
        publicationTitle?: string;
        footerText?: string;
        themeColor?: string;
        heroImage?: string;
        tableOfContent?: string;
        email?: string;
        publicationDate?: string;
    };
    className?: string;
}

const A4Template = forwardRef<HTMLDivElement, A4TemplateProps>(({ content, metadata, className }, ref) => {
    const {
        issn, volume, issue, editorName, authorName, title, logo,
        publicationTitle = "THE MAGAZINE",
        footerText = "MindRadix Platform",
        themeColor = "#166534", // Default Green
        heroImage,
        tableOfContent,
        email
    } = metadata;

    const [pages, setPages] = useState<string[]>([]);

    useEffect(() => {
        // Construct the Header HTML to be part of the flow
        // We use inline styles here to match the previous JSX styling because this will be rendered via dangerouslySetInnerHTML

        let headerHtml = "";

        // 1. Article Title & Metadata
        headerHtml += `
            <div class="mb-8">
                <div style="display:inline-block; padding: 4px 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: white; margin-bottom: 1rem; background-color: ${themeColor}">
                    Article
                </div>
                <h2 style="font-family: serif; font-size: 2.25rem; font-weight: 900; margin-bottom: 1rem; line-height: 1.1; color: #0f172a;">
                    ${title || 'Untitled Article'}
                </h2>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6b7280; border-bottom: 2px solid #f3f4f6; padding-bottom: 1.5rem;">
                    <span style="text-transform: uppercase; letter-spacing: 0.025em;">By</span>
                    <span style="font-weight: 700; color: black; font-size: 1rem;">${authorName || 'Unknown Author'}</span>
                    <span style="margin: 0 0.5rem;">•</span>
                    <span>Edited by ${editorName || 'Editor'}</span>
                    ${issn ? `<span style="margin-left: auto; font-family: monospace; font-size: 0.75rem;">ISSN: ${issn}</span>` : ''}
                </div>
            </div>
        `;

        // 2. Hero Image
        if (heroImage) {
            headerHtml += `
                <div style="margin-bottom: 2rem; width: 100%; height: 50mm; overflow: hidden; border-radius: 0.125rem; background-color: #f3f4f6;">
                    <img src="${heroImage}" alt="Hero" style="width: 100%; height: 100%; object-fit: cover; margin: 0;" />
                </div>
            `;
        }

        // 3. Table of Contents
        if (tableOfContent) {
            headerHtml += `
                <div style="margin-bottom: 2rem; padding: 1.5rem; background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 0.25rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; border-bottom: 1px solid ${themeColor}; padding-bottom: 0.5rem; color: ${themeColor};">
                        In This Issue
                    </h3>
                    <div class="toc-content">
                        ${tableOfContent}
                    </div>
                </div>
            `;
        }

        const fullHtml = headerHtml + content;

        // Debounce pagination
        const timer = setTimeout(() => {
            const splitPages = splitContentIntoPages(fullHtml);
            setPages(splitPages);
        }, 500);
        return () => clearTimeout(timer);
    }, [content, title, authorName, editorName, issn, heroImage, tableOfContent, themeColor]);

    // Common Page Layout Wrapper
    const A4PageFrame = ({ children, pageNumber, isFirstPage }: { children: React.ReactNode, pageNumber: number, isFirstPage: boolean }) => (
        <div
            className={cn(
                "bg-white text-black shadow-2xl mx-auto overflow-hidden relative flex flex-col mb-8", // added mb-8 for spacing between pages in preview
                className
            )}
            style={{
                width: '210mm',
                height: '297mm', // Fixed A4 Height
                padding: '0',
                boxSizing: 'border-box',
                transformOrigin: 'top center',
            }}
        >
            {/* Colored Header Strip */}
            <header
                className="w-full h-[35mm] px-[20mm] flex justify-between items-center text-white relative z-10"
                style={{ backgroundColor: themeColor }}
            >
                {/* Logo Area (Only on Page 1) */}
                <div className="flex items-center gap-4 h-full py-4">
                    {isFirstPage && logo ? (
                        <div className="bg-white p-2 rounded h-20 w-20 flex items-center justify-center shadow-lg transform translate-y-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                    ) : isFirstPage ? (
                        <div className="bg-white p-2 rounded h-20 w-20 flex items-center justify-center shadow-lg transform translate-y-4 text-xs text-gray-400 font-bold">
                            LOGO
                        </div>
                    ) : (
                        // Placeholder for alignment on other pages or smaller logo
                        <div className="h-20 w-20 opacity-0" />
                    )}

                    <div className="ml-4">
                        <h1 className="text-2xl font-bold uppercase tracking-[0.2em] font-sans header-html" dangerouslySetInnerHTML={{ __html: publicationTitle }} />
                    </div>
                </div>

                {/* Meta Info */}
                <div className="text-right font-serif text-sm opacity-90 leading-tight">
                    <p>Vol. {volume || '1'} | Issue {issue || '1'}</p>
                    <p className="text-xs uppercase mt-1 opacity-75">
                        {metadata.publicationDate
                            ? new Date(metadata.publicationDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="px-[20mm] pt-[10mm] pb-[10mm] flex-1 relative overflow-hidden">
                <style jsx global>{`
                    .article-content img {
                        max-width: 100%;
                        height: auto;
                        margin: 1rem 0;
                    }
                    .article-content .ql-align-center { text-align: center; }
                    .article-content .ql-align-right { text-align: right; }
                    .article-content .ql-align-justify { text-align: justify; }
                    .article-content img[style*="float: left"] { margin-right: 1rem; }
                    .article-content img[style*="float: right"] { margin-left: 1rem; }
                    .header-html p, .footer-html p { margin: 0; display: inline; }
                `}</style>
                {/* We render the paginated HTML chunk here */}
                <div
                    className="prose prose-sm prose-slate max-w-none text-justify font-serif leading-relaxed article-content"
                    style={{
                        columnCount: 2,
                        columnGap: '10mm',
                        height: '100%', // Fill available space
                    }}
                    dangerouslySetInnerHTML={{ __html: children as string }}
                />
            </div>

            {/* Colored Footer Strip */}
            <footer
                className="w-full h-[20mm] px-[20mm] flex flex-col justify-center text-white text-[10px] uppercase tracking-widest mt-auto shrink-0 relative z-20"
                style={{ backgroundColor: themeColor }}
            >
                <div className="flex justify-between items-center w-full border-b border-white/20 pb-1 mb-1">
                    <span dangerouslySetInnerHTML={{ __html: footerText }} className="footer-html font-bold" />
                    <span className="opacity-90">Vol. {volume || '1'} | Issue {issue || '1'}</span>
                </div>
                <div className="flex justify-between items-center w-full opacity-80 text-[9px]">
                    <span>{metadata.email || "www.justagriculture.in"}</span>
                    <span>Page {pageNumber}</span>
                </div>
            </footer>
        </div>
    );

    // If waiting for hydration or split, might show loading or unsplit.
    // We wrap everything in a ref div so the parent can capture it for PDF (though PDF capture of multiple pages needs traversing children)
    return (
        <div ref={ref} className="flex flex-col gap-8 bg-gray-100 p-8 items-center">
            {pages.map((pageHtml, index) => (
                <A4PageFrame key={index} pageNumber={index + 1} isFirstPage={index === 0}>
                    {pageHtml}
                </A4PageFrame>
            ))}
        </div>
    );
});

A4Template.displayName = "A4Template";

export default A4Template;
