# Phạm vi & giới hạn của chức năng Therapist

Về chức năng therapist, nó được xây dựng theo mô hình giống app **BetterHelp** (nền tảng đặt lịch & tham vấn tâm lý từ xa), nhưng **lược bỏ đi 2 phần quan trọng và khó nhất** của một sản phẩm thương mại thực thụ. Đây là quyết định có chủ đích để giữ đề tài trong phạm vi (scope) khả thi của một luận văn.

## 1. Không xử lý phần pháp lý, điều khoản, và cơ chế chống lạm dụng (abuse) hệ thống

App **không** đụng đến phần pháp lý cũng như các điều khoản phức tạp nhằm đảm bảo quyền lợi cân bằng giữa **3 bên**:

- **Phía User / Patient** — người đi tham vấn.
- **Phía Therapist** — người cung cấp dịch vụ (service provider).
- **Phía App provider** — nền tảng đứng giữa (chính là nhóm làm đề tài này).

App cũng **không** cover các edge case khi một bên cố tình **lạm dụng (abuse)** hệ thống để gây thiệt hại cho 2 bên còn lại. Trong một nền tảng thực tế, đây là phần cần đội ngũ pháp lý + vận hành + chăm sóc khách hàng (customer support) xử lý, và nó nằm **ngoài phạm vi (out of scope)** của luận văn vì nhóm không có nhân sự/tài nguyên để duy trì một bộ phận customer support.

Dưới đây là các kịch bản lạm dụng cụ thể mà hệ thống hiện tại **chưa có cơ chế xử lý**, phân theo bên gây ra và bên bị ảnh hưởng:

### a) Therapist lạm dụng → ảnh hưởng Patient (và uy tín App)

- **Hành vi sai trái trong buổi tham vấn**: Trong một session, therapist có thể có hành động sai trái, hoặc không bỏ tâm huyết / không nghiêm túc trong việc giúp đỡ người bệnh. Khi đó người dùng **không thể làm gì ngoài việc viết review** cho session đó — app chưa có chức năng để user **report một vi phạm** và yêu cầu customer support can thiệp.
- **No-show / hủy phút chót**: Therapist xác nhận booking rồi không tham gia, hoặc liên tục hủy sát giờ. App chỉ chặn hủy trong vòng 1 giờ trước giờ hẹn (xem B.3), nhưng **không** có cơ chế phạt, đánh dấu therapist thiếu tin cậy, hay đền bù cho patient.
- **Đưa lời khuyên nguy hiểm / vượt chuyên môn**: Không có quy trình kiểm duyệt nội dung clinical note hay nội dung buổi tham vấn; nếu therapist chẩn đoán sai hoặc khuyên điều có hại, hệ thống không phát hiện được.
- **Lạm dụng dữ liệu nhạy cảm**: Sau khi được patient cấp quyền xem diary/mood/sleep (xem PHẦN C), therapist về lý thuyết có thể chụp màn hình, lưu trữ, hoặc dùng sai dữ liệu đó. App không có audit log hiển thị cho patient hay cơ chế phát hiện việc này.

### b) Patient lạm dụng → ảnh hưởng Therapist (và uy tín App)

- **Không có kênh report**: Therapist tương tự **không thể report một hành vi vi phạm từ phía user** lên customer support (ví dụ: user có lời lẽ xúc phạm, quấy rối, hoặc hành vi không phù hợp trong buổi/khung chat).
- **Review trả thù (review bombing)**: User có thể để lại đánh giá 1 sao + bình luận sai sự thật để hạ uy tín therapist (rating hiển thị công khai ở hồ sơ — xem A.4). App không có quy trình kháng nghị (dispute) hay kiểm duyệt review.
- **No-show từ phía user / giữ chỗ rồi bỏ**: User đặt slot rồi không tham gia, làm therapist mất thời gian và chiếm slot mà patient khác có thể đã cần. Không có cơ chế ghi nhận no-show của user hay giới hạn số lần đặt-rồi-hủy.
- **Khai báo sai trong matching form**: User cố tình khai sai (tuổi, mức độ rủi ro, ý định tự hại) khiến việc ghép nối và đánh giá an toàn bị sai lệch, gây rủi ro cho chính họ và đặt therapist vào thế khó.

### c) Lạm dụng nhắm vào App provider (và gián tiếp cả 2 bên)

- **Tài khoản therapist giả mạo**: App có yêu cầu upload license + government ID khi đăng ký và có trạng thái verify (xem B.1), nhưng quy trình duyệt là thủ công và **không** có quy trình chống giả mạo giấy tờ thực sự, không tái kiểm định kỳ ngoài hạn license.
- **Đưa nhau ra ngoài nền tảng (off-platform / disintermediation)**: Một khi đã kết nối, therapist và patient có thể chuyển sang liên hệ riêng (vì app không monetize nên động cơ này còn yếu, nhưng với app có thu phí thì đây là rủi ro mất doanh thu lớn).
- **Không có ToS/Privacy Policy ràng buộc**: Vì không có điều khoản dịch vụ và chính sách dữ liệu mang tính pháp lý, App provider không được bảo vệ trước trách nhiệm pháp lý nếu xảy ra sự cố (ví dụ patient tự hại sau một buổi tham vấn).

> Tóm lại: hệ thống hiện tại tin tưởng cả 2 phía hành xử thiện chí (good-faith assumption). Cơ chế phản hồi/khắc phục duy nhất mà user có là **viết review**; therapist gần như **không có** kênh nào để tự bảo vệ. Đây là sự đánh đổi có chủ đích để tập trung vào phần lõi sản phẩm.

## 2. Không có monetization (kiếm tiền)

App của mình **không monetize** — không có dòng tiền nào chảy qua hệ thống. Đây là giới hạn cố ý nhưng cũng là một trong những phần **khó (challenging) nhất** của bất kỳ app therapist-booking nào, vì thực tế **không therapist nào làm miễn phí**: tham vấn tâm lý là dịch vụ chuyên môn, là nguồn thu nhập của họ.

