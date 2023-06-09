use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Booking {
    pub title: String,
    pub start_time: Timestamp,
    pub end_time: Timestamp,
    pub bookers: Vec<AgentPubKey>,
    pub booking_request_hash: Option<ActionHash>,
    pub resource_hash: ActionHash,
}
pub fn validate_create_booking(
    _action: EntryCreationAction,
    booking: Booking,
) -> ExternResult<ValidateCallbackResult> {
    if let Some(action_hash) = booking.booking_request_hash.clone() {
        let record = must_get_valid_record(action_hash)?;
        let _booking_request: crate::BookingRequest = record
            .entry()
            .to_app_option()
            .map_err(|e| wasm_error!(e))?
            .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
                "Dependant action must be accompanied by an entry"
            ))))?;
    }
    let record = must_get_valid_record(booking.resource_hash.clone())?;
    let _resource: crate::Resource = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Dependant action must be accompanied by an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_update_booking(
    _action: Update,
    _booking: Booking,
    _original_action: EntryCreationAction,
    _original_booking: Booking,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_booking(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_booking: Booking,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_create_link_booking_request_to_bookings(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let action_hash = ActionHash::from(base_address);
    let record = must_get_valid_record(action_hash)?;
    let _booking_request: crate::BookingRequest = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    let action_hash = ActionHash::from(target_address);
    let record = must_get_valid_record(action_hash)?;
    let _booking: crate::Booking = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_booking_request_to_bookings(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "BookingRequestToBookings links cannot be deleted",
    )))
}
pub fn validate_create_link_resource_to_bookings(
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
    let _booking: crate::Booking = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_resource_to_bookings(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "ResourceToBookings links cannot be deleted",
    )))
}
