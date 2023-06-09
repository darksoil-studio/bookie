#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use hdk::prelude::*;
use holochain::test_utils::consistency_10s;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

use bookie::booker_to_bookings::AddBookingForBookerInput;

mod common;

use common::{create_booking, sample_booking_1};

#[tokio::test(flavor = "multi_thread")]
async fn link_a_booker_to_a_booking() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir()
        .unwrap()
        .join("../../../workdir/bookie.dna");
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("bookie", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (bobbo,)) = apps.into_tuples();
    
    let alice_zome = alice.zome("bookie");
    let bob_zome = bobbo.zome("bookie");

    let base_address = alice.agent_pubkey().clone();
    let target_record = create_booking(&conductors[0], &alice_zome, sample_booking_1(&conductors[0], &alice_zome).await).await;
    let target_address = target_record.signed_action.hashed.hash.clone();

    // Bob gets the links, should be empty
    let links_output: Vec<Record> = conductors[1]
        .call(&bob_zome, "get_bookings_for_booker", base_address.clone()).await;
    assert_eq!(links_output.len(), 0);

    // Alice creates a link from Booker to Booking
    let _result: () = conductors[0]
        .call(&alice_zome, "add_booking_for_booker", AddBookingForBookerInput {
        base_booker: base_address.clone(),
        target_booking_hash: target_address.clone()
     }).await;
        
    consistency_10s([&alice, &bobbo]).await;

    // Bob gets the links again
    let links_output: Vec<Record> = conductors[1]
        .call(&bob_zome, "get_bookings_for_booker", base_address.clone()).await;
    assert_eq!(links_output.len(), 1);
    assert_eq!(target_record, links_output[0]);


}


