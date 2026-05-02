package com.mtritran.travelplatform.service.ai;

import com.mtritran.travelplatform.dto.request.TourChatRequest;
import com.mtritran.travelplatform.entity.Booking;
import com.mtritran.travelplatform.entity.TourRequest;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.repository.BookingRepository;
import com.mtritran.travelplatform.repository.TourRequestRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SupportChatService {

    UserRepository userRepository;
    BookingRepository bookingRepository;
    TourRequestRepository tourRequestRepository;
    
    ChatModel chatModel;
    EmbeddingModel embeddingModel;
    EmbeddingStore<TextSegment> policyEmbeddingStore;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public SupportChatService(
            UserRepository userRepository,
            BookingRepository bookingRepository,
            TourRequestRepository tourRequestRepository,
            ChatModel chatModel,
            EmbeddingModel embeddingModel,
            @Qualifier("policyEmbeddingStore") EmbeddingStore<TextSegment> policyEmbeddingStore) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.tourRequestRepository = tourRequestRepository;
        this.chatModel = chatModel;
        this.embeddingModel = embeddingModel;
        this.policyEmbeddingStore = policyEmbeddingStore;
    }

    public String chat(TourChatRequest request) {
        String userQuestion = request.getQuestion();
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 1. Traditional Retrieval: Lấy lịch sử đặt chỗ & tour request của khách
        List<Booking> bookings = bookingRepository.findAllByUserOrderByCreatedAtDesc(user);
        List<TourRequest> customRequests = tourRequestRepository.findAllByUserOrderByCreatedAtDesc(user);

        String historyContext = buildHistoryContext(bookings, customRequests);
        
        // Lấy lịch sử trò chuyện (Conversation History)
        String chatHistoryContext = (request.getHistory() == null || request.getHistory().isEmpty())
                ? "Không có lịch sử trò chuyện cũ."
                : request.getHistory().stream()
                .map(h -> (h.getRole().equalsIgnoreCase("user") ? "Khách: " : "AI: ") + h.getText())
                .collect(Collectors.joining("\n"));

        // 2. Semantic RAG: Lấy chính sách hệ thống liên quan
        String policyContext = "";
        try {
            Embedding queryEmbedding = embeddingModel.embed(userQuestion).content();
            EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                    .queryEmbedding(queryEmbedding)
                    .maxResults(3)
                    .build();
            EmbeddingSearchResult<TextSegment> searchResult = policyEmbeddingStore.search(searchRequest);
            policyContext = searchResult.matches().stream()
                    .map(m -> m.embedded().text())
                    .collect(Collectors.joining("\n---\n"));
        } catch (Exception e) {
            log.warn("Failed to retrieve policy context: {}", e.getMessage());
        }

        // 3. Generation: Gọi LLM với đầy đủ context
        String prompt = String.format("""
                Bạn là Trợ lý Hỗ trợ Khách hàng của nền tảng du lịch TravelX.
                Nhiệm vụ của bạn là giúp khách hàng giải đáp thắc mắc về lịch sử đặt tour và các chính sách hệ thống.
                
                === LỊCH SỬ TRÒ CHUYỆN (CONVERSATION) ===
                %s
                ========================================

                === THÔNG TIN ĐẶT CHỖ CỦA %s ===
                %s
                ================================
                
                === CHÍNH SÁCH HỆ THỐNG LIÊN QUAN ===
                %s
                ====================================
                
                HƯỚNG DẪN TRẢ LỜI:
                - Nếu khách hỏi về tour họ đã đặt: Hãy kiểm tra thông tin trong phần THÔNG TIN ĐẶT CHỖ.
                - Nếu khách hỏi về việc hủy/phạt/hoàn tiền: Hãy kết hợp thông tin tour cụ thể của khách với CHÍNH SÁCH HỆ THỐNG.
                - Luôn trả lời lịch sự, xưng hô "TravelX" và "Quý khách" hoặc "Bạn".
                - Trả lời bằng tiếng Việt, ngắn gọn, súc tích.
                
                CÂU HỎI MỚI NHẤT: "%s"
                """, chatHistoryContext, user.getFullName(), historyContext, policyContext, userQuestion);

        return chatModel.chat(prompt);
    }

    private String buildHistoryContext(List<Booking> bookings, List<TourRequest> requests) {
        StringBuilder sb = new StringBuilder();
        if (bookings.isEmpty() && requests.isEmpty()) {
            return "Khách hàng này chưa có bất kỳ giao dịch nào trên hệ thống.";
        }

        if (!bookings.isEmpty()) {
            sb.append("Danh sách Tour đã đặt:\n");
            for (Booking b : bookings) {
                sb.append(String.format("- Tour: %s | Ngày: %s | Trạng thái: %s | Giá: %,.0f VNĐ\n",
                        b.getTour().getTitle(),
                        b.getTour().getStartDate().format(DATE_FMT),
                        b.getStatus(),
                        b.getTotalPrice().doubleValue()));
            }
        }

        if (!requests.isEmpty()) {
            sb.append("\nDanh sách Tour Request tùy chỉnh:\n");
            for (TourRequest r : requests) {
                sb.append(String.format("- Request: %s | Địa điểm: %s | Trạng thái: %s\n",
                        r.getTitle(),
                        r.getLocation() != null ? r.getLocation().getName() : r.getCustomLocationName(),
                        r.getStatus()));
            }
        }
        return sb.toString();
    }
}
