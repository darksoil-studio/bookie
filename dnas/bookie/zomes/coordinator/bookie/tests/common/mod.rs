use hdk::prelude::*;
use holochain::sweettest::*;

use bookie_integrity::*;



pub async fn sample_resource_1(conductor: &SweetConductor, zome: &SweetZome) -> Resource {
    Resource {
	  name: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  image_hash: ::fixt::fixt!(EntryHash),
    }
}

pub async fn sample_resource_2(conductor: &SweetConductor, zome: &SweetZome) -> Resource {
    Resource {
	  name: "Lorem ipsum 2".to_string(),
	  description: "Lorem ipsum 2".to_string(),
	  image_hash: ::fixt::fixt!(EntryHash),
    }
}

pub async fn create_resource(conductor: &SweetConductor, zome: &SweetZome, resource: Resource) -> Record {
    let record: Record = conductor
        .call(zome, "create_resource", resource)
        .await;
    record
}



pub async fn sample_booking_request_1(conductor: &SweetConductor, zome: &SweetZome) -> BookingRequest {
    BookingRequest {
          resource_hash: create_resource(conductor, zome, sample_resource_1(conductor, zome).await).await.signed_action.hashed.hash,
	  title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  comment: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  start_time: 1674053334548000,
	  end_time: 1674053334548000,
    }
}

pub async fn sample_booking_request_2(conductor: &SweetConductor, zome: &SweetZome) -> BookingRequest {
    BookingRequest {
          resource_hash: create_resource(conductor, zome, sample_resource_2(conductor, zome).await).await.signed_action.hashed.hash,
	  title: "Lorem ipsum 2".to_string(),
	  comment: "Lorem ipsum 2".to_string(),
	  start_time: 1674059334548000,
	  end_time: 1674059334548000,
    }
}

pub async fn create_booking_request(conductor: &SweetConductor, zome: &SweetZome, booking_request: BookingRequest) -> Record {
    let record: Record = conductor
        .call(zome, "create_booking_request", booking_request)
        .await;
    record
}



pub async fn sample_booking_1(conductor: &SweetConductor, zome: &SweetZome) -> Booking {
    Booking {
	  title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
	  start_time: 1674053334548000,
	  end_time: 1674053334548000,
          booking_request_hash: create_booking_request(conductor, zome, sample_booking_request_1(conductor, zome).await).await.signed_action.hashed.hash,
          resource_hash: create_resource(conductor, zome, sample_resource_1(conductor, zome).await).await.signed_action.hashed.hash,
    }
}

pub async fn sample_booking_2(conductor: &SweetConductor, zome: &SweetZome) -> Booking {
    Booking {
	  title: "Lorem ipsum 2".to_string(),
	  start_time: 1674059334548000,
	  end_time: 1674059334548000,
          booking_request_hash: create_booking_request(conductor, zome, sample_booking_request_2(conductor, zome).await).await.signed_action.hashed.hash,
          resource_hash: create_resource(conductor, zome, sample_resource_2(conductor, zome).await).await.signed_action.hashed.hash,
    }
}

pub async fn create_booking(conductor: &SweetConductor, zome: &SweetZome, booking: Booking) -> Record {
    let record: Record = conductor
        .call(zome, "create_booking", booking)
        .await;
    record
}

