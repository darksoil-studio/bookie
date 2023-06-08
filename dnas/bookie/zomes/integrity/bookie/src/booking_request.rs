use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct BookingRequest {
    pub resource_hash: ActionHash,
    pub title: String,
    pub comment: String,
    pub start_time: Timestamp,
    pub end_time: Timestamp,
}
pub fn validate_create_booking_request(
    _action: EntryCreationAction,
    booking_request: BookingRequest,
) -> ExternResult<ValidateCallbackResult> {
    let record = must_get_valid_record(booking_request.resource_hash.clone())?;
    let _resource: crate::Resource = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Dependant action must be accompanied by an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_booking_request(
    _action: Update,
    _booking_request: BookingRequest,
    _original_action: EntryCreationAction,
    _original_booking_request: BookingRequest,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_booking_request(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_booking_request: BookingRequest,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_resource_to_booking_requests(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _resource: crate::Resource = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _booking_request: crate::BookingRequest = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_resource_to_booking_requests(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_my_booking_requests(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _booking_request: crate::BookingRequest = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    // TODO: add the appropriate validation rules
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_my_booking_requests(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
