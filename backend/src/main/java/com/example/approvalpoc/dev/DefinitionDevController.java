package com.example.approvalpoc.dev;

import com.example.approvalpoc.definition.DefinitionLoaderService;
import com.example.approvalpoc.definition.DefinitionReloadResult;
import java.io.IOException;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev/definitions")
public class DefinitionDevController {
    private final DefinitionLoaderService loaderService;

    public DefinitionDevController(DefinitionLoaderService loaderService) {
        this.loaderService = loaderService;
    }

    @PostMapping("/reload/{requestType}")
    public DefinitionReloadResult reload(@PathVariable String requestType) throws IOException {
        return loaderService.reload(requestType);
    }
}

