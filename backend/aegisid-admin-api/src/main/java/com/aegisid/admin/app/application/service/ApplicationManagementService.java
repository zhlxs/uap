package com.aegisid.admin.app.application.service;

import com.aegisid.admin.app.application.command.CreateApplicationCommand;
import com.aegisid.admin.app.domain.model.Application;
import java.util.List;

public interface ApplicationManagementService {
    Application create(CreateApplicationCommand command);

    List<Application> list();
}

