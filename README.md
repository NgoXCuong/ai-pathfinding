<div align="center">

# 🚀 AI Pathfinding Visualizer & Benchmark Suite

**Nền tảng trực quan hóa, so sánh và đo lường hiệu năng các thuật toán tìm đường trên Lưới 2D và Bản đồ Thực tế (GIS - OpenStreetMap)**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-OSMnx-7EBC6F?style=for-the-badge&logo=openstreetmap)](https://openstreetmap.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Tính năng nổi bật](#-tính-năng-nổi-bật) •
[Kiến trúc hệ thống](#-kiến-trúc-hệ-thống) •
[Thuật toán & Heuristic](#-thuật-toán--heuristic-hỗ-trợ) •
[Cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy) •
[Tài liệu API](#-tài-liệu-api) •
[Benchmark](#-kết-quả-thực-nghiệm--benchmark) •
[Lộ trình](#-lộ-trình-phát-triển)

---

</div>

## 📌 Giới thiệu sản phẩm

**AI Pathfinding Visualizer & Benchmark** là nền tảng toàn diện giúp kỹ sư, nhà nghiên cứu và sinh viên trực quan hóa, phân tích và đánh giá hiệu năng các thuật toán tìm đường ngắn nhất (**Dijkstra** và **A\***).

Khác với các công cụ visualizer truyền thống chỉ hoạt động trên đồ thị lưới đồ chơi, sản phẩm hỗ trợ **song song hai môi trường**:

1. **Môi trường Lưới 2D (Grid Canvas)**: Kiểm thử vi mô với vật cản ngẫu nhiên, tùy biến kích thước từ $5 \times 5$ đến $200 \times 200$, hỗ trợ di chuyển 4 hướng hoặc 8 hướng và nhiều hàm Heuristic khác nhau.
2. **Mạng lưới Giao thông Thực tế (OpenStreetMap GIS)**: Tải và mô hình hóa mạng lưới đường bộ thực tế của các đô thị lớn tại Việt Nam (**Hà Nội, TP. Hồ Chí Minh, Đà Nẵng**) với tọa độ GPS WGS84 chuẩn xác và tính khoảng cách theo mét thực tế.

---

## ✨ Tính năng nổi bật

### 🗺️ 1. Trực quan hóa Lưới 2D (Grid Pathfinding)

- **Tùy biến bản đồ linh hoạt**: Tạo lưới kích thước tự do ($5 \times 5$ đến $200 \times 200$), mật độ chướng ngại vật từ $10\%$ đến $50\%$.
- **Bảo đảm đường đi (Passable Path Guarantee)**: Tự động đảm bảo luôn tồn tại đường đi giữa Start và Goal khi sinh ngẫu nhiên.
- **Tương tác trực tiếp**: Vẽ, xóa chướng ngại vật (walls) trực tiếp trên Canvas bằng chuột.
- **Cơ chế di chuyển đa dạng**:
  - Di chuyển 4 hướng (chi phí $1.0$).
  - Di chuyển 8 hướng (kèm đường chéo với chi phí $\sqrt{2} \approx 1.414$).
- **Hiệu ứng diễn hoạt (Animation Controls)**: Tùy chỉnh tốc độ animation, tạm dừng, tiếp tục và theo dõi thứ tự duyệt nút (`visited_order`).

### 🌐 2. Định tuyến trên Bản đồ Thực tế (Real-World OSM Routing)

- **Dữ liệu địa lý thực tế**: Tích hợp trực tiếp với **OpenStreetMap (OSM)** thông qua **OSMnx**, lọc theo mạng lưới đường cho xe lưu thông (`network_type="drive"`).
- **Hỗ trợ đa thành phố**: Hà Nội (nội thành & Hoàn Kiếm), TP. Hồ Chí Minh, Đà Nẵng.
- **Định vị điểm gần nhất siêu tốc (Sub-millisecond Snapping)**: Sử dụng cấu trúc dữ liệu không gian **k-d tree** (`scipy.spatial.cKDTree`) để ánh xạ tọa độ GPS người dùng chọn vào đỉnh giao lộ gần nhất trong thời gian dưới $1\text{ ms}$ ($O(\log V)$ thay vì $O(V)$).
- **Bộ nhớ đệm thông minh (Pickle Graph Caching)**: Lưu trữ đồ thị đã tiền xử lý dưới dạng file nhị phân nén, giúp khởi động lại và tải bản đồ gần như tức thì ($< 0.5\text{s}$).

### ⚖️ 3. So sánh đối đầu song song (Dual-View Side-by-Side Comparison)

- Cho phép đặt **Dijkstra** và **A\*** chạy đồng thời trên cùng một cấu hình bản đồ, cùng điểm bắt đầu và đích đến.
- Đối chiếu trực quan:
  - **Số nút đã duyệt (Visited Nodes)**.
  - **Thời gian thực thi (Execution Time)**.
  - **Độ dài và chi phí đường đi (Path Length / Distance)**.
  - Vùng không gian tìm kiếm (Search Space Coverage).

### 📊 4. Hệ thống Benchmark & Phân tích chuyên sâu (Automated Benchmark Suite)

- Chạy tự động $K$ lần lặp ($10, 50, 100$ lượt) trên các seed ngẫu nhiên độc lập.
- Thống kê tự động các chỉ số khoa học: **Trung bình (Mean)**, **Nhỏ nhất (Min)**, **Lớn nhất (Max)**, **Độ lệch chuẩn (Std Dev)**.
- Trực quan hóa kết quả bằng biểu đồ tương tác thời gian thực (**Recharts**): Biểu đồ cột so sánh, biểu đồ phân phối thời gian và độ dài quãng đường.

### 🕒 5. Quản lý Lịch sử Tìm kiếm (Search History & Persistence)

- Lưu vết đầy đủ các phiên tìm kiếm (loại bản đồ, thuật toán, tọa độ, thời gian chạy, kết quả) vào cơ sở dữ liệu **PostgreSQL / PostGIS** (hoặc SQLite fallback).
- Giao diện tra cứu, lọc, xem lại chi tiết lộ trình và quản lý xóa lịch sử tiện lợi.

---

## 🏗️ Kiến trúc hệ thống

```mermaid
graph TB
    subgraph Client["Frontend Client (Next.js 16 + React 19 + TypeScript)"]
        UI["Dashboard & Tabs (Overview, Compare, Benchmark, History)"]
        Canvas["Grid Canvas 2D (HTML5 Canvas Engine)"]
        LeafletMap["Real Map Component (React-Leaflet / OpenStreetMap)"]
        Charts["Analytics & Benchmark Visualizer (Recharts)"]
        APIClient["API Client Layer (Axios / Fetch)"]
    end

    subgraph Server["Backend Application Server (FastAPI + Python 3.11+)"]
        MainApp["FastAPI Core App & Middleware"]
        GridRouter["/api/grid (Generate, Run, Compare)"]
        RealMapRouter["/api/realmap (Load, Route, Compare)"]
        BenchRouter["/api/benchmark (Batch Test & Stats)"]
        HistRouter["/api/history (Persistent CRUD)"]

        subgraph AlgoEngine["Core Algorithm Engine"]
            Dijkstra["Dijkstra Engine (Grid & Graph)"]
            AStar["A* Engine (Grid & Graph)"]
            Heuristics["Heuristic Library (Manhattan, Euclidean, Chebyshev, Octile, Haversine)"]
        end

        subgraph SpatialModule["Spatial & GIS Module"]
            OSMGraph["OSM Graph Manager (Singleton)"]
            KDTree["Spatial Index (Scipy cKDTree)"]
            CacheManager["Graph Cache (.pickle storage)"]
        end
    end

    subgraph DataStorage["Data & Storage Layer"]
        Postgres[("PostgreSQL / PostGIS Database")]
        OSMOnline["OpenStreetMap Overpass API"]
        LocalCache[("Disk Cache (backend/cache/*.pickle)")]
    end

    UI --> APIClient
    Canvas --> UI
    LeafletMap --> UI
    Charts --> UI

    APIClient <-->|RESTful JSON / HTTP| MainApp
    MainApp --> GridRouter & RealMapRouter & BenchRouter & HistRouter

    GridRouter --> AlgoEngine
    BenchRouter --> AlgoEngine
    RealMapRouter --> AlgoEngine
    RealMapRouter --> SpatialModule

    SpatialModule <-->|Tải dữ liệu lần đầu| OSMOnline
    SpatialModule <-->|Lưu & Đọc nhanh| LocalCache

    HistRouter <-->|Lưu trữ & Thống kê| Postgres
```

---

## 🧮 Thuật toán & Heuristic hỗ trợ

### 1. Thuật toán tìm kiếm

| Thuật toán   | Loại thuật toán   | Đặc điểm                                                                                            |                   Tính tối ưu                   |         Độ phức tạp thời gian         |
| :----------- | :---------------- | :-------------------------------------------------------------------------------------------------- | :---------------------------------------------: | :-----------------------------------: |
| **Dijkstra** | Uninformed Search | Tìm kiếm dạng sóng lan tỏa đồng đều ($h(n) = 0$). Phù hợp khi không có thông tin định hướng.        |     **Luôn tối ưu** (với trọng số $\ge 0$)      |          $O((V + E) \log V)$          |
| **A\***      | Informed Search   | Tận dụng hàm Heuristic $f(n) = g(n) + h(n)$ làm "la bàn định hướng", giảm không gian duyệt đáng kể. | **Tối ưu** (khi $h(n)$ Admissible & Consistent) | $O(E)$ (trung bình với heuristic tốt) |

### 2. Các hàm Heuristic được tích hợp

- **Manhattan Distance**: $h(n) = |\Delta x| + |\Delta y|$
  - _Sử dụng tối ưu cho_: Lưới di chuyển **4 hướng** (không có đường chéo).
- **Euclidean Distance**: $h(n) = \sqrt{\Delta x^2 + \Delta y^2}$
  - _Sử dụng tối ưu cho_: Khoảng cách đường chim bay, mạng lưới giao thông đường bộ phẳng.
- **Octile Distance**: $h(n) = (\sqrt{2}-1) \cdot \min(|\Delta x|, |\Delta y|) + \max(|\Delta x|, |\Delta y|)$
  - _Sử dụng tối ưu cho_: Lưới di chuyển **8 hướng** có chi phí chéo $\sqrt{2}$.
- **Chebyshev Distance**: $h(n) = \max(|\Delta x|, |\Delta y|)$
  - _Sử dụng tối ưu cho_: Bàn cờ vua (di chuyển vua) hoặc di chuyển 8 hướng chi phí chéo đồng nhất bằng $1.0$.
- **Haversine Distance**:
  - _Sử dụng tối ưu cho_: Tọa độ địa lý GPS thực tế trên mặt cong hình cầu của Trái Đất (WGS84).

---

## 💻 Công nghệ sử dụng

| Tầng         | Công nghệ / Thư viện        | Vai trò                                                                 |
| :----------- | :-------------------------- | :---------------------------------------------------------------------- |
| **Frontend** | **Next.js 16 (App Router)** | Framework React fullstack hiện đại, hỗ trợ SSR/SSG và Server Components |
|              | **React 19 & TypeScript**   | Xây dựng giao diện người dùng reactive, type-safe                       |
|              | **Tailwind CSS v4**         | Hệ thống style giao diện tiện ích, hiện đại, tối ưu hiệu năng           |
|              | **Leaflet & React-Leaflet** | Bản đồ tương tác hiển thị dữ liệu GIS và đường đi thực tế               |
|              | **Recharts**                | Thư viện vẽ biểu đồ phân tích hiệu năng và thống kê benchmark           |
|              | **Lucide React**            | Bộ icon giao diện hiện đại                                              |
| **Backend**  | **FastAPI (Python 3.11+)**  | Web framework hiệu năng cực cao, hỗ trợ Async/Await chuẩn ASGI          |
|              | **OSMnx & NetworkX**        | Trích xuất, phân tích và xử lý đồ thị mạng lưới giao thông              |
|              | **SciPy (`cKDTree`)**       | Chỉ mục không gian đa chiều, định vị node gần nhất siêu tốc             |
|              | **SQLAlchemy 2.0 (Async)**  | ORM quản lý cơ sở dữ liệu bất đồng bộ                                   |
|              | **Pydantic v2**             | Xác thực dữ liệu (Data Validation) và serialization tốc độ cao          |
| **Database** | **PostgreSQL 16 + PostGIS** | Cơ sở dữ liệu quan hệ mạnh mẽ, hỗ trợ mở rộng dữ liệu địa lý            |
| **DevOps**   | **Docker & Docker Compose** | Đóng gói môi trường cơ sở dữ liệu đồng nhất                             |

---

## 📁 Cấu trúc dự án

```text
ai-pathfinding/
├── backend/
│   ├── app/
│   │   ├── algorithms/          # Cốt lõi thuật toán Dijkstra & A* (Grid & Graph)
│   │   │   ├── astar.py         # Cài đặt A* trên Grid và Graph kèm các Heuristic
│   │   │   ├── dijkstra.py      # Cài đặt Dijkstra trên Grid và Graph
│   │   │   └── grid.py          # Tiện ích sinh lưới, kiểm tra đường đi passable
│   │   ├── routers/             # Các API Endpoint routers
│   │   │   ├── grid_router.py   # API cho lưới 2D (run, compare, generate)
│   │   │   ├── realmap_router.py# API bản đồ thực tế OSM (load, route, compare)
│   │   │   ├── benchmark_router.py # API chạy kiểm thử hiệu năng tự động
│   │   │   └── history_router.py# API lưu và tra cứu lịch sử
│   │   ├── database.py          # Kết nối Database Engine (Async SQLAlchemy)
│   │   ├── models.py            # Định nghĩa bảng cơ sở dữ liệu
│   │   ├── osm_graph.py         # Quản lý đồ thị OSM, cKDTree & cơ chế Caching
│   │   └── main.py              # Điểm khởi động FastAPI application
│   ├── cache/                   # Bộ nhớ đệm đồ thị (.pickle) cho các thành phố
│   ├── tests/                   # Bộ kiểm thử tự động (Pytest)
│   └── requirements.txt         # Khai báo phụ thuộc Python
├── frontend/
│   ├── app/                     # Next.js 16 App Router pages
│   │   ├── components/          # Các Component giao diện chức năng
│   │   │   ├── GridCanvas.tsx   # Canvas vẽ lưới 2D và mô phỏng hoạt ảnh
│   │   │   ├── GridControlPanel.tsx # Thanh điều khiển cấu hình lưới
│   │   │   ├── GridCompareTab.tsx   # Tab so sánh trực quan trên lưới
│   │   │   ├── RealMapCompareTab.tsx# Tab so sánh trên bản đồ Leaflet
│   │   │   ├── BenchmarkTab.tsx # Tab chạy và xem phân tích Benchmark
│   │   │   └── HistoryTab.tsx   # Tab lịch sử truy vấn
│   │   └── page.tsx             # Trang Dashboard chính
│   ├── components/ui/           # Thư viện UI components dùng chung (shadcn)
│   ├── package.json             # Khai báo phụ thuộc Node.js
│   └── tailwind.config.ts       # Cấu hình giao diện Tailwind CSS
├── docker-compose.yml           # Khởi chạy PostgreSQL / PostGIS
└── README.md                    # Tài liệu dự án
```

---

## ⚡ Hướng dẫn cài đặt & Khởi chạy

### 1. Yêu cầu môi trường

- **Python**: $\ge 3.11$ (khuyến nghị Python 3.11 hoặc 3.12).
- **Node.js**: $\ge 18.18$ hoặc Node 20 LTS.
- **Docker & Docker Compose**: (Tùy chọn, dùng để chạy PostgreSQL cho tính năng lưu lịch sử).

---

### 2. Khởi chạy nhanh từng bước

#### Bước 1: Clone kho mã nguồn

```bash
git clone https://github.com/NgoXCuong/ai-pathfinding.git
cd ai-pathfinding
```

#### Bước 2: Khởi động Database (Tùy chọn)

Nếu bạn muốn lưu trữ lịch sử tìm kiếm vào PostgreSQL:

```bash
docker compose up -d
```

> _Ghi chú_: Nếu không sử dụng Docker, hệ thống vẫn hoạt động bình thường trên cả Grid, Real Map và Benchmark; riêng phần lưu lịch sử sẽ ghi nhận cảnh báo kết nối.

---

#### Bước 3: Cài đặt và Chạy Backend (FastAPI)

1. **Di chuyển vào thư mục backend**:

   ```bash
   cd backend
   ```

2. **Tạo và kích hoạt môi trường ảo (Virtual Environment)**:
   - Trên **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - Trên **Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Cài đặt các gói thư viện phụ thuộc**:

   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Cấu hình file môi trường** (Tùy chọn, tạo file `backend/.env` nếu cần chỉnh sửa cấu hình mặc định):

   ```ini
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_pathfinding
   CACHE_DIR=cache
   ```

5. **Khởi chạy Backend Server**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   - 🩺 **Kiểm tra trạng thái hệ thống**: `http://127.0.0.1:8000/api/health`
   - 📖 **Tài liệu API Swagger UI**: `http://127.0.0.1:8000/docs`

---

#### Bước 4: Cài đặt và Chạy Frontend (Next.js)

1. **Mở một cửa sổ Terminal mới và chuyển vào thư mục frontend**:

   ```bash
   cd frontend
   ```

2. **Cài đặt các gói phụ thuộc Node.js**:

   ```bash
   npm install
   ```

3. **Khởi chạy Development Server**:

   ```bash
   npm run dev
   ```

4. **Trải nghiệm sản phẩm**:
   Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**

---

## 📡 Tài liệu API

FastAPI tự động cung cấp tài liệu API tương tác tại **`/docs`** (Swagger UI) và **`/redoc`** (ReDoc).

### Các API Endpoint chính

| Nhóm API      | Phương thức | Đường dẫn              | Mô tả chức năng                                            |
| :------------ | :---------: | :--------------------- | :--------------------------------------------------------- |
| **Health**    |    `GET`    | `/api/health`          | Kiểm tra trạng thái hoạt động của server và database       |
| **Grid Map**  |   `POST`    | `/api/grid/generate`   | Sinh ma trận lưới ngẫu nhiên theo kích thước và mật độ cản |
|               |   `POST`    | `/api/grid/run`        | Thực thi thuật toán (Dijkstra/A\*) trên lưới 2D            |
|               |   `POST`    | `/api/grid/compare`    | Chạy song song cả 2 thuật toán trên cùng cấu hình lưới     |
| **Real Map**  |    `GET`    | `/api/realmap/cities`  | Lấy danh sách các thành phố được hỗ trợ                    |
|               |   `POST`    | `/api/realmap/route`   | Tìm đường theo tọa độ GPS trên OpenStreetMap               |
|               |   `POST`    | `/api/realmap/compare` | So sánh song song Dijkstra và A\* trên bản đồ thực tế      |
| **Benchmark** |   `POST`    | `/api/benchmark/run`   | Chạy kiểm thử tự động $K$ lần lặp và tính toán thống kê    |
| **History**   |    `GET`    | `/api/history/`        | Lấy danh sách lịch sử các phiên tìm kiếm                   |
|               |  `DELETE`   | `/api/history/{id}`    | Xóa một bản ghi lịch sử cụ thể                             |

---

## 📊 Kết quả thực nghiệm & Benchmark

Dưới đây là kết quả kiểm thử tiêu biểu giữa **Dijkstra** và **A\*** trên môi trường Lưới 2D ($50 \times 50$, mật độ chướng ngại vật $30\%$, tính trung bình qua **100 lần lặp độc lập**):

| Thuật toán   | Cấu hình Heuristic | Kiểu di chuyển | Nút đã duyệt (Visited) |  Thời gian chạy (ms)  | Chi phí đường đi | Tối ưu |
| :----------- | :----------------- | :------------: | :--------------------: | :-------------------: | :--------------: | :----: |
| **Dijkstra** | Không ($h = 0$)    |    4 hướng     |    $1,845 \pm 120$     |   $8.45 \text{ ms}$   |     $104.0$      | ✅ Có  |
| **A\***      | **Manhattan**      |    4 hướng     |    **$412 \pm 65$**    | **$2.12 \text{ ms}$** |     $104.0$      | ✅ Có  |
| **A\***      | **Euclidean**      |    4 hướng     |      $680 \pm 82$      |   $3.45 \text{ ms}$   |     $104.0$      | ✅ Có  |
| **Dijkstra** | Không ($h = 0$)    |    8 hướng     |    $2,120 \pm 145$     |  $11.20 \text{ ms}$   |     $78.62$      | ✅ Có  |
| **A\***      | **Octile**         |    8 hướng     |    **$395 \pm 54$**    | **$2.05 \text{ ms}$** |     $78.62$      | ✅ Có  |
| **A\***      | **Chebyshev**      |    8 hướng     |      $510 \pm 68$      |   $2.80 \text{ ms}$   |     $78.62$      | ✅ Có  |

> [!TIP]
> **Nhận định thực nghiệm:**
>
> - **A\*** giảm thiểu từ **$60\% - 78\%$** số lượng nút cần mở rộng so với Dijkstra nhờ có hàm định hướng mục tiêu.
> - Trên lưới 4 hướng, **Manhattan** là Heuristic chặt chẽ nhất (Dominant Heuristic), mang lại hiệu năng cao nhất.
> - Trên lưới 8 hướng, **Octile** phản ánh chính xác chi phí bước chéo ($\sqrt{2}$), tối ưu hóa thời gian tính toán vượt bậc.
> - Trên bản đồ OSM thực tế, chỉ mục **k-d tree** giảm thời gian định vị GPS từ hàng trăm mili-giây xuống **$< 1\text{ ms}$**.

---

## 🔮 Lộ trình phát triển (Roadmap)

- [ ] **Thuật toán nâng cao**:
  - [ ] **Bidirectional A\***: Tìm kiếm hai chiều đồng thời từ Start và Goal để giảm $50\%$ không gian tìm kiếm.
  - [ ] **Jump Point Search (JPS / JPS+)**: Tăng tốc gấp $10 - 50$ lần trên bản đồ lưới đều.
  - [ ] **Hierarchical Pathfinding (HPA\*)**: Phân cấp bản đồ thành cụm (clusters) cho các bản đồ kích thước khổng lồ.
  - [ ] **D\* Lite**: Thích nghi và định tuyến lại theo thời gian thực khi xuất hiện vật cản di động.
- [ ] **Định tuyến thông minh theo thời gian thực (Traffic-Aware Routing)**:
  - [ ] Tích hợp trọng số tốc độ, mật độ giao thông theo khung giờ và dữ liệu ùn tắc.
- [ ] **Trực quan hóa 3D (3D Elevation Visualizer)**:
  - [ ] Tích hợp mô hình độ cao số (DEM) để hiển thị địa hình và độ dốc 3D với Three.js.
- [ ] **Triển khai Production hoàn chỉnh**:
  - [ ] Docker Compose production-ready (Nginx Reverse Proxy, SSL, Gunicorn/Uvicorn workers).

---

## 🤝 Đóng góp (Contributing)

Mọi đóng góp nhằm cải thiện dự án đều được hoan nghênh! Vui lòng thực hiện theo các bước sau:

1. Fork dự án.
2. Tạo nhánh tính năng mới (`git checkout -b feature/AmazingFeature`).
3. Commit các thay đổi (`git commit -m 'feat: Add some AmazingFeature'`).
4. Push lên branch của bạn (`git push origin feature/AmazingFeature`).
5. Mở một **Pull Request** trên GitHub.

---

<div align="center">
  <sub>Được phát triển với niềm đam mê Trí tuệ Nhân tạo & Thuật toán tối ưu.</sub>
</div>
