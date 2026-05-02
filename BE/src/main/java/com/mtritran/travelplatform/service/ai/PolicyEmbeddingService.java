package com.mtritran.travelplatform.service.ai;

import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class PolicyEmbeddingService {

    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> policyEmbeddingStore;

    public PolicyEmbeddingService(
            EmbeddingModel embeddingModel,
            @Qualifier("policyEmbeddingStore") EmbeddingStore<TextSegment> policyEmbeddingStore) {
        this.embeddingModel = embeddingModel;
        this.policyEmbeddingStore = policyEmbeddingStore;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void indexPolicies() {
        try {
            // Đọc tri thức từ file manual.md
            ClassPathResource resource = new ClassPathResource("knowledge/travelx_manual.md");
            String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            // Tách thành các đoạn dựa trên Heading (## )
            String[] sections = content.split("(?=## )");
            List<String> policies = Arrays.stream(sections)
                    .filter(s -> !s.isBlank())
                    .map(String::trim)
                    .toList();

            for (int i = 0; i < policies.size(); i++) {
                String text = policies.get(i);
                TextSegment segment = TextSegment.from(text, Metadata.from("policyId", "p-" + i));
                Embedding embedding = embeddingModel.embed(segment).content();
                policyEmbeddingStore.add(embedding, segment);
            }
            log.info("[PolicyRAG] Indexed {} system knowledge sections into Vector DB.", policies.size());
        } catch (Exception e) {
            log.error("[PolicyRAG] Failed to index system manual: {}", e.getMessage());
        }
    }

    public EmbeddingStore<TextSegment> getStore() {
        return policyEmbeddingStore;
    }
}
