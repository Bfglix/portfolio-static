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
                sectionHTML = createPublicationGallery(sectionName, data[sectionName]);
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



function createPublicationGallery(title, items) {
    const section = document.createElement('section');
    section.id = title.replace(/\s+/g, '');
    section.className = 'content-section gallery-section';

    const h2 = document.createElement('h2');
    h2.className = 'section-header';
    h2.textContent = title;
    section.appendChild(h2);

    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'gallery-container';

    const track = document.createElement('div');
    track.className = 'gallery-track';

    items.forEach(item => {
        const slide = document.createElement('div');
        slide.className = 'gallery-slide';

        // Reuse card logic but wrapped in slide
        const card = document.createElement('div');
        card.className = 'card pub-card'; // Reuse pub-card style

        let cardContent = '';
        const fallbackImage = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=60';
        const imageSrc = item.image || item.metaImage || fallbackImage;
        const displayUrl = item.url;

        // Make entire card clickable if URL exists
        if (displayUrl) {
            slide.onclick = () => window.open(displayUrl, '_blank');
            slide.style.cursor = 'pointer';
        }

        cardContent += `<img src="${imageSrc}" class="card-image" alt="Section Image">`;
        cardContent += `<div class="card-content-wrapper">`;

        let displayTitle = item.title;
        // For gallery, title and description only
        cardContent += `<h3 class="card-title">${displayTitle}</h3>`;

        if (item.category) cardContent += `<div class="card-subtitle">${item.category}</div>`;

        if (item.metaDescription) {
            cardContent += `<div class="pub-meta"><p>${item.metaDescription}</p></div>`;
        }

        cardContent += `</div>`;
        card.innerHTML = cardContent;
        slide.appendChild(card);
        track.appendChild(slide);
    });

    galleryContainer.appendChild(track);
    section.appendChild(galleryContainer);

    // Navigation Buttons
    const prevBtn = document.createElement('button');
    prevBtn.className = 'gallery-nav-btn prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = (e) => { e.stopPropagation(); scrollGallery('left'); };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'gallery-nav-btn next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = (e) => { e.stopPropagation(); scrollGallery('right'); };

    section.appendChild(prevBtn);
    section.appendChild(nextBtn);

    // Indicators
    const indicators = document.createElement('div');
    indicators.className = 'gallery-indicators';
    section.appendChild(indicators);

    // State for Responsive Pagination
    let itemsPerView = 1;

    function updateItemsPerView() {
        if (window.matchMedia('(min-width: 1024px)').matches) {
            itemsPerView = 3;
        } else if (window.matchMedia('(min-width: 768px)').matches) {
            itemsPerView = 2;
        } else {
            itemsPerView = 1;
        }
    }

    function renderDots() {
        indicators.innerHTML = '';
        // If items are 19, and view is 3. 19/3 = 6.33 -> 7 pages.
        // Page 0: 0-2, Page 1: 3-5, ... Page 6: 18-19.
        // It seems correct.
        // Maybe the user sees extra dots because calculate is slightly off or specific count.
        // Let's ensure we don't create a dot if the last page is empty or handled by previous? No.
        const numPages = Math.ceil(items.length / itemsPerView);

        for (let i = 0; i < numPages; i++) {
            const dot = document.createElement('div');
            dot.className = i === 0 ? 'gallery-dot active' : 'gallery-dot';
            dot.onclick = () => scrollToPage(i);
            indicators.appendChild(dot);
        }
    }

    // Initial Setup
    updateItemsPerView();
    renderDots();

    // Resize Handler
    window.addEventListener('resize', () => {
        updateItemsPerView();
        renderDots();
        updateActiveDotOnScroll();
    });

    // Scroll Logic
    function scrollGallery(direction) {
        const slide = track.querySelector('.gallery-slide');
        if (!slide) return;

        const cardWidth = slide.offsetWidth;
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.gap) || 32;
        const scrollAmount = cardWidth + gap;

        if (direction === 'left') {
            galleryContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            galleryContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    function scrollToPage(pageIndex) {
        // Find the index of the first item on this page
        // Ensure we don't go out of bounds
        const itemIndex = Math.min(pageIndex * itemsPerView, items.length - 1);
        const slide = track.children[itemIndex];

        if (!slide) return;

        // Target Layout:
        // We want the group to start at the left cache.
        // Just scrolling to the slide element is correct.
        galleryContainer.scrollTo({
            left: slide.offsetLeft,
            behavior: 'smooth'
        });
    }

    function updateActiveDotOnScroll() {
        const containerLeft = galleryContainer.scrollLeft;
        let closestItemIndex = 0;
        let minDiff = Infinity;

        // Find the item closest to the left edge
        Array.from(track.children).forEach((slide, i) => {
            const diff = Math.abs(containerLeft - slide.offsetLeft);
            if (diff < minDiff) {
                minDiff = diff;
                closestItemIndex = i;
            }
        });

        // Determine which page this item belongs to
        const currentPage = Math.floor(closestItemIndex / itemsPerView);

        Array.from(indicators.children).forEach((dot, i) => {
            dot.className = i === currentPage ? 'gallery-dot active' : 'gallery-dot';
        });
    }

    // Listen to scroll
    galleryContainer.addEventListener('scroll', () => {
        updateActiveDotOnScroll();
    });

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

