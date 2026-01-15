import * as cheerio from 'cheerio';

export const sanitizeHtml = (html: string): string => {
    if (!html) return '';

    const $ = cheerio.load(html, { xmlMode: false }); // xmlMode: false allows standard HTML parsing

    // Iterate over all elements
    $('*').each((i, el: any) => {
        const element = $(el);

        // Remove all attributes except href, src, alt, title (allow basic structure)
        // Or simpler: remove specifically the bad ones. 
        // The user's issue is style and data attributes.
        // Let's be aggressive but safe for images/links.

        const attribs = el.attribs;
        if (attribs) {
            Object.keys(attribs).forEach(attr => {
                // Keep specific safe attributes
                if (['src', 'href', 'alt', 'title', 'width', 'height', 'target'].includes(attr)) {
                    return;
                }
                // Remove everything else (style, class, data-*, etc)
                element.removeAttr(attr);
            });
        }
    });

    return $('body').html() || '';
};
