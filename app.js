document.addEventListener('DOMContentLoaded', () => {
    fetch('public/data.json')
        .then(response => response.json())
        .then(data => renderPortfolio(data))
        .catch(err => console.error('Error loading data:', err));

    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        });
    }
});

function renderPortfolio(data) {
    const container = document.getElementById('dynamic-content');

    const sectionOrder = ['About Me', 'Research Publications', 'Experience', 'Education', 'Certifications'];

    sectionOrder.forEach(sectionName => {
        if (data[sectionName]) {
            let sectionHTML;
            if (sectionName === 'Research Publications') {
                sectionHTML = createPublicationGrid(sectionName, data[sectionName]);
            } else if (sectionName === 'About Me') {
                sectionHTML = createAboutSection(sectionName, data[sectionName], data['Skills']);
            } else {
                sectionHTML = createSection(sectionName, data[sectionName]);
            }
            container.appendChild(sectionHTML);
        }
    });
}

function createAboutSection(title, data, skillsData) {
    const section = document.createElement('section');
    section.id = title.replace(/\s+/g, '');
    section.className = 'content-section about-section';

    const h2 = document.createElement('h2');
    h2.className = 'section-header';
    h2.textContent = title;
    section.appendChild(h2);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'about-content';

    // Image
    const img = document.createElement('img');
    img.src = './public/profile_pic.jpeg'; // Professional generic profile
    img.className = 'about-image';
    contentDiv.appendChild(img);

    // Text
    const textDiv = document.createElement('div');
    textDiv.className = 'about-text';
    if (data.description && Array.isArray(data.description)) {
        data.description.forEach(line => {
            const p = document.createElement('p');
            p.textContent = line;
            textDiv.appendChild(p);
        });
    }
    contentDiv.appendChild(textDiv);

    section.appendChild(contentDiv);

    // Skills Injection
    // Skills Injection
    if (skillsData) {
        const skillContainer = document.createElement('div');
        skillContainer.className = 'skills-container';
        // Add some margin top to separate from About text
        skillContainer.style.marginTop = '3rem';

        // Filter data
        const languageData = skillsData.filter(cat => cat.category === 'Languages');
        const otherSkillsData = skillsData.filter(cat => cat.category !== 'Languages');

        // Function to create a skill card
        const createSkillCard = (title, items) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'skill-category';
            catDiv.innerHTML = `<h3 class="skill-cat-title">${title}</h3>`;

            // If it's the general 'Skills' card, we want to group by sub-categories
            if (title === 'Skills') {
                const groupsContainer = document.createElement('div');
                groupsContainer.style.display = 'flex';
                groupsContainer.style.flexDirection = 'column';
                groupsContainer.style.gap = '1.5rem';

                items.forEach(category => {
                    const subGroup = document.createElement('div');

                    const subTitle = document.createElement('h4');
                    subTitle.textContent = category.category;
                    subTitle.style.color = 'var(--text-secondary)';
                    subTitle.style.marginBottom = '0.5rem';
                    subTitle.style.fontSize = '1.1rem'; // Slightly smaller than card title
                    subGroup.appendChild(subTitle);

                    const tags = document.createElement('div');
                    tags.className = 'skill-tags';

                    category.values.forEach(val => {
                        const span = document.createElement('span');
                        span.className = 'skill-tag';
                        span.textContent = val;
                        tags.appendChild(span);
                    });

                    subGroup.appendChild(tags);
                    groupsContainer.appendChild(subGroup);
                });
                catDiv.appendChild(groupsContainer);
            }
            else {
                // Formatting for simple lists like Languages (no subheaders needed if we don't want them, but consistent is better - let's keep it simple for now as it worked for languages)
                // Actually languages is just one category usually.
                const tags = document.createElement('div');
                tags.className = 'skill-tags';

                items.forEach(category => {
                    category.values.forEach(val => {
                        const span = document.createElement('span');
                        span.className = 'skill-tag';
                        span.textContent = val;
                        tags.appendChild(span);
                    });
                });
                catDiv.appendChild(tags);
            }
            return catDiv;
        };

        // 1. General Skills Card
        if (otherSkillsData.length > 0) {
            skillContainer.appendChild(createSkillCard('Skills', otherSkillsData));
        }

        // 2. Languages Card
        if (languageData.length > 0) {
            skillContainer.appendChild(createSkillCard('Languages', languageData));
        }

        section.appendChild(skillContainer);
    }

    return section;
}



