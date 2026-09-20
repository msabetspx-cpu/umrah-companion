'use strict';

/* =========================================================================
 * رفيق العمرة — مساعد شخصي يعمل دون إنترنت يرافقك خطوة بخطوة أثناء العمرة.
 *
 * مبادئ:
 *  - الدقة الشرعية أولاً: كل نص له مصدر ودرجة، ولا يُنسب حكم للتطبيق.
 *  - لا اختلاق دعاء ولا تخصيص شوط بدعاء بلا دليل.
 *  - يعمل Offline بالكامل (لا CDN/خطوط/APIs خارجية).
 *  - وضوح الاستخدام أثناء الزحام أهم من كثرة المعلومات.
 * ========================================================================= */

const VERIFIED_AT = '2026-09-20';

/* =========================================================================
 * 1) قاعدة المحتوى الشرعي (نموذج بيانات موحّد)
 * type: QURAN | HADITH | ATHAR | GENERAL_DUA | FIQH | GUIDANCE | OFFICIAL
 * grading يُعرض فقط للأحاديث/الآثار. audit: VERIFIED|NEEDS_REVIEW|FIQH_DISPUTE|GENERAL_DUA|OFFICIAL_GUIDANCE
 * ملاحظة: لم تُجرَ مطابقة نسخة-بنسخة مع المطبوع؛ يُنصح بمراجعة أهل العلم قبل الاعتماد النهائي.
 * ========================================================================= */
const religiousContent = [
    {
        id: 'talbiyah', title: 'التلبية', type: 'HADITH',
        arabicText: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لاَ شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لاَ شَرِيكَ لَكَ',
        sourceBook: 'صحيح البخاري، صحيح مسلم', hadithNumber: 'البخاري 1549 / مسلم 1184',
        grading: 'صحيح', sourceUrl: 'https://dorar.net/hadith/sharh/2233', verifiedAt: VERIFIED_AT,
        audit: 'VERIFIED', notes: 'يُستحب الإكثار منها من الإحرام حتى ابتداء الطواف.'
    },
    {
        id: 'takbir-hajar', title: 'التكبير عند محاذاة الحجر الأسود', type: 'HADITH',
        arabicText: 'اللَّهُ أَكْبَر',
        sourceBook: 'صحيح البخاري', hadithNumber: 'البخاري 1613',
        grading: 'صحيح', sourceUrl: 'https://dorar.net/hadith/sharh/3018', verifiedAt: VERIFIED_AT,
        audit: 'VERIFIED', notes: 'يُقال عند محاذاة الحجر الأسود في بداية كل شوط.'
    },
    {
        id: 'dua-two-corners', title: 'الدعاء بين الركن اليماني والحجر الأسود', type: 'HADITH',
        arabicText: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        sourceBook: 'سنن أبي داود', hadithNumber: 'أبو داود 1892',
        grading: 'حسن (حسّنه الألباني)', sourceUrl: 'https://dorar.net/hadith/sharh/4114', verifiedAt: VERIFIED_AT,
        audit: 'VERIFIED', notes: 'يُقال في هذا الموضع، وليس دعاءً مخصوصاً بشوطٍ بعينه.'
    },
    {
        id: 'dhikr-safa-marwa', title: 'الذكر على الصفا والمروة', type: 'HADITH',
        arabicText: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، لا إله إلا الله وحده، أنجز وعده، ونصر عبده، وهزم الأحزاب وحده',
        sourceBook: 'صحيح مسلم (حديث جابر الطويل في صفة الحج)', hadithNumber: 'مسلم 1218',
        grading: 'صحيح', sourceUrl: 'https://dorar.net/hadith/sharh/3105', verifiedAt: VERIFIED_AT,
        audit: 'VERIFIED', notes: 'يُقال على الصفا وعلى المروة، ثم يدعو بينها بما شاء.'
    },
    {
        id: 'shave-verse', title: 'الحلق والتقصير (دليل المشروعية)', type: 'QURAN',
        arabicText: 'لَتَدْخُلُنَّ الْمَسْجِدَ الْحَرَامَ إِنْ شَاءَ اللَّهُ آمِنِينَ مُحَلِّقِينَ رُءُوسَكُمْ وَمُقَصِّرِينَ',
        sourceBook: 'القرآن الكريم — سورة الفتح', hadithNumber: 'الفتح: 27',
        grading: 'قطعي الثبوت', sourceUrl: 'https://quran.com/48/27', verifiedAt: VERIFIED_AT,
        audit: 'VERIFIED', notes: 'الحلق للرجال أفضل من التقصير؛ ورد الدعاء للمحلقين في البخاري 1727.'
    }
];

/* الأدعية العامة الجائزة (ليست مخصوصة بموضع، ولا تُنسب لشوط) */
const generalDuas = [
    {
        id: 'gen-dua-1', title: 'دعاء عام جائز', type: 'GENERAL_DUA',
        arabicText: 'اللهم إني أسألك الجنة وأعوذ بك من النار',
        sourceBook: 'دعاء مشروع عام', audit: 'GENERAL_DUA', verifiedAt: VERIFIED_AT,
        notes: 'يجوز الدعاء بما شئت من خيري الدنيا والآخرة في الطواف والسعي.'
    }
];

/* محظورات الإحرام */
const ihramRules = [
    { id: 'ih-hair-nails', text: 'إزالة الشعر وتقليم الأظافر.', sourceBook: 'القرآن (البقرة 196) وأقوال أهل العلم', audit: 'VERIFIED', scope: 'للجميع' },
    { id: 'ih-perfume', text: 'التطيّب في البدن أو الثوب بعد عقد الإحرام.', sourceBook: 'الصحيحان', audit: 'VERIFIED', scope: 'للجميع' },
    { id: 'ih-sewn', text: 'لبس المخيط المُفصَّل على قدر البدن (كالقميص والسراويل).', sourceBook: 'الصحيحان (حديث ابن عمر)', audit: 'VERIFIED', scope: 'للرجال' },
    { id: 'ih-head', text: 'تغطية الرأس بملاصق (كالطاقية والعمامة).', sourceBook: 'أقوال أهل العلم', audit: 'VERIFIED', scope: 'للرجال' },
    { id: 'ih-niqab-gloves', text: 'لبس النقاب والقفازين.', sourceBook: 'صحيح البخاري (حديث ابن عمر)', audit: 'VERIFIED', scope: 'للمرأة' },
    { id: 'ih-marriage', text: 'عقد النكاح.', sourceBook: 'صحيح مسلم', audit: 'VERIFIED', scope: 'للجميع' },
    { id: 'ih-intimacy', text: 'الجماع ومقدماته، وهو أعظم المحظورات.', sourceBook: 'القرآن (البقرة 197)', audit: 'VERIFIED', scope: 'للجميع' },
    { id: 'ih-hunt', text: 'صيد البر.', sourceBook: 'القرآن (المائدة 95)', audit: 'VERIFIED', scope: 'للجميع' }
];

