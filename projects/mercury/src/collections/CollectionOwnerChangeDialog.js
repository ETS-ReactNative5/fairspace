// @flow
import React, {useState} from 'react';
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import {compareBy} from "../common/utils/genericUtils";
import Dropdown from "../metadata/common/values/Dropdown";


export const CollectionOwnerChangeDialog = ({collection, workspaces, setOwnedBy, onClose}) => {
    const [selectedValue, setSelectedValue] = useState();
    const [openDialog, setOpenDialog] = useState(true);

    const options = workspaces
        .sort(compareBy('name'))
        .map(workspace => (
            {
                label: workspace.name,
                ...workspace
            }
        ));

    const handleValueChange = (selectedOwnerWorkspace) => {
        if (selectedOwnerWorkspace) {
            setSelectedValue({label: selectedOwnerWorkspace.name, ...selectedOwnerWorkspace});
        } else {
            setSelectedValue(null);
        }
    };

    const handleSubmit = () => {
        if (selectedValue) {
            setOpenDialog(false);
            setOwnedBy(collection.location, selectedValue.iri);
            onClose();
        }
    };

    const handleCancel = () => {
        setOpenDialog(false);
        onClose();
    };

    return (
        <Dialog
            open={openDialog}
            data-testid="property-change-dialog"
        >
            <DialogTitle id="property-change-dialog-title">Transfer the collection ownership to another workspace</DialogTitle>
            <DialogContent>
                <div>
                    <Dropdown
                        options={options}
                        clearTextOnSelection={false}
                        isOptionDisabled={option => option.iri === collection.ownerWorkspace}
                        onChange={handleValueChange}
                        label="Select a workspace"
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleSubmit}
                    color="primary"
                    disabled={Boolean(!selectedValue)}
                    data-testid="submit"
                >
                    Save
                </Button>
                <Button
                    onClick={handleCancel}
                    color="default"
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CollectionOwnerChangeDialog;