Cụ thể, những thứ một nền tảng thực tế cần có nhưng app này **không** triển khai:

- **Cổng thanh toán & tính phí buổi tham vấn**: App có lưu trường `consultationFee` (phí tư vấn, đơn vị VND — xem B.1, B.9) và `creditsBalance` trong hồ sơ user, nhưng **chỉ là dữ liệu hiển thị**; không có bước thanh toán khi đặt lịch (`WaitingRoom` đặt booking ngay mà không qua trả tiền — xem A.7), không tích hợp cổng thanh toán (Momo/VNPay/Stripe...), không có ví/credit thực sự được trừ.
- **Chia doanh thu & chi trả cho therapist (payout)**: Không có cơ chế giữ tiền (escrow), tính hoa hồng nền tảng, hay chuyển khoản cho therapist sau mỗi buổi hoàn thành. Nếu không có khoản chi trả này thì **sẽ không có therapist thật nào tham gia** — đây chính là lý do app chỉ chạy được với therapist "thử nghiệm".
- **Hoàn tiền & tranh chấp tài chính (refund/dispute)**: Không có quy trình hoàn tiền khi buổi bị hủy, therapist no-show, hay chất lượng không đạt — vốn là phần gắn chặt với cơ chế chống abuse ở mục 1.
- **Hóa đơn, thuế, đối soát**: Không có xuất hóa đơn, xử lý thuế thu nhập cho therapist, hay đối soát giao dịch.

Phần monetization khó vì nó **đan xen với cả pháp lý và chống abuse** ở mục 1: thu tiền thì phải có hợp đồng, có chính sách hoàn tiền, có cơ chế xử lý tranh chấp, có nghĩa vụ thuế — kéo theo toàn bộ phần phức tạp mà luận văn đã chủ động loại bỏ. Vì vậy, app dừng ở mức **chứng minh được luồng nghiệp vụ cốt lõi (matching → booking → session → note/review) hoạt động**, chứ không phải một sản phẩm thương mại hoàn chỉnh.

## 3. Các thiếu sót & giới hạn chức năng khác so với BetterHelp

Ngoài 2 mảng lớn (pháp lý/chống-abuse và monetization) đã loại bỏ có chủ đích, app còn nhiều khoảng trống về tính năng so với một nền tảng trưởng thành như BetterHelp (và các app cùng hệ: ReGain cho couples, TeenCounseling cho thanh thiếu niên...). Liệt kê dưới đây theo nhóm, kèm hiện trạng cụ thể trong codebase.

### 3.1. Quan hệ therapist–patient: một chiều, không reconnect, không tự chọn

- **Chỉ có đúng 1 chuyên gia "đang đồng hành" tại một thời điểm**: backend trả về *một* assigned therapist (`getActiveAssignedTherapist` trả 404 nếu không có assignment `ACTIVE`, không phải danh sách). Đổi chuyên gia = vô hiệu hóa người cũ và kích hoạt người mới.
- **Không reconnect được với chuyên gia cũ**: nếu user đã đổi sang therapist mới rồi nhận ra người cũ hợp hơn, **không có cách nào quay lại** người cũ. Tính năng này đã được *scaffold nhưng vô hiệu hóa* — nút "Thay đổi về chuyên gia cũ" trong `AppointmentsHistoryScreen` chỉ là một đoạn `console.log` bị comment, và `currentTherapistId` truyền vào màn lịch sử cũng bị comment. Quan hệ assignment cũ (`INACTIVE`) không thể tái kích hoạt từ UI; con đường duy nhất là **làm lại matching form**, mà nó cũng không đảm bảo ghép đúng người cũ.
- **Không có "duyệt danh sách & tự chọn" chuyên gia (therapist directory)**: BetterHelp cho user xem nhiều hồ sơ và đổi qua lại dễ dàng. Ở đây user bị **hệ thống ghép cố định một người**; trong luồng booking không có màn duyệt danh sách để so sánh/đổi chủ động (dù backend có `getTherapists()`, luồng người dùng không dùng tới). User cũng không lọc được theo chuyên môn, giới tính, ngôn ngữ...

### 3.2. Đa nền tảng (cross-platform): mỗi bên chỉ có một mặt

- **Patient chỉ có app mobile; therapist chỉ có web console.** BetterHelp cung cấp **cả web lẫn iOS/Android cho patient** (và cũng có app cho therapist). Ở đây:
  - Patient **không có web UI** — không thể tham vấn/nhắn tin/đặt lịch từ trình duyệt máy tính.
  - Therapist **không có app mobile** — phải ngồi máy tính; không nhận push trên điện thoại để join nhanh hay trả lời chat khi di chuyển.
- Hệ quả là trải nghiệm bị khóa cứng theo thiết bị, kém linh hoạt hơn hẳn.

### 3.3. Hình thức & lịch buổi tham vấn còn hạn chế

- **Chỉ 2 hình thức**: Video (Jitsi) và Text/Chat (`AppointmentMode` = `VIDEO | TEXT | CHAT`). **Không có gọi thoại (phone-only)** và **không có buổi nhóm (group session / webinar)** — BetterHelp có cả live phone session lẫn group "groupinars" hằng tuần.
- **Mỗi lần chỉ có 1 buổi sắp tới**: `getUpcomingAppointment` trả về *một* appointment; trang chủ chỉ hiển thị một buổi. User **không đặt trước nhiều buổi** hay đặt **lịch định kỳ hằng tuần (recurring)** như BetterHelp.
- **Không reschedule tại chỗ**: muốn đổi giờ, patient phải **hủy rồi đặt lại**; therapist phải **xóa slot rồi tạo slot mới** (xem A.7, B.4). Không có nút "dời lịch" giữ nguyên buổi.
- **Múi giờ cứng (timezone)**: hệ thống giả định cố định `Asia/Ho_Chi_Minh` (+07:00, không DST) khi sinh slot (xem B.4). Không hỗ trợ therapist/patient ở múi giờ khác — một nền tảng toàn cầu như BetterHelp bắt buộc phải xử lý đa múi giờ.

