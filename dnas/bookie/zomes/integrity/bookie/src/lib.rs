pub mod booker_to_bookings;
pub use booker_to_bookings::*;
pub mod booking;
pub use booking::*;
pub mod booking_request;
pub use booking_request::*;
pub mod resource;
pub use resource::*;
use hdi::prelude::*;
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Resource(Resource),
    BookingRequest(BookingRequest),
    Booking(Booking),
}
#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    ResourceUpdates,
    ResourceToBookingRequests,
    BookingRequestToBookings,
    ResourceToBookings,
    AllResources,
    MyResources,
    MyBookingRequests,
    BookerToBookings,
}
#[hdk_extern]
pub fn genesis_self_check(
    _data: GenesisSelfCheckData,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_agent_joining(
    _agent_pub_key: AgentPubKey,
    _membrane_proof: &Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => {
            match store_entry {
                OpEntry::CreateEntry { app_entry, action } => {
                    match app_entry {
                        EntryTypes::Resource(resource) => {
                            validate_create_resource(
                                EntryCreationAction::Create(action),
                                resource,
                            )
                        }
                        EntryTypes::BookingRequest(booking_request) => {
                            validate_create_booking_request(
                                EntryCreationAction::Create(action),
                                booking_request,
                            )
                        }
                        EntryTypes::Booking(booking) => {
                            validate_create_booking(
                                EntryCreationAction::Create(action),
                                booking,
                            )
                        }
                    }
                }
                OpEntry::UpdateEntry { app_entry, action, .. } => {
                    match app_entry {
                        EntryTypes::Resource(resource) => {
                            validate_create_resource(
                                EntryCreationAction::Update(action),
                                resource,
                            )
                        }
                        EntryTypes::BookingRequest(booking_request) => {
                            validate_create_booking_request(
                                EntryCreationAction::Update(action),
                                booking_request,
                            )
                        }
                        EntryTypes::Booking(booking) => {
                            validate_create_booking(
                                EntryCreationAction::Update(action),
                                booking,
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterUpdate(update_entry) => {
            match update_entry {
                OpUpdate::Entry {
                    original_action,
                    original_app_entry,
                    app_entry,
                    action,
                } => {
                    match (app_entry, original_app_entry) {
                        (
                            EntryTypes::Booking(booking),
                            EntryTypes::Booking(original_booking),
                        ) => {
                            validate_update_booking(
                                action,
                                booking,
                                original_action,
                                original_booking,
                            )
                        }
                        (
                            EntryTypes::BookingRequest(booking_request),
                            EntryTypes::BookingRequest(original_booking_request),
                        ) => {
                            validate_update_booking_request(
                                action,
                                booking_request,
                                original_action,
                                original_booking_request,
                            )
                        }
                        (
                            EntryTypes::Resource(resource),
                            EntryTypes::Resource(original_resource),
                        ) => {
                            validate_update_resource(
                                action,
                                resource,
                                original_action,
                                original_resource,
                            )
                        }
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original and updated entry types must be the same"
                                        .to_string(),
                                ),
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterDelete(delete_entry) => {
            match delete_entry {
                OpDelete::Entry { original_action, original_app_entry, action } => {
                    match original_app_entry {
                        EntryTypes::Resource(resource) => {
                            validate_delete_resource(action, original_action, resource)
                        }
                        EntryTypes::BookingRequest(booking_request) => {
                            validate_delete_booking_request(
                                action,
                                original_action,
                                booking_request,
                            )
                        }
                        EntryTypes::Booking(booking) => {
                            validate_delete_booking(action, original_action, booking)
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag,
            action,
        } => {
            match link_type {
                LinkTypes::ResourceUpdates => {
                    validate_create_link_resource_updates(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ResourceToBookingRequests => {
                    validate_create_link_resource_to_booking_requests(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::BookingRequestToBookings => {
                    validate_create_link_booking_request_to_bookings(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ResourceToBookings => {
                    validate_create_link_resource_to_bookings(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllResources => {
                    validate_create_link_all_resources(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::MyResources => {
                    validate_create_link_my_resources(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::MyBookingRequests => {
                    validate_create_link_my_booking_requests(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::BookerToBookings => {
                    validate_create_link_booker_to_bookings(
                        action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            }
        }
        FlatOp::RegisterDeleteLink {
            link_type,
            base_address,
            target_address,
            tag,
            original_action,
            action,
        } => {
            match link_type {
                LinkTypes::ResourceUpdates => {
                    validate_delete_link_resource_updates(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ResourceToBookingRequests => {
                    validate_delete_link_resource_to_booking_requests(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::BookingRequestToBookings => {
                    validate_delete_link_booking_request_to_bookings(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::ResourceToBookings => {
                    validate_delete_link_resource_to_bookings(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::AllResources => {
                    validate_delete_link_all_resources(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::MyResources => {
                    validate_delete_link_my_resources(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::MyBookingRequests => {
                    validate_delete_link_my_booking_requests(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
                LinkTypes::BookerToBookings => {
                    validate_delete_link_booker_to_bookings(
                        action,
                        original_action,
                        base_address,
                        target_address,
                        tag,
                    )
                }
            }
        }
        FlatOp::StoreRecord(store_record) => {
            match store_record {
                OpRecord::CreateEntry { app_entry, action } => {
                    match app_entry {
                        EntryTypes::Resource(resource) => {
                            validate_create_resource(
                                EntryCreationAction::Create(action),
                                resource,
                            )
                        }
                        EntryTypes::BookingRequest(booking_request) => {
                            validate_create_booking_request(
                                EntryCreationAction::Create(action),
                                booking_request,
                            )
                        }
                        EntryTypes::Booking(booking) => {
                            validate_create_booking(
                                EntryCreationAction::Create(action),
                                booking,
                            )
                        }
                    }
                }
                OpRecord::UpdateEntry {
                    original_action_hash,
                    app_entry,
                    action,
                    ..
                } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original action for an update must be a Create or Update action"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    match app_entry {
                        EntryTypes::Resource(resource) => {
                            let result = validate_create_resource(
                                EntryCreationAction::Update(action.clone()),
                                resource.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_resource: Option<Resource> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_resource = match original_resource {
                                    Some(resource) => resource,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_resource(
                                    action,
                                    resource,
                                    original_action,
                                    original_resource,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::BookingRequest(booking_request) => {
                            let result = validate_create_booking_request(
                                EntryCreationAction::Update(action.clone()),
                                booking_request.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_booking_request: Option<BookingRequest> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_booking_request = match original_booking_request {
                                    Some(booking_request) => booking_request,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_booking_request(
                                    action,
                                    booking_request,
                                    original_action,
                                    original_booking_request,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::Booking(booking) => {
                            let result = validate_create_booking(
                                EntryCreationAction::Update(action.clone()),
                                booking.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_booking: Option<Booking> = original_record
                                    .entry()
                                    .to_app_option()
                                    .map_err(|e| wasm_error!(e))?;
                                let original_booking = match original_booking {
                                    Some(booking) => booking,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_booking(
                                    action,
                                    booking,
                                    original_action,
                                    original_booking,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                    }
                }
                OpRecord::DeleteEntry { original_action_hash, action, .. } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original action for a delete must be a Create or Update action"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    let app_entry_type = match original_action.entry_type() {
                        EntryType::App(app_entry_type) => app_entry_type,
                        _ => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    let entry = match original_record.entry().as_option() {
                        Some(entry) => entry,
                        None => {
                            if original_action.entry_type().visibility().is_public() {
                                return Ok(
                                    ValidateCallbackResult::Invalid(
                                        "Original record for a delete of a public entry must contain an entry"
                                            .to_string(),
                                    ),
                                );
                            } else {
                                return Ok(ValidateCallbackResult::Valid);
                            }
                        }
                    };
                    let original_app_entry = match EntryTypes::deserialize_from_type(
                        app_entry_type.zome_index.clone(),
                        app_entry_type.entry_index.clone(),
                        &entry,
                    )? {
                        Some(app_entry) => app_entry,
                        None => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "Original app entry must be one of the defined entry types for this zome"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    match original_app_entry {
                        EntryTypes::Resource(original_resource) => {
                            validate_delete_resource(
                                action,
                                original_action,
                                original_resource,
                            )
                        }
                        EntryTypes::BookingRequest(original_booking_request) => {
                            validate_delete_booking_request(
                                action,
                                original_action,
                                original_booking_request,
                            )
                        }
                        EntryTypes::Booking(original_booking) => {
                            validate_delete_booking(
                                action,
                                original_action,
                                original_booking,
                            )
                        }
                    }
                }
                OpRecord::CreateLink {
                    base_address,
                    target_address,
                    tag,
                    link_type,
                    action,
                } => {
                    match link_type {
                        LinkTypes::ResourceUpdates => {
                            validate_create_link_resource_updates(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ResourceToBookingRequests => {
                            validate_create_link_resource_to_booking_requests(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::BookingRequestToBookings => {
                            validate_create_link_booking_request_to_bookings(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::ResourceToBookings => {
                            validate_create_link_resource_to_bookings(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::AllResources => {
                            validate_create_link_all_resources(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::MyResources => {
                            validate_create_link_my_resources(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::MyBookingRequests => {
                            validate_create_link_my_booking_requests(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                        LinkTypes::BookerToBookings => {
                            validate_create_link_booker_to_bookings(
                                action,
                                base_address,
                                target_address,
                                tag,
                            )
                        }
                    }
                }
                OpRecord::DeleteLink { original_action_hash, base_address, action } => {
                    let record = must_get_valid_record(original_action_hash)?;
                    let create_link = match record.action() {
                        Action::CreateLink(create_link) => create_link.clone(),
                        _ => {
                            return Ok(
                                ValidateCallbackResult::Invalid(
                                    "The action that a DeleteLink deletes must be a CreateLink"
                                        .to_string(),
                                ),
                            );
                        }
                    };
                    let link_type = match LinkTypes::from_type(
                        create_link.zome_index.clone(),
                        create_link.link_type.clone(),
                    )? {
                        Some(lt) => lt,
                        None => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    match link_type {
                        LinkTypes::ResourceUpdates => {
                            validate_delete_link_resource_updates(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ResourceToBookingRequests => {
                            validate_delete_link_resource_to_booking_requests(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::BookingRequestToBookings => {
                            validate_delete_link_booking_request_to_bookings(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::ResourceToBookings => {
                            validate_delete_link_resource_to_bookings(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AllResources => {
                            validate_delete_link_all_resources(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::MyResources => {
                            validate_delete_link_my_resources(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::MyBookingRequests => {
                            validate_delete_link_my_booking_requests(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::BookerToBookings => {
                            validate_delete_link_booker_to_bookings(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                    }
                }
                OpRecord::CreatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::Dna { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::OpenChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CloseChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::InitZomesComplete { .. } => Ok(ValidateCallbackResult::Valid),
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterAgentActivity(agent_activity) => {
            match agent_activity {
                OpActivity::CreateAgent { agent, action } => {
                    let previous_action = must_get_action(action.prev_action)?;
                    match previous_action.action() {
                        Action::AgentValidationPkg(
                            AgentValidationPkg { membrane_proof, .. },
                        ) => validate_agent_joining(agent, membrane_proof),
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "The previous action for a `CreateAgent` action must be an `AgentValidationPkg`"
                                        .to_string(),
                                ),
                            )
                        }
                    }
                }
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
    }
}
