package com.example.approvalpoc.dev;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DemoUserStartupInitializer implements ApplicationRunner {
    private final DemoDataService demoDataService;

    public DemoUserStartupInitializer(DemoDataService demoDataService) {
        this.demoDataService = demoDataService;
    }

    @Override
    public void run(ApplicationArguments args) {
        demoDataService.syncUsers();
    }
}
