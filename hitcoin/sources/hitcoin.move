// Copyright (c) ctianmig.
// SPDX-License-Identifier: Apache-2.0

// icon图源：https://twitter.com/Seseren_kr

module hitcoin::hitcoin {
		use sui::coin::{Self, Coin, TreasuryCap};
		use std::debug;
		use std::ascii::string;
        use sui::url;
		use sui::event;

		const DECIMALS: u8 = 6;
		const NAME: vector<u8> = b"HITCOIN";
		const SYMBOL: vector<u8> = b"HIT";
		const DESCRIPTION: vector<u8> = b"MADAM HERTA IS A PEERLESS GEM! MADAM HERTA IS AN UNRIVALED GENIUS! MADAM HERTA IS AN INIMITABLE BEAUTY!";

		const INITIAL_SUPPLY: u64 = 1_000_000_000_000_000;
		const MAX_SUPPLY: u64 = 1_000_000_000_000_000; //最大供应量
    	//const IPFS_ICON: vector<u8> = b"ipfs://QmW6YV7Zb6wQ5XkZ9TQYwZ8Xq3dY7Rf6jKJ1mBv7nLc8x9r";

		const IPFS_ICON: vector<u8> = b"https://cn.bing.com/images/search?q=%e9%bb%91%e5%a1%94%e8%bd%ac%e5%9c%88%e5%9c%88&id=FA0EEF47069F40A0603454CD3E9D3B9447CC9016&FORM=IQFRBA";

		// const ENotOwner: u64 = 0;
    	const EExceedMaxSupply: u64 = 1; 
		const EBurnExceedSupply: u64 = 2; 
		// const EMetadataTampered: u64 = 3; 
		const EPausing: u64 = 4;

		public struct MintEvent has copy, drop {
        	amount: u64,
        	recipient: address
    	}

		public struct BurnEvent has copy, drop {
        	amount: u64
   		}

		public struct HITCOIN has drop {}
		public struct AdminCap has key { id: UID }

		public struct TokenConfig has key {
        	id: UID,
        	owner: address,
        	total_supply: u64,
			paused: bool,
        	treasury_cap: sui::coin::TreasuryCap<HITCOIN>
    	}

		fun init(witness: HITCOIN, ctx: &mut TxContext) {
                //let icon_url = url::new_unsafe(string(b"https://cn.bing.com/images/search?q=%e9%bb%91%e5%a1%94%e8%bd%ac%e5%9c%88%e5%9c%88&id=FA0EEF47069F40A0603454CD3E9D3B9447CC9016&FORM=IQFRBA"));
				let ipfs_icon = IPFS_ICON;
				let icon_url = url::new_unsafe(string(ipfs_icon));
				let (mut treasury_cap, metadata) = coin::create_currency(
					witness, 
					DECIMALS,
					NAME,
					SYMBOL,
					DESCRIPTION,
					option::some(icon_url),
					ctx,
					);

				debug::print(&string(b"init HITCOIN"));
				transfer::public_freeze_object(metadata);

				let initial_coins = coin::mint(&mut treasury_cap, INITIAL_SUPPLY, ctx);
				
				assert!(INITIAL_SUPPLY <= MAX_SUPPLY, EExceedMaxSupply);

        		let config = TokenConfig {
            		id: object::new(ctx),
            		owner: ctx.sender(),
            		total_supply: INITIAL_SUPPLY,
					paused: false,
            		treasury_cap
        		};

        		transfer::public_transfer(initial_coins, tx_context::sender(ctx));
				transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
        		transfer::share_object(config);
		}

		public entry fun mint(
				_: &AdminCap, 
				treasury_cap: &mut TreasuryCap<HITCOIN>, 
				amount: u64, 
				recipient: address, 
				config: &mut TokenConfig,
				ctx: &mut TxContext
		) {
				// let sender = tx_context::sender(ctx);
        		assert!(config.total_supply + amount <= MAX_SUPPLY, EExceedMaxSupply);
				assert!(!config.paused, EPausing);
				config.total_supply = config.total_supply + amount;
        		event::emit(MintEvent { amount, recipient });

				let coin = coin::mint(treasury_cap, amount, ctx);
				transfer::public_transfer(coin, recipient);
		}

		public entry fun burn(
			_: &AdminCap, 
        	coin: Coin<HITCOIN>,
			treasury_cap: &mut TreasuryCap<HITCOIN>, 
			config: &mut TokenConfig, 
			_ctx: &mut TxContext
    	) {
			let amount = coin::value(&coin);
			assert!(config.total_supply >= amount, EBurnExceedSupply);
        	config.total_supply = config.total_supply - amount;
        	event::emit(BurnEvent { amount });
        	coin::burn(treasury_cap, coin);
   		}

		public entry fun transfer_ownership(
			_: &AdminCap, 
        	new_owner: address,
			config: &mut TokenConfig, 
        	_ctx: &mut TxContext
    	) {
        	config.owner = new_owner;
   		}

		public entry fun pause_minting(
			_: &AdminCap, 
			config: &mut TokenConfig, 
        	_ctx: &mut TxContext
    	) {
        	config.paused = true;
    	}

		public entry fun unpause_minting(
			_: &AdminCap, 
			config: &mut TokenConfig, 
        	_ctx: &mut TxContext
    	) {
        	config.paused = false;
    	}

		// Accessors
		public fun get_total_supply(config: &TokenConfig): u64 {
        	config.total_supply
    	}
		
		#[test_only]
		public fun init_for_testing(ctx: &mut TxContext) {
			init(HITCOIN {}, ctx);
		}
}