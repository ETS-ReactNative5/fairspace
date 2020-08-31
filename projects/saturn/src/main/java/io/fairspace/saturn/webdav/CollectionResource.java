package io.fairspace.saturn.webdav;

import io.fairspace.saturn.vocabulary.FS;
import io.milton.http.Auth;
import io.milton.http.FileItem;
import io.milton.http.Request;
import io.milton.http.exceptions.BadRequestException;
import io.milton.http.exceptions.ConflictException;
import io.milton.http.exceptions.NotAuthorizedException;
import io.milton.resource.DisplayNameResource;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static io.fairspace.saturn.auth.RequestContext.getCurrentRequest;
import static io.fairspace.saturn.rdf.ModelUtils.getStringProperty;
import static io.fairspace.saturn.webdav.DavFactory.childSubject;
import static io.fairspace.saturn.webdav.PathUtils.name;
import static java.util.stream.Collectors.joining;

class CollectionResource extends DirectoryResource implements DisplayNameResource {

    public CollectionResource(DavFactory factory, Resource subject, Access access) {
        super(factory, subject, access);
    }

    @Override
    public boolean authorise(Request request, Request.Method method, Auth auth) {
        return switch (method) {
            case DELETE -> access.canManage();
            default -> super.authorise(request, method, auth);
        };
    }

    @Override
    public String getName() {
        return name(subject.getURI());
    }

    @Override
    public String getDisplayName() {
        return getStringProperty(subject, RDFS.label);
    }

    @Override
    public void setDisplayName(String s) {
        subject.removeAll(RDFS.label).addProperty(RDFS.label, s);
    }

    @Override
    public void moveTo(io.milton.resource.CollectionResource rDest, String name) throws ConflictException, NotAuthorizedException, BadRequestException {
        if (!(rDest instanceof RootResource)) {
            throw new BadRequestException(this, "Cannot move a collection to a non-root folder.");
        }
        ensureNameIsAvailable(name);
        var oldName = getStringProperty(subject, RDFS.label);
        super.moveTo(rDest, name);
        var newSubject = childSubject(factory.rootSubject, name);
        newSubject.removeAll(RDFS.label).addProperty(RDFS.label, oldName);
    }

    @Override
    public void copyTo(io.milton.resource.CollectionResource toCollection, String name) throws NotAuthorizedException, BadRequestException, ConflictException {
        if (!(toCollection instanceof RootResource)) {
            throw new BadRequestException(this, "Cannot copy a collection to a non-root folder.");
        }
        ensureNameIsAvailable(name);
        super.copyTo(toCollection, name);
    }

    private void ensureNameIsAvailable(String name) throws ConflictException {
        var existing = factory.root.findExistingCollectionWithNameIgnoreCase(name);
        if (existing != null) {
            throw new ConflictException(existing, "Target already exists (modulo case).");
        }
    }

    @Property
    public String getOwnedBy() {
        return subject.listProperties(FS.ownedBy).nextOptional().map(Statement::getResource).map(Resource::getURI).orElse(null);
    }

    public void setOwnedBy(Resource owner) throws NotAuthorizedException, BadRequestException {
        if (!access.canManage()) {
            throw new NotAuthorizedException(this);
        }
        if (!owner.hasProperty(RDF.type, FS.Workspace)) {
            throw new BadRequestException(this, "Invalid owner");
        }

        var old = subject.getPropertyResourceValue(FS.ownedBy);

        subject.removeAll(FS.ownedBy).addProperty(FS.ownedBy, owner);

        if (old != null) {
            subject.getModel().listResourcesWithProperty(FS.isMemberOf, old)
                    .andThen(subject.getModel().listResourcesWithProperty(FS.isManagerOf, old))
                    .filterDrop(user -> user.hasProperty(FS.isMemberOf, owner) || user.hasProperty(FS.isManagerOf, owner))
                    .filterKeep(user -> user.hasProperty(FS.canManage, subject) || user.hasProperty(FS.canWrite, subject))
                    .toList()
                    .forEach(user -> user.getModel()
                            .remove(user, FS.canManage, subject)
                            .remove(user, FS.canWrite, subject)
                            .add(user, FS.canRead, subject));
            subject.getModel()
                    .removeAll(old, FS.canManage, subject)
                    .removeAll(old, FS.canWrite, subject)
                    .removeAll(old, FS.canRead, subject)
                    .removeAll(old, FS.canManage, subject);

        }
    }

