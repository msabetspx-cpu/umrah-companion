'use strict';

/* =========================================================================
 * رفيق العمرة — تطبيق يعمل دون إنترنت
 * تمت مراجعته وإصلاحه: أمان (XSS)، عمل Offline، عدّادات، آلة حالة، محتوى شرعي.
 * كل معلومة شرعية لها مصدر ودرجة. المحتوى المطلوب توثيقه محدَّد بـ needsHumanReview.
 * ========================================================================= */

/* ------------------------------- المحتوى الشرعي ------------------------------- */
/* نموذج البيانات موحّد:
 *  id, type, title, text, source, sourceUrl, hadithNumber, grading,
 *  verifiedAt, showDisagreement, needsHumanReview, notes
 */
const VERIFIED_AT = '2026-09-20';

const adhkarData = [
    {
        id: 'talbiyah',
        type: 'dhikr',
        title: 'التلبية',
        text: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لاَ شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لاَ شَرِيكَ لَكَ',
        source: 'صحيح البخاري، صحيح مسلم',
        sourceUrl: 'https://dorar.net/hadith/sharh/2233',
        hadithNumber: 'البخاري 1549 / مسلم 1184',
        grading: 'صحيح',
        verifiedAt: VERIFIED_AT,
        showDisagreement: false,
        needsHumanReview: false,
        notes: 'نص التلبية الثابت.'
    },
    {
        id: 'dua-two-corners',
        type: 'dua',
        title: 'الدعاء بين الركن اليماني والحجر الأسود',
        text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        source: 'سنن أبي داود',
        sourceUrl: 'https://dorar.net/hadith/sharh/4114',
        hadithNumber: 'أبو داود 1892',
        grading: 'حسن (حسّنه الألباني)',
        verifiedAt: VERIFIED_AT,
        showDisagreement: false,
        needsHumanReview: false,
        notes: 'يُقال في هذا الموضع، وليس دعاءً مخصوصاً بشوطٍ بعينه.'
    },
    {
        id: 'dua-safa-marwa',
        type: 'dhikr',
        title: 'الذكر على الصفا والمروة',
        text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، لا إله إلا الله وحده، أنجز وعده، ونصر عبده، وهزم الأحزاب وحده',
        source: 'صحيح مسلم (حديث جابر الطويل في صفة الحج)',
        sourceUrl: 'https://dorar.net/hadith/sharh/3105',
        hadithNumber: 'مسلم 1218',
        grading: 'صحيح',
        verifiedAt: VERIFIED_AT,
        showDisagreement: false,
        needsHumanReview: false,
        notes: 'يُقال على الصفا وعلى المروة.'
    }
];

const forgotData = [
    {
        id: 'forgot-count',
        type: 'ruling',
        q: 'نسيت عدد أشواط الطواف أو السعي',
        a: 'ابنِ على اليقين وهو الأقل. فإذا شككت هل طفت 3 أم 4 فاجعلها 3 وأكمل.',
        source: 'قاعدة: اليقين لا يزول بالشك — قول جمهور العلماء',
        sourceUrl: 'https://islamqa.info/ar/answers/36855',
        grading: 'قاعدة فقهية / قول الجمهور',
        verifiedAt: VERIFIED_AT,
        showDisagreement: true,
        disagreementNote: 'ذهب بعض العلماء إلى البناء على غلبة الظن. والبناء على اليقين (الأقل) هو الأحوط والمفتى به عند اللجنة الدائمة.',
        needsHumanReview: false
    },
    {
        id: 'forgot-wudu-tawaf',
        type: 'ruling',
        q: 'انتقض وضوئي أثناء الطواف',
        a: 'الأحوط أن تخرج وتتوضأ ثم تعود وتكمل من حيث توقفت.',
        source: 'المسألة خلافية — والأحوط تجديد الوضوء',
        sourceUrl: 'https://islamqa.info/ar/answers/34695',
        grading: 'مسألة خلافية',
        verifiedAt: VERIFIED_AT,
        showDisagreement: true,
        disagreementNote: 'الجمهور على اشتراط الطهارة للطواف، ورجّح شيخ الإسلام ابن تيمية عدم اشتراطها. التطبيق ينصح بالأحوط (تجديد الوضوء) خروجاً من الخلاف.',
        needsHumanReview: false
    },
    {
        id: 'forgot-wudu-sai',
        type: 'ruling',
        q: 'انتقض وضوئي أثناء السعي',
        a: 'استمر في السعي؛ فالطهارة ليست شرطاً للسعي وإنما هي مستحبة.',
        source: 'لا تُشترط الطهارة للسعي عند عامة أهل العلم',
        sourceUrl: 'https://islamqa.info/ar/answers/33845',
        grading: 'قول عامة أهل العلم',
        verifiedAt: VERIFIED_AT,
        showDisagreement: false,
        needsHumanReview: false
    }
];

