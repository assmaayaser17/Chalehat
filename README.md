# شاليه وفيلا — Chalehat

موقع + داشبورد لإدارة الشاليهات، مبني على **Next.js 15 (App Router)**، **TypeScript**، **Tailwind CSS**، ومكونات بنمط **shadcn/ui**، فوق backend خارجي (.NET) موصوف في `chalehat.postman_collection.json`.

## التشغيل محليًا

```bash
npm install
npm run dev
```

انسخ `.env.example` إلى `.env.local` وعدّل القيم إذا لزم:

```
API_BASE_URL=http://chalehat.onrender.com   # رابط الـ backend
AUTH_COOKIE_NAME=chalehat_session            # اسم كوكي الجلسة
```

## البنية

```
src/
  app/
    (site)/            صفحات عامة: الرئيسية، تفاصيل شاليه، تسجيل الدخول/حساب — لها Navbar/Footer خاص بها
    dashboard/          لوحة تحكم محمية (middleware + تحقق في layout.tsx)
      staff/            SuperAdmin / SystemAdmin — إضافة موظفين، عرض المستخدمين حسب الدور
      chalets/           ChaletAdmin — شاليهاتي، إضافة شاليه
    api/                Route Handlers: بروكسي مُصادَق أمام الـ backend (يُستخدم من مكوّنات React Query)
    layout.tsx           Root layout (خطوط + metadata فقط)
    error.tsx / not-found.tsx   حدود الأخطاء العامة
  components/
    ui/                 مكونات أساسية بنمط shadcn/ui (Button, Input, Select, Table...)
    layout/             Navbar, Footer, Sidebar — Server Components مع أجزاء Client صغيرة للتفاعل فقط
    auth/ chalets/ admin/   نماذج ومكونات خاصة بكل ميزة
  lib/
    api/                أنواع + دوال fetch نحو الـ backend (types.ts, client.ts, auth.ts, admin.ts, chalet.ts)
    auth/               الجلسة (كوكي httpOnly) + Server Actions الخاصة بالمصادقة
    actions/            Server Actions لإنشاء الموظفين والشاليهات
    validations/        مخططات Zod المستخدمة مع react-hook-form
  middleware.ts          حماية /dashboard حسب تسجيل الدخول والدور
```

## القرارات المعمارية (Server vs Client)

كل مكوّن **Server Component افتراضيًا**. لم يُستخدم `"use client"` إلا في:

- نماذج تستخدم `react-hook-form` (`useForm`) — تسجيل الدخول، التسجيل، إضافة موظف، إضافة شاليه.
- عناصر تفاعلية بحتة: قائمة الجوال (`Sheet`/`usePathname`)، قائمة المستخدم المنسدلة، مفتاح إظهار السعر.
- جدول "المستخدمون حسب الدور" — الاستخدام الوحيد لـ **React Query**، لأنه يحتاج إعادة جلب فوري عند تغيير الفلتر دون تحميل الصفحة، عبر Route Handler داخلي (`/api/admin/users`) يحمل الـ Bearer token على الخادم فقط.

كل صفحات القراءة (الرئيسية، تفاصيل شاليه، شاليهاتي) هي **Server Components** تجلب البيانات مباشرة من الـ backend وتُغلَّف بـ `<Suspense>` مع هياكل تحميل (`Skeleton`).

## المصادقة

- تسجيل الدخول ينفّذ **Server Action** يستدعي `/api/Auth/login`، يفك تشفير الـ JWT (بدون التحقق من التوقيع — التحقق الفعلي يحدث في الـ backend مع كل طلب) لاستخراج الدور، ويخزّن الجلسة في كوكي `httpOnly`.
- كل طلب محمي يمر عبر `authFetch` الذي يجدد الـ access token تلقائيًا عبر `/api/Auth/refresh` عند الحاجة.
- تسجيل الخروج يستدعي `/api/Auth/revoke` (best-effort) ثم يمسح الكوكي.
- `middleware.ts` يمنع الوصول لـ `/dashboard/*` بدون جلسة، ويوزّع كل دور لقسمه (`staff` أو `chalets`)، مع تحقق مطابق داخل `dashboard/layout.tsx` كخط دفاع ثانٍ.

## نقاط النهاية (Endpoints) المُغطّاة

جميع الـ 10 endpoints في الكولكشن مُطابَقة بدوال في `src/lib/api/*`:

| Endpoint | الاستخدام في الكود |
|---|---|
| `POST /api/Auth/register` | `registerAction` → صفحة `/register` |
| `POST /api/Auth/login` | `loginAction` → صفحة `/login` |
| `POST /api/Auth/refresh` | تلقائي داخل `authFetch` + Route Handler `/api/auth/refresh` |
| `POST /api/Auth/revoke` | `logoutAction` |
| `POST /api/Admin/create-staff` | `createStaffAction` → `/dashboard/staff` |
| `GET /api/Admin/by-role/{role}` | `/api/admin/users` (Route Handler) ← `UsersByRoleTable` |
| `POST /api/Chalet` | `createChaletAction` → `/dashboard/chalets/new` |
| `GET /api/Chalet` | الصفحة الرئيسية `/` |
| `GET /api/Chalet/{id}` | `/chalets/[id]` |
| `GET /api/Chalet/my-chalets` | `/dashboard/chalets` |

> **ملاحظة على التحقق المباشر:** الكولكشن لا يوثّق أشكال الاستجابة (فقط أجسام الطلبات)، لذا الكود يقرأ الاستجابات بشكل دفاعي (يتعامل مع مصفوفة مباشرة أو `{ items: [] }`، ويستخرج رسالة الخطأ من عدة أشكال محتملة). تأكدت من أن الـ backend (`chalehat.onrender.com`) أصبح يستجيب فعليًا من بيئة العمل، لكن تعذّر عليّ عرض محتوى JSON الخام من هذه البيئة تحديدًا (صلاحيات الشبكة هنا مقيّدة). يُفضّل تشغيل `npm run dev` وتجربة تسجيل حساب ثم تسجيل الدخول فعليًا للتأكد النهائي من تطابق شكل الاستجابة.
