// Copyright (c) ctianmig.
// SPDX-License-Identifier: Apache-2.0

module kuru_game::kuru_game {
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::random::{Self, Random};
    use sui::balance::{Self, Balance};
    //use sui::tx_context::{TxContext};
    use hitcoin::hitcoin::{HITCOIN};

    // Error constants
    const EPausing: u64 = 0;
    const EValueNotEnough: u64 = 1;

    // Game constants
    // const COOLDOWN: u64 = 60_000; // 1分钟冷却（毫秒）

    public struct AdminCap has key { id: UID }

    public struct PlayEvent has copy, drop {
        reward: u64,
        kuru_count: u8,
    }

    public struct Game has key, store {
        id: UID,
        paused: bool,
        // cost_per_round: u64, 不需要花费
        pool_balance: u64,
        game_pool: Balance<HITCOIN>,
        total_kuru_count: u64,
        // users: Table<address, USER>, 不需要用户表
    }

    fun init(ctx: &mut TxContext) {
        let game = Game {
            id: object::new(ctx),
            paused: false,
            pool_balance: 0,
            game_pool: balance::zero<HITCOIN>(),
            total_kuru_count: 0, // 添加缺失的字段初始化
        };
        transfer::share_object(game);
        transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
    }

    public entry fun add_fund(
        _: &AdminCap,
        game: &mut Game, 
        coin: Coin<HITCOIN>,
        amount: u64,
        ctx: &mut TxContext, 
    ) {
        let sender = tx_context::sender(ctx);
        let value = coin::value(&coin);
        assert!(value >= amount, EValueNotEnough);
        let mut balance = coin::into_balance(coin);
        if (value > amount) {
            balance::join(
                &mut game.game_pool,
                balance::split(&mut balance, amount),
            );
            let change = coin::from_balance(balance, ctx);
            transfer::public_transfer(change, sender);
        } else {
            balance::join(&mut game.game_pool, balance);
        };
        game.pool_balance = game.pool_balance + amount;
    }
    
    #[allow(lint(public_random))]
    public entry fun play(
        game: &mut Game,
        r: &Random,
        ctx: &mut TxContext,
    ) : (u64, u8) {  // 修改返回类型为 (u64, u8)，因为 reward 是 u64
        assert!(!game.paused, EPausing);
        let player = tx_context::sender(ctx);
        let mut generator = random::new_generator(r, ctx);
        let magic = random::generate_u8(&mut generator);
        let mut reward: u64 = 0;
        let mut kuru_count: u8 = 0;
        if (magic == 83) {
            reward = 8_000_000;
            kuru_count = 23;
        } else if (magic > 0 && magic <= 100) {
            reward = 10_000;
            kuru_count = 1;
        } else if (magic > 100 && magic <= 150) {
            reward = 50_000;
            kuru_count = 2;
        } else if (magic > 150 && magic <= 200) {
            reward = 100_000;
            kuru_count = 5;
        } else if (magic > 200 && magic <= 250) {
            reward = 1_000_000;
            kuru_count = 10;
        } else if (magic > 250 && magic <= 255) {
            reward = 2_000_000;
            kuru_count = 20;
        };
        if (reward > game.pool_balance) {
            reward = game.pool_balance;
            kuru_count = 1;
        };
        let reward_balance = balance::split(&mut game.game_pool, reward);
        let reward_coin = coin::from_balance<HITCOIN>(reward_balance, ctx);
        game.pool_balance = game.pool_balance - reward;
        transfer::public_transfer(reward_coin, player);
        game.total_kuru_count = game.total_kuru_count + (kuru_count as u64);
        
        event::emit(PlayEvent { reward, kuru_count }); 
        (reward, kuru_count) // 返回值
    }

    // Pause game
    public entry fun pause_game(
        _: &AdminCap,
        game: &mut Game,
    ) {
        game.paused = true;
    }

    // Unpause game
    public entry fun unpause_game(
        _: &AdminCap,
        game: &mut Game,
    ) {
        game.paused = false;
    }

    public entry fun withdraw(
        _: &AdminCap,
        game: &mut Game,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let balance = balance::split(&mut game.game_pool, amount);
        let coin = coin::from_balance<HITCOIN>(balance, ctx);
        game.pool_balance = game.pool_balance - amount;
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }

    // 添加一个函数来获取总kuru计数
    public fun get_total_kuru_count(game: &Game): u64 {
        game.total_kuru_count
    }
}