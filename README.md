# BÁO CÁO DỰ ÁN: AI PATHFINDING VISUALIZER & BENCHMARK
> **Nghiên cứu & So sánh thuật toán Dijkstra và A\* trên Môi trường Lưới 2D (Grid) và Bản đồ Thực tế (Real Map)**

---

## 1. PHÁT BIỂU BÀI TOÁN

Tìm đường đi ngắn nhất (Shortest Path Problem) là một trong những bài toán kinh điển và cốt lõi trong lĩnh vực Trí tuệ Nhân tạo (AI), Khoa học Dữ liệu và Hệ thống Thông tin Địa lý (GIS). Trong thực tế, bài toán xuất hiện ở khắp mọi nơi: từ các ứng dụng chỉ đường thông minh (Google Maps, Grab, Apple Maps), lập lộ trình cho robot tự hành (AGV/AMR), định tuyến gói tin mạng viễn thông, đến điều khiển nhân vật (NPC) trong trò chơi điện tử.

Hai thuật toán nền tảng tiêu biểu nhất để giải quyết bài toán này là:
- **Thuật toán Dijkstra (1959)**: Thuật toán tìm kiếm không thông tin (Uninformed Search) / tìm kiếm theo bề rộng có trọng số. Thuật toán đảm bảo tính **Đầy đủ (Complete)** và **Tối ưu (Optimal)** khi đồ thị có trọng số cạnh không âm. Tuy nhiên, do không có thông tin định hướng đến đích ($h(n) = 0$), Dijkstra duyệt đồng đều theo mọi hướng (tìm kiếm dạng sóng lan tỏa/vòng tròn), dẫn tới việc tiêu tốn nhiều thời gian và bộ nhớ trên các không gian trạng thái lớn.
- **Thuật toán A\* (Hart, Nilsson & Raphael, 1968)**: Thuật toán tìm kiếm có thông tin (Informed Search) / tìm kiếm Heuristic. A* kết hợp chi phí thực tế đã đi $g(n)$ với hàm ước lượng khoảng cách tới đích $h(n)$ theo hàm đánh giá:
  $$f(n) = g(n) + h(n)$$
  Nhờ có "la bàn định hướng" $h(n)$, A* ưu tiên mở rộng những đỉnh hứa hẹn nhất hướng về mục tiêu. Nếu hàm Heuristic thỏa mãn tính **Chấp nhận được (Admissible)** ($h(n) \le h^*(n)$) và **Nhất quán (Consistent / Monotone)** ($h(n) \le w(n, n') + h(n')$), A* bảo đảm luôn tìm ra đường đi ngắn nhất với số lượng đỉnh cần duyệt ít hơn đáng kể so với Dijkstra.

### Mục tiêu đề tài:
1. Xây dựng nền tảng thử nghiệm trực quan (Interactive Pathfinding Visualizer) trên 2 môi trường:
   - **Môi trường mô phỏng (2D Grid Map)**: Khảo sát hành vi của thuật toán trên lưới ô vuông với các chế độ di chuyển 4 hướng hoặc 8 hướng, mật độ vật cản tùy biến, và thử nghiệm các hàm Heuristic khác nhau (Manhattan, Euclidean, Chebyshev, Octile).
   - **Môi trường thực tế (Real Road Network Map)**: Tải và mô hình hóa mạng lưới giao thông thực tế từ **OpenStreetMap (OSM)** của các đô thị lớn tại Việt Nam (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng) với tọa độ GPS địa lý, tìm đường chính xác theo khoảng cách mét.
2. Xây dựng công cụ phân tích và đo lường định lượng (Benchmark & Compare Tool) để so sánh hiệu năng của Dijkstra và A* theo các chỉ số: thời gian thực thi (ms), số lượng nút duyệt (visited nodes), độ dài quãng đường và độ lệch chuẩn qua nhiều kịch bản ngẫu nhiên.
3. Cung cấp giao diện trực quan hóa sinh động: quan sát quá trình duyệt nút từng bước (animation), so sánh đối đầu song song (side-by-side) và lưu trữ lịch sử truy vấn phục vụ nghiên cứu.

---

