import PermissionAPI from '../services/PermissionAPI';
import {createErrorHandlingPromiseAction, dispatchIfNeeded} from "../utils/redux";
import {ALTER_PERMISSION, FETCH_PERMISSIONS} from "./actionTypes";

export const fetchPermissions = createErrorHandlingPromiseAction((collectionId, useCache = true) => ({
    type: FETCH_PERMISSIONS,
    payload: PermissionAPI.getCollectionPermissions(collectionId, useCache),
    meta: {
        collectionId
    }
}));

/**
 * Method to retrieve permissions from the backend when the data is not available or invalidated
 * Please note that by default it does not use the browser cache (i.e. explicitly reloading from the backend)
 *
 * @param collectionId
 * @param useCache
 * @returns {Function}
 */
export const fetchPermissionsIfNeeded = (collectionId, useCache = false) => dispatchIfNeeded(
    () => fetchPermissions(collectionId, useCache),
    state => (state && state.cache && state.cache.permissionsByCollection ? state.cache.permissionsByCollection[collectionId] : undefined)
);

export const alterPermission = createErrorHandlingPromiseAction((userId, collectionId, access) => ({
    type: ALTER_PERMISSION,
    payload: PermissionAPI.alterCollectionPermission(userId, collectionId, access),
    meta: {
        subject: userId,
        collectionId,
        access
    }
}));