### 3.4. Hạ tầng cuộc gọi & bảo mật buổi tham vấn

- **Dùng instance Jitsi công cộng `meet.jit.si`**, phòng đặt theo `umatter-<appointmentId>` (xem A.8, B.8). Đây **không phải hạ tầng riêng/được kiểm soát**: app phải *inject JS để ẩn nút đăng nhập moderator của Jitsi* và tự đóng dialog auth — tức đang "lách" giao diện của một dịch vụ bên thứ ba, không phải sở hữu lớp video.
- **Không có ghi hình/biên bản buổi (recording/transcript)**, không kiểm soát ai vào phòng ngoài việc đoán tên phòng, không đảm bảo tiêu chuẩn bảo mật/tuân thủ y tế (HIPAA-style) cho dữ liệu cuộc gọi.

### 3.5. Công cụ trị liệu giữa các buổi còn thiếu

- **Không có worksheet/bài tập về nhà (homework)/mục tiêu (goals)**: BetterHelp cho therapist giao worksheet và theo dõi tiến độ. Ở đây tính năng này *đã bị bỏ* — khối "homework" trong `ConsultationFeedbackScreen` bị comment toàn bộ.
- **Mô hình kết nối chat kiểu "kết bạn" (friend request)** thay vì kiểu phòng nhắn tin trị liệu: therapist phải **accept/decline friend request** để mở kênh (xem B.6) — đây là pattern của app mạng xã hội, không phải luồng "messaging room luôn mở với therapist của bạn" như BetterHelp.
- **Không gửi file/đính kèm trong chat**: nút kẹp giấy (Attach) ở Messages web chỉ là nút trang trí, không có xử lý đính kèm.
- **Không có thư viện nội dung / bài tập tự hướng dẫn (self-help library)**: ngoài self-tracking (diary/food/sleep/mood) mang tính nhật ký cá nhân, không có khóa học, video, hay bài thực hành có cấu trúc.

### 3.6. An toàn & xử lý khủng hoảng (safety / crisis)

- App **thu thập** cờ "ý định tự hại" trong matching form và "liên hệ khẩn cấp" trong hồ sơ, và bật dialog "Safety protocol" nhắc *therapist* khi tick risk flag (xem B.7) — **nhưng phía patient không có gì**: không hiển thị đường dây nóng (hotline) khủng hoảng, không có nút SOS/khẩn cấp, không có luồng leo thang (escalation) khi phát hiện rủi ro cao.
- BetterHelp nêu rõ "không dành cho trường hợp khẩn cấp" và **chủ động đưa tài nguyên khủng hoảng**; app hiện chưa có lớp an toàn này cho người dùng.

### 3.7. Thông báo, nhắc lịch & tích hợp

- **Thông báo kiểu tất-cả-hoặc-không**: Settings ghi rõ chưa có toggle theo từng loại; user/therapist nhận mọi loại noti hoặc không (xem B.9).
- **Không nhắc lịch chủ động / đồng bộ calendar**: không có reminder cấu hình được trước buổi, không export/đồng bộ Google Calendar, iCal...
- Cửa sổ "Join" chỉ mở 10 phút trước giờ hẹn (A.7, B.2/B.3) nhưng không có chuỗi nhắc (email/push) dẫn người dùng tới đúng thời điểm đó.

### 3.8. Phân khúc dịch vụ chuyên biệt & cá nhân hóa

- **Không có các vertical chuyên biệt**: BetterHelp tách couples (ReGain), thanh thiếu niên có **quy trình đồng ý của phụ huynh** (TeenCounseling), theo tín ngưỡng, theo cộng đồng LGBTQ+... Dù app có role `TEEN`/`PARENT` và trường `school` (hướng tới học sinh/sinh viên), nó **không** có luồng đồng ý phụ huynh cho việc đặt buổi, cũng không có buổi cho cặp đôi/gia đình nhiều người tham gia.
- **Ghép nối/cá nhân hóa nông**: matching form (8 bước) chạy một lần để gán người; không **ghép theo ngôn ngữ** (dù therapist có trường `languages`), không tinh chỉnh lại theo phản hồi sau buổi, không học từ rating để cải thiện gợi ý.

### 3.9. Vận hành & đo lường kết quả

- **Không có giao diện admin/kiểm duyệt** trong phạm vi codebase này (liên quan trực tiếp tới phần chống-abuse ở mục 1): không có nơi để duyệt báo cáo, gỡ review xấu, hay quản lý tài khoản vi phạm.
- **Không đo lường kết quả lâm sàng (outcome measurement)**: không có thang đo chuẩn hóa lặp lại (PHQ-9, GAD-7...) để theo dõi tiến triển của patient theo thời gian, dù matching form có hỏi mức cảm xúc một lần duy nhất.

> Những giới hạn ở mục 3 phần lớn là **đánh đổi về phạm vi (scope)** của một luận văn, không phải lỗi: app tập trung chứng minh **luồng cốt lõi** (ghép nối → đặt lịch → tham vấn video/chat → ghi chú & đánh giá) chạy được đầu-cuối, và chấp nhận lược bỏ các tầng tính năng nâng cao mà một sản phẩm thương mại nhiều năm tuổi như BetterHelp đã tích lũy.

---

Sau đây là phần miêu tả những gì phía user có thể làm được đối với chức năng therapist thông qua D:\Y4-Sem 2 Thesis\thesis-mobile\src\screens\booking
Sau đây là phần miêu tả những gì phía therapist có thể làm được thông qua therapist-web-ui

---

# PHẦN A — Phía User / Patient (app mobile, thư mục `src/screens/booking`)

