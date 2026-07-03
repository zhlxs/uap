package com.aegisid.auth.web;

import com.aegisid.common.api.ApiResponse;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicMetadataController {
    @GetMapping("/product")
    ApiResponse<Map<String, String>> product() {
        return ApiResponse.ok(Map.of(
                "name", "AegisID",
                "service", "auth-server"
        ));
    }
}

