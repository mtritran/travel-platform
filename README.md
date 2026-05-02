# TravelX - Nền tảng Du lịch Tương tác P2P & AI Chatbot

**TravelX** là một nền tảng du lịch hiện đại giúp kết nối trực tiếp (Peer-to-Peer) giữa Khách du lịch (Customer) và Hướng dẫn viên địa phương (Local Guide). Hệ thống được tích hợp công nghệ AI tiên tiến nhằm cung cấp khả năng tìm kiếm ngữ nghĩa, đề xuất tour thông minh dựa trên vị trí địa lý, cùng hệ thống nhắn tin theo thời gian thực (real-time chat).

---

## 🌟 Tính năng nổi bật (Key Features)

### 1. Dành cho Customer (Khách du lịch)
- **AI Chatbot Tư vấn Tour:** Chatbot sử dụng kiến trúc RAG (Retrieval-Augmented Generation) để tư vấn tour du lịch dựa trên yêu cầu tự nhiên của người dùng, tự động tính toán khoảng cách địa lý (Haversine formula) và lọc ra các tour phù hợp nhất.
- **Yêu cầu Tour tùy chỉnh (Custom Tour Requests):** Tạo yêu cầu tìm kiếm tour theo mong muốn cá nhân để các Hướng dẫn viên có thể gửi báo giá và lịch trình.
- **Tìm kiếm Hướng dẫn viên:** Xem hồ sơ, đánh giá và lịch trình của các Local Guide trong khu vực mong muốn.
- **Nhắn tin trực tiếp (P2P Real-time Chat):** Trao đổi trực tiếp với Hướng dẫn viên qua giao diện chat mượt mà, thời gian thực.
- **Thanh toán & Đặt Tour:** Tích hợp ví điện tử, thanh toán an toàn với mã PIN và chính sách hoàn hủy rõ ràng.

### 2. Dành cho Guide (Hướng dẫn viên)
- **Quản lý Tour:** Tạo, chỉnh sửa và quản lý các dịch vụ/tour mà mình cung cấp. Mọi thay đổi đều được hệ thống nhúng (embedding) lại ngay lập tức (Real-time Vector Indexing) để cập nhật cho AI.
- **Quản lý Yêu cầu (Request Management):** Tiếp nhận và phản hồi các yêu cầu tùy chỉnh từ Customer.
- **Quản lý Lịch trình & Thu nhập:** Theo dõi trạng thái đặt tour và quản lý doanh thu minh bạch (cơ chế phân chia 80/20 tự động).

### 3. Dành cho Admin (Quản trị viên)
- Quản lý người dùng, duyệt hồ sơ đăng ký Hướng dẫn viên.
- Theo dõi giao dịch, xử lý tranh chấp và quản lý hệ thống đánh giá/phạt điểm (Penalty Points).

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Backend (Java & Spring Boot)
- **Framework:** Spring Boot 3.x
- **Bảo mật:** Spring Security, JWT (JSON Web Tokens)
- **Cơ sở dữ liệu:** PostgreSQL (Relational Data) + **pgvector** (Vector Database cho AI)
- **ORM:** Spring Data JPA / Hibernate
- **Real-time:** Spring WebSockets, STOMP protocol
- **AI Integration:** LangChain4j, Google Gemini Pro Model (LLM)
- **Build Tool:** Maven

### Frontend (React & TypeScript)
- **Framework:** React 18, TypeScript, Vite
- **Styling:** Vanilla CSS, CSS Variables (thiết kế UI/UX hiện đại, responsive)
- **Icons & UI:** Lucide React
- **Real-time:** SockJS-client, @stomp/stompjs
- **Routing:** React Router DOM

---

## 🧠 Kiến trúc AI & RAG (Retrieval-Augmented Generation)

