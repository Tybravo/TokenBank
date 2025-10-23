#[test_only]
#[allow(unused_use, duplicate_alias, unused_const)]
module smartcontract_tokenbank::token_bank_tests {
    use smartcontract_tokenbank::token_bank::{Self, TokenBank, AwardNFT, Config, UserData, ClaimEvent, DepositEvent, AwardEvent, TOKEN_BANK};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::test_utils::{Self};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::transfer;
    use sui::object::{Self};
    use std::string::{Self, String};
    use std::option::{Self};
    use std::vector;

    // Error codes from the module
    const EUserNotFound: u64 = 0;
    const ETooSoon: u64 = 1;
    const EMaxExceeded: u64 = 2;
    const EInsufficientBalance: u64 = 3;

    // Constants for testing
    const TEST_ADDR1: address = @0xCAFE;
    const TEST_ADDR2: address = @0xBABE;
    const SPECIAL_ADDR: address = @0x0; // As per config placeholder
    const MAX_CLAIM: u64 = 1_000_000_000; // 1 SUI in mist
    const AWARD_THRESHOLD: u64 = 10_000_000_000; // 10 SUI in mist
    const TWELVE_HOURS_MS: u64 = 12 * 60 * 60 * 1000; // 43,200,000 ms

    // Helper to initialize the contract in a scenario
    fun init_contract(scenario: &mut Scenario) {
        ts::next_tx(scenario, TEST_ADDR1);
        {
            let ctx = ts::ctx(scenario);
            token_bank::init_for_testing(ctx);
        };
    }

    // Helper to mint SUI coin for testing
    fun mint_sui(amount: u64, scenario: &mut Scenario): Coin<SUI> {
        let ctx = ts::ctx(scenario);
        coin::mint_for_testing<SUI>(amount, ctx)
    }

