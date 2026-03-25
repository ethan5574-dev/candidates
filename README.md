# Candidate Management System

Dự án quản lý ứng viên sử dụng React, TypeScript và Supabase (được kết nối tới dự án Supabase Cloud của bạn).

## 1. Yêu cầu hệ thống (Prerequisites)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
- [Node.js](https://nodejs.org/) (phiên bản mới nhất).
- Tài khoản [Supabase](https://supabase.com/) và một project đã được khởi tạo.

## 2. Cách chạy dự án

### Bước 1: Cấu hình Biến môi trường
Truy cập vào Supabase Dashboard (Settings > API) để lấy các giá trị sau và điền vào file `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Bước 2: Cài đặt thư viện và chạy Frontend
```bash
npm install
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:5173`.

## 3. Quản lý Backend (Deploy lên Supabase Cloud)

### Bước 1: Đăng nhập CLI
```bash
supabase login
```

### Bước 2: Liên kết với Project của bạn
```bash
supabase link --project-ref your-project-ref-id
```

### Bước 3: Đồng bộ Database Schema
```bash
supabase db push
```

### Bước 4: Triển khai Edge Functions
```bash
supabase functions deploy analytics
supabase functions deploy add-candidate
```

## 4. Các chức năng chính
- **Auth**: Đăng nhập/Đăng ký.
- **Dashboard**: Quản lý danh sách ứng viên, upload CV.
- **Analytics**: Thống kê số lượng và tỷ lệ ứng viên tham qua Edge Functions.