const ihramRules = [
    {
        id: 'ihram-hair-nails',
        text: 'إزالة الشعر وتقليم الأظافر.',
        source: 'القرآن (البقرة 196) وأقوال أهل العلم',
        grading: 'محظور متفق عليه', verifiedAt: VERIFIED_AT, needsHumanReview: false
    },
    {
        id: 'ihram-perfume',
        text: 'التطيّب في البدن أو الثوب بعد الإحرام.',
        source: 'صحيح البخاري ومسلم', grading: 'محظور متفق عليه', verifiedAt: VERIFIED_AT, needsHumanReview: false
    },
    {
        id: 'ihram-sewn',
        text: 'لبس المخيط للرجال (كالقميص والسراويل)، ولبس ما فُصِّل على قدر البدن.',
        source: 'صحيح البخاري ومسلم (حديث ابن عمر)', grading: 'محظور للرجال', verifiedAt: VERIFIED_AT, needsHumanReview: false
    },
    {
        id: 'ihram-cover-head',
        text: 'تغطية الرأس بملاصق للرجل.',
        source: 'أقوال أهل العلم', grading: 'محظور للرجال', verifiedAt: VERIFIED_AT, needsHumanReview: false
    },
    {
        id: 'ihram-niqab-gloves',
        text: 'لبس المرأة للنقاب والقفازين (وتستر وجهها بغير النقاب عند الرجال الأجانب).',
        source: 'صحيح البخاري (حديث ابن عمر)', grading: 'محظور للمرأة', verifiedAt: VERIFIED_AT, needsHumanReview: false
    },
    {
        id: 'ihram-marriage',
        text: 'عقد النكاح.',
        source: 'صحيح مسلم', grading: 'محظور متفق عليه', verifiedAt: VERIFIED_AT, needsHumanReview: false
    },
    {
        id: 'ihram-intimacy',
        text: 'الجماع ومقدماته، وهو أعظم المحظورات.',
        source: 'القرآن (البقرة 197)', grading: 'محظور متفق عليه', verifiedAt: VERIFIED_AT, needsHumanReview: false
    },
    {
        id: 'ihram-hunt',
        text: 'صيد البر.',
        source: 'القرآن (المائدة 95)', grading: 'محظور متفق عليه', verifiedAt: VERIFIED_AT, needsHumanReview: false
    }
];

