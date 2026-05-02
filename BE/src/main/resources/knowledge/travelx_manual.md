# CẨM NANG HỆ THỐNG TRAVELX

## 1. TÀI KHOẢN & BẢO MẬT
- Mật khẩu phải có tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số.
- Mã OTP xác thực có hiệu lực trong 5 phút.
- Người dùng cần xác thực email trước khi sử dụng các tính năng giao dịch.
- Để đặt tour, người dùng cần cập nhật Số điện thoại và Mã PIN thanh toán trong trang thông tin cá nhân.
- Mỗi người dùng chỉ được sở hữu một tài khoản duy nhất trên hệ thống.

## 2. VÍ ĐIỆN TỬ & THANH TOÁN
- Mỗi tài khoản có 1 ví điện tử nội bộ dùng để thanh toán và nhận hoàn tiền.
- Thanh toán tour qua cổng VNPay (hỗ trợ quét mã QR và thẻ ngân hàng).
- Hệ thống áp dụng mô hình Escrow (Ký quỹ): khách thanh toán 100% khi đặt tour, hệ thống giữ tiền và chỉ giải ngân cho Hướng dẫn viên sau khi tour hoàn thành.
- Tiền hoàn trả khi hủy tour sẽ được cộng trực tiếp vào ví nội bộ của người dùng.

## 3. QUY TRÌNH ĐẶT TOUR (BOOKING)
- Sau khi nhấn đặt tour, khách có 10 phút để thực hiện thanh toán. Nếu quá thời hạn, đơn đặt sẽ tự động bị hủy để giải phóng chỗ.
- Trạng thái đơn đặt tour: 
  + AWAITING_DEPOSIT: Chờ thanh toán.
  + PAID_FULL: Đã thanh toán 100% (Tiền đang được hệ thống giữ).
  + COMPLETED: Tour đã hoàn thành và tiền đã giải ngân.
  + CANCELLED: Đơn đã bị hủy.

## 4. CHÍNH SÁCH HỦY TOUR & HOÀN TIỀN
- Hệ thống áp dụng chính sách hoàn tiền linh hoạt dựa trên thời điểm hủy:
  + Hủy trước 48 giờ so với giờ khởi hành: Hoàn trả 100% số tiền khách đã trả.
  + Hủy từ 24 giờ đến 48 giờ trước khởi hành: Hoàn trả 50% số tiền khách đã trả.
  + Hủy dưới 24 giờ trước khởi hành: Không hoàn tiền.
- Lưu ý: Tiền phạt hủy tour (nếu có) sẽ được trích một phần để bồi thường cho Hướng dẫn viên nhằm đảm bảo quyền lợi cho họ.

## 5. YÊU CẦU TOUR TÙY CHỈNH (TOUR REQUEST)
- Khách hàng có thể đăng yêu cầu tour riêng nếu không tìm thấy tour sẵn có phù hợp.
- Thông tin cần cung cấp: Địa điểm, thời gian, số khách, ngân sách dự kiến và mô tả mong muốn.
- Các Hướng dẫn viên sẽ gửi báo giá (quote) cho yêu cầu của bạn. Bạn có thể chọn báo giá ưng ý nhất để tiến hành thanh toán 100% (Escrow).

## 6. QUY ĐỊNH ĐỐI VỚI HƯỚNG DẪN VIÊN (GUIDE)
- Để trở thành HDV, người dùng cần nộp hồ sơ gồm: CCCD/CMND, ảnh chân dung và Giấy phép hành nghề (nếu có).
- Admin sẽ phê duyệt hồ sơ trong vòng 24-48 giờ làm việc.
- Hoa hồng: HDV nhận 80% giá trị tour, hệ thống TravelX thu 20% phí dịch vụ.
- Tiền sẽ được giải ngân vào ví HDV sau 24 giờ kể từ khi tour kết thúc thành công.

## 7. ĐÁNH GIÁ & KHIẾU NẠI
- Khách hàng có thể để lại đánh giá (1-5 sao) và nhận xét sau khi tour kết thúc.
- Mọi khiếu nại về chất lượng tour phải được gửi trong vòng 24 giờ sau khi tour kết thúc.
- Admin có quyền phân xử cuối cùng dựa trên bằng chứng do cả hai bên cung cấp.

## 8. QUY TẮC ỨNG XỬ & XỬ PHẠT
- Hướng dẫn viên không được tự ý thu thêm bất kỳ khoản phụ phí nào ngoài hợp đồng đã chốt trên hệ thống.
- Các hành vi gian lận, bỏ tour không lý do sẽ bị xử phạt (trừ tiền ví) hoặc khóa tài khoản vĩnh viễn.
- Hệ thống tự động ghi nhận điểm uy tín cho cả khách hàng và hướng dẫn viên.
