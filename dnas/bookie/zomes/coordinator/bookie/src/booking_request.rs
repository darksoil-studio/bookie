use hdk::prelude::*;
use bookie_integrity::*;
#[hdk_extern]
pub fn create_booking_request(booking_request: BookingRequest) -> ExternResult<Record> {
    let booking_request_hash = create_entry(
        &EntryTypes::BookingRequest(booking_request.clone()),
    )?;
    create_link(
        booking_request.resource_hash.clone(),
        booking_request_hash.clone(),
        LinkTypes::ResourceToBookingRequests,
        (),
    )?;
    let record = get(booking_request_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created BookingRequest"))
            ),
        )?;
    let my_agent_pub_key = agent_info()?.agent_latest_pubkey;
    create_link(
        my_agent_pub_key,
        booking_request_hash.clone(),
        LinkTypes::MyBookingRequests,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_booking_request(
    original_booking_request_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    get_latest_booking_request(original_booking_request_hash)
}
fn get_latest_booking_request(
    booking_request_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let details = get_details(booking_request_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("BookingRequest not found".into())))?;
    let record_details = match details {
        Details::Entry(_) => {
            Err(wasm_error!(WasmErrorInner::Guest("Malformed details".into())))
        }
        Details::Record(record_details) => Ok(record_details),
    }?;
    if record_details.deletes.len() > 0 {
        return Ok(None);
    }
    match record_details.updates.last() {
        Some(update) => get_latest_booking_request(update.action_address().clone()),
        None => Ok(Some(record_details.record)),
    }
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateBookingRequestInput {
    pub previous_booking_request_hash: ActionHash,
    pub updated_booking_request: BookingRequest,
}
#[hdk_extern]
pub fn update_booking_request(input: UpdateBookingRequestInput) -> ExternResult<Record> {
    let updated_booking_request_hash = update_entry(
        input.previous_booking_request_hash,
        &input.updated_booking_request,
    )?;
    let record = get(updated_booking_request_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated BookingRequest"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_booking_request(
    original_booking_request_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_booking_request_hash)
}
#[hdk_extern]
pub fn get_booking_requests_for_resource(
    resource_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(resource_hash, LinkTypes::ResourceToBookingRequests, None)?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(
            ActionHash::from(link.target).into(),
            GetOptions::default(),
        ))
        .collect();
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();
    Ok(records)
}
