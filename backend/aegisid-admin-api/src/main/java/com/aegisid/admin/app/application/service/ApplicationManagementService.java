package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.application.command.CreateApplicationCommand;
import com.aegisid.admin.app.application.command.CreateOAuthClientCommand;
import com.aegisid.admin.app.application.query.CreatedClientSecret;
import com.aegisid.admin.app.domain.model.Application;
import com.aegisid.admin.app.domain.model.OAuthClient;
import java.util.List;

public interface ApplicationManagementService {
    Application create(CreateApplicationCommand command);

    Application get(String id);

    List<Application> list();

    Application enable(String id);

    Application disable(String id);

    OAuthClient createOAuthClient(CreateOAuthClientCommand command);

    CreatedClientSecret createClientSecret(String clientId);
}