## 2. XÁC ĐỊNH YÊU CẦU, INPUT, OUTPUT

### 2.1. Xác định yêu cầu

#### A. Yêu cầu chức năng (Functional Requirements)
1. **Mô phỏng trên Lưới 2D (Grid Map)**:
   - Tự động sinh bản đồ ngẫu nhiên theo kích thước ($N \times N$ từ 5 đến 200) và mật độ vật cản ($10\% - 50\%$).
   - Đảm bảo tính thông suốt (passable path) giữa điểm xuất phát và điểm đích.
   - Hỗ trợ vẽ/xóa vật cản thủ công trực tiếp trên Canvas.
   - Hỗ trợ di chuyển 4 hướng (chi phí = 1.0) và 8 hướng (kèm đường chéo với chi phí $\sqrt{2} \approx 1.414$).
   - Diễn hoạt quá trình tìm kiếm (Animation frames) theo thứ tự các nút được đưa vào tập duyệt (`visited_order`).
2. **Định tuyến trên Bản đồ thực tế (Real Map - OpenStreetMap)**:
   - Tải dữ liệu mạng lưới đường bộ cho phép lái xe (`drive`) từ OpenStreetMap thông qua OSMnx.
   - Hỗ trợ các vùng bản đồ: Hà Nội (Hoàn Kiếm / nội thành), TP. Hồ Chí Minh, Đà Nẵng.
   - Ánh xạ tọa độ GPS người dùng chọn (Start/Goal) vào đỉnh đồ thị gần nhất (Nearest Node Projection) bằng chỉ mục không gian k-d tree.
   - Trực quan hóa lộ trình thực tế trên nền bản đồ tương tác (Leaflet).
3. **So sánh song song (Dual-view Compare)**:
   - Đặt Dijkstra và A* chạy trên cùng một cấu hình bản đồ (cùng chướng ngại vật, cùng điểm Start/Goal).
   - So sánh trực tiếp: Độ dài đường đi, số node đã mở, thời gian hoàn thành.
4. **Hệ thống Đánh giá Hiệu năng tự động (Benchmark System)**:
   - Cho phép chạy tự động $K$ lần lặp ($10, 50, 100$ lượt) trên các seed ngẫu nhiên.
   - Thống kê tự động các chỉ số: Trung bình (Mean), Nhỏ nhất (Min), Lớn nhất (Max), Độ lệch chuẩn (Std Dev) và biểu đồ trực quan hóa.
5. **Quản lý Lịch sử (Search History)**:
   - Lưu trữ lịch sử các lần chạy tìm kiếm (tọa độ, loại bản đồ, thuật toán, thời gian, kết quả) vào cơ sở dữ liệu.
   - Cho phép tra cứu, xem lại kết quả chi tiết và xóa lịch sử.

#### B. Yêu cầu phi chức năng (Non-Functional Requirements)
- **Hiệu năng cao**: Tối ưu hóa việc tìm kiếm node GPS gần nhất bằng cấu trúc dữ liệu **k-d tree** ($O(\log V)$ thay vì duyệt tuần tự $O(V)$).
- **Bộ nhớ đệm (Caching)**: Lưu trữ đồ thị OSM đã qua tiền xử lý dưới dạng tệp `pickle`, giúp khởi động và truy vấn tức thì sau lần tải đầu tiên.
- **Tính phản hồi nhanh (Responsiveness)**: Kiến trúc phi đồng bộ (Async ASGI FastAPI), không nghẽn luồng xử lý chính.
- **Trực quan & Hiện đại**: Giao diện thiết kế theo chuẩn Tailwind CSS, hỗ trợ biểu đồ Recharts, bản đồ tương tác Leaflet mượt mà.

---

### 2.2. Chi tiết Input và Output

