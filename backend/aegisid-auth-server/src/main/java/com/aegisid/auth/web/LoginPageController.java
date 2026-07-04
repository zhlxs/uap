package com.aegisid.auth.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginPageController {
    @GetMapping("/login")
    String login() {
        return "login";
    }
}
