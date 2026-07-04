package com.aegisid.auth.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginPageController {
    @GetMapping("/")
    String index() {
        return "redirect:/session";
    }

    @GetMapping("/login")
    String login() {
        return "login";
    }

    @GetMapping("/session")
    String session() {
        return "session";
    }
}
