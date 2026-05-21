const form = document.getElementById('cv-form');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    // 1. Формоос мэдээлэл авах
    const data = {
        name: document.getElementById('fullName').value,
        age: document.getElementById('age').value,
        prof: document.getElementById('profession').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        about: document.getElementById('aboutMe').value,
        edu: document.getElementById('education').value,
        exp: document.getElementById('experience').value,
        lang: document.getElementById('languages').value,
        software: document.getElementById('software').value,
        skills: document.getElementById('skills').value
    };

    // 2. Жагсаалт үүсгэх туслах функц
    const formatList = (str) => {
        if (!str || str.trim() === "") return "<li>N/A</li>";
        return str.split(',')
            .map(item => `<li>${item.trim()}</li>`)
            .join('');
    };

    // 3. CV-ийн HTML-ийг угсрах
    const cvHTML = `
        <div class="cv-sidebar">
            <div class="contact-info">
                <h4>Холбоо барих</h4>
                <p>📧 ${data.email}</p>
                <p>📞 ${data.phone}</p>
                <p>📍 ${data.address}</p>
                <p>🎂 ${data.age} настай</p>
            </div>

            <h4>Хэлний мэдлэг</h4>
            <ul>${formatList(data.lang)}</ul>

            <h4>Програм хангамж</h4>
            <ul>${formatList(data.software)}</ul>

            <h4>Ур чадвар</h4>
            <ul>${formatList(data.skills)}</ul>
        </div>

        <div class="cv-main">
            <div class="cv-header">
                <h1>${data.name}</h1>
                <p class="job-title">${data.prof}</p>
            </div>

            <section>
                <h3>Өөрийн тухай</h3>
                <p>${data.about.replace(/\n/g, '<br>')}</p>
            </section>

            <section>
                <h3>Ажлын туршлага</h3>
                <p>${data.exp.replace(/\n/g, '<br>')}</p>
            </section>

            <section>
                <h3>Боловсрол</h3>
                <p>${data.edu.replace(/\n/g, '<br>')}</p>
            </section>
        </div>
    `;

    // 4. Дэлгэцэнд харуулах
    document.getElementById('cv-output').innerHTML = cvHTML;
    document.getElementById('form-section').style.display = 'none';
    document.getElementById('cv-section').style.display = 'block';
});