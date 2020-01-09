import React from 'react';
import {NavLink, withRouter} from "react-router-dom";
import {Divider, Icon, List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";

import Config from '../services/Config';
import {currentProject, projectPrefix} from "../../projects/projects";
import ListSubheader from '@material-ui/core/ListSubheader';


const Menu = ({location: {pathname}}) => {
    const project = currentProject();
    return (
    <>
        <List>
            <ListItem
                component={NavLink}
                to={"/projects"}
                button
                selected={pathname === '/projects'}
            >
                <ListItemIcon>
                    <Icon>widgets</Icon>
                </ListItemIcon>
                <ListItemText primary="Projects" />
            </ListItem>
        </List>
        <Divider />
        { project ?
            <List>
            <ListSubheader>
                Project: {project}
            </ListSubheader>
            <ListItem
                component={NavLink}
                exact
                to={projectPrefix() + "/"}
                button
                selected={pathname === projectPrefix() + "/"}
            >
                <ListItemIcon>
                    <Icon>home</Icon>
                </ListItemIcon>
                <ListItemText primary="Overview" />
            </ListItem>
            <ListItem
                component={NavLink}
                to={projectPrefix() + "/collections"}
                button
                selected={pathname.startsWith(projectPrefix() + '/collections')}
            >
                <ListItemIcon>
                    <Icon>folder_open</Icon>
                </ListItemIcon>
                <ListItemText primary="Collections" />
            </ListItem>
            {Config.get().urls.jupyterhub ? (
                <ListItem
                    component={NavLink}
                    to={projectPrefix() + "/notebooks"}
                    button
                    selected={pathname.startsWith(projectPrefix() + '/notebooks')}
                >
                    <ListItemIcon>
                        <Icon>bar_chart</Icon>
                    </ListItemIcon>
                    <ListItemText primary="Notebooks" />
                </ListItem>
            ) : null}
            <ListItem
                component={NavLink}
                to={projectPrefix() + "/metadata"}
                button
            >
                <ListItemIcon>
                    <Icon>assignment</Icon>
                </ListItemIcon>
                <ListItemText primary="Metadata" />
            </ListItem>
            <ListItem
                component={NavLink}
                to={projectPrefix() + "/vocabulary"}
                button
                selected={pathname.startsWith(projectPrefix() + '/vocabulary')}
            >
                <ListItemIcon>
                    <Icon>code</Icon>
                </ListItemIcon>
                <ListItemText primary="Vocabulary" />
            </ListItem>
        </List> : null }
        <Divider />
        <List>
            {Config.get().urls.dataverse ? (
                <ListItem button component="a" href={Config.get().urls.dataverse}>
                    <ListItemIcon>
                        <Icon>open_in_new</Icon>
                    </ListItemIcon>
                    <ListItemText primary="Dataverse" />
                </ListItem>
            ) : null}
            {Config.get().urls.cbioportal ? (
                <ListItem component="a" href={Config.get().urls.cbioportal} button>
                    <ListItemIcon>
                        <Icon>open_in_new</Icon>
                    </ListItemIcon>
                    <ListItemText primary="cBioportal" />
                </ListItem>
            ) : null}
        </List>
    </>
)};

export default withRouter(Menu);