/* المصادر الرسمية/التنظيمية — قابلة للتغيير، تُعرض بتاريخ التحقق ولا تُخلط بالشرعي */
const officialSources = [
    {
        id: 'nusuk', title: 'منصة نسك (التصاريح والحجوزات)', url: 'https://www.nusuk.sa',
        note: 'الإجراءات والتصاريح والمواعيد قد تتغيّر. تحقّق من الجهة الرسمية قبل السفر.',
        verifiedAt: VERIFIED_AT
    }
];

/* =========================================================================
 * 2) قاعدة "أنا اتلخبطت" و"بحث في الأحكام" — كلها إجابات موثقة، لا يولّد التطبيق حكماً
 * ========================================================================= */
const rulingsData = [
    {
        id: 'r-count-doubt', q: 'مش فاكر أنا في الشوط الكام (طواف أو سعي)',
        keywords: 'نسيت عدد شك اشواط الشوط الطواف السعي كام',
        a: 'ابنِ على اليقين وهو الأقل. إذا شككت هل هو الشوط 3 أم 4 فاعتبره 3 وأكمل.',
        sourceBook: 'قاعدة: اليقين لا يزول بالشك — قول الجمهور', sourceUrl: 'https://islamqa.info/ar/answers/36855',
        audit: 'FIQH_DISPUTE', showDisagreement: true,
        disagreementNote: 'ذهب بعض العلماء إلى البناء على غلبة الظن. والبناء على اليقين (الأقل) هو الأحوط والمفتى به عند اللجنة الدائمة.',
        goto: null, verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-started-tawaf', q: 'مش فاكر بدأت الطواف ولا لأ',
        keywords: 'مش فاكر بدأت الطواف بداية',
        a: 'إن غلب على ظنك أنك لم تبدأ فابدأ من جديد من الحجر الأسود. وإن ترجّح أنك بدأت لكن شككت في العدد فابنِ على الأقل المتيقَّن.',
        sourceBook: 'قاعدة اليقين لا يزول بالشك', sourceUrl: 'https://islamqa.info/ar/answers/36855',
        audit: 'FIQH_DISPUTE', showDisagreement: false, goto: 'view-tawaf', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-sai-count', q: 'مش فاكر عدد أشواط السعي',
        keywords: 'نسيت عدد اشواط السعي كام',
        a: 'ابنِ على اليقين وهو الأقل، وأكمل حتى تُتِمّ سبعة أشواط (من الصفا إلى المروة شوط، والعكس شوط).',
        sourceBook: 'قاعدة اليقين لا يزول بالشك', sourceUrl: 'https://islamqa.info/ar/answers/36855',
        audit: 'FIQH_DISPUTE', showDisagreement: false, goto: 'view-sai', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-wudu-tawaf', q: 'وضوئي انتقض أثناء الطواف',
        keywords: 'وضوء انتقض الطواف طهارة حدث',
        a: 'الأحوط أن تخرج وتتوضأ ثم تعود وتكمل من حيث توقفت.',
        sourceBook: 'مسألة خلافية — والأحوط تجديد الوضوء', sourceUrl: 'https://islamqa.info/ar/answers/34695',
        audit: 'FIQH_DISPUTE', showDisagreement: true,
        disagreementNote: 'الجمهور على اشتراط الطهارة للطواف، ورجّح شيخ الإسلام ابن تيمية عدم اشتراطها. التطبيق يذكر الأحوط خروجاً من الخلاف، والأمر يحتمل قولين.',
        goto: null, verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-wudu-sai', q: 'وضوئي انتقض أثناء السعي',
        keywords: 'وضوء انتقض السعي طهارة حدث',
        a: 'استمر في السعي؛ فالطهارة ليست شرطاً للسعي عند عامة أهل العلم، وإنما هي مستحبة.',
        sourceBook: 'قول عامة أهل العلم', sourceUrl: 'https://islamqa.info/ar/answers/33845',
        audit: 'VERIFIED', showDisagreement: false, goto: null, verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-tired-tawaf', q: 'تعبت أثناء الطواف',
        keywords: 'تعب ارهاق راحة الطواف زحام استريح',
        a: 'يجوز أن تستريح ثم تُكمِل من حيث توقفت؛ لا يلزم استئناف الطواف من أوله بسبب الراحة اليسيرة. استخدم زر «إيقاف (راحة)» في العدّاد ليُحفظ عددك.',
        sourceBook: 'إرشاد عملي — والعدد محفوظ في التطبيق', audit: 'GUIDANCE', showDisagreement: false, goto: 'view-tawaf', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-tired-sai', q: 'تعبت أثناء السعي',
        keywords: 'تعب ارهاق راحة السعي استريح',
        a: 'يجوز أن تستريح ثم تُكمِل السعي من حيث توقفت. عددك محفوظ في التطبيق.',
        sourceBook: 'إرشاد عملي', audit: 'GUIDANCE', showDisagreement: false, goto: 'view-sai', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-at-hajar', q: 'وصلت للحجر الأسود ومش عارف أعمل إيه',
        keywords: 'الحجر الاسود استلام تقبيل بداية شوط',
        a: 'حاذِ الحجر الأسود وقل «الله أكبر». إن تيسّر استلامه أو تقبيله دون مزاحمة أو أذى فحسن، وإلا فالإشارة إليه باليد مع التكبير تكفي، ثم ابدأ الشوط.',
        sourceBook: 'صحيح البخاري 1613', sourceUrl: 'https://dorar.net/hadith/sharh/3018', audit: 'VERIFIED', showDisagreement: false, goto: 'view-tawaf', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-at-safa', q: 'وصلت للصفا ومش عارف أعمل إيه',
        keywords: 'الصفا بداية السعي قبلة تكبير',
        a: 'اصعد على الصفا (أو قف عنده)، استقبل القبلة وكبّر واحمد الله، وادعُ بما شئت، ثم انزل متجهاً إلى المروة. ومما ورد ذكر التوحيد المذكور في شاشة السعي.',
        sourceBook: 'صحيح مسلم 1218', sourceUrl: 'https://dorar.net/hadith/sharh/3105', audit: 'VERIFIED', showDisagreement: false, goto: 'view-sai', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-done-tawaf', q: 'خلصت الطواف',
        keywords: 'خلصت انهيت الطواف بعد ركعتين مقام زمزم',
        a: 'صلِّ ركعتين خلف مقام إبراهيم إن تيسّر (وإلا ففي أي مكان من المسجد)، ثم اشرب من ماء زمزم، ثم توجّه للسعي.',
        sourceBook: 'القرآن (البقرة 125) وصحيح مسلم 1218', sourceUrl: 'https://dorar.net/hadith/sharh/3105', audit: 'VERIFIED', showDisagreement: false, goto: 'view-sai', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-done-sai', q: 'خلصت السعي',
        keywords: 'خلصت انهيت السعي بعد تحلل حلق تقصير',
        a: 'تبقّى التحلل: الرجل يحلق (أفضل) أو يقصّر من جميع الرأس، والمرأة تقصّر قدر أنملة من أطراف شعرها.',
        sourceBook: 'القرآن (الفتح 27)', sourceUrl: 'https://quran.com/48/27', audit: 'VERIFIED', showDisagreement: false, goto: 'view-tahallul', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-tahallul', q: 'مش عارف أتحلل',
        keywords: 'تحلل حلق تقصير المراة انملة',
        a: 'الرجل: يحلق رأسه كله (أفضل) أو يقصّر من جميع الرأس. المرأة: تجمع شعرها وتقصّ قدر أنملة (نحو سنتيمتر) من الأطراف. ومقدار المرأة مأخوذ من قول ابن عمر، وفيه سعة عند أهل العلم.',
        sourceBook: 'الفتح 27؛ وأثر ابن عمر في مقدار المرأة',
        audit: 'FIQH_DISPUTE', showDisagreement: true,
        disagreementNote: 'اختلف الفقهاء في القدر المجزئ لتقصير المرأة (من جميع الشعر عند المالكية والحنابلة، ويجزئ الأقل عند غيرهم). التفاصيل قد تختلف باختلاف الحال والقول الفقهي، فاسأل جهة إفتاء موثوقة.',
        goto: 'view-tahallul', verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-ihram-violation', q: 'حصل مني شيء وأنا مُحرِم',
        keywords: 'محظور فديه حلق طيب لبس جماع خطا نسيان',
        a: 'من فعل محظوراً ناسياً أو جاهلاً فلا شيء عليه غالباً. أما المتعمّد فقد تلزمه فدية تختلف باختلاف المحظور. وأما الجماع فله حكم خاص وأثر كبير على النسك.',
        sourceBook: 'مسألة تفصيلية تحتاج فتوى',
        audit: 'NEEDS_REVIEW', showDisagreement: true,
        disagreementNote: 'أحكام الفدية تفصيلية وتختلف باختلاف المحظور والحال. هذه الحالة تحتاج سؤال جهة إفتاء موثوقة قبل الحكم.',
        goto: null, verifiedAt: VERIFIED_AT
    },
    {
        id: 'r-special', q: 'عندي حالة خاصة (لم أجدها هنا)',
        keywords: 'حالة خاصة اخرى مختلفة',
        a: null,
        sourceBook: null, audit: 'NEEDS_REVIEW', showDisagreement: false, goto: null, verifiedAt: VERIFIED_AT
    }
];