    #[test]
    fun test_init() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let bank = ts::take_shared<TokenBank>(&scenario);
            assert!(token_bank::get_bank_balance(&bank) == 0, 1000);
            let (max, special, thresh, blob) = token_bank::get_config(&bank);
            assert!(*max == MAX_CLAIM, 1001);
            assert!(*special == SPECIAL_ADDR, 1002);
            assert!(*thresh == AWARD_THRESHOLD, 1003);
            assert!(string::utf8(b"BASE64_ENCODED_WALRUS_BLOB_ID_HERE") == *blob, 1004);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_deposit_success() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(1_000_000_000, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"test_handle", ctx);
            assert!(token_bank::get_bank_balance(&mut bank) == 1_000_000_000, 2000);
            let (_, count, total, twitter, has_award) = token_bank::get_user_data(&bank, TEST_ADDR1);
            assert!(*count == 1, 2001);
            assert!(*total == 1_000_000_000, 2002);
            assert!(option::borrow(twitter) == &string::utf8(b"test_handle"), 2003);
            assert!(!*has_award, 2004);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_deposit_multiple_and_update_twitter() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // First deposit
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(1_000_000_000, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"handle1", ctx);
            ts::return_shared(bank);
        };

        // Addr1 deposit
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(1_000_000_000, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"handle1", ctx);
            ts::return_shared(bank);
        };

        // Addr2 deposit
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(2_000_000_000, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"handle2", ctx);
            assert!(token_bank::get_bank_balance(&mut bank) == 3_000_000_000, 3000);
            let (_, count, total, twitter, _) = token_bank::get_user_data(&bank, TEST_ADDR1);
            assert!(*count == 2, 3001);
            assert!(*total == 3_000_000_000, 3002);
            assert!(option::borrow(twitter) == &string::utf8(b"handle2"), 3003);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_deposit_zero_amount() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(0, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            assert!(token_bank::get_bank_balance(&mut bank) == 0, 4000);
            let (_, count, total, twitter, _) = token_bank::get_user_data(&bank, TEST_ADDR1);
            assert!(*count == 1, 4001);
            assert!(*total == 0, 4002);
            assert!(option::borrow(twitter) == &string::utf8(b""), 4003);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_deposit_reach_award_threshold() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Deposit below threshold
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(AWARD_THRESHOLD - 1, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"handle", ctx);
            let (_, _, _, _, has_award) = token_bank::get_user_data(&bank, TEST_ADDR1);
            assert!(!*has_award, 5000);
            ts::return_shared(bank);
        };

        // Deposit to reach threshold
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(1, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"handle", ctx);
            let (_, _, total, _, has_award) = token_bank::get_user_data(&bank, TEST_ADDR1);
            assert!(*total == AWARD_THRESHOLD, 5001);
            assert!(*has_award, 5002);
            // Check NFT transferred to sender
            let nft = ts::take_from_sender<AwardNFT>(&scenario);
            assert!(token_bank::get_nft_url(&nft) == &string::utf8(b"https://aggregator.walrus.testnet.sui.io/v1/BASE64_ENCODED_WALRUS_BLOB_ID_HERE"), 5003);
            ts::return_to_sender(&scenario, nft);
            ts::return_shared(bank);
        };

        // Deposit after award - no second NFT
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(1_000_000_000, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"handle", ctx);
            let (_, _, _, _, has_award) = token_bank::get_user_data(&bank, TEST_ADDR1);
            assert!(*has_award, 5004);
            // No new NFT
            assert!(ts::has_most_recent_for_sender<AwardNFT>(&scenario) == false, 5005);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_claim_success_first_time() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Deposit some funds
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(MAX_CLAIM * 2, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            ts::return_shared(bank);
        };

        // Claim
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            clock::set_for_testing(&mut clock, 1000);
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM, ctx);
            assert!(token_bank::get_bank_balance(&mut bank) == MAX_CLAIM, 6000);
            let (last_claim, _, _, _, _) = token_bank::get_user_data(&bank, TEST_ADDR2);
            assert!(*last_claim == 1000, 6001);
            // Check transferred coin
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == MAX_CLAIM, 6002);
            ts::return_to_sender(&scenario, coin);
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = token_bank::ETooSoon)]
    fun test_claim_too_soon() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Deposit funds
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(MAX_CLAIM * 2, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            ts::return_shared(bank);
        };

        // First claim
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            clock::set_for_testing(&mut clock, 1000);
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM / 2, ctx);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            ts::return_to_sender(&scenario, coin);
            ts::return_shared(bank);
            clock::destroy_for_testing(clock);
        };

        // Second claim too soon
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            clock::set_for_testing(&mut clock, 1000 + TWELVE_HOURS_MS - 1);
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM / 2, ctx); // Should abort
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_claim_after_time() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Deposit funds
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(MAX_CLAIM * 2, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            ts::return_shared(bank);
        };

        // First claim
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            clock::set_for_testing(&mut clock, 1000);
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM / 2, ctx);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            ts::return_to_sender(&scenario, coin);
            ts::return_shared(bank);
            clock::destroy_for_testing(clock);
        };

        // Second claim after 12 hours
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            clock::set_for_testing(&mut clock, 1000 + TWELVE_HOURS_MS);
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM / 2, ctx);
            assert!(token_bank::get_bank_balance(&mut bank) == MAX_CLAIM, 7000);
            let (last_claim, _, _, _, _) = token_bank::get_user_data(&bank, TEST_ADDR2);
            assert!(*last_claim == 1000 + TWELVE_HOURS_MS, 7001);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == MAX_CLAIM / 2, 7002);
            ts::return_to_sender(&scenario, coin);
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = token_bank::EMaxExceeded)]
    fun test_claim_exceed_max() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Deposit funds
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(MAX_CLAIM + 1, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            ts::return_shared(bank);
        };

        // Claim exceed max
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM + 1, ctx); // Abort
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_claim_special_addr_large_amount() {
        let mut scenario = ts::begin(SPECIAL_ADDR);
        init_contract(&mut scenario);

        // Deposit funds
        ts::next_tx(&mut scenario, SPECIAL_ADDR);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(MAX_CLAIM * 2, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            ts::return_shared(bank);
        };

        // Claim large as special
        ts::next_tx(&mut scenario, SPECIAL_ADDR);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM * 2, ctx);
            assert!(token_bank::get_bank_balance(&mut bank) == 0, 8000);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == MAX_CLAIM * 2, 8001);
            ts::return_to_sender(&scenario, coin);
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = token_bank::EInsufficientBalance)]
    fun test_claim_insufficient_balance() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // No deposit, claim
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, 1, ctx); // Abort
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_claim_zero_amount() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Deposit
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(MAX_CLAIM, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            ts::return_shared(bank);
        };

        // Claim 0
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            clock::set_for_testing(&mut clock, 1000);
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, 0, ctx);
            let (last_claim, _, _, _, _) = token_bank::get_user_data(&bank, TEST_ADDR2);
            assert!(*last_claim == 1000, 9000);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == 0, 9001);
            ts::return_to_sender(&scenario, coin);
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = token_bank::EUserNotFound)]
    fun test_get_user_data_non_existent() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let bank = ts::take_shared<TokenBank>(&scenario);
            let (_total_deposited, _total_claimed, _last_claim, _award_blob_id, _has_award) = token_bank::get_user_data(&bank, TEST_ADDR2); // Abort
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    // Additional edge case: Claim with exact max
    #[test]
    fun test_claim_exact_max() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Deposit
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(MAX_CLAIM, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            ts::return_shared(bank);
        };

        // Claim exact max
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM, ctx);
            assert!(token_bank::get_bank_balance(&mut bank) == 0, 10000);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&coin) == MAX_CLAIM, 10001);
            ts::return_to_sender(&scenario, coin);
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    // Edge case: Deposit from different users
    #[test]
    fun test_deposit_different_users() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Addr1 deposit
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(1_000_000_000, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"addr1", ctx);
            ts::return_shared(bank);
        };

        // Addr2 deposit
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(2_000_000_000, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"addr2", ctx);
            assert!(token_bank::get_bank_balance(&mut bank) == 3_000_000_000, 11000);
            let (_, _, total1, _, _) = token_bank::get_user_data(&bank, TEST_ADDR1);
            assert!(*total1 == 1_000_000_000, 11001);
            let (_, _, total2, _, _) = token_bank::get_user_data(&bank, TEST_ADDR2);
            assert!(*total2 == 2_000_000_000, 11002);
            ts::return_shared(bank);
        };

        ts::end(scenario);
    }

    // Edge case: Claim after deposit by another user
    #[test]
    fun test_claim_after_other_deposit() {
        let mut scenario = ts::begin(TEST_ADDR1);
        init_contract(&mut scenario);

        // Addr1 deposit
        ts::next_tx(&mut scenario, TEST_ADDR1);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let payment = mint_sui(MAX_CLAIM, &mut scenario);
            let ctx = ts::ctx(&mut scenario);
            token_bank::deposit(&mut bank, payment, b"", ctx);
            ts::return_shared(bank);
        };

        // Addr2 claim
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let mut bank = ts::take_shared<TokenBank>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            let ctx = ts::ctx(&mut scenario);
            token_bank::claim(&mut bank, &clock, MAX_CLAIM / 2, ctx);
            clock::destroy_for_testing(clock);
            ts::return_shared(bank);
        };

        // Check that TEST_ADDR2 received the coins
        ts::next_tx(&mut scenario, TEST_ADDR2);
        {
            let coin = ts::take_from_address<Coin<SUI>>(&scenario, TEST_ADDR2);
            assert!(coin::value(&coin) == MAX_CLAIM / 2, 12000);
            ts::return_to_address(TEST_ADDR2, coin);
        };

        ts::end(scenario);
    }
}