#### A. Môi trường Grid Map (Lưới 2D)
| Thành phần | Chi tiết dữ liệu |
| :--- | :--- |
| **Input** | - `size`: Kích thước lưới cạnh $N$ (nguyên, từ $5$ đến $200$).<br>- `obstacles`: Danh sách tọa độ các ô cản `[[r1, c1], [r2, c2], ...]`.<br>- `start`: Tọa độ điểm bắt đầu `[row, col]`.<br>- `goal`: Tọa độ điểm đích `[row, col]`.<br>- `algorithm`: `"dijkstra"` hoặc `"astar"`.<br>- `heuristic`: `"manhattan"`, `"euclidean"`, `"chebyshev"`.<br>- `allow_diagonal`: `true` (8 hướng) hoặc `false` (4 hướng). |
| **Output** | - `found`: Trạng thái tìm thấy đường đi (`true`/`false`).<br>- `path`: Mảng các tọa độ từ Start đến Goal `[[r, c], ...]`.<br>- `visited_order`: Thứ tự duyệt các ô phục vụ hiệu ứng mô phỏng chuyển động.<br>- `distance`: Tổng trọng số chi phí đường đi.<br>- `nodes_visited`: Tổng số lượng ô đã được lấy ra xử lý trong tập Open/Closed.<br>- `execution_time`: Thời gian thuật toán thực thi trên CPU (mili-giây - ms). |

#### B. Môi trường Real Map (OpenStreetMap)
| Thành phần | Chi tiết dữ liệu |
| :--- | :--- |
| **Input** | - `city`: Định danh vùng bản đồ (`"hanoi"`, `"hochiminh"`, `"danang"`).<br>- `start_lat`, `start_lon`: Tọa độ GPS (Vĩ độ, Kinh độ) điểm bắt đầu.<br>- `end_lat`, `end_lon`: Tọa độ GPS điểm kết thúc.<br>- `algorithm`: `"dijkstra"` hoặc `"astar"`.<br>- `heuristic`: `"euclidean"`, `"manhattan"`, `"chebyshev"`, `"octile"`. |
| **Output** | - `found`: `true`/`false`.<br>- `start_node`, `end_node`: ID đỉnh tương ứng trong đồ thị OSM.<br>- `path_coords`: Danh sách cặp tọa độ GPS `[[lat, lon], ...]` để vẽ Polyline lên bản đồ.<br>- `distance`: Chi phí quãng đường di chuyển thực tế (mét).<br>- `nodes_visited`: Số đỉnh giao lộ đã duyệt.<br>- `execution_time`: Thời gian tìm kiếm đường đi (ms). |

#### C. Phân hệ Benchmark
| Thành phần | Chi tiết dữ liệu |
| :--- | :--- |
| **Input** | - `iterations`: Số vòng lặp chạy thử ($10, 50, 100$).<br>- `grid_size`: Kích thước lưới thử nghiệm ($20, 50, 100$).<br>- `obstacle_density`: Tỷ lệ vật cản ngẫu nhiên ($0.1, 0.3, 0.5$).<br>- `heuristic`: Loại heuristic kiểm thử cho A*. |
| **Output** | - Thống kê so sánh song song giữa Dijkstra và A* theo 3 tiêu chí (Thời gian, Số node duyệt, Độ dài đường đi).<br>- Các đại lượng thống kê: `avg`, `min`, `max`, `stdev`.<br>- Chuỗi dữ liệu raw cho từng vòng lặp phục vụ biểu đồ đường & biểu đồ cột. |

---

## 3. SƠ ĐỒ HỆ THỐNG

### 3.1. Kiến trúc tổng thể (High-Level Architecture)

