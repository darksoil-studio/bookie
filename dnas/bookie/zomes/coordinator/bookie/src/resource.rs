use hdk::prelude::*;
use bookie_integrity::*;
#[hdk_extern]
pub fn create_resource(resource: Resource) -> ExternResult<Record> {
    let resource_hash = create_entry(&EntryTypes::Resource(resource.clone()))?;
    let record = get(resource_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Resource"))
            ),
        )?;
    let path = Path::from("all_resources");
    create_link(
        path.path_entry_hash()?,
        resource_hash.clone(),
        LinkTypes::AllResources,
        (),
    )?;
    let my_agent_pub_key = agent_info()?.agent_latest_pubkey;
    create_link(my_agent_pub_key, resource_hash.clone(), LinkTypes::MyResources, ())?;
    Ok(record)
}
#[hdk_extern]
pub fn get_resource(original_resource_hash: ActionHash) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_resource_hash.clone(),
        LinkTypes::ResourceUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_resource_hash = match latest_link {
        Some(link) => ActionHash::from(link.target.clone()),
        None => original_resource_hash.clone(),
    };
    get(latest_resource_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateResourceInput {
    pub original_resource_hash: ActionHash,
    pub previous_resource_hash: ActionHash,
    pub updated_resource: Resource,
}
#[hdk_extern]
pub fn update_resource(input: UpdateResourceInput) -> ExternResult<Record> {
    let updated_resource_hash = update_entry(
        input.previous_resource_hash.clone(),
        &input.updated_resource,
    )?;
    create_link(
        input.original_resource_hash.clone(),
        updated_resource_hash.clone(),
        LinkTypes::ResourceUpdates,
        (),
    )?;
    let record = get(updated_resource_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated Resource"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_resource(original_resource_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_resource_hash)
}
