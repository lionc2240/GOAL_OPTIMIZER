# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
**Dự án:** Web Ứng dụng Theo dõi & Tối ưu Lộ trình Tài chính (Financial Goal Tracker)  
**Phiên bản:** 1.1 (Decentralized Engine Update)  
**Ngày cập nhật:** 25/02/2026

---

## 1. GIỚI THIỆU
### 1.1. Mục đích
Xây dựng ứng dụng web đơn trang (SPA) giúp người dùng thiết lập mục tiêu tài chính, mô phỏng lộ trình tích lũy (Theory) và thực hiện theo dõi tiến độ (Momentum) một cách độc lập. Hệ thống cung cấp cái nhìn đối chiếu giữa kế hoạch lý thuyết và thực tế thông qua biểu đồ hợp nhất (Unified Dashboard).

### 1.2. Phạm vi
*   **Nền tảng:** Web Application (SPA).
*   **Công nghệ:** HTML5, Vanilla JavaScript, Tailwind CSS, Chart.js.
*   **Lưu trữ:** Local Storage (Trình duyệt client).
*   **Triết lý thiết kế:** Glassmorphism, Dark Mode, Zero-Flicker performance.

---

## 2. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

### 2.1. Kiến trúc Động cơ Kép (Independent Engines)
*   **FR-01: Simulation Lab (Theory):** Một phân vùng độc lập để người dùng thử nghiệm các kịch bản "Nếu-Thì".
    *   Sở hữu `Target Amount` và `Target Days` riêng.
*   **FR-02: Tracking Matrix (Reality):** Một phân vùng thực thi để ghi chép dữ liệu thực tế.
    *   Sở hữu `Target Amount` và `Target Days` riêng biệt hoàn toàn với Simulation.

### 2.2. Thiết lập Mục tiêu (Goal Configuration)
*   **FR-03: Nhập liệu Linh hoạt:**
    *   Số tiền mục tiêu: Thanh trượt (Slider) step 2.000 VNĐ kết hợp ô nhập số chính xác.
    *   Số ngày mục tiêu: Thanh trượt từ 1-365 ngày.
    *   *Ràng buộc:* Tối thiểu 2.000 VNĐ và 1 ngày.

### 2.3. Lập Kế hoạch & Phân vùng (Block Management)
*   **FR-04: Phân chia Velocity Blocks:** Chia lộ trình thành các khối dữ liệu (tuần).
*   **FR-05: Simulation Velocity:** Điều chỉnh tổng tiền mỗi khối để tính toán `Speed (VNĐ/ngày)` dự kiến.
*   **FR-06: Tracking Strive Targets:** Cho phép người dùng đặt mục tiêu tích lũy ("Strive Target") cho từng khối trong Tracking để điều hướng đường dự phóng thực tế.

### 2.4. Ghi chép Momentum (Daily Capture)
*   **FR-07: K-Unit System:** Nhập liệu rút gọn theo đơn vị nghìn (K). Ví dụ: Nhập `50` -> Lưu `50.000 VNĐ`.
*   **FR-08: Daily Striving Hints:** Hiển thị gợi ý tích lũy mỗi ngày (Hover Hint) dựa trên `Strive Target` của khối tương ứng.
*   **FR-09: Thước đo MIN:** Hiển thị chỉ số `MIN / BLOCK` dựa trên mục tiêu tổng của Tracking để người dùng định hướng.

### 2.5. Phân tích Hợp nhất (Unified Analytics)
*   **FR-10: Unified Chart:** Một biểu đồ trung tâm hiển thị đồng thời:
    *   Đường Kế hoạch (Simulated Path - Blue).
    *   Đường Thực tế (Actual Momentum - Emerald).
    *   Đường Dự phóng (Real Projection - Emerald Dashed).
    *   Đường Mục tiêu (Sim vs Act Target Lines).
*   **FR-11: Dynamic Chart Zoom & Padding:**
    *   Biểu đồ tự động co giãn X-axis theo `Target Days` lớn nhất đang hoạt động.
    *   Thêm 10% vùng đệm (Padding) ở cuối biểu đồ để tránh cảm giác chật chội.
*   **FR-12: Vertical Deadline Markers:** Kẻ vạch dọc (Dashed Line) đánh dấu chính xác ngày hết hạn của Simulation và Tracking.

### 2.6. Logic Tính toán (Core Logic)
*   **FR-13: Projection Logic:** Đường dự phóng thực tế được tính toán dựa trên `Strive Targets` của các khối tương lai. Nếu không có `Strive Target`, sử dụng tốc độ trung bình cần thiết.
*   **FR-14: Early/Overdue Handling:** Hệ thống tự động bù trừ ngày nếu đạt mục tiêu sớm hoặc quá hạn (tương tự v1.0).

---

## 3. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 3.1. Trải nghiệm người dùng (UX/Performance)
*   **Zero-Flicker Engineering:** Sử dụng cập nhật DOM bộ phận (Surgical Updates) để giữ tiêu điểm (Focus) khi người dùng nhập lịch.
*   **Aesthetics:** Dark mode, hiệu ứng sương mờ (Glassmorphism), màu sắc tương phản cao (Indigo/Emerald).
*   **Responsiveness:** Hoạt động tốt trên màn hình từ 375px trở lên.

### 3.2. Bảo mật & Lưu trữ
*   **Privacy:** Toàn bộ dữ liệu nằm trên thiết bị người dùng (LocalStorage).
*   **Reset:** Nút "Soft Termination" để xóa sạch dữ liệu và bắt đầu lại.

---

## 4. QUY TRÌNH DỮ LIỆU (DATA INTEGRITY)

1.  **Input:** User nhập Daily Value (K) -> UI tự động nhân 1000.
2.  **Calculation:** Engine lấy Daily Data + Strive Targets -> Generate Projection Path.
3.  **Visualization:** Chart.js render Unified View -> Dynamic X-axis Scaling -> Vertical Deadlines Draw.
4.  **Persistence:** Toàn bộ `state` JSON-stringified vào LocalStorage.