Hệ thống ứng dụng công nghệ RAG để cung cấp chatbot thông minh:
1. **Vector Indexing:** Mỗi khi một Tour được tạo hoặc cập nhật, dữ liệu dạng văn bản sẽ được chuyển hóa thành Vector Embeddings và lưu vào kho chứa `pgvector` thông qua `TourEmbeddingService`. Có cả cronjob (chạy lúc 3h sáng) để đồng bộ hóa.
2. **Context Retrieval:** Khi user hỏi, hệ thống:
   - Dùng **SQL** lọc sơ bộ các tour đang Active.
   - Tính toán khoảng cách không gian (Geospatial Filtering) dùng công thức **Haversine**.
   - Thực hiện **Semantic Vector Search** (Tìm kiếm ngữ nghĩa) để lấy ra Top 5 tour phù hợp nhất.
3. **LLM Generation:** Dữ liệu tìm được (Context) được bơm vào prompt gửi cho model Gemini AI để sinh ra câu trả lời tự nhiên, chính xác và có ngữ cảnh cho người dùng.

---

## ⚡ Hệ thống Nhắn tin Real-time (P2P Chat)

- Sử dụng **WebSocket + STOMP** cho phép nhắn tin 1-1 ngay lập tức.
- **Tối ưu hóa UI/UX:**
  - Optimistic UI Updates: Tin nhắn hiện lên màn hình người gửi ngay trước khi backend phản hồi.
  - Xử lý deduplication (loại bỏ tin nhắn lặp) thông minh khi client nhận được bản echo từ server.
  - Quản lý trạng thái kết nối chặt chẽ (`useRef`, `onConnected` callback) tránh lỗi miss tin nhắn.
- **Bảo mật:** Payload truyền qua WebSocket không chứa các dữ liệu nhạy cảm (như mật khẩu, số dư ví) thông qua việc sử dụng các Data Transfer Objects (DTO) tối giản.

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Getting Started)

### Yêu cầu hệ thống:
- Java 17+
- Node.js 18+
- PostgreSQL (có cài đặt extension `pgvector`)
- API Key của Google Gemini (Cho chức năng AI)

### 1. Khởi chạy Backend
1. Clone dự án và đi tới thư mục `BE`.
2. Tạo database PostgreSQL tên `travel_platform` và chạy script bật pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Mở file `application.yml` (hoặc cấu hình environment variables) để điền thông tin DB và `GEMINI_API_KEY`.
4. Chạy ứng dụng Spring Boot:
   ```bash
   mvn spring-boot:run
   ```
   *(Backend mặc định chạy trên cổng `8080`)*

### 2. Khởi chạy Frontend
1. Đi tới thư mục `FE`.
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Chạy server phát triển (Development Server):
   ```bash
   npm run dev
   ```
   *(Frontend mặc định chạy trên cổng `5173`)*

---

## 📄 Cấu trúc Thư mục Chính (Project Structure)

```text
travel-platform/
├── BE/                           # Backend System (Spring Boot)
│   ├── src/main/java/com/mtritran/travelplatform/
│   │   ├── controller/           # REST APIs & WebSocket Controllers
│   │   ├── service/              # Core Business Logic
│   │   │   └── ai/               # RAG Pipeline & AI Services
│   │   ├── repository/           # JPA Repositories
│   │   ├── entity/               # Database Entities
│   │   ├── dto/                  # Data Transfer Objects
│   │   ├── config/               # Security, WebSocket, AI Configs
│   │   └── exception/            # Global Exception Handling
│   └── pom.xml
│
└── FE/                           # Frontend System (React + Vite)
    ├── src/
    │   ├── components/           # Reusable UI Components (ChatWindow, Modal...)
    │   ├── pages/                # Main Pages (MessagesPage, CreateTourRequest...)
    │   ├── services/             # API Clients & P2PChatService
    │   ├── context/              # AuthContext (State Management)
    │   └── index.css             # Global Styles
    └── package.json
```

---

## 📝 Giấy phép (License)
Dự án được xây dựng cho mục đích giáo dục và nghiên cứu học thuật. Đồ án quản lý bởi sinh viên Trần Mạnh Trí.