/* خطوات وضع "رافقني" — نصوص إرشادية موثّقة أو عامة لا تنسب حكماً بلا دليل */
const companionSteps = [
    { title: 'النية والإحرام', body: 'اغتسل وتطيّب في بدنك (قبل الإحرام)، والبس ملابس الإحرام، ثم انوِ الدخول في العمرة وقل: «لبيك اللهم عمرة».' },
    { title: 'التلبية', body: 'أكثِر من التلبية من حين إحرامك حتى تبدأ الطواف: «لبيك اللهم لبيك...».' },
    { title: 'دخول المسجد والطواف', body: 'ادخل بقدمك اليمنى، وابدأ الطواف من الحجر الأسود مع جعل الكعبة عن يسارك، سبعة أشواط. استخدم شاشة «الطواف» لعدّ الأشواط.' },
    { title: 'ركعتان وزمزم', body: 'بعد الطواف صلِّ ركعتين خلف مقام إبراهيم إن تيسّر، ثم اشرب من ماء زمزم.' },
    { title: 'السعي', body: 'اتجه إلى الصفا وابدأ السعي إلى المروة سبعة أشواط. استخدم شاشة «السعي» لمتابعة الاتجاه والعدد.' },
    { title: 'التحلل', body: 'بعد إتمام السعي: الرجل يحلق أو يقصّر، والمرأة تقصّر قدر أنملة. وبهذا تمّت العمرة، تقبّل الله.' }
];

/* ------------------------------- آلة الحالة ------------------------------- */
const STAGES = ['PREPARATION', 'TAWAF', 'SAI', 'HALQ_OR_TAQSIR', 'UMRAH_COMPLETE'];
const STAGE_HINTS = {
    PREPARATION: 'مرحلتك الآن: الاستعداد والإحرام. تصفّح «رافقني» لمعرفة الخطوات.',
    TAWAF: 'مرحلتك الآن: الطواف. افتح شاشة الطواف لعدّ الأشواط.',
    SAI: 'مرحلتك الآن: السعي بين الصفا والمروة.',
    HALQ_OR_TAQSIR: 'مرحلتك الآن: التحلل (الحلق أو التقصير).',
    UMRAH_COMPLETE: 'تمّت عمرتك، تقبّل الله منك. يمكنك تصفّح المعلومات في أي وقت.'
};

/* ------------------------------- الحالة ------------------------------- */
const DEFAULT_STATE = {
    schema: 2,
    stage: 'PREPARATION',
    tawafCount: 0, // عدد الأشواط المكتملة (0..7)
    saiCount: 0,   // عدد الأشواط المكتملة (0..7)
    checklist: [
        { text: 'الاغتسال قبل الإحرام', done: false },
        { text: 'قص الأظافر وإزالة الشعر (قبل الإحرام)', done: false },
        { text: 'ملابس الإحرام (للرجال)', done: false },
        { text: 'الهوية / الجواز والتصاريح', done: false }
    ]
};

let state = structuredCloneSafe(DEFAULT_STATE);

/* أدوات مساعدة عامة */
function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/** تهرب النص لمنع XSS عند إدراجه داخل HTML. */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* دمج الحالة المحفوظة مع الافتراضية حتى لا تُفقد الحقول الجديدة أو تنكسر عند التلف */
function loadState() {
    try {
        const saved = localStorage.getItem('umrahState');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = Object.assign(structuredCloneSafe(DEFAULT_STATE), parsed);
            // تنظيف القيم للتأكد من صحتها
            state.tawafCount = clampCount(state.tawafCount);
            state.saiCount = clampCount(state.saiCount);
            if (!STAGES.includes(state.stage)) state.stage = 'PREPARATION';
            if (!Array.isArray(state.checklist)) state.checklist = structuredCloneSafe(DEFAULT_STATE.checklist);
        }
    } catch (e) {
        // بيانات تالفة: نبدأ من حالة نظيفة بدل تعطيل التطبيق بالكامل
        console.warn('تعذّر قراءة الحالة المحفوظة، ستُستخدم القيم الافتراضية.', e);
        state = structuredCloneSafe(DEFAULT_STATE);
    }
}

function saveState() {
    try {
        localStorage.setItem('umrahState', JSON.stringify(state));
    } catch (e) {
        console.warn('تعذّر حفظ الحالة (قد تكون مساحة التخزين ممتلئة).', e);
    }
}

function clampCount(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < 0) return 0;
    if (n > 7) return 7;
    return n;
}

