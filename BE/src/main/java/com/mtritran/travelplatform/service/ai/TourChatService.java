package com.mtritran.travelplatform.service.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mtritran.travelplatform.dto.response.TourChatResponse;
import com.mtritran.travelplatform.dto.response.TourResponse;
import com.mtritran.travelplatform.entity.Review;
import com.mtritran.travelplatform.entity.Tour;
import com.mtritran.travelplatform.mapper.TourMapper;
import com.mtritran.travelplatform.repository.ReviewRepository;
import com.mtritran.travelplatform.repository.TourRepository;
import dev.langchain4j.model.chat.ChatModel;
import lombok.AccessLevel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TourChatService {

    TourRepository tourRepository;
    ReviewRepository reviewRepository;
    TourMapper tourMapper;
    ChatModel chatModel;
    ObjectMapper objectMapper = new ObjectMapper();

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    /** Internal helper for JSON parsing */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AiStructuredReply {
        String answer;
        List<String> tourIds;
    }

    /**
     * Trả lời câu hỏi tự do và trả về structured response gồm text + danh sách tour được đề xuất.
     */
    public TourChatResponse chat(String userQuestion) {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        java.time.Instant expiry = java.time.Instant.now().minus(java.time.Duration.ofMinutes(10));
        List<Tour> allAvailable = tourRepository.findAvailableTours(
                LocalDate.now(zone), LocalTime.now(zone), expiry);

        java.time.LocalDateTime vnNow = java.time.LocalDateTime.now(zone);
        List<Tour> activeTours = allAvailable.stream()
                .filter(t -> {
                    Integer cutoff = t.getBookingCutoffMinutes() != null ? t.getBookingCutoffMinutes() : 60;
                    java.time.LocalDateTime cutoffPoint = java.time.LocalDateTime.of(t.getStartDate(), t.getStartTime()).minusMinutes(cutoff);
                    return vnNow.isBefore(cutoffPoint);
                })
                .collect(Collectors.toList());

        if (activeTours.isEmpty()) {
            return TourChatResponse.builder()
                    .answer("Hiện tại chưa có tour nào đang mở. Bạn hãy quay lại sau hoặc thử đăng yêu cầu tour tùy chỉnh nhé!")
                    .recommendedTours(Collections.emptyList())
                    .build();
        }

        // Build a lookup map for later
        Map<String, Tour> tourMap = activeTours.stream()
                .collect(Collectors.toMap(Tour::getId, t -> t));

        // Build context with tour IDs embedded
        String tourContext = activeTours.stream()
                .map(this::buildTourSummary)
                .collect(Collectors.joining("\n---\n"));

        String prompt = String.format("""
                Bạn là trợ lý du lịch AI thân thiện của Travel Platform.
                Nhiệm vụ: trả lời câu hỏi của khách về các tour đang mở và đề xuất tour phù hợp.
                
                === DANH SÁCH TOUR ĐANG MỞ ===
                %s
                ==============================
                
                Câu hỏi: %s
                
                Hãy trả lời theo định dạng JSON sau (không thêm markdown, không thêm ```json):
                {
                  "answer": "Câu trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa 200 từ)",
                  "tourIds": ["id_của_tour_1", "id_của_tour_2"]
                }
                
                Quy tắc:
                - Chỉ đưa tourIds của tour thực sự phù hợp với câu hỏi (tối đa 3 tour)
                - Nếu câu hỏi không liên quan đến tour cụ thể, tourIds = []
                - Không bịa thêm thông tin
                - Trả về JSON thuần túy, không có ký tự thừa
                """,
                tourContext, userQuestion);

        log.info("TourChat: {} tours available, question='{}'", activeTours.size(), userQuestion);

        String rawResponse = chatModel.chat(prompt);
        log.debug("AI raw response: {}", rawResponse);

        // Parse AI response
        try {
            // Strip potential markdown code fences if AI adds them
            String cleaned = rawResponse.trim()
                    .replaceAll("^```json\\s*", "")
                    .replaceAll("^```\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();

            AiStructuredReply parsed = objectMapper.readValue(cleaned, AiStructuredReply.class);

            List<TourResponse> recommendedTours = (parsed.getTourIds() == null ? Collections.<String>emptyList() : parsed.getTourIds())
                    .stream()
                    .filter(tourMap::containsKey)
                    .map(id -> mapWithRating(tourMap.get(id)))
                    .collect(Collectors.toList());

            return TourChatResponse.builder()
                    .answer(parsed.getAnswer() != null ? parsed.getAnswer() : rawResponse)
                    .recommendedTours(recommendedTours)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to parse AI structured response, falling back to plain text. Error: {}", e.getMessage());
            return TourChatResponse.builder()
                    .answer(rawResponse)
                    .recommendedTours(Collections.emptyList())
                    .build();
        }
    }

    private TourResponse mapWithRating(Tour tour) {
        TourResponse response = tourMapper.toResponse(tour);
        List<Review> reviews = reviewRepository.findAllByTour(tour);
        if (!reviews.isEmpty()) {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            response.setRating(avg);
            response.setReviewCount(reviews.size());
        } else {
            response.setRating(5.0);
            response.setReviewCount(0);
        }
        return response;
    }

    private String buildTourSummary(Tour tour) {
        return String.format(
                "ID: %s\nTour: %s\nĐịa điểm: %s\nHướng dẫn viên: %s\nGiá: %,.0f VNĐ/người\nNgày: %s | Giờ: %s-%s\nSố khách tối đa: %d\nMô tả: %s",
                tour.getId(),
                tour.getTitle(),
                tour.getLocation() != null ? tour.getLocation().getName() : "Chưa rõ",
                tour.getGuide() != null ? tour.getGuide().getFullName() : "Chưa rõ",
                tour.getPrice() != null ? tour.getPrice().doubleValue() : 0,
                tour.getStartDate() != null ? tour.getStartDate().format(DATE_FMT) : "?",
                tour.getStartTime() != null ? tour.getStartTime().format(TIME_FMT) : "?",
                tour.getEndTime() != null ? tour.getEndTime().format(TIME_FMT) : "?",
                tour.getMaxGuests() != null ? tour.getMaxGuests() : 1,
                tour.getDescription() != null
                        ? (tour.getDescription().length() > 150
                                ? tour.getDescription().substring(0, 150) + "..."
                                : tour.getDescription())
                        : ""
        );
    }
}
