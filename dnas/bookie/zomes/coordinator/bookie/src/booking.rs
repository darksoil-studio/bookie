use hdk::prelude::*;
use bookie_integrity::*;
#[hdk_extern]
pub fn create_booking(booking: Booking) -> ExternResult<Record> {
    let booking_hash = create_entry(&EntryTypes::Booking(booking.clone()))?;
    if let Some(base) = booking.booking_request_hash.clone() {
        create_link(
            base,
            booking_hash.clone(),
            LinkTypes::BookingRequestToBookings,
            (),
        )?;
    }
    create_link(
        booking.resource_hash.clone(),
        booking_hash.clone(),
        LinkTypes::ResourceToBookings,
        (),
    )?;
    let record = get(booking_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Booking"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_booking(original_booking_hash: ActionHash) -> ExternResult<Option<Record>> {
    get_latest_booking(original_booking_hash)
}
fn get_latest_booking(booking_hash: ActionHash) -> ExternResult<Option<Record>> {
    let details = get_details(booking_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Booking not found".into())))?;
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
        Some(update) => get_latest_booking(update.action_address().clone()),
        None => Ok(Some(record_details.record)),
    }
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateBookingInput {
    pub previous_booking_hash: ActionHash,
    pub updated_booking: Booking,
}
#[hdk_extern]
pub fn update_booking(input: UpdateBookingInput) -> ExternResult<Record> {
    let updated_booking_hash = update_entry(
        input.previous_booking_hash,
        &input.updated_booking,
    )?;
    let record = get(updated_booking_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Booking"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_booking(original_booking_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_booking_hash)
}
#[hdk_extern]
pub fn get_bookings_for_booking_request(
    booking_request_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(
        booking_request_hash,
        LinkTypes::BookingRequestToBookings,
        None,
    )?;
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
#[hdk_extern]
pub fn get_bookings_for_resource(
    resource_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let links = get_links(resource_hash, LinkTypes::ResourceToBookings, None)?;
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
