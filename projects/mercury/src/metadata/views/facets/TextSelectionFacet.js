/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react';
import {
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    InputAdornment,
    Switch,
    TextField,
    Tooltip,
    Typography
} from "@material-ui/core";
import {CheckBox, CheckBoxOutlineBlank, Clear, Search} from "@material-ui/icons";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import type {MetadataViewFacetProperties, Option} from "../MetadataViewFacetFactory";
import Iri from "../../../common/components/Iri";
import {collectionAccessIcon} from '../../../collections/collectionUtils';

type SelectProperties = {
    options: Option[];
    onChange: (string[]) => void;
    textFilterValue: string;
    activeFilterValues: any[];
}

const SelectMultiple = (props: SelectProperties) => {
    const {options, onChange, textFilterValue, activeFilterValues, accessFilterValue, classes} = props;
    const defaultOptions = Object.fromEntries(options.map(option => [option.value, activeFilterValues.includes(option.value)]));
    const [state, setState] = useState(defaultOptions);

    const textFilter = (val) => (textFilterValue.trim() === "" || val.label.toLowerCase().includes(textFilterValue.toLowerCase()));

    const readAccessFilter = (val) => (!accessFilterValue || val.access !== 'List');

    const filterOptions = (): Option[] => (options.filter(readAccessFilter).filter(textFilter));

    useEffect(() => {
        setState(defaultOptions);
    }, [activeFilterValues]);

    useEffect(() => {
        if (accessFilterValue) {
            const selectedReadableOnly = Object.entries(state)
                .filter(([option, checked]) => options.filter(readAccessFilter).map(o => o.value).includes(option))
                .map(([option, checked]) => option);
            onChange(selectedReadableOnly);
        }
    }, [accessFilterValue]);

    const handleChange = (event) => {
        const newState = {...state, [event.target.name]: event.target.checked};
        setState(newState);
        const selected = Object.entries(newState)
            .filter(([option, checked]) => checked)
            .map(([option, checked]) => option);
        onChange(selected);
    };

    const renderCheckboxListElement = (option) => (
        <FormControlLabel
            key={option.value}
            control={(
                <Checkbox
                    checked={state[option.value]}
                    onChange={handleChange}
                    name={option.value}
                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                    checkedIcon={<CheckBox fontSize="small" />}
                />
            )}
            label={(
                <Tooltip title={<Iri iri={option.value} />}>
                    <Typography variant="body2">
                        {option.label}
                    </Typography>
                </Tooltip>
            )}
        />
    );

    const renderCheckboxList = () => {
        return filterOptions().map(option => (
            <Grid container direction="row" key={option.value}>
                <Grid item xs={10}>
                    {renderCheckboxListElement(option)}
                </Grid>
                <Grid item xs={2} style={{textAlign: "right"}}>
                    <FontAwesomeIcon
                        title={`${option.access} access`}
                        icon={collectionAccessIcon(option.access)}
                        size="sm"
                    />
                </Grid>
            </Grid>
        ));
    };

    return (
        <FormGroup className={classes.multiselectList}>
            {renderCheckboxList()}
        </FormGroup>
    );
};

const TextSelectionFacet = (props: MetadataViewFacetProperties) => {
    const {options = [], onChange = () => {}, activeFilterValues, classes} = props;
    const [textFilterValue, setTextFilterValue] = useState("");
    const [showReadableFilterSelected, setShowReadableFilterSelected] = useState(false);

    const showTextFilter = options.length > 5; // TODO decide if it should be conditional or configurable
    const showAccessFilter = options.some(o => o.access);

    if (!options || options.length === 0) {
        return (
            <Typography variant="body2">
                No filter available.
            </Typography>
        );
    }

    const renderAccessFilter = () => (
        <FormGroup className={classes.accessFilter}>
            <FormControlLabel
                control={(
                    <Switch
                        size="small"
                        color="primary"
                        checked={showReadableFilterSelected}
                        onChange={() => setShowReadableFilterSelected(!showReadableFilterSelected)}
                    />
                )}
                label="Show only readable"
            />
        </FormGroup>
    );

    const renderTextFilter = () => (
        <TextField
            value={textFilterValue}
            onChange={e => setTextFilterValue(e.target.value)}
            style={{marginBottom: 8}}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search fontSize="small" />
                    </InputAdornment>
                ),
                endAdornment: (
                    <InputAdornment position="end">
                        {textFilterValue && (
                            <IconButton
                                onClick={() => setTextFilterValue("")}
                                disabled={!textFilterValue}
                                style={{order: 1}}
                            >
                                <Clear color="disabled" fontSize="small" />
                            </IconButton>
                        )}
                    </InputAdornment>
                ),
            }}
        />
    );

    const renderFilters = () => (
        <div>
            {showTextFilter && renderTextFilter()}
            {showAccessFilter && renderAccessFilter()}
        </div>
    );

    return (
        <>
            {renderFilters()}
            <div className={classes.textContent}>
                <FormControl component="fieldset" style={{width: "100%"}}>
                    <SelectMultiple
                        options={options}
                        onChange={onChange}
                        classes={classes}
                        textFilterValue={textFilterValue}
                        activeFilterValues={activeFilterValues}
                        accessFilterValue={showReadableFilterSelected}
                    />
                </FormControl>
            </div>
        </>
    );
};

export default TextSelectionFacet;
