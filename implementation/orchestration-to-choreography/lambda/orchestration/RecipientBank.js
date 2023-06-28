function calcRate(amount, term, score, history) {
    return parseFloat(process.env.base_rate) + Math.random() * ((1000 - score) / 100.0);
}
  
exports.handler = async (event, context) => {
    const amount = event.Amount;
    const term = event.Term;
    const score = event.Credit.Score;
    const history = event.Credit.History;

    const bankId = process.env.bank_id;

    console.log('Loan Request over %d at credit score %d', amount, score);
    const rate = calcRate(amount, term, score, history);
    const response = { "rate": rate, "bankId": bankId};
    console.log(response);
    return response;
};