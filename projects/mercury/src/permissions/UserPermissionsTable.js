// @flow
import React from 'react';
import {IconButton, Table, TableBody, TableCell, TableRow, Tooltip, Typography, withStyles} from '@material-ui/core';
import {Close, Person} from "@material-ui/icons";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import PropTypes from "prop-types";
import {accessLevels} from "../collections/CollectionAPI";
import type {AccessLevel, Permission, Principal} from "../collections/CollectionAPI";

const styles = {
    table: {
        padding: 0
    },
    tableBody: {
        display: 'block',
        maxHeight: 150,
        overflowX: 'auto'
    },
    tableRow: {
        display: 'block',
        height: 49,
        width: '100%'
    },
    iconCellButton: {
        paddingTop: 0,
        paddingBottom: 0,
        textAlign: "right"
    },
    emptyPermissions: {
        margin: 15,
        width: 350,
        fontStyle: 'italic'
    },
    accessDropdown: {
        fontSize: 14
    }
};

export const UserPermissionsTable = ({selectedPermissions = [], emptyPermissionsText, workspaceUsers = [], currentUser,
    handleChangePermission, handleDeletePermission, canManage, classes}) => {
    if (selectedPermissions.length === 0) {
        return (
            <Typography variant="body2" className={classes.emptyPermissions}>
                {emptyPermissionsText}
            </Typography>
        );
    }

    const availableWorkspaceMemberAccessLevels = accessLevels.filter(a => a !== "None" && a !== "List");
    const getAccessLevelsForPrincipal: AccessLevel[] = (selectedPrincipal: Principal) => {
        if (workspaceUsers.some(wu => wu.iri === selectedPrincipal.iri)) {
            return availableWorkspaceMemberAccessLevels;
        }
        return ['Read'];
    };

    const canManagePermission:boolean = (permission: Permission) => (
        canManage && currentUser && permission.iri !== currentUser.iri
    );

    const renderAccessLevelDropdown = (selectedPermission: Permission, accessLevelOptions: AccessLevel[]) => (
        <FormControl>
            <Select
                value={selectedPermission.access}
                onChange={v => handleChangePermission({
                    ...selectedPermission,
                    access: v.target.value
                })}
                className={classes.accessDropdown}
            >
                {accessLevelOptions.map(access => (
                    <MenuItem key={access} value={access}>
                        <span>{access}</span>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <Table size="small" className={classes.table}>
            <TableBody className={classes.tableBody}>
                {
                    selectedPermissions.map(p => {
                        const accessLevelOptions: AccessLevel[] = getAccessLevelsForPrincipal(p);
                        const canManageCurrentPermission = canManagePermission(p);
                        return (
                            <TableRow key={p.iri} className={classes.tableRow}>
                                <TableCell width={30}>
                                    <Person />
                                </TableCell>
                                <TableCell
                                    width={275}
                                    data-testid="permission"
                                >
                                    <Tooltip title={p.name} placement="left-start" arrow>
                                        <Typography variant="body2" noWrap style={{width: 275}}>
                                            {p.name}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell width={90}>
                                    {canManageCurrentPermission && accessLevelOptions.length > 1 ? (
                                        renderAccessLevelDropdown(p, accessLevelOptions)
                                    ) : (
                                        <span>{p.access}</span>
                                    )}
                                </TableCell>
                                <TableCell width={40} className={classes.iconCellButton}>
                                    <IconButton
                                        onClick={() => handleDeletePermission(p)}
                                        disabled={!canManageCurrentPermission}
                                    >
                                        <Close />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        );
                    })
                }
            </TableBody>
        </Table>
    );
};

UserPermissionsTable.propTypes = {
    classes: PropTypes.object.isRequired,
    selectedPermissions: PropTypes.array,
    emptyPermissionsText: PropTypes.string,
    workspaceUsers: PropTypes.array,
    currentUser: PropTypes.object,
    handleChangePermission: PropTypes.func.isRequired,
    handleDeletePermission: PropTypes.func.isRequired,
    canManage: PropTypes.bool
};

export default withStyles(styles)(UserPermissionsTable);