Toàn bộ trải nghiệm đặt lịch của người dùng nằm trong 9 màn hình. Luồng chính đi từ ghép nối → xem chuyên gia → đặt lịch → phòng chờ → buổi tham vấn → đánh giá.

## A.1. Luồng tổng quát

```
MatchingForm → (hệ thống ghép chuyên gia) → TherapistBookingLanding
   → TherapistDetail → Booking (chọn ngày/giờ) → ConsultationDetail (lí do + hình thức)
   → WaitingRoom (XÁC NHẬN đặt lịch) → VideoConsultation / Chat → ConsultationFeedback (đánh giá)
```

## A.2. Ghép nối chuyên gia — `MatchingFormScreen`

- Bảng câu hỏi 8 bước (progress bar) để hệ thống đề xuất chuyên gia phù hợp:
  1. Đã từng đi tham vấn chưa (chưa / có nhưng không hiệu quả / có và hiệu quả).
  2. Giới tính + tuổi.
  3. Xu hướng tính dục.
  4. Có ưu tiên chuyên gia thuộc cộng đồng LGBTQ+ không.
  5. Có suy nghĩ tự làm hại bản thân không (cờ an toàn).
  6. Lí do tìm đến (lo âu, trầm cảm, stress, mất ngủ, mối quan hệ, sang chấn, rối loạn ăn uống — chọn nhiều).
  7. Thang đo cảm xúc 1–5 (lo âu, mất hứng thú, mệt mỏi).
  8. Phong cách giao tiếp mong muốn (người lắng nghe / người định hướng / kết hợp).
- Mỗi bước có ràng buộc bắt buộc trước khi qua bước kế (`canProceed`). Submit gọi `saveMatchingData(formData)` rồi quay về tab Therapist.
- Đây chính là dữ liệu "Matching form" mà therapist xem được ở phía web (mục B.5).

## A.3. Trang chủ chuyên gia — `TherapistBookingLanding`

Tổng hợp 3 khối dữ liệu (`getActiveAssignedTherapist`, `getUpcomingAppointment`, `getUnreviewedAppointments`), tự refresh và kéo-để-tải-lại:

- **Chuyên gia đang đồng hành**: avatar, tên, chuyên môn, địa điểm. Nếu chưa có thì hiển thị card rỗng mời hoàn tất bảng ghép nối.
- **Buổi hẹn sắp tới**: hình thức (Video/Chat), badge trạng thái, ngày/giờ, đếm ngược tương đối ("trong N phút/giờ/ngày nữa"). CTA đổi theo trạng thái: `REQUESTED` → "Xem yêu cầu"; `UPCOMING`/`IN_PROGRESS` → "Vào phòng chờ".
- **Buổi chờ đánh giá**: danh sách các buổi đã hoàn thành chưa review, bấm vào mở màn đánh giá.
- Nút dưới chân: "Lịch sử tham vấn", "Tôi muốn đổi chuyên gia" (chỉ hiện khi có chuyên gia và không có buổi sắp tới), "Trò chuyện với chuyên gia".

## A.4. Hồ sơ chuyên gia — `TherapistDetailScreen`

- Header, avatar, tên, chuyên môn, địa điểm.
- 4 chỉ số: số bệnh nhân, số năm kinh nghiệm, rating trung bình, số lượt đánh giá.
- Phần giới thiệu (bio), giờ làm việc (từ template availability của therapist), và danh sách **đánh giá** của bệnh nhân khác (sao + bình luận) — đây là nơi review từ phía user hiển thị.
- Nút "Đặt lịch hẹn" (ẩn nếu mở từ một appointment đã có).

## A.5. Chọn lịch — `BookingScreen`

- Lịch tháng (`react-native-calendars`) chỉ cho chọn ngày có slot trống; các ngày không có slot bị disable; chặn điều hướng quá tháng có slot xa nhất.
- `getTherapistAvailableSlots` trả các slot trống, gom theo ngày; chọn ngày → hiện lưới khung giờ (start–end).
- Chọn 1 khung giờ rồi "Xác nhận" → sang `ConsultationDetail`, mang theo `slotId`, `slotStartDatetime`.

## A.6. Chi tiết buổi tham vấn — `ConsultationDetailScreen`

- Nhập **lí do/mô tả** (free text, sẽ hiển thị cho therapist ở "Patient's stated reason").
- Chọn **hình thức**: Video hoặc Chat.
- "Xác nhận" → sang `WaitingRoom` (lúc này vẫn **chưa** tạo booking).

## A.7. Phòng chờ + xác nhận đặt lịch — `WaitingRoomScreen`

Đây là nơi booking thật sự được tạo:

- Hiển thị thẻ buổi hẹn (hình thức, badge trạng thái, ngày/giờ, giờ kết thúc, đếm ngược) + lí do + thông tin chuyên gia.
- Nút **"Xác nhận đặt lịch với chuyên gia"** gọi `bookSession({ slotId, reason, mode })` (`mode` = TEXT cho Chat, VIDEO cho Video). Sau khi đặt, trạng thái khởi đầu là `REQUESTED` (chờ therapist duyệt) — banner "đang chờ xác nhận".
- Nếu slot vừa bị người khác đặt (HTTP 409) → tự mở danh sách **khung giờ trống khác** để chọn lại rồi xác nhận lại.
- **Tham gia (Join)**: chỉ bật trong vòng **10 phút trước giờ hẹn** và khi trạng thái là `UPCOMING`/`IN_PROGRESS` → mở `VideoConsultation`.
- **Hủy buổi hẹn**: mở dialog nhập lí do (bắt buộc, ≤1000 ký tự), gọi `cancelAppointment`. Xử lý lỗi 409/400. Trạng thái cho phép hủy: `REQUESTED`, `UPCOMING`, `IN_PROGRESS`.
- Chặn rời màn khi chưa xác nhận (hardware back + nút back hỏi "xác nhận ngay hay quay lại chỉnh sửa").

## A.8. Cuộc gọi video — `VideoConsultationScreen`

