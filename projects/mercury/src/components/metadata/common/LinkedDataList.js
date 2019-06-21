import React from "react";
import {ListItemText, Paper, Table, TableBody, TableCell, TableHead, TableRow, withStyles} from "@material-ui/core";
import styles from './LinkedDataList.styles';
import SearchResultHighlights from "../../search/SearchResultHighlights";
import {TOOLTIP_ENTER_DELAY} from "../../../constants";
import IriTooltip from "../../common/IriTooltip";

const LinkedDataList = ({items = [], total, hasHighlights, onOpen, classes, typeRender, footerRender}) => {
    const renderRow = (entry) => {
        const {id, primaryText, secondaryText, highlights} = entry;

        return (
            <IriTooltip
                key={id}
                enterDelay={TOOLTIP_ENTER_DELAY}
                title={id}
            >
                <TableRow
                    key={id}
                    hover
                    onDoubleClick={() => onOpen(id)}
                >
                    <TableCell style={{
                        width: hasHighlights ? '40%' : '65%',
                        paddingTop: 10,
                        paddingBottom: 10,
                    }}
                    >
                        <ListItemText primary={primaryText} secondary={secondaryText} />
                    </TableCell>
                    <TableCell style={{minWidth: 140}}>
                        {typeRender(entry)}
                    </TableCell>
                    {hasHighlights && (
                        <TableCell style={{minWidth: 200}}>
                            <SearchResultHighlights highlights={highlights} />
                        </TableCell>
                    )}
                </TableRow>
            </IriTooltip>
        );
    };

    return (
        <Paper className={classes.root}>
            <Table className={classes.table}>
                <TableHead>
                    <TableRow>
                        <TableCell>Entity</TableCell>
                        <TableCell>Type</TableCell>
                        {hasHighlights && <TableCell>Match</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map(renderRow)}
                </TableBody>
                {footerRender({count: total, colSpan: hasHighlights ? 4 : 3})}
            </Table>
        </Paper>
    );
};

export default withStyles(styles)(LinkedDataList);