/* =========================================================================
 * 3) مراحل الرحلة (آلة الحالة) — التنقل للخلف مسموح دائماً
 * ========================================================================= */
const STAGES = [
    { key: 'PREPARATION', label: 'الاستعداد', now: 'اغتسل وتنظّف واستعدّ قبل الوصول إلى الميقات.', details: 'يُستحب الاغتسال والتنظّف قبل الإحرام، ويجوز التطيّب في البدن قبل عقد النية.' },
    { key: 'MIQAT', label: 'الميقات', now: 'عند وصولك الميقات استعدّ لعقد الإحرام والنية.', details: 'الميقات هو المكان الذي يُحرم منه، ولا يُتجاوز بغير إحرام لمن أراد النسك.' },
    { key: 'IHRAM', label: 'الإحرام والنية', now: 'البس ملابس الإحرام، وانوِ العمرة بقلبك وقل: «لبيك اللهم عمرة».', details: 'تبدأ محظورات الإحرام من الآن.', action: { label: '🚫 محظورات الإحرام', view: 'view-ihram-rules' } },
    { key: 'TALBIYAH', label: 'التلبية', now: 'أكثِر من التلبية حتى تبدأ الطواف.', refs: ['talbiyah'] },
    { key: 'ARRIVAL', label: 'الوصول للمسجد الحرام', now: 'ادخل المسجد بقدمك اليمنى، وتوجّه للكعبة لبدء الطواف.', details: 'يُستحب الدخول بالرِّجل اليمنى.' },
    { key: 'TAWAF', label: 'الطواف', now: 'طُف بالكعبة سبعة أشواط، تبدأ من الحجر الأسود وتجعل الكعبة عن يسارك.', action: { label: '🔄 افتح عدّاد الطواف', view: 'view-tawaf' }, isTawaf: true },
    { key: 'TAWAF_COMPLETE', label: 'بعد الطواف', now: 'صلِّ ركعتين خلف مقام إبراهيم إن تيسّر، ثم اشرب من زمزم.' },
    { key: 'SAI', label: 'السعي', now: 'اسعَ بين الصفا والمروة سبعة أشواط، تبدأ من الصفا.', action: { label: '↔️ افتح عدّاد السعي', view: 'view-sai' }, isSai: true },
    { key: 'SAI_COMPLETE', label: 'بعد السعي', now: 'أتممت السعي. تبقّى التحلل بالحلق أو التقصير.' },
    { key: 'HALQ_OR_TAQSIR', label: 'الحلق أو التقصير', now: 'الرجل يحلق (أفضل) أو يقصّر من جميع الرأس، والمرأة تقصّر قدر أنملة من الأطراف.', action: { label: '✂️ تفاصيل التحلل', view: 'view-tahallul' } },
    { key: 'UMRAH_COMPLETE', label: 'تمّت مناسك العمرة', now: 'انتهت مناسك العمرة. نسأل الله أن يتقبّل منك.' }
];
const stageIndex = (key) => STAGES.findIndex(s => s.key === key);