- Phòng họp **Jitsi** (`meet.jit.si`), tên phòng `umatter-<appointmentId>` (trùng quy ước với phía web ở mục B.8).
- `joinVideoSession(appointmentId)` kiểm tra quyền vào trước khi cho join.
- WebView nhúng có inject JS để: ép giao diện tiếng Việt, ẩn mọi nút đăng nhập moderator (Google/GitHub), tự đóng dialog auth, hiển thị overlay "Đang chờ chuyên viên vào phòng…".
- Sau ~1 phút kể từ giờ bắt đầu mới hiện nút "Kết thúc và đánh giá" → sang `ConsultationFeedback`.

## A.9. Đánh giá buổi tham vấn — `ConsultationFeedbackScreen`

- Tóm tắt buổi (hình thức, giờ, ngày) + thông tin chuyên gia.
- **Chấm điểm** 1–5 bằng emoji (😞🙁😐🙂😄) + **bình luận** free text.
- Hiển thị **clinical note** mà therapist đã viết (chẩn đoán + khuyến nghị, ngày tạo) qua `getClinicalNoteByAppointment` — đây là phần therapist "trả về" cho bệnh nhân (chỉ diagnosis + recommendations, không lộ SOAP nội bộ).
- "Xác nhận" gọi `submitReview({ appointmentId, rating, comment })`. Nếu đã đánh giá rồi (409) → modal thông báo trùng.
- Mở từ lịch sử với `isReadOnly: true` thì chỉ xem, không sửa được.
- **Đây là biện pháp duy nhất người dùng có để phản hồi về chất lượng buổi tham vấn** — app không có chức năng report vi phạm / customer support như đã nêu ở phần đầu.

## A.10. Lịch sử — `AppointmentsHistoryScreen`

- 2 tab: **Đã hoàn thành** (`COMPLETED`) và **Đã hủy** (`CANCELLED`).
- Mỗi thẻ: chuyên gia, chuyên môn, địa điểm, giờ/ngày, badge trạng thái; với buổi đã hủy hiện lí do + thời điểm hủy.
- Bấm "Xem thêm" → "Chi tiết" mở lại màn đánh giá ở chế độ read-only.

---

# PHẦN B — Phía Therapist (web console `therapist-web-ui`)

App React + Vite, layout sidebar gồm 7 mục: Dashboard, Appointments, Availability, Patients, Messages, Clinical Notes, Settings.

## B.1. Đăng ký & xác minh license

- **Đăng ký** (`RegisterPage`): thông tin cá nhân, chuyên môn, bio, số năm kinh nghiệm, phí tư vấn (VND), **số license + cơ quan cấp**, và upload **2 tài liệu bắt buộc** (license document + government ID, PDF/JPG/PNG ≤10 MB). Phải tick đồng ý điều khoản.
- Sau khi nộp → chuyển sang `LicensePendingPage` (chờ duyệt 1–3 ngày). Tài khoản chỉ vào console khi license được verify (license có các trạng thái `PENDING_VERIFICATION` / `VERIFIED` / `REJECTED` / `EXPIRED`).

## B.2. Dashboard — `DashboardPage`

- 4 KPI: số bệnh nhân đang theo dõi, số buổi hoàn thành trong tháng, rating trung bình, số ghi chú nháp.
- **Lịch hôm nay**: danh sách buổi trong ngày; nút "Join" chỉ bật trong cửa sổ 10 phút trước giờ bắt đầu, ngoài ra là "Open". Badge Video/Text.
- **Tuần này**: số buổi mỗi ngày.
- **Pending actions**: số booking đang chờ xác nhận, số note nháp cần hoàn tất.
- **Alerts**: số bệnh nhân bị gắn cờ do dữ liệu tâm trạng đáng lo.

## B.3. Lịch hẹn — `AppointmentsListPage` + `AppointmentDetailPage`

**Danh sách**: tab Requested / Upcoming / Today / Past / Cancelled; lọc theo hình thức (Video/Text) và tìm theo tên bệnh nhân.

**Chi tiết một buổi** — các hành động therapist làm được:

- **Duyệt yêu cầu** (`REQUESTED`): nút **Confirm** / **Reject** (reject kèm lí do tùy chọn, giải phóng slot). Cửa sổ quyết định chỉ mở khi còn **>2 giờ** trước giờ bắt đầu; trễ hơn thì hệ thống tự reject.
- **Hủy buổi đã xác nhận**: bắt buộc nhập lí do; chỉ cho hủy khi còn **>1 giờ** trước giờ bắt đầu.
- **Vào buổi**: với Video → nút "Join video session" (bật trong cửa sổ 10 phút); với Text → "Open chat" (mở Messages với đúng bệnh nhân).
- Xem thông tin bệnh nhân (tuổi, giới, email, **liên hệ khẩn cấp**), **diary gần đây (5 entry)** trước buổi, và sau khi `COMPLETED` thì viết/mở **clinical note**.
- Nhắc rằng review của bệnh nhân hiển thị trên trang hồ sơ chuyên gia.

## B.4. Lịch trống — `AvailabilityPage`

- **Lưới slot theo tuần** (8h–19h): click ô trống để tạo slot (đặt thời lượng phút), click slot có sẵn để xem/xóa. Slot **đã được đặt là read-only** (hiện tên bệnh nhân, không sửa/xóa).
- **Weekly templates** (lịch lặp lại): tạo template theo thứ + giờ. Lưu/kích hoạt template sẽ **sinh ngay các slot cho 30 ngày tới** (mô phỏng cron backend, múi giờ Asia/Ho_Chi_Minh +07:00); job Chủ nhật hằng tuần tiếp tục bù slot.
- Bật/tắt template; xóa template sẽ gỡ các slot chưa-được-đặt trong 30 ngày tới, **giữ lại slot đã đặt**.
- Các slot trống này chính là thứ bệnh nhân thấy ở `BookingScreen` (mục A.5).

