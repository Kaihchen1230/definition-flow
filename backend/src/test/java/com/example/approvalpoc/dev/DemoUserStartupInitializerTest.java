package com.example.approvalpoc.dev;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class DemoUserStartupInitializerTest {
    @Test
    void refreshesDemoUsersWhenTheBackendStarts() {
        DemoDataService demoDataService = mock(DemoDataService.class);
        DemoUserStartupInitializer initializer = new DemoUserStartupInitializer(demoDataService);

        initializer.run(new DefaultApplicationArguments(new String[0]));

        verify(demoDataService).syncUsers();
    }
}