/* =========================================================================
 * 4) الحالة والحفظ
 * ========================================================================= */
const DEFAULT_STATE = {
    schema: 3,
    stage: 'PREPARATION',
    completedTawaf: 0,   // 0..7
    completedSai: 0,     // 0..7
    checklist: [
        { section: 'المستندات', text: 'جواز السفر والتأشيرة', done: false },
        { section: 'المستندات', text: 'تصاريح العمرة (نسك)', done: false },
        { section: 'المستندات', text: 'بطاقة الهوية', done: false },
        { section: 'الإحرام', text: 'ملابس الإحرام (للرجال)', done: false },
        { section: 'الإحرام', text: 'حزام/مشبك للإحرام', done: false },
        { section: 'الملابس', text: 'ملابس مريحة وخفيفة', done: false },
        { section: 'الملابس', text: 'حذاء/شبشب مريح', done: false },
        { section: 'الإلكترونيات', text: 'الشاحن وبنك الطاقة', done: false },
        { section: 'الأدوية الشخصية', text: 'الأدوية المعتادة', done: false },
        { section: 'أشياء الرحلة', text: 'مظلة صغيرة وزجاجة ماء', done: false }
    ],
    trip: { hotel: '', room: '', supervisor: '', group: '', flight: '', notes: '' },
    settings: { crowd: false }
};
const CHECK_SECTIONS = ['المستندات', 'الملابس', 'الإحرام', 'الإلكترونيات', 'الأدوية الشخصية', 'أشياء الرحلة'];

let state = clone(DEFAULT_STATE);

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* تطبيع عربي للبحث فقط (لا يغيّر النص الأصلي) */
function normalizeAr(s) {
    return String(s)
        .replace(/[ً-ْٰ]/g, '')      // تشكيل
        .replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
        .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ـ/g, '')
        .toLowerCase().trim();
}

function loadState() {
    try {
        const saved = localStorage.getItem('umrahState');
        if (saved) {
            const p = JSON.parse(saved);
            state = Object.assign(clone(DEFAULT_STATE), p);
            // ترحيل من الإصدار القديم (كان يستخدم tawafCount/saiCount كأشواط مكتملة)
            if (typeof p.tawafCount === 'number' && typeof p.completedTawaf !== 'number') state.completedTawaf = p.tawafCount;
            if (typeof p.saiCount === 'number' && typeof p.completedSai !== 'number') state.completedSai = p.saiCount;
            state.completedTawaf = clampCount(state.completedTawaf);
            state.completedSai = clampCount(state.completedSai);
            if (stageIndex(state.stage) < 0) state.stage = 'PREPARATION';
            if (!Array.isArray(state.checklist)) state.checklist = clone(DEFAULT_STATE.checklist);
            if (!state.trip || typeof state.trip !== 'object') state.trip = clone(DEFAULT_STATE.trip);
            if (!state.settings || typeof state.settings !== 'object') state.settings = clone(DEFAULT_STATE.settings);
        }
    } catch (e) {
        console.warn('تعذّر قراءة الحالة المحفوظة؛ ستُستخدم القيم الافتراضية.', e);
        state = clone(DEFAULT_STATE);
        saveState(); // إصلاح ذاتي: استبدال التخزين التالف بحالة نظيفة
    }
}
function saveState() {
    try { localStorage.setItem('umrahState', JSON.stringify(state)); }
    catch (e) { console.warn('تعذّر الحفظ (قد تكون المساحة ممتلئة).', e); }
}
function clampCount(n) { n = parseInt(n, 10); if (isNaN(n) || n < 0) return 0; return n > 7 ? 7 : n; }

const ORDINALS = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'];

/* =========================================================================
 * 5) التهيئة
 * ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    registerServiceWorker();
    applyTheme(getStoredTheme());
    applyCrowd(state.settings.crowd);
    setupNavigation();
    setupHeaderButtons();
    setupCompanion();
    setupTawaf();
    setupSai();
    setupConfused();
    setupLists();
    setupTrip();
    setupModal();
    renderIhramRules();
    renderSources();
    renderTahallul();
    updateTawafUI();
    updateSaiUI();
    updateDashboard();
    updateCompanion();
});

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => console.warn('فشل تسجيل عامل الخدمة:', err));
        });
    }
}

/* =========================================================================
 * 6) التنقل + الهيدر (وضع ليلي + وضع زحام)
 * ========================================================================= */