/* ------------------------------- التهيئة ------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    registerServiceWorker();
    setupNavigation();
    setupThemeToggle();
    setupTawaf();
    setupSai();
    setupCompanion();
    setupLists();
    setupSpeech(document);
    setupModal();
    updateTawafUI();
    updateSaiUI();
    updateStageHint();
});

/* تسجيل عامل الخدمة ليعمل التطبيق دون إنترنت */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.warn('فشل تسجيل عامل الخدمة:', err);
            });
        });
    }
}

/* ------------------------------- التنقّل ------------------------------- */
function showView(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    target.classList.add('active');
    // تمييز زر التنقّل السفلي النشِط
    document.querySelectorAll('.bottom-nav .nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.target === targetId);
    });
    window.scrollTo(0, 0);
}

function setupNavigation() {
    document.querySelectorAll('.nav-btn, .step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            showView(e.currentTarget.dataset.target);
        });
    });
}

/* ------------------------------- الوضع الليلي ------------------------------- */
function setupThemeToggle() {
    const btn = document.getElementById('btn-theme');
    const apply = (dark) => {
        if (dark) document.body.setAttribute('data-theme', 'dark');
        else document.body.removeAttribute('data-theme');
        btn.textContent = dark ? '☀️' : '🌙';
    };
    let dark = false;
    try { dark = localStorage.getItem('theme') === 'dark'; } catch (e) {}
    apply(dark);

    btn.addEventListener('click', () => {
        dark = document.body.getAttribute('data-theme') !== 'dark';
        apply(dark);
        try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
    });
}

/* ------------------------------- آلة الحالة (لطيفة) ------------------------------- */
function advanceStage(to) {
    // لا نُرجِع المرحلة للخلف تلقائياً، لكن نسمح دائماً بتصفّح كل الشاشات
    const currentIdx = STAGES.indexOf(state.stage);
    const toIdx = STAGES.indexOf(to);
    if (toIdx > currentIdx) {
        state.stage = to;
        saveState();
        updateStageHint();
    }
}

function updateStageHint() {
    const el = document.getElementById('stage-hint');
    if (el) el.textContent = STAGE_HINTS[state.stage] || '';
}

/* ------------------------------- عداد الطواف ------------------------------- */
/* حارس ضد الضغط السريع المزدوج */
function makeTapGuard(delay = 250) {
    let last = 0;
    return () => {
        const now = Date.now();
        if (now - last < delay) return false;
        last = now;
        return true;
    };
}

function setupTawaf() {
    const guard = makeTapGuard();
    document.getElementById('tawaf-plus').addEventListener('click', () => {
        if (!guard()) return;
        if (state.tawafCount < 7) {
            state.tawafCount++;
            saveState();
            updateTawafUI();
            if (state.tawafCount === 7) {
                advanceStage('SAI');
                alert('أتممت 7 أشواط، تقبّل الله. صلِّ ركعتين خلف المقام إن تيسّر ثم اشرب من زمزم، ثم توجّه للسعي.');
                showView('view-sai');
            }
        }
    });

    document.getElementById('tawaf-minus').addEventListener('click', () => {
        if (state.tawafCount > 0) {
            state.tawafCount--;
            saveState();
            updateTawafUI();
        }
    });

    document.getElementById('tawaf-reset').addEventListener('click', () => {
        if (confirm('هل تريد إعادة عدّاد الطواف إلى الصفر؟')) {
            state.tawafCount = 0;
            saveState();
            updateTawafUI();
        }
    });

    document.getElementById('tawaf-doubt').addEventListener('click', () => {
        alert('القاعدة: «ابنِ على اليقين وهو الأقل». إذا شككت هل طفت 3 أم 4 فاعتبرها 3 وأكمل. (مسألة خلافية، وهذا هو الأحوط والمفتى به عند اللجنة الدائمة).');
    });
}

function updateTawafUI() {
    document.getElementById('tawaf-count').textContent = state.tawafCount;
}

