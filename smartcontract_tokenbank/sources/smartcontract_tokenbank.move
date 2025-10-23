#[allow(duplicate_alias)]

module smartcontract_tokenbank::token_bank {
    use std::string::{Self, String};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::display::{Self};
    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::package::{Self};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::option::{Self, Option};

    /// Error codes
    const EUserNotFound: u64 = 0;
    const ETooSoon: u64 = 1;
    const EMaxExceeded: u64 = 2;
    const EInsufficientBalance: u64 = 3;

    /// One-time witness for publisher
    public struct TOKEN_BANK has drop {}

    /// Shared TokenBank object
    public struct TokenBank has key {
        id: UID,
        balance: Balance<SUI>,
        users: Table<address, UserData>,
        config: Config,
    }

    /// Config stored in TokenBank
    public struct Config has store {
        max_claim: u64, // in mist, e.g., 1_000_000_000 for 1 SUI
        special_addr: address, // address that can claim any amount
        award_threshold: u64, // in mist, e.g., 10_000_000_000 for 10 SUI
        award_blob_id: String, // Base64-encoded Walrus Blob ID for NFT image
    }

    /// Per-user data
    public struct UserData has store {
        last_claim: u64, // timestamp_ms
        deposit_count: u64,
        total_deposited: u64,
        twitter: Option<String>,
        has_award: bool,
    }

    /// Award NFT
    public struct AwardNFT has key, store {
        id: UID,
        url: String, // Full URL: https://aggregator.walrus.testnet.sui.io/v1/<blob_id>
    }

    /// Events
    public struct ClaimEvent has copy, drop {
        addr: address,
        amount: u64,
        time: u64,
    }

    public struct DepositEvent has copy, drop {
        addr: address,
        amount: u64,
        total: u64,
        count: u64,
        twitter: Option<String>,
    }

    public struct AwardEvent has copy, drop {
        addr: address,
        nft_id: ID,
    }

    /// Init function to create shared TokenBank and set up Display for AwardNFT
    fun init(otw: TOKEN_BANK, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        // Create Publisher
        let publisher = package::claim(otw, ctx);
        // Set up Display for AwardNFT
        let mut display = display::new<AwardNFT>(&publisher, ctx);
        display::add(&mut display, string::utf8(b"name"), string::utf8(b"Token Bank Ambassador Award"));
        display::add(&mut display, string::utf8(b"description"), string::utf8(b"Award for reaching deposit threshold in Token Bank"));
        display::add(&mut display, string::utf8(b"image_url"), string::utf8(b"{url}"));
        display::update_version(&mut display);
        transfer::public_transfer(display, sender);

        // Create Config with placeholders (replace with actual values)
        let config = Config {
            max_claim: 1_000_000_000, // 1 SUI in mist; set in .env and replace here
            special_addr: @0x0000000000000000000000000000000000000000000000000000000000000000, // Placeholder; set in .env and replace
            award_threshold: 10_000_000_000, // 10 SUI in mist; set in .env and replace
            award_blob_id: string::utf8(b"BASE64_ENCODED_WALRUS_BLOB_ID_HERE"), // Set in .env and replace
        };

        // Create TokenBank
        let bank = TokenBank {
            id: object::new(ctx),
            balance: balance::zero(),
            users: table::new(ctx),
            config,
        };
        transfer::share_object(bank);

        // Transfer publisher to deployer
        transfer::public_transfer(publisher, sender);
    }

