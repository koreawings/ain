# 할 일 목록 (Next.js + Supabase + Vercel)

로그인 화면 없이 쓰는 TODO 앱입니다. 브라우저마다 Supabase 익명 사용자로 자동 로그인하고,
RLS(행 단위 보안)로 각자 자기 할 일만 보고 수정할 수 있습니다.

## 1. Supabase 설정
1. https://supabase.com 에서 새 프로젝트를 만듭니다.
2. **SQL Editor**에 `supabase/schema.sql` 내용을 붙여넣고 **Run**을 누릅니다.
3. **Authentication → Sign In / Providers**에서 **Allow anonymous sign-ins**를 켭니다.
4. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 복사합니다.

## 2. Vercel 배포
1. 이 저장소를 GitHub에 올립니다.
2. https://vercel.com/new 에서 저장소를 Import 합니다.
3. **Environment Variables**에 다음 두 값을 넣고 **Deploy**를 누릅니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

이후 GitHub에 push할 때마다 자동으로 다시 배포됩니다.

## 로컬 실행 (선택)
```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```
