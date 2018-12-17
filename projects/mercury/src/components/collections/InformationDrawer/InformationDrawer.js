import React from 'react';
import Typography from "@material-ui/core/Typography";
import {withStyles} from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import styles from './InformationDrawer.styles';
import Collection from "./Collection";
import Metadata from "../../metadata/Metadata";
import * as metadataActions from "../../../actions/metadata";
import {connect} from 'react-redux';
import PermissionsContainer from "../../permissions/PermissionsContainer";
import permissionChecker from '../../permissions/PermissionChecker';
import {findById} from "../../../utils/arrayutils";
import PathMetadata from "../../metadata/PathMetadata";

export class InformationDrawer extends React.Component {

    handleDetailsChange = (collection) => {
        const {fetchCombinedMetadataIfNeeded, invalidateMetadata} = this.props;
        invalidateMetadata(collection.uri);
        fetchCombinedMetadataIfNeeded(collection.uri);
    };

    render() {
        const {classes, collection, collectionAPI} = this.props;

        if (!collection) {
            return <Typography variant="h6">No collection</Typography>;
        }

        const isMetaDataEditable =
            permissionChecker.canManage(collection) &&
            this.props.paths.length === 0;

        return <React.Fragment>
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography className={classes.heading}>Collection Details</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Collection
                        collection={collection}
                        collectionAPI={collectionAPI}
                        onDidChangeDetails={this.handleDetailsChange}
                    />
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography className={classes.heading}>Collaborators:</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <PermissionsContainer
                        collectionId={collection.id}
                        canManage={permissionChecker.canManage(collection)}
                    />
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel defaultExpanded>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography className={classes.heading}>Collection metadata</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Metadata
                        subject={collection.uri}
                        editable={isMetaDataEditable}
                        style={{width: '100%'}}
                    />
                </ExpansionPanelDetails>
            </ExpansionPanel>
            {
                this.props.paths.map(path => (
                    <ExpansionPanel defaultExpanded>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography className={classes.heading}>Metadata for {relativePath(path)}</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <PathMetadata
                                path={path}
                                editable={permissionChecker.canManage(collection) && path === this.props.paths[this.props.paths.length - 1]}
                                style={{width: '100%'}}
                            />
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                ))
            }
        </React.Fragment>
    };


}

const mapStateToProps = ({cache: {collections}, collectionBrowser: {selectedCollectionId, openedPath, selectedPaths}}) => {
    return {
        collection: findById(collections.data, selectedCollectionId),
        paths: pathHierarchy((selectedPaths.length === 1) ? selectedPaths[0] : openedPath)
    }
};

function pathHierarchy(fullPath) {
    let paths = [];
    while (fullPath && fullPath.lastIndexOf('/') > 0) {
        paths.push(fullPath);
        fullPath = fullPath.substring(0, fullPath.lastIndexOf('/'))
    }
    return paths.reverse();
}

const relativePath = (path) => path.split('/').slice(2).join('/');

const mapDispatchToProps = {
    ...metadataActions,
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(InformationDrawer));

