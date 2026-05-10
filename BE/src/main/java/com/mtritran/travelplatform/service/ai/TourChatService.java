package com.mtritran.travelplatform.service.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.dto.request.TourChatRequest;
import com.mtritran.travelplatform.dto.response.TourChatResponse;
import com.mtritran.travelplatform.dto.response.TourResponse;
import com.mtritran.travelplatform.entity.Review;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.mapper.TourMapper;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.ReviewRepository;
import com.mtritran.travelplatform.repository.TourRepository;
import com.mtritran.travelplatform.repository.ChatMessageRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import com.mtritran.travelplatform.entity.ChatMessage;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TourChatService {

    TourRepository tourRepository;
    ReviewRepository reviewRepository;
    BookingRepository bookingRepository;
    UserRepository userRepository;
    ChatMessageRepository chatMessageRepository;
    TourMapper tourMapper;
    ChatModel chatModel;
    EmbeddingModel embeddingModel;
    TourEmbeddingService tourEmbeddingService;
    PolicyEmbeddingService policyEmbeddingService;
    ObjectMapper objectMapper = new ObjectMapper();

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    
    // RAG Constraints
    private static final double MAX_DISTANCE_KM = 100.0; // Bán kính ưu tiên tìm kiếm
    private static final int MAX_CONTEXT_TOURS = 10;    // Số lượng tour tối đa đưa vào prompt

    private static final double EARTH_RADIUS_KM = 6371.0;

    public TourChatService(
            TourRepository tourRepository,
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            TourMapper tourMapper,
            ChatModel chatModel,
            EmbeddingModel embeddingModel,
            TourEmbeddingService tourEmbeddingService,
            PolicyEmbeddingService policyEmbeddingService,
            UserRepository userRepository,
            ChatMessageRepository chatMessageRepository) {
        this.tourRepository = tourRepository;
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.tourMapper = tourMapper;
        this.chatModel = chatModel;
        this.embeddingModel = embeddingModel;
        this.tourEmbeddingService = tourEmbeddingService;
        this.policyEmbeddingService = policyEmbeddingService;
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AiStructuredReply {
        String answer;
        List<String> tourIds;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1); //delta vi do
        double dLon = Math.toRadians(lon2 - lon1); //delta kinh do
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) //gia tri trung gian
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); //khoang cach goc
        return EARTH_RADIUS_KM * c;
    }

    public TourChatResponse chat(TourChatRequest request) {
        String userQuestion = request.getQuestion();
        Double userLat = request.getLatitude();
        Double userLng = request.getLongitude();
        String userAddress = request.getAddress();
        String contextTourId = request.getContextTourId();
        String currentPath = request.getCurrentPath();

        // ── STEP 0: USER DATA INJECTION (SQL Context) ──
        String userContextPrompt = "";
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                String currentUsername = auth.getName();
                if (currentPath != null && (currentPath.contains("/bookings") || currentPath.contains("/requests"))) {
                    var userBookings = bookingRepository.findAllByUser_EmailOrderByCreatedAtDesc(currentUsername);
                    if (!userBookings.isEmpty()) {
                        String bookingSummary = userBookings.stream()
                            .limit(5) // Lấy 5 đơn gần nhất cho gọn prompt
                            .map(b -> String.format("- Tour: %s, Ngày: %s, Trạng thái: %s, Đã trả: %,.0f VNĐ", 
                                b.getTour().getTitle(), b.getBookingDate(), b.getStatus(), b.getPaidAmount().doubleValue()))
                            .collect(Collectors.joining("\n"));
                        userContextPrompt = "\n=== LỊCH SỬ ĐẶT TOUR CỦA KHÁCH ===\n" + bookingSummary + "\n";
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[TourRAG] Failed to inject user context", e);
        }

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant expiryTime = Instant.now().minus(Duration.ofMinutes(10));
        LocalDateTime vnNow = LocalDateTime.now(zone);

        // ── STEP 1: TRADITIONAL RETRIEVAL (Lọc cứng qua SQL) ──
        List<Tour> allActiveTours = tourRepository.findAvailableTours(
                LocalDate.now(zone), LocalTime.now(zone), expiryTime
        ).stream()
                .filter(t -> {
                    Integer cutoff = t.getBookingCutoffMinutes() != null ? t.getBookingCutoffMinutes() : 60;
                    LocalDateTime cutoffPoint = LocalDateTime.of(t.getStartDate(), t.getStartTime()).minusMinutes(cutoff);
                    return vnNow.isBefore(cutoffPoint);
                })
                .collect(Collectors.toList());

        if (allActiveTours.isEmpty()) {
            return TourChatResponse.builder()
                    .answer("Hiện tại hệ thống không có tour nào đang khả dụng. Bạn vui lòng quay lại sau nhé!")
                    .recommendedTours(Collections.emptyList())
                    .build();
        }

        // ── STEP 2: GEOSPATIAL PRIORITIZATION (Ưu tiên theo vị trí) ──
        List<Tour> nearbyTours = new ArrayList<>();
        List<Tour> otherTours = new ArrayList<>();

        if (userLat != null && userLng != null) {
            for (Tour t : allActiveTours) {
                if (t.getLocation() != null) {
                    double dist = haversine(userLat, userLng, t.getLocation().getLatitude(), t.getLocation().getLongitude());
                    if (dist <= MAX_DISTANCE_KM) {
                        nearbyTours.add(t);
                    } else {
                        otherTours.add(t);
                    }
                } else {
                    otherTours.add(t);
                }
            }
            // Sắp xếp gần nhất lên đầu
            nearbyTours.sort(Comparator.comparingDouble(t -> 
                haversine(userLat, userLng, t.getLocation().getLatitude(), t.getLocation().getLongitude())));
        } else {
            otherTours = allActiveTours;
        }

        // ── STEP 3: SEMANTIC RANKING (RAG - Xếp hạng theo ý nghĩa) ──
        // Lấy lịch sử chat để tăng tính ngữ cảnh
        String historyContext = (request.getHistory() == null || request.getHistory().isEmpty())
                ? "Không có lịch sử trò chuyện cũ."
                : request.getHistory().stream()
                .map(h -> (h.getRole().equalsIgnoreCase("user") ? "Khách: " : "AI: ") + h.getText())
                .collect(Collectors.joining("\n"));

        String policyContext = "";
        List<Tour> finalCandidates = new ArrayList<>();
        try {
            // Khi search vector, ta nên kết hợp cả câu hỏi mới và ngữ cảnh gần nhất để search chính xác hơn
            String searchTerms = userQuestion;
            if (request.getHistory() != null && !request.getHistory().isEmpty()) {
                // Lấy câu cuối của AI nếu có để làm giàu search context
                searchTerms = request.getHistory().get(request.getHistory().size() - 1).getText() + " " + userQuestion;
            }

            Embedding queryEmbed = embeddingModel.embed(searchTerms).content();
            EmbeddingSearchRequest searchReq = EmbeddingSearchRequest.builder()
                    .queryEmbedding(queryEmbed)
                    .maxResults(20) // Lấy phổ rộng để chọn lọc
                    .build();
            
            // --- Tìm kiếm Tour ---
            EmbeddingSearchResult<TextSegment> searchRes = tourEmbeddingService.getStore().search(searchReq);
            List<String> semanticTourIds = searchRes.matches().stream()
                    .map(m -> m.embedded().metadata().getString("tourId"))
                    .collect(Collectors.toList());

            // --- Tìm kiếm Chính sách/FAQ ---
            EmbeddingSearchRequest policySearchReq = EmbeddingSearchRequest.builder()
                    .queryEmbedding(queryEmbed)
                    .maxResults(3) // Chỉ lấy 3 đoạn chính sách liên quan nhất
                    .build();
            EmbeddingSearchResult<TextSegment> policyRes = policyEmbeddingService.getStore().search(policySearchReq);
            policyContext = policyRes.matches().stream()
                    .map(m -> m.embedded().text())
                    .collect(Collectors.joining("\n---\n"));

            // Ưu tiên: Tour vừa GẦN vừa có ngữ nghĩa PHÙ HỢP (Semantic Match in Nearby)
            List<Tour> semanticNearby = nearbyTours.stream()
                    .filter(t -> semanticTourIds.contains(t.getId()))
                    .collect(Collectors.toList());
            
            finalCandidates.addAll(semanticNearby);

            // Nếu chưa đủ context, lấy thêm các tour GẦN khác (Nearby Fallback)
            if (finalCandidates.size() < 5) {
                nearbyTours.stream()
                        .filter(t -> !finalCandidates.contains(t))
                        .limit(5 - finalCandidates.size())
                        .forEach(finalCandidates::add);
            }

            // Nếu vẫn chưa đủ hoặc khách hỏi rộng, lấy thêm tour PHÙ HỢP ngữ nghĩa ở vùng khác
            if (finalCandidates.size() < MAX_CONTEXT_TOURS) {
                otherTours.stream()
                        .filter(t -> semanticTourIds.contains(t.getId()))
                        .filter(t -> !finalCandidates.contains(t))
                        .limit(MAX_CONTEXT_TOURS - finalCandidates.size())
                        .forEach(finalCandidates::add);
            }

        } catch (Exception e) {
            log.error("[TourRAG] Semantic search failed, using distance-only fallback", e);
            finalCandidates.addAll(nearbyTours.stream().limit(5).toList());
            if (finalCandidates.size() < 5) finalCandidates.addAll(otherTours.stream().limit(5).toList());
        }

        // ── STEP 4: LLM GENERATION ──
        String locationPrompt = (userLat != null && userLng != null) 
            ? String.format("Khách đang ở: %s. HÃY ƯU TIÊN đề xuất các tour gần khách nhất (danh sách đã xếp theo khoảng cách).", 
                userAddress != null ? userAddress : "Tọa độ " + userLat + "," + userLng)
            : "Khách chưa cung cấp vị trí, hãy đề xuất dựa trên sở thích ngữ nghĩa.";

        // ── STEP 4: CONTEXT ENRICHMENT (Thêm thông tin tour đang xem) ──
        if (contextTourId != null && !contextTourId.isEmpty()) {
            tourRepository.findById(contextTourId).ifPresent(t -> {
                if (finalCandidates.stream().noneMatch(c -> c.getId().equals(t.getId()))) {
                    finalCandidates.add(0, t); // Đưa tour đang xem lên đầu context
                }
            });
        }

        String tourContext = finalCandidates.stream()
                .map(t -> buildTourSummary(t, userLat, userLng))
                .collect(Collectors.joining("\n---\n"));

        // ── STEP 5: LLM GENERATION ──
        String pageContextPrompt = "";
        if (currentPath != null) {
            if (currentPath.contains("/tour/")) {
                pageContextPrompt = "Khách đang xem CHI TIẾT một tour. Hãy ưu tiên trả lời các thắc mắc về tour này.";
            } else if (currentPath.contains("/requests")) {
                pageContextPrompt = "Khách đang ở trang YÊU CẦU TOUR (Tour Requests). Hãy đóng vai trò trợ lý giúp khách đăng bài hoặc tìm guide phù hợp.";
            } else if (currentPath.equals("/") || currentPath.contains("/marketplace")) {
                pageContextPrompt = "Khách đang ở TRANG CHỦ/CHỢ TOUR. Hãy đóng vai trò tư vấn nhiệt tình, giới thiệu các tour hấp dẫn.";
            }
        }

        String prompt = String.format("""
                Bạn là chuyên gia tư vấn du lịch của TravelX.
                
                === LỊCH SỬ TRÒ CHUYỆN ===
                %s
                ==========================

                NHIỆM VỤ:
                1. Trả lời câu hỏi của khách một cách tự nhiên.
                2. Đề xuất các tour PHÙ HỢP NHẤT dựa trên vị trí và sở thích.
                3. %s
                
                RÀNG BUỘC QUAN TRỌNG:
                - %s
                - Nếu khách hỏi về vị trí hiện tại của họ (ví dụ: "tôi đang ở đâu", "vị trí của mình"), hãy sử dụng thông tin trong phần VỊ TRÍ KHÁCH để trả lời và ĐỂ tourIds LÀ MẢNG RỖNG [].
                - Nếu khách chào hỏi, nói chuyện phiếm hoặc hỏi các câu KHÔNG liên quan đến tìm kiếm/đặt tour, hãy trả lời lịch sự và ĐỂ tourIds LÀ MẢNG RỖNG [].
                - Chỉ đề xuất tourIds khi khách thực sự hỏi về tour, hỏi về hoạt động du lịch, hoặc nhờ gợi ý địa điểm.
                - Nếu có tour ở gần khách và phù hợp ngữ cảnh, hãy giới thiệu chúng trước.
                - Chỉ đề xuất tour có trong danh sách khả dụng bên dưới.
                - VỀ SỐ LƯỢNG: Trả về ĐÚNG số lượng tour mà khách yêu cầu. Nếu khách hỏi "cái nào rẻ nhất" hoặc "tour tốt nhất", chỉ trả về 1 tourId duy nhất. Nếu khách không nói rõ số lượng, hãy trả về tối đa 5 tour phù hợp nhất.
                %s
                %s
                
                === CHÍNH SÁCH & HƯỚNG DẪN HỆ THỐNG ===
                %s
                =======================================
                
                CÂU HỎI MỚI NHẤT: "%s"
                
                Trả về JSON thuần túy (không markdown):
                {
                  "answer": "Lời giải thích ngắn gọn, mời chào thân thiện (tiếng Việt)",
                  "tourIds": ["id1", "id2", "id3"]
                }
                """, historyContext, pageContextPrompt, locationPrompt, userContextPrompt, tourContext, policyContext, userQuestion);

        TourChatResponse response = callAiAndParse(prompt, finalCandidates.stream().collect(Collectors.toMap(Tour::getId, t -> t)));

        // --- LƯU VÀO DATABASE NẾU ĐÃ ĐĂNG NHẬP ---
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                userRepository.findByEmail(auth.getName()).ifPresent(user -> {
                    // Lưu câu hỏi của user
                    chatMessageRepository.save(ChatMessage.builder()
                            .user(user).content(userQuestion).role("USER").isBot(true).build());
                    // Lưu câu trả lời của AI
                    chatMessageRepository.save(ChatMessage.builder()
                            .user(user).content(response.getAnswer()).role("AI").isBot(true).build());
                });
            }
        } catch (Exception e) {
            log.warn("[ChatPersistence] Failed to save chat messages", e);
        }

        return response;
    }

    public List<ChatMessage> getChatHistory(String email) {
        if (email == null || email.equals("anonymousUser")) {
            return Collections.emptyList();
        }
        log.info("[ChatHistory] Fetching history for user: {}", email);
        return userRepository.findByEmail(email)
                .map(chatMessageRepository::findAllByUserAndIsBotTrueOrderByCreatedAtAsc)
                .orElse(Collections.emptyList());
    }

    @org.springframework.transaction.annotation.Transactional
    public void clearChatHistory(String email) {
        userRepository.findByEmail(email).ifPresent(chatMessageRepository::deleteAllByUser);
    }

    private TourChatResponse callAiAndParse(String prompt, Map<String, Tour> tourMap) {
        try {
            String raw = chatModel.chat(prompt);
            String cleaned = raw.trim().replaceAll("^```json\\s*", "").replaceAll("```$", "").trim();
            AiStructuredReply parsed = objectMapper.readValue(cleaned, AiStructuredReply.class);

            List<TourResponse> recommended = (parsed.getTourIds() == null ? Collections.<String>emptyList() : parsed.getTourIds())
                    .stream()
                    .filter(tourMap::containsKey)
                    .map(id -> mapWithRating(tourMap.get(id)))
                    .collect(Collectors.toList());

            return TourChatResponse.builder()
                    .answer(parsed.getAnswer() != null ? parsed.getAnswer() : raw)
                    .recommendedTours(recommended)
                    .build();
        } catch (Exception e) {
            log.error("[TourRAG] Failed to parse AI response", e);
            return TourChatResponse.builder().answer("Xin lỗi, tôi gặp chút trục trặc khi tìm tour. Bạn thử hỏi lại nhé!").build();
        }
    }

    private TourResponse mapWithRating(Tour tour) {
        TourResponse response = tourMapper.toResponse(tour);
        List<Review> reviews = reviewRepository.findAllByTour(tour);
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(5.0);
        response.setRating(avg);
        response.setReviewCount(reviews.size());
        
        Instant expiryTime = Instant.now().minus(Duration.ofMinutes(10));
        Integer occupied = bookingRepository.sumOccupiedSlots(tour.getId(), tour.getStartDate(), tour.getStartTime(), expiryTime);
        response.setOccupiedGuests(occupied != null ? occupied : 0);
        return response;
    }

    private String buildTourSummary(Tour tour, Double userLat, Double userLng) {
        String distStr = "";
        if (userLat != null && userLng != null && tour.getLocation() != null) {
            double d = haversine(userLat, userLng, tour.getLocation().getLatitude(), tour.getLocation().getLongitude());
            distStr = String.format(" [CÁCH BẠN %.1f KM]", d);
        }
        return String.format("ID: %s | Tour: %s%s | Giá: %,.0f VNĐ | Mô tả: %s",
                tour.getId(), tour.getTitle(), distStr, 
                tour.getPrice() != null ? tour.getPrice().doubleValue() : 0,
                tour.getDescription());
    }
}
