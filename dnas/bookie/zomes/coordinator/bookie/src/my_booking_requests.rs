use bookie_integrity::*;
use hdk::prelude::*;
#[hdk_extern]
pub fn get_my_booking_requests(_: ()) -> ExternResult<Vec<ActionHash>> {
    let my_pub_key = agent_info()?.agent_latest_pubkey;
    let links = get_links(my_pub_key, LinkTypes::MyBookingRequests, None)?;
    let hashes: Vec<ActionHash> = links
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();
    Ok(hashes)
}
#[hdk_extern]
pub fn clear_my_booking_requests(
    booking_requests_hashes: Vec<ActionHash>,
) -> ExternResult<()> {
    let my_pub_key = agent_info()?.agent_latest_pubkey;
    let links = get_links(my_pub_key, LinkTypes::MyBookingRequests, None)?;
    for link in links {
        if booking_requests_hashes.contains(&ActionHash::from(link.target.clone())) {
            delete_link(link.create_link_hash)?;
        }
    }
    Ok(())
}
