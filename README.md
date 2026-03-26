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
> [!IMPORTANT]
> Phải sử dụng cờ `--no-verify-jwt` để bypass gateway xác thực và cho phép hàm tự xử lý Token thủ công qua `getUser()`.

```bash
npx supabase functions deploy analytics --no-verify-jwt
npx supabase functions deploy add-candidate --no-verify-jwt
```

## 4. Các chức năng chính & Thuật toán nâng cao
- **Auth**: Hệ thống đăng nhập/đăng ký bảo mật với Supabase Auth.
- **Dashboard Premium**: Giao diện hiện đại sử dụng Glassmorphism, Tailwind CSS 4 và Framer Motion.
- **Smart Search/Sort (Algorithmic Thinking 3.1)**: Thuật toán tính điểm matching score để sắp xếp ứng viên phù hợp nhất với từ khóa tìm kiếm lên đầu.
- **Realtime Updates**: Tự động cập nhật danh sách ứng viên và số liệu thống kê ngay lập tức khi có thay đổi từ DB.
- **Edge Functions Analytics (Algorithmic Thinking 3.2)**: Xử lý tính toán tỷ lệ, số lượng ứng viên mới trong 7 ngày và vị trí top tuyển dụng trực tiếp tại serverless function.
- **Storage**: Quản lý CV ứng viên chuyên nghiệp với Supabase Storage.