/* ------------------------------- عداد السعي ------------------------------- */
function setupSai() {
    const guard = makeTapGuard();
    document.getElementById('sai-plus').addEventListener('click', () => {
        if (!guard()) return;
        if (state.saiCount < 7) {
            state.saiCount++;
            saveState();
            updateSaiUI();
            if (state.saiCount === 7) {
                advanceStage('HALQ_OR_TAQSIR');
                alert('أتممت السعي، تقبّل الله. توجّه للتحلل (الحلق أو التقصير).');
                showView('view-tahallul');
            }
        }
    });

    document.getElementById('sai-minus').addEventListener('click', () => {
        if (state.saiCount > 0) {
            state.saiCount--;
            saveState();
            updateSaiUI();
        }
    });

    document.getElementById('sai-reset').addEventListener('click', () => {
        if (confirm('هل تريد إعادة عدّاد السعي إلى الصفر؟')) {
            state.saiCount = 0;
            saveState();
            updateSaiUI();
        }
    });
}

function updateSaiUI() {
    document.getElementById('sai-count').textContent = state.saiCount;
    const dir = document.getElementById('sai-direction');
    if (!dir) return;
    if (state.saiCount >= 7) {
        dir.textContent = 'اكتمل السعي (7 أشواط)';
        return;
    }
    // الشوط الجاري = المكتمل + 1. الفردي: الصفا ➔ المروة، الزوجي: المروة ➔ الصفا
    const currentLeg = state.saiCount + 1;
    const isSafaToMarwa = (currentLeg % 2 !== 0);
    dir.textContent = `الشوط ${currentLeg}: ${isSafaToMarwa ? 'الصفا ➔ المروة' : 'المروة ➔ الصفا'}`;
}

/* ------------------------------- وضع "رافقني" ------------------------------- */
function setupCompanion() {
    let idx = 0;
    const content = document.getElementById('companion-content');
    const render = () => {
        const step = companionSteps[idx];
        content.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'info-card';
        const h = document.createElement('h3');
        h.textContent = `الخطوة ${idx + 1} من ${companionSteps.length}: ${step.title}`;
        const p = document.createElement('p');
        p.textContent = step.body;
        card.appendChild(h);
        card.appendChild(p);
        content.appendChild(card);
        document.getElementById('comp-prev').disabled = (idx === 0);
        document.getElementById('comp-next').disabled = (idx === companionSteps.length - 1);
    };
    document.getElementById('comp-prev').addEventListener('click', () => { if (idx > 0) { idx--; render(); } });
    document.getElementById('comp-next').addEventListener('click', () => { if (idx < companionSteps.length - 1) { idx++; render(); } });
    render();
}

/* ------------------------------- القوائم (أذكار / نسيت / محظورات / checklist) ------------------------------- */
function badge(text, cls) {
    return `<span class="badge ${cls}">${escapeHtml(text)}</span>`;
}