    /// Deposit SUI into the TokenBank and update user data
    public entry fun deposit(
        bank: &mut TokenBank,
        payment: Coin<SUI>,
        twitter_handle: vector<u8>,
        ctx: &mut TxContext
    ) {
        let addr = tx_context::sender(ctx);
        let amount = coin::value(&payment);
        let twitter = string::utf8(twitter_handle);

        // Transfer coin to balance
        balance::join(&mut bank.balance, coin::into_balance(payment));

        // Get or create user data
        let user = if (table::contains(&bank.users, addr)) {
            table::borrow_mut(&mut bank.users, addr)
        } else {
            let new_user = UserData {
                last_claim: 0,
                deposit_count: 0,
                total_deposited: 0,
                twitter: option::none(),
                has_award: false,
            };
            table::add(&mut bank.users, addr, new_user);
            table::borrow_mut(&mut bank.users, addr)
        };

        // Update user data
        user.deposit_count = user.deposit_count + 1;
        user.total_deposited = user.total_deposited + amount;
        
        // Update twitter handle - use swap if already exists
        if (option::is_some(&user.twitter)) {
            option::swap(&mut user.twitter, twitter);
        } else {
            option::fill(&mut user.twitter, twitter);
        };

        // Emit deposit event
        event::emit(DepositEvent {
            addr,
            amount,
            total: user.total_deposited,
            count: user.deposit_count,
            twitter: user.twitter,
        });

        // Check for award eligibility
        if (!user.has_award && user.total_deposited >= bank.config.award_threshold) {
            // Construct full URL for Walrus blob
            let mut url = string::utf8(b"https://aggregator.walrus.testnet.sui.io/v1/");
            string::append(&mut url, bank.config.award_blob_id);

            // Mint NFT
            let nft = AwardNFT {
                id: object::new(ctx),
                url,
            };
            let nft_id = object::id(&nft);

            // Transfer NFT to user
            transfer::public_transfer(nft, addr);

            // Update user
            user.has_award = true;

            // Emit award event
            event::emit(AwardEvent { addr, nft_id });
        }
    }

    /// Claim SUI from the TokenBank
    public entry fun claim(
        bank: &mut TokenBank,
        clock: &Clock,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let addr = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        // Validate balance
        assert!(balance::value(&bank.balance) >= amount, EInsufficientBalance);

        // Get or create user data
        let user = if (table::contains(&bank.users, addr)) {
            table::borrow_mut(&mut bank.users, addr)
        } else {
            let new_user = UserData {
                last_claim: 0,
                deposit_count: 0,
                total_deposited: 0,
                twitter: option::none(),
                has_award: false,
            };
            table::add(&mut bank.users, addr, new_user);
            table::borrow_mut(&mut bank.users, addr)
        };

        // Time check
        if (user.last_claim != 0) {
            assert!(now - user.last_claim >= 12 * 60 * 60 * 1000, ETooSoon);
        };

        if (addr != bank.config.special_addr) {
            assert!(amount <= bank.config.max_claim, EMaxExceeded);
        };

        // Update last claim
        user.last_claim = now;

        // Transfer amount
        let coin = coin::take(&mut bank.balance, amount, ctx);
        transfer::public_transfer(coin, addr);

        // Emit claim event
        event::emit(ClaimEvent { addr, amount, time: now });
    }

    // View functions for frontend querying (optional but recommended)

    /// Get TokenBank balance
    public fun get_bank_balance(bank: &TokenBank): u64 {
        balance::value(&bank.balance)
    }

    /// Get user data
    public fun get_user_data(bank: &TokenBank, addr: address): (&u64, &u64, &u64, &Option<String>, &bool) {
        if (table::contains(&bank.users, addr)) {
            let user = table::borrow(&bank.users, addr);
            (&user.last_claim, &user.deposit_count, &user.total_deposited, &user.twitter, &user.has_award)
        } else {
            abort EUserNotFound
        }
    }

    /// Get config (for max_claim, etc.)
    public fun get_config(bank: &TokenBank): (&u64, &address, &u64, &String) {
        let config = &bank.config;
        (&config.max_claim, &config.special_addr, &config.award_threshold, &config.award_blob_id)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(TOKEN_BANK {}, ctx);
    }

    #[test_only]
    public fun get_nft_url(nft: &AwardNFT): &String {
        &nft.url
    }
}