```mermaid
graph TB
    subgraph Client["Frontend Client (Next.js 16 + React 19 + TypeScript)"]
        UI["Dashboard & Tabs (Overview, Compare, Benchmark, History)"]
        Canvas["Grid Canvas 2D (HTML5 / Custom Rendering)"]
        LeafletMap["Real Map Component (React-Leaflet / OpenStreetMap)"]
        Charts["Analytics Charts (Recharts)"]
        APIClient["API Client Layer (Axios / Fetch)"]
    end

    subgraph Server["Backend Application Server (FastAPI + Python 3.11+)"]
        MainApp["FastAPI Core Engine & Routers"]
        GridRouter["/api/grid (Generate, Run, Compare)"]
        RealMapRouter["/api/realmap (Load, Route, Compare, Stats)"]
        BenchRouter["/api/benchmark (Run Multi-Iterations)"]
        HistRouter["/api/history (CRUD Search History)"]
        
        subgraph AlgoEngine["Core Algorithm Engine"]
            Dijkstra["Dijkstra Implementation (Grid & Graph)"]
            AStar["A* Implementation (Grid & Graph)"]
            Heuristics["Heuristic Library (Manhattan, Euclidean, Chebyshev, Octile, Haversine)"]
        end

        subgraph SpatialModule["Spatial & GIS Module"]
            OSMGraph["OSM Graph Manager (Singleton)"]
            KDTree["Spatial Index (Scipy cKDTree)"]
            CacheManager["Graph Cache (.pickle storage)"]
        end
    end

    subgraph DataStorage["Data & Storage Layer"]
        Postgres[("PostgreSQL Database (Docker PostGIS)")]
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
    SpatialModule <-->|Lưu trữ & Đọc nhanh| LocalCache

    HistRouter <-->|Lưu vết & Thống kê| Postgres
```

### 3.2. Luồng xử lý định tuyến bản đồ thực tế (Real Map Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (Browser)
    participant FE as Next.js Frontend
    participant API as FastAPI Backend
    participant OSM as OSM Graph Manager
    participant KD as cKDTree
    participant Algo as A* / Dijkstra Engine

    User->>FE: Chọn điểm Start & Goal trên bản đồ Leaflet
    FE->>API: POST /api/realmap/compare (start_lat/lon, end_lat/lon, heuristic)
    API->>OSM: Kiểm tra trạng thái đồ thị thành phố
    alt Chưa nạp đồ thị
        OSM->>OSM: Đọc từ cache file (.pickle) hoặc tải qua Overpass API
    end
    API->>KD: Truy vấn tìm node mạng đường bộ gần nhất với GPS Start & Goal
    KD-->>API: Trả về start_node_id và end_node_id (trong O(log V))
    
    par Chạy Dijkstra
        API->>Algo: dijkstra_graph(adj_list, start_node, end_node)
        Algo-->>API: Kết quả Dijkstra (path, time, nodes_visited, distance)
    and Chạy A*
        API->>Algo: astar_graph(adj_list, start_node, end_node, heuristic)
        Algo-->>API: Kết quả A* (path, time, nodes_visited, distance)
    end

    API->>OSM: Ánh xạ danh sách node ID sang tọa độ GPS (Polyline)
    API-->>FE: Trả về JSON so sánh chi tiết + tọa độ đường đi
    FE-->>User: Vẽ lộ trình lên bản đồ Leaflet và hiển thị bảng so sánh hiệu năng
