import React from "react";
import {connect} from 'react-redux';
import {Table} from "@material-ui/core";
import TableHead from "@material-ui/core/TableHead/TableHead";
import TableRow from "@material-ui/core/TableRow/TableRow";
import TableCell from "@material-ui/core/TableCell/TableCell";
import TableBody from "@material-ui/core/TableBody/TableBody";
import {getLabel, navigableLink} from "../../utils/metadatautils";
import * as metadataActions from "../../actions/metadata";
import ErrorMessage from "../error/ErrorMessage";
import {Column, Row} from "simple-flexbox";
import NewMetadataEntityDialog from "./NewMetadataEntityDialog";
import ErrorDialog from "../error/ErrorDialog";
import LoadingInlay from '../generic/Loading/LoadingInlay';
import LoadingOverlay from '../generic/Loading/LoadingOverlay';
import {withRouter} from 'react-router-dom';
import {relativeLink} from '../../utils/metadatautils';

class MetadataEntities extends React.Component {

    componentDidMount() {
        this.props.fetchAllEntitiesIfNeeded();
    }

    handleEntityCreation(type, id) {
        this.props.createMetadataEntity(type, id)
            .then(res => {
                this.props.fetchAllEntitiesIfNeeded();
                this.props.history.push(relativeLink(res.value));
            })
            .catch(e => ErrorDialog.showError(e, 'Error creating a new metadata entity.\n' + e.message))
    }


    render() {
        const {loading, creatingMetadataEntity, error, entities, vocabulary} = this.props;

        if (loading) {
            return <LoadingInlay/>
        } else if (error) {
            return <ErrorMessage message={"An error occurred while loading metadata"}/>
        }

        return (
            <div>
                <Row>
                    <Column children={[]} flexGrow={1} vertical='center' horizontal='start'/>
                    <Column>
                        <NewMetadataEntityDialog onCreate={this.handleEntityCreation.bind(this)}/>
                    </Column>
                </Row>

                <div>
                    <Table style={{marginBottom: 300}}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Label</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>URI</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {entities ? entities.map(entity => (
                                <TableRow key={entity['@id']}>
                                    <TableCell>{getLabel(entity)}</TableCell>
                                    <TableCell>
                                        {entity['@type'].map(type => (
                                            <a href={navigableLink(type)} key={type}>
                                                {getLabel(vocabulary.getById(type), true)}
                                            </a>
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        <a href={navigableLink(entity['@id'])}>{getLabel(entity)}</a>
                                    </TableCell>
                                </TableRow>
                            )) : null}
                        </TableBody>
                    </Table>
                </div>

                <LoadingOverlay loading={creatingMetadataEntity}/>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    loading: state.cache.allEntities ? state.cache.allEntities.pending : true,
    error: state.cache.allEntities ? state.cache.allEntities.error : false,
    entities: state.cache.allEntities ? state.cache.allEntities.data : [],
    vocabulary: state.cache.vocabulary ? state.cache.vocabulary.data : undefined,
    creatingMetadataEntity: state.metadataBySubject.creatingMetadataEntity
})

const mapDispatchToProps = {
    ...metadataActions
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(MetadataEntities));