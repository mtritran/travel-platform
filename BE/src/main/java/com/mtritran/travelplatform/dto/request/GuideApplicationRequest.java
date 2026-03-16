package com.mtritran.travelplatform.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GuideApplicationRequest {
    MultipartFile idCardFile;
    MultipartFile guideCardFile;
    MultipartFile certificateFile;
}
