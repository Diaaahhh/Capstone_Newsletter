const scimagoService = require('./backend/services/scimagoService');

async function test() {
    console.log('Testing SCImago Service...');
    
    // Test Heliyon (Known Q1)
    const result = await scimagoService.getJournalRankingFromScimago('Heliyon', 2023);
    console.log('Result for Heliyon:', result);
    
    // Test known Not Found
    const result2 = await scimagoService.getJournalRankingFromScimago('ThisJournalDoesNotExist12345');
    console.log('Result for Fake Journal:', result2);
}

test();