function showView(id) {
    const target = document.getElementById(id);
    if (!target) return;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    target.classList.add('active');
    document.querySelectorAll('.bottom-nav .nav-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.target === id));
    window.scrollTo(0, 0);
    if (id === 'view-dashboard') updateDashboard();
    if (id === 'view-companion') updateCompanion();
}
function setupNavigation() {
    document.querySelectorAll('[data-target]').forEach(btn => {
        btn.addEventListener('click', (e) => showView(e.currentTarget.dataset.target));
    });
}
function getStoredTheme() { try { return localStorage.getItem('theme') === 'dark'; } catch (e) { return false; } }
function applyTheme(dark) {
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    const b = document.getElementById('btn-theme'); if (b) b.textContent = dark ? '☀️' : '🌙';
}
function applyCrowd(on) {
    document.body.classList.toggle('crowd-mode', !!on);
    const b = document.getElementById('btn-crowd');
    if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
}
function setupHeaderButtons() {
    document.getElementById('btn-theme').addEventListener('click', () => {
        const dark = document.body.getAttribute('data-theme') !== 'dark';
        applyTheme(dark);
        try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
    });
    document.getElementById('btn-crowd').addEventListener('click', () => {
        state.settings.crowd = !state.settings.crowd;
        applyCrowd(state.settings.crowd);
        saveState();
    });
}

/* =========================================================================
 * 7) آلة الحالة (لطيفة): تتقدّم للأمام فقط تلقائياً، والتصفّح للخلف حر
 * ========================================================================= */
function advanceStage(to) {
    if (stageIndex(to) > stageIndex(state.stage)) { state.stage = to; saveState(); }
    updateDashboard();
}
function currentStageObj() { return STAGES[stageIndex(state.stage)] || STAGES[0]; }

function stageStatusText() {
    const s = currentStageObj();
    if (s.key === 'TAWAF') return `الطواف — الشوط ${Math.min(state.completedTawaf + 1, 7)} من 7`;
    if (s.key === 'SAI') return `السعي — الشوط ${Math.min(state.completedSai + 1, 7)} من 7`;
    return s.label;
}
function updateDashboard() {
    const el = document.getElementById('current-stage');
    if (el) el.textContent = stageStatusText();
}

/* =========================================================================
 * 8) وضع "رافقني" — مدفوع بالمراحل
 * ========================================================================= */
let compViewIndex = 0;
function setupCompanion() {
    document.getElementById('comp-prev').addEventListener('click', () => { if (compViewIndex > 0) { compViewIndex--; renderCompanion(); } });
    document.getElementById('comp-next').addEventListener('click', () => {
        if (compViewIndex < STAGES.length - 1) {
            compViewIndex++;
            // التقدّم اللطيف: مزامنة المرحلة مع ما يتصفّحه المستخدم للأمام
            advanceStage(STAGES[compViewIndex].key);
            renderCompanion();
        }
    });
    // شريط المراحل
    const track = document.getElementById('stage-track');
    track.innerHTML = STAGES.map((s, i) => `<span class="stage-dot" data-i="${i}" title="${escapeHtml(s.label)}"></span>`).join('');
}
function updateCompanion() { compViewIndex = stageIndex(state.stage); renderCompanion(); }
function renderCompanion() {
    const s = STAGES[compViewIndex];
    const content = document.getElementById('companion-content');
    let refsHtml = '';
    if (s.refs) {
        refsHtml = s.refs.map(id => {
            const r = religiousContent.find(x => x.id === id);
            return r ? `<div class="dhikr-inline"><p class="arabic-text">${escapeHtml(r.arabicText)}</p><p class="source-text">${escapeHtml(r.sourceBook)} — ${escapeHtml(r.hadithNumber || '')} ${gradingBadge(r)}</p></div>` : '';
        }).join('');
    }
    let extra = '';
    if (s.isTawaf) extra = `<p class="now-sub">الشوط الحالي: ${Math.min(state.completedTawaf + 1, 7)} من 7</p>`;
    if (s.isSai) extra = `<p class="now-sub">الشوط الحالي: ${Math.min(state.completedSai + 1, 7)} من 7</p>`;

    content.innerHTML = `
        <div class="info-card companion-card">
            <p class="comp-step">الخطوة ${compViewIndex + 1} من ${STAGES.length}</p>
            <h3>${escapeHtml(s.label)}</h3>
            <p class="now-text"><strong>الآن:</strong> ${escapeHtml(s.now)}</p>
            ${extra}
            ${refsHtml}
            ${s.details ? `<details class="crowd-hide"><summary>تفاصيل</summary><p>${escapeHtml(s.details)}</p></details>` : ''}
            ${s.action ? `<button class="btn-primary mt-1" type="button" data-goto="${s.action.view}">${escapeHtml(s.action.label)}</button>` : ''}
        </div>`;
    const gotoBtn = content.querySelector('[data-goto]');
    if (gotoBtn) gotoBtn.addEventListener('click', () => showView(gotoBtn.dataset.goto));

    document.getElementById('comp-prev').disabled = (compViewIndex === 0);
    document.getElementById('comp-next').disabled = (compViewIndex === STAGES.length - 1);
    document.querySelectorAll('#stage-track .stage-dot').forEach((d, i) => {
        d.classList.toggle('done', i < compViewIndex);
        d.classList.toggle('active', i === compViewIndex);
    });
}

/* =========================================================================
 * 9) العدّادات (طواف + سعي) — عرض بالشوط الحالي، ونقاط تقدّم، وحفظ فوري
 * ========================================================================= */
function makeTapGuard(delay = 250) { let last = 0; return () => { const n = Date.now(); if (n - last < delay) return false; last = n; return true; }; }

function renderDots(containerId, completed) {
    const c = document.getElementById(containerId);
    if (!c) return;
    let html = '';
    for (let i = 0; i < 7; i++) {
        const cls = i < completed ? 'dot done' : (i === completed ? 'dot active' : 'dot');
        html += `<span class="${cls}"></span>`;
    }
    c.innerHTML = html;
}

function setupTawaf() {
    const guard = makeTapGuard();
    document.getElementById('tawaf-plus').addEventListener('click', () => {
        if (!guard()) return;
        if (state.completedTawaf < 7) {
            state.completedTawaf++; saveState(); updateTawafUI();
            if (state.completedTawaf === 7) {
                advanceStage('TAWAF_COMPLETE');
                alert('أتممت 7 أشواط. صلِّ ركعتين خلف المقام إن تيسّر ثم اشرب من زمزم، ثم توجّه للسعي.');
                showView('view-sai');
            }
        }
    });
    document.getElementById('tawaf-minus').addEventListener('click', () => {
        if (state.completedTawaf > 0) { state.completedTawaf--; saveState(); updateTawafUI(); }
    });
    document.getElementById('tawaf-pause').addEventListener('click', () => {
        // "إيقاف للراحة": العدد محفوظ تلقائياً، نعود للرئيسية
        saveState(); showView('view-dashboard');
    });
    document.getElementById('tawaf-reset').addEventListener('click', () => {
        if (confirm('هل تريد إعادة عدّاد الطواف إلى الصفر؟')) { state.completedTawaf = 0; saveState(); updateTawafUI(); }
    });
}
function updateTawafUI() {
    const cur = Math.min(state.completedTawaf + 1, 7);
    const done = state.completedTawaf >= 7;
    document.getElementById('tawaf-big').textContent = done ? '7 / 7' : `${cur} / 7`;
    document.getElementById('tawaf-ordinal').textContent = done ? 'اكتمل الطواف (7 أشواط)' : `الشوط ${ORDINALS[cur]}`;
    renderDots('tawaf-dots', state.completedTawaf);
}

function setupSai() {
    const guard = makeTapGuard();
    document.getElementById('sai-plus').addEventListener('click', () => {
        if (!guard()) return;
        if (state.completedSai < 7) {
            state.completedSai++; saveState(); updateSaiUI();
            if (state.completedSai === 7) {
                advanceStage('SAI_COMPLETE');
                alert('أتممت السعي. تبقّى التحلل بالحلق أو التقصير.');
                showView('view-tahallul');
            }
        }
    });
    document.getElementById('sai-minus').addEventListener('click', () => {
        if (state.completedSai > 0) { state.completedSai--; saveState(); updateSaiUI(); }
    });
    document.getElementById('sai-pause').addEventListener('click', () => { saveState(); showView('view-dashboard'); });
    document.getElementById('sai-reset').addEventListener('click', () => {
        if (confirm('هل تريد إعادة عدّاد السعي إلى الصفر؟')) { state.completedSai = 0; saveState(); updateSaiUI(); }
    });
}
function updateSaiUI() {
    const done = state.completedSai >= 7;
    const cur = Math.min(state.completedSai + 1, 7);
    document.getElementById('sai-big').textContent = done ? '7 / 7' : `${cur} / 7`;
    const dir = document.getElementById('sai-direction');
    if (done) dir.textContent = 'اكتمل السعي (7 أشواط)';
    else dir.textContent = (cur % 2 !== 0) ? 'الصفا ➔ المروة' : 'المروة ➔ الصفا';
    renderDots('sai-dots', state.completedSai);
}

/* =========================================================================
 * 10) "أنا اتلخبطت"
 * ========================================================================= */
function setupConfused() {
    const list = document.getElementById('confused-list');
    list.innerHTML = rulingsData.map(r => `<button class="confused-btn" type="button" data-id="${escapeHtml(r.id)}">${escapeHtml(r.q)}</button>`).join('');
    const answer = document.getElementById('confused-answer');
    list.querySelectorAll('.confused-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = rulingsData.find(x => x.id === btn.dataset.id);
            answer.innerHTML = renderRulingCard(r);
            const g = answer.querySelector('[data-goto]');
            if (g) g.addEventListener('click', () => showView(g.dataset.goto));
            answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });
}
function renderRulingCard(r) {
    if (!r || !r.a) {
        return `<div class="info-card warn-card">
            <p>لم أجد في قاعدة المعلومات الموثقة إجابة كافية لهذه الحالة.</p>
            <p><strong>هذه الحالة قد تحتاج سؤال شيخ أو جهة إفتاء موثوقة.</strong></p>
        </div>`;
    }
    return `<div class="info-card">
        <h3>❓ ${escapeHtml(r.q)}</h3>
        <p><strong>الجواب:</strong> ${escapeHtml(r.a)}</p>
        ${r.showDisagreement ? `<p class="khilaf">⚖️ المسألة فيها خلاف فقهي. ${escapeHtml(r.disagreementNote || '')}</p>` : ''}
        <p class="source-text">المصدر: ${escapeHtml(r.sourceBook || '—')} ${auditBadge(r.audit)}</p>
        ${r.sourceUrl ? `<p class="source-text"><a href="${escapeHtml(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">مرجع (يحتاج إنترنت)</a></p>` : ''}
        ${r.goto ? `<button class="btn-primary mt-1" type="button" data-goto="${escapeHtml(r.goto)}">اذهب للشاشة المناسبة</button>` : ''}
        <p class="disclaimer">التطبيق ينقل من مصادر موثوقة ولا يُصدر فتوى.</p>
    </div>`;
}

