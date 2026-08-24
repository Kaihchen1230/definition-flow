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
    private final DemoActorRepository actorRepository;

    public DemoDataController(DemoDataService demoDataService, DemoActorRepository actorRepository) {
        this.demoDataService = demoDataService;
        this.actorRepository = actorRepository;
    }

    @PostMapping("/reset")
    public Map<String, Object> reset() {
        return demoDataService.reset();
    }

    @GetMapping("/actors")
    public List<DemoActorEntity> actors() {
        return actorRepository.findAll();
    }
}