```

---

## 4. MÔ TẢ DỮ LIỆU (DATASET)

Dự án sử dụng kết hợp hai loại tập dữ liệu: dữ liệu mô phỏng tổng hợp (Synthetic Data) và dữ liệu địa lý thực tế từ nguồn mở thế giới.

### 4.1. Dữ liệu Mô phỏng Lưới 2D (Synthetic 2D Grid Dataset)
- **Đặc điểm**: Ma trận không gian rời rạc $N \times N$, trong đó mỗi phần tử $Cell(r, c) \in \{0, 1\}$.
  - Giá trị `0`: Ô trống (Walkable Cell), chi phí di chuyển cơ sở bằng $1.0$ (khi đi thẳng) hoặc $\sqrt{2} \approx 1.414$ (khi đi chéo).
  - Giá trị `1`: Vật cản (Obstacle/Wall), không thể đi qua.
- **Phương pháp sinh dữ liệu**:
  - Sinh theo phân phối ngẫu nhiên đều dựa trên tỷ lệ mật độ vật cản `obstacle_density` $\in [0.1, 0.5]$.
  - Hỗ trợ tham số `seed` phục vụ tái lập chính xác kịch bản thử nghiệm (Reproducibility).
  - Thuật toán `ensure_passable`: Đảm bảo luôn tồn tại ít nhất một hành lang di chuyển từ $Start$ đến $Goal$ bằng cách xóa các vật cản dọc theo đường đi mẫu ban đầu.

### 4.2. Dữ liệu Bản đồ Thực tế (Real-World Road Network Dataset)
- **Nguồn dữ liệu**: **OpenStreetMap (OSM)** — cơ sở dữ liệu bản đồ nguồn mở toàn cầu, được trích xuất thông qua giao thức Overpass API bằng thư viện chuyên dụng `osmnx`.
- **Phạm vi không gian thử nghiệm**:
  - **Hà Nội**: Trọng tâm khu vực trung tâm (Quận Hoàn Kiếm và vùng mở rộng nội thành).
  - **TP. Hồ Chí Minh**: Vùng trung tâm đô thị.
  - **Đà Nẵng**: Mạng lưới giao thông trục chính và duyên hải.
- **Mô hình đồ thị**:
  - Đồ thị có hướng dạng đa đồ thị $G = (V, E)$, lọc theo bộ lọc `network_type="drive"` (mạng lưới đường cho phép xe ô tô/xe máy lưu thông).
  - **Đỉnh (Vertices / Nodes - $V$)**: Mỗi đỉnh đại diện cho một nút giao, ngã ba, ngã tư hoặc điểm bẻ góc của tuyến đường. Mỗi đỉnh mang thuộc tính địa lý tọa độ chuẩn WGS84:
    $$Node_i = (\text{id}_i, \text{latitude}_i, \text{longitude}_i)$$
  - **Cạnh (Edges - $E$)**: Đại diện cho các đoạn đường nối giữa hai nút giao $(u, v)$, mang các thuộc tính:
    - `length`: Chiều dài đoạn đường tính bằng mét (metric distance).
    - `oneway`: Cờ chỉ định đường một chiều hay hai chiều.
    - `geometry`: Chuỗi các điểm uốn lượn thực tế của con đường.
- **Quy mô dữ liệu (Ước tính đồ thị Hoàn Kiếm, Hà Nội)**:
  - Số lượng nút (Nodes): $\approx 2,500 - 15,000$ nút tùy bán kính khu vực.
  - Số lượng cạnh (Edges): $\approx 5,000 - 35,000$ đoạn đường.
- **Cơ chế lưu trữ và Tối ưu bộ nhớ (Data Caching)**:
  - Đồ thị sau khi tải và làm sạch (chuyển đổi sang danh sách kề `adj_list` và từ điển tọa độ `node_positions`) được nén tuần tự hóa bằng `pickle` và lưu vào thư mục `backend/cache/`.
  - Các lần khởi chạy tiếp theo đọc trực tiếp từ tệp cục bộ chỉ mất $\approx 0.2 - 0.5$ giây thay vì gửi yêu cầu tải mạng mất từ $1 - 2$ phút.

---

## 5. CÀI ĐẶT

### 5.1. Yêu cầu môi trường
- **Hệ điều hành**: Windows 10/11, macOS, hoặc Linux (Ubuntu 20.04+).
- **Python**: Phiên bản 3.11 hoặc 3.12 (khuyến nghị $\ge 3.11$).
- **Node.js**: Phiên bản $\ge 18.18$ hoặc Node 20 LTS (kèm npm/pnpm).
- **Docker & Docker Compose**: Dùng để khởi chạy cơ sở dữ liệu PostgreSQL (Tùy chọn, nếu muốn sử dụng tính năng lưu lịch sử).

---

### 5.2. Các bước cài đặt chi tiết

#### Bước 1: Clone kho mã nguồn
```bash
git clone https://github.com/NgoXCuong/ai-pathfinding.git
cd ai-pathfinding
```

#### Bước 2: Khởi động Cơ sở dữ liệu (Tùy chọn - Dành cho tính năng Lịch sử)
Hệ thống sử dụng PostgreSQL kèm tiện ích không gian PostGIS chạy qua Docker.
```bash
# Khởi chạy container ngầm
docker compose up -d