function createPublicationGrid(title, items) {
    const section = document.createElement('section');
    section.id = title.replace(/\s+/g, '');
    section.className = 'content-section';

    const h2 = document.createElement('h2');
    h2.className = 'section-header';
    h2.textContent = title;
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'cards-grid pub-grid'; // Use pub-grid for 2-column layout

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card pub-card';

        // Make entire card clickable if URL exists
        const displayUrl = item.url;
        if (displayUrl) {
            card.onclick = () => window.open(displayUrl, '_blank');
            card.style.cursor = 'pointer';
        }

        let cardContent = '';
        const fallbackImage = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=60';
        const imageSrc = item.image || item.metaImage || fallbackImage;

        cardContent += `<img src="${imageSrc}" class="card-image" alt="Publication Image">`;
        cardContent += `<div class="card-content-wrapper">`;

        // Title
        cardContent += `<h3 class="card-title">${item.title}</h3>`;

        // Category
        if (item.category) cardContent += `<div class="card-subtitle">${item.category}</div>`;

        // Main Description (Abstract)
        if (item.description) {
            cardContent += `<div class="card-desc">`;
            if (Array.isArray(item.description)) {
                if (item.description.length > 0) {
                    // For publications, usually just paragraphs, but if list...
                    cardContent += `<ul>${item.description.map(line => `<li>${line}</li>`).join('')}</ul>`;
                }
            } else {
                // Limit length if needed, or CSS line-clamp
                cardContent += `<p>${item.description}</p>`;
            }
            cardContent += `</div>`;
        }

        // Meta Description (Citation)
        if (item.metaDescription) {
            cardContent += `<div class="pub-meta"><p>${item.metaDescription}</p></div>`;
        }

        // Link Icon
        if (displayUrl) {
            cardContent += `<div style="margin-top: auto; padding-top: 1rem; color: var(--accent); font-size: 0.9rem;">
                Read Publication <i class="fas fa-arrow-right" style="margin-left: 5px;"></i>
             </div>`;
        }

        cardContent += `</div>`;
        card.innerHTML = cardContent;
        grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
}

function createSection(title, items) {
    const section = document.createElement('section');
    section.id = title.replace(/\s+/g, '');
    section.className = 'content-section';

    const h2 = document.createElement('h2');
    h2.className = 'section-header';
    h2.textContent = title;
    section.appendChild(h2);

    // Certifications Special Handling (List with Icons)
    if (title === 'Certifications') {
        const ul = document.createElement('ul');
        ul.className = 'cert-list';

        items.forEach(cert => {
            const li = document.createElement('li');
            li.className = 'cert-item';

            // Determine Icon
            let iconClass = 'fas fa-certificate'; // Default
            let providerColor = 'var(--text-secondary)';

            const lowerCert = cert.toLowerCase();
            if (lowerCert.includes('udemy')) {
                iconClass = 'fas fa-graduation-cap'; // Udemy often represented by learning/grad cap in lieu of brand icon
                providerColor = '#A435F0'; // Udemy purple-ish
            } else if (lowerCert.includes('hackerrank')) {
                iconClass = 'fab fa-hackerrank';
                providerColor = '#2EC866'; // HackerRank green
            } else if (lowerCert.includes('google') || lowerCert.includes('gcp') || lowerCert.includes('tensorflow')) {
                iconClass = 'fab fa-google';
            } else if (lowerCert.includes('aws') || lowerCert.includes('amazon')) {
                iconClass = 'fab fa-aws';
            } else if (lowerCert.includes('azure') || lowerCert.includes('microsoft')) {
                iconClass = 'fab fa-microsoft';
            }

            li.innerHTML = `<i class="${iconClass} cert-icon" style="color: ${providerColor};"></i> <span class="cert-text">${cert}</span>`;
            ul.appendChild(li);
        });
        section.appendChild(ul);
        return section;
    }

    const grid = document.createElement('div');
    grid.className = 'cards-grid';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        if (title === 'Research Publications') card.classList.add('pub-card');

        let cardContent = '';

        // Image Logic
        const fallbackImage = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=60';
        const imageSrc = item.image || item.metaImage || fallbackImage;

        cardContent += `<img src="${imageSrc}" class="card-image" alt="Section Image">`;
        cardContent += `<div class="card-content-wrapper">`;

        // Title
        let displayTitle = item.title;
        let displayUrl = item.url;

        if (item.institution) {
            cardContent += `<h3 class="card-title">${item.institution}</h3>`;
            if (item.location) cardContent += `<span class="location">${item.location}</span>`;
            if (item.title) cardContent += `<h4 class="card-role">${item.title}</h4>`;
        }
        else if (displayTitle) {
            if (displayUrl) {
                const icon = item.isSearchLink ? '<i class="fas fa-search" style="font-size: 0.7em;"></i>' : '<i class="fas fa-external-link-alt"></i>';
                cardContent += `<h3 class="card-title"><a href="${displayUrl}" target="_blank">${displayTitle} ${icon}</a></h3>`;
            } else {
                cardContent += `<h3 class="card-title">${displayTitle}</h3>`;
            }
        }

        // Date / Category
        if (item.date) cardContent += `<div class="card-subtitle">${item.date}</div>`;
        if (item.category && title === 'Research Publications') cardContent += `<div class="card-subtitle">${item.category}</div>`;

        // Description
        if (item.description) {
            cardContent += `<div class="card-desc">`;
            if (Array.isArray(item.description)) {
                if (item.description.length > 0) {
                    cardContent += `<ul>${item.description.map(line => `<li>${line}</li>`).join('')}</ul>`;
                }
            } else {
                cardContent += `<p>${item.description}</p>`;
            }
            cardContent += `</div>`;
        }

        if (item.metaDescription) {
            cardContent += `<div class="pub-meta"><p>${item.metaDescription}</p></div>`;
        }

        cardContent += `</div>`; // Close wrapper

        card.innerHTML = cardContent;
        grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
}

