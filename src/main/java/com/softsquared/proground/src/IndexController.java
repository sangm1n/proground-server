package com.softsquared.proground.src;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
public class IndexController {
    @GetMapping("index")
    public String index() {
        return "index";
    }
}