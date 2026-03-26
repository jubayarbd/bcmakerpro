// ==========================================
// 1. Theme Toggle Logic
// ==========================================
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;
const icon = themeToggleBtn.querySelector('i');
const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    icon.classList.replace('fa-moon', 'fa-sun');
}

themeToggleBtn.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        icon.classList.replace('fa-sun', 'fa-moon');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
});

// ==========================================
// 2. Helper Functions (Title Case & Date Format)
// ==========================================
function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/\b[a-z]/g, function(letter) {
        return letter.toUpperCase();
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    dateStr = dateStr.trim();
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    const months = {
        'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
        'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
        'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
    };
    const match = dateStr.toUpperCase().match(/(\d{1,2})\s+([A-Z]+)\s+(\d{4})/);
    if (match) {
        let day = match[1].padStart(2, '0');
        let month = months[match[2]] || '01';
        let year = match[3];
        return `${day}/${month}/${year}`;
    }
    return dateStr;
}

// ==========================================
// 3. Manual Form Logic (Real-time update)
// ==========================================
const fields = [
    { in: 'in_reg_num', out: 'out_reg_num' }, { in: 'in_reg_date', out: 'out_reg_date' },
    { in: 'in_iss_date', out: 'out_iss_date' }, { in: 'in_dob', out: 'out_dob' },
    { in: 'in_sex', out: 'out_sex' }, { in: 'in_dob_word', out: 'out_dob_word' },
    { in: 'in_name_bn', out: 'out_name_bn' }, { in: 'in_name_en', out: 'out_name_en' },
    { in: 'in_mother_bn', out: 'out_mother_bn' }, { in: 'in_mother_en', out: 'out_mother_en' },
    { in: 'in_father_bn', out: 'out_father_bn' }, { in: 'in_father_en', out: 'out_father_en' },
    { in: 'in_pob_bn', out: 'out_pob_bn' }, { in: 'in_pob_en', out: 'out_pob_en' },
    { in: 'in_addr_bn', out: 'out_addr_bn' }, { in: 'in_addr_en', out: 'out_addr_en' }
];

fields.forEach(f => {
    const inputEl = document.getElementById(f.in);
    const outputEl = document.getElementById(f.out);
    if (inputEl && outputEl) {
        inputEl.addEventListener('input', () => {
            outputEl.innerText = inputEl.value;
            if(f.in === 'in_reg_num') generateBarcode(inputEl.value);
        });
    }
});

function generateBarcode(value) {
    if(!value) return;
    try {
        JsBarcode("#barcode", value, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: false,
            lineColor: "#333333",
            background: ""
        });
        document.getElementById('barcode').style.opacity = '1';
    } catch(e) { }
}

function downloadImage() {
    html2canvas(document.getElementById('certificate-container'), { scale: 4, useCORS: true }).then(c => {
        const link = document.createElement('a');
        link.download = 'Birth_Certificate.png';
        link.href = c.toDataURL();
        link.click();
    });
}

// ==========================================
// 4. Auto Scraping Logic
// ==========================================
window.onload = loadCaptcha;

async function loadCaptcha() {
    const captchaImg = document.getElementById('captchaImage');
    const errorMsg = document.getElementById('fetchError');
    const successMsg = document.getElementById('fetchSuccess');
    
    captchaImg.src = ''; 
    captchaImg.alt = 'Loading...';
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/get-captcha`);
        const data = await response.json();
        if(data.captcha) captchaImg.src = data.captcha;
        else captchaImg.alt = 'Captcha failed';
    } catch (error) {
        errorMsg.innerText = "সার্ভার এরর! টার্মিনালে node server.js রান করুন।";
        errorMsg.style.display = 'block';
    }
}

async function fetchOfficialData() {
    const regNum = document.getElementById('scrap_reg_num').value.trim();
    const dob = document.getElementById('scrap_dob').value.trim();
    const captchaAns = document.getElementById('scrap_captcha').value.trim();
    
    const submitBtn = document.getElementById('fetchDataBtn');
    const errorMsg = document.getElementById('fetchError');
    const successMsg = document.getElementById('fetchSuccess');

    if(!regNum || !dob || !captchaAns) {
        errorMsg.innerText = "সব তথ্য পূরণ করুন।";
        errorMsg.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching Data...';
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/get-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ regNum, dob, captchaAns })
        });

        const data = await response.json();

        if(response.ok && !data.error && data.name_bn) {
            
            document.getElementById('in_reg_num').value = regNum;
            document.getElementById('in_reg_date').value = formatDate(data.reg_date);
            document.getElementById('in_iss_date').value = formatDate(data.issuance_date);
            document.getElementById('in_dob').value = formatDate(dob); 
            
            const sexSelect = document.getElementById('in_sex');
            if(data.sex) {
                if(data.sex.toUpperCase() === 'MALE') sexSelect.value = 'Male';
                else if(data.sex.toUpperCase() === 'FEMALE') sexSelect.value = 'Female';
            }

            document.getElementById('in_name_bn').value = data.name_bn || '';
            document.getElementById('in_name_en').value = toTitleCase(data.name_en); // Title Case
            document.getElementById('in_mother_bn').value = data.mother_bn || '';
            document.getElementById('in_mother_en').value = toTitleCase(data.mother_en); // Title Case
            document.getElementById('in_father_bn').value = data.father_bn || '';
            document.getElementById('in_father_en').value = toTitleCase(data.father_en); // Title Case
            document.getElementById('in_pob_bn').value = data.pob_bn || '';
            document.getElementById('in_pob_en').value = toTitleCase(data.pob_en); // Title Case

            fields.forEach(f => {
                const el = document.getElementById(f.in);
                if(el) el.dispatchEvent(new Event('input'));
            });


            successMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> ডাটা সফলভাবে আনা হয়েছে!';
            successMsg.style.display = 'block';
            
            setTimeout(() => {
                successMsg.style.display = 'none';
                loadCaptcha(); 
            }, 3000);
            
        } else {
            errorMsg.innerText = data.error || "সঠিক তথ্য পাওয়া যায়নি। ক্যাপচা বা ইনপুট ভুল হতে পারে।";
            errorMsg.style.display = 'block';
            loadCaptcha(); 
        }
    } catch (error) {
        errorMsg.innerText = "সার্ভারের সাথে কানেক্ট করা যাচ্ছে না।";
        errorMsg.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Get Data Auto';
        document.getElementById('scrap_captcha').value = ''; 
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}
