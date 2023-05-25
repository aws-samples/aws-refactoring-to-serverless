function calcRate(amount, term, score, history) {
    if (amount <= process.env.max_loan_amount && score >= process.env.min_credit_score) {
      return parseFloat(process.env.base_rate) + Math.random() * ((1000 - score) / 100.0);
    }
  }
  
  exports.handler = async (event, context) => {
      console.log(event.Records[0].Sns);
      const message = event.Records[0].Sns.Message;
      const bankId = process.env.bank_id;
      const data = JSON.parse(message);
      
      console.log('Loan Request over %d at credit score %d', data.Amount, data.Credit.Score);
      const rate = calcRate(data.Amount, data.Term, data.Credit.Score, data.Credit.History);
  
      if (rate) {
          const quote = { "rate": rate, "bankId": bankId};
          console.log('Offering Loan', quote);
          return quote;
      } else {
          console.log('Rejecting Loan');
      }
  };