    @Property
    public Access getAccess() {
        return access;
    }

    @Property
    public AccessMode getAccessMode() {
        return AccessMode.valueOf(subject.getProperty(FS.accessMode).getString());
    }

    @Property
    public String getAvailableAccessModes() {
        return availableAccessModes()
                .stream()
                .map(Enum::name)
                .collect(joining(","));
    }

    /**
     * Compute available access modes for the collection, given its current status
     * and the user's permissions.
     *
     * Returns only the current access mode when:
     * - the current user does not have manage permission; or
     * - the status is {@link Status#Closed} (which forbids changing its access mode); or
     * - the access mode is {@link AccessMode#DataPublished}, which is terminal;
     * returns all access modes except that {@link AccessMode#DataPublished} is only
     * included when in status {@link Status#Archived} and {@link AccessMode#Restricted} is
     * excluded when in status {@link Status#Archived}.
     */
    public Set<AccessMode> availableAccessModes() {
        if (!access.canManage()) {
            return EnumSet.of(getAccessMode());
        }

        if (getStatus() == Status.Closed) {
            return EnumSet.of(getAccessMode());
        }

        if (getAccessMode() == AccessMode.DataPublished) {
            return EnumSet.of(getAccessMode());
        }

        var accessModes = EnumSet.of(AccessMode.MetadataPublished, AccessMode.Restricted);

        if (getStatus() == Status.Archived) {
            accessModes.add(AccessMode.DataPublished);
        }

        return accessModes;
    }

    @Property
    public String getUserPermissions() {
        return getPermissions(FS.User);
    }

    @Property
    public String getWorkspacePermissions() {
        return getPermissions(FS.Workspace);
    }

    @Property
    public String getComment() {
        return getStringProperty(subject, RDFS.comment);
    }

    @Property
    public String getCreatedBy() {
        return subject.listProperties(FS.createdBy).nextOptional().map(Statement::getResource).map(Resource::getURI).orElse(null);

    }

    @Property
    public Status getStatus() {
        return Status.valueOf(subject.getProperty(FS.status).getString());
    }

    @Property
    public String getAvailableStatuses() {
        return availableStatuses()
                .stream()
                .map(Enum::name)
                .collect(joining(","));
    }

    public Set<Status> availableStatuses() {
        if (!access.canManage()) {
            return EnumSet.of(getStatus());
        }

        return switch (getStatus()) {
            case Closed -> EnumSet.of(Status.Active, Status.Closed);
            default -> (getAccessMode() == AccessMode.Restricted)
                    ? EnumSet.allOf(Status.class)
                    : EnumSet.of(Status.Active, Status.Archived);
        };
    }


    private String getPermissions(Resource principalType) {
        var builder = new StringBuilder();

        dumpPermissions(FS.canManage, Access.Manage, principalType, builder);
        dumpPermissions(FS.canWrite, Access.Write, principalType, builder);
        dumpPermissions(FS.canRead, Access.Read, principalType, builder);
        dumpPermissions(FS.canList, Access.List, principalType, builder);

        return builder.toString();
    }

    private void dumpPermissions(org.apache.jena.rdf.model.Property property, Access access, Resource type, StringBuilder builder) {
        subject.getModel().listSubjectsWithProperty(property, subject)
                .filterKeep(r -> r.hasProperty(RDF.type, type))
                .filterDrop(r -> r.hasProperty(FS.dateDeleted))
                .mapWith(Resource::getURI)
                .forEachRemaining(uri -> {
                    if (builder.length() > 0) {
                        builder.append(',');
                    }
                    builder.append(uri).append(' ').append(access);
                });
    }

    @Override
    protected void performAction(String action, Map<String, String> parameters, Map<String, FileItem> files) throws BadRequestException, NotAuthorizedException, ConflictException {
        switch (action) {
            case "set_access_mode" -> setAccessMode(getEnumParameter(parameters, "mode", AccessMode.class));
            case "set_status" -> setStatus(getEnumParameter(parameters, "status", Status.class));
            case "set_permission" -> setPermission(getResourceParameter(parameters, "principal"), getEnumParameter(parameters, "access", Access.class));
            case "set_owned_by" -> setOwnedBy(getResourceParameter(parameters, "owner"));
            default -> super.performAction(action, parameters, files);
        }
    }