## B.5. Bệnh nhân — `PatientsListPage` + `PatientProfilePage`

**Danh sách (roster)**: tên, trạng thái gán (`ACTIVE`/`INACTIVE`), ngày gán, mức rủi ro (badge), tag; lọc theo trạng thái/tag và tìm theo tên. (Tên được backfill từ profile endpoint nếu roster chưa có.)

**Hồ sơ bệnh nhân** — sidebar:
- Avatar, tuổi/giới, **mức rủi ro** chỉnh bằng nút NONE/LOW/MEDIUM/HIGH (`updatePatientRiskLevel`).
- Liên hệ (email, sđt, trường), **liên hệ khẩn cấp**.
- **Trạng thái quyền (grant)**: bệnh nhân có cấp quyền truy cập dữ liệu sức khỏe hay chưa, kèm ngày hết hạn.
- **Tags**: thêm/xóa tự do (`updatePatientTags`).

**Hồ sơ — các tab**:
- **Overview**: thông tin tóm tắt + **Matching form** (kết quả bảng ghép nối từ mục A.2).
- **Clinical notes**: danh sách note + nút tạo note mới.
- **Diary / Food / Sleep / Mood**: dữ liệu self-tracking của bệnh nhân — **chỉ xem được nếu bệnh nhân đã cấp quyền**, nếu chưa thì hiện `LockedCard`. Có biểu đồ (nước uống 7 ngày, thời lượng/chất lượng giấc ngủ, đường xu hướng tâm trạng 1–5 chấm theo moodTag diary).
- **Sessions**: bảng buổi quá khứ/sắp tới kèm link tới clinical note tương ứng.

> Lưu ý quyền truy cập: therapist bị 403 ở diary/tracking khi bệnh nhân chưa grant là **đúng thiết kế**; quyền chat tách biệt với quyền dữ liệu sức khỏe.

## B.6. Tin nhắn — `MessagesPage`

- 3 cột: danh sách hội thoại (tab **Patients** / **Requests**), khung chat, panel quyền.
- **Chat thời gian thực** qua **STOMP WebSocket** (`ChatSocket`): gửi optimistic rồi thay bằng echo của server, đánh dấu đã đọc, hiển thị trạng thái kết nối.
- **Friend requests**: chấp nhận / từ chối yêu cầu kết nối từ bệnh nhân.
- Panel phải: trạng thái grant dữ liệu (link sang xem tracking nếu đã cấp), nhắc "chat tách biệt với quyền dữ liệu sức khỏe", và mood alert nếu có.

## B.7. Ghi chú lâm sàng — `ClinicalNotesListPage` + `ClinicalNoteEditorPage`

- **Danh sách**: tab All / Drafts / Finalized, tìm theo summary/diagnosis. "Hồ sơ làm việc riêng tư — bệnh nhân không bao giờ thấy."
- **Editor** theo cấu trúc **SOAP** (Subjective / Objective / Assessment / Plan) + Diagnosis (ngắn) + Recommendations + Summary.
- **Risk flags**: suicidal ideation / self-harm / substance use / abuse — tick vào sẽ bật dialog "Safety protocol triggered" (nhắc rà soát safety plan, liên hệ khẩn cấp, hẹn follow-up ≤7 ngày).
- **Save draft** (lưu nháp, có thể sửa tiếp) và **Finalize** (khóa note, không sửa được nữa, đồng thời đánh dấu buổi `COMPLETED`).
- Note bắt buộc gắn với một appointment. Phần Diagnosis + Recommendations của note finalized chính là thứ bệnh nhân đọc ở màn đánh giá (mục A.9).

## B.8. Buổi video — `VideoSessionPage`

- Mở từ chi tiết buổi (trong cửa sổ join). `joinSession(id)` rồi mở phòng **Jitsi** tab mới với tên phòng `umatter-<appointmentId>` (trùng quy ước phía mobile, nên hai bên vào cùng phòng).
- Sidebar trợ giúp trong buổi: lí do của bệnh nhân, **diary gần đây (5 entry)**, và **scratchpad** ghi nhanh tự lưu.
- Nút "End & write note" mang nội dung scratchpad sang trình tạo clinical note (điền sẵn phần Subjective).

## B.9. Cài đặt — `SettingsPage`

- **Profile**: tên, sđt, avatar (upload), chuyên môn, số năm kinh nghiệm, **phí tư vấn (VND)**, ngôn ngữ, bio. (Email read-only.)
- **Notifications**: nhận mọi loại thông báo (booking, hủy, tin nhắn, cấp quyền, mood alert, nhắc gia hạn license); chưa có toggle theo kênh.
- **License**: xem license hiện tại + trạng thái; **gia hạn** bằng cách nộp số license/cơ quan/ngày hết hạn + tài liệu mới → chuyển về `PENDING_VERIFICATION`.
- **Security**: đổi mật khẩu (tối thiểu 8 ký tự).
- **Language**: Tiếng Việt / English.

---

# PHẦN C — Phía App provider (Authorization & mô hình phân quyền dữ liệu)

Phần này mô tả **ai được xem thông tin gì** của ai. Toàn bộ hệ thống đi qua một API gateway (`API_BASE_URL`); mọi request (trừ login/register) đính kèm **JWT Bearer token** ở header `Authorization`. Backend là kiến trúc nhiều service (auth-service, therapist-api, tracking, social/chat...).

## C.1. Định danh & vai trò (identity & roles)

- Mỗi tài khoản có một **`role`**: `TEEN` / `PARENT` (phía user/patient), `THERAPIST`, hoặc `ADMIN`.
- Có 2 loại ID dễ nhầm: `/auth/me` trả về **`user_id`** ở trường `id`, nhưng **mọi path-param trên gateway đều là `profile_id`**. Web console lưu `profileId` khi đăng nhập và dùng nó cho hầu hết lời gọi (slots, patients, notes...).
- **License gating**: tài khoản therapist chỉ thực sự dùng được console khi license ở trạng thái `VERIFIED`. Khi đăng ký xong, therapist bị giữ ở `LicensePendingPage`; license có vòng đời `PENDING_VERIFICATION → VERIFIED / REJECTED`, và `EXPIRED` khi hết hạn (phải gia hạn — xem B.9). Đây là rào chắn đầu tiên của App provider trước khi cho ai đó hành nghề trên nền tảng.