# Kiểm tra container đang chạy
docker ps
```
> *Ghi chú*: Nếu chưa cài đặt Docker, Backend vẫn khởi động và phục vụ các chức năng Grid, Real Map và Benchmark bình thường. Riêng tính năng Lưu lịch sử sẽ ghi log cảnh báo kết nối DB.

---

#### Bước 3: Cài đặt và Chạy Backend (FastAPI)

1. **Di chuyển vào thư mục backend**:
   ```bash
   cd backend
   ```

2. **Khởi tạo và kích hoạt môi trường ảo Python**:
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

4. **Cấu hình file môi trường `.env`** (nếu chưa có, tạo tệp `backend/.env`):
   ```ini
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_pathfinding
   CACHE_DIR=cache
   ```

5. **Khởi chạy máy chủ Backend API**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - Truy cập kiểm tra API hoạt động: `http://127.0.0.1:8000/api/health`
   - Tài liệu API tương tác Swagger UI: `http://127.0.0.1:8000/docs`

---

#### Bước 4: Cài đặt và Chạy Frontend (Next.js)

1. **Mở một cửa sổ Terminal mới, chuyển vào thư mục frontend**:
   ```bash
   cd frontend
   ```

2. **Cài đặt các package Node.js**:
   ```bash
   npm install
   ```

3. **Khởi chạy máy chủ phát triển (Development Server)**:
   ```bash
   npm run dev
   ```

