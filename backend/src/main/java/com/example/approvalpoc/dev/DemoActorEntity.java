package com.example.approvalpoc.dev;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_actor")
public class DemoActorEntity {
    @Id
    private String id;
    private String displayName;
    private String role;
    private String entitlements;
    private String groupsJson;

    protected DemoActorEntity() {
    }

    public DemoActorEntity(String id, String displayName, String role, String entitlements, String groupsJson) {
        this.id = id;
        this.displayName = displayName;
        this.role = role;
        this.entitlements = entitlements;
        this.groupsJson = groupsJson;
    }

    public String getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getRole() {
        return role;
    }

    public String getEntitlements() {
        return entitlements;
    }

    public String getGroupsJson() {
        return groupsJson;
    }
}

