function calcRate(amount, term, score, history) {
    if (amount <= process.env.MAX_LOAN_AMOUNT && score >= process.env.MIN_CREDIT_SCORE) {
      return parseFloat(process.env.BASE_RATE) + Math.random() * ((1000 - score) / 100.0);
    }
}
  
exports.handler = async (event, context) => {
    const amount = event.Amount;
    const term = event.Term;
    const score = event.Credit.Score;
    const history = event.Credit.History;

    const bankId = process.env.BANK_ID;

    console.log('Loan Request over %d at credit score %d', amount, score);
    const rate = calcRate(amount, term, score, history);
    if (rate) {
        const response = { "rate": rate, "bankId": bankId};
        console.log(response);
        return response;
    }
};