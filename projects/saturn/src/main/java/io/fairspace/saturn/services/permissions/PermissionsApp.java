package io.fairspace.saturn.services.permissions;

import io.fairspace.saturn.services.BaseApp;
import lombok.AllArgsConstructor;
import org.apache.jena.graph.Node;
import spark.Request;

import static io.fairspace.saturn.util.ValidationUtils.validate;
import static org.apache.jena.graph.NodeFactory.createURI;
import static org.eclipse.jetty.http.MimeTypes.Type.APPLICATION_JSON;
import static spark.Spark.*;

@AllArgsConstructor
public class PermissionsApp extends BaseApp {
    private final String pathPrefix;
    private final PermissionsService permissionsService;

    @Override
    public void init() {
        super.init();

        path(pathPrefix + "/permissions", () -> {
            get("/", APPLICATION_JSON.asString(), (req, res) -> {
                res.type(APPLICATION_JSON.asString());
                if (req.queryParams().contains("all")) {
                    return mapper.writeValueAsString(permissionsService.getPermissions(getIri(req))
                            .entrySet()
                            .stream()
                            .map(e -> new PermissionDto(e.getKey(), e.getValue()))
                            .toArray());
                }

                return mapper.writeValueAsString(new AccessDto(permissionsService.getPermission(getIri(req))));
            });

            put("/", (req, res) -> {
                var dto = mapper.readValue(req.body(), PermissionDto.class);
                permissionsService.setPermission(getIri(req), dto.getUser(), dto.getAccess());
                res.type(APPLICATION_JSON.asString());
                return mapper.writeValueAsString(dto);
            });

            path("/restricted/", () -> {
                get("/", APPLICATION_JSON.asString(), (req, res) -> {
                    res.type(APPLICATION_JSON.asString());
                    return mapper.writeValueAsString(new RestrictedDto(permissionsService.isWriteRestricted(getIri(req))));
                });

                put("/", (req, res) -> {
                    permissionsService.setWriteRestricted(getIri(req), mapper.readValue(req.body(), RestrictedDto.class).isRestricted());
                    return "";
                });
            });
        });
    }

    private static Node getIri(Request request) {
        var iri = request.queryParams("iri");
        validate(iri != null, "Query parameter \"iri\" is mandatory");
        return createURI(iri);
    }
}