/* =========================================================================
 * 11) القوائم: أذكار / بحث أحكام / محظورات / checklist / مصادر
 * ========================================================================= */
function gradingBadge(item) {
    if (!item) return '';
    if ((item.type === 'HADITH' || item.type === 'ATHAR') && item.grading) return badge(item.grading, 'grading');
    if (item.type === 'QURAN') return badge('قطعي الثبوت', 'grading');
    return '';
}
function auditBadge(audit) {
    switch (audit) {
        case 'NEEDS_REVIEW': return badge('يحتاج مراجعة', 'review');
        case 'FIQH_DISPUTE': return badge('مسألة خلافية', 'khilaf-badge');
        case 'GENERAL_DUA': return badge('دعاء عام', 'general');
        case 'GUIDANCE': return badge('إرشاد', 'general');
        case 'OFFICIAL_GUIDANCE': return badge('إجراء رسمي', 'general');
        default: return '';
    }
}
function badge(t, cls) { return `<span class="badge ${cls}">${escapeHtml(t)}</span>`; }

function setupLists() {
    // الأذكار
    const adhkarContainer = document.getElementById('adhkar-list');
    const adhkarAll = religiousContent.concat(generalDuas).filter(a => a.arabicText);
    const renderAdhkar = (q = '') => {
        const nq = normalizeAr(q);
        const matches = adhkarAll.filter(a => normalizeAr(a.title).includes(nq) || normalizeAr(a.arabicText).includes(nq));
        if (!matches.length) { adhkarContainer.innerHTML = emptyMsg('لا توجد نتائج مطابقة.'); return; }
        adhkarContainer.innerHTML = matches.map(a => `
            <div class="info-card">
                <h3>${escapeHtml(a.title)}</h3>
                <p class="arabic-text">${escapeHtml(a.arabicText)}</p>
                <p class="source-text">
                    ${a.sourceBook ? 'المصدر: ' + escapeHtml(a.sourceBook) : ''}${a.hadithNumber ? ' — ' + escapeHtml(a.hadithNumber) : ''}
                    ${gradingBadge(a)} ${a.audit === 'GENERAL_DUA' ? auditBadge('GENERAL_DUA') : ''} ${a.audit === 'NEEDS_REVIEW' ? auditBadge('NEEDS_REVIEW') : ''}
                </p>
                ${a.notes ? `<p class="notes">${escapeHtml(a.notes)}</p>` : ''}
                ${a.sourceUrl ? `<p class="source-text"><a href="${escapeHtml(a.sourceUrl)}" target="_blank" rel="noopener noreferrer">مرجع (يحتاج إنترنت)</a></p>` : ''}
            </div>`).join('');
    };
    renderAdhkar();
    document.getElementById('search-adhkar').addEventListener('input', e => renderAdhkar(e.target.value));

    // بحث الأحكام
    const forgotContainer = document.getElementById('forgot-list');
    const renderForgot = (q = '') => {
        const nq = normalizeAr(q);
        const matches = rulingsData.filter(f => f.a && (
            normalizeAr(f.q).includes(nq) || normalizeAr(f.a).includes(nq) || normalizeAr(f.keywords || '').includes(nq)));
        if (!matches.length) {
            forgotContainer.innerHTML = `<div class="info-card warn-card"><p>لم أجد في قاعدة المعلومات الموثقة إجابة كافية لهذه الحالة.</p><p><strong>قد تحتاج سؤال جهة إفتاء موثوقة.</strong></p></div>`;
            return;
        }
        forgotContainer.innerHTML = matches.map(renderRulingCard).join('');
        forgotContainer.querySelectorAll('[data-goto]').forEach(g => g.addEventListener('click', () => showView(g.dataset.goto)));
    };
    renderForgot();
    document.getElementById('search-forgot').addEventListener('input', e => renderForgot(e.target.value));

    // checklist
    setupChecklist();
}

