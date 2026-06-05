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
    { in: 'in_addr_bn', out: 'out_addr_bn' }, { in: 'in_addr_en', out: 'out_addr_en' },
    { in: 'in_random_code', out: 'out_random_code' }, { in: 'in_union', out: 'out_union' },
    { in: 'in_upazila', out: 'out_upazila' }
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

        // বারকোড তৈরি হওয়ার সাথে সাথেই নতুন রেন্ডম কোড জেনারেট হবে
        generateRandomCode();
        generateQRCode();

        document.getElementById('barcode').style.opacity = '1';
    } catch(e) { }
}

// function downloadImage() {
//     html2canvas(document.getElementById('certificate-container'), { scale: 3, useCORS: true }).then(c => {
//         const link = document.createElement('a');
//         link.download = 'Birth_Certificate.png';
//         link.href = c.toDataURL();
//         link.click();
//     });
// }

function downloadImage() {
    const btn = document.querySelector('.btn-d');
    const originalText = btn.innerHTML;
    
    // বাটন লোডিং স্টেট দেখানোর জন্য
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    // ফন্ট পুরোপুরি লোড হওয়া পর্যন্ত অপেক্ষা করবে
    document.fonts.ready.then(() => {
        html2canvas(document.getElementById('certificate-container'), { 
            scale: 3, // মোবাইলে ক্র্যাশ রোধে ৪ এর বদলে ৩ ব্যবহার করা নিরাপদ
            useCORS: true,
            allowTaint: true, // ফন্ট রেন্ডারিংয়ের জন্য সহায়ক
            logging: false
        }).then(c => {
            const link = document.createElement('a');
            link.download = 'Birth_Certificate.png';
            link.href = c.toDataURL('image/png', 1.0);
            link.click();
            
            // বাটন আগের অবস্থায় ফিরিয়ে আনা
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error("Canvas Error: ", err);
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
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
            // Registration office from scrape maps to Union Parishad field (convert to Title Case)
            document.getElementById('in_union').value = data.reg_office ? toTitleCase(data.reg_office) : '';
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
            // add Bangladesh auto to pob
            document.getElementById('in_pob_bn').value = data.pob_bn ? data.pob_bn + ", বাংলাদেশ" : '';
            document.getElementById('in_pob_en').value = data.pob_en ? toTitleCase(data.pob_en) + ", Bangladesh" : '';

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


// ==========================================
// 5. Date to Words Converter (Title Case, Custom Year & 'of')
// ==========================================

// Ordinal numbers for days
const dobOrdinals = {
    1: "FIRST", 2: "SECOND", 3: "THIRD", 4: "FOURTH", 5: "FIFTH", 6: "SIXTH", 7: "SEVENTH", 8: "EIGHTH", 9: "NINTH", 10: "TENTH",
    11: "ELEVENTH", 12: "TWELFTH", 13: "THIRTEENTH", 14: "FOURTEENTH", 15: "FIFTEENTH", 16: "SIXTEENTH", 17: "SEVENTEENTH", 18: "EIGHTEENTH", 19: "NINETEENTH", 20: "TWENTIETH",
    21: "TWENTY FIRST", 22: "TWENTY SECOND", 23: "TWENTY THIRD", 24: "TWENTY FOURTH", 25: "TWENTY FIFTH", 26: "TWENTY SIXTH", 27: "TWENTY SEVENTH", 28: "TWENTY EIGHTH", 29: "TWENTY NINTH", 30: "THIRTIETH",
    31: "THIRTY FIRST"
};

// Month names
const dobMonths = {
    1: "JANUARY", 2: "FEBRUARY", 3: "MARCH", 4: "APRIL", 5: "MAY", 6: "JUNE",
    7: "JULY", 8: "AUGUST", 9: "SEPTEMBER", 10: "OCTOBER", 11: "NOVEMBER", 12: "DECEMBER"
};

// Function to convert year to words
function yearToWords(num) {
    if (num === 0) return "ZERO";
    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY ', 'THIRTY ', 'FORTY ', 'FIFTY ', 'SIXTY ', 'SEVENTY ', 'EIGHTY ', 'NINETY '];
    
    // Helper to get tens
    function getTens(n) {
        if (n < 20) return a[n];
        return b[Math.floor(n / 10)] + (n % 10 > 0 ? a[n % 10] : '');
    }

    let str = '';

    // Special logic for years between 1900 and 1999 (e.g., Nineteen Eighty Four)
    if (num >= 1900 && num <= 1999) {
        str = "NINETEEN ";
        let remainder = num % 100;
        
        if (remainder === 0) {
            str += "HUNDRED ";
        } else if (remainder < 10) {
            str += "HUNDRED " + a[remainder]; // 1905 = Nineteen Hundred Five
        } else {
            str += getTens(remainder); // 1984 = Nineteen Eighty Four
        }
        return str.trim();
    }

    // Default logic for other years (e.g., 2000+)
    if (num >= 1000) { str += a[Math.floor(num / 1000)] + "THOUSAND "; num %= 1000; }
    if (num >= 100) { str += a[Math.floor(num / 100)] + "HUNDRED "; num %= 100; }
    if (num > 0) { str += getTens(num); }
    
    return str.trim();
}

// Helper function to convert a string to Title Case
function toTitleCaseWords(str) {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

// Main function to convert DD/MM/YYYY to words
function convertDateToWords(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return "";
    
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return "";
    
    let dayStr = dobOrdinals[day] || "";
    let monthStr = dobMonths[month] || "";
    let yearStr = yearToWords(year);
    
    if (!dayStr || !monthStr || !yearStr) return "";
    
    // Convert parts to Title Case individually
    let formattedDay = toTitleCaseWords(dayStr);
    let formattedMonth = toTitleCaseWords(monthStr);
    let formattedYear = toTitleCaseWords(yearStr);
    
    // Return with lowercase 'of' in the middle
    return `${formattedDay} of ${formattedMonth} ${formattedYear}`;
}

// Attach event listeners to input fields
const dobInput = document.getElementById('in_dob');
const dobWordInput = document.getElementById('in_dob_word');

if(dobInput && dobWordInput) {
    dobInput.addEventListener('input', () => {
        dobWordInput.value = convertDateToWords(dobInput.value);
        
        // Dispatch event to ensure real-time preview update on the image
        dobWordInput.dispatchEvent(new Event('input')); 
    });
}



// ==========================================
// 6. Random 4-Letter Security Code Generator
// ==========================================
function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Set the generated code to the input field
    const inputField = document.getElementById('in_random_code');
    if (inputField) {
        inputField.value = result;
        // Trigger event to update canvas
        inputField.dispatchEvent(new Event('input'));
    }
}

// ==========================================
// 6. Barcode & QR Code Generator
// ==========================================

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// QR Code জেনারেট করার ফাংশন
function generateQRCode() {
    // 40-45 অক্ষরের র‍্যান্ডম স্ট্রিং তৈরি করা
    const randomLength = Math.floor(Math.random() * (45 - 40 + 1)) + 40;
    const randomSuffix = generateRandomString(randomLength);
    
    // মূল URL এর সাথে যুক্ত করা
    const finalUrl = `https://bdris.gov.bd/certificate/verify?key=${randomSuffix}`;
    
    // Set the generated URL to the input field
    const inputField = document.getElementById('in_qr_link');
    if (inputField) {
        inputField.value = finalUrl;
        // Trigger event to generate QR code on canvas
        inputField.dispatchEvent(new Event('input'));
    }
}

// Function to generate QR code from input field value
function generateQRCodeFromInput(urlValue) {
    const qrContainer = document.getElementById("out_qrcode");
    if (!qrContainer || !urlValue) return;
    
    // আগের কিউআর কোড মুছে ফেলা
    qrContainer.innerHTML = "";
    
    // নতুন QR Code তৈরি করা
    new QRCode(qrContainer, {
        text: urlValue,
        width: 110, 
        height: 110,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
    });
}


// পেজ লোড হওয়ার সাথে সাথে একবার জেনারেট করবে
generateQRCode();

// পেজ লোড হওয়ার সাথে সাথে একবার রেন্ডম কোড জেনারেট করবে
generateRandomCode();
// Event listener for QR link input field changes
const qrLinkInput = document.getElementById('in_qr_link');
if (qrLinkInput) {
    qrLinkInput.addEventListener('input', () => {
        if (qrLinkInput.value) {
            generateQRCodeFromInput(qrLinkInput.value);
        }
    });
}