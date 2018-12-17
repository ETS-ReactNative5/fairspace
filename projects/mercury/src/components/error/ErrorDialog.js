import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import Icon from "@material-ui/core/Icon";
import {Column, Row} from 'simple-flexbox';


function Transition(props) {
    return <Slide direction="up" {...props} />;
}

/**
 * This component is displayed when an error has occurred.
 */
class ErrorDialog extends React.Component {
    static instance;

    constructor(props) {
        super(props);
        this.props = props;
        this.message = props.errorMessage;
        this.state = {
            error: false,
            message: null,
            stackTrace: null
        };
        ErrorDialog.instance = this;
    }

    static showError(error, message, onRetry = null) {
        console.error(message, error);
        if (ErrorDialog.instance) {
            ErrorDialog.instance.setState({error: true, stackTrace: error, message: message, onRetry: onRetry})
        }
    }

    componentDidCatch(error, info) {
        ErrorDialog.showError(error, error.message);
    }

    handleClose = () => {
        this.setState({error: false, onRetry: null, stackTrace: null});
    };

    handleRetry = () => {
        let retry = this.state.onRetry;
        this.setState({error: false, onRetry: null, stackTrace: null});
        retry()
    };

    render() {
        let dialog = (
                <Dialog
                    open={this.state.error}
                    TransitionComponent={Transition}
                    onClose={this.handleClose}
                    aria-labelledby="alert-dialog-slide-title"
                    aria-describedby="alert-dialog-slide-description"
                    key={"error-dialog"}
                >
                    <DialogTitle id="alert-dialog-slide-title">
                        <Row>
                            <Column vertical='center' horizontal='start'>
                                    <Icon color="error" style={{fontSize: 40, padding: '5px'}}>report_problem</Icon>
                            </Column>
                            <Column vertical='center' horizontal='start'>
                                {"An error has occurred"}
                            </Column>
                        </Row>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-slide-description">
                            {this.state.message}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose.bind(this)} color="primary">
                            Dismiss
                        </Button>
                        {this.state.onRetry ?
                            (<Button onClick={this.handleRetry.bind(this)} color="primary">
                                Retry
                            </Button>)
                            : null
                        }
                    </DialogActions>
                </Dialog>
        );

        return [this.props.children, dialog];
    }
}

export default ErrorDialog;