function emptyMsg(t) { return `<p class="empty-msg">${escapeHtml(t)}</p>`; }

function renderIhramRules() {
    const c = document.getElementById('ihram-rules-list');
    c.innerHTML = ihramRules.map(r => `
        <div class="info-card">
            <p>🚫 ${escapeHtml(r.text)} <span class="scope-badge">${escapeHtml(r.scope)}</span></p>
            <p class="source-text">${escapeHtml(r.sourceBook)} ${auditBadge(r.audit)}</p>
        </div>`).join('');
}

function renderSources() {
    const rel = document.getElementById('sources-religious');
    rel.innerHTML = religiousContent.map(a => `
        <div class="info-card">
            <h3>${escapeHtml(a.title)}</h3>
            <p class="source-text">
                ${escapeHtml(a.sourceBook)}${a.hadithNumber ? ' — ' + escapeHtml(a.hadithNumber) : ''} ${gradingBadge(a)}
            </p>
            <p class="source-text">تاريخ التحقق: ${escapeHtml(a.verifiedAt)}</p>
            ${a.sourceUrl ? `<p class="source-text"><a href="${escapeHtml(a.sourceUrl)}" target="_blank" rel="noopener noreferrer">فتح المرجع (يحتاج إنترنت)</a></p>` : ''}
        </div>`).join('');
    const off = document.getElementById('sources-official');
    off.innerHTML = officialSources.map(o => `
        <div class="info-card warn-card">
            <h3>${escapeHtml(o.title)}</h3>
            <p>${escapeHtml(o.note)}</p>
            <p class="source-text">آخر تحقق: ${escapeHtml(o.verifiedAt)}</p>
            <p class="source-text"><a href="${escapeHtml(o.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(o.url)} (يحتاج إنترنت)</a></p>
        </div>`).join('');
}

function renderTahallul() {
    const c = document.getElementById('tahallul-content');
    c.innerHTML = `
        <div class="info-card">
            <h3>للرجل</h3>
            <p>الحلق (أفضل) أو التقصير من جميع شعر الرأس.</p>
            <p class="source-text">القرآن (الفتح 27)، وورد الدعاء للمحلقين في صحيح البخاري 1727 ${badge('صحيح','grading')}</p>
        </div>
        <div class="info-card">
            <h3>للمرأة</h3>
            <p>تجمع شعرها وتقصّ قدر أنملة (نحو سنتيمتر) من الأطراف.</p>
            <p class="khilaf">⚖️ مقدار المرأة مأخوذ من قول ابن عمر، واختلف الفقهاء في القدر المجزئ. هذه المسألة قد تختلف باختلاف الحال والقول الفقهي، فاسأل جهة إفتاء موثوقة.</p>
            <p class="source-text">${auditBadge('FIQH_DISPUTE')}</p>
        </div>
        <div class="info-card">
            <p>بإتمام التحلل تنتهي مناسك العمرة. نسأل الله أن يتقبّل منك.</p>
            <button id="btn-finish-umrah" class="btn-giant mt-1" type="button">تم التحلل ✓</button>
        </div>`;
    const fin = document.getElementById('btn-finish-umrah');
    if (fin) fin.addEventListener('click', () => { advanceStage('UMRAH_COMPLETE'); showView('view-dashboard'); });
}

/* =========================================================================
 * 12) Checklist (أقسام) — بناء آمن عبر DOM
 * ========================================================================= */