    private void setStatus(Status status) throws NotAuthorizedException, ConflictException {
        if (!access.canManage()) {
            throw new NotAuthorizedException(this);
        }
        if (!availableStatuses().contains(status)) {
            throw new ConflictException(this);
        }
        subject.removeAll(FS.status).addProperty(FS.status, status.name());
    }

    private void setAccessMode(AccessMode mode) throws NotAuthorizedException, ConflictException {
        if (!access.canManage()) {
            throw new NotAuthorizedException(this);
        }
        if (!availableAccessModes().contains(mode)) {
            throw new ConflictException(this);
        }
        subject.removeAll(FS.accessMode).addProperty(FS.accessMode, mode.name());
    }

    private void setPermission(Resource principal, Access grantedAccess) throws BadRequestException, NotAuthorizedException {
        if (!access.canManage()) {
            throw new NotAuthorizedException(this);
        }
        if (principal.hasProperty(RDF.type, FS.User)) {
            if (grantedAccess == Access.Write || grantedAccess == Access.Manage) {
                var ownerWs = subject.getPropertyResourceValue(FS.ownedBy);
                if (!principal.hasProperty(FS.isMemberOf, ownerWs) && !principal.hasProperty(FS.isManagerOf, ownerWs)) {
                    throw new BadRequestException(this);
                }
            }
        } else if (principal.hasProperty(RDF.type, FS.Workspace)) {
            if ((grantedAccess == Access.Write || grantedAccess == Access.Manage) && !subject.hasProperty(FS.ownedBy, principal)) {
                throw new BadRequestException(this);
            }
        } else {
            throw new BadRequestException(this, "Invalid principal");
        }

        subject.getModel()
                .removeAll(principal, FS.canList, subject)
                .removeAll(principal, FS.canRead, subject)
                .removeAll(principal, FS.canWrite, subject)
                .removeAll(principal, FS.canManage, subject);

        switch (grantedAccess) {
            case List -> principal.addProperty(FS.canList, subject);
            case Read -> principal.addProperty(FS.canRead, subject);
            case Write -> principal.addProperty(FS.canWrite, subject);
            case Manage -> principal.addProperty(FS.canManage, subject);
        }

        if (principal.hasProperty(RDF.type, FS.User) && principal.hasProperty(FS.email)) {
            var message = grantedAccess == Access.None
                    ? "Your access to collection " + getName() + " has been revoked."
                    : "You've been granted " + grantedAccess.name().toLowerCase() + " access to collection " + getName() + "\n" + subject.getURI();
            var email = principal.getProperty(FS.email).getString();
            getCurrentRequest().setAttribute(WebDAVServlet.POST_COMMIT_ACTION_ATTRIBUTE,
                    (Runnable) () -> factory.mailService.send(email, "Your access permissions changed", message));

        }
    }

    @Override
    public void delete(boolean purge) throws NotAuthorizedException, ConflictException, BadRequestException {
        switch (getAccessMode()) {
            case MetadataPublished, DataPublished -> throw new ConflictException(this);
            default -> super.delete(purge);
        }
    }

    @Override
    protected void undelete() throws BadRequestException, NotAuthorizedException, ConflictException {
        if (!access.canManage()) {
            throw new NotAuthorizedException(this);
        }
        super.undelete();
    }

    private <T extends Enum<T>> T getEnumParameter(Map<String, String> parameters, String name, Class<T> type) throws BadRequestException {
        checkParameterPresence(parameters, name);
        try {
            return Enum.valueOf(type, parameters.get(name));
        } catch (Exception e) {
            throw new BadRequestException(this, "Invalid \"" + name + "\" parameter");
        }
    }

    private Resource getResourceParameter(Map<String, String> parameters, String name) throws BadRequestException {
        checkParameterPresence(parameters, name);

        Resource r = null;
        try {
            r = subject.getModel().createResource(parameters.get(name));
        } catch (Exception ignore) {
        }
        if (r == null || r.hasProperty(FS.dateDeleted)) {
            throw new BadRequestException(this, "Invalid \"" + name + "\" parameter");
        }
        return r;
    }

    private void checkParameterPresence(Map<String, String> parameters, String name) throws BadRequestException {
        if (!parameters.containsKey(name)) {
            throw new BadRequestException(this, "Missing \"" + name + "\" parameter");
        }
    }
}
