use bookie_integrity::*;
use hdk::prelude::*;

pub fn add_booking_for_booker(booker: AgentPubKey, booking_hash: ActionHash) -> ExternResult<()> {
    create_link(
        booker.clone(),
        booking_hash.clone(),
        LinkTypes::BookerToBookings,
        (),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_bookings_for_booker(booker: AgentPubKey) -> ExternResult<Vec<Record>> {
    let links = get_links(booker, LinkTypes::BookerToBookings, None)?;

    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| GetInput::new(ActionHash::from(link.target).into(), GetOptions::default()))
        .collect();

    // Get the records to filter out the deleted ones
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .filter_map(|r| r)
        .collect();

    Ok(records)
}