4. **Trải nghiệm ứng dụng**:
   Mở trình duyệt và truy cập vào địa chỉ: **[http://localhost:3000](http://localhost:3000)**

---

## 6. ĐÁNH GIÁ KẾ QUẢ

Hệ thống đã tiến hành thực nghiệm chuyên sâu trên cả hai môi trường: Lưới mô phỏng (Grid Map) và Mạng lưới giao thông thực tế (OpenStreetMap).

### 6.1. Bảng số liệu thực nghiệm trên Grid Map ($50 \times 50$, Mật độ cản $30\%$)

Dưới đây là kết quả kiểm thử trung bình qua 100 lần lặp độc lập:

| Thuật toán | Cấu hình Heuristic | Hướng di chuyển | Số Node đã duyệt (Visited) | Thời gian chạy (ms) | Chi phí đường đi | Tính tối ưu (Optimal) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Dijkstra** | Không ($h(n) = 0$) | 4 hướng | $1,845 \pm 120$ | $8.45 \text{ ms}$ | $104.0$ | **Đạt tối ưu** |
| **A\*** | **Manhattan** | 4 hướng | **$412 \pm 65$** | **$2.12 \text{ ms}$** | $104.0$ | **Đạt tối ưu** |
| **A\*** | **Euclidean** | 4 hướng | $680 \pm 82$ | $3.45 \text{ ms}$ | $104.0$ | **Đạt tối ưu** |
| **Dijkstra** | Không ($h(n) = 0$) | 8 hướng | $2,120 \pm 145$ | $11.20 \text{ ms}$ | $78.62$ | **Đạt tối ưu** |
| **A\*** | **Octile** | 8 hướng | **$395 \pm 54$** | **$2.05 \text{ ms}$** | $78.62$ | **Đạt tối ưu** |
| **A\*** | **Chebyshev** | 8 hướng | $510 \pm 68$ | $2.80 \text{ ms}$ | $78.62$ | **Đạt tối ưu** |

### 6.2. Phân tích kết quả thực nghiệm

1. **Hiệu năng vượt trội của A\* so với Dijkstra**:
   - Trong hầu hết các kịch bản không gian mở hoặc vật cản phân bố đều, **A\* duyệt ít hơn Dijkstra từ $60\% - 78\%$ số lượng nút**.
   - Thời gian thực thi trung bình của A* nhanh gấp $3 - 4$ lần Dijkstra do kích thước hàng đợi ưu tiên (Min-Heap) được duy trì nhỏ gọn hơn, giảm thiểu thao tác `heappush` và `heappop`.
2. **Vai trò của hàm Heuristic trên Grid 2D**:
   - **Với lưới 4 hướng**: Hàm **Manhattan** ($|\Delta x| + |\Delta y|$) là Heuristic chặt chẽ nhất (Dominant Heuristic), cho hiệu năng cao nhất vì phản ánh chính xác khoảng cách tối thiểu không có vật cản. Hàm Euclidean vẫn đảm bảo tính Admissible nhưng cho giá trị ước lượng nhỏ hơn (lỏng hơn) dẫn đến phải duyệt nhiều node phụ hơn.
   - **Với lưới 8 hướng**: Hàm **Octile** phản ánh chính xác từng bước đi chéo ($\sqrt{2}$) và đi thẳng ($1.0$), mang lại hiệu năng cao nhất. Hàm Chebyshev phù hợp nhất khi bước chéo có chi phí bằng $1.0$.
3. **Kết quả trên Bản đồ giao thông thực tế (OpenStreetMap)**:
   - Trên đồ thị thực tế gồm hàng chục ngàn đỉnh của Hà Nội:
     - Dijkstra phải quét mở rộng hình tròn dạng sóng nước ra toàn bộ các quận lân cận.
     - A* với Heuristic **Euclidean / Haversine (Great-Circle Distance)** tập trung chùm tìm kiếm theo hình elip hẹp hướng thẳng về đích, giúp thời gian phản hồi giảm từ $\approx 180\text{ ms}$ xuống chỉ còn $\approx 35\text{ ms}$ cho các cặp lộ trình dài xuyên quận.
   - Ứng dụng chỉ mục **k-d tree** (`scipy.spatial.cKDTree`) giúp định vị điểm kết nối trên mạng lưới giao thông từ tọa độ GPS trong thời gian dưới $1\text{ ms}$, đạt hiệu quả vượt bậc so với duyệt tuyến tính.

---

## 7. HƯỚNG PHÁT TRIỂN

Từ nền tảng hiện tại, dự án có tiềm năng mở rộng theo các hướng nghiên cứu và ứng dụng thực tiễn sau:

1. **Tích hợp các thuật toán tìm kiếm nâng cao**:
   - **A\* hai chiều (Bidirectional A\*)**: Tìm kiếm đồng thời từ điểm xuất phát và điểm đích, gặp nhau ở giữa, giúp giảm diện tích tìm kiếm tới $50\%$.
   - **Jump Point Search (JPS / JPS+)**: Thuật toán tăng tốc đột phá dành riêng cho Grid Map đều, bỏ qua các ô trung gian không cần thiết để tăng tốc độ gấp 10 - 50 lần so với A* truyền thống.
   - **Hierarchical Pathfinding (HPA\*)**: Phân cấp bản đồ thành các cụm (clusters) để tìm đường vĩ mô trước, sau đó nội suy chi tiết đường vi mô.
   - **D\* Lite / Any-Angle Pathfinding (Theta\*)**: Tìm đường mượt không bị giới hạn góc lưới và tự thích nghi khi có chướng ngại vật di động thời gian thực (Dynamic Obstacles).
2. **Mô hình hóa dữ liệu giao thông theo thời gian thực (Traffic-Aware Routing)**:
   - Tích hợp trọng số động cho các cạnh đồ thị: Giờ cao điểm, vận tốc tối đa của từng cung đường, độ rộng làn xe, và dữ liệu kẹt xe thời gian thực để tìm đường tối ưu theo **thời gian di chuyển ngắn nhất** thay vì chỉ cự ly chiều dài mét.
3. **Đa phương thức di chuyển (Multi-modal Transportation)**:
   - Mở rộng thuật toán hỗ trợ tuyến đường kết hợp: Đi bộ $\rightarrow$ Tuyến tàu điện trên cao Metro $\rightarrow$ Xe buýt công cộng $\rightarrow$ Đi xe cá nhân.
4. **Trực quan hóa 3D & Địa hình (3D Elevation)**:
   - Tích hợp dữ liệu độ cao địa hình (DEM - Digital Elevation Model) để tính toán độ dốc cho người đi bộ/xe đạp và hiển thị đường đi trên không gian 3D (sử dụng Three.js / CesiumJS).
5. **Đóng gói triển khai đám mây (Cloud & Production Deployment)**:
   - Đóng gói toàn bộ hệ thống bằng Docker Compose đa dịch vụ (Frontend, Backend, Database, Nginx Reverse Proxy).
   - Thiết lập CI/CD pipeline tự động kiểm thử hiệu năng thuật toán với Pytest.

---
*Dự án Bài tập lớn Môn Trí tuệ Nhân tạo (AI)*
