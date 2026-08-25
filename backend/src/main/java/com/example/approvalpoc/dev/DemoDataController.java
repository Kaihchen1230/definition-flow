package com.example.approvalpoc.dev;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev/demo")
public class DemoDataController {
    private final DemoDataService demoDataService;
    private final DemoUserRepository userRepository;

    public DemoDataController(DemoDataService demoDataService, DemoUserRepository userRepository) {
        this.demoDataService = demoDataService;
        this.userRepository = userRepository;
    }

    @PostMapping("/reset")
    public Map<String, Object> reset() {
        return demoDataService.reset();
    }

    @GetMapping("/users")
    public List<DemoUserEntity> users() {
        return userRepository.findAll();
    }
}

