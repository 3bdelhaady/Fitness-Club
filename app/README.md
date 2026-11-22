# Fitness Club — تطبيق فلاتر

تطبيق موبايل (Flutter/Android) لتتبع التمارين، أحد منتجات مركز الطلاب.
الدخول بحساب مركز الطلاب فقط — لا يوجد تسجيل مباشر.

## البنية
- `app/` — تطبيق Flutter (هذا الدليل): كل الشاشات من تصميم فيجما (RTL، عربي).
- `backend/` — API (Next.js) + ملفات ربط مركز الطلاب (hub-patch).

## التشغيل محليًا
1. شغّل الـ backend: `cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev`
2. شغّل التطبيق على محاكي أندرويد:
   `cd app && flutter run --dart-define=API_BASE=http://10.0.2.2:3000`
   (`10.0.2.2` = localhost بتاع جهازك من جوه المحاكي. لجهاز حقيقي استخدم IP الجهاز على نفس الشبكة.)

## تسجيل الدخول (مركز الطلاب)
التطبيق يفتح صفحة ربط مركز الطلاب داخل WebView، ويلتقط رمز الربط الموقّع (HMAC
one-time code) عند التحويل لعنوان الـ backend، ثم يستبدله بتوكن جلسة عبر
`POST /api/auth/mobile/exchange`. نفس عقد الأمان المتفق عليه مع فريق مركز
الطلاب: audience/issuer/state/nonce يُستهلك مرة واحدة.

للتجربة بدون مركز طلاب شغال: `GET /api/auth/dev-grant` في وضع التطوير يمر عبر
نفس مسار الاستبدال.

## الشاشات
Splash، تسجيل الدخول، الرئيسية (إحصائيات + سلسلة الأيام)، تأكيد الموقع،
تمارين اليوم (تسجيل المجموعات بالعدات والأوزان)، المستويات + تأكيد تغيير
الروتين، غامبول AI (حاسبة سعرات/بروتين + اقتراح وجبات)، الملف الشخصي
(الهدف، الجيم، الجدول الأسبوعي)، الجيمات القريبة + خطط الاشتراك (طلب فقط،
بدون دفع).


## App Links (بديل الـ WebView، عند النشر)
1. ارفع الـ backend على دومين HTTPS وثبّت `FITNESS_APP_ORIGIN` عليه.
2. حطّ بصمة شهادة التوقيع (release SHA-256) في `backend/public/.well-known/assetlinks.json`.
3. أضف intent-filter بـ `android:autoVerify="true"` في AndroidManifest لنفس
   الدومين و pathPrefix `/api/auth/hub/callback` — الرابط هيفتح التطبيق مباشرة
   بدل المتصفح. مسار الـ WebView الحالي يفضل شغال كـ fallback.

## بناء APK
يحتاج Android SDK على جهاز التطوير: `flutter build apk --release`.