function setupLists() {
    /* الأذكار */
    const adhkarContainer = document.getElementById('adhkar-list');
    const renderAdhkar = (query = '') => {
        const q = query.trim();
        const matches = adhkarData.filter(a => a.title.includes(q) || a.text.includes(q));
        if (matches.length === 0) {
            adhkarContainer.innerHTML = `<p class="empty-msg">${escapeHtml('لا توجد نتائج مطابقة.')}</p>`;
            return;
        }
        adhkarContainer.innerHTML = matches.map(a => `
            <div class="info-card">
                <h3>${escapeHtml(a.title)}</h3>
                <p class="arabic-text">${escapeHtml(a.text)}</p>
                <p class="source-text">
                    المصدر: ${escapeHtml(a.source)}${a.hadithNumber ? ' — ' + escapeHtml(a.hadithNumber) : ''}
                    ${a.grading ? badge(a.grading, 'grading') : ''}
                    ${a.needsHumanReview ? badge('يحتاج تحققاً', 'review') : ''}
                </p>
                ${a.sourceUrl ? `<p class="source-text"><a href="${escapeHtml(a.sourceUrl)}" target="_blank" rel="noopener noreferrer">مرجع (يحتاج إنترنت)</a></p>` : ''}
                <button class="btn-speak mt-1" type="button" data-text="${escapeHtml(a.text)}">🔊 استماع</button>
            </div>`).join('');
        setupSpeech(adhkarContainer);
    };
    renderAdhkar();
    document.getElementById('search-adhkar').addEventListener('input', (e) => renderAdhkar(e.target.value));

    /* نسيت ماذا أفعل — يرجع فقط من المعرفة الموثقة محلياً */
    const forgotContainer = document.getElementById('forgot-list');
    const renderForgot = (query = '') => {
        const q = query.trim();
        const matches = forgotData.filter(f => f.q.includes(q) || f.a.includes(q));
        if (matches.length === 0) {
            forgotContainer.innerHTML = `<p class="empty-msg">${escapeHtml('لم أجد إجابة موثقة في قاعدة معلومات التطبيق. لا تعتمد على تخمين، واسأل أهل العلم.')}</p>`;
            return;
        }
        forgotContainer.innerHTML = matches.map(f => `
            <div class="info-card">
                <h3>❓ ${escapeHtml(f.q)}</h3>
                <p><strong>الجواب:</strong> ${escapeHtml(f.a)}</p>
                ${f.showDisagreement ? `<p class="khilaf">⚖️ المسألة فيها خلاف فقهي. ${escapeHtml(f.disagreementNote || '')}</p>` : ''}
                <p class="source-text">
                    المصدر: ${escapeHtml(f.source)}
                    ${f.grading ? badge(f.grading, 'grading') : ''}
                    ${f.needsHumanReview ? badge('يحتاج تحققاً', 'review') : ''}
                </p>
                ${f.sourceUrl ? `<p class="source-text"><a href="${escapeHtml(f.sourceUrl)}" target="_blank" rel="noopener noreferrer">مرجع (يحتاج إنترنت)</a></p>` : ''}
            </div>`).join('');
    };
    renderForgot();
    document.getElementById('search-forgot').addEventListener('input', (e) => renderForgot(e.target.value));

    /* محظورات الإحرام */
    const ihramContainer = document.getElementById('ihram-rules-list');
    if (ihramContainer) {
        ihramContainer.innerHTML = ihramRules.map(r => `
            <div class="info-card">
                <p>🚫 ${escapeHtml(r.text)}</p>
                <p class="source-text">${escapeHtml(r.source)} ${r.grading ? badge(r.grading, 'grading') : ''}</p>
            </div>`).join('');
    }

    /* قائمة التجهيزات — بناء آمن عبر DOM بدل innerHTML مع مدخلات المستخدم */
    const chkContainer = document.getElementById('checklist-container');
    const renderChecklist = () => {
        chkContainer.innerHTML = '';
        state.checklist.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'check-item';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!item.done;
            cb.setAttribute('aria-label', item.text);
            cb.addEventListener('change', () => {
                state.checklist[index].done = cb.checked;
                saveState();
                renderChecklist();
            });

            const span = document.createElement('span');
            span.textContent = item.text; // آمن ضد XSS
            if (item.done) span.classList.add('done');

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'btn-icon delete-check';
            del.setAttribute('aria-label', 'حذف العنصر');
            del.textContent = '❌';
            del.addEventListener('click', () => {
                state.checklist.splice(index, 1);
                saveState();
                renderChecklist();
            });

            row.appendChild(cb);
            row.appendChild(span);
            row.appendChild(del);
            chkContainer.appendChild(row);
        });
    };
    renderChecklist();

    const addItem = () => {
        const input = document.getElementById('new-check-item');
        const val = input.value.trim();
        if (val) {
            state.checklist.push({ text: val, done: false });
            saveState();
            renderChecklist();
            input.value = '';
            input.focus();
        }
    };
    document.getElementById('btn-add-check').addEventListener('click', addItem);
    document.getElementById('new-check-item').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addItem();
    });
}

