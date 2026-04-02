package com.mtritran.travelplatform.service.ai;

import com.mtritran.travelplatform.entity.Review;
import com.mtritran.travelplatform.entity.TourRequest;
import com.mtritran.travelplatform.entity.User;
import com.mtritran.travelplatform.enums.RoleName;
import com.mtritran.travelplatform.exception.AppException;
import com.mtritran.travelplatform.exception.ErrorCode;
import com.mtritran.travelplatform.repository.ReviewRepository;
import com.mtritran.travelplatform.repository.TourRequestRepository;
import com.mtritran.travelplatform.repository.UserRepository;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.mtritran.travelplatform.entity.TourRequestInterest;
import com.mtritran.travelplatform.repository.TourRequestInterestRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GuideRecommendationService {

    UserRepository userRepository;
    TourRequestRepository tourRequestRepository;
    ReviewRepository reviewRepository;
    TourRequestInterestRepository tourRequestInterestRepository;

    EmbeddingModel embeddingModel;
    EmbeddingStore<TextSegment> embeddingStore;
    ChatModel chatModel;

    // Chuyển đổi thông tin của một Guide thành văn bản để AI có thể hiểu.
    private String buildGuideProfileText(User guide) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hướng dẫn viên: ").append(guide.getFullName()).append("\n");
        sb.append("Kinh nghiệm: ").append(guide.getYearsOfExperience() != null ? guide.getYearsOfExperience() : 0)
                .append(" năm\n");
        sb.append("Ngôn ngữ: ").append(guide.getLanguages() != null ? guide.getLanguages() : "Chưa cập nhật")
                .append("\n");
        sb.append("Sở trường: ").append(guide.getSpecialties() != null ? guide.getSpecialties() : "Chưa cập nhật")
                .append("\n");
        sb.append("Giới thiệu: ").append(guide.getBiography() != null ? guide.getBiography() : "").append("\n");

        // Thêm các đánh giá gần đây
        List<Review> reviews = reviewRepository.findAllByTour_Guide(guide);
        if (!reviews.isEmpty()) {
            sb.append("Đánh giá từ khách hàng:\n");
            reviews.stream()
                    .limit(10)
                    .forEach(r -> sb.append("- ").append(r.getRating()).append(" sao: ").append(r.getComment())
                            .append("\n"));
        }

        return sb.toString();
    }

    // Đồng bộ hóa (Index) toàn bộ Guide vào Vector Database mỗi ngày lúc 2h sáng
    @Async
    @Scheduled(cron = "0 0 2 * * ?")
    public void indexAllGuides() {
        log.info("Bắt đầu đồng bộ hóa tự động tất cả Guide vào Vector Database (Cron Job)...");
        List<User> guides = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream()
                        .anyMatch(r -> r.getName() == RoleName.GUIDE))
                .toList();

        for (User guide : guides) {
            indexGuide(guide);
        }
        log.info("Đã đồng bộ hóa {} Guide thành công.", guides.size());
    }

    // Index một Guide cụ thể
    public void indexGuide(User guide) {
        String profileText = buildGuideProfileText(guide);
        TextSegment segment = TextSegment.from(profileText, Metadata.from("guideId", guide.getId()));
        Embedding embedding = embeddingModel.embed(segment).content();

        // Xóa cũ nếu cần (nếu PgVectorEmbeddingStore hỗ trợ dựa trên metadata, hoặc xóa
        // thủ công)
        // PgVector của LangChain4j starter tự động lưu vào table: guide_embeddings
        embeddingStore.add(embedding, segment);
        log.info("Đã index Guide: {}", guide.getFullName());
    }

    public String getRecommendation(String requestId) {
        TourRequest request = tourRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.TOUR_NOT_FOUND));

        List<TourRequestInterest> interests = tourRequestInterestRepository.findByTourRequestIdOrderByCreatedAtAsc(requestId);

        if (interests.isEmpty()) {
            return "Hiện tại chưa có hướng dẫn viên nào gửi yêu cầu quan tâm đến mục này. Bạn vui lòng đợi thêm chút thời gian nhé!";
        }

        // 1. Tạo câu truy vấn từ yêu cầu của khách
        String query = String.format("Yêu cầu tour: %s. Địa điểm: %s. Mô tả: %s. Số khách: %d.",
                request.getTitle(),
                request.getLocation() != null ? request.getLocation().getName() : request.getCustomLocationName(),
                request.getDescription(),
                request.getNumberOfGuests());

        // 2. Lấy trực tiếp thông tin profiles của các HDV CÓ TRONG DANH SÁCH QUAN TÂM
        String context = interests.stream()
                .map(interest -> buildGuideProfileText(interest.getGuide()))
                .collect(Collectors.joining("\n---\n"));

        // 3. Chuẩn bị Prompt cho Gemini
        String prompt = String.format(
                "Bạn là một trợ lý du lịch thông minh. Dưới đây là danh sách các hướng dẫn viên ĐÃ QUAN TÂM và sẵn sàng nhận tour này cùng thông tin chi tiết của họ:\n\n%s\n\n"
                        +
                        "Dựa trên thông tin này, hãy phân tích và đề xuất người phù hợp nhất cho yêu cầu cụ thể sau của khách hàng:\n\"%s\"\n\n"
                        +
                        "Hãy trả lời bằng tiếng Việt một cách lịch sự, nêu rõ lý do tại sao các hướng dẫn viên này phù hợp với yêu cầu (dựa trên kinh nghiệm, đánh giá cũ, hoặc mô tả). "
                        +
                        "Nếu có nhiều người quan tâm, hãy so sánh ngắn gọn và xếp hạng độ phù hợp để khách hàng dễ chọn.",
                context, query);

        // 4. Gọi Gemini để tạo câu trả lời
        return chatModel.chat(prompt);
    }
}
