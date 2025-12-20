/**
 * content-pagination.ts
 * 
 * Utility to split HTML content into A4 pages based on available height.
 * This is a "best-effort" split relying on DOM parsing (in-memory or hidden element theoretically).
 * Since we can't easily measure rendered height without rendering, 
 * we will use a heuristic approach or require the component to measure itself.
 * 
 * However, a pure string-processing approach is safer for SSR/hydration stability,
 * even if less precise. 
 * 
 * Better Strategy for React:
 * We will return a component/hook that takes the full HTML and specific page heights,
 * then uses a hidden "measurer" container to calculate break points.
 */

// Approximate height of standard text lines/blocks in pixels (96 DPI)
// A4 Height = 297mm ~= 1122px
// 20mm margin top/bottom = ~75px
// Usable Page 1 Height (minus header 35mm + footer 20mm + margins) ~= 297 - 35 - 20 - 45 = ~197mm ~= 740px
// Usable Page N Height (minus footer 20mm + margins) ~= 297 - 20 - 45 = ~232mm ~= 870px

export const splitContentIntoPages = (htmlContent: string): string[] => {
    if (typeof window === 'undefined') return [htmlContent]; // Server-side fallback

    // Create a hidden container to render and measure content
    const container = document.createElement('div');
    container.style.width = '210mm'; // A4 Width
    container.style.visibility = 'hidden';
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.className = 'prose prose-sm prose-slate max-w-none font-serif'; // Match editor styles
    document.body.appendChild(container);

    container.innerHTML = htmlContent;

    const pages: string[] = [];
    let currentPageContent: Element[] = [];
    let currentHeight = 0;

    // Page 1 has header/metadata so it has less space
    const PAGE_1_MAX_HEIGHT_PX = 740;
    const PAGE_N_MAX_HEIGHT_PX = 950; // Subsequent pages (fuller height)

    // Helper to get accumulated HTML
    const flushPage = () => {
        if (currentPageContent.length > 0) {
            const div = document.createElement('div');
            currentPageContent.forEach(el => div.appendChild(el.cloneNode(true)));
            pages.push(div.innerHTML);
            currentPageContent = [];
            currentHeight = 0;
        }
    };

    const children = Array.from(container.children);

    // Naive Implementation:
    // Iterate top-level blocks. If a block fits, add it. If not, push to next page.
    // DOES NOT SPLIT INSIDE PARAGRAPHS (Text wrapping is handled by browser print, but visual editor pagination is block-based for simplicity)

    children.forEach((child, index) => {
        const childHeight = child.getBoundingClientRect().height;
        const margin = 16; // Approx 1rem margin between blocks
        const totalBlockHeight = childHeight + margin;

        const maxForThisPage = pages.length === 0 ? PAGE_1_MAX_HEIGHT_PX : PAGE_N_MAX_HEIGHT_PX;

        if (currentHeight + totalBlockHeight > maxForThisPage && currentPageContent.length > 0) {
            // Page full, flush it
            flushPage();
        }

        currentPageContent.push(child);
        currentHeight += totalBlockHeight;
    });

    // Flush last page
    flushPage();

    // Cleanup
    document.body.removeChild(container);

    return pages.length > 0 ? pages : [htmlContent];
};