function setupChecklist() {
    const sel = document.getElementById('new-check-section');
    sel.innerHTML = CHECK_SECTIONS.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    const container = document.getElementById('checklist-container');

    const render = () => {
        container.innerHTML = '';
        CHECK_SECTIONS.forEach(section => {
            const items = state.checklist.map((it, idx) => ({ it, idx })).filter(x => x.it.section === section);
            if (!items.length) return;
            const h = document.createElement('h3'); h.className = 'section-title'; h.textContent = section;
            container.appendChild(h);
            items.forEach(({ it, idx }) => {
                const row = document.createElement('div'); row.className = 'check-item';
                const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!it.done; cb.setAttribute('aria-label', it.text);
                cb.addEventListener('change', () => { state.checklist[idx].done = cb.checked; saveState(); render(); });
                const span = document.createElement('span'); span.textContent = it.text; if (it.done) span.classList.add('done');
                const del = document.createElement('button'); del.type = 'button'; del.className = 'btn-icon delete-check'; del.setAttribute('aria-label', 'حذف'); del.textContent = '✕';
                del.addEventListener('click', () => { state.checklist.splice(idx, 1); saveState(); render(); });
                row.append(cb, span, del); container.appendChild(row);
            });
        });
        if (!state.checklist.length) container.innerHTML = emptyMsg('القائمة فارغة. أضف عناصرك.');
    };
    render();

    const addItem = () => {
        const input = document.getElementById('new-check-item');
        const val = input.value.trim();
        if (val) {
            state.checklist.push({ section: sel.value || CHECK_SECTIONS[0], text: val, done: false });
            saveState(); render(); input.value = ''; input.focus();
        }
    };
    document.getElementById('btn-add-check').addEventListener('click', addItem);
    document.getElementById('new-check-item').addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
}

/* =========================================================================
 * 13) معلومات رحلتي (محلية فقط)
 * ========================================================================= */
function setupTrip() {
    const fields = [
        ['hotel', 'اسم الفندق'], ['room', 'رقم الغرفة'], ['supervisor', 'رقم المشرف'],
        ['group', 'رقم المجموعة'], ['flight', 'رقم الرحلة'], ['notes', 'ملاحظات']
    ];
    const form = document.getElementById('trip-form');
    form.innerHTML = fields.map(([k, label]) => `
        <label class="trip-field">
            <span>${escapeHtml(label)}</span>
            ${k === 'notes'
            ? `<textarea id="trip-${k}" rows="3"></textarea>`
            : `<input type="text" id="trip-${k}" autocomplete="off">`}
        </label>`).join('');
    fields.forEach(([k]) => { const el = document.getElementById('trip-' + k); if (el) el.value = state.trip[k] || ''; });

    document.getElementById('btn-save-trip').addEventListener('click', () => {
        fields.forEach(([k]) => { const el = document.getElementById('trip-' + k); if (el) state.trip[k] = el.value; });
        saveState();
        const hint = document.getElementById('trip-saved');
        hint.textContent = '✓ تم الحفظ على جهازك';
        setTimeout(() => { hint.textContent = ''; }, 2500);
    });
}

/* =========================================================================
 * 14) نافذة "ماذا أفعل الآن؟" — Context Aware
 * ========================================================================= */
function setupModal() {
    const modal = document.getElementById('modal-what-now');
    const closeBtn = modal.querySelector('.close-modal');
    let lastFocused = null;

    const buildBody = () => {
        const s = currentStageObj();
        let html = `<h2 id="mw-title">${escapeHtml(stageStatusText())}</h2>`;
        html += `<p class="now-text"><strong>الآن:</strong> ${escapeHtml(s.now)}</p>`;

        if (s.key === 'TAWAF') {
            const round = Math.min(state.completedTawaf + 1, 7);
            const t = religiousContent.find(x => x.id === 'takbir-hajar');
            const d = religiousContent.find(x => x.id === 'dua-two-corners');
            html += `<hr><p><strong>عند الحجر الأسود:</strong> «${escapeHtml(t.arabicText)}»</p>`;
            html += `<p><strong>بين الركن اليماني والحجر الأسود:</strong></p><p class="arabic-text">${escapeHtml(d.arabicText)}</p>`;
            html += `<p class="alert">لا يوجد دعاء مخصوص ثابت للشوط ${escapeHtml(ORDINALS[round])}. يمكنك الدعاء بما شئت من الخير.</p>`;
            html += `<button class="btn-giant mt-1" type="button" id="mw-tawaf-next">أنهيت الشوط ✓</button>`;
        } else if (s.key === 'SAI') {
            const round = Math.min(state.completedSai + 1, 7);
            const dir = (round % 2 !== 0) ? 'الصفا ➔ المروة' : 'المروة ➔ الصفا';
            html += `<hr><p><strong>اتجاهك الآن:</strong> ${escapeHtml(dir)}</p>`;
            const d = religiousContent.find(x => x.id === 'dhikr-safa-marwa');
            html += `<p><strong>على الصفا/المروة:</strong></p><p class="arabic-text">${escapeHtml(d.arabicText)}</p>`;
            html += `<p class="alert">لا يوجد دعاء مخصوص ثابت لهذا الشوط. ادعُ بما شئت.</p>`;
            html += `<button class="btn-giant mt-1" type="button" id="mw-sai-next">وصلت ✓</button>`;
        } else if (s.refs) {
            s.refs.forEach(id => {
                const r = religiousContent.find(x => x.id === id);
                if (r) html += `<p class="arabic-text">${escapeHtml(r.arabicText)}</p><p class="source-text">${escapeHtml(r.sourceBook)} ${gradingBadge(r)}</p>`;
            });
        }
        if (s.action) html += `<button class="btn-primary mt-1" type="button" data-goto="${escapeHtml(s.action.view)}">${escapeHtml(s.action.label)}</button>`;
        return html;
    };

    const refresh = () => {
        const body = document.getElementById('mw-body');
        body.innerHTML = buildBody();
        const g = body.querySelector('[data-goto]');
        if (g) g.addEventListener('click', () => { close(); showView(g.dataset.goto); });
        const tn = document.getElementById('mw-tawaf-next');
        if (tn) tn.addEventListener('click', () => { document.getElementById('tawaf-plus').click(); if (state.completedTawaf < 7) refresh(); else close(); });
        const sn = document.getElementById('mw-sai-next');
        if (sn) sn.addEventListener('click', () => { document.getElementById('sai-plus').click(); if (state.completedSai < 7) refresh(); else close(); });
    };

    const open = () => { lastFocused = document.activeElement; refresh(); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); closeBtn.focus(); };
    const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); if (lastFocused) lastFocused.focus(); };

    document.getElementById('btn-what-now').addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
}
