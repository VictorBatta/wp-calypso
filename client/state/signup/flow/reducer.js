import {
	SIGNUP_CURRENT_FLOW_NAME_SET,
	SIGNUP_PREVIOUS_FLOW_NAME_SET,
} from 'calypso/state/action-types';
import { combineReducers, withSchemaValidation } from 'calypso/state/utils';
import { currentFlowNameSchema, previousFlowNameSchema } from './schema';

export const currentFlowName = withSchemaValidation(
	currentFlowNameSchema,
	( state = '', { flowName, type } ) => ( type === SIGNUP_CURRENT_FLOW_NAME_SET ? flowName : state )
);

export const previousFlowName = withSchemaValidation(
	previousFlowNameSchema,
	( state = '', { flowName, type } ) =>
		type === SIGNUP_PREVIOUS_FLOW_NAME_SET ? flowName : state
);

export default combineReducers( {
	currentFlowName,
	previousFlowName,
} );