## C.2. Quan hệ "assigned" — therapist chỉ thấy bệnh nhân của mình

- Therapist **chỉ xem được danh sách và thông tin của những bệnh nhân được gán (assigned) cho mình**. Roster lấy qua `GET /therapist/therapists/{therapistId}/patients`, mỗi dòng có `assignmentStatus` = `ACTIVE` (đang đồng hành) hoặc `INACTIVE` (đã từng, nay không còn).
- Quan hệ assignment được tạo từ phía user khi hoàn tất **matching form** / chọn chuyên gia (phía mobile). Therapist **không** tự thêm bệnh nhân vào danh sách của mình được.
- Vì có quan hệ assignment, therapist mới gọi được `GET /patients/{profileId}` để lấy hồ sơ cơ bản (tên, tuổi, giới, email, sđt, trường, **liên hệ khẩn cấp**). Một therapist **không** thể xem hồ sơ của một patient không thuộc danh sách của mình.
- Tương tự, appointment và clinical note đều gắn với cặp (therapist, patient) cụ thể; therapist chỉ thao tác được trên các buổi/note của chính mình.

## C.3. Dữ liệu sức khỏe self-tracking — chỉ xem khi patient CẤP QUYỀN (grant)

Đây là tầng phân quyền quan trọng nhất, tách biệt với quan hệ assignment ở C.2:

- Dữ liệu **diary / food / sleep / mood** của user nằm sau một **cơ chế cấp quyền (data-access grant)** do **chính patient chủ động** bật từ app mobile. Việc một therapist được gán cho patient **KHÔNG** tự động cho phép xem các log này.
- Mô hình grant (`DataAccessGrantResponse`):
  - `granterProfileId` = patient (người cho quyền), `granteeProfileId` = therapist (người nhận quyền).
  - `accessScope`: `READ_JOURNAL` (chỉ nhật ký) hoặc `READ_ALL` (toàn bộ tracking).
  - `status`: `ACTIVE` / `REVOKED`; có `expiresAt` → quyền **tự hết hạn**, patient có thể **thu hồi (revoke) bất cứ lúc nào**.
- Web console kiểm tra quyền qua `GET /auth/grants/status/{otherProfileId}` trả về `theyGaveMeAccess` / `iGaveThemAccess`. Trong hồ sơ bệnh nhân (B.5), nếu `theyGaveMeAccess === false` thì các tab Diary/Food/Sleep/Mood hiển thị `LockedCard` thay vì dữ liệu.
- Ở tầng backend, nếu chưa được cấp quyền, gọi `GET /tracking/diaries/{profileId}` (và food/sleep/mood) sẽ trả **403** — và đây là **đúng thiết kế**, không phải lỗi đăng nhập. (404 ở clinical note nghĩa là chưa có note, khác với 403 quyền.)

## C.4. Clinical note — riêng tư phía therapist, lộ có chọn lọc cho patient

- Clinical note (SOAP + risk flags) là **hồ sơ làm việc riêng của therapist**; danh sách/nội dung đầy đủ chỉ truy cập được qua các endpoint `/therapist/notes/...` mà **patient không gọi tới được**.
- Patient **không** thấy toàn bộ SOAP. Ở màn đánh giá (A.9), app mobile gọi `getClinicalNoteByAppointment(appointmentId)` và **chỉ hiển thị `diagnosis` + `recommendations`** của note đã finalize — tức therapist chủ động "trả về" một phần kết luận, phần ghi chú nội bộ (Subjective/Objective/Assessment/Plan, risk flags) vẫn ẩn.

## C.5. Chat & các quyền khác

- **Quyền chat tách biệt với quyền dữ liệu sức khỏe**: patient có thể nhắn tin cho therapist mà **không** cần cấp quyền xem diary/mood/sleep. Panel quyền trong Messages (B.6) nhắc rõ điều này.
- Kết nối chat đi qua **STOMP WebSocket** riêng (`CHAT_WS_URL`); danh sách kênh và tin nhắn chỉ thuộc về 2 người trong cuộc hội thoại.
- **Risk level & tags** của bệnh nhân (B.5) là dữ liệu do **therapist** tạo ra để quản lý ca của mình; chúng nằm ở phía therapist và không phải dữ liệu patient tự nhập.

## C.6. Bảng tóm tắt "ai xem được gì"

| Dữ liệu | Patient (chủ sở hữu) | Assigned therapist | Therapist khác / người ngoài | App/Admin |
|---|---|---|---|---|
| Hồ sơ cơ bản (tên, tuổi, liên hệ khẩn cấp) | ✅ | ✅ (vì assigned) | ❌ | ✅ |
| Matching form (kết quả ghép nối) | ✅ | ✅ | ❌ | ✅ |
| Diary / Food / Sleep / Mood | ✅ | ⚠️ **chỉ khi được grant** (scope + hạn) | ❌ | (tùy chính sách) |
| Clinical note đầy đủ (SOAP, risk flags) | ❌ | ✅ (chủ note) | ❌ | (tùy) |
| Clinical note: diagnosis + recommendations | ✅ (sau khi finalize) | ✅ | ❌ | (tùy) |
| Risk level / tags (do therapist gán) | ❌ | ✅ | ❌ | (tùy) |
| Hồ sơ công khai của therapist (bio, rating, review, giờ làm việc) | ✅ | ✅ | ✅ (công khai) | ✅ |
| Tin nhắn chat | ✅ (trong cuộc) | ✅ (trong cuộc) | ❌ | (tùy) |

