/*
/// Module: herta
module herta::herta;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module ehrta::herta {

    use sui::coin::{Self, Coin, TreasuryCap};
    use std::debug;
    use std::ascii::string;
    use sui::url;
    use sui::event;
    use sui::display;
    use hitcoin::hitcoin::{HITCOIN};

    const NAME: vector<u8> = b"Herta";
    const IPFS_ICON: vector<u8> = b"";

    public struct MintEvent has copy, drop {
        object_id: ID, 
        owner: address,
        number: u64,
    }

    public struct Herta has key, store {
        id :UID,
        name: string::String,
        description: string::String,
        icon_url: url::Url,
        number: u64,
    }

    public struct HERTA has drop {}

    public struct AdminCap has key { id: UID }

    fun init(otw: HERTA, ctx: &mut TxContext) {
        let keys = vector[
        b"name".to_string(),
        b"link".to_string(),
        b"image_url".to_string(),
        b"description".to_string(),
        b"project_url".to_string(),
        b"creator".to_string(),
    ];


    }
}