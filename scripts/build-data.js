const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const RESUME_PATH = path.join(__dirname, '../resume.tex');
const OUTPUT_PATH = path.join(__dirname, '../public/data.json');

if (!fs.existsSync(path.join(__dirname, '../public'))) {
    fs.mkdirSync(path.join(__dirname, '../public'));
}

async function main() {
    console.log('Reading resume.tex...');
    try {
        const latexContent = fs.readFileSync(RESUME_PATH, 'utf-8');
        const parsedData = parseComplexLatex(latexContent);

        // Enrich publications if possible (search for them?)
        // Since we don't have URLs, we can just pass the parsed data.
        // Or we could try to scrape images based on title search, but that's risky/complex for now.
        // We will stick to accurate parsing.

        console.log('Writing data...');
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(parsedData, null, 2));
        console.log(`Successfully wrote data to ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('Error during build:', error);
    }
}

function parseComplexLatex(content) {
    const lines = content.split('\n');
    const sections = {};
    let currentSection = 'Header'; // Start with header info (Name, etc)
    let buffer = [];

    // Regex helpers
    // Matches \begin{center} \textbf{SECTION NAME} \end{center}
    // We'll iterate lines to find these boundaries.

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith('%') || line.startsWith('\\setlength') || line.startsWith('\\usepackage')) continue;

        // Check for Section Header: center > textbf
        // We look ahead a bit or check if line contains the pattern
        if (line.includes('\\begin{center}') && lines[i + 1] && lines[i + 1].includes('\\textbf{')) {
            // It's likely a section header
            let sectionTitle = lines[i + 1].match(/\\textbf\{(.*?)\}/)[1];

            // Save previous section
            if (currentSection) {
                sections[currentSection] = processSection(currentSection, buffer);
            }

            currentSection = sectionTitle;
            buffer = [];

            // Skip the next few lines related to this header
            // i (begin center) -> i+1 (textbf) -> i+2 (end center)
            if (lines[i + 2] && lines[i + 2].includes('\\end{center}')) {
                i += 2;
            } else {
                // simple skip
                i++;
            }
            continue;
        }

        // Additional check for "Research Publications" which might include "Journal Articles" subheaders
        // But the main parser should catch "Research Publications" as a section.

        buffer.push(line);
    }
    // Flush last
    if (currentSection) {
        sections[currentSection] = processSection(currentSection, buffer);
    }

    return sections;
}

function processSection(sectionName, lines) {
    // Strategy depends on section
    if (sectionName === 'Header') {
        const text = lines.map(cleanLatex).join(' ');
        // Extract Name, Email, LinkedIn
        return { raw: text };
    }

    if (['Education', 'Experience'].includes(sectionName)) {
        return parseExperienceStyle(lines);
    }

    if (sectionName === 'Skills') {
        return parseSkills(lines);
    }

    if (sectionName === 'Certifications') {
        return parseList(lines);
    }

    if (sectionName === 'Research Publications') {
        return parsePublications(lines);
    }

    if (sectionName === 'About Me') {
        // Simple extraction for text and image
        // We look for \includegraphics and text lines
        const data = { description: [], image: null };
        for (let line of lines) {
            line = line.trim();
            if (line.includes('\\includegraphics')) {
                // Try to extract filename if needed, or just set true
                // pattern: \includegraphics[...]{filename}
                const match = line.match(/\\includegraphics\[.*?\]\{(.*?)\}/);
                if (match) data.image = match[1];
            }
            else if (line.length > 0 && !line.startsWith('\\vspace')) {
                data.description.push(cleanLatex(line));
            }
        }
        return data; // Return object, not array
    }

    // Default fallback
    return parseExperienceStyle(lines);
}

function parseExperienceStyle(lines) {
    const items = [];
    let currentItem = {};

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // 1. Check for Institution Header: \textbf{Institution} \hfill Location
        if (line.includes('\\textbf') && line.includes('\\hfill')) {
            // Case A: This looks like a Role/Date line for an EXISTING institution
            // (Heuristic: We have an institution but no position, and this line doesn't look like a new institution block mostly because it follows one?)
            // Actually, in this resume, Institution and Role are clearly distinguished by the fact that Institution lines come first.
            // But we can simply rely on the logic:
            // "If I have an institution, and I don't have a position, DOES THIS LINE look like a position?"
            // Usually, specific keywords might help, but the structure is:
            // Line 1: \textbf{Uni} \hfill Loc
            // Line 2: Ph.D., ... \hfill Date (OR \textbf{Role} \hfill Date)

            // Let's parse the parts first
            const parts = line.split('\\hfill');
            const left = cleanLatex(parts[0]);
            const right = cleanLatex(parts[1] || '');

            if (currentItem.institution && !currentItem.position) {
                // This is likely the Position + Date line for the current item
                currentItem.position = left;
                currentItem.date = right;
            } else {
                // This is a NEW item (either the first one, or previous one is complete)
                if (currentItem.institution) {
                    items.push(currentItem);
                }
                currentItem = {
                    institution: left,
                    location: right,
                    description: []
                };
            }
        }
        // 2. Check for "Orphan" Role lines (e.g. Education Section: "Ph.D., ..." on text line, date on next)
        else if (line.length > 0 && !line.startsWith('\\item') && !line.startsWith('\\begin') && !line.startsWith('\\end') && !line.startsWith('\\vspace')) {
            // If we have an institution but no position yet...
            if (currentItem.institution && !currentItem.position) {
                // Is the NEXT line a date? (\hfillYYYY)
                let nextLine = (lines[i + 1] || '').trim();
                if (nextLine.startsWith('\\hfill')) {
                    currentItem.position = cleanLatex(line);
                    currentItem.date = cleanLatex(nextLine.replace('\\hfill', ''));
                    i++; // Skip next line
                } else {
                    // Just a description line? Or maybe position without date?
                    // In the provided resume, "Ph.D..." is followed by "\hfill 2021..."
                    // So the above check should catch it.
                    // If not caught, treat as description.
                    if (!currentItem.description) currentItem.description = [];
                    currentItem.description.push(cleanLatex(line));
                }
            } else {
                // Normal description line
                if (!currentItem.description) currentItem.description = [];
                currentItem.description.push(cleanLatex(line));
            }
        }
        // 3. Normal Itemized Description
        else if (line.startsWith('\\item')) {
            if (!currentItem.description) currentItem.description = [];
            currentItem.description.push(cleanLatex(line.replace('\\item', '')));
        }
    }

    // Push the last one
    if (currentItem.institution) {
        items.push(currentItem);
    }

    return items;
}

function parseSkills(lines) {
    const categories = [];
    for (let line of lines) {
        line = line.trim();
        if (line.includes('\\textbf')) {
            const match = line.match(/\\textbf\{(.*?)\}(.*)/);
            if (match) {
                categories.push({
                    category: cleanLatex(match[1]).replace(':', ''),
                    values: cleanLatex(match[2]).split(',').map(s => s.trim()).filter(s => s) // Split by comma
                });
            }
        }
    }
    return categories;
}

function parseList(lines) {
    // For Certifications
    const items = [];
    for (let line of lines) {
        if (line.includes('\\item')) {
            items.push(cleanLatex(line.replace('\\item', '')));
        }
    }
    return items;
}

function parsePublications(lines) {
    // Look for \item ... "Title" ...
    // Note: The file has subheaders like \textbf{Journal Articles}. We can treat them as categories or flattening.
    const pubs = [];
    let currentCategory = 'General';

    for (let line of lines) {
        line = line.trim();

        if (line.includes('\\textbf') && !line.includes('\\hfill')) {
            currentCategory = cleanLatex(line);
            continue;
        }

        if (line.includes('\\item')) {
            const text = cleanLatex(line.replace('\\item', ''));
            // Refined Regex to find title in quotes: "Title," or "Title"
            // The resume uses "Title," format often
            const titleMatch = text.match(/"(.*?)"/);

            let title = '';
            let meta = '';

            if (titleMatch) {
                title = titleMatch[1];
                meta = text.replace(`"${title}"`, '').trim();
            } else {
                title = text; // Fallback
            }

            // Create a search URL since we don't have one
            const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;

            pubs.push({
                category: currentCategory,
                title: title,
                metaDescription: meta, // Authors/Journal info usually surrounding the title
                url: searchUrl,
                isSearchLink: true
            });
        }
    }
    return pubs;
}

function cleanLatex(text) {
    if (!text) return '';
    return text
        .replace(/\\textbf\{(.*?)\}/g, '$1')
        .replace(/\\textit\{(.*?)\}/g, '$1')
        .replace(/\\href\{(.*?)\}\{(.*?)\}/g, '$2') // Take label of href
        .replace(/\\url\{(.*?)\}/g, '$1')
        .replace(/\\textbullet/g, '•')
        .replace(/\\%/g, '%')
        .replace(/\\&/g, '&')
        .replace(/\\_/g, '_')
        .replace(/\\[a-zA-Z]+\{.*?\}/g, '') // generic command removal if needed
        .replace(/[{}]/g, '') // Remove remaining braces
        .trim();
}

main();
