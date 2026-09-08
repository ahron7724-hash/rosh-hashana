# השולחן של המשפחה — תפריט ראש השנה

אפליקציית React (Vite) לארגון משפחתי של תפריט החג: חלוקה לפי נושאים, מנות בכל נושא,
מי מכין כל מנה, וכרטיסי שמות עם סימון ✓ למה שכבר מוכן.

## הרצה מקומית

```bash
npm install
npm run dev
```

בלי הגדרת Supabase (למטה) — האפליקציה רצה במצב **מקומי**: הנתונים ב-localStorage
של הדפדפן, לכל מכשיר עותק משלו.

## בנייה ופריסה

```bash
npm run build     # תוצר סטטי ב-dist/
```

זו אפליקציית Vite סטטית — Vercel/Netlify מזהים אותה אוטומטית (Build: `npm run build`,
Output: `dist`). אין פונקציות שרת.

## שמירה משותפת — Supabase (Postgres)

כדי שכל המשפחה תראה את אותו התפריט ואת אותם הסימונים, בזמן אמת:

### 1. פרויקט Supabase
- להירשם ב-[supabase.com](https://supabase.com) (חינם) → **New project**.

### 2. הטבלאות
- בפרויקט: **SQL Editor** → **New query** → להדביק ולהריץ:

```sql
create table if not exists categories (
  id text primary key,
  name text not null default 'נושא',
  emoji text not null default '🍽️',
  pos double precision not null default 0
);
create table if not exists people (
  id text primary key,
  name text not null default '',
  color text not null default '#a83440',
  pos double precision not null default 0
);
create table if not exists dishes (
  id text primary key,
  category_id text not null references categories(id) on delete cascade,
  name text not null default '',
  note text not null default '',
  taken_by text,
  done boolean not null default false,
  pos double precision not null default 0
);
create table if not exists settings (
  key text primary key,
  value text not null default ''
);

alter table categories enable row level security;
alter table people    enable row level security;
alter table dishes    enable row level security;
alter table settings  enable row level security;

create policy "family read"  on categories for select using (true);
create policy "family write" on categories for all    using (true) with check (true);
create policy "family read2" on people     for select using (true);
create policy "family write2" on people    for all    using (true) with check (true);
create policy "family read3" on dishes     for select using (true);
create policy "family write3" on dishes    for all    using (true) with check (true);
create policy "family read4" on settings   for select using (true);
create policy "family write4" on settings  for all    using (true) with check (true);
```

*(טבלת `settings` מחזיקה את **באנר ההודעות** שבראש הדף — הודעה משותפת אחת שכל אחד
יכול לערוך. מנה שנוצרה לפני שהטבלה קיימת ממשיכה לעבוד; הבאנר פשוט יישאר ריק עד
שמריצים את השורות האלה.)*

*(המדיניות מתירה לכל מי שיש לו הקישור לקרוא ולכתוב — מתאים לתפריט משפחתי.
המפתח הציבורי לא נותן גישה לשום דבר אחר בפרויקט.)*

### 3. המפתחות
- Supabase → **Project Settings → API**:
  - **Project URL** (משהו כמו `https://abcd.supabase.co`)
  - **anon public** key

### 4. משתני סביבה
- ב-Vercel: **Settings → Environment Variables** → להוסיף (לכל הסביבות):
  - `VITE_SUPABASE_URL` = ה-Project URL
  - `VITE_SUPABASE_ANON_KEY` = ה-anon key
- **Redeploy**.

מעכשיו הפוטר יכתוב **"מסונכרן"**. הביקור הראשון זורע את התפריט המלא; כל שינוי
נכתב כשורה בודדת ב-Postgres, והדף קורא מחדש כל ~3.5 שניות. הוספות של שני אנשים
במקביל לא דורסות זו את זו.

להרצה מקומית מול Supabase: קובץ `.env.local` עם אותם שני המשתנים.

## מבנה

```
index.html
vite.config.js
src/
  main.jsx
  App.jsx      כל הלוגיקה + ה-store (Supabase או localStorage)
  styles.css   עיצוב, RTL, מצב יום/לילה
```