> Nguyên tắc cốt lõi của App provider: **assignment** mở khóa thông tin hành chính/lâm sàng cơ bản giữa đúng cặp therapist–patient; còn **dữ liệu sức khỏe nhạy cảm thì luôn do patient nắm quyền bật/tắt**. Đây là phần phân quyền *đã* được triển khai — khác với phần pháp lý/chống-abuse ở mục 1 đầu tài liệu vốn *chưa* có.

---

# Ghi chú ánh xạ hai phía (đối chiếu nhanh)

| Người dùng (mobile) | Therapist (web) |
|---|---|
| Bảng ghép nối (A.2) | Tab Matching form trong hồ sơ bệnh nhân (B.5) |
| Đặt slot (A.5–A.7) | Slot/template ở Availability (B.4); duyệt/từ chối ở Appointments (B.3) |
| Nhập lí do (A.6) | "Patient's stated reason" (B.3, B.8) |
| Diary/Food/Sleep/Mood self-tracking | Các tab tracking, **cần bệnh nhân cấp quyền** (B.5) |
| Đọc chẩn đoán + khuyến nghị (A.9) | Clinical note (Diagnosis + Recommendations) finalized (B.7) |
| Chấm sao + bình luận (A.9) | Reviews hiển thị ở hồ sơ chuyên gia / nhắc ở B.3 |
| Cuộc gọi Jitsi `umatter-<appointmentId>` (A.8) | Cùng phòng Jitsi `umatter-<appointmentId>` (B.8) |
| Chat realtime với chuyên gia | Messages STOMP WebSocket (B.6) |
| Hủy buổi kèm lí do (A.7) | Hủy/từ chối kèm lí do, có cửa sổ thời gian (B.3) |

---

# TÓM TẮT NHANH (đọc trong 2 phút)

*Phần này viết cho người không chuyên kỹ thuật — CEO, chuyên gia tâm lý cố vấn, hay giảng viên hướng dẫn. Toàn bộ chi tiết kỹ thuật nằm ở các phần trên.*

### Sản phẩm này là gì?

Một nền tảng **đặt lịch & tham vấn tâm lý từ xa**, mô phỏng mô hình **BetterHelp** nhưng ở quy mô luận văn. Có **2 ứng dụng** cho **3 nhóm người**:

- **App điện thoại** cho **người dùng/bệnh nhân** (patient).
- **Web console** cho **chuyên gia tâm lý** (therapist).
- Ở giữa là **nền tảng** (app provider) lo việc ghép nối, phân quyền và bảo mật dữ liệu.

### Luồng hoạt động cốt lõi (đã chạy được đầu–cuối)

> **Trả lời bộ câu hỏi ghép nối → Hệ thống gán 1 chuyên gia → Chọn lịch trống & đặt buổi → Chuyên gia duyệt → Gặp nhau qua video hoặc nhắn tin → Chuyên gia ghi chú hồ sơ → Bệnh nhân đánh giá buổi.**

Đây chính là phần luận văn chứng minh **hoạt động thật**, từ A đến Z.

### Quyền riêng tư & bảo mật dữ liệu (điểm mạnh đáng nói)

- Chuyên gia **chỉ thấy bệnh nhân được gán cho mình**, không thấy người của chuyên gia khác.
- **Dữ liệu sức khỏe nhạy cảm** (nhật ký, giấc ngủ, ăn uống, tâm trạng) **luôn do bệnh nhân tự quyết định cho xem hay không**, có thể đặt thời hạn và **thu hồi bất cứ lúc nào** — được gán không tự động cho phép xem.
- **Ghi chú lâm sàng** là hồ sơ riêng của chuyên gia; bệnh nhân chỉ đọc được phần **chẩn đoán + khuyến nghị** mà chuyên gia chủ động chia sẻ.
- Chuyên gia phải **nộp giấy phép hành nghề + giấy tờ tùy thân và được duyệt** mới vào được hệ thống.

### Đã chủ động lược bỏ những gì (và tại sao)

Để vừa sức một luận văn, **3 mảng lớn nhất và khó nhất** của một sản phẩm thương mại được cắt bỏ có chủ đích:

1. **Pháp lý & chống lạm dụng**: chưa có kênh báo cáo vi phạm hay chăm sóc khách hàng. Nếu chuyên gia làm việc tắc trách, bệnh nhân **chỉ có thể viết đánh giá**; nếu bệnh nhân cư xử không đúng, chuyên gia **gần như không có cách tự bảo vệ**. Hệ thống đang tin cả hai bên hành xử thiện chí.
2. **Thanh toán (monetization)**: **không có dòng tiền** — không thu phí buổi, không trả công chuyên gia. Trong thực tế *không chuyên gia nào làm miễn phí*, nên phần này là rào cản lớn nhất để thành sản phẩm thật; nó cũng dính chặt với pháp lý (hợp đồng, hoàn tiền, thuế) nên được loại bỏ cùng mục 1.
3. **Nhiều tính năng nâng cao của BetterHelp**: chưa cho **quay lại chuyên gia cũ**, chưa có **web cho bệnh nhân / app điện thoại cho chuyên gia**, chưa có **gọi thoại hay buổi nhóm**, chưa có **bài tập về nhà**, chưa có **đường dây nóng khủng hoảng**, dùng **phòng video công cộng (Jitsi)** thay vì hạ tầng riêng, và **cố định múi giờ Việt Nam**.

### Thông điệp một câu

> Sản phẩm **chứng minh trọn vẹn luồng nghiệp vụ lõi** của một app tham vấn tâm lý (ghép nối → đặt lịch → buổi tham vấn → hồ sơ & đánh giá) với **mô hình phân quyền dữ liệu lấy bệnh nhân làm trung tâm**, đồng thời **chủ động khoanh vùng** bỏ qua phần pháp lý, thanh toán và các tính năng nâng cao vì chúng vượt phạm vi và nguồn lực của một luận văn.