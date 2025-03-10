package io.fairspace.saturn.auth;

import io.fairspace.saturn.config.Config;
import lombok.extern.log4j.*;
import org.eclipse.jetty.security.ConstraintMapping;
import org.eclipse.jetty.security.ConstraintSecurityHandler;
import org.eclipse.jetty.util.security.Constraint;
import org.keycloak.common.enums.SslRequired;
import org.keycloak.enums.TokenStore;
import org.keycloak.representations.adapters.config.AdapterConfig;

import java.util.Map;

import static io.fairspace.saturn.config.ConfigLoader.CONFIG;
import static java.lang.System.getenv;

@Log4j2
public class SaturnSecurityHandler extends ConstraintSecurityHandler {
    public SaturnSecurityHandler(Config.Auth config) {
        setAuthenticator(new SaturnKeycloakJettyAuthenticator(adapterConfig(config)));
        addConstraintMapping(constraintMapping("/*", true));
        addConstraintMapping(constraintMapping("/api/health/", false));
        addConstraintMapping(constraintMapping("/favicon.ico", false));
    }

    private static AdapterConfig adapterConfig(Config.Auth config) {
        var adapterConfig = new AdapterConfig();
        adapterConfig.setResource(config.clientId);
        adapterConfig.setRealm(config.realm);
        adapterConfig.setCors(true);
        adapterConfig.setAuthServerUrl(CONFIG.auth.authServerUrl);
        adapterConfig.setTokenStore(TokenStore.SESSION.name());
        adapterConfig.setCredentials(Map.of("secret",  getenv("KEYCLOAK_CLIENT_SECRET")));
        adapterConfig.setEnableBasicAuth(config.enableBasicAuth);

        var unsecure = CONFIG.auth.authServerUrl.startsWith("http://");
        adapterConfig.setSslRequired(SslRequired.NONE.name());
        if (unsecure) {
            log.warn("The Keycloak authServerUrl does not use HTTPS, which means it is not secure. Don't do this in production!");
        } else {
            adapterConfig.setSslRequired(SslRequired.ALL.name());
            adapterConfig.setConfidentialPort(443);
        }
        return adapterConfig;
    }

    private static ConstraintMapping constraintMapping(String pathSpec, boolean authenticate) {
        var constraint = new Constraint();
        constraint.setRoles(new String[] {Constraint.ANY_AUTH});
        constraint.setAuthenticate(authenticate);
        var mapping = new ConstraintMapping();
        mapping.setConstraint(constraint);
        mapping.setPathSpec(pathSpec);
        return mapping;
    }
}