/* ------------------------------- النطق (TTS محلي في المتصفح) ------------------------------- */
function setupSpeech(root) {
    const scope = root || document;
    const buttons = scope.querySelectorAll('.btn-speak');
    if ('speechSynthesis' in window) {
        buttons.forEach(btn => {
            btn.onclick = () => {
                window.speechSynthesis.cancel();
                const text = btn.getAttribute('data-text');
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ar-SA';
                utterance.rate = 0.85;
                window.speechSynthesis.speak(utterance);
            };
        });
    } else {
        buttons.forEach(btn => { btn.style.display = 'none'; });
    }
}

/* ------------------------------- نافذة "ماذا أفعل الآن؟" ------------------------------- */
function setupModal() {
    const modal = document.getElementById('modal-what-now');
    const btn = document.getElementById('btn-what-now');
    const closeBtn = modal.querySelector('.close-modal');

    const CONTENT = {
        'view-tawaf': {
            title: 'أنت في الطواف',
            dDo: 'استمر في المشي حول الكعبة واجعلها عن يسارك، وابدأ وتنتهي عند الحجر الأسود.',
            avoid: 'لا تزاحم، ولا ترفع صوتك بما يؤذي، ولا تعتقد وجود دعاء خاص بكل شوط.',
            dhikr: 'ادعُ بما شئت، وبين الركن اليماني والحجر الأسود: «ربنا آتنا في الدنيا حسنة...».',
            source: 'صحيح البخاري / سنن أبي داود'
        },
        'view-sai': {
            title: 'أنت في السعي',
            dDo: 'اتجه نحو الوجهة المكتوبة في العدّاد، والرمَل (الإسراع) للرجال بين العلمين الأخضرين.',
            avoid: 'الإسراع للنساء، وإيذاء الناس في الزحام.',
            dhikr: 'على الصفا والمروة: «لا إله إلا الله وحده لا شريك له...».',
            source: 'صحيح مسلم 1218'
        },
        'view-tahallul': {
            title: 'أنت في التحلل',
            dDo: 'احلق رأسك كله أو قصّره (للرجل)، والمرأة تقصّر قدر أنملة.',
            avoid: 'الأخذ من بعض الرأس دون بعض للرجل.',
            dhikr: 'الحمد لله الذي بنعمته تتم الصالحات.',
            source: 'القرآن (الفتح 27) / صحيح البخاري'
        },
        'default': {
            title: 'إرشاد عام',
            dDo: 'راجع شاشة «رافقني» لمعرفة خطوتك التالية بالترتيب.',
            avoid: 'التقدّم لمرحلة قبل إتمام ما قبلها دون داعٍ.',
            dhikr: 'أكثِر من التلبية والذكر.',
            source: '—'
        }
    };

    let lastFocused = null;

    const open = () => {
        const currentViewId = document.querySelector('.view.active')?.id;
        const c = CONTENT[currentViewId] || CONTENT['default'];
        document.getElementById('mw-title').textContent = c.title;
        document.getElementById('mw-do').querySelector('span').textContent = c.dDo;
        document.getElementById('mw-avoid').querySelector('span').textContent = c.avoid;
        document.getElementById('mw-dhikr').querySelector('span').textContent = c.dhikr;
        document.getElementById('mw-source').querySelector('span').textContent = c.source;
        lastFocused = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
    };

    const close = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        if (lastFocused) lastFocused.focus();
    };

    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    /* زر إتمام التحلل */
    const finishBtn = document.getElementById('btn-finish-umrah');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            advanceStage('UMRAH_COMPLETE');
            alert('تقبّل الله عمرتك 🤍');
            showView('view-dashboard');
        